import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

import { InterviewTools } from './InterviewTools.js';

export class AssistantView extends LitElement {
    static styles = css`
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

        /* ── Response navigation strip ── */

        .response-nav {
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

        .response-counter {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
            font-family: var(--font-mono);
            min-width: 40px;
            text-align: center;
        }

        /* ── Bottom input bar ── */

        .input-bar {
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            padding: var(--space-md);
            background: var(--bg-app);
        }

        .input-bar-inner {
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
    };

    constructor() {
        super();
        this.responses = [];
        this.manualRequestRevision = 0;
        this.currentResponseIndex = -1;
        this.selectedProfile = 'interview';
        this.onSendText = () => {};
        this.isAnalyzing = false;
        this._animFrame = null;
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
        for (const heading of [...doc.querySelectorAll('h2')]) {
            if (!['Объяснить', 'Углубиться'].includes(heading.textContent.trim())) continue;
            const details = doc.createElement('details');
            const summary = doc.createElement('summary');
            summary.textContent = heading.textContent;
            details.appendChild(summary);
            heading.before(details);
            let node = heading.nextSibling;
            while (node && !(node.nodeType === 1 && ['H2', 'HR'].includes(node.tagName))) {
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

            ipcRenderer.on('navigate-previous-response', this.handlePreviousResponse);
            ipcRenderer.on('navigate-next-response', this.handleNextResponse);
            ipcRenderer.on('scroll-response-up', this.handleScrollUp);
            ipcRenderer.on('scroll-response-down', this.handleScrollDown);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._stopWaveformAnimation();

        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            if (this.handlePreviousResponse) ipcRenderer.removeListener('navigate-previous-response', this.handlePreviousResponse);
            if (this.handleNextResponse) ipcRenderer.removeListener('navigate-next-response', this.handleNextResponse);
            if (this.handleScrollUp) ipcRenderer.removeListener('scroll-response-up', this.handleScrollUp);
            if (this.handleScrollDown) ipcRenderer.removeListener('scroll-response-down', this.handleScrollDown);
            if (this.handleFontStep) ipcRenderer.removeListener('response-font-step', this.handleFontStep);
        }
    }

    changeFontSize(step) {
        const root = document.documentElement;
        const current = parseFloat(getComputedStyle(root).getPropertyValue('--response-font-size')) || 24;
        const size = Math.max(12, Math.min(48, current + step));
        root.style.setProperty('--response-font-size', `${size}px`);
        window.cheatingDaddy.storage.updatePreference('fontSize', size).catch(console.error);
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
            container.querySelectorAll('details').forEach((d, i) => {
                d.open = expanded[i] || false;
            });
            container.scrollTop = changedAnswer ? 0 : scrollTop;
            if (this.shouldAnimateResponse) {
                this.dispatchEvent(new CustomEvent('response-animation-complete', { bubbles: true, composed: true }));
            }
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
                                  title="Только ответ / настройки (Cmd/Ctrl+Shift+F)"
                                  @click=${() => {
                                      owner.focusMode = !owner.focusMode;
                                  }}
                              >
                                  ${this.focusMode ? '⚙ Настройки' : 'Только ответ'}</button
                              ><button class="analyze-btn" @click=${() => this.changeFontSize(2)}>A+</button
                              ><button
                                  class="analyze-btn"
                                  @click=${() => {
                                      owner.togglePause();
                                  }}
                              >
                                  ${this.paused ? 'Продолжить' : 'Пауза'}</button
                              ><button class="analyze-btn" title="Завершить сессию" @click=${() => owner.endSession()}>⏹</button>`
                        : html` <button
                              class="analyze-btn"
                              title="Только ответ / настройки (Cmd/Ctrl+Shift+F)"
                              @click=${() => {
                                  owner.focusMode = !owner.focusMode;
                              }}
                          >
                              ${this.focusMode ? '⚙ Настройки' : 'Только ответ'}
                          </button>`
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
            <div class="response-container" id="responseContainer"></div>

            ${
                hasMultipleResponses
                    ? html`
                          <div class="response-nav">
                              <button class="nav-btn" @click=${this.navigateToPreviousResponse} ?disabled=${position <= 0} title="Previous response">
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
                <button
                    class="analyze-btn"
                    ?disabled=${this.isAnalyzing}
                    title="Прикрепить скриншот. Можно также вставить изображение в поле ввода."
                    @click=${() => this.shadowRoot.querySelector('#screenshotFile').click()}
                >
                    📎 Скриншот
                </button>
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
