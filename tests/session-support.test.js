const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const storage = require('../src/storage');
const support = require('../src/utils/session-support');
function snapshot() {
    return {
        version: 1,
        sessionId: '123',
        savedAt: 1,
        provider: 'openrouter',
        profile: 'interview',
        language: 'ru-RU',
        responses: ['answer'],
        topicMeta: [{ title: 'Go' }],
        index: 0,
        base: [[0, 'answer']],
        ids: [],
        inline: [],
        draft: 'next question',
        scroll: 240,
        toolState: { files: [] },
    };
}
test('recovery survives a new read with draft, topics and reading position; invalid writes preserve it', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cd-recovery-'));
    const original = storage.getConfigDir;
    storage.getConfigDir = () => dir;
    try {
        assert.equal(support.readRecovery(), null);
        support.saveRecovery(snapshot());
        assert.deepEqual(support.readRecovery(), snapshot());
        assert.throws(() => support.saveRecovery({ ...snapshot(), index: 50 }));
        assert.equal(support.readRecovery().scroll, 240);
        support.saveRecovery(null);
        assert.equal(support.readRecovery(), null);
    } finally {
        storage.getConfigDir = original;
        fs.rmSync(dir, { recursive: true, force: true });
    }
});
test('session review cites questions and flags code without inventing candidate performance', () => {
    const report = support.reviewSession({
        conversationHistory: [
            { transcription: 'Объясни каналы Go', ai_response: '```go\nclose(ch)\n```' },
            { transcription: 'Почему канал закрыт?', ai_response: 'value, ok := <-ch' },
        ],
    });
    assert.equal(report.count, 2);
    assert.ok(report.difficult.length);
    assert.ok(report.verify.some(v => v.reason.includes('тесты')));
    assert.ok(report.tomorrow.length);
    assert.match(report.note, /не оценивались/);
    assert.equal(support.reviewSession({}).tomorrow.length, 0);
});
test('preflight makes a real completion request shape and reports access errors instead of readiness', async () => {
    const config = storage.getConfig,
        credentials = storage.getCredentials;
    storage.getConfig = () => ({ openrouterModel: 'openai/test' });
    storage.getCredentials = () => ({ openrouterKey: 'test-only' });
    try {
        let body;
        const report = await support.probeModel('openrouter', async (url, init) => {
            assert.match(url, /openrouter.ai/);
            body = JSON.parse(init.body);
            return { ok: true, json: async () => ({ choices: [{ message: { content: 'OK' } }] }) };
        });
        assert.equal(body.model, 'openai/test');
        assert.equal(report.model, 'openai/test');
        assert.ok(report.seconds >= 0);
        await assert.rejects(
            support.probeModel('openrouter', async () => ({ ok: false, status: 401 })),
            /401/
        );
    } finally {
        storage.getConfig = config;
        storage.getCredentials = credentials;
    }
});
