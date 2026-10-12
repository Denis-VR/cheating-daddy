const { BrowserWindow } = require('electron');

const SHORTCUT_ROWS = [
    ['toggleVisibility', 'Показать / скрыть окно', 'Вернуть окно после кнопки «Скрыть». Сессия и запись не останавливаются.'],
    ['shortcutsHelp', 'Открыть / закрыть шпаргалку', 'Работает и когда основное окно скрыто. Escape закрывает только шпаргалку.'],
    ['pause', 'Пауза / продолжить аудио', 'Приостанавливает обработку разговора. Ввод текста и снимки остаются доступны.'],
    [
        'nextStep',
        'Начать сессию / снять экран',
        'На главной запускает сессию. В API/CLI-сессии прикрепляет снимок: добавьте задание и отправьте. В потоковом режиме сразу отправляет экран на анализ.',
    ],
    ['previousResponse', 'Предыдущий ответ', 'Перейти к предыдущей видимой теме, сохранив положение чтения.'],
    ['nextResponse', 'Следующий ответ', 'Перейти к следующей видимой теме, в том числе к пришедшему в фоне ответу.'],
    ['focusMode', 'Только ответ / настройки', 'Скрывает верхние инструменты для чтения ответа. Повторное нажатие возвращает их.'],
    ['toggleTeleprompter', 'Суфлёр', 'Включает или останавливает автопрокрутку ответа. Скорость меняется кнопками − и +.'],
    ['increaseFont', 'Увеличить шрифт', 'Увеличивает шрифт ответа.'],
    ['decreaseFont', 'Уменьшить шрифт', 'Уменьшает шрифт ответа.'],
    ['scrollUp', 'Прокрутить ответ вверх', 'Ручная прокрутка текста текущего ответа.'],
    ['scrollDown', 'Прокрутить ответ вниз', 'Ручная прокрутка текста текущего ответа.'],
    ['toggleClickThrough', 'Пропускать клики', 'Клики проходят в окно под приложением. Если кнопки перестали нажиматься, нажмите сочетание ещё раз.'],
    ['decreaseOpacity', 'Прозрачнее окно', 'Меняет прозрачность для вас; не скрывает окно от демонстрации экрана.'],
    ['increaseOpacity', 'Плотнее окно', 'Возвращает читаемость полупрозрачному окну.'],
    ['moveUp', 'Сдвинуть окно вверх', 'Перемещает основное окно, не меняя текст ответа.'],
    ['moveDown', 'Сдвинуть окно вниз', 'Перемещает основное окно.'],
    ['moveLeft', 'Сдвинуть окно влево', 'Перемещает основное окно.'],
    ['moveRight', 'Сдвинуть окно вправо', 'Перемещает основное окно.'],
];

function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function renderShortcutsHelp(keybinds) {
    const rows = SHORTCUT_ROWS.map(([id, label, description]) => {
        const keys = id === 'pause' ? (process.platform === 'darwin' ? 'Cmd+P' : 'Ctrl+P') : keybinds[id] || 'Не назначено';
        return `<details><summary><span>${escapeHtml(label)}</span><kbd>${escapeHtml(keys)}</kbd></summary><p>${escapeHtml(description)}</p></details>`;
    });
    return `<!doctype html><html lang="ru"><head><meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
        <title>Горячие клавиши</title><style>
        :root{color-scheme:dark}body{margin:0;padding:24px;background:#14161b;color:#f0f2f6;font:14px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
        h1{font-size:23px;margin:0 0 8px}p{color:#b9c2d1}details{border-bottom:1px solid #343a46;padding:10px 0}summary{cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:16px}summary:hover{color:#a8c7ff}kbd{white-space:nowrap;background:#252c38;border:1px solid #455166;border-radius:6px;padding:3px 8px;font-size:12px}details p{margin:9px 0 2px}.note{border:1px solid #66583a;background:#29251d;border-radius:8px;padding:12px}h2{font-size:16px;margin:20px 0 4px}
        @media(max-width:420px){body{padding:14px}summary{flex-wrap:wrap;gap:6px}}
        </style></head><body><h1>Горячие клавиши</h1>
        <p>Нажмите на строку, чтобы узнать подробности. Закрыть: Escape, красная кнопка окна или повторное сочетание шпаргалки.</p>
        <p class="note">Это отдельное окно с включённой защитой от захвата, даже если основное окно видно при демонстрации. На современных macOS запись всего экрана через ScreenCaptureKit может показать его. Демонстрируйте отдельное окно браузера или редактора; проверьте видимость со второго устройства до звонка.</p>
        <h2>Самое нужное</h2>${rows.slice(0, 8).join('')}
        <h2>Чтение и управление окном</h2>${rows.slice(8).join('')}
        <p>Сочетания показаны с учётом ваших настроек. Меняются в «Настройки → Горячие клавиши». Полное руководство по темам, инструментам и автоответам — в разделе «Помощь» основного окна. После переназначения откройте шпаргалку заново.</p>
        </body></html>`;
}

function toggleShortcutsHelp(mainWindow, keybinds) {
    if (mainWindow.isDestroyed()) return;
    const existing = mainWindow._shortcutsHelp;
    if (existing && !existing.isDestroyed()) {
        existing.close();
        return;
    }
    const win = new BrowserWindow({
        title: 'Горячие клавиши',
        width: 650,
        height: 700,
        minWidth: 360,
        minHeight: 300,
        show: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        autoHideMenuBar: true,
        backgroundColor: '#14161b',
        webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, javascript: false },
    });
    mainWindow._shortcutsHelp = win;
    // Apply before showing, independently of the main window's sharing preference.
    win.setContentProtection(true);
    if (process.platform === 'darwin') win.setHiddenInMissionControl(true);
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    win.webContents.on('will-navigate', event => event.preventDefault());
    win.webContents.on('before-input-event', (event, input) => {
        if (input.type === 'keyDown' && input.key === 'Escape') {
            event.preventDefault();
            win.close();
        }
    });
    const close = () => {
        if (!win.isDestroyed()) win.close();
    };
    mainWindow.once('closed', close);
    mainWindow.on('hide', close);
    win.on('closed', () => {
        if (mainWindow._shortcutsHelp === win) mainWindow._shortcutsHelp = null;
        mainWindow.removeListener('closed', close);
        mainWindow.removeListener('hide', close);
    });
    win.once('ready-to-show', () => {
        if (!win.isDestroyed()) win.show();
    });
    win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(renderShortcutsHelp(keybinds)));
    return win;
}

module.exports = { renderShortcutsHelp, toggleShortcutsHelp };
