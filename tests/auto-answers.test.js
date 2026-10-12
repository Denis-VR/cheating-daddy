const test = require('node:test');
const assert = require('node:assert/strict');
const { AutoAnswerQueue, isAnswerCandidate } = require('../src/utils/interview-workflow');
const { HostedSession } = require('../src/utils/hosted-ai');
const fs = require('node:fs');
const vm = require('node:vm');

function harness(send = async () => {}) {
    const timers = new Map();
    let id = 0;
    const queue = new AutoAnswerQueue(send, {
        schedule: fn => {
            timers.set(++id, fn);
            return id;
        },
        cancel: key => timers.delete(key),
    });
    return {
        queue,
        timers,
        fire: async () => {
            const [key, fn] = timers.entries().next().value;
            timers.delete(key);
            await fn();
        },
    };
}
const question = (revision = 1) => ({ id: 'q', revision, channel: 'system', text: 'Как работают индексы?' });

test('automatic mode ignores old drafts, mic, acknowledgements and statements', async () => {
    const sent = [];
    const h = harness(async q => sent.push(q));
    h.queue.update([question()]);
    assert.equal(h.timers.size, 0);
    h.queue.setEnabled(true);
    assert.equal(h.timers.size, 0);
    h.queue.update([question(), { ...question(), id: 'mic', channel: 'mic' }, { ...question(), id: 'statement', text: 'У нас есть база данных.' }]);
    assert.equal(h.timers.size, 0);
    h.queue.update([question(2)]);
    await h.fire();
    assert.equal(sent.length, 1);
    assert.equal(sent[0].revision, 2);
    assert.equal(h.timers.size, 0);
});

test('new segments debounce, switching off, pause and close cancel pending automatic answers', async () => {
    const sent = [];
    const h = harness(async q => sent.push(q));
    h.queue.setEnabled(true);
    h.queue.update([question()]);
    h.queue.update([{ ...question(2), text: 'Как работают индексы? И когда они не помогают?' }]);
    assert.equal(h.timers.size, 1);
    h.queue.paused = true;
    h.queue.update(h.queue.items);
    assert.equal(h.timers.size, 0);
    h.queue.paused = false;
    h.queue.update(h.queue.items);
    await h.fire();
    assert.equal(sent[0].revision, 2);
    h.queue.update([{ ...question(), id: 'next' }]);
    h.queue.setEnabled(false);
    assert.equal(h.timers.size, 0);
    h.queue.setEnabled(true);
    assert.equal(h.timers.size, 0);
    h.queue.update([{ ...question(), id: 'last' }]);
    h.queue.close();
    assert.equal(h.timers.size, 0);
});

test('manual work blocks automation; failed requests disable it instead of retrying repeatedly', async () => {
    const h = harness(async () => {
        throw Error('offline');
    });
    h.queue.setEnabled(true);
    h.queue.blocked = true;
    h.queue.update([question()]);
    assert.equal(h.timers.size, 0);
    h.queue.blocked = false;
    h.queue.update(h.queue.items);
    await h.fire();
    assert.equal(h.queue.enabled, false);
    assert.equal(h.timers.size, 0);
});

test('explicit Russian and English requests qualify without treating every sentence as a question', () => {
    for (const text of [
        'Расскажи про Go',
        'Объясните транзакции',
        'А как устроен канал',
        'Can you explain indexes',
        'Что такое GC',
        'А это безопасно?',
    ])
        assert.equal(isAnswerCandidate(text), true, text);
    for (const text of ['угу', 'Спасибо', 'Мы используем Kafka', 'Это наш проект']) assert.equal(isAnswerCandidate(text), false, text);
});

test('microphone transcription is visible but never becomes an interviewer draft', async () => {
    const events = [];
    const session = new HostedSession({
        provider: 'openai',
        key: 'test',
        model: 'test',
        reviewAudio: true,
        emit: (...event) => events.push(event),
        save() {},
        fetchImpl: async () => ({ ok: true, json: async () => ({ text: 'Как работает Kafka?' }) }),
    });
    await session.enqueue({ pcm: Buffer.alloc(48000), channel: 'mic' });
    assert.equal(session.questions.items.length, 0);
    assert.equal(events.find(([name]) => name === 'transcript-line')[1].channel, 'mic');
    await session.enqueue({ pcm: Buffer.alloc(48000), channel: 'system' });
    assert.equal(session.questions.items.length, 1);
    session.close();
});

test('actual tools skip edited drafts after selection changes and disable auto mode on failed answers', async () => {
    const ipc = { on() {}, removeListener() {} };
    const source = fs
        .readFileSync('src/components/views/InterviewTools.js', 'utf8')
        // Exercise Windows checkout line endings on every platform.
        .replace(/\r?\n/g, '\r\n')
        .replace(/^import .*;\r?\n/gm, '')
        .replace('export class InterviewTools', 'class InterviewTools');
    const context = {
        LitElement: class {
            connectedCallback() {}
            addEventListener() {}
            dispatchEvent() {}
        },
        CustomEvent: class {},
        html() {},
        css() {},
        customElements: { define() {} },
        window: { require: name => (name === 'electron' ? { ipcRenderer: ipc } : { AutoAnswerQueue }) },
    };
    vm.createContext(context);
    vm.runInContext(source + '\nglobalThis.Tools = InterviewTools;', context);
    const tools = new context.Tools();
    tools.load = () => {};
    tools.connectedCallback();
    tools.toggleAutoAnswers();
    const q = question();
    tools.inbox = [q];
    tools.manualDraftIds.add(q.id);
    tools.questionId = 'another';
    let calls = 0;
    tools.ask = async () => {
        calls++;
        throw Error('offline');
    };
    await tools.autoQueue.send(q);
    assert.equal(calls, 0);
    tools.manualDraftIds.clear();
    await assert.rejects(tools.autoQueue.send(q), /offline/);
    assert.equal(calls, 1);
    assert.equal(tools.autoAnswers, false);
    assert.match(tools.status, /выключены/);
    tools.autoQueue.close();
});

test('timer callbacks retain standalone receiver semantics in automatic mode', () => {
    let scheduled = false;
    const queue = new AutoAnswerQueue(async () => {}, {
        schedule: function () {
            'use strict';
            assert.equal(this, undefined);
            scheduled = true;
            return 1;
        },
        cancel: function () {
            'use strict';
            assert.equal(this, undefined);
        },
    });
    queue.setEnabled(true);
    queue.update([question()]);
    assert.equal(scheduled, true);
    queue.close();
});

test('hosted fetch does not bind browser fetch to a session instance', async () => {
    let called = false;
    const session = new HostedSession({
        provider: 'openrouter',
        key: 'test',
        model: 'openai/gpt-5.4-mini',
        emit() {},
        fetchImpl: function () {
            'use strict';
            assert.equal(this, undefined);
            called = true;
            return Promise.resolve({ ok: true });
        },
    });
    await session.fetch('https://example.test');
    assert.equal(called, true);
    session.close();
});
