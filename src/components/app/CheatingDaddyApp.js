import '../views/SessionConsole.js';
import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import { MainView } from '../views/MainView.js';
import { CustomizeView } from '../views/CustomizeView.js';
import { HelpView } from '../views/HelpView.js';
import { HistoryView } from '../views/HistoryView.js';
import { AssistantView } from '../views/AssistantView.js';
import { OnboardingView } from '../views/OnboardingView.js';
import { InterviewTools } from '../views/InterviewTools.js';
import { AICustomizeView } from '../views/AICustomizeView.js';

export class CheatingDaddyApp extends LitElement {
    static styles = css`
        * {
            box-sizing: border-box;
            font-family: var(--font);
            margin: 0;
            padding: 0;
            cursor: default;
            user-select: none;
        }

        :host {
            display: block;
            width: 100%;
            height: 100vh;
            overflow: hidden;
            border-radius: 12px;
            background: var(--bg-app);
            color: var(--text-primary);
        }

        /* ── Full app shell: top bar + sidebar/content ── */

        .app-shell {
            display: flex;
            height: calc(100vh - 2px);
            margin: 1px;
            overflow: hidden;
            border: 2px solid rgba(255, 255, 255, 0.18);
            border-radius: 11px;
        }

        .top-drag-bar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            height: 38px;
            background: transparent;
        }

        .drag-region {
            flex: 1;
            height: 100%;
            -webkit-app-region: drag;
        }

        .top-drag-bar.hidden {
            display: none;
        }

        .traffic-lights {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 0 var(--space-md);
            height: 100%;
            -webkit-app-region: no-drag;
        }

        .traffic-light {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            padding: 0;
            transition: opacity 0.15s ease;
        }

        .traffic-light:hover {
            opacity: 0.8;
        }

        .traffic-light.close {
            background: #ff5f57;
        }

        .traffic-light.minimize {
            background: #febc2e;
        }

        .traffic-light.maximize {
            background: #28c840;
        }

        .sidebar {
            width: var(--sidebar-width);
            min-width: var(--sidebar-width);
            background: var(--bg-surface);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            padding: 42px 0 var(--space-md) 0;
            transition:
                width var(--transition),
                min-width var(--transition),
                opacity var(--transition);
        }

        .sidebar.hidden {
            width: 0;
            min-width: 0;
            padding: 0;
            overflow: hidden;
            border-right: none;
            opacity: 0;
        }

        .sidebar-brand {
            padding: var(--space-sm) var(--space-lg);
            padding-top: var(--space-md);
            margin-bottom: var(--space-lg);
        }

        .sidebar-brand h1 {
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
            letter-spacing: -0.01em;
        }

        .sidebar-nav {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: var(--space-xs);
            padding: 0 var(--space-sm);
            -webkit-app-region: no-drag;
        }

        .nav-item {
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            padding: var(--space-sm) var(--space-md);
            border-radius: var(--radius-md);
            color: var(--text-secondary);
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            cursor: pointer;
            transition:
                color var(--transition),
                background var(--transition);
            border: none;
            background: none;
            width: 100%;
            text-align: left;
        }

        .nav-item:hover {
            color: var(--text-primary);
            background: var(--bg-hover);
        }

        .nav-item.active {
            color: var(--text-primary);
            background: var(--bg-elevated);
        }

        .nav-item svg {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
        }

        .sidebar-footer {
            padding: var(--space-sm);
            margin-top: var(--space-sm);
            -webkit-app-region: no-drag;
        }

        .update-btn {
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            width: 100%;
            padding: var(--space-sm) var(--space-md);
            border-radius: var(--radius-md);
            border: 1px solid rgba(239, 68, 68, 0.2);
            background: rgba(239, 68, 68, 0.08);
            color: var(--danger);
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            cursor: pointer;
            text-align: left;
            transition:
                background var(--transition),
                border-color var(--transition);
            animation: update-wobble 5s ease-in-out infinite;
        }

        .update-btn:hover {
            background: rgba(239, 68, 68, 0.14);
            border-color: rgba(239, 68, 68, 0.35);
        }

        @keyframes update-wobble {
            0%,
            90%,
            100% {
                transform: rotate(0deg);
            }
            92% {
                transform: rotate(-2deg);
            }
            94% {
                transform: rotate(2deg);
            }
            96% {
                transform: rotate(-1.5deg);
            }
            98% {
                transform: rotate(1.5deg);
            }
        }

        .update-btn svg {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
        }

        .version-text {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
            padding: var(--space-xs) var(--space-md);
        }

        /* ── Main content area ── */

        .content {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            background: var(--bg-app);
        }

        /* Live mode top bar */
        .live-bar {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 var(--space-md);
            background: var(--bg-surface);
            border-bottom: 1px solid var(--border);
            height: 36px;
            -webkit-app-region: drag;
        }

        .live-bar-left {
            display: flex;
            align-items: center;
            -webkit-app-region: no-drag;
            z-index: 1;
        }

        .live-bar-back {
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted);
            cursor: pointer;
            background: none;
            border: none;
            padding: var(--space-xs);
            border-radius: var(--radius-sm);
            transition: color var(--transition);
        }

        .live-bar-back:hover {
            color: var(--text-primary);
        }

        .live-bar-back svg {
            width: 14px;
            height: 14px;
        }

        .live-bar-center {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            font-size: var(--font-size-xs);
            color: var(--text-muted);
            font-weight: var(--font-weight-medium);
            white-space: nowrap;
            pointer-events: none;
        }

        .live-bar-right {
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            min-width: 0;
            -webkit-app-region: no-drag;
            z-index: 1;
        }

        .live-bar-text {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
            font-family: var(--font-mono);
            white-space: nowrap;
        }

        .live-bar-text.clickable {
            cursor: pointer;
            transition: color var(--transition);
        }

        .live-bar-text.clickable:hover {
            color: var(--text-primary);
        }

        .live-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-left: var(--space-xs);
        }

        .live-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--danger);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6);
            animation: live-pulse 1.8s ease-out infinite;
        }

        .live-dot.paused {
            background: var(--warning);
            animation: none;
        }

        @keyframes live-pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.55);
            }
            70% {
                box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
            }
        }

        .live-bar-text.profile {
            font-family: var(--font);
        }

        .live-bar-right .live-bar-text.status {
            max-width: 220px;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .live-chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            height: 22px;
            padding: 0 10px;
            border-radius: 999px;
            border: 1px solid var(--border-strong);
            background: var(--bg-elevated);
            color: var(--text-secondary);
            font-size: var(--font-size-xs);
            font-family: var(--font);
            white-space: nowrap;
            cursor: pointer;
            transition:
                color var(--transition),
                border-color var(--transition),
                background var(--transition);
        }

        .live-chip:hover:not(:disabled) {
            color: var(--text-primary);
            border-color: var(--text-muted);
        }

        .live-chip:disabled {
            opacity: 0.5;
            cursor: default;
        }

        .live-chip.accent {
            color: var(--text-primary);
            border-color: var(--accent);
            background: rgba(59, 130, 246, 0.16);
        }

        .live-chip.warning {
            color: var(--warning);
            border-color: rgba(212, 160, 23, 0.5);
            background: rgba(212, 160, 23, 0.1);
            cursor: default;
        }

        /* Content inner */
        .content-inner {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
        }

        .home-content {
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding: 48px 24px 24px;
            min-width: 0;
        }
        .home-content > * {
            min-width: 0;
            width: 100%;
        }

        .content-inner.live {
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        /* Onboarding fills everything */
        .fullscreen {
            position: fixed;
            inset: 0;
            z-index: 100;
            background: var(--bg-app);
        }

        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }

        ::-webkit-scrollbar-track {
            background: transparent;
        }

        ::-webkit-scrollbar-thumb {
            background: var(--border-strong);
            border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #444444;
        }
    `;

