const { BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const path = require('node:path');
const storage = require('../storage');

let mouseEventsIgnored = false;

const DEFAULT_MAIN_WINDOW_SIZE = { width: 1100, height: 800 };
const MIN_WINDOW_SIZE = { width: 380, height: 240 };
const OPACITY_RANGE = { min: 0.2, max: 1, step: 0.1 };

function clampOpacity(value) {
    if (!Number.isFinite(value)) return OPACITY_RANGE.max;
    return Math.round(Math.max(OPACITY_RANGE.min, Math.min(OPACITY_RANGE.max, value)) * 10) / 10;
}

function createWindow(sendToRenderer, geminiSessionRef) {
    let windowWidth = DEFAULT_MAIN_WINDOW_SIZE.width;
    let windowHeight = DEFAULT_MAIN_WINDOW_SIZE.height;

    const saved = storage.getConfig().windowBounds;
    const area = screen.getPrimaryDisplay().workArea;
    if (saved && Number.isFinite(saved.width) && Number.isFinite(saved.height)) {
        windowWidth = Math.max(MIN_WINDOW_SIZE.width, Math.min(saved.width, area.width));
        windowHeight = Math.max(MIN_WINDOW_SIZE.height, Math.min(saved.height, area.height));
    }
    const mainWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        minWidth: MIN_WINDOW_SIZE.width,
        minHeight: MIN_WINDOW_SIZE.height,
        resizable: true,
        frame: false,
        transparent: true,
        hasShadow: false,
        alwaysOnTop: process.platform === 'win32',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // TODO: change to true
            backgroundThrottling: false,
            enableBlinkFeatures: 'GetDisplayMedia',
            webSecurity: true,
            allowRunningInsecureContent: false,
        },
        backgroundColor: '#00000000',
    });

    const saveBounds = () => {
        if (!mainWindow.isDestroyed()) storage.setConfig({ windowBounds: mainWindow.getNormalBounds() });
    };
    mainWindow.on('resize', saveBounds);
    mainWindow.on('close', saveBounds);

    const { session, desktopCapturer } = require('electron');
    session.defaultSession.setDisplayMediaRequestHandler(
        (request, callback) => {
            desktopCapturer.getSources({ types: ['screen'] }).then(sources => {
                callback({ video: sources[0], audio: 'loopback' });
            });
        },
        { useSystemPicker: true }
    );

    mainWindow.setContentProtection(storage.getConfig().showInScreenSharing !== true);
    const savedOpacity = storage.getConfig().windowOpacity;
    if (savedOpacity !== undefined) mainWindow.setOpacity?.(clampOpacity(savedOpacity));
    if (process.platform === 'win32') {
        mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
        mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    }

    // Hide from Windows taskbar
    if (process.platform === 'win32') {
        try {
            mainWindow.setSkipTaskbar(true);
        } catch (error) {
            console.warn('Could not hide from taskbar:', error.message);
        }
    }

    // Hide from Mission Control on macOS
    if (process.platform === 'darwin') {
        try {
            mainWindow.setHiddenInMissionControl(true);
        } catch (error) {
            console.warn('Could not hide from Mission Control:', error.message);
        }
    }

    mainWindow.loadFile(path.join(__dirname, '../index.html'));

    // After window is created, initialize keybinds
    mainWindow.webContents.once('dom-ready', () => {
        setTimeout(() => {
            const defaultKeybinds = getDefaultKeybinds();
            let keybinds = defaultKeybinds;

            // Load keybinds from storage
            const savedKeybinds = storage.getKeybinds();
            if (savedKeybinds) {
                keybinds = { ...defaultKeybinds, ...savedKeybinds };
            }

            updateGlobalShortcuts(keybinds, mainWindow, sendToRenderer, geminiSessionRef);
        }, 150);
    });

    setupWindowIpcHandlers(mainWindow, sendToRenderer, geminiSessionRef);

    return mainWindow;
}

