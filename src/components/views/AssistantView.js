import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

import { InterviewTools } from './InterviewTools.js';

const DEFAULT_QUICK_ACTIONS = [
    ...['Короче', 'Пример на Go', 'Почему?', 'Сравнить'].map(label => ({ label, prompt: label })),
    {
        label: 'STAR-история',
        prompt: 'Перескажи ответ как историю по STAR (ситуация, задача, действия, результат) от первого лица, опираясь на мой опыт из резюме. 4–6 предложений, готово для произнесения вслух.',
    },
    {
        label: 'Сложность O()',
        prompt: 'Оцени временную и пространственную сложность решения в нотации O() и кратко объясни, откуда она берётся. Если есть более оптимальный вариант, назови его.',
    },
    {
        label: 'Вопросы интервьюеру',
        prompt: 'Предложи 3 коротких уточняющих вопроса к интервьюеру по этой теме, которые помогут выиграть время и покажут глубину понимания.',
    },
];

const TELEPROMPTER_SPEED = { min: 10, max: 200, step: 10 };

function clampSpeed(value) {
    return Math.max(TELEPROMPTER_SPEED.min, Math.min(TELEPROMPTER_SPEED.max, Math.round(value)));
}

async function copyText(text) {
    try {
        window.require('electron').clipboard.writeText(text);
    } catch (_) {
        await navigator.clipboard.writeText(text);
    }
}