    static properties = {
        focusMode: { state: true },
        _opacityHint: { state: true },
        transcriptLines: { state: true },
        recovery: { state: true },
        lastReview: { state: true },
        _preflightBusy: { state: true },

        currentView: { type: String },
        statusText: { type: String },
        startTime: { type: Number },
        isRecording: { type: Boolean },
        sessionActive: { type: Boolean },
        selectedProfile: { type: String },
        selectedLanguage: { type: String },
        responses: { type: Array },
        currentResponseIndex: { type: Number },
        selectedScreenshotInterval: { type: String },
        selectedImageQuality: { type: String },
        layoutMode: { type: String },
        _viewInstances: { type: Object, state: true },
        _isClickThrough: { state: true },
        _awaitingNewResponse: { state: true },
        shouldAnimateResponse: { type: Boolean },
        _storageLoaded: { state: true },
        _isPaused: { state: true },
        _pausePending: { state: true },
        _manualRequestRevision: { state: true },
        _starting: { state: true },
        _ending: { state: true },
        _startError: { state: true },
        _updateAvailable: { state: true },
        _whisperDownloading: { state: true },
        _localAiDownloadProgress: { state: true },
    };

    constructor() {
        super();
        this.currentView = 'main';
        this.statusText = '';
        this.startTime = null;
        this.isRecording = false;
        this.sessionActive = false;
        this.selectedProfile = 'interview';
        this.selectedLanguage = 'en-US';
        this.selectedScreenshotInterval = '5';
        this.selectedImageQuality = 'medium';
        this.layoutMode = 'normal';
        this.responses = [];
        this.topicMeta = [];
        this.transcriptLines = [];
        this._responseIds = new Map();
        this._inlineRequests = new Map();
        this._manualRequestRevision = 0;
        this._baseResponses = new Map();
        this._isPaused = false;
        this._pausePending = false;
        this._starting = false;
        this._ending = false;
        this._sessionGeneration = 0;
        this._startError = '';
        this.currentResponseIndex = -1;
        this._viewInstances = new Map();
        this._isClickThrough = false;
        this._awaitingNewResponse = false;
        this._currentResponseIsComplete = true;
        this.shouldAnimateResponse = false;
        this._storageLoaded = false;
        this._timerInterval = null;
        this._updateAvailable = false;
        this._whisperDownloading = false;
        this._localAiDownloadProgress = { active: false, label: '', percentage: null };
        this._localVersion = '';

        this._loadFromStorage();
        this._loadVersion();
    }

    async _loadVersion() {
        this._localVersion = await cheatingDaddy.getVersion().catch(() => '');
        this.requestUpdate();
    }

