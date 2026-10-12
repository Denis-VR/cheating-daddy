const test = require('node:test');
const assert = require('node:assert/strict');
const { HostedSession, SpeechSegmenter } = require('../src/utils/hosted-ai');
const { QuestionInbox, AutoAnswerQueue, isAnswerCandidate } = require('../src/utils/interview-workflow');
const { TranscriptJournal } = require('../src/utils/transcript-journal');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const tick = () => new Promise(resolve => setImmediate(resolve));
const complete = text => ({
    ok: true,
    body: new ReadableStream({
        start(c) {
            c.enqueue(Buffer.from('data: ' + JSON.stringify({ choices: [{ delta: { content: text } }] }) + '\n\ndata: [DONE]\n\n'));
            c.close();
        },
    }),
});
const session = (fetchImpl, extras = {}) =>
    new HostedSession({ provider: 'openai', key: 'test', model: 'test', reviewAudio: true, emit() {}, save() {}, fetchImpl, ...extras });
const pcm = () => ({ pcm: Buffer.alloc(48000), channel: 'system' });

test('transcription and answer streaming progress independently; cancelling the answer does not cancel speech', async () => {
    let answerStarted, finishAnswer;
    const started = new Promise(r => (answerStarted = r));
    let answerSignal, speechSignal;
    const s = session(async (url, { signal }) => {
        if (url.endsWith('transcriptions')) {
            speechSignal = signal;
            return { ok: true, json: async () => ({ text: 'Следующий вопрос?' }) };
        }
        answerSignal = signal;
        answerStarted();
        return new Promise((resolve, reject) => {
            finishAnswer = () => resolve(complete('done'));
            signal.addEventListener('abort', () => reject(new DOMException('cancelled', 'AbortError')));
        });
    });
    try {
        const answer = s.enqueue({ text: 'Первый вопрос', requestId: 'one' });
        await started;
        await s.enqueue(pcm());
        assert.equal(s.questions.items.length, 1);
        assert.equal(s.running, true);
        assert.notEqual(answerSignal, speechSignal);
        s.controller.abort();
        assert.equal((await answer).success, false);
        assert.equal(speechSignal.aborted, false);
        assert.equal((await s.enqueue(pcm())).success, true);
    } finally {
        finishAnswer?.();
        s.close();
    }
});

test('pause and immediate resume cannot publish an old in-flight transcript even when the provider ignores abort', async () => {
    let release;
    const events = [],
        saved = [];
    const s = session(async () => new Promise(r => (release = () => r({ ok: true, json: async () => ({ text: 'Old question?' }) }))), {
        emit: (...e) => events.push(e),
        saveTranscript: line => saved.push(line),
    });
    s.recordTranscript = true;
    const job = s.enqueue(pcm());
    s.setPaused(true);
    s.setPaused(false);
    release();
    assert.equal((await job).success, false);
    assert.equal(s.questions.items.length, 0);
    assert.equal(saved.length, 0);
    assert.equal(events.filter(([name]) => name === 'transcript-line').length, 0);
    s.close();
});

test('closing rejects queued audio and suppresses late transcriptions; audio errors never create answer cards', async () => {
    let release;
    const events = [];
    const s = session(async () => new Promise(r => (release = () => r({ ok: true, json: async () => ({ text: 'Late?' }) }))), {
        emit: (...e) => events.push(e),
    });
    const first = s.enqueue(pcm()),
        second = s.enqueue(pcm());
    s.close();
    release();
    assert.ok((await Promise.all([first, second])).every(r => !r.success));
    assert.equal(events.filter(([name]) => name === 'transcript-line').length, 0);
    const failed = session(
        async () => {
            throw Error('offline');
        },
        { emit: (...e) => events.push(e) }
    );
    assert.equal((await failed.enqueue(pcm())).success, false);
    assert.ok(events.some(([name]) => name === 'audio-error'));
    assert.equal(events.filter(([name]) => name === 'new-response').length, 0);
    failed.close();
});

