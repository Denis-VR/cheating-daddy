const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

function loadWindowModule(config = {}) {
    const state = { config };
    const context = {
        module: { exports: {} },
        __dirname: process.cwd() + '/src/utils',
        process: { platform: 'darwin' },
        console,
        Date,
        require: name =>
            name === 'electron'
                ? { BrowserWindow: class {}, globalShortcut: {}, ipcMain: {}, screen: {} }
                : name === '../storage'
                  ? {
                        getConfig: () => state.config,
                        setConfig: update => {
                            state.config = { ...state.config, ...update };
                        },
                    }
                  : require(name),
    };
    vm.runInNewContext(fs.readFileSync('src/utils/window.js', 'utf8'), context);
    return { api: context.module.exports, state };
}

test('window opacity is clamped between 20% and 100%', () => {
    const { api } = loadWindowModule();
    assert.equal(api.clampOpacity(0.05), 0.2);
    assert.equal(api.clampOpacity(1.4), 1);
    assert.equal(api.clampOpacity(0.7000001), 0.7);
    assert.equal(api.clampOpacity(Number.NaN), 1);
});

test('opacity shortcuts step the window, persist the value and notify the renderer', () => {
    const { api, state } = loadWindowModule();
    let opacity = 1;
    const win = {
        isDestroyed: () => false,
        getOpacity: () => opacity,
        setOpacity: value => {
            opacity = value;
        },
    };
    const sent = [];
    api.stepWindowOpacity(win, (...args) => sent.push(args), -1);
    assert.equal(opacity, 0.9);
    assert.equal(state.config.windowOpacity, 0.9);
    assert.deepEqual(sent, [['window-opacity-changed', 0.9]]);

    win._lastOpacityStep = 0;
    opacity = 0.2;
    api.stepWindowOpacity(win, () => {}, -1);
    assert.equal(opacity, 0.2);
});

test('default keybinds include opacity shortcuts that do not clash with other actions', () => {
    const { api } = loadWindowModule();
    const keybinds = api.getDefaultKeybinds();
    assert.equal(keybinds.decreaseOpacity, 'Cmd+Alt+Left');
    assert.equal(keybinds.increaseOpacity, 'Cmd+Alt+Right');
    const values = Object.values(keybinds);
    assert.equal(new Set(values).size, values.length);
});

test('resize grip requests are clamped to the minimum size and the current work area', () => {
    const handlers = new Map();
    const listeners = new Map();
    let size = null;
    const webContents = {};
    const win = {
        webContents,
        isDestroyed: () => false,
        getBounds: () => ({ x: 0, y: 0, width: 800, height: 600 }),
        getSize: () => [800, 600],
        setSize: (width, height) => {
            size = [width, height];
        },
    };
    const context = {
        module: { exports: {} },
        __dirname: process.cwd() + '/src/utils',
        process: { platform: 'win32' },
        console,
        require: name =>
            name === 'electron'
                ? {
                      BrowserWindow: class {},
                      globalShortcut: {},
                      screen: { getDisplayMatching: () => ({ workArea: { width: 1280, height: 720 } }) },
                      ipcMain: {
                          handle: (channel, fn) => handlers.set(channel, fn),
                          removeHandler: () => {},
                          on: (channel, fn) => listeners.set(channel, fn),
                      },
                  }
                : name === '../storage'
                  ? { getConfig: () => ({}), setConfig() {} }
                  : require(name),
    };
    vm.runInNewContext(fs.readFileSync('src/utils/window.js', 'utf8'), context);
    context.module.exports.setupWindowIpcHandlers(win, () => {}, { current: null });

    assert.deepEqual(handlers.get('window-get-size')({ sender: webContents }), [800, 600]);
    assert.equal(handlers.get('window-get-size')({ sender: {} }), null);
    listeners.get('window-set-size')({ sender: webContents }, { width: 5000, height: 100 });
    assert.deepEqual(size, [1280, 240]);
    listeners.get('window-set-size')({ sender: {} }, { width: 900, height: 700 });
    assert.deepEqual(size, [1280, 240]);
});
