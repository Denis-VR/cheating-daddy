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
        assert.deepEqual(workspace.loadWorkspace(), value);
        assert.throws(() => workspace.saveWorkspace({ ...value, activePackageId: 'missing' }));
        assert.deepEqual(workspace.loadWorkspace(), value);
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