test('bounded speech backlog reports lost input explicitly and pause clears it', async () => {
    let release;
    const events = [];
    const s = session(async () => new Promise(r => (release = () => r({ ok: true, json: async () => ({ text: 'question?' }) }))), {
        emit: (...e) => events.push(e),
    });
    const jobs = Array.from({ length: 33 }, () => s.enqueue(pcm()));
    assert.equal((await s.enqueue(pcm())).error, 'Audio queue full');
    assert.ok(events.some(([name, message]) => name === 'audio-error' && message.includes('пропущена')));
    s.setPaused(true);
    release();
    assert.ok((await Promise.all(jobs)).every(r => !r.success));
    s.close();
});

test('question boundaries use capture time and question starts, not transcription completion times', () => {
    const q = new QuestionInbox(() => {}, { now: () => 100000 });
    q.add('Расскажите о прошлом проекте.', 'system', { startAt: 1000, endAt: 3000 });
    q.add('Какие ваши зарплатные ожидания?', 'system', { startAt: 4000, endAt: 5000 });
    assert.equal(q.items.length, 2);
    q.add('и какие условия важны?', 'system', { startAt: 6000, endAt: 7000 });
    assert.equal(q.items.length, 2);
    q.add('ещё одна реплика без вопроса', 'system', { startAt: 30000, endAt: 31000 });
    assert.equal(q.items.length, 3);
});

test('explicit draft merging/splitting is reversible and rejects stale revisions', () => {
    const q = new QuestionInbox(() => {});
    q.add('Как работает индекс?');
    q.add('Когда индекс не помогает?');
    const [a, b] = q.items.map(item => ({ ...item }));
    q.merge(a.id, a.revision, b.id, b.revision);
    assert.equal(q.items.length, 1);
    assert.throws(() => q.split(a.id, a.revision, 1), /изменился/);
    q.split(a.id, q.items[0].revision, 1);
    assert.deepEqual(
        q.items.map(item => item.text),
        [a.text, b.text]
    );
    assert.throws(() => q.merge(a.id, a.revision, b.id, b.revision), /изменились/);
});

test('ordinary interview questions work without ASR punctuation, acknowledgements stay quiet', () => {
    for (const text of [
        'В чем разница между процессом и потоком',
        'В чём разница',
        'Есть ли у вас опыт с Kubernetes',
        'Приходилось ли оптимизировать запросы',
        'Сравните TCP и UDP',
        'Напишите функцию поиска',
        'Have you used Kafka',
        'Compare TCP and UDP',
    ])
        assert.equal(isAnswerCandidate(text), true, text);
    for (const text of ['угу', 'понятно', 'Спасибо', 'Мы используем Kafka']) assert.equal(isAnswerCandidate(text), false, text);
});

test('unrelated inbox changes do not postpone an answer; active speech suppresses the timer', async () => {
    let fn,
        count = 0,
        delay;
    const sent = [];
    const q = new AutoAnswerQueue(async item => sent.push(item), {
        schedule: (callback, ms) => {
            fn = callback;
            count++;
            delay = ms;
            return count;
        },
        cancel() {},
    });
    q.setEnabled(true);
    const item = { id: 'one', revision: 1, text: 'Напишите функцию поиска', channel: 'system' };
    q.update([item]);
    assert.equal(delay, 1400);
    q.update([item, { id: 'two', revision: 1, text: 'thanks' }]);
    assert.equal(count, 1);
    q.waitingForSpeech = true;
    q.update(q.items);
    await fn();
    assert.equal(sent.length, 0);
    q.waitingForSpeech = false;
    q.update(q.items);
    await fn();
    assert.equal(sent.length, 1);
    q.close();
});