export class AssistantView extends LitElement {
    static styles = css`
        interview-tools[design-active] ~ .response-container,
        interview-tools[design-active] ~ .response-nav,
        interview-tools[design-active] ~ .input-bar,
        interview-tools[design-active] ~ .quick-followups,
        interview-tools[design-active] ~ .action-editor,
        interview-tools[design-active] ~ .attachments,
        interview-tools[design-active] ~ .transcript {
            display: none !important;
        }

        :host {
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        * {
            font-family: var(--font);
            cursor: default;
        }

        .attachments {
            display: flex;
            gap: 8px;
            align-items: center;
            padding: 6px 12px;
            flex-shrink: 0;
        }
        .attachment {
            position: relative;
        }
        .attachment img {
            width: 64px;
            height: 42px;
            object-fit: cover;
            border-radius: 6px;
        }
        .attachment button {
            position: absolute;
            right: -4px;
            top: -4px;
            border-radius: 50%;
            cursor: pointer;
        }
        .attachments select {
            font: inherit;
            color: var(--text-primary);
            background: var(--bg-elevated);
            padding: 6px;
            border: 1px solid var(--border);
            border-radius: 6px;
        }
        #textInput {
            font-size: 18px;
        }
        /* ── Response area ── */

        .response-container {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            font-size: var(--response-font-size, 24px);
            line-height: 1.65;
            background: var(--bg-app);
            padding: var(--space-sm) var(--space-md);
            scroll-behavior: smooth;
            user-select: text;
            cursor: text;
            color: var(--text-primary);
        }

        .response-container * {
            user-select: text;
            cursor: text;
        }

        .response-container a {
            cursor: pointer;
        }

        .response-container [data-word] {
            display: inline-block;
        }

        /* ── Markdown ── */

        .response-container h1,
        .response-container h2,
        .response-container h3,
        .response-container h4,
        .response-container h5,
        .response-container h6 {
            margin: 1em 0 0.5em 0;
            color: var(--text-primary);
            font-weight: var(--font-weight-semibold);
        }

        .response-container h1 {
            font-size: 1.5em;
        }
        .response-container h2 {
            font-size: 1.3em;
        }
        .response-container h3 {
            font-size: 1.15em;
        }
        .response-container h4 {
            font-size: 1.05em;
        }
        .response-container h5,
        .response-container h6 {
            font-size: 1em;
        }

        .response-container p {
            margin: 0.6em 0;
            color: var(--text-primary);
        }

        .response-container ul,
        .response-container ol {
            margin: 0.6em 0;
            padding-left: 1.5em;
            color: var(--text-primary);
        }

        .response-container li {
            margin: 0.3em 0;
        }

        .response-container blockquote {
            font-size: 14px;
            line-height: 1.45;
            opacity: 0.75;
            margin: 0.8em 0;
            padding: 0.5em 1em;
            border-left: 2px solid var(--border-strong);
            background: var(--bg-surface);
            border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
        }

        .response-container code {
            background: var(--bg-elevated);
            padding: 0.15em 0.4em;
            border-radius: var(--radius-sm);
            font-family: var(--font-mono);
            font-size: 0.85em;
        }

        .response-container pre {
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: var(--space-md);
            overflow-x: auto;
            margin: 0.8em 0;
        }

        .response-container pre code {
            background: none;
            padding: 0;
        }

        .response-container a {
            color: var(--accent);
            text-decoration: underline;
            text-underline-offset: 2px;
        }

        .response-container strong,
        .response-container b {
            font-weight: var(--font-weight-semibold);
        }

        .response-container hr {
            border: none;
            border-top: 1px solid var(--border);
            margin: 1.5em 0;
        }

        .response-container .table-scroll {
            max-width: 100%;
            overflow-x: auto;
            margin: 0.8em 0;
            border: 1px solid var(--border);
            border-radius: 6px;
        }

        .response-container table {
            border-collapse: collapse;
            min-width: 100%;
            width: 100%;
            margin: 0.8em 0;
        }

        .response-container th,
        .response-container td {
            border: 1px solid var(--border);
            padding: var(--space-sm);
            text-align: left;
        }

        .response-container th {
            background: var(--bg-surface);
            font-weight: var(--font-weight-semibold);
        }

        .response-container::-webkit-scrollbar {
            width: 6px;
        }

        .response-container::-webkit-scrollbar-track {
            background: transparent;
        }

        .response-container::-webkit-scrollbar-thumb {
            background: var(--border-strong);
            border-radius: 3px;
        }

        .response-container::-webkit-scrollbar-thumb:hover {
            background: #444444;
        }

        .response-container pre {
            position: relative;
        }

        .response-container .copy-code {
            position: absolute;
            top: 6px;
            right: 6px;
            font-family: var(--font);
            font-size: 12px;
            line-height: 1;
            padding: 5px 8px;
            border-radius: var(--radius-sm);
            border: 1px solid var(--border-strong);
            background: var(--bg-elevated);
            color: var(--text-secondary);
            cursor: pointer;
            opacity: 0.55;
            user-select: none;
            transition:
                opacity var(--transition),
                color var(--transition);
        }

        .response-container pre:hover .copy-code,
        .response-container .copy-code.copied {
            opacity: 1;
        }

        .response-container .copy-code:hover {
            color: var(--text-primary);
        }

        .response-container .copy-code.copied {
            color: var(--success);
            border-color: var(--success);
        }

        /* ── Live transcript ── */

        .transcript {
            position: relative;
            flex-shrink: 0;
            padding: 6px 36px 6px var(--space-md);
            border-bottom: 1px solid var(--border);
            background: var(--bg-surface);
            font-size: 13px;
            line-height: 1.45;
            color: var(--text-muted);
            user-select: text;
        }

        .transcript-line {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .transcript-line.latest {
            color: var(--text-secondary);
            white-space: normal;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }

        .transcript-line .who {
            font-weight: var(--font-weight-semibold);
            color: var(--text-secondary);
            margin-right: 4px;
        }

        .transcript-line .who.me {
            color: var(--accent);
        }

        .transcript-hide {
            position: absolute;
            top: 4px;
            right: 8px;
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: 16px;
            line-height: 1;
            padding: 2px 4px;
            cursor: pointer;
        }

        .transcript-hide:hover {
            color: var(--text-primary);
        }

        /* ── Teleprompter ── */

        .tp-controls {
            position: absolute;
            left: var(--space-md);
            display: flex;
            align-items: center;
            gap: 2px;
        }

        .nav-text-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: var(--font-size-xs);
            font-family: var(--font);
            cursor: pointer;
            padding: var(--space-xs) 6px;
            border-radius: var(--radius-sm);
            transition: color var(--transition);
        }

        .nav-text-btn:hover,
        .nav-text-btn.on {
            color: var(--text-primary);
        }

        .nav-text-btn.on {
            background: rgba(59, 130, 246, 0.16);
        }

        .tp-speed {
            font-size: var(--font-size-xs);
            font-family: var(--font-mono);
            color: var(--text-muted);
            min-width: 22px;
            text-align: center;
        }

        /* ── Response navigation strip ── */

        .response-nav {
            position: relative;
            min-height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--space-sm);
            padding: var(--space-xs) var(--space-md);
            border-top: 1px solid var(--border);
            background: var(--bg-app);
        }

        .nav-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: var(--space-xs);
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color var(--transition);
        }

        .nav-btn:hover:not(:disabled) {
            color: var(--text-primary);
        }

        .nav-btn:disabled {
            opacity: 0.25;
            cursor: default;
        }

        .nav-btn svg {
            width: 14px;
            height: 14px;
        }

        .copy-answer {
            position: absolute;
            right: var(--space-md);
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: var(--font-size-xs);
            font-family: var(--font);
            cursor: pointer;
            padding: var(--space-xs);
            transition: color var(--transition);
        }

        .copy-answer:hover,
        .copy-answer.copied {
            color: var(--text-primary);
        }

        .response-counter {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
            font-family: var(--font-mono);
            min-width: 40px;
            text-align: center;
        }

        /* ── Bottom input bar ── */

        .action-editor {
            padding: 8px 10px;
            max-height: 40vh;
            overflow-y: auto;
            flex-shrink: 0;
        }
        .action-row {
            display: grid;
            grid-template-columns: minmax(70px, 1fr) minmax(100px, 2fr) auto;
            gap: 6px;
            margin-bottom: 6px;
        }
        .action-row input,
        .action-row textarea {
            min-width: 0;
            color: var(--text-primary);
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 6px;
            font: inherit;
            font-size: 13px;
        }
        .quick-followups {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            padding: 6px 10px;
            flex-shrink: 0;
        }
        .quick-followups .analyze-btn {
            font-size: 13px;
            padding: 6px 10px;
        }

        .input-bar {
            flex-wrap: wrap;
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            padding: var(--space-md);
            background: var(--bg-app);
        }

        .input-bar-inner {
            min-width: 120px;
            display: flex;
            align-items: center;
            flex: 1;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: 100px;
            padding: 0 var(--space-md);
            height: 32px;
            transition: border-color var(--transition);
        }

        .input-bar-inner:focus-within {
            border-color: var(--accent);
        }

        .input-bar-inner input {
            flex: 1;
            background: none;
            color: var(--text-primary);
            border: none;
            padding: 0;
            font-size: var(--font-size-sm);
            font-family: var(--font);
            height: 100%;
            outline: none;
        }

        .input-bar-inner input::placeholder {
            color: var(--text-muted);
        }

        .analyze-btn {
            position: relative;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            color: var(--text-primary);
            cursor: pointer;
            font-size: var(--font-size-xs);
            font-family: var(--font-mono);
            white-space: nowrap;
            padding: var(--space-xs) var(--space-md);
            border-radius: 100px;
            height: 32px;
            display: flex;
            align-items: center;
            gap: 4px;
            transition:
                border-color 0.4s ease,
                background var(--transition);
            flex-shrink: 0;
            overflow: hidden;
        }

        .focus-toolbar .analyze-btn {
            min-height: 34px;
            height: auto;
            padding: 7px 9px;
            font: 14px/18px var(--font);
            border-radius: 7px;
        }

        .analyze-btn:hover:not(.analyzing) {
            border-color: var(--accent);
            background: var(--bg-surface);
        }

        .analyze-btn.analyzing {
            cursor: default;
            border-color: transparent;
        }

        .analyze-btn-content {
            display: flex;
            align-items: center;
            gap: 4px;
            transition: opacity 0.4s ease;
            z-index: 1;
            position: relative;
        }

        .analyze-btn.analyzing .analyze-btn-content {
            opacity: 0;
        }

        .analyze-canvas {
            position: absolute;
            inset: -1px;
            width: calc(100% + 2px);
            height: calc(100% + 2px);
            pointer-events: none;
        }
    `;

