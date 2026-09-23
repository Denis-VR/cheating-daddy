const test = require('node:test');
const assert = require('node:assert/strict');
const { QuestionInbox, isFollowup, relevantMaterials, validateRequest } = require('../src/utils/interview-workflow');
const { HostedSession } = require('../src/utils/hosted-ai');
const stream = text => ({
    ok: true,
    body: new ReadableStream({
        start(c) {
            c.enqueue(Buffer.from('data: ' + JSON.stringify({ choices: [{ delta: { content: text } }] }) + '\n\ndata: [DONE]\n\n'));
            c.close();
        },
    }),
});
test('question drafts merge pauses, ignore acknowledgements, reject stale approvals, separate new topics', () => {
    let now = 0;
    const inbox = new QuestionInbox(() => {}, { now: () => now });
    inbox.add('угу');
    assert.equal(inbox.items.length, 0);
    inbox.add('Расскажи про индексы');
    const id = inbox.items[0].id;
    now = 2000;
    inbox.add('и почему PostgreSQL иногда их не использует?');
    assert.equal(inbox.items.length, 1);
    assert.match(inbox.items[0].text, /индексы.*PostgreSQL/);
    assert.throws(() => inbox.take(id, 1), /изменился/);
    now = 3000;
    inbox.add('Как устроена Kafka?');
    assert.equal(inbox.items.length, 2);
    inbox.take(id, 2);
    assert.equal(inbox.items.length, 1);
    now = 10000;
    inbox.add('Что такое consumer?');
    assert.equal(inbox.items.length, 2);
});
test('followups remain on topic but a named new topic does not attach to the old one', () => {
    assert.equal(isFollowup('А если канал закрыт?', 'Как работают каналы?'), true);
    assert.equal(isFollowup('А как работает Kafka?', 'Как работают каналы?'), false);
});
test('audio in review mode transcribes into draft without generating an answer; manual requests still work on pause', async () => {
    const events = [],
        calls = [];
    const s = new HostedSession({
        provider: 'openrouter',
        key: 'test',
        model: 'openai/test',
        systemPrompt: 'profile',
        reviewAudio: true,
        emit: (...e) => events.push(e),
        save() {},
        fetchImpl: async (url, init) => {
            calls.push(url);
            return url.includes('transcriptions')
                ? { ok: true, json: async () => ({ text: 'Расскажи про индексы' }) }
                : stream('## Сказать сейчас\nИндекс ускоряет поиск');
        },
    });
    await s.enqueue({ pcm: Buffer.alloc(48000), channel: 'system' });
    assert.equal(calls.length, 1);
    assert.equal(s.questions.items.length, 1);
    assert.equal(events.filter(e => e[0] === 'new-response').length, 0);
    s.setPaused(true);
    assert.equal((await s.enqueue({ text: 'Объясни', requestId: 'manual' })).success, true);
    s.close();
});
test('vision sends all images without OCR and OCR review returns editable text without creating answers', async () => {
    const bodies = [],
        events = [];
    const s = new HostedSession({
        provider: 'openrouter',
        key: 'test',
        model: 'openai/test',
        systemPrompt: 'profile',
        emit: (...e) => events.push(e),
        save() {},
        fetchImpl: async (url, init) => {
            bodies.push(JSON.parse(init.body));
            return stream('recognized');
        },
    });
    const ocr = await s.enqueue({ ocrOnly: true, images: ['YWJj', 'ZGVm'] });
    assert.equal(ocr.success, true);
    assert.equal(bodies.length, 2);
    assert.equal(events.filter(e => e[0] === 'new-response').length, 0);
    await s.enqueue({ text: 'Read diagram', images: ['YWJj', 'ZGVm'], imageMode: 'vision', requestId: 'vision' });
    assert.equal(bodies.length, 3);
    assert.equal(bodies[2].messages.at(-1).content.length, 3);
    s.close();
});
test('preparation retrieval finds matching passages and keeps explicit missing-fact policy', async () => {
    const prep = {
        name: 'Go developer',
        vacancy: 'Backend',
        experience: 'Implemented queues',
        materials: [{ name: 'resume', text: 'PostgreSQL indexes optimized. Kafka consumers.' }],
    };
    assert.match(relevantMaterials(prep, 'Kafka'), /Kafka consumers/);
    let sent;
    const s = new HostedSession({
        provider: 'openrouter',
        key: 'test',
        model: 'openai/test',
        systemPrompt: 'profile',
        preparation: prep,
        emit() {},
        save() {},
        fetchImpl: async (_, init) => {
            sent = JSON.parse(init.body);
            return stream('answer');
        },
    });
    await s.enqueue({ text: 'Kafka', mode: 'technical' });
    assert.match(sent.messages[0].content, /Never invent/);
    assert.match(sent.messages[0].content, /Крайние случаи/);
    assert.match(sent.messages[0].content, /Kafka consumers/);
    s.close();
});
test('IPC request size and mode validation rejects malformed payloads', () => {
    assert.throws(() => validateRequest({ text: 'x', requestId: 'id', images: Array(5).fill('YWJj') }));
    assert.throws(() => validateRequest({ text: 'x', requestId: 'id', mode: 'shell' }));
    assert.throws(() => validateRequest({ text: 'x', requestId: '../id' }));
    assert.equal(validateRequest({ text: 'x', requestId: 'id', mode: 'design' }).mode, 'design');
});
