const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
test('edited profile is the system prompt; deleted profiles cannot silently return', () => {
    let aiProfiles = [{ id: 'custom', text: 'Explain Go in depth.' }];
    const context = { module: { exports: {} }, require: () => ({ getPreferences: () => ({ aiProfiles }) }) };
    vm.runInNewContext(fs.readFileSync('src/utils/prompts.js', 'utf8'), context);
    const { getSystemPrompt } = context.module.exports;
    assert.equal(getSystemPrompt('custom', 'Use tables', false), 'Explain Go in depth.\n\nUser-provided context\nUse tables');
    aiProfiles = [];
    assert.equal(getSystemPrompt('interview', 'My instructions', false), '\n\nUser-provided context\nMy instructions');
});