    static properties = {
        quickActions: { state: true },
        actionDraft: { state: true },
        actionError: { state: true },
        actionSaving: { state: true },
        pendingImage: { state: true },
        attachments: { state: true },
        hostedMode: { type: Boolean },
        focusMode: { type: Boolean },
        paused: { type: Boolean },
        responses: { type: Array },
        manualRequestRevision: { type: Number },
        currentResponseIndex: { type: Number },
        selectedProfile: { type: String },
        onSendText: { type: Function },
        shouldAnimateResponse: { type: Boolean },
        isAnalyzing: { type: Boolean, state: true },
        answerCopied: { state: true },
        transcript: { type: Array },
        showTranscript: { state: true },
        teleprompterOn: { state: true },
        teleprompterSpeed: { state: true },
    };

    constructor() {
        super();
        this.responses = [];
        this.quickActions = DEFAULT_QUICK_ACTIONS.map(a => ({ ...a }));
        this.actionDraft = null;
        this.manualRequestRevision = 0;
        this.currentResponseIndex = -1;
        this.selectedProfile = 'interview';
        this.onSendText = () => {};
        this.isAnalyzing = false;
        this._animFrame = null;
        this.transcript = [];
        this.showTranscript = true;
        this.teleprompterOn = false;
        this.teleprompterSpeed = 30;
    }

    getProfileNames() {
        return {
            interview: 'Job Interview',
            sales: 'Sales Call',
            meeting: 'Business Meeting',
            presentation: 'Presentation',
            negotiation: 'Negotiation',
            exam: 'Exam Assistant',
        };
    }

    getCurrentResponse() {
        const profileNames = this.getProfileNames();
        return this.responses.length > 0 && this.currentResponseIndex >= 0
            ? this.responses[this.currentResponseIndex]
            : `Listening to your ${profileNames[this.selectedProfile] || 'session'}...`;
    }

    renderMarkdown(content) {
        if (typeof window !== 'undefined' && window.marked) {
            try {
                window.marked.setOptions({
                    breaks: true,
                    gfm: true,
                    sanitize: false,
                });
                content = content.replace(/^#{1,6}\s+Сказать сейчас\s*$/gm, '').replace(/^\*\*Ваш запрос\*\*\s*$/gm, '');
                let rendered = window.marked.parse(content);
                rendered = window
                    .require('dompurify')(window)
                    .sanitize(rendered, { USE_PROFILES: { html: true }, FORBID_TAGS: ['img', 'video', 'audio', 'style', 'form', 'input', 'button'] });
                rendered = this.wrapWordsInSpans(rendered);
                return rendered;
            } catch (error) {
                console.warn('Error parsing markdown:', error);
                return content;
            }
        }
        return content;
    }

    wrapWordsInSpans(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        for (const code of doc.querySelectorAll('pre code')) {
            if (!window.hljs || code.textContent.length > 80000) continue;
            const language = [...code.classList].find(name => name.startsWith('language-'))?.slice(9);
            try {
                const result =
                    language && window.hljs.getLanguage(language)
                        ? window.hljs.highlight(code.textContent, { language, ignoreIllegals: true })
                        : window.hljs.highlightAuto(
                              code.textContent,
                              ['go', 'javascript', 'typescript', 'python', 'sql', 'java', 'bash', 'json'].filter(name =>
                                  window.hljs.getLanguage(name)
                              )
                          );
                code.innerHTML = result.value;
                code.classList.add('hljs');
            } catch (_) {
                /* Keep escaped plain code for unsupported input. */
            }
        }
        for (const heading of [...doc.querySelectorAll('h2, h3')]) {
            const section = heading.textContent.trim().match(/^(Объяснить|Углубиться)(?=$|[\s(:—–-])/i)?.[1];
            if (!section) continue;
            const details = doc.createElement('details');
            const summary = doc.createElement('summary');
            summary.textContent = section[0].toUpperCase() + section.slice(1).toLowerCase();
            details.open = false;
            details.appendChild(summary);
            heading.before(details);
            let node = heading.nextSibling;
            while (
                node &&
                !(
                    node.nodeType === 1 &&
                    (node.tagName === 'HR' || (/^H[1-6]$/.test(node.tagName) && Number(node.tagName[1]) <= Number(heading.tagName[1])))
                )
            ) {
                const next = node.nextSibling;
                details.appendChild(node);
                node = next;
            }
            heading.remove();
        }
        const tagsToSkip = ['PRE'];

        function wrap(node) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() && !tagsToSkip.includes(node.parentNode.tagName)) {
                const words = node.textContent.split(/(\s+)/);
                const frag = document.createDocumentFragment();
                words.forEach(word => {
                    if (word.trim()) {
                        const span = document.createElement('span');
                        span.setAttribute('data-word', '');
                        span.textContent = word;
                        frag.appendChild(span);
                    } else {
                        frag.appendChild(document.createTextNode(word));
                    }
                });
                node.parentNode.replaceChild(frag, node);
            } else if (node.nodeType === Node.ELEMENT_NODE && !tagsToSkip.includes(node.tagName)) {
                Array.from(node.childNodes).forEach(wrap);
            }
        }
        Array.from(doc.body.childNodes).forEach(wrap);
        doc.querySelectorAll('table').forEach(table => {
            const wrapper = doc.createElement('div');
            wrapper.className = 'table-scroll';
            wrapper.setAttribute('role', 'region');
            wrapper.setAttribute('aria-label', 'Таблица ответа');
            wrapper.setAttribute('tabindex', '0');
            table.replaceWith(wrapper);
            wrapper.appendChild(table);
        });
        return doc.body.innerHTML;
    }

