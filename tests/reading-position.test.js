const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function loadClass(file, name, extras = {}) {
    const source = fs
        .readFileSync(file, 'utf8')
        .replace(/^import .*;\n/gm, '')
        .replace(`export class ${name}`, `class ${name}`);
    const context = { crypto: require('node:crypto'), ...extras, LitElement: class {}, html() {}, css() {}, customElements: { define() {} } };
    vm.createContext(context);
    vm.runInContext(`${source}\nglobalThis.Result = ${name};`, context);
    return context.Result;
}
const App = loadClass('src/components/app/CheatingDaddyApp.js', 'CheatingDaddyApp');
function app() {
    return Object.assign(Object.create(App.prototype), {
        responses: [],
        currentResponseIndex: -1,
        _responseIds: new Map(),
        _inlineRequests: new Map(),
        _baseResponses: new Map(),
        _manualRequestRevision: 0,
        requestUpdate() {},
    });
}
test('incoming answers and late chunks never replace the selected earlier answer', () => {
    const a = app();
    a.addNewResponse({ id: 'a', text: 'first' });
    a.addNewResponse({ id: 'b', text: 'second' });
    a.updateCurrentResponse({ id: 'a', text: 'first completed' });
    a.updateCurrentResponse({ id: 'b', text: 'second completed' });
    assert.equal(a.currentResponseIndex, 0);
    assert.equal(a.responses[0], 'first completed');
    assert.equal(a.responses[1], 'second completed');
    a.currentResponseIndex = 1;
    a.addNewResponse({ id: 'c', text: 'third' });
    assert.equal(a.currentResponseIndex, 1);
    assert.equal(a.responses.length, 3);
});
test('pause preserves results of requests already in progress, resume cannot overwrite an older card', () => {
    const a = app();
    a.addNewResponse('older');
    a._isPaused = true;
    a.addNewResponse({ id: 'next', text: 'partial' });
    a._isPaused = false;
    a.updateCurrentResponse({ id: 'next', text: 'complete' });
    assert.equal(a.currentResponseIndex, 0);
    assert.equal(a.responses[0], 'older');
    assert.equal(a.responses[1], 'complete');
});
test('background streaming does not rewrite visible DOM or disturb selection and scroll', () => {
    const View = loadClass('src/components/views/AssistantView.js', 'AssistantView');
    let writes = 0;
    const container = {
        scrollTop: 250,
        querySelectorAll: () => [],
        set innerHTML(value) {
            writes++;
            this.scrollTop = 0;
        },
    };
    const view = Object.assign(Object.create(View.prototype), {
        responses: ['first', 'second'],
        currentResponseIndex: 0,
        shadowRoot: { querySelector: () => container },
        renderMarkdown: s => s,
    });
    view.updateResponseContent();
    container.scrollTop = 250;
    view.responses = ['first', 'second updated'];
    view.updateResponseContent();
    assert.equal(writes, 1);
    assert.equal(container.scrollTop, 250);
    view.responses = ['first completed', 'second updated'];
    view.updateResponseContent();
    assert.equal(container.scrollTop, 250);
    view.currentResponseIndex = 1;
    view.updateResponseContent();
    assert.equal(container.scrollTop, 0);
});

test('manual request on pause streams into its original card even after navigation and new audio', () => {
    const a = app();
    a.addNewResponse({ id: 'audio-1', text: 'Original answer' });
    a._isPaused = true;
    const request = a.beginManualRequest('Explain this in a table');
    assert.equal(a.responses.length, 1);
    a.addNewResponse({ id: 'audio-2', text: 'Another audio answer' });
    a.currentResponseIndex = 1;
    a.addNewResponse({ id: request.requestId, text: '| A | B |\n|---|---|\n| 1 | 2 |' });
    assert.equal(a.responses.length, 2);
    assert.equal(a.currentResponseIndex, 1);
    assert.match(a.responses[0], /Original answer[\s\S]*Explain this in a table[\s\S]*\| A \| B \|/);
    assert.equal(a.responses[1], 'Another audio answer');
    assert.equal(a._isPaused, true);
});
test('two manual requests and a late audio update keep separate content in one card', () => {
    const a = app();
    a.addNewResponse({ id: 'audio', text: 'Initial' });
    const one = a.beginManualRequest('First followup'),
        two = a.beginManualRequest('Second followup');
    a.updateCurrentResponse({ id: two.requestId, text: 'Second result' });
    a.updateCurrentResponse({ id: one.requestId, text: 'First result' });
    a.updateCurrentResponse({ id: 'audio', text: 'Completed audio' });
    assert.equal(a.responses.length, 1);
    assert.match(a.responses[0], /Completed audio[\s\S]*First result[\s\S]*Second result/);
});
test('manual request before any audio creates exactly one visible card', () => {
    const a = app();
    const request = a.beginManualRequest('Hello');
    a.addNewResponse({ id: request.requestId, text: 'Answer' });
    assert.equal(a.responses.length, 1);
    assert.equal(a.currentResponseIndex, 0);
    assert.match(a.responses[0], /Hello[\s\S]*Answer/);
});
test('actual bundled Markdown parser renders tables with header and body cells', () => {
    const marked = require('../src/assets/marked-4.3.0.min.js');
    const View = loadClass('src/components/views/AssistantView.js', 'AssistantView', {
        window: { marked, require: () => () => ({ sanitize: html => html }) },
    });
    const view = Object.assign(Object.create(View.prototype), { wrapWordsInSpans: html => html });
    const html = view.renderMarkdown('| Тип | Описание |\n| --- | --- |\n| Процесс | Своя память |\n| Поток | Общая память |');
    assert.match(html, /<table>/);
    assert.match(html, /<thead>/);
    assert.match(html, /<td>Процесс<\/td>/);
});