    async _loadFromStorage() {
        try {
            const [config, prefs] = await Promise.all([cheatingDaddy.storage.getConfig(), cheatingDaddy.storage.getPreferences()]);

            this.currentView = config.onboarded ? 'main' : 'onboarding';
            this.selectedProfile = prefs.selectedProfile ?? 'interview';
            this.selectedLanguage = prefs.selectedLanguage || 'en-US';
            this.selectedScreenshotInterval = prefs.selectedScreenshotInterval || '5';
            this.selectedImageQuality = prefs.selectedImageQuality || 'medium';
            this.layoutMode = config.layout || 'normal';

            this.recovery = (await window.require('electron').ipcRenderer.invoke('session:recovery-load')).data || null;
            this._storageLoaded = true;
            this.requestUpdate();
        } catch (error) {
            console.error('Error loading from storage:', error);
            this._storageLoaded = true;
            this.requestUpdate();
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this._recoveryTimer = setInterval(() => this.persistRecovery(), 1000);
        this._saveBeforeQuit = () => {
            if (this.sessionActive && this.hostedMode) {
                try {
                    window.require('electron').ipcRenderer.sendSync('session:recovery-sync', this.recoverySnapshot());
                } catch (e) {
                    console.error(e);
                }
            }
        };
        window.addEventListener('beforeunload', this._saveBeforeQuit);

        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.on('toggle-focus-mode', () => {
                if (this.sessionActive && Date.now() - (this._lastFocusToggle || 0) > 100) {
                    this.focusMode = !this.focusMode;
                    this._lastFocusToggle = Date.now();
                }
            });
            ipcRenderer.on('toggle-session-pause', () => {
                if (this.sessionActive) this.togglePause();
            });
            ipcRenderer.on('window-opacity-changed', (_, opacity) => {
                this._opacityHint = Math.round(opacity * 100);
                clearTimeout(this._opacityHintTimer);
                this._opacityHintTimer = setTimeout(() => (this._opacityHint = null), 1500);
            });
            ipcRenderer.on('transcript-line', (_, line) => {
                if (!line || typeof line.text !== 'string' || !line.text.trim()) return;
                this.transcriptLines = [...this.transcriptLines.slice(-2), { text: line.text.trim().slice(0, 600), channel: line.channel, at: line.at }];
            });
            ipcRenderer.on('new-response', (_, response) => this.addNewResponse(response));
            ipcRenderer.on('update-response', (_, response) => this.updateCurrentResponse(response));
            ipcRenderer.on('update-status', (_, status) => this.setStatus(status));
            ipcRenderer.on('click-through-toggled', (_, isEnabled) => {
                this._isClickThrough = isEnabled;
            });
            ipcRenderer.on('reconnect-failed', (_, data) => this.addNewResponse(data.message));
            ipcRenderer.on('whisper-downloading', (_, downloading) => {
                this._whisperDownloading = downloading;
            });
            ipcRenderer.on('local-ai-download-progress', (_, progress) => {
                this._localAiDownloadProgress = progress;
            });
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        clearInterval(this._recoveryTimer);
        window.removeEventListener('beforeunload', this._saveBeforeQuit);
        this._stopTimer();
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.removeAllListeners('toggle-focus-mode');
            ipcRenderer.removeAllListeners('toggle-session-pause');
            ipcRenderer.removeAllListeners('window-opacity-changed');
            ipcRenderer.removeAllListeners('transcript-line');
            ipcRenderer.removeAllListeners('new-response');
            ipcRenderer.removeAllListeners('update-response');
            ipcRenderer.removeAllListeners('update-status');
            ipcRenderer.removeAllListeners('click-through-toggled');
            ipcRenderer.removeAllListeners('reconnect-failed');
            ipcRenderer.removeAllListeners('whisper-downloading');
            ipcRenderer.removeAllListeners('local-ai-download-progress');
        }
    }

    // ── Timer ──

    _startTimer() {
        this._stopTimer();
        if (this.startTime) {
            this._timerInterval = setInterval(() => this.requestUpdate(), 1000);
        }
    }

    _stopTimer() {
        if (this._timerInterval) {
            clearInterval(this._timerInterval);
            this._timerInterval = null;
        }
    }

    getElapsedTime() {
        if (!this.startTime) return '0:00';
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const h = Math.floor(elapsed / 3600);
        const m = Math.floor((elapsed % 3600) / 60);
        const s = elapsed % 60;
        const pad = n => String(n).padStart(2, '0');
        if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
        return `${m}:${pad(s)}`;
    }

    // ── Status & Responses ──

    setStatus(text) {
        this.statusText = text;
        if (text.includes('Ready') || text.includes('Listening') || text.includes('Error')) {
            this._currentResponseIsComplete = true;
        }
    }

    async togglePause() {
        if (this._pausePending || !this.sessionActive) return;
        this._pausePending = true;
        try {
            const { ipcRenderer } = window.require('electron');
            const result = await ipcRenderer.invoke('set-session-paused', !this._isPaused);
            if (result.success) this._isPaused = result.paused;
            else this.setStatus(result.error);
        } catch (error) {
            this.setStatus(error.message);
        } finally {
            this._pausePending = false;
        }
    }