    navigateToPreviousResponse() {
        if (this.currentResponseIndex > 0) {
            let next = this.currentResponseIndex - 1;
            const meta = window.cheatingDaddy?.element()?.topicMeta || [];
            while (next >= 0 && meta[next]?.hidden) next--;
            if (next < 0) return;
            this.currentResponseIndex = next;
            this.dispatchEvent(
                new CustomEvent('response-index-changed', {
                    detail: { index: this.currentResponseIndex },
                })
            );
            this.requestUpdate();
        }
    }

    navigateToNextResponse() {
        if (this.currentResponseIndex < this.responses.length - 1) {
            let next = this.currentResponseIndex + 1;
            const meta = window.cheatingDaddy?.element()?.topicMeta || [];
            while (next < this.responses.length && meta[next]?.hidden) next++;
            if (next >= this.responses.length) return;
            this.currentResponseIndex = next;
            this.dispatchEvent(
                new CustomEvent('response-index-changed', {
                    detail: { index: this.currentResponseIndex },
                })
            );
            this.requestUpdate();
        }
    }

    scrollResponseUp() {
        const container = this.shadowRoot.querySelector('.response-container');
        if (container) {
            const scrollAmount = container.clientHeight * 0.3;
            container.scrollTop = Math.max(0, container.scrollTop - scrollAmount);
        }
    }

    scrollResponseDown() {
        const container = this.shadowRoot.querySelector('.response-container');
        if (container) {
            const scrollAmount = container.clientHeight * 0.3;
            container.scrollTop = Math.min(container.scrollHeight - container.clientHeight, container.scrollTop + scrollAmount);
        }
    }

    connectedCallback() {
        super.connectedCallback();
        window.cheatingDaddy?.storage
            ?.getPreferences()
            .then(prefs => {
                if (Array.isArray(prefs.quickActions))
                    this.quickActions = prefs.quickActions.filter(a => a && typeof a.label === 'string' && typeof a.prompt === 'string').slice(0, 12);
                if (prefs.showTranscript === false) this.showTranscript = false;
                if (Number.isFinite(prefs.teleprompterSpeed)) this.teleprompterSpeed = clampSpeed(prefs.teleprompterSpeed);
            })
            .catch(console.error);

        if (window.require) {
            const { ipcRenderer } = window.require('electron');

            this.handlePreviousResponse = () => this.navigateToPreviousResponse();
            this.handleNextResponse = () => this.navigateToNextResponse();
            this.handleScrollUp = () => this.scrollResponseUp();
            this.handleScrollDown = () => this.scrollResponseDown();
            this.handleFontStep = (_event, step) => {
                const now = Date.now();
                if (now - (this._lastFontShortcut || 0) < 80) return;
                this._lastFontShortcut = now;
                this.changeFontSize(step);
            };
            ipcRenderer.on('response-font-step', this.handleFontStep);
            this.handleTeleprompterToggle = () => this.toggleTeleprompter();
            ipcRenderer.on('toggle-teleprompter', this.handleTeleprompterToggle);

            ipcRenderer.on('navigate-previous-response', this.handlePreviousResponse);
            ipcRenderer.on('navigate-next-response', this.handleNextResponse);
            ipcRenderer.on('scroll-response-up', this.handleScrollUp);
            ipcRenderer.on('scroll-response-down', this.handleScrollDown);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._stopWaveformAnimation();
        this.stopTeleprompter();

        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            if (this.handlePreviousResponse) ipcRenderer.removeListener('navigate-previous-response', this.handlePreviousResponse);
            if (this.handleNextResponse) ipcRenderer.removeListener('navigate-next-response', this.handleNextResponse);
            if (this.handleScrollUp) ipcRenderer.removeListener('scroll-response-up', this.handleScrollUp);
            if (this.handleScrollDown) ipcRenderer.removeListener('scroll-response-down', this.handleScrollDown);
            if (this.handleFontStep) ipcRenderer.removeListener('response-font-step', this.handleFontStep);
            if (this.handleTeleprompterToggle) ipcRenderer.removeListener('toggle-teleprompter', this.handleTeleprompterToggle);
        }
    }

    changeFontSize(step) {
        const root = document.documentElement;
        const current = parseFloat(getComputedStyle(root).getPropertyValue('--response-font-size')) || 24;
        const size = Math.max(12, Math.min(48, current + step));
        root.style.setProperty('--response-font-size', `${size}px`);
        window.cheatingDaddy.storage.updatePreference('fontSize', size).catch(console.error);
    }
    async saveQuickActions() {
        if (this.actionSaving) return;
        const actions = this.actionDraft.map(a => ({ label: a.label.trim(), prompt: a.prompt.trim() }));
        if (actions.length > 12 || actions.some(a => !a.label || !a.prompt || a.label.length > 40 || a.prompt.length > 3000)) {
            this.actionError = 'Заполните название и запрос';
            return;
        }
        this.actionSaving = true;
        try {
            const result = await window.cheatingDaddy.storage.updatePreference('quickActions', actions);
            if (!result.success) throw Error(result.error || 'Не удалось сохранить');
            this.quickActions = actions;
            this.actionDraft = null;
            this.actionError = '';
        } catch (e) {
            this.actionError = e.message;
        } finally {
            this.actionSaving = false;
        }
    }

