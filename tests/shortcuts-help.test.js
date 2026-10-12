const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { EventEmitter } = require('node:events');

function loadHelp() {
    const windows = [];
    class Window extends EventEmitter {
        constructor(options) {
            super();
            this.options = options;
            this.webContents = new EventEmitter();
            this.webContents.setWindowOpenHandler = fn => {
                this.openHandler = fn;
            };
            this.destroyed = false;
            this.actions = [];
            windows.push(this);
        }
        isDestroyed() {
            return this.destroyed;
        }
        setContentProtection(value) {
            this.actions.push(['protect', value]);
        }
        setHiddenInMissionControl() {}
        loadURL(url) {
            this.url = url;
            this.actions.push(['load']);
        }
        show() {
            this.actions.push(['show']);
        }
        close() {
            this.destroyed = true;
            this.emit('closed');
        }
    }
    const context = { module: { exports: {} }, process: { platform: 'darwin' }, require: () => ({ BrowserWindow: Window }) };
    vm.runInNewContext(fs.readFileSync('src/utils/shortcuts-help.js', 'utf8'), context);
    const main = new EventEmitter();
    main.isDestroyed = () => false;
    return { api: context.module.exports, windows, main };
}

test('shortcut sheet is protected before display, isolated and independent of main sharing preference', () => {
    const { api, main } = loadHelp();
    const win = api.toggleShortcutsHelp(main, { toggleVisibility: 'Cmd+\\', shortcutsHelp: 'Cmd+K' });
    assert.deepEqual(win.actions, [['protect', true], ['load']]);
    assert.equal(win.options.webPreferences.contextIsolation, true);
    assert.equal(win.options.webPreferences.nodeIntegration, false);
    assert.equal(win.options.webPreferences.sandbox, true);
    assert.equal(win.options.webPreferences.javascript, false);
    win.emit('ready-to-show');
    assert.deepEqual(win.actions.at(-1), ['show']);
    assert.equal(win.openHandler().action, 'deny');
    let blocked = false;
    win.webContents.emit('will-navigate', {
        preventDefault() {
            blocked = true;
        },
    });
    assert.equal(blocked, true);
    const html = decodeURIComponent(win.url.split(',').slice(1).join(','));
    assert.match(html, /Cmd\+K/);
    assert.match(html, /ScreenCaptureKit/);
});

test('repeat shortcut and Escape close sheet; parent hiding closes it and removes listeners', () => {
    const { api, main } = loadHelp();
    let win = api.toggleShortcutsHelp(main, {});
    api.toggleShortcutsHelp(main, {});
    assert.equal(win.destroyed, true);
    assert.equal(main._shortcutsHelp, null);
    win = api.toggleShortcutsHelp(main, {});
    win.webContents.emit('before-input-event', { preventDefault() {} }, { type: 'keyDown', key: 'Escape' });
    assert.equal(win.destroyed, true);
    win = api.toggleShortcutsHelp(main, {});
    main.emit('hide');
    assert.equal(win.destroyed, true);
    assert.equal(main.listenerCount('hide'), 0);
    assert.equal(main.listenerCount('closed'), 0);
});

test('custom shortcut values are escaped rather than inserted as markup', () => {
    const { api } = loadHelp();
    const html = api.renderShortcutsHelp({ shortcutsHelp: '<img src=x onerror=bad()>' });
    assert.ok(!html.includes('<img'));
    assert.match(html, /&lt;img/);
    assert.match(html, /default-src 'none'/);
});

test('response panel toggles without losing the answer, running teleprompter or screenshot control', () => {
    const source = fs
        .readFileSync('src/components/views/AssistantView.js', 'utf8')
        .replace(/^import .*;\r?\n/gm, '')
        .replace('export class AssistantView', 'class AssistantView');
    const owner = { topicMeta: [], _inlineRequests: new Map() };
    const context = {
        LitElement: class {},
        css() {},
        html: (strings, ...values) => ({ strings, values }),
        customElements: { define() {} },
        window: { cheatingDaddy: { element: () => owner, modKey: 'Cmd' } },
    };
    vm.runInNewContext(source + '\nglobalThis.View = AssistantView;', context);
    const view = Object.assign(Object.create(context.View.prototype), {
        responses: ['saved answer'],
        currentResponseIndex: 0,
        quickActions: [],
        hostedMode: true,
        attachments: [],
        transcript: [],
        teleprompterOn: true,
        renderTranscript: () => '',
    });
    const flatten = value =>
        value?.strings
            ? value.strings.reduce((s, part, i) => s + part + flatten(value.values[i]), '')
            : Array.isArray(value)
              ? value.map(flatten).join('')
              : typeof value === 'function'
                ? ''
                : (value ?? '');
    const functions = value =>
        Array.isArray(value?.values)
            ? value.values.flatMap(functions)
            : Array.isArray(value)
              ? value.flatMap(functions)
              : typeof value === 'function'
                ? [value]
                : [];
    const first = view.render();
    assert.match(flatten(first), /class="tp-controls"/);
    const toggle = functions(first).find(fn => fn.toString().includes('this.responseControlsHidden ='));
    assert.ok(toggle);
    toggle();
    const hidden = view.render();
    assert.ok(!flatten(hidden).includes('class="tp-controls"'));
    assert.match(flatten(hidden), /Показать панель/);
    assert.match(flatten(hidden), /Снять экран/);
    assert.equal(view.teleprompterOn, true);
    assert.deepEqual(view.responses, ['saved answer']);
    functions(hidden).find(fn => fn.toString().includes('this.responseControlsHidden ='))();
    assert.match(flatten(view.render()), /class="tp-controls"/);
});
