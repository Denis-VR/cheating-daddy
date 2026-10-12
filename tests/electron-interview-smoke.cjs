// Run with `npm run test:ui`. Uses the real Electron DOM and Lit components, no provider or capture permissions.
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'interview-ui-'));
app.setPath('userData', directory);
const timeout = setTimeout(() => {
    console.error('UI smoke timed out');
    app.exit(1);
}, 30000);
ipcMain.once('interview-smoke-result', (_event, result) => {
    console.log(JSON.stringify(result));
    clearTimeout(timeout);
    app.exit(result.success ? 0 : 1);
});
app.whenReady().then(() => {
    const window = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: true, contextIsolation: false } });
    window.loadFile(path.join(__dirname, 'fixtures', 'interview-smoke.html'));
});
app.on('quit', () => fs.rmSync(directory, { recursive: true, force: true }));