    async handleQuickFollowup(text) {
        if (this.isAnalyzing || this.currentResponseIndex < 0) return;
        const tools = this.shadowRoot.querySelector('interview-tools');
        if (!tools || tools.busy) return;
        this.isAnalyzing = true;
        try {
            await tools.perform(async () => {
                await tools.ask(text, { routing: 'current' });
                tools.status = '';
            });
        } finally {
            this.isAnalyzing = false;
        }
    }

    async handleSendText() {
        if (this.isAnalyzing) return;
        const textInput = this.shadowRoot.querySelector('#textInput');
        const message = textInput?.value.trim() || '';
        const tools = this.shadowRoot.querySelector('interview-tools');
        if (tools && (message || tools.files.length)) {
            if (tools.busy) return;
            const files = [...tools.files];
            textInput.value = '';
            const sent = await tools.perform(async () => {
                await tools.ask(message || 'Разбери задание на изображении', {
                    images: files.map(f => f.url.split(',')[1]),
                    imageMode: tools.imageMode,
                    routing: tools.routing === 'new' ? 'new' : 'current',
                });
                tools.files = [];
                tools.notifyAttachments();
                tools.tab = '';
                tools.status = '';
            });
            if (!sent && !textInput.value) textInput.value = message;
            return;
        }
        if (this.pendingImage) {
            const file = this.pendingImage;
            this.isAnalyzing = true;
            try {
                const result = await window.attachScreenshot(file, message);
                if (result.success) {
                    this.pendingImage = null;
                    textInput.value = '';
                }
            } finally {
                this.isAnalyzing = false;
            }
        } else if (message) {
            const tools = this.shadowRoot.querySelector('interview-tools');
            if (tools) {
                const sent = await tools.perform(async () => {
                    await tools.ask(message, { routing: 'current' });
                    tools.status = 'Ответ готов';
                });
                if (sent && textInput.value.trim() === message) textInput.value = '';
            } else {
                textInput.value = '';
                await this.onSendText(message);
            }
        }
    }

    handleTextKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSendText();
        }
    }

    handleImageFile(file) {
        if (!file || this.isAnalyzing) return;
        const tools = this.shadowRoot.querySelector('interview-tools');
        if (tools) {
            if (tools.busy) return;
            tools.addFiles([file]);
            return;
        }
        this.pendingImage = file;
        this.shadowRoot.querySelector('#textInput')?.focus();
    }

    handleImagePaste(event) {
        const item = [...(event.clipboardData?.items || [])].find(item => item.type.startsWith('image/'));
        if (item) {
            event.preventDefault();
            this.handleImageFile(item.getAsFile());
        }
    }

    async handleScreenAnswer() {
        const tools = this.shadowRoot.querySelector('interview-tools');
        if (tools) {
            tools.capture();
            return;
        }
        if (this.isAnalyzing) return;
        if (window.captureManualScreenshot) {
            this.isAnalyzing = true;
            try {
                await window.captureManualScreenshot();
            } finally {
                this.isAnalyzing = false;
            }
        }
    }

    _startWaveformAnimation() {
        const canvas = this.shadowRoot.querySelector('.analyze-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const dangerColor = getComputedStyle(this).getPropertyValue('--danger').trim() || '#EF4444';
        const startTime = performance.now();
        const FADE_IN = 0.5; // seconds
        const PARTICLE_SPREAD = 4; // px inward from border
        const PARTICLE_COUNT = 250;

        // Pill perimeter helpers
        const w = rect.width;
        const h = rect.height;
        const r = h / 2; // pill radius = half height
        const straightLen = w - 2 * r;
        const arcLen = Math.PI * r;
        const perimeter = 2 * straightLen + 2 * arcLen;

        // Given a distance along the perimeter, return {x, y, nx, ny} (position + inward normal)
        const pointOnPerimeter = d => {
            d = ((d % perimeter) + perimeter) % perimeter;
            // Top straight: left to right
            if (d < straightLen) {
                return { x: r + d, y: 0, nx: 0, ny: 1 };
            }
            d -= straightLen;
            // Right arc
            if (d < arcLen) {
                const angle = -Math.PI / 2 + (d / arcLen) * Math.PI;
                return {
                    x: w - r + Math.cos(angle) * r,
                    y: r + Math.sin(angle) * r,
                    nx: -Math.cos(angle),
                    ny: -Math.sin(angle),
                };
            }
            d -= arcLen;
            // Bottom straight: right to left
            if (d < straightLen) {
                return { x: w - r - d, y: h, nx: 0, ny: -1 };
            }
            d -= straightLen;
            // Left arc
            const angle = Math.PI / 2 + (d / arcLen) * Math.PI;
            return {
                x: r + Math.cos(angle) * r,
                y: r + Math.sin(angle) * r,
                nx: -Math.cos(angle),
                ny: -Math.sin(angle),
            };
        };

        // Pre-seed random offsets for stable particles
        const seeds = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            seeds.push({ pos: Math.random(), drift: Math.random(), depthSeed: Math.random() });
        }

        const draw = now => {
            const elapsed = (now - startTime) / 1000;
            const fade = Math.min(1, elapsed / FADE_IN);

            ctx.clearRect(0, 0, w, h);

            // ── Particle border ──
            ctx.fillStyle = dangerColor;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const s = seeds[i];
                const along = (s.pos + s.drift * elapsed * 0.03) * perimeter;
                const depth = s.depthSeed * PARTICLE_SPREAD;
                const density = 1 - depth / PARTICLE_SPREAD;

                if (Math.random() > density) continue;

                const p = pointOnPerimeter(along);
                const px = p.x + p.nx * depth;
                const py = p.y + p.ny * depth;
                const size = 0.8 + density * 0.6;

                ctx.globalAlpha = fade * density * 0.85;
                ctx.beginPath();
                ctx.arc(px, py, size, 0, Math.PI * 2);
                ctx.fill();
            }

            // ── Waveform ──
            const midY = h / 2;
            const waves = [
                { freq: 3, amp: 0.35, speed: 2.5, opacity: 0.9, width: 1.8 },
                { freq: 5, amp: 0.2, speed: 3.5, opacity: 0.5, width: 1.2 },
                { freq: 7, amp: 0.12, speed: 5, opacity: 0.3, width: 0.8 },
            ];

            for (const wave of waves) {
                ctx.beginPath();
                ctx.strokeStyle = dangerColor;
                ctx.globalAlpha = wave.opacity * fade;
                ctx.lineWidth = wave.width;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                for (let x = 0; x <= w; x++) {
                    const norm = x / w;
                    const envelope = Math.sin(norm * Math.PI);
                    const y = midY + Math.sin(norm * Math.PI * 2 * wave.freq + elapsed * wave.speed) * (midY * wave.amp) * envelope;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            ctx.globalAlpha = 1;
            this._animFrame = requestAnimationFrame(draw);
        };

        this._animFrame = requestAnimationFrame(draw);
    }

    _stopWaveformAnimation() {
        if (this._animFrame) {
            cancelAnimationFrame(this._animFrame);
            this._animFrame = null;
        }
        const canvas = this.shadowRoot.querySelector('.analyze-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            const container = this.shadowRoot.querySelector('.response-container');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }, 0);
    }

    firstUpdated() {
        super.firstUpdated();
        this.updateResponseContent();
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('responses') || changedProperties.has('currentResponseIndex')) {
            this.updateResponseContent();
        }

        if (changedProperties.has('manualRequestRevision') && this.manualRequestRevision > 0) this.scrollToBottom();

        if (changedProperties.has('isAnalyzing')) {
            if (this.isAnalyzing) {
                this._startWaveformAnimation();
            } else {
                this._stopWaveformAnimation();
            }
        }

        if (changedProperties.has('responses') && this.isAnalyzing) {
            if (this.responses.length > this._responseCountWhenStarted) {
                this.isAnalyzing = false;
            }
        }
    }

    updateResponseContent() {
        const container = this.shadowRoot.querySelector('#responseContainer');
        if (container) {
            const currentResponse = this.getCurrentResponse();
            if (this._renderedText === currentResponse && this._renderedIndex === this.currentResponseIndex) return;
            const changedAnswer = this._renderedIndex !== this.currentResponseIndex;
            const scrollTop = container.scrollTop;
            this._renderedText = currentResponse;
            this._renderedIndex = this.currentResponseIndex;
            const renderedResponse = this.renderMarkdown(currentResponse);
            const expanded = changedAnswer ? [] : [...container.querySelectorAll('details')].map(d => d.open);
            container.innerHTML = renderedResponse;
            if (this.responses.length) this.addCopyButtons(container);
            container.querySelectorAll('details').forEach((d, i) => {
                d.open = expanded[i] || false;
            });
            container.scrollTop = changedAnswer ? 0 : scrollTop;
            if (this.shouldAnimateResponse) {
                this.dispatchEvent(new CustomEvent('response-animation-complete', { bubbles: true, composed: true }));
            }
        }
    }

    addCopyButtons(container) {
        for (const pre of container.querySelectorAll('pre')) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'copy-code';
            button.textContent = 'Копировать';
            button.setAttribute('aria-label', 'Копировать код');
            pre.appendChild(button);
        }
    }

    async handleResponseClick(event) {
        const button = event.target.closest?.('.copy-code');
        if (!button) return;
        const text = button.parentElement.querySelector('code')?.textContent || '';
        try {
            await copyText(text.replace(/\n$/, ''));
            button.textContent = 'Скопировано';
            button.classList.add('copied');
        } catch (_) {
            button.textContent = 'Ошибка';
        }
        setTimeout(() => {
            button.textContent = 'Копировать';
            button.classList.remove('copied');
        }, 1500);
    }

    toggleTeleprompter() {
        if (this.teleprompterOn) this.stopTeleprompter();
        else this.startTeleprompter();
    }

    startTeleprompter() {
        const container = this.shadowRoot?.querySelector('#responseContainer');
        if (!container || this.teleprompterOn) return;
        this.teleprompterOn = true;
        container.style.scrollBehavior = 'auto';
        let position = container.scrollTop;
        let last = performance.now();
        const step = now => {
            if (!this.teleprompterOn) return;
            const elapsed = Math.min(0.1, (now - last) / 1000);
            last = now;
            // Manual scrolling or a new answer moves the reading position; continue from there.
            if (Math.abs(container.scrollTop - position) > 2) position = container.scrollTop;
            position = Math.min(container.scrollHeight - container.clientHeight, position + this.teleprompterSpeed * elapsed);
            container.scrollTop = position;
            this._teleprompterFrame = requestAnimationFrame(step);
        };
        this._teleprompterFrame = requestAnimationFrame(step);
    }

    stopTeleprompter() {
        this.teleprompterOn = false;
        cancelAnimationFrame(this._teleprompterFrame);
        const container = this.shadowRoot?.querySelector('#responseContainer');
        if (container) container.style.scrollBehavior = '';
    }

    changeTeleprompterSpeed(direction) {
        this.teleprompterSpeed = clampSpeed(this.teleprompterSpeed + direction * TELEPROMPTER_SPEED.step);
        window.cheatingDaddy.storage.updatePreference('teleprompterSpeed', this.teleprompterSpeed).catch(console.error);
    }

    setShowTranscript(visible) {
        this.showTranscript = visible;
        window.cheatingDaddy.storage.updatePreference('showTranscript', visible).catch(console.error);
    }

    renderTranscript() {
        if (!this.showTranscript || !this.transcript?.length) return '';
        const last = this.transcript.length - 1;
        return html`<div class="transcript" role="log" aria-live="polite" aria-label="Распознанная речь">
            ${this.transcript.map(
                (line, i) =>
                    html`<div class="transcript-line ${i === last ? 'latest' : ''}">
                        <span class="who ${line.channel === 'mic' ? 'me' : ''}">${line.channel === 'mic' ? 'Вы:' : 'Интервьюер:'}</span>${line.text}
                    </div>`
            )}
            <button class="transcript-hide" title="Скрыть ленту речи" aria-label="Скрыть ленту речи" @click=${() => this.setShowTranscript(false)}>
                ×
            </button>
        </div>`;
    }

    async copyCurrentAnswer() {
        const text = this.getCurrentResponse()
            .replace(/^#{1,6}\s+Сказать сейчас\s*$/gm, '')
            .replace(/^\*\*Ваш запрос\*\*\s*$/gm, '')
            .trim();
        if (!text) return;
        try {
            await copyText(text);
            this.answerCopied = true;
            clearTimeout(this._answerCopiedTimer);
            this._answerCopiedTimer = setTimeout(() => (this.answerCopied = false), 1500);
        } catch (error) {
            console.warn('Copy failed:', error);
        }
    }

    render() {
        const meta = window.cheatingDaddy?.element()?.topicMeta || [];
        const visible = this.responses.map((_, i) => i).filter(i => !meta[i]?.hidden);
        const position = visible.indexOf(this.currentResponseIndex);
        const hasMultipleResponses = visible.length > 1;

        const owner = window.cheatingDaddy.element();
        const failures = [...(owner._inlineRequests?.entries() || [])].filter(([, r]) => r.state === 'failed' && !owner.topicMeta[r.index]?.hidden);
        return html`
            <div
                class="focus-toolbar"
                style=${this.hostedMode && !this.focusMode ? 'display:none' : 'display:flex;align-items:center;justify-content:flex-end;gap:6px;padding:6px;flex-shrink:0'}
            >
                ${
                    this.focusMode
                        ? html`<button class="analyze-btn" @click=${() => this.changeFontSize(-2)}>A−</button>
                              <button
                                  class="analyze-btn"
                                  title=${`Вернуть панели (${window.cheatingDaddy.modKey}+Shift+F)`}
                                  @click=${() => {
                                      owner.focusMode = !owner.focusMode;
                                  }}
                              >
                                  Вернуть панели</button
                              ><button class="analyze-btn" @click=${() => this.changeFontSize(2)}>A+</button
                              ><button
                                  class="analyze-btn"
                                  @click=${() => {
                                      owner.togglePause();
                                  }}
                              >
                                  ${this.paused ? 'Продолжить' : 'Пауза'}</button
                              ><button class="analyze-btn" title="Завершить сессию" @click=${() => owner.endSession()}>⏹</button>`
                        : ''
                }
            </div>
            ${failures.map(([id, r]) => html`<div style="padding:6px 12px;font-size:14px">${r.question.slice(0, 80)}: ${r.error}<button class="analyze-btn" @click=${() => this.shadowRoot.querySelector('interview-tools').retry(id)}>Повторить запрос</button></div>`)}
            <link rel="stylesheet" href="assets/highlight-vscode-dark.min.css" />
            ${
                this.hostedMode
                    ? html`<interview-tools
                          style=${this.focusMode ? 'display:none' : ''}
                          @font-step=${e => this.changeFontSize(e.detail)}
                          @focus-toggle=${() => {
                              owner.focusMode = !owner.focusMode;
                          }}
                          @attachments-change=${e => {
                              this.attachments = [...e.detail];
                          }}
                          .revisionTick=${this.manualRequestRevision + this.responses.length + this.currentResponseIndex / 1000}
                      ></interview-tools>`
                    : ''
            }
            ${this.renderTranscript()}
            <div class="response-container" id="responseContainer" @click=${this.handleResponseClick}></div>

            ${
                visible.length > 0
                    ? html`
                          <div class="response-nav">
                              <div class="tp-controls">
                                  <button
                                      class="nav-text-btn ${this.teleprompterOn ? 'on' : ''}"
                                      aria-pressed=${this.teleprompterOn}
                                      title=${`Автопрокрутка ответа (${window.cheatingDaddy.modKey}+Alt+S)`}
                                      @click=${this.toggleTeleprompter}
                                  >
                                      ${this.teleprompterOn ? '❚❚ Суфлёр' : '▶ Суфлёр'}
                                  </button>
                                  <button class="nav-text-btn" title="Медленнее" aria-label="Медленнее" @click=${() => this.changeTeleprompterSpeed(-1)}>−</button>
                                  <span class="tp-speed" title="Скорость, пикселей в секунду">${this.teleprompterSpeed}</span>
                                  <button class="nav-text-btn" title="Быстрее" aria-label="Быстрее" @click=${() => this.changeTeleprompterSpeed(1)}>+</button>
                                  ${
                                      !this.showTranscript && this.transcript?.length
                                          ? html`<button class="nav-text-btn" title="Показать ленту речи" @click=${() => this.setShowTranscript(true)}>Речь</button>`
                                          : ''
                                  }
                              </div>
                              ${
                                  hasMultipleResponses
                                      ? html`<button class="nav-btn" @click=${this.navigateToPreviousResponse} ?disabled=${position <= 0} title="Previous response">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path
                                                        fill-rule="evenodd"
                                                        d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                                                        clip-rule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                            <span class="response-counter">${position + 1} / ${visible.length}</span>
                                            <button
                                                class="nav-btn"
                                                @click=${this.navigateToNextResponse}
                                                ?disabled=${position >= visible.length - 1}
                                                title="Next response"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path
                                                        fill-rule="evenodd"
                                                        d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                                                        clip-rule="evenodd"
                                                    />
                                                </svg>
                                            </button>`
                                      : ''
                              }
                              <button class="copy-answer ${this.answerCopied ? 'copied' : ''}" title="Копировать ответ" @click=${this.copyCurrentAnswer}>
                                  ${this.answerCopied ? 'Скопировано' : 'Копировать ответ'}
                              </button>
                          </div>
                      `
                    : ''
            }

            <div class="response-nav" style="display:none">
                <button class="analyze-btn" @click=${() => window.cheatingDaddy.element().openResponseCard()}>+ Новое окно ответа</button>
                ${
                    this.pendingImage
                        ? html`<span>📎 ${this.pendingImage.name || 'Скриншот'} — добавьте задание ниже</span>
                              <button
                                  class="analyze-btn"
                                  ?disabled=${this.isAnalyzing}
                                  @click=${() => {
                                      this.pendingImage = null;
                                  }}
                              >
                                  Убрать
                              </button>`
                        : ''
                }
            </div>
            ${
                (this.attachments || []).length
                    ? html`<div class="attachments">
                          ${this.attachments.map((f, i) => html`<div class="attachment"><img src=${f.url} alt=${f.name} /><button title="Убрать скриншот" @click=${() => this.shadowRoot.querySelector('interview-tools').removeAttachment(i)}>×</button></div>`)}<select
                              aria-label="Обработка скриншота"
                              @change=${e => {
                                  this.shadowRoot.querySelector('interview-tools').imageMode = e.target.value;
                              }}
                          >
                              <option value="ocr">Распознать текст</option>
                              <option value="vision">Анализ изображения</option>
                          </select>
                      </div>`
                    : ''
            }
            ${
                this.hostedMode
                    ? html`<div class="quick-followups" role="group" aria-label="Уточнить ответ">
                          ${this.quickActions.map(
                              action =>
                                  html`<button
                                      class="analyze-btn"
                                      ?disabled=${this.isAnalyzing || this.currentResponseIndex < 0 || !this.getCurrentResponse()?.trim()}
                                      @click=${() => this.handleQuickFollowup(action.prompt)}
                                  >
                                      ${action.label}
                                  </button>`
                          )}
                          <button
                              class="analyze-btn"
                              title="Изменить быстрые действия"
                              aria-label="Изменить быстрые действия"
                              @click=${() => {
                                  this.actionError = '';
                                  this.actionDraft = this.quickActions.map(a => ({ ...a }));
                              }}
                          >
                              ✎
                          </button>
                      </div>`
                    : ''
            }
            ${
                this.actionDraft
                    ? html`<div class="action-editor">
                          ${this.actionDraft.map(
                              (action, i) =>
                                  html`<div class="action-row">
                                      <input
                                          aria-label="Название действия"
                                          placeholder="Название"
                                          maxlength="40"
                                          .value=${action.label}
                                          @input=${e => {
                                              action.label = e.target.value;
                                          }}
                                      />
                                      <textarea
                                          aria-label="Запрос действия"
                                          placeholder="Запрос"
                                          maxlength="3000"
                                          .value=${action.prompt}
                                          @input=${e => {
                                              action.prompt = e.target.value;
                                          }}
                                      ></textarea>
                                      <button
                                          class="analyze-btn"
                                          aria-label="Удалить действие"
                                          ?disabled=${this.actionSaving}
                                          @click=${() => (this.actionDraft = this.actionDraft.filter((_, index) => index !== i))}
                                      >
                                          ×
                                      </button>
                                  </div>`
                          )}
                          <div class="quick-followups">
                              <button
                                  class="analyze-btn"
                                  ?disabled=${this.actionSaving || this.actionDraft.length >= 12}
                                  @click=${() => (this.actionDraft = [...this.actionDraft, { label: '', prompt: '' }])}
                              >
                                  +
                              </button>
                              <button class="analyze-btn" ?disabled=${this.actionSaving} @click=${this.saveQuickActions}>Сохранить</button>
                              <button class="analyze-btn" ?disabled=${this.actionSaving} @click=${() => (this.actionDraft = null)}>Отмена</button>
                          </div>
                          ${this.actionError ? html`<div role="alert">${this.actionError}</div>` : ''}
                      </div>`
                    : ''
            }
            <div class="input-bar">
                <div class="input-bar-inner">
                    <input
                        type="text"
                        id="textInput"
                        placeholder="Напишите вопрос или задание к скриншоту..."
                        @keydown=${this.handleTextKeydown}
                        @paste=${this.handleImagePaste}
                    />
                </div>
                <button class="analyze-btn" ?disabled=${this.isAnalyzing} @click=${this.handleSendText}>Отправить</button>
                <input
                    id="screenshotFile"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    hidden
                    @change=${e => {
                        const file = e.target.files[0];
                        e.target.value = '';
                        this.handleImageFile(file);
                    }}
                />
                <button class="analyze-btn ${this.isAnalyzing ? 'analyzing' : ''}" @click=${this.handleScreenAnswer}>
                    <canvas class="analyze-canvas"></canvas>
                    <span class="analyze-btn-content">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
                            <path
                                fill="none"
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M13 3v7h6l-8 11v-7H5z"
                            />
                        </svg>
                        Снять экран
                    </span>
                </button>
            </div>
        `;
    }
}

customElements.define('assistant-view', AssistantView);