function getDefaultKeybinds() {
    const isMac = process.platform === 'darwin';
    return {
        moveUp: isMac ? 'Alt+Up' : 'Ctrl+Up',
        moveDown: isMac ? 'Alt+Down' : 'Ctrl+Down',
        moveLeft: isMac ? 'Alt+Left' : 'Ctrl+Left',
        moveRight: isMac ? 'Alt+Right' : 'Ctrl+Right',
        toggleVisibility: isMac ? 'Cmd+\\' : 'Ctrl+\\',
        toggleClickThrough: isMac ? 'Cmd+M' : 'Ctrl+M',
        nextStep: isMac ? 'Cmd+Enter' : 'Ctrl+Enter',
        previousResponse: isMac ? 'Cmd+[' : 'Ctrl+[',
        nextResponse: isMac ? 'Cmd+]' : 'Ctrl+]',
        scrollUp: isMac ? 'Cmd+Shift+Up' : 'Ctrl+Shift+Up',
        scrollDown: isMac ? 'Cmd+Shift+Down' : 'Ctrl+Shift+Down',
        focusMode: isMac ? 'Cmd+Shift+F' : 'Ctrl+Shift+F',
        increaseFont: isMac ? 'Cmd+Alt+Up' : 'Ctrl+Alt+Up',
        decreaseFont: isMac ? 'Cmd+Alt+Down' : 'Ctrl+Alt+Down',
        decreaseOpacity: isMac ? 'Cmd+Alt+Left' : 'Ctrl+Alt+Left',
        increaseOpacity: isMac ? 'Cmd+Alt+Right' : 'Ctrl+Alt+Right',
        toggleTeleprompter: isMac ? 'Cmd+Alt+S' : 'Ctrl+Alt+S',
        emergencyErase: isMac ? 'Cmd+Shift+E' : 'Ctrl+Shift+E',
    };
}