test('back clears session guards despite teardown errors and permits a new session', async () => {
    const View = loadClass('src/components/app/CheatingDaddyApp.js', 'CheatingDaddyApp', {
        cheatingDaddy: {
            stopCapture() {
                throw new Error('Track already stopped');
            },
        },
        window: {
            require: () => ({
                ipcRenderer: {
                    invoke: async () => {
                        throw new Error('IPC failure');
                    },
                },
            }),
        },
    });
    let starts = 0;
    const a = Object.assign(Object.create(View.prototype), {
        currentView: 'assistant',
        sessionActive: true,
        _starting: true,
        _sessionGeneration: 1,
        _stopTimer() {},
        setStatus() {},
        _startSession: async () => {
            starts++;
        },
    });
    await a.handleClose();
    assert.equal(a.currentView, 'main');
    assert.equal(a.sessionActive, false);
    assert.equal(a._starting, false);
    assert.equal(a._ending, false);
    await a.handleStart();
    assert.equal(starts, 1);
});
test('late completion of an old startup cannot release the guard of a new startup', async () => {
    let completeOld, completeNew;
    const a = app();
    Object.assign(a, {
        _sessionGeneration: 0,
        _starting: false,
        sessionActive: false,
        _startError: '',
        _startSession: () => new Promise(r => (completeOld = r)),
    });
    const old = a.handleStart();
    a._sessionGeneration++;
    a._starting = false;
    a._startSession = () => new Promise(r => (completeNew = r));
    const next = a.handleStart();
    completeOld();
    await old;
    assert.equal(a._starting, true);
    completeNew();
    await next;
    assert.equal(a._starting, false);
});

test('new response card selects an empty independent conversation', () => {
    const a = app();
    a.addNewResponse('older answer');
    a.openResponseCard();
    assert.equal(a.currentResponseIndex, 1);
    const request = a.beginManualRequest('new question');
    assert.equal(request.context, '');
    a.updateCurrentResponse({ id: request.requestId, text: 'new answer' });
    assert.equal(a.responses[0], 'older answer');
    assert.match(a.responses[1], /new answer/);
});

test('pasted screenshot waits for send and includes the typed task', async () => {
    const calls = [];
    const View = loadClass('src/components/views/AssistantView.js', 'AssistantView', {
        window: {
            attachScreenshot: async (...args) => {
                calls.push(args);
                return { success: true };
            },
        },
    });
    const input = { value: 'Find the total', focus() {} };
    const view = Object.assign(Object.create(View.prototype), {
        shadowRoot: { querySelector: selector => (selector === '#textInput' ? input : null) },
    });
    const file = { name: 'test.png', type: 'image/png' };
    view.handleImageFile(file);
    assert.equal(calls.length, 0);
    assert.equal(view.pendingImage, file);
    await view.handleSendText();
    assert.equal(calls[0][0], file);
    assert.equal(calls[0][1], 'Find the total');
    assert.equal(view.pendingImage, null);
    assert.equal(input.value, '');
});