test('unfinished clause waits longer; manual pause and speech pause both keep automatic sending off', () => {
    let delay;
    const q = new AutoAnswerQueue(async () => {}, {
        schedule: (_, ms) => {
            delay = ms;
            return 1;
        },
        cancel() {},
    });
    q.setEnabled(true);
    q.update([{ id: 'one', revision: 1, text: 'Расскажите про индексы и' }]);
    assert.equal(delay, 4000);
    q.paused = true;
    q.update(q.items);
    assert.equal(q.timer, null);
    q.close();
});

test('transcript opt-in preserves complete microphone and system text, failure disables recording visibly', async () => {
    const saved = [],
        events = [],
        longText = 'Распознанный текст '.repeat(60);
    const s = session(async () => ({ ok: true, json: async () => ({ text: longText }) }), {
        saveTranscript: line => saved.push(line),
        emit: (...e) => events.push(e),
    });
    await s.enqueue(pcm());
    assert.equal(saved.length, 0);
    s.recordTranscript = true;
    await s.enqueue({ ...pcm(), channel: 'mic', startAt: 100, endAt: 200 });
    assert.equal(saved[0].text, longText.trim());
    assert.equal(saved[0].startAt, 100);
    assert.equal(saved[0].channel, 'mic');
    assert.equal(s.questions.items.length, 1);
    s.saveTranscript = () => {
        throw Error('disk full');
    };
    await s.enqueue(pcm());
    assert.equal(s.recordTranscript, false);
    assert.ok(events.some(([name, value]) => name === 'transcript-recording' && !value.enabled));
    s.close();
});

test('journal survives reopening, preserves segments beyond the live display, validates IDs and deletes with explicit remove', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'interview-journal-'));
    try {
        const journal = new TranscriptJournal(dir);
        const line = { id: 'one', channel: 'system', text: 'x'.repeat(1200), startAt: 1, endAt: 2 };
        for (let i = 0; i < 20; i++) journal.append('session', { ...line, id: String(i) });
        const loaded = new TranscriptJournal(dir).read('session');
        assert.equal(loaded.length, 20);
        assert.equal(loaded[0].text.length, 1200);
        assert.throws(() => journal.append('../outside', line), /session ID/);
        assert.throws(() => journal.append('session', { ...line, channel: 'unknown' }), /segment/);
        journal.remove('session');
        assert.deepEqual(journal.read('session'), []);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

test('enabling transcript recording does not retroactively persist pending speech captured before consent', async () => {
    let release;
    const saved = [];
    const s = session(async () => new Promise(r => (release = () => r({ ok: true, json: async () => ({ text: 'Earlier speech' }) }))), {
        saveTranscript: line => saved.push(line),
    });
    const job = s.enqueue(pcm());
    s.recordTranscript = true;
    release();
    await job;
    assert.equal(saved.length, 0);
    s.close();
});

test('session storage loads the journal and removes it with individual and bulk history deletion', () => {
    const vm = require('node:vm');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'interview-history-'));
    try {
        const context = {
            module: { exports: {} },
            console,
            process,
            require(name) {
                if (name === 'os') return { platform: () => 'linux', homedir: () => dir };
                if (name === './utils/transcript-journal') return { TranscriptJournal };
                return require(name);
            },
        };
        vm.runInNewContext(fs.readFileSync('src/storage.js', 'utf8'), context);
        const storage = context.module.exports;
        const line = { text: 'Полный вопрос', id: 'one', channel: 'system', startAt: 1, endAt: 2 };
        storage.saveSession('123', {});
        storage.appendTranscript('123', line);
        assert.equal(storage.getSession('123').transcript[0].text, line.text);
        assert.equal(storage.getAllSessions().length, 1);
        assert.equal(storage.deleteSession('123'), true);
        const journal = new TranscriptJournal(path.join(storage.getConfigDir(), 'history'));
        assert.equal(journal.read('123').length, 0);
        storage.saveSession('456', {});
        storage.appendTranscript('456', line);
        assert.equal(storage.deleteAllSessions(), true);
        assert.equal(journal.read('456').length, 0);
        assert.throws(() => storage.appendTranscript('missing', line), /не найдена/);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});
