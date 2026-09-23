const test = require('node:test');
const assert = require('node:assert/strict');
const storage = require('../src/storage');
const { benchmarkModels } = require('../src/utils/model-benchmark');
const stream = text =>
    new ReadableStream({
        start(c) {
            c.enqueue(Buffer.from(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\ndata: [DONE]\n\n`));
            c.close();
        },
    });
function setup(t) {
    const workspace = require('../src/utils/interview-storage');
    const oldLoad = workspace.loadWorkspace;
    workspace.loadWorkspace = () => ({
        packages: [{ id: 'p', vacancy: 'Go developer', experience: 'Built services', materials: [] }],
        activePackageId: 'p',
    });
    t.after(() => (workspace.loadWorkspace = oldLoad));
    const original = { getConfig: storage.getConfig, getPreferences: storage.getPreferences, getCredentials: storage.getCredentials };
    storage.getConfig = () => ({
        openrouterModel: 'openai/answer',
        openrouterTranscriptionModel: 'openai/gpt-4o-mini-transcribe',
        openrouterOcrModel: 'google/ocr',
        openrouterVisionModel: 'openai/vision',
    });
    storage.getPreferences = () => ({
        selectedLanguage: 'ru-RU',
        selectedProfile: 'custom',
        aiProfiles: [{ id: 'custom', text: 'PROFILE INSTRUCTION' }],
        customPrompt: 'EXTRA INSTRUCTION',
    });
    storage.getCredentials = () => ({ openrouterKey: 'test' });
    t.after(() => Object.assign(storage, original));
}
test('benchmark uses chosen STT, answer, OCR and vision; failures are separate; transcript drives all requests', async t => {
    setup(t);
    const calls = [],
        rows = [];
    const result = await benchmarkModels(
        { provider: 'openrouter', text: '', audio: 'YWJj', format: 'webm', images: ['aW1hZ2U='] },
        {
            onResult: r => rows.push(r),
            fetchImpl: async (url, init) => {
                const body = JSON.parse(init.body);
                calls.push(body);
                if (url.endsWith('transcriptions')) return { ok: true, json: async () => ({ text: 'Вопрос голосом' }) };
                if (body.model === 'google/ocr') return { ok: false, status: 403, json: async () => ({ error: { message: 'Denied' } }) };
                return { ok: true, body: stream('ответ') };
            },
        }
    );
    assert.deepEqual(
        calls.map(c => c.model),
        ['openai/gpt-4o-mini-transcribe', 'openai/answer', 'google/ocr', 'openai/vision']
    );
    assert.equal(calls[0].input_audio.format, 'webm');
    assert.equal(calls[0].response_format, 'json');
    assert.equal(calls[1].messages.at(-1).content, 'Вопрос голосом');
    assert.equal(calls[3].messages.at(-1).content[1].image_url.url, 'data:image/jpeg;base64,aW1hZ2U=');
    assert.deepEqual(
        result.map(r => r.ok),
        [true, true, false, true]
    );
    assert.equal(rows.length, 4);
    assert.ok(result.every(r => r.seconds >= 0));
});
test('cancel stops later model requests; typed prompt skips STT', async t => {
    setup(t);
    const controller = new AbortController();
    let count = 0;
    await assert.rejects(
        benchmarkModels(
            { provider: 'openrouter', text: 'test', images: ['aW1hZ2U='] },
            {
                signal: controller.signal,
                fetchImpl: async () => {
                    count++;
                    return { ok: true, body: stream('answer') };
                },
                onResult: () => controller.abort(),
            }
        ),
        /отменена/
    );
    assert.equal(count, 1);
});
test('text-only benchmark skips image models and uses session instructions and preparation', async t => {
    setup(t);
    const calls = [];
    const result = await benchmarkModels(
        { provider: 'openrouter', text: 'Go developer' },
        {
            fetchImpl: async (_, init) => {
                calls.push(JSON.parse(init.body));
                return { ok: true, body: stream('answer') };
            },
        }
    );
    assert.equal(result.length, 1);
    assert.equal(calls.length, 1);
    const system = calls[0].messages[0].content;
    for (const text of ['PROFILE INSTRUCTION', 'EXTRA INSTRUCTION', 'ru-RU', 'Go developer', 'Объяснить']) assert.ok(system.includes(text), text);
});
test('benchmark rejects malformed inputs and oversized image arrays', async () => {
    await assert.rejects(benchmarkModels({ provider: 'other', text: 'test' }), /Введите/);
    await assert.rejects(benchmarkModels({ provider: 'openai', text: '', audio: 'x!', format: 'exe' }), /Некорректная/);
    await assert.rejects(benchmarkModels({ provider: 'openai', text: 'test', images: ['bad!'] }), /изображений/);
});

test('voice without images checks only transcription and answer', async t => {
    setup(t);
    const calls = [];
    const result = await benchmarkModels(
        { provider: 'openrouter', text: '', audio: 'YWJj', format: 'webm' },
        {
            fetchImpl: async (url, init) => {
                calls.push(JSON.parse(init.body).model);
                if (url.endsWith('transcriptions')) return { ok: true, json: async () => ({ text: 'Вопрос голосом' }) };
                return { ok: true, body: stream('ответ') };
            },
        }
    );
    assert.deepEqual(calls, ['openai/gpt-4o-mini-transcribe', 'openai/answer']);
    assert.deepEqual(
        result.map(row => row.role),
        ['STT', 'Ответ']
    );
});
