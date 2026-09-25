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