function updateGlobalShortcuts(keybinds, mainWindow, sendToRenderer, geminiSessionRef) {
    console.log('Updating global shortcuts with:', keybinds);

    // Unregister all existing shortcuts
    globalShortcut.unregisterAll();
    if (keybinds.focusMode) globalShortcut.register(keybinds.focusMode, () => sendToRenderer('toggle-focus-mode'));
    globalShortcut.register('CommandOrControl+P', () => sendToRenderer('toggle-session-pause'));
    if (keybinds.toggleTeleprompter) {
        try {
            globalShortcut.register(keybinds.toggleTeleprompter, () => sendToRenderer('toggle-teleprompter'));
        } catch (error) {
            console.error('Teleprompter shortcut unavailable:', error.message);
        }
    }

    for (const [action, step] of [
        ['increaseFont', 2],
        ['decreaseFont', -2],
    ]) {
        if (keybinds[action]) {
            try {
                globalShortcut.register(keybinds[action], () => sendToRenderer('response-font-step', step));
            } catch (error) {
                console.error('Font shortcut unavailable:', error.message);
            }
        }
    }
    for (const [action, direction] of [
        ['increaseOpacity', 1],
        ['decreaseOpacity', -1],
    ]) {
        if (!keybinds[action]) continue;
        try {
            globalShortcut.register(keybinds[action], () => stepWindowOpacity(mainWindow, sendToRenderer, direction));
        } catch (error) {
            console.error('Opacity shortcut unavailable:', error.message);
        }
    }
    if (mainWindow._fontInputHandler) mainWindow.webContents.removeListener?.('before-input-event', mainWindow._fontInputHandler);
    mainWindow._fontInputHandler = (event, input) => {
        if (input.type !== 'keyDown') return;
        for (const [action, step] of [
            ['increaseFont', 2],
            ['decreaseFont', -2],
            ['focusMode', 'focus'],
        ]) {
            const parts = (keybinds[action] || '').toLowerCase().split('+');
            const key = parts.pop();
            const actual = input.key.toLowerCase().replace(/^arrow/, '');
            if (
                key !== actual ||
                !!input.meta !== parts.includes('cmd') ||
                !!input.control !== parts.includes('ctrl') ||
                !!input.alt !== parts.includes('alt') ||
                !!input.shift !== parts.includes('shift')
            )
                continue;
            event.preventDefault();
            if (step === 'focus') sendToRenderer('toggle-focus-mode');
            else sendToRenderer('response-font-step', step);
        }
    };
    mainWindow.webContents.on?.('before-input-event', mainWindow._fontInputHandler);
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    const moveIncrement = Math.floor(Math.min(width, height) * 0.1);

    const movementActions = {
        moveUp: () => {
            if (!mainWindow.isVisible()) return;
            const [currentX, currentY] = mainWindow.getPosition();
            mainWindow.setPosition(currentX, currentY - moveIncrement);
        },
        moveDown: () => {
            if (!mainWindow.isVisible()) return;
            const [currentX, currentY] = mainWindow.getPosition();
            mainWindow.setPosition(currentX, currentY + moveIncrement);
        },
        moveLeft: () => {
            if (!mainWindow.isVisible()) return;
            const [currentX, currentY] = mainWindow.getPosition();
            mainWindow.setPosition(currentX - moveIncrement, currentY);
        },
        moveRight: () => {
            if (!mainWindow.isVisible()) return;
            const [currentX, currentY] = mainWindow.getPosition();
            mainWindow.setPosition(currentX + moveIncrement, currentY);
        },
    };

    Object.keys(movementActions).forEach(action => {
        const keybind = keybinds[action];
        if (keybind) {
            try {
                globalShortcut.register(keybind, movementActions[action]);
                console.log(`Registered ${action}: ${keybind}`);
            } catch (error) {
                console.error(`Failed to register ${action} (${keybind}):`, error);
            }
        }
    });

    // Register toggle visibility shortcut
    if (keybinds.toggleVisibility) {
        try {
            globalShortcut.register(keybinds.toggleVisibility, () => {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.showInactive();
                }
            });
            console.log(`Registered toggleVisibility: ${keybinds.toggleVisibility}`);
        } catch (error) {
            console.error(`Failed to register toggleVisibility (${keybinds.toggleVisibility}):`, error);
        }
    }

    // Register toggle click-through shortcut
    if (keybinds.toggleClickThrough) {
        try {
            globalShortcut.register(keybinds.toggleClickThrough, () => {
                mouseEventsIgnored = !mouseEventsIgnored;
                if (mouseEventsIgnored) {
                    mainWindow.setIgnoreMouseEvents(true, { forward: true });
                    console.log('Mouse events ignored');
                } else {
                    mainWindow.setIgnoreMouseEvents(false);
                    console.log('Mouse events enabled');
                }
                mainWindow.webContents.send('click-through-toggled', mouseEventsIgnored);
            });
            console.log(`Registered toggleClickThrough: ${keybinds.toggleClickThrough}`);
        } catch (error) {
            console.error(`Failed to register toggleClickThrough (${keybinds.toggleClickThrough}):`, error);
        }
    }

    // Register next step shortcut (either starts session or takes screenshot based on view)
    if (keybinds.nextStep) {
        try {
            globalShortcut.register(keybinds.nextStep, async () => {
                console.log('Next step shortcut triggered');
                try {
                    // Determine the shortcut key format
                    const isMac = process.platform === 'darwin';
                    const shortcutKey = isMac ? 'cmd+enter' : 'ctrl+enter';

                    // Use the new handleShortcut function
                    mainWindow.webContents.executeJavaScript(`
                        cheatingDaddy.handleShortcut('${shortcutKey}');
                    `);
                } catch (error) {
                    console.error('Error handling next step shortcut:', error);
                }
            });
            console.log(`Registered nextStep: ${keybinds.nextStep}`);
        } catch (error) {
            console.error(`Failed to register nextStep (${keybinds.nextStep}):`, error);
        }
    }

    // Register previous response shortcut
    if (keybinds.previousResponse) {
        try {
            globalShortcut.register(keybinds.previousResponse, () => {
                console.log('Previous response shortcut triggered');
                sendToRenderer('navigate-previous-response');
            });
            console.log(`Registered previousResponse: ${keybinds.previousResponse}`);
        } catch (error) {
            console.error(`Failed to register previousResponse (${keybinds.previousResponse}):`, error);
        }
    }

    // Register next response shortcut
    if (keybinds.nextResponse) {
        try {
            globalShortcut.register(keybinds.nextResponse, () => {
                console.log('Next response shortcut triggered');
                sendToRenderer('navigate-next-response');
            });
            console.log(`Registered nextResponse: ${keybinds.nextResponse}`);
        } catch (error) {
            console.error(`Failed to register nextResponse (${keybinds.nextResponse}):`, error);
        }
    }

    // Register scroll up shortcut
    if (keybinds.scrollUp) {
        try {
            globalShortcut.register(keybinds.scrollUp, () => {
                console.log('Scroll up shortcut triggered');
                sendToRenderer('scroll-response-up');
            });
            console.log(`Registered scrollUp: ${keybinds.scrollUp}`);
        } catch (error) {
            console.error(`Failed to register scrollUp (${keybinds.scrollUp}):`, error);
        }
    }

    // Register scroll down shortcut
    if (keybinds.scrollDown) {
        try {
            globalShortcut.register(keybinds.scrollDown, () => {
                console.log('Scroll down shortcut triggered');
                sendToRenderer('scroll-response-down');
            });
            console.log(`Registered scrollDown: ${keybinds.scrollDown}`);
        } catch (error) {
            console.error(`Failed to register scrollDown (${keybinds.scrollDown}):`, error);
        }
    }

    // Register emergency erase shortcut
    if (keybinds.emergencyErase) {
        try {
            globalShortcut.register(keybinds.emergencyErase, () => {
                console.log('Emergency Erase triggered!');
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.hide();

                    if (geminiSessionRef.current) {
                        geminiSessionRef.current.close();
                        geminiSessionRef.current = null;
                    }

                    sendToRenderer('clear-sensitive-data');

                    setTimeout(() => {
                        const { app } = require('electron');
                        app.quit();
                    }, 300);
                }
            });
            console.log(`Registered emergencyErase: ${keybinds.emergencyErase}`);
        } catch (error) {
            console.error(`Failed to register emergencyErase (${keybinds.emergencyErase}):`, error);
        }
    }
}