test('automatic topic routing preserves reading position and merge/split retain streamed followups', () => {
    const AppWithRouting = loadClass('src/components/app/CheatingDaddyApp.js', 'CheatingDaddyApp', {
        window: { require: () => require('../src/utils/interview-workflow') },
    });
    const a = app();
    Object.setPrototypeOf(a, AppWithRouting.prototype);
    a.topicMeta = [];
    const first = a.beginInterviewRequest('Как работают каналы?', 'auto');
    a.updateCurrentResponse({ id: first.requestId, text: 'Channel answer' });
    const second = a.beginInterviewRequest('Что такое Kafka?', 'auto');
    assert.equal(a.responses.length, 2);
    assert.equal(a.currentResponseIndex, 0);
    const follow = a.beginInterviewRequest('А если канал закрыт?', 'auto');
    assert.equal(a._inlineRequests.get(follow.requestId).index, 0);
    a.currentResponseIndex = 1;
    a.mergeTopic();
    assert.equal(a.topicMeta[1].hidden, true);
    a.updateCurrentResponse({ id: second.requestId, text: 'Kafka finished' });
    assert.match(a.responses[0], /Channel answer/);
    assert.match(a.responses[0], /Kafka finished/);
    a.splitTopic();
    assert.equal(a.currentResponseIndex, 2);
    a.updateCurrentResponse({ id: follow.requestId, text: 'Closed channel answer' });
    assert.match(a.responses[2], /Closed channel answer/);
});

test('deleted topic stays deleted when late base or manual response chunks arrive', () => {
    const a = app();
    a.addNewResponse({ id: 'base', text: 'old' });
    const manual = a.beginManualRequest('followup');
    a.addNewResponse({ id: 'other', text: 'keep' });
    a.deleteTopic(0);
    a.updateCurrentResponse({ id: 'base', text: 'late base' });
    a.updateCurrentResponse({ id: manual.requestId, text: 'late manual' });
    assert.equal(a.responses[0], '');
    assert.equal(a.responses[1], 'keep');
    assert.equal(a.currentResponseIndex, 1);
    a.deleteTopic(1);
    assert.equal(a.responses[a.currentResponseIndex], '');
    assert.equal(a.topicMeta[a.currentResponseIndex].hidden, false);
});
test('hosted composer sends attached images with typed task and preserves drafts on failure', async () => {
    const View = loadClass('src/components/views/AssistantView.js', 'AssistantView');
    const input = { value: 'Explain this diagram' };
    let payload;
    const tools = {
        files: [{ url: 'data:image/jpeg;base64,aGVsbG8=' }],
        imageMode: 'vision',
        perform: async fn => {
            await fn();
            return true;
        },
        ask: async (text, options) => {
            payload = { text, ...options };
        },
        notifyAttachments() {},
    };
    const view = Object.assign(Object.create(View.prototype), { shadowRoot: { querySelector: s => (s === '#textInput' ? input : tools) } });
    await view.handleSendText();
    assert.equal(payload.text, 'Explain this diagram');
    assert.equal(payload.images[0], 'aGVsbG8=');
    assert.equal(payload.imageMode, 'vision');
    assert.equal(payload.routing, 'current');
    assert.equal(input.value, '');
    tools.files = [{ url: 'data:image/jpeg;base64,again' }];
    input.value = 'retry';
    tools.perform = async () => false;
    await view.handleSendText();
    assert.equal(input.value, 'retry');
    assert.equal(tools.files.length, 1);
});

test('composer clears immediately and does not erase the next draft on completion', async () => {
    const View = loadClass('src/components/views/AssistantView.js', 'AssistantView');
    const input = { value: 'first' };
    let finish;
    const tools = {
        files: [],
        perform: async fn => {
            await fn();
            return true;
        },
        ask: () =>
            new Promise(resolve => {
                finish = resolve;
            }),
        notifyAttachments() {},
    };
    const view = Object.assign(Object.create(View.prototype), { shadowRoot: { querySelector: s => (s === '#textInput' ? input : tools) } });
    const pending = view.handleSendText();
    assert.equal(input.value, '');
    input.value = 'next draft';
    finish();
    await pending;
    assert.equal(input.value, 'next draft');
});
test('font controls apply immediately, persist and respect both bounds', () => {
    let size = '24px',
        saved;
    const View = loadClass('src/components/views/AssistantView.js', 'AssistantView', {
        document: {
            documentElement: {
                style: {
                    setProperty: (_, value) => {
                        size = value;
                    },
                },
            },
        },
        getComputedStyle: () => ({ getPropertyValue: () => size }),
        window: {
            cheatingDaddy: {
                storage: {
                    updatePreference: (_, value) => {
                        saved = value;
                        return Promise.resolve();
                    },
                },
            },
        },
    });
    const view = Object.create(View.prototype);
    view.changeFontSize(-2);
    assert.equal(size, '22px');
    assert.equal(saved, 22);
    view.changeFontSize(-100);
    assert.equal(size, '12px');
    view.changeFontSize(100);
    assert.equal(size, '48px');
});