    editTopic(index, patch) {
        this.topicMeta[index] = { ...this.topicMeta[index], ...patch };
        this.topicMeta = [...this.topicMeta];
        this.requestUpdate();
    }
    beginInterviewRequest(question, routing = 'auto') {
        const { isFollowup } = window.require('./utils/interview-workflow');
        const viewed = this.currentResponseIndex;
        let index = this.currentResponseIndex;
        if (routing === 'auto') {
            index = -1;
            for (let i = this.topicMeta.length - 1; i >= 0; i--) {
                if (!this.topicMeta[i].hidden && isFollowup(question, this.topicMeta[i].question || this.topicMeta[i].title)) {
                    index = i;
                    break;
                }
            }
        }
        if (routing === 'new' || index < 0) {
            this.openResponseCard();
            index = this.currentResponseIndex;
        }
        this.currentResponseIndex = index;
        this.editTopic(index, { title: this.topicMeta[index]?.title || question.slice(0, 80), question, read: false });
        const request = this.beginManualRequest(question);
        // Incoming audio questions do not force the reader away from their card.
        if (routing === 'auto' && viewed >= 0) this.currentResponseIndex = viewed;
        return request;
    }
    deleteTopic(index) {
        if (!this.topicMeta[index] || this.topicMeta[index].hidden) return;
        this.editTopic(index, { hidden: true, deleted: true });
        this._baseResponses.delete(index);
        this.responses = this.responses.map((text, i) => (i === index ? '' : text));
        for (const request of this._inlineRequests.values()) if (request.index === index) request.text = '';
        if (this.currentResponseIndex === index) {
            this.currentResponseIndex = this.topicMeta.findIndex(m => !m.hidden);
            if (this.currentResponseIndex < 0) this.openResponseCard();
        }
        this.requestUpdate();
    }
    mergeTopic(indices = []) {
        const selected = [...new Set(indices)]
            .filter(i => Number.isInteger(i) && this.topicMeta[i] && !this.topicMeta[i].hidden)
            .sort((a, b) => a - b);
        if (selected.length < 2) return;
        const [target, ...sources] = selected;
        for (const source of sources) {
            this._baseResponses.set(target, [this._baseResponses.get(target), this._baseResponses.get(source)].filter(Boolean).join('\n\n---\n\n'));
            for (const request of this._inlineRequests.values()) if (request.index === source) request.index = target;
            for (const [id, index] of this._responseIds) if (index === source) this._responseIds.set(id, target);
            this.editTopic(source, { hidden: true });
        }
        this.currentResponseIndex = target;
        this._renderResponse(target);
    }
    splitTopic(requestId) {
        const entry = this._inlineRequests.get(requestId);
        if (!entry || this.topicMeta[entry.index]?.hidden) return;
        const source = entry.index;
        this.openResponseCard();
        entry.index = this.currentResponseIndex;
        this.editTopic(this.currentResponseIndex, { title: entry.question.slice(0, 80), question: entry.question });
        this._renderResponse(source);
        this._renderResponse(this.currentResponseIndex);
    }
    openResponseCard() {
        this.addNewResponse('');
        this.currentResponseIndex = this.responses.length - 1;
        this.requestUpdate();
    }

    beginManualRequest(question) {
        if (this.currentResponseIndex < 0) this.addNewResponse('');
        const id = crypto.randomUUID();
        const index = this.currentResponseIndex;
        const context = this.responses[index].slice(-30000);
        this._inlineRequests.set(id, { index, question, text: 'Ожидаю ответ…' });
        this._renderResponse(index);
        this._manualRequestRevision++;
        return { requestId: id, context };
    }