function stepWindowOpacity(mainWindow, sendToRenderer, direction) {
    if (mainWindow.isDestroyed() || !mainWindow.getOpacity) return;
    const now = Date.now();
    if (now - (mainWindow._lastOpacityStep || 0) < 80) return;
    mainWindow._lastOpacityStep = now;
    const next = clampOpacity(mainWindow.getOpacity() + direction * OPACITY_RANGE.step);
    mainWindow.setOpacity(next);
    storage.setConfig({ windowOpacity: next });
    sendToRenderer('window-opacity-changed', next);
}

function setupWindowIpcHandlers(mainWindow, sendToRenderer, geminiSessionRef) {
    ipcMain.removeHandler('set-screen-sharing-visibility');
    ipcMain.handle('set-screen-sharing-visibility', (event, visible) => {
        if (event.sender !== mainWindow.webContents || typeof visible !== 'boolean') return { success: false, error: 'Некорректный запрос' };
        const previous = storage.getConfig().showInScreenSharing === true;
        try {
            mainWindow.setContentProtection(!visible);
            storage.setConfig({ showInScreenSharing: visible });
            return { success: true };
        } catch (error) {
            mainWindow.setContentProtection(!previous);
            return { success: false, error: error.message };
        }
    });

    ipcMain.removeHandler('capture-screen-draft');
    let screenCapturePending = false;
    ipcMain.handle('capture-screen-draft', async event => {
        if (event.sender !== mainWindow.webContents) return { success: false, error: 'Недоступный источник запроса' };
        if (screenCapturePending) return { success: false, error: 'Снимок уже создаётся' };
        screenCapturePending = true;
        let timeout;
        try {
            const { desktopCapturer, systemPreferences } = require('electron');
            if (process.platform === 'darwin' && systemPreferences.getMediaAccessStatus('screen') === 'denied')
                throw new Error('Разрешите запись экрана для Cheating Daddy в настройках macOS и перезапустите приложение');
            const sources = await Promise.race([
                desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1920, height: 1080 }, fetchWindowIcons: false }),
                new Promise((_, reject) => {
                    timeout = setTimeout(() => reject(new Error('Снимок не получен за 10 секунд. Проверьте разрешение записи экрана macOS.')), 10000);
                }),
            ]);
            const display = screen.getDisplayMatching(mainWindow.getBounds());
            const source = sources.find(item => item.display_id === String(display.id)) || sources[0];
            if (!source || source.thumbnail.isEmpty()) throw new Error('Пустой снимок. Проверьте разрешение записи экрана macOS.');
            return { success: true, data: source.thumbnail.toJPEG(90).toString('base64') };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            clearTimeout(timeout);
            screenCapturePending = false;
        }
    });

    ipcMain.on('view-changed', (event, view) => {
        if (!mainWindow.isDestroyed()) {
            const isLiveMode = view === 'assistant';

            if (process.platform !== 'win32') {
                mainWindow.setAlwaysOnTop(isLiveMode);
                mainWindow.setVisibleOnAllWorkspaces(isLiveMode, { visibleOnFullScreen: isLiveMode });
            }

            if (!isLiveMode) {
                mainWindow.setIgnoreMouseEvents(false);
            }
        }
    });

    ipcMain.handle('window-minimize', () => {
        if (!mainWindow.isDestroyed()) {
            mainWindow.minimize();
        }
    });

    ipcMain.on('update-keybinds', (event, newKeybinds) => {
        if (!mainWindow.isDestroyed()) {
            updateGlobalShortcuts(newKeybinds, mainWindow, sendToRenderer, geminiSessionRef);
        }
    });

    ipcMain.handle('toggle-window-visibility', async event => {
        try {
            if (mainWindow.isDestroyed()) {
                return { success: false, error: 'Window has been destroyed' };
            }

            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.showInactive();
            }
            return { success: true };
        } catch (error) {
            console.error('Error toggling window visibility:', error);
            return { success: false, error: error.message };
        }
    });
}

module.exports = {
    clampOpacity,
    stepWindowOpacity,
    createWindow,
    getDefaultKeybinds,
    updateGlobalShortcuts,
    setupWindowIpcHandlers,
};
