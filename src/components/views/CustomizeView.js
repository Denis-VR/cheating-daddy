import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import { unifiedPageStyles } from './sharedPageStyles.js';

export class CustomizeView extends LitElement {
    static styles = [
        unifiedPageStyles,
        css`
            .danger-surface {
                border-color: var(--danger);
            }

            .warning-callout {
                position: relative;
                margin-top: 4px;
                padding: 8px 12px;
                border: 1px solid var(--danger);
                border-radius: var(--radius-sm);
                color: var(--danger);
                font-size: var(--font-size-xs);
                line-height: 1.4;
                background: rgba(239, 68, 68, 0.06);
            }

            .warning-callout::before {
                content: '';
                position: absolute;
                top: -6px;
                left: 16px;
                width: 10px;
                height: 10px;
                background: var(--bg-surface);
                border-top: 1px solid var(--danger);
                border-left: 1px solid var(--danger);
                transform: rotate(45deg);
            }

            .toggle-row {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                padding: var(--space-sm);
                border: 1px solid var(--border);
                border-radius: var(--radius-sm);
                background: var(--bg-elevated);
            }

            .toggle-input {
                width: 14px;
                height: 14px;
                accent-color: var(--text-primary);
                cursor: pointer;
            }

            .toggle-label {
                color: var(--text-primary);
                font-size: var(--font-size-sm);
                cursor: pointer;
                user-select: none;
            }

            .slider-wrap {
                display: flex;
                flex-direction: column;
                align-items: stretch;
                gap: var(--space-xs);
            }

            .slider-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: var(--space-sm);
            }

            .slider-value {
                font-family: var(--font-mono);
                font-size: var(--font-size-xs);
                color: var(--text-secondary);
                background: var(--bg-elevated);
                border: 1px solid var(--border);
                border-radius: var(--radius-sm);
                padding: 2px 8px;
            }

            .slider-input {
                -webkit-appearance: none;
                appearance: none;
                width: 100%;
                height: 4px;
                border-radius: 2px;
                background: var(--border);
                outline: none;
                cursor: pointer;
            }

            .slider-input::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: var(--text-primary);
                border: none;
            }

            .slider-input::-moz-range-thumb {
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: var(--text-primary);
                border: none;
            }

            .keybind-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-sm) 0;
                border-bottom: 1px solid var(--border);
            }

            .keybind-row:last-of-type {
                border-bottom: none;
            }

            .keybind-name {
                color: var(--text-secondary);
                font-size: var(--font-size-sm);
            }

            .keybind-input {
                width: 140px;
                text-align: center;
                font-family: var(--font-mono);
                font-size: var(--font-size-xs);
            }

            .danger-button {
                border: 1px solid var(--danger);
                color: var(--danger);
                background: transparent;
                border-radius: var(--radius-sm);
                padding: 9px 12px;
                font-size: var(--font-size-sm);
                cursor: pointer;
                transition: background var(--transition);
            }

            .danger-button:hover {
                background: rgba(241, 76, 76, 0.11);
            }

            .danger-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .status {
                margin-top: var(--space-sm);
                padding: var(--space-sm);
                border-radius: var(--radius-sm);
                border: 1px solid var(--border);
                font-size: var(--font-size-xs);
            }

            .status.success {
                border-color: var(--success);
                color: var(--success);
            }

            .status.error {
                border-color: var(--danger);
                color: var(--danger);
            }
        `,
    ];

    static properties = {
        showInScreenSharing: { state: true },
        sharingBusy: { state: true },
        sharingError: { state: true },
        selectedProfile: { type: String },
        selectedLanguage: { type: String },
        selectedImageQuality: { type: String },
        layoutMode: { type: String },
        keybinds: { type: Object },
        googleSearchEnabled: { type: Boolean },
        backgroundTransparency: { type: Number },
        fontSize: { type: Number },
        theme: { type: String },
        onProfileChange: { type: Function },
        onLanguageChange: { type: Function },
        onImageQualityChange: { type: Function },
        onLayoutModeChange: { type: Function },
        isClearing: { type: Boolean },
        isRestoring: { type: Boolean },
        clearStatusMessage: { type: String },
        clearStatusType: { type: String },
    };

