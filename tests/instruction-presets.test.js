const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
test('legacy instructions migrate without loss; named presets persist and select session context', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'cd-presets-'));
    t.after(() => fs.rmSync(home, { recursive: true, force: true }));
    const context = {
        module: { exports: {} },
        console,
        require: name =>
            name === 'os'
                ? { platform: () => 'linux', homedir: () => home }
                : require('node:module').createRequire(path.resolve('src/storage.js'))(name),
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync('src/storage.js', 'utf8'), context);
    const storage = context.module.exports,
        directory = storage.getConfigDir();
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'preferences.json'), JSON.stringify({ customPrompt: 'Existing instructions', theme: 'dark' }));
    const initial = storage.getPreferences();
    assert.equal(initial.instructionPresets[0].text, 'Existing instructions');
    assert.ok(
        storage.setPreferences({
            instructionPresets: [...initial.instructionPresets, { id: 'second', name: 'Go interview', text: 'Use Go examples' }],
            activeInstructionId: 'second',
        })
    );
    assert.equal(storage.getPreferences().customPrompt, 'Use Go examples');
    assert.equal(JSON.parse(fs.readFileSync(path.join(directory, 'preferences.json'))).activeInstructionId, 'second');
    assert.equal(initial.aiProfiles.length, 6);
    storage.setPreferences({ aiProfiles: [{ id: 'custom', name: 'My profile', text: 'Full custom system prompt' }], selectedProfile: 'custom' });
    assert.equal(storage.getPreferences().aiProfiles[0].text, 'Full custom system prompt');
    storage.setPreferences({ aiProfiles: [] });
    assert.equal(storage.getPreferences().aiProfiles.length, 0);
    assert.equal(storage.getPreferences().selectedProfile, '');
    storage.updatePreference('fontSize', 22);
    storage.updatePreference('selectedLanguage', 'ru-RU');
    storage.setConfig({ windowBounds: { width: 1200, height: 700 } });
    storage.saveSession('test-session', { conversationHistory: [] });
    fs.writeFileSync(path.join(directory, 'config.json'), JSON.stringify({ configVersion: 0, windowBounds: { width: 1200, height: 700 } }));
    storage.initializeStorage();
    assert.equal(storage.getPreferences().fontSize, 22);
    assert.equal(storage.getPreferences().selectedLanguage, 'ru-RU');
    assert.equal(storage.getConfig().windowBounds.width, 1200);
    assert.ok(storage.getSession('test-session'));
    assert.throws(() => storage.deleteSession('../preferences'), /Invalid session/);
    assert.equal(storage.deleteSession('test-session'), true);
    storage.saveSession('first', {});
    storage.saveSession('second', {});
    assert.equal(storage.deleteAllSessions(), true);
    assert.equal(storage.getAllSessions().length, 0);
    assert.equal(storage.getPreferences().fontSize, 22);
    assert.equal(storage.getPreferences().customPrompt, 'Use Go examples');
    storage.setPreferences({ activeInstructionId: 'default' });
    assert.equal(storage.getPreferences().customPrompt, 'Existing instructions');
    assert.throws(() => storage.setPreferences({ instructionPresets: [{ id: 'bad', name: '', text: 'x' }] }), /Invalid/);
});
