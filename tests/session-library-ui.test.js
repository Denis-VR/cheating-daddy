const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const os = require('node:os');
function view(file, name) {
    const source = fs
        .readFileSync(file, 'utf8')
        .replace(/^import .*;\r?\n/gm, '')
        .replace(`export class ${name}`, `class ${name}`);
    const context = { LitElement: class {}, html() {}, css() {}, customElements: { define() {} } };
    vm.createContext(context);
    vm.runInContext(source + `\nglobalThis.Result = ${name};`, context);
    return context.Result;
}
test('resume deletion saves immediately, clears only matching resume selection and preserves vacancy', async () => {
    const Tools = view('src/components/views/InterviewTools.js', 'InterviewTools');
    const tools = new Tools();
    tools.libraryTab = 'resumes';
    tools.libraryId = 'resume';
    tools.workspace = {
        resumes: [{ id: 'resume', name: 'CV', text: 'Java' }],
        vacancies: [{ id: 'job' }],
        activeResumeId: 'resume',
        activeVacancyId: 'job',
    };
    let persisted;
    tools.call = async (name, value) => {
        assert.equal(name, 'workspace-save');
        persisted = value;
        return { data: value };
    };
    await tools.deleteLibraryItem();
    assert.equal(persisted.resumes.length, 0);
    assert.equal(persisted.activeResumeId, '');
    assert.equal(persisted.activeVacancyId, 'job');
    assert.equal(tools.libraryId, '');
    assert.equal(tools.status, 'Удалено');
});
test('failed resume deletion preserves the item and selection', async () => {
    const Tools = view('src/components/views/InterviewTools.js', 'InterviewTools');
    const tools = new Tools();
    tools.libraryTab = 'resumes';
    tools.libraryId = 'resume';
    tools.workspace = { resumes: [{ id: 'resume' }], activeResumeId: 'resume' };
    tools.call = async () => {
        throw Error('disk full');
    };
    await tools.deleteLibraryItem();
    assert.equal(tools.workspace.resumes.length, 1);
    assert.equal(tools.libraryId, 'resume');
    assert.equal(tools.status, 'disk full');
});
test('history retains vacancy and profile metadata after subsequent answer saves', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'cd-history-names-'));
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
    const storage = context.module.exports;
    storage.saveSession('1791630000000', { profile: 'custom', profileName: 'Java', vacancyName: 'Backend — Acme', resumeName: 'CV Java' });
    storage.saveSession('1791630000000', { conversationHistory: [{ transcription: 'question', ai_response: 'answer' }] });
    const session = storage.getAllSessions()[0];
    assert.equal(session.vacancyName, 'Backend — Acme');
    assert.equal(session.profileName, 'Java');
    assert.equal(session.resumeName, 'CV Java');
    assert.equal(session.createdAt, 1791630000000);
});
