const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { EventEmitter } = require('node:events');
test('window size survives close and is restored within current display bounds', () => {
    let config = { windowBounds: { width: 960, height: 640 } };
    class Window extends EventEmitter {
        constructor(options) {
            super();
            this.options = options;
            this.bounds = { width: options.width, height: options.height };
            this.webContents = { once() {} };
        }
        setContentProtection() {}
        setHiddenInMissionControl() {}
        loadFile() {}
        isDestroyed() {
            return false;
        }
        getNormalBounds() {
            return this.bounds;
        }
    }
    const electron = {
        session: { defaultSession: { setDisplayMediaRequestHandler() {} } },
        BrowserWindow: Window,
        screen: { getPrimaryDisplay: () => ({ workArea: { width: 1440, height: 900 } }) },
        ipcMain: { handle() {}, on() {}, removeHandler() {}, removeAllListeners() {} },
    };
    const context = {
        module: { exports: {} },
        __dirname: process.cwd() + '/src/utils',
        process: { platform: 'darwin' },
        console,
        require: name =>
            name === 'electron'
                ? electron
                : name === '../storage'
                  ? {
                        getConfig: () => config,
                        setConfig: update => {
                            config = { ...config, ...update };
                        },
                    }
                  : require(name),
    };
    vm.runInNewContext(fs.readFileSync('src/utils/window.js', 'utf8'), context);
    const create = () => context.module.exports.createWindow(() => {}, { current: null });
    const first = create();
    assert.equal(first.options.width, 960);
    first.bounds = { width: 1250, height: 750 };
    first.emit('resize');
    first.emit('close');
    const second = create();
    assert.equal(second.options.width, 1250);
    assert.equal(second.options.height, 750);
    config.windowBounds = { width: 4000, height: 3000 };
    const third = create();
    assert.equal(third.options.width, 1440);
    assert.equal(third.options.height, 900);
});
test('font shortcuts support custom bindings globally and in the focused window', () => {
    const registered = new Map(),
        events = [];
    const context = {
        module: { exports: {} },
        process: { platform: 'darwin' },
        console: { log() {}, error() {} },
        require: name =>
            name === 'electron'
                ? {
                      globalShortcut: {
                          unregisterAll() {
                              registered.clear();
                          },
                          register: (key, fn) => {
                              registered.set(key, fn);
                              return true;
                          },
                      },
                      screen: { getPrimaryDisplay: () => ({ workAreaSize: { width: 1440, height: 900 } }) },
                  }
                : name === '../storage'
                  ? {}
                  : require(name),
    };
    vm.runInNewContext(fs.readFileSync('src/utils/window.js', 'utf8'), context);
    const win = { webContents: new EventEmitter() };
    context.module.exports.updateGlobalShortcuts(
        { increaseFont: 'Cmd+Alt+Up', decreaseFont: 'Cmd+Alt+Down' },
        win,
        (...args) => events.push(args),
        {}
    );
    registered.get('Cmd+Alt+Up')();
    let prevented = false;
    win.webContents.emit(
        'before-input-event',
        {
            preventDefault() {
                prevented = true;
            },
        },
        { type: 'keyDown', key: 'ArrowDown', meta: true, alt: true }
    );
    assert.deepEqual(events, [
        ['response-font-step', 2],
        ['response-font-step', -2],
    ]);
    assert.equal(prevented, true);
    context.module.exports.updateGlobalShortcuts({ increaseFont: 'Ctrl+Shift+U' }, win, (...args) => events.push(args), {});
    assert.equal(win.webContents.listenerCount('before-input-event'), 1);
    registered.get('Ctrl+Shift+U')();
    assert.deepEqual(events.at(-1), ['response-font-step', 2]);
});
test('native screenshot validates sender and selects the display containing the app', async () => {
    const handlers = new Map();
    const webContents = {};
    const electron = {
        ipcMain: { removeHandler() {}, handle: (name, fn) => handlers.set(name, fn), on() {} },
        systemPreferences: { getMediaAccessStatus: () => 'granted' },
        screen: { getDisplayMatching: () => ({ id: 2 }) },
        desktopCapturer: {
            getSources: async () =>
                [1, 2].map(id => ({ display_id: String(id), thumbnail: { isEmpty: () => false, toJPEG: () => Buffer.from('screen' + id) } })),
        },
    };
    const context = {
        module: { exports: {} },
        process: { platform: 'darwin' },
        setTimeout,
        clearTimeout,
        require: name => (name === 'electron' ? electron : name === '../storage' ? {} : require(name)),
    };
    vm.runInNewContext(fs.readFileSync('src/utils/window.js', 'utf8') + '\nmodule.exports.setupWindowIpcHandlers=setupWindowIpcHandlers;', context);
    context.module.exports.setupWindowIpcHandlers({ webContents, getBounds: () => ({}) }, () => {}, {});
    const capture = handlers.get('capture-screen-draft');
    assert.equal((await capture({ sender: {} })).success, false);
    const result = await capture({ sender: webContents });
    assert.equal(result.success, true);
    assert.equal(Buffer.from(result.data, 'base64').toString(), 'screen2');
    electron.systemPreferences.getMediaAccessStatus = () => 'denied';
    assert.match((await capture({ sender: webContents })).error, /Разрешите запись/);
});
