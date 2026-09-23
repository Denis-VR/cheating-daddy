const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { HostedSession, PROVIDERS } = require('../src/utils/hosted-ai');

test('main IPC accepts text and screen requests on pause and propagates their request IDs', async () => {
    const handlers = new Map(),
        events = [],
        bodies = [];
    class TestSession extends HostedSession {
        constructor(options) {
            super({
                ...options,
                fetchImpl: async (_url, init) => {
                    bodies.push(JSON.parse(init.body));
                    return {
                        ok: true,
                        body: new ReadableStream({
                            start(c) {
                                c.enqueue(Buffer.from('data: {"choices":[{"delta":{"content":"answer"}}]}\n\ndata: [DONE]\n\n'));
                                c.close();
                            },
                        }),
                    };
                },
            });
        }
    }
    const context = {
        module: { exports: {} },
        global: {},
        Buffer,
        console: { log() {}, error() {} },
        process: { stdout: { write() {} } },
        require: name => {
            if (name === 'async_hooks') return require(name);
            if (name === './session-support') return { installSessionSupport() {} };
            if (name === './interview-storage') return { loadWorkspace: () => ({ packages: [] }) };
            if (name === './interview-workflow') return require('../src/utils/interview-workflow');
            if (name === './hosted-ai') return { HostedSession: TestSession, PROVIDERS };
            if (name === 'electron')
                return {
                    ipcMain: { handle: (name, fn) => handlers.set(name, fn) },
                    BrowserWindow: { getAllWindows: () => [{ webContents: { send: (...args) => events.push(args) } }] },
                };
            if (name === '../storage') return { saveSession() {}, getConfig: () => ({}), getCredentials: () => ({ openrouterKey: 'test' }) };
            if (name === './prompts') return { getSystemPrompt: () => 'Helpful assistant', getHostedSystemPrompt: () => 'Helpful assistant' };
            if (name === './transportLogger') return { startTransportLog() {}, closeTransportLog() {} };
            return {};
        },
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync('src/utils/gemini.js', 'utf8'), context);
    context.module.exports.setupGeminiIpcHandlers({ current: null });
    const call = (name, payload) => handlers.get(name)(null, payload);
    assert.equal(
        (await call('initialize-hosted', { provider: 'openrouter', profile: 'meeting', customPrompt: '', language: 'ru-RU' })).success,
        true
    );
    await call('set-session-paused', true);
    assert.equal((await call('send-text-message', { text: 'Followup', requestId: 'text-1', context: 'Previous answer' })).success, true);
    assert.equal((await call('send-image-content', { data: 'a'.repeat(2000), prompt: 'Read the screen', requestId: 'image-1' })).success, true);
    await call('send-audio-content', { data: 'AAAA', mimeType: 'audio/pcm;rate=24000' });
    assert.equal(bodies.length, 3);
    assert.match(bodies[0].messages.at(-1).content, /Previous answer[\s\S]*Followup/);
    assert.deepEqual(
        events.filter(e => e[0] === 'new-response').map(e => e[1].id),
        ['text-1', 'image-1']
    );
    assert.equal((await call('send-text-message', { text: 'x', requestId: 'bad\nID' })).success, false);
});

test('manual capture works while paused and awaits the image request', async () => {
    const source = fs.readFileSync('src/utils/renderer.js', 'utf8');
    const capture = source.slice(source.indexOf('const MANUAL_SCREENSHOT_PROMPT'), source.indexOf('// Expose functions'));
    const sent = [],
        errors = [];
    const owner = {
        _isPaused: true,
        beginManualRequest: () => ({ requestId: 'screen-1', context: 'Selected answer' }),
        updateCurrentResponse: r => errors.push(r),
    };
    const context = {
        window: {},
        cheatingDaddy: { element: () => owner },
        mediaStream: {},
        currentImageQuality: 'high',
        hiddenVideo: { readyState: 4, videoWidth: 2560, videoHeight: 1440 },
        offscreenContext: { drawImage() {} },
        offscreenCanvas: { toBlob: done => done({}) },
        FileReader: class {
            readAsDataURL() {
                this.result = 'data:image/jpeg;base64,aGVsbG8=';
                this.onload();
            }
        },
        ipcRenderer: {
            invoke: async (channel, payload) => {
                sent.push({ channel, payload });
                return { success: true };
            },
        },
    };
    vm.createContext(context);
    vm.runInContext(capture, context);
    assert.equal((await context.captureManualScreenshot()).success, true);
    assert.equal(sent[0].payload.requestId, 'screen-1');
    assert.equal(sent[0].payload.context, 'Selected answer');
    assert.match(sent[0].payload.prompt, /extract the visible text/);
    assert.equal(context.offscreenCanvas.width, 1920);
    assert.equal(errors.length, 0);
    context.mediaStream = null;
    assert.equal((await context.captureManualScreenshot()).success, false);
    assert.equal(errors[0].id, 'screen-1');
});

test('screen draft uses native snapshot, reports timeouts and discards results after session ends', async () => {
    const source = fs.readFileSync('src/utils/renderer.js', 'utf8');
    const code = source.slice(source.indexOf('async function captureScreenDraft()'), source.indexOf('window.captureScreenDraft'));
    const owner = { sessionActive: true, _sessionGeneration: 1 };
    const context = {
        cheatingDaddy: { element: () => owner },
        setTimeout: fn => setTimeout(fn, 10),
        clearTimeout,
        atob,
        ipcRenderer: { invoke: async () => ({ success: true, data: Buffer.from('jpeg').toString('base64') }) },
        File: class {
            constructor(_, name) {
                this.name = name;
            }
        },
    };
    vm.createContext(context);
    vm.runInContext(code, context);
    assert.equal((await context.captureScreenDraft()).name, 'Экран.jpg');
    context.ipcRenderer.invoke = () => new Promise(() => {});
    await assert.rejects(context.captureScreenDraft(), /Не удалось получить снимок/);
    context.ipcRenderer.invoke = async () => ({ success: false, error: 'Permission denied' });
    await assert.rejects(context.captureScreenDraft(), /Permission denied/);
    context.ipcRenderer.invoke = async () => {
        owner.sessionActive = false;
        return { success: true, data: 'AA==' };
    };
    await assert.rejects(context.captureScreenDraft(), /Сессия завершена/);
});