    _renderResponse(index) {
        const base = this._baseResponses.get(index) || '';
        const followups = [...this._inlineRequests.values()]
            .filter(item => item.index === index)
            .map(item => {
                const question = item.question.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '\n> ');
                return `> ${question}\n\n${item.text}`;
            });
        const text = [base, ...followups].filter(Boolean).join('\n\n---\n\n');
        this.responses = this.responses.map((value, i) => (i === index ? text : value));
        this.requestUpdate();
    }

    addNewResponse(response) {
        const id = typeof response === 'object' ? response.id : null;
        const text = typeof response === 'object' ? response.text : response;
        if (typeof text !== 'string') return;
        if (id && (this._responseIds.has(id) || this._inlineRequests.has(id))) {
            this.updateCurrentResponse(response);
            return;
        }
        const index = this.responses.length;
        if (id) this._responseIds.set(id, index);
        this._baseResponses.set(index, text);
        this.responses = [...this.responses, text];
        this.topicMeta ||= [];
        this.topicMeta = [...this.topicMeta, { title: text.slice(0, 70), read: false, pinned: false, hidden: false }];
        // Only audio turns create a new card. Manual answers stay at their origin.
        if (this.currentResponseIndex === -1) this.currentResponseIndex = 0;
        this._awaitingNewResponse = false;
        this.requestUpdate();
    }

    updateCurrentResponse(response) {
        const id = typeof response === 'object' ? response.id : null;
        const text = typeof response === 'object' ? response.text : response;
        if (typeof text !== 'string') return;
        const inline = id && this._inlineRequests.get(id);
        if (inline) {
            if (this.topicMeta?.[inline.index]?.deleted) return;
            inline.text = text;
            this._renderResponse(inline.index);
            this._awaitingNewResponse = false;
            return;
        }
        if ((id && !this._responseIds.has(id)) || !this.responses.length) {
            this.addNewResponse(response);
            return;
        }
        const index = id ? this._responseIds.get(id) : this.responses.length - 1;
        if (this.topicMeta?.[index]?.deleted) return;
        this._baseResponses.set(index, text);
        this._renderResponse(index);
    }

    // ── Navigation ──

    async navigate(view) {
        if (view !== 'assistant' && (this.sessionActive || this._starting)) await this.endSession();
        this.currentView = view;
        this.requestUpdate();
    }

    recoverySnapshot() {
        const view = this.shadowRoot?.querySelector('assistant-view');
        const tools = view?.shadowRoot?.querySelector('interview-tools');
        return {
            version: 1,
            savedAt: Date.now(),
            sessionId: this._sessionId,
            provider: this._sessionProvider,
            profile: this.selectedProfile,
            language: this.selectedLanguage,
            focus: !!this.focusMode,
            paused: !!this._isPaused,
            responses: this.responses,
            topicMeta: this.topicMeta,
            index: this.currentResponseIndex,
            base: [...this._baseResponses],
            inline: [...this._inlineRequests],
            ids: [...this._responseIds],
            draft: view?.shadowRoot?.querySelector('#textInput')?.value || '',
            scroll: view?.shadowRoot?.querySelector('#responseContainer')?.scrollTop || 0,
            questions: tools?.inbox || [],
            questionId: tools?.questionId || '',
            questionText: tools?.questionText || '',
            questionRevision: tools?.revision,
            toolState: tools
                ? {
                      tab: tools.tab,
                      collapsed: tools.collapsed,
                      code: tools.code,
                      tests: tools.tests,
                      language: tools.language,
                      files: tools.files,
                      imageMode: tools.imageMode,
                  }
                : null,
        };
    }
    async persistRecovery() {
        if (!this.sessionActive || !this.hostedMode || this._restoring || this._savingRecovery || !this._sessionId) return;
        this._savingRecovery = true;
        try {
            const snapshot = this.recoverySnapshot();
            const comparable = JSON.stringify({ ...snapshot, savedAt: 0 });
            if (comparable === this._lastRecoveryText) return;
            const result = await window.require('electron').ipcRenderer.invoke('session:recovery-save', snapshot);
            if (!result.success) throw Error(result.error);
            this._lastRecoveryText = comparable;
        } catch (e) {
            this.setStatus('Не удалось сохранить сессию: ' + e.message);
        } finally {
            this._savingRecovery = false;
        }
    }
    async discardRecovery() {
        const result = await window.require('electron').ipcRenderer.invoke('session:recovery-save', null);
        if (result.success) this.recovery = null;
        else this._startError = result.error;
    }
    async resumeSession() {
        if (!this.recovery || this._preflightBusy) return;
        this._resumeSnapshot = this.recovery;
        await cheatingDaddy.storage.updatePreference('providerMode', this.recovery.provider);
        this.selectedProfile = this.recovery.profile || 'interview';
        this.selectedLanguage = this.recovery.language || 'ru-RU';
        await this.handleStart();
    }
    async restoreRecovery(snapshot) {
        this.responses = [...snapshot.responses];
        this.topicMeta = [...snapshot.topicMeta];
        this.currentResponseIndex = snapshot.index;
        this.focusMode = snapshot.focus;
        this._baseResponses = new Map(snapshot.base);
        this._responseIds = new Map(snapshot.ids);
        this._inlineRequests = new Map(snapshot.inline);
        for (const request of this._inlineRequests.values())
            if (request.state === 'pending') {
                request.state = 'failed';
                request.error = 'Сессия прервалась. Запрос можно повторить.';
            }
        this._restoredTools = snapshot;
        this.requestUpdate();
        await this.updateComplete;
        const view = this.shadowRoot.querySelector('assistant-view');
        await view?.updateComplete;
        if (view) {
            const tools = view.shadowRoot.querySelector('interview-tools');
            if (tools?._loaded && this._restoredTools) {
                tools.restoreDraft(snapshot);
                this._restoredTools = null;
            }
            const input = view.shadowRoot.querySelector('#textInput');
            if (input) input.value = snapshot.draft;
            const container = view.shadowRoot.querySelector('#responseContainer');
            if (container) container.scrollTop = snapshot.scroll;
        }
        if (snapshot.paused && !this._isPaused) await this.togglePause();
        this.recovery = null;
    }
    async endSession() {
        if (this._ending) return;
        this._ending = true;
        const finishedId = this._sessionId;
        ++this._sessionGeneration;
        // Release UI guards even if capture or an IPC call fails during teardown.
        this.sessionActive = false;
        this._starting = false;
        this._isPaused = false;
        this._pausePending = false;
        this._stopTimer();
        this.currentView = 'main';
        try {
            cheatingDaddy.stopCapture();
        } catch (error) {
            this.setStatus(error.message);
        }
        try {
            if (window.require) {
                const ipc = window.require('electron').ipcRenderer;
                await ipc.invoke('close-session');
                if (finishedId && !this._restoring) {
                    await ipc.invoke('session:recovery-save', null);
                    this.recovery = null;
                    this._sessionId = null;
                    this._lastFinishedSessionId = finishedId;
                    const report = await ipc.invoke('session:review', finishedId);
                    this.lastReview = report.success ? report.data : null;
                }
            }
        } catch (error) {
            this.setStatus(error.message);
        } finally {
            this._ending = false;
        }
    }

    async handleClose() {
        if (this.currentView === 'assistant' || this.sessionActive || this._starting) await this.endSession();
        else if (window.require) await window.require('electron').ipcRenderer.invoke('quit-application');
    }

    async _handleMinimize() {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            await ipcRenderer.invoke('window-minimize');
        }
    }

    async handleHideToggle() {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            await ipcRenderer.invoke('toggle-window-visibility');
        }
    }

    // ── Session start ──

    async handleStart() {
        if (this._starting || this._ending || this.sessionActive || this._preflightBusy) return;
        if (this.recovery && !this._resumeSnapshot) {
            this._startError = 'Выберите «Продолжить сессию» или «Начать заново»';
            return;
        }
        this._starting = true;
        const generation = ++this._sessionGeneration;
        this._startError = '';
        try {
            this._restoring = !!this._resumeSnapshot;
            await this._startSession(generation);
            if (this.sessionActive && this._resumeSnapshot) await this.restoreRecovery(this._resumeSnapshot);
        } catch (error) {
            if (generation === this._sessionGeneration) this._startError = error.message;
        } finally {
            this._resumeSnapshot = null;
            this._restoring = false;
            if (generation === this._sessionGeneration) this._starting = false;
        }
    }

    async _startSession(generation) {
        const prefs = await cheatingDaddy.storage.getPreferences();
        if (generation !== this._sessionGeneration) return;
        const providerMode = prefs.providerMode === 'cloud' ? 'byok' : prefs.providerMode || 'byok';
        this.hostedMode = ['openai', 'openrouter'].includes(providerMode);
        this._sessionProvider = providerMode;

        if (providerMode === 'cloud') {
            const creds = await cheatingDaddy.storage.getCredentials();
            if (!creds.cloudToken || creds.cloudToken.trim() === '') {
                const mainView = this.shadowRoot.querySelector('main-view');
                if (mainView && mainView.triggerApiKeyError) {
                    mainView.triggerApiKeyError();
                }
                return;
            }

            const success = await cheatingDaddy.initializeCloud(this.selectedProfile);
            if (!success) {
                const mainView = this.shadowRoot.querySelector('main-view');
                if (mainView && mainView.triggerApiKeyError) {
                    mainView.triggerApiKeyError();
                }
                return;
            }
        } else if (providerMode === 'openai' || providerMode === 'openrouter') {
            const { ipcRenderer } = window.require('electron');
            const result = await ipcRenderer.invoke('initialize-hosted', {
                provider: providerMode,
                profile: this.selectedProfile,
                language: this.selectedLanguage,
                customPrompt: prefs.customPrompt || '',
                resumeSessionId: this._resumeSnapshot?.sessionId,
                recoveredQuestions: this._resumeSnapshot?.questions,
            });
            this._sessionId = result.sessionId;
            if (!result.success) {
                this._startError = result.error;
                this.setStatus(result.error);
                this.shadowRoot.querySelector('main-view')?.triggerApiKeyError();
                return;
            }
        } else if (providerMode === 'local') {
            const success = await cheatingDaddy.initializeLocal(this.selectedProfile);
            if (!success) {
                const mainView = this.shadowRoot.querySelector('main-view');
                if (mainView && mainView.triggerApiKeyError) {
                    mainView.triggerApiKeyError();
                }
                return;
            }
        } else {
            const apiKey = await cheatingDaddy.storage.getApiKey();
            if (!apiKey || apiKey === '') {
                const mainView = this.shadowRoot.querySelector('main-view');
                if (mainView && mainView.triggerApiKeyError) {
                    mainView.triggerApiKeyError();
                }
                return;
            }

            const success = await cheatingDaddy.initializeGemini(this.selectedProfile, this.selectedLanguage);
            if (!success) return;
        }

        if (generation !== this._sessionGeneration) return;
        this._isPaused = false;
        this._responseIds.clear();
        this._inlineRequests.clear();
        this._baseResponses.clear();
        this.responses = [];
        this.topicMeta = [];
        this.transcriptLines = [];
        this.currentResponseIndex = -1;
        this.startTime = Date.now();
        this.sessionActive = true;
        this.currentView = 'assistant';
        this._startTimer();
        const captured = await cheatingDaddy.startCapture(this.selectedScreenshotInterval, this.selectedImageQuality);
        if (generation !== this._sessionGeneration) return;
        if (!captured) {
            this._startError = 'Capture failed. Check screen recording and microphone permissions, then start again.';
            await this.handleClose();
        }
    }

    async handleCancelLocalDownload() {
        await cheatingDaddy.cancelLocalInitialization();
    }

    async handleAPIKeyHelp() {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            await ipcRenderer.invoke('open-external', 'https://cheatingdaddy.com/help/api-key');
        }
    }

    async handleGroqAPIKeyHelp() {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            await ipcRenderer.invoke('open-external', 'https://console.groq.com/keys');
        }
    }

    // ── Settings handlers ──

    async handleProfileChange(profile) {
        this.selectedProfile = profile;
        await cheatingDaddy.storage.updatePreference('selectedProfile', profile);
    }

    async handleLanguageChange(language) {
        this.selectedLanguage = language;
        await cheatingDaddy.storage.updatePreference('selectedLanguage', language);
    }

    async handleScreenshotIntervalChange(interval) {
        this.selectedScreenshotInterval = interval;
        await cheatingDaddy.storage.updatePreference('selectedScreenshotInterval', interval);
    }

    async handleImageQualityChange(quality) {
        this.selectedImageQuality = quality;
        await cheatingDaddy.storage.updatePreference('selectedImageQuality', quality);
    }

    async handleLayoutModeChange(layoutMode) {
        this.layoutMode = layoutMode;
        await cheatingDaddy.storage.updateConfig('layout', layoutMode);
        this.requestUpdate();
    }

    async handleExternalLinkClick(url) {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            await ipcRenderer.invoke('open-external', url);
        }
    }

    async handleSendText(message) {
        const request = this.beginManualRequest(message);
        this._awaitingNewResponse = true;
        try {
            const result = await window.cheatingDaddy.sendTextMessage(message, request);
            if (!result.success) {
                this._awaitingNewResponse = false;
                this.updateCurrentResponse({ id: request.requestId, text: 'Ошибка: ' + result.error });
                this.setStatus('Error sending message: ' + result.error);
            }
        } catch (error) {
            this._awaitingNewResponse = false;
            this.updateCurrentResponse({ id: request.requestId, text: 'Ошибка: ' + error.message });
            this.setStatus('Error sending message: ' + error.message);
        }
    }

    handleResponseIndexChanged(e) {
        this.currentResponseIndex = e.detail.index;
        this.shouldAnimateResponse = false;
        this.requestUpdate();
    }

    handleOnboardingComplete() {
        this.currentView = 'main';
    }

    updated(changedProperties) {
        super.updated(changedProperties);

        if (changedProperties.has('currentView') && window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('view-changed', this.currentView);
        }
    }

    // ── Helpers ──

    _isLiveMode() {
        return this.currentView === 'assistant';
    }

    // ── Render ──

    renderCurrentView() {
        switch (this.currentView) {
            case 'onboarding':
                return html`
                    <onboarding-view .onComplete=${() => this.handleOnboardingComplete()} .onClose=${() => this.handleClose()}></onboarding-view>
                `;

            case 'main':
                return html`
                    <div class="home-content">
                        <session-console .recovery=${this.recovery} .review=${this.lastReview}></session-console>
                        <main-view
                            .isInitializing=${this._starting || this._ending || this._preflightBusy}
                            .errorMessage=${this._startError}
                            .selectedProfile=${this.selectedProfile}
                            .onProfileChange=${p => this.handleProfileChange(p)}
                            .onStart=${() => this.handleStart()}
                            .onExternalLink=${url => this.handleExternalLinkClick(url)}
                            .whisperDownloading=${this._whisperDownloading}
                            .downloadProgress=${this._localAiDownloadProgress}
                            .onCancelDownload=${() => this.handleCancelLocalDownload()}
                        ></main-view>
                    </div>
                `;

            case 'ai-customize':
                return html`
                    <ai-customize-view
                        .selectedProfile=${this.selectedProfile}
                        .onProfileChange=${p => this.handleProfileChange(p)}
                    ></ai-customize-view>
                `;

            case 'customize':
                return html`
                    <customize-view
                        .selectedProfile=${this.selectedProfile}
                        .selectedLanguage=${this.selectedLanguage}
                        .selectedScreenshotInterval=${this.selectedScreenshotInterval}
                        .selectedImageQuality=${this.selectedImageQuality}
                        .layoutMode=${this.layoutMode}
                        .onProfileChange=${p => this.handleProfileChange(p)}
                        .onLanguageChange=${l => this.handleLanguageChange(l)}
                        .onScreenshotIntervalChange=${i => this.handleScreenshotIntervalChange(i)}
                        .onImageQualityChange=${q => this.handleImageQualityChange(q)}
                        .onLayoutModeChange=${lm => this.handleLayoutModeChange(lm)}
                    ></customize-view>
                `;

            case 'help':
                return html`<help-view .onExternalLinkClick=${url => this.handleExternalLinkClick(url)}></help-view>`;

            case 'preparation':
                return html`<interview-tools .preparationOnly=${true}></interview-tools>`;

            case 'history':
                return html`<history-view .initialReviewId=${this._reviewToOpen || ''}></history-view>`;

            case 'assistant':
                return html`
                    <assistant-view
                        .focusMode=${this.focusMode}
                        .paused=${this._isPaused}
                        .hostedMode=${this.hostedMode}
                        .manualRequestRevision=${this._manualRequestRevision}
                        .responses=${this.responses}
                        .transcript=${this.transcriptLines}
                        .currentResponseIndex=${this.currentResponseIndex}
                        .selectedProfile=${this.selectedProfile}
                        .onSendText=${msg => this.handleSendText(msg)}
                        .shouldAnimateResponse=${this.shouldAnimateResponse}
                        @response-index-changed=${this.handleResponseIndexChanged}
                        @response-animation-complete=${() => {
                            this.shouldAnimateResponse = false;
                            this._currentResponseIsComplete = true;
                            this.requestUpdate();
                        }}
                    ></assistant-view>
                `;

            default:
                return html`<div>Unknown view: ${this.currentView}</div>`;
        }
    }

    renderSidebar() {
        const items = [
            {
                id: 'main',
                label: 'Home',
                icon: html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                        <path
                            d="m19 8.71l-5.333-4.148a2.666 2.666 0 0 0-3.274 0L5.059 8.71a2.67 2.67 0 0 0-1.029 2.105v7.2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.2c0-.823-.38-1.6-1.03-2.105"
                        />
                        <path d="M16 15c-2.21 1.333-5.792 1.333-8 0" />
                    </g>
                </svg>`,
            },
            {
                id: 'ai-customize',
                label: 'AI Customization',
                icon: html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <path
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 3v7h6l-8 11v-7H5z"
                    />
                </svg>`,
            },
            {
                id: 'preparation',
                label: 'Preparation',
                icon: html`<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 5v16M3 3h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5v16h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3z" />
                    </g>
                </svg>`,
            },
            {
                id: 'history',
                label: 'History',
                icon: html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                        <path
                            d="M10 20.777a9 9 0 0 1-2.48-.969M14 3.223a9.003 9.003 0 0 1 0 17.554m-9.421-3.684a9 9 0 0 1-1.227-2.592M3.124 10.5c.16-.95.468-1.85.9-2.675l.169-.305m2.714-2.941A9 9 0 0 1 10 3.223"
                        />
                        <path d="M12 8v4l3 3" />
                    </g>
                </svg>`,
            },
            {
                id: 'customize',
                label: 'Settings',
                icon: html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                        <path
                            d="M19.875 6.27A2.23 2.23 0 0 1 21 8.218v7.284c0 .809-.443 1.555-1.158 1.948l-6.75 4.27a2.27 2.27 0 0 1-2.184 0l-6.75-4.27A2.23 2.23 0 0 1 3 15.502V8.217c0-.809.443-1.554 1.158-1.947l6.75-3.98a2.33 2.33 0 0 1 2.25 0l6.75 3.98z"
                        />
                        <path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0" />
                    </g>
                </svg>`,
            },
            {
                id: 'help',
                label: 'Help',
                icon: html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                        <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9s-9-1.8-9-9s1.8-9 9-9m0 13v.01" />
                        <path d="M12 13a2 2 0 0 0 .914-3.782a1.98 1.98 0 0 0-2.414.483" />
                    </g>
                </svg>`,
            },
        ];

        return html`
            <div class="sidebar ${this._isLiveMode() ? 'hidden' : ''}">
                <div class="sidebar-brand">
                    <h1>Cheating Daddy</h1>
                </div>
                <nav class="sidebar-nav">
                    ${items.map(
                        item => html`
                            <button
                                class="nav-item ${this.currentView === item.id ? 'active' : ''}"
                                @click=${() => this.navigate(item.id)}
                                title=${item.label}
                            >
                                ${item.icon} ${item.label}
                            </button>
                        `
                    )}
                </nav>
                <div class="sidebar-footer"><div class="version-text">v${this._localVersion}</div></div>
            </div>
        `;
    }

    renderLiveBar() {
        if (!this._isLiveMode()) return '';

        const profileLabels = {
            interview: 'Собеседование',
            sales: 'Продажи',
            meeting: 'Встреча',
            presentation: 'Презентация',
            negotiation: 'Переговоры',
            exam: 'Экзамен',
        };
        const waiting = this.responses.filter((_, i) => i > this.currentResponseIndex && !this.topicMeta[i]?.hidden).length;
        const showNext = () => {
            let next = this.currentResponseIndex + 1;
            while (next < this.responses.length && this.topicMeta[next]?.hidden) next++;
            if (next < this.responses.length) this.currentResponseIndex = next;
        };

        return html`
            <div class="live-bar">
                <div class="live-bar-left">
                    <button class="live-bar-back" @click=${() => this.handleClose()} title="Завершить сессию">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fill-rule="evenodd"
                                d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z"
                                clip-rule="evenodd"
                            />
                        </svg>
                    </button>
                    <div class="live-indicator" title=${this._isPaused ? 'Аудио на паузе' : 'Идёт запись'}>
                        <span class="live-dot ${this._isPaused ? 'paused' : ''}"></span>
                        <span class="live-bar-text">${this.getElapsedTime()}</span>
                        <span class="live-bar-text profile">· ${profileLabels[this.selectedProfile] || 'Сессия'}</span>
                    </div>
                </div>
                <div class="live-bar-right">
                    ${this.statusText ? html`<span class="live-bar-text status" title=${this.statusText}>${this.statusText}</span>` : ''}
                    ${this._opacityHint ? html`<span class="live-bar-text">Видимость ${this._opacityHint}%</span>` : ''}
                    ${
                        waiting > 0
                            ? html`<button class="live-chip accent" title="Следующий ответ (Cmd/Ctrl+])" @click=${showNext}>
                                  Ждут ответы · ${waiting}
                              </button>`
                            : ''
                    }
                    ${this._isClickThrough ? html`<span class="live-chip warning" title="Клики проходят сквозь окно">Сквозные клики</span>` : ''}
                    <button
                        class="live-chip"
                        ?disabled=${this._pausePending}
                        aria-pressed=${this._isPaused}
                        title="Пауза аудио (Cmd/Ctrl+P). Текст и снимок экрана остаются доступны."
                        @click=${() => this.togglePause()}
                    >
                        ${this._isPaused ? 'Продолжить' : 'Пауза'}
                    </button>
                    <button class="live-chip" title="Скрыть окно" @click=${() => this.handleHideToggle()}>Скрыть</button>
                </div>
            </div>
        `;
    }

    render() {
        // Onboarding is fullscreen, no sidebar
        if (this.currentView === 'onboarding') {
            return html` <div class="fullscreen">${this.renderCurrentView()}</div> `;
        }

        const isLive = this._isLiveMode();

        return html`
            <div class="app-shell">
                <div class="top-drag-bar ${isLive ? 'hidden' : ''}">
                    <div class="traffic-lights">
                        <button class="traffic-light close" @click=${() => this.handleClose()} title="Close"></button>
                        <button class="traffic-light minimize" @click=${() => this._handleMinimize()} title="Minimize"></button>
                        <button class="traffic-light maximize" title="Maximize"></button>
                    </div>
                    <div class="drag-region"></div>
                </div>
                ${this.renderSidebar()}
                <div class="content">
                    ${isLive && !this.focusMode ? this.renderLiveBar() : ''}
                    <div class="content-inner ${isLive ? 'live' : ''}">${this.renderCurrentView()}</div>
                </div>
            </div>
        `;
    }
}

customElements.define('cheating-daddy-app', CheatingDaddyApp);