test('code highlighting uses the bundled engine and escapes code markup', () => {
    const sandbox = {};
    vm.runInNewContext(fs.readFileSync('src/assets/highlight-11.9.0.min.js', 'utf8'), sandbox);
    const classes = new Set(['language-go']);
    const code = { textContent: 'package main\nfunc main() { println("<script>") }', classList: classes, innerHTML: '' };
    const doc = { querySelectorAll: selector => (selector === 'pre code' ? [code] : []), body: { childNodes: [], innerHTML: '' } };
    const View = loadClass('src/components/views/AssistantView.js', 'AssistantView', {
        window: { hljs: sandbox.hljs },
        DOMParser: class {
            parseFromString() {
                return doc;
            }
        },
    });
    Object.create(View.prototype).wrapWordsInSpans('');
    assert.match(code.innerHTML, /hljs-keyword/);
    assert.match(code.innerHTML, /&lt;script&gt;/);
    assert.ok(classes.has('hljs'));
});
test('user question has no redundant label', () => {
    const a = app();
    a.beginManualRequest('Small question');
    assert.match(a.responses[0], /> Small question/);
    assert.doesNotMatch(a.responses[0], /Ваш запрос/);
});

test('retry reuses original request and card; failure state remains explicit', async () => {
    const Tools = loadClass('src/components/views/InterviewTools.js', 'InterviewTools');
    const owner = app();
    owner._sessionGeneration = 1;
    owner.topicMeta = [];
    owner.beginInterviewRequest = text => owner.beginManualRequest(text);
    const tools = Object.assign(Object.create(Tools.prototype), {
        mode: 'answer',
        routing: 'current',
        inbox: [],
        getRootNode: () => ({ host: { getRootNode: () => ({ host: owner }) } }),
    });
    Object.defineProperty(tools, 'owner', { value: owner });
    let calls = 0;
    Object.defineProperty(tools, 'ipc', {
        value: { invoke: async () => (++calls === 1 ? { success: false, error: 'fetch failed' } : { success: true, text: 'ok' }) },
    });
    await assert.rejects(tools.ask('What is Go?'), /fetch failed/);
    const [id, entry] = [...owner._inlineRequests][0];
    assert.equal(entry.state, 'failed');
    assert.match(entry.error, /Соединение/);
    await tools.ask(entry.question, { ...entry.payload, retryId: id });
    assert.equal(owner._inlineRequests.size, 1);
    assert.equal(entry.state, 'complete');
    assert.equal(owner.responses.length, 1);
});

test('recovery restores selected topic, text draft, scroll and makes pending requests retryable', async () => {
    const a = app();
    a.topicMeta = [];
    const input = { value: '' },
        container = { scrollTop: 0 };
    let restored;
    const tools = {
        _loaded: true,
        restoreDraft: s => {
            restored = s;
        },
    };
    const view = {
        updateComplete: Promise.resolve(),
        shadowRoot: { querySelector: selector => (selector === '#textInput' ? input : selector === '#responseContainer' ? container : tools) },
    };
    a.shadowRoot = { querySelector: () => view };
    a.updateComplete = Promise.resolve();
    const snapshot = {
        responses: ['first', 'second'],
        topicMeta: [{ title: 'one' }, { title: 'two' }],
        index: 1,
        focus: true,
        base: [
            [0, 'first'],
            [1, 'second'],
        ],
        ids: [],
        inline: [['req', { index: 1, question: 'followup', text: 'partial', state: 'pending', payload: { text: 'followup' } }]],
        draft: 'unsent question',
        scroll: 320,
    };
    await a.restoreRecovery(snapshot);
    assert.equal(a.currentResponseIndex, 1);
    assert.equal(input.value, 'unsent question');
    assert.equal(container.scrollTop, 320);
    assert.equal(a.focusMode, true);
    assert.equal(a._inlineRequests.get('req').state, 'failed');
    assert.equal(restored, snapshot);
});

test('readiness prevents duplicate probes and unlocks session start after IPC failure', async () => {
    const owner = { requestUpdate() {} };
    let rejectProbe;
    let probes = 0;
    const Console = loadClass('src/components/views/SessionConsole.js', 'SessionConsole', {
        window: {
            cheatingDaddy: { element: () => owner, storage: { getPreferences: async () => ({ providerMode: 'openrouter' }) } },
            require: () => ({
                ipcRenderer: {
                    invoke: () => {
                        probes++;
                        return new Promise((_, reject) => {
                            rejectProbe = reject;
                        });
                    },
                },
            }),
        },
    });
    const panel = new Console();
    const pending = panel.check();
    await Promise.resolve();
    assert.equal(panel.busy, true);
    assert.equal(owner._preflightBusy, true);
    await panel.check();
    assert.equal(probes, 2);
    rejectProbe(new Error('Capture unavailable'));
    await pending;
    assert.equal(panel.busy, false);
    assert.equal(owner._preflightBusy, false);
    assert.equal(panel.results[0].text, 'Capture unavailable');
});
