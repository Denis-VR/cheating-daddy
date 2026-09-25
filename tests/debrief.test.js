const test = require('node:test');
const assert = require('node:assert/strict');
const storage = require('../src/storage');
const { buildDebriefMessages, generateDebrief } = require('../src/utils/debrief');

const session = {
    conversationHistory: [
        { timestamp: 2, transcription: 'Как работает индекс в Postgres?', ai_response: 'B-tree...' },
        { timestamp: 1, transcription: 'Расскажите о себе', ai_response: 'Я разработчик' },
    ],
    screenAnalysisHistory: [{ timestamp: 3, prompt: 'Реши задачу', response: '```go\nfunc main() {}\n```' }],
};

function withStorage(overrides, fn) {
    const original = {};
    for (const [name, value] of Object.entries(overrides)) {
        original[name] = storage[name];
        storage[name] = value;
    }
    return Promise.resolve()
        .then(fn)
        .finally(() => Object.assign(storage, original));
}

test('debrief prompt lists turns chronologically, clips long answers and asks for the four sections', () => {
    const long = { conversationHistory: [{ timestamp: 1, transcription: 'Q', ai_response: 'x'.repeat(5000) }] };
    const [system, user] = buildDebriefMessages(long);
    assert.match(system.content, /## Вопросы интервьюера[\s\S]*## Где были трудности[\s\S]*## Что подтянуть[\s\S]*## Вопросы на повтор/);
    assert.ok(user.content.length < 2500);

    const content = buildDebriefMessages(session, { name: 'Go developer', vacancy: 'Backend' })[1].content;
    assert.ok(content.indexOf('Расскажите о себе') < content.indexOf('индекс') && content.indexOf('индекс') < content.indexOf('Реши задачу'));
    assert.match(content, /Target role: Go developer/);
    assert.throws(() => buildDebriefMessages({ conversationHistory: [] }), /нет вопросов/);
});

test('debrief calls the configured provider once, stores the result and reuses it', async () => {
    const saved = {};
    let calls = 0;
    const fetchImpl = async (url, init) => {
        calls++;
        assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
        assert.equal(init.headers.Authorization, 'Bearer key');
        assert.equal(JSON.parse(init.body).model, 'openai/test');
        return { ok: true, json: async () => ({ choices: [{ message: { content: '## Вопросы интервьюера\n1. Индексы' } }] }) };
    };
    await withStorage(
        {
            getSession: () => ({ ...session, ...saved }),
            saveSession: (_id, data) => Object.assign(saved, data),
            getPreferences: () => ({ providerMode: 'openrouter' }),
            getCredentials: () => ({ openrouterKey: 'key' }),
            getConfig: () => ({ openrouterModel: 'openai/test' }),
        },
        async () => {
            const first = await generateDebrief('123', { fetchImpl });
            assert.match(first.text, /Индексы/);
            assert.equal(saved.debrief.text, first.text);
            await generateDebrief('123', { fetchImpl });
            assert.equal(calls, 1);
            await generateDebrief('123', { fetchImpl, force: true });
            assert.equal(calls, 2);
        }
    );
});

test('debrief explains unsupported providers and invalid ids', async () => {
    await withStorage({ getSession: () => session, getPreferences: () => ({ providerMode: 'local' }) }, async () => {
        await assert.rejects(generateDebrief('123'), /OpenAI или OpenRouter/);
        await assert.rejects(generateDebrief('../x'), /Некорректная сессия/);
    });
});
