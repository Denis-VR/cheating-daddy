const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const storage = require('../src/storage');
const workspace = require('../src/utils/interview-storage');
test('preparation persists across reloads and invalid/corrupt data cannot overwrite it silently', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cd-workspace-test-'));
    const original = storage.getConfigDir;
    storage.getConfigDir = () => dir;
    try {
        assert.deepEqual(workspace.loadWorkspace().packages, []);
        const value = {
            packages: [{ id: 'one', name: 'Go', vacancy: 'Backend', experience: 'Kafka', materials: [{ name: 'cv.txt', text: 'Real experience' }] }],
            activePackageId: 'one',
            design: { load: '100 RPS' },
            designVersions: [],
        };
        workspace.saveWorkspace(value);
        assert.deepEqual(workspace.loadWorkspace(), workspace.migrateWorkspace(value));
        assert.throws(() => workspace.saveWorkspace({ ...value, activePackageId: 'missing' }));
        assert.deepEqual(workspace.loadWorkspace(), workspace.migrateWorkspace(value));
        fs.writeFileSync(path.join(dir, 'interview-workspace.json'), '{bad');
        assert.throws(() => workspace.loadWorkspace(), /прочитать/);
    } finally {
        storage.getConfigDir = original;
        fs.rmSync(dir, { recursive: true, force: true });
    }
});
test('document import preserves text and rejects unsupported, blank and oversized input', async () => {
    const encode = text => Buffer.from(text).toString('base64');
    assert.deepEqual(await workspace.extractDocument({ name: 'cv.md', data: encode('Go разработчик') }), { name: 'cv.md', text: 'Go разработчик' });
    await assert.rejects(workspace.extractDocument({ name: 'cv.exe', data: encode('text') }), /Поддерживаются/);
    await assert.rejects(workspace.extractDocument({ name: 'cv.txt', data: encode('  ') }), /Текст не найден/);
    await assert.rejects(workspace.extractDocument({ name: 'cv.txt', data: encode('x'.repeat(200001)) }), /200000/);
});

test('legacy packages migrate to independent reusable resumes and vacancies; deletion survives reload', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cd-library-test-'));
    const original = storage.getConfigDir;
    storage.getConfigDir = () => dir;
    try {
        const old = {
            packages: ['Java', 'Go'].map((name, i) => ({
                id: String(i),
                name,
                vacancy: name + ' role',
                experience: 'Queues',
                materials: [{ name: 'CV', text: 'Real experience' }],
            })),
            activePackageId: '0',
            design: {},
            designVersions: [],
        };
        const file = path.join(dir, 'interview-workspace.json');
        fs.writeFileSync(file, JSON.stringify(old));
        const migrated = workspace.loadWorkspace();
        assert.equal(migrated.resumes.length, 1);
        assert.equal(migrated.vacancies.length, 2);
        migrated.activeVacancyId = '1';
        workspace.saveWorkspace(migrated);
        const selected = workspace.selectedPreparation();
        assert.equal(selected.name, 'Go');
        assert.match(selected.materials[0].text, /Real experience/);
        assert.deepEqual(JSON.parse(fs.readFileSync(file + '.v1-backup')), old);
        const withStories = workspace.saveWorkspace({
            ...migrated,
            resumes: migrated.resumes.map(r => ({ ...r, stories: '**Конфликт**\nSituation: …' })),
        });
        assert.match(workspace.selectedPreparation(withStories).materials[1].text, /Конфликт/);
        assert.throws(() => workspace.saveWorkspace({ ...migrated, resumes: migrated.resumes.map(r => ({ ...r, stories: 42 })) }), /Некорректный/);
        workspace.saveWorkspace({ ...migrated, resumes: [], activeResumeId: '' });
        assert.deepEqual(workspace.loadWorkspace().resumes, []);
        assert.equal(workspace.loadWorkspace().vacancies.length, 2);
        assert.throws(() => workspace.saveWorkspace({ ...migrated, activeResumeId: 'unknown' }), /не найден/);
    } finally {
        storage.getConfigDir = original;
        fs.rmSync(dir, { recursive: true, force: true });
    }
});