    constructor() {
        super();
        this.showInScreenSharing = false;
        this.sharingBusy = false;
        this.sharingError = '';
        this.selectedProfile = 'interview';
        this.selectedLanguage = 'en-US';
        this.selectedImageQuality = 'medium';
        this.layoutMode = 'normal';
        this.keybinds = this.getDefaultKeybinds();
        this.onProfileChange = () => {};
        this.onLanguageChange = () => {};
        this.onImageQualityChange = () => {};
        this.onLayoutModeChange = () => {};
        this.googleSearchEnabled = true;
        this.isClearing = false;
        this.isRestoring = false;
        this.clearStatusMessage = '';
        this.clearStatusType = '';
        this.backgroundTransparency = 0.8;
        this.fontSize = 20;
        this.audioMode = 'speaker_only';
        this.customPrompt = '';
        this.theme = 'dark';
        this._loadFromStorage();
    }

    getThemes() {
        return cheatingDaddy.theme.getAll();
    }

    async _loadFromStorage() {
        try {
            const [prefs, keybinds] = await Promise.all([cheatingDaddy.storage.getPreferences(), cheatingDaddy.storage.getKeybinds()]);
            this.showInScreenSharing = (await cheatingDaddy.storage.getConfig()).showInScreenSharing === true;
            this.googleSearchEnabled = prefs.googleSearchEnabled ?? true;
            this.backgroundTransparency = prefs.backgroundTransparency ?? 0.8;
            this.fontSize = prefs.fontSize ?? 20;
            this.audioMode = prefs.audioMode ?? 'speaker_only';
            this.customPrompt = prefs.customPrompt ?? '';
            this.theme = prefs.theme ?? 'dark';
            if (keybinds) {
                this.keybinds = { ...this.getDefaultKeybinds(), ...keybinds };
            }
            this.updateBackgroundAppearance();
            this.updateFontSize();
            this.requestUpdate();
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    getProfiles() {
        return [
            { value: 'interview', name: 'Собеседование' },
            { value: 'sales', name: 'Продажи' },
            { value: 'meeting', name: 'Встреча' },
            { value: 'presentation', name: 'Презентация' },
            { value: 'negotiation', name: 'Переговоры' },
            { value: 'exam', name: 'Экзамен' },
        ];
    }

    getLanguages() {
        return [
            { value: 'en-US', name: 'English (US)' },
            { value: 'en-GB', name: 'English (UK)' },
            { value: 'en-AU', name: 'English (Australia)' },
            { value: 'en-IN', name: 'English (India)' },
            { value: 'de-DE', name: 'German (Germany)' },
            { value: 'es-US', name: 'Spanish (US)' },
            { value: 'es-ES', name: 'Spanish (Spain)' },
            { value: 'fr-FR', name: 'French (France)' },
            { value: 'fr-CA', name: 'French (Canada)' },
            { value: 'hi-IN', name: 'Hindi (India)' },
            { value: 'pt-BR', name: 'Portuguese (Brazil)' },
            { value: 'ar-XA', name: 'Arabic (Generic)' },
            { value: 'id-ID', name: 'Indonesian (Indonesia)' },
            { value: 'it-IT', name: 'Italian (Italy)' },
            { value: 'ja-JP', name: 'Japanese (Japan)' },
            { value: 'tr-TR', name: 'Turkish (Turkey)' },
            { value: 'vi-VN', name: 'Vietnamese (Vietnam)' },
            { value: 'bn-IN', name: 'Bengali (India)' },
            { value: 'gu-IN', name: 'Gujarati (India)' },
            { value: 'kn-IN', name: 'Kannada (India)' },
            { value: 'ml-IN', name: 'Malayalam (India)' },
            { value: 'mr-IN', name: 'Marathi (India)' },
            { value: 'ta-IN', name: 'Tamil (India)' },
            { value: 'te-IN', name: 'Telugu (India)' },
            { value: 'nl-NL', name: 'Dutch (Netherlands)' },
            { value: 'ko-KR', name: 'Korean (South Korea)' },
            { value: 'cmn-CN', name: 'Mandarin Chinese (China)' },
            { value: 'pl-PL', name: 'Polish (Poland)' },
            { value: 'ru-RU', name: 'Russian (Russia)' },
            { value: 'th-TH', name: 'Thai (Thailand)' },
        ];
    }

    getDefaultKeybinds() {
        const isMac = cheatingDaddy.isMacOS || navigator.platform.includes('Mac');
        return {
            moveUp: 'Ctrl+Alt+Shift+Up',
            moveDown: 'Ctrl+Alt+Shift+Down',
            moveLeft: 'Ctrl+Alt+Shift+Left',
            moveRight: 'Ctrl+Alt+Shift+Right',
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
            answerLatest: isMac ? 'Cmd+Shift+Enter' : 'Ctrl+Shift+Enter',
            answerTable: isMac ? 'Cmd+Alt+1' : 'Ctrl+Alt+1',
            answerExplain: isMac ? 'Cmd+Alt+2' : 'Ctrl+Alt+2',
            answerDetails: isMac ? 'Cmd+Alt+3' : 'Ctrl+Alt+3',
            answerMissed: isMac ? 'Cmd+Alt+4' : 'Ctrl+Alt+4',
            shortcutsHelp: isMac ? 'Cmd+K' : 'Ctrl+K',
        };
    }

    getKeybindActions() {
        return [
            { key: 'shortcutsHelp', name: 'Шпаргалка горячих клавиш', description: 'Открыть отдельное окно с основными клавишами и подробностями' },
            { key: 'moveUp', name: 'Сдвинуть окно вверх', description: 'Сдвиг окна вверх' },
            { key: 'moveDown', name: 'Сдвинуть окно вниз', description: 'Сдвиг окна вниз' },
            { key: 'moveLeft', name: 'Сдвинуть окно влево', description: 'Сдвиг окна влево' },
            { key: 'moveRight', name: 'Сдвинуть окно вправо', description: 'Сдвиг окна вправо' },
            { key: 'toggleVisibility', name: 'Показать / скрыть окно', description: 'Показать или скрыть окно' },
            { key: 'toggleClickThrough', name: 'Пропускать клики', description: 'Включить или выключить пропуск кликов' },
            { key: 'nextStep', name: 'Следующий шаг', description: 'Сделать снимок и запросить следующий шаг' },
            { key: 'previousResponse', name: 'Предыдущий ответ', description: 'Перейти к предыдущему ответу' },
            { key: 'nextResponse', name: 'Следующий ответ', description: 'Перейти к следующему ответу' },
            { key: 'scrollUp', name: 'Прокрутить ответ вверх', description: 'Прокрутка ответа вверх' },
            { key: 'focusMode', name: 'Только ответ / настройки', description: 'Переключить режим чтения' },
            { key: 'increaseFont', name: 'Увеличить шрифт ответа', description: 'Увеличить шрифт во время сессии' },
            { key: 'decreaseFont', name: 'Уменьшить шрифт ответа', description: 'Уменьшить шрифт во время сессии' },
            { key: 'decreaseOpacity', name: 'Прозрачнее окно', description: 'Сделать окно прозрачнее, чтобы видеть экран под ним' },
            { key: 'increaseOpacity', name: 'Плотнее окно', description: 'Сделать окно менее прозрачным' },
            { key: 'toggleTeleprompter', name: 'Суфлёр', description: 'Включить или выключить автопрокрутку ответа' },
            {
                key: 'answerLatest',
                name: 'Ответить на последний вопрос',
                description: 'Отправить последний распознанный вопрос собеседника без мыши',
            },
            { key: 'answerTable', name: 'Таблица', description: 'Свести открытый ответ в таблицу-шпаргалку' },
            { key: 'answerExplain', name: 'Объяснить', description: 'Объяснить открытый ответ простыми словами' },
            { key: 'answerDetails', name: 'Детали', description: 'Устройство, нюансы и доп. вопросы к открытому ответу' },
            { key: 'answerMissed', name: 'Что я упустил', description: 'Сравнить сказанное в микрофон с ответом на экране' },
            { key: 'scrollDown', name: 'Прокрутить ответ вниз', description: 'Прокрутка ответа вниз' },
        ];
    }

    async saveKeybinds() {
        await cheatingDaddy.storage.setKeybinds(this.keybinds);
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('update-keybinds', this.keybinds);
        }
    }

    handleProfileSelect(e) {
        this.selectedProfile = e.target.value;
        this.onProfileChange(this.selectedProfile);
    }

    handleLanguageSelect(e) {
        this.selectedLanguage = e.target.value;
        this.onLanguageChange(this.selectedLanguage);
    }

    handleImageQualitySelect(e) {
        this.selectedImageQuality = e.target.value;
        this.onImageQualityChange(this.selectedImageQuality);
    }

    handleLayoutModeSelect(e) {
        this.layoutMode = e.target.value;
        this.onLayoutModeChange(this.layoutMode);
    }

    async handleCustomPromptInput(e) {
        this.customPrompt = e.target.value;
        await cheatingDaddy.storage.updatePreference('customPrompt', this.customPrompt);
    }

    async handleAudioModeSelect(e) {
        this.audioMode = e.target.value;
        await cheatingDaddy.storage.updatePreference('audioMode', this.audioMode);
        await cheatingDaddy.storage.updatePreference('showTranscript', true);
        this.requestUpdate();
    }

    async handleScreenSharingChange(event) {
        const input = event.target;
        this.sharingBusy = true;
        this.sharingError = '';
        try {
            const result = await window.require('electron').ipcRenderer.invoke('set-screen-sharing-visibility', input.checked);
            if (!result.success) throw Error(result.error);
            this.showInScreenSharing = input.checked;
        } catch (error) {
            input.checked = this.showInScreenSharing;
            this.sharingError = error.message;
        } finally {
            this.sharingBusy = false;
        }
    }

    async handleThemeChange(e) {
        this.theme = e.target.value;
        await cheatingDaddy.theme.save(this.theme);
        this.updateBackgroundAppearance();
        this.requestUpdate();
    }

    async handleGoogleSearchChange(e) {
        this.googleSearchEnabled = e.target.checked;
        await cheatingDaddy.storage.updatePreference('googleSearchEnabled', this.googleSearchEnabled);
        if (window.require) {
            try {
                const { ipcRenderer } = window.require('electron');
                await ipcRenderer.invoke('update-google-search-setting', this.googleSearchEnabled);
            } catch (error) {
                console.error('Failed to notify main process:', error);
            }
        }
        this.requestUpdate();
    }

    async handleBackgroundTransparencyChange(e) {
        this.backgroundTransparency = parseFloat(e.target.value);
        await cheatingDaddy.storage.updatePreference('backgroundTransparency', this.backgroundTransparency);
        this.updateBackgroundAppearance();
        this.requestUpdate();
    }

    updateBackgroundAppearance() {
        const colors = cheatingDaddy.theme.get(this.theme);
        cheatingDaddy.theme.applyBackgrounds(colors.background, this.backgroundTransparency);
    }

    async handleFontSizeChange(e) {
        this.fontSize = parseInt(e.target.value, 10);
        await cheatingDaddy.storage.updatePreference('fontSize', this.fontSize);
        this.updateFontSize();
        this.requestUpdate();
    }

    updateFontSize() {
        document.documentElement.style.setProperty('--response-font-size', `${this.fontSize}px`);
    }

    handleKeybindChange(action, value) {
        this.keybinds = { ...this.keybinds, [action]: value };
        this.saveKeybinds();
        this.requestUpdate();
    }

    handleKeybindFocus(e) {
        e.target.placeholder = 'Press key combination...';
        e.target.select();
    }

    handleKeybindInput(e) {
        e.preventDefault();
        const modifiers = [];
        if (e.ctrlKey) modifiers.push('Ctrl');
        // Electron's Cmd modifier exists only on macOS; the Windows key maps to Super.
        if (e.metaKey) modifiers.push(cheatingDaddy.isMacOS ? 'Cmd' : 'Super');
        if (e.altKey) modifiers.push('Alt');
        if (e.shiftKey) modifiers.push('Shift');
        let mainKey = e.key;

        switch (e.code) {
            case 'ArrowUp':
                mainKey = 'Up';
                break;
            case 'ArrowDown':
                mainKey = 'Down';
                break;
            case 'ArrowLeft':
                mainKey = 'Left';
                break;
            case 'ArrowRight':
                mainKey = 'Right';
                break;
            case 'Enter':
                mainKey = 'Enter';
                break;
            case 'Space':
                mainKey = 'Space';
                break;
            case 'Backslash':
                mainKey = '\\';
                break;
            default:
                if (e.key.length === 1) mainKey = e.key.toUpperCase();
                break;
        }

        if (['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) return;

        const action = e.target.dataset.action;
        const keybind = [...modifiers, mainKey].join('+');
        this.handleKeybindChange(action, keybind);
        e.target.value = keybind;
        e.target.blur();
    }

    async resetKeybinds() {
        this.keybinds = this.getDefaultKeybinds();
        await cheatingDaddy.storage.setKeybinds(null);
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('update-keybinds', this.keybinds);
        }
        this.requestUpdate();
    }

    async restoreAllSettings() {
        if (this.isRestoring) return;
        this.isRestoring = true;
        this.clearStatusMessage = '';
        this.clearStatusType = '';
        this.requestUpdate();
        try {
            // Restore all preferences to defaults
            const defaults = {
                customPrompt: '',
                selectedProfile: 'interview',
                selectedLanguage: 'en-US',
                selectedScreenshotInterval: '5',
                selectedImageQuality: 'medium',
                audioMode: 'speaker_only',
                fontSize: 20,
                backgroundTransparency: 0.8,
                googleSearchEnabled: false,
                theme: 'dark',
            };
            for (const [key, value] of Object.entries(defaults)) {
                await cheatingDaddy.storage.updatePreference(key, value);
            }

            // Restore keybinds
            this.keybinds = this.getDefaultKeybinds();
            await cheatingDaddy.storage.setKeybinds(null);
            if (window.require) {
                const { ipcRenderer } = window.require('electron');
                ipcRenderer.send('update-keybinds', this.keybinds);
            }

            // Apply to local state
            this.selectedProfile = defaults.selectedProfile;
            this.selectedLanguage = defaults.selectedLanguage;
            this.selectedImageQuality = defaults.selectedImageQuality;
            this.audioMode = defaults.audioMode;
            this.fontSize = defaults.fontSize;
            this.backgroundTransparency = defaults.backgroundTransparency;
            this.googleSearchEnabled = defaults.googleSearchEnabled;
            this.customPrompt = defaults.customPrompt;
            this.theme = defaults.theme;

            // Notify parent callbacks
            this.onProfileChange(defaults.selectedProfile);
            this.onLanguageChange(defaults.selectedLanguage);
            this.onImageQualityChange(defaults.selectedImageQuality);

            // Apply visual changes
            this.updateBackgroundAppearance();
            this.updateFontSize();
            await cheatingDaddy.theme.save(defaults.theme);

            this.clearStatusMessage = 'Настройки сброшены';
            this.clearStatusType = 'success';
        } catch (error) {
            console.error('Ошибка сброса настроек:', error);
            this.clearStatusMessage = `Ошибка сброса настроек: ${error.message}`;
            this.clearStatusType = 'error';
        } finally {
            this.isRestoring = false;
            this.requestUpdate();
        }
    }

    async clearLocalData() {
        if (this.isClearing) return;
        this.isClearing = true;
        this.clearStatusMessage = '';
        this.clearStatusType = '';
        this.requestUpdate();
        try {
            await cheatingDaddy.storage.clearAll();
            this.clearStatusMessage = 'Локальные данные удалены';
            this.clearStatusType = 'success';
            this.requestUpdate();
            setTimeout(() => {
                this.clearStatusMessage = 'Закрытие приложения…';
                this.requestUpdate();
                setTimeout(async () => {
                    if (window.require) {
                        const { ipcRenderer } = window.require('electron');
                        await ipcRenderer.invoke('quit-application');
                    }
                }, 1000);
            }, 2000);
        } catch (error) {
            console.error('Ошибка удаления данных:', error);
            this.clearStatusMessage = `Ошибка удаления данных: ${error.message}`;
            this.clearStatusType = 'error';
        } finally {
            this.isClearing = false;
            this.requestUpdate();
        }
    }

    renderAudioSection() {
        return html`
            <section class="surface">
                <div class="surface-title">Звук</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Источник звука</label>
                        <select class="control" .value=${this.audioMode} @change=${this.handleAudioModeSelect}>
                            <option value="speaker_only">Звук компьютера — звонки, видео, голосовые</option>
                            <option value="mic_only">Только микрофон</option>
                            <option value="both">Звук компьютера + микрофон</option>
                        </select>
                    </div>
                    ${this.audioMode !== 'speaker_only'
                        ? html` <div class="warning-callout">Микрофон отображается отдельно от речи собеседника.</div> `
                        : ''}
                    <div class="form-group">
                        <label class="form-label">Качество снимков</label>
                        <select class="control" .value=${this.selectedImageQuality} @change=${this.handleImageQualitySelect}>
                            <option value="high">Высокое</option>
                            <option value="medium">Среднее</option>
                            <option value="low">Низкое</option>
                        </select>
                    </div>
                </div>
            </section>
        `;
    }

    renderLanguageSection() {
        return html`
            <section class="surface">
                <div class="surface-title">Язык</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Язык распознавания</label>
                        <select class="control" .value=${this.selectedLanguage} @change=${this.handleLanguageSelect}>
                            ${this.getLanguages().map(
                                language =>
                                    html`<option value=${language.value} ?selected=${language.value === this.selectedLanguage}>
                                        ${new Intl.DisplayNames(['ru'], { type: 'language' }).of(language.value)}
                                    </option>`
                            )}
                        </select>
                    </div>
                </div>
            </section>
        `;
    }

    renderAppearanceSection() {
        return html`
            <section class="surface">
                <div class="surface-title">Внешний вид</div>
                <label class="toggle-row">
                    <span class="toggle-label">Показывать окно при демонстрации экрана</span>
                    <input
                        class="toggle-input"
                        type="checkbox"
                        .checked=${this.showInScreenSharing}
                        ?disabled=${this.sharingBusy}
                        @change=${this.handleScreenSharingChange}
                    />
                </label>
                ${this.sharingError ? html`<div role="alert">${this.sharingError}</div>` : ''}
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Тема</label>
                        <select class="control" .value=${this.theme} @change=${this.handleThemeChange}>
                            ${this.getThemes().map(theme => html`<option value=${theme.value}>${theme.name}</option>`)}
                        </select>
                    </div>
                    <div class="form-group slider-wrap">
                        <div class="slider-header">
                            <label class="form-label">Прозрачность фона</label>
                            <span class="slider-value">${Math.round(this.backgroundTransparency * 100)}%</span>
                        </div>
                        <input
                            class="slider-input"
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            .value=${this.backgroundTransparency}
                            @input=${this.handleBackgroundTransparencyChange}
                        />
                    </div>
                    <div class="form-group slider-wrap">
                        <div class="slider-header">
                            <label class="form-label">Размер текста ответа</label>
                            <span class="slider-value">${this.fontSize}px</span>
                        </div>
                        <input
                            class="slider-input"
                            type="range"
                            min="12"
                            max="32"
                            step="1"
                            .value=${this.fontSize}
                            @input=${this.handleFontSizeChange}
                        />
                    </div>
                </div>
            </section>
        `;
    }

    renderKeyboardSection() {
        return html`
            <section class="surface">
                <div class="surface-title">Горячие клавиши</div>
                ${this.getKeybindActions().map(
                    action => html`
                        <div class="keybind-row">
                            <span class="keybind-name">${action.name}</span>
                            <input
                                type="text"
                                class="control keybind-input"
                                .value=${this.keybinds[action.key]}
                                data-action=${action.key}
                                @keydown=${this.handleKeybindInput}
                                @focus=${this.handleKeybindFocus}
                                readonly
                            />
                        </div>
                    `
                )}
                <div style="margin-top: var(--space-sm);">
                    <button class="control" style="width:auto;padding:8px 10px;" @click=${this.resetKeybinds}>Сбросить сочетания</button>
                </div>
            </section>
        `;
    }

    renderPrivacySection() {
        return html`
            <section class="surface danger-surface">
                <div class="surface-title danger">Данные и конфиденциальность</div>
                <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;">
                    <button class="danger-button" @click=${this.restoreAllSettings} ?disabled=${this.isRestoring}>
                        ${this.isRestoring ? 'Сброс…' : 'Сбросить настройки'}
                    </button>
                    <button class="danger-button" @click=${this.clearLocalData} ?disabled=${this.isClearing}>
                        ${this.isClearing ? 'Удаление…' : 'Удалить все данные'}
                    </button>
                </div>
                ${this.clearStatusMessage
                    ? html` <div class="status ${this.clearStatusType === 'success' ? 'success' : 'error'}">${this.clearStatusMessage}</div> `
                    : ''}
            </section>
        `;
    }

    render() {
        return html`
            <div class="unified-page">
                <div class="unified-wrap">
                    <div class="page-title">Настройки</div>
                    ${this.renderAudioSection()} ${this.renderLanguageSection()} ${this.renderAppearanceSection()} ${this.renderKeyboardSection()}
                    ${this.renderPrivacySection()}
                </div>
            </div>
        `;
    }
}

customElements.define('customize-view', CustomizeView);
