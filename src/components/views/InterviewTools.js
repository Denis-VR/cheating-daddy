import { layoutDiagram } from '../../utils/design-diagram.mjs';
import { html, svg, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

export class InterviewTools extends LitElement {
    static properties = {
        diagramZoom: { state: true },
        preparationOnly: { type: Boolean, reflect: true },
        tab: { state: true },
        collapsed: { state: true },
        selectedTopics: { state: true },
        splitRequestId: { state: true },
        inbox: { state: true },
        questionId: { state: true },
        questionText: { state: true },
        revision: { state: true },
        status: { state: true },
        busy: { state: true },
        workspace: { state: true },
        mode: { state: true },
        routing: { state: true },
        files: { state: true },
        imageMode: { state: true },
        ocrText: { state: true },
        code: { state: true },
        tests: { state: true },
        language: { state: true },
        execution: { state: true },
        constraint: { state: true },
        cropIndex: { state: true },
        cropStart: { state: true },
        cropEnd: { state: true },
        revisionTick: { type: Number },
    };
    static styles = css`
        :host {
            display: block;
            color: var(--text-primary);
            font-family: var(--font);
            font-size: 16px;
            position: relative;
            flex-shrink: 0;
        }
        * {
            box-sizing: border-box;
        }
        button,
        select,
        input,
        textarea {
            font: inherit;
            color: var(--text-primary);
            background: var(--bg-elevated, #191919);
            border: 1px solid var(--border);
            border-radius: 7px;
            padding: 7px;
            user-select: text;
        }
        select {
            max-width: 100%;
            min-width: 0;
        }
        button {
            cursor: pointer;
        }
        button:disabled {
            opacity: 0.45;
            cursor: default;
        }
        .options-body {
            position: absolute;
            right: 8px;
            top: 100%;
            z-index: 20;
            background: var(--bg-app, #0a0a0a);
            padding: 12px;
            display: grid;
            gap: 8px;
            border: 1px solid var(--border);
            border-radius: 8px;
        }
        summary {
            cursor: pointer;
            padding: 7px;
        }
        .active {
            border-color: var(--accent);
        }
        .bar {
            display: flex;
            gap: 6px;
            align-items: center;
            flex-wrap: wrap;
            padding: 6px;
        }
        .bar > button,
        .bar select,
        .bar summary,
        .reading-controls button {
            min-height: 34px;
            line-height: 18px;
            font-size: 14px;
            padding: 7px 9px;
            border: 1px solid var(--border);
            border-radius: 7px;
            background: var(--bg-elevated, #191919);
        }
        .reading-controls {
            margin-left: auto;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .panel {
            padding: 10px;
            max-height: 55vh;
            position: relative;
            background: #151515;
            box-shadow: none;
            overflow: auto;
            border-bottom: 1px solid var(--border);
        }
        :host([preparationOnly]) .panel {
            max-height: none;
            position: static;
            box-shadow: none;
        }
        textarea {
            width: 100%;
            min-height: 72px;
            resize: vertical;
        }
        label {
            display: block;
            margin: 8px 0 4px;
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        .mono {
            font-family: monospace;
            white-space: pre-wrap;
            overflow: auto;
            max-height: 240px;
        }
        .muted {
            color: var(--text-secondary, #b8b8b8);
        }
        .images {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        .thumb {
            max-width: 130px;
            max-height: 85px;
        }
        .crop {
            position: relative;
            display: inline-block;
            touch-action: none;
        }
        .crop img {
            max-width: 100%;
            max-height: 300px;
            pointer-events: none;
            display: block;
        }
        .selection {
            position: absolute;
            border: 2px solid #ff8b4a;
            background: #ff8b4a33;
            pointer-events: none;
        }
        .diagram {
            width: 100%;
            height: 240px;
            background: var(--bg-elevated, #191919);
        }
        :host([preparationOnly]) {
            padding: 24px;
        }
        :host([preparationOnly]) .panel {
            max-width: 1080px;
            margin: 0 auto;
            padding: 24px;
            border: 1px solid var(--border);
            border-radius: 16px;
        }
        .prep-content {
            display: grid;
            gap: 18px;
        }
        .prep-content h2,
        .design-header h2 {
            margin: 0;
            font-size: 22px;
        }
        .prep-content .bar {
            padding: 0;
        }
        .prep-content .bar select {
            flex: 1;
            min-width: 160px;
        }
        .prep-content label,
        .design-fields label,
        .design-composer label {
            display: grid;
            gap: 8px;
            margin: 0;
            min-width: 0;
            font-size: 14px;
            color: var(--text-secondary, #b8b8b8);
        }
        .prep-content input,
        .prep-content textarea,
        .design-fields textarea {
            width: 100%;
            min-width: 0;
        }
        .prep-content textarea {
            min-height: 180px;
            line-height: 1.6;
        }
        .prep-content details {
            padding: 12px;
            border: 1px solid var(--border);
            border-radius: 10px;
        }
        .prep-content .muted {
            margin: 0;
            font-size: 13px;
            line-height: 1.5;
        }
        .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
        }
        :host([design-active]) {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        :host([design-active]) .panel {
            flex: 1;
            min-height: 0;
            max-height: none;
            padding: 20px;
        }
        :host([design-active]) select[aria-label='Тема ответа'],
        :host([design-active]) select[aria-label='Формат ответа'] {
            display: none;
        }
        .design-workspace {
            max-width: 1200px;
            margin: auto;
            display: grid;
            gap: 20px;
        }
        .design-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
        }
        .design-header .bar {
            padding: 0;
        }
        .design-card {
            border: 1px solid var(--border);
            border-radius: 12px;
            background: var(--bg-elevated, #191919);
            padding: 16px;
            min-width: 0;
        }
        .design-card summary {
            padding: 0;
            font-size: 15px;
        }
        .design-card textarea {
            margin-top: 12px;
            line-height: 1.6;
            min-height: 150px;
            font-size: var(--response-font-size, 18px);
        }
        .design-composer {
            display: grid;
            gap: 10px;
        }
        .design-composer textarea {
            min-height: 85px;
            font-size: 17px;
            line-height: 1.5;
        }
        .design-composer button {
            justify-self: end;
        }
        .design-changes {
            white-space: pre-wrap;
            line-height: 1.6;
            font-size: var(--response-font-size, 18px);
        }
        .diagram {
            border-radius: 10px;
            height: auto;
            min-height: 180px;
        }
        @media (max-width: 620px) {
            :host([preparationOnly]) {
                padding: 12px;
            }
            :host([preparationOnly]) .panel,
            :host([design-active]) .panel {
                padding: 12px;
            }
            .grid {
                grid-template-columns: minmax(0, 1fr);
            }
            .design-header h2 {
                font-size: 20px;
            }
        }
        .diagram-controls {
            display: flex;
            justify-content: flex-end;
            gap: 5px;
            margin-bottom: 8px;
        }
        .diagram-controls button {
            font-size: 13px;
            min-width: 30px;
            padding: 4px 8px;
        }
        .diagram-scroll {
            overflow: auto;
            max-height: 65vh;
            border-radius: 10px;
            background: #191919;
        }
        .diagram-scroll .diagram {
            display: block;
            max-width: none;
            min-height: 0;
            margin: 0 auto;
        }
        .primary {
            border-color: var(--accent);
        }
    `;
    updated() {
        this.toggleAttribute('design-active', !this.preparationOnly && this.tab === 'design' && !this.collapsed);
    }
    constructor() {
        super();
        this.diagramZoom = 1;
        this.tab = 'questions';
        this.collapsed = false;
        this.selectedTopics = [];
        this.splitRequestId = '';
        this.inbox = [];
        this.questionId = '';
        this.questionText = '';
        this.revision = 0;
        this.status = '';
        this.busy = false;
        this.workspace = { packages: [], activePackageId: '', design: {}, designVersions: [] };
        this.mode = 'answer';
        this.routing = 'auto';
        this.files = [];
        this.imageMode = 'ocr';
        this.ocrText = '';
        this.language = 'go';
        this.code = 'package main\n\nimport "fmt"\n\nfunc main() { fmt.Println("ready") }';
        this.tests = '';
        this.execution = '';
        this.constraint = '';
        this.cropIndex = -1;
    }
    get ipc() {
        return window.require('electron').ipcRenderer;
    }
    get owner() {
        return window.cheatingDaddy.element();
    }
    async call(name, value) {
        const r = await this.ipc.invoke('interview:' + name, value);
        if (!r.success) throw new Error(r.error || r.output || 'Операция не выполнена');
        return r;
    }
    connectedCallback() {
        super.connectedCallback();
        this.onInbox = (_, items) => {
            const old = this.inbox.find(q => q.id === this.questionId);
            this.inbox = items;
            const next = items.find(q => q.id === this.questionId);
            if (old && next && this.questionText === old.text && this.revision === old.revision) this.selectQuestion(next);
            if (!this.questionId && items.length) this.selectQuestion(items[0]);
        };
        this.onPaste = event => {
            const images = [...(event.clipboardData?.items || [])].filter(i => i.type.startsWith('image/'));
            if (images.length) {
                event.preventDefault();
                if (!this.busy) this.addFiles(images.map(i => i.getAsFile()));
            }
        };
        this.addEventListener('paste', this.onPaste);
        this.ipc.on('question-inbox', this.onInbox);
        this.load();
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.ipc.removeListener('question-inbox', this.onInbox);
        this.removeEventListener('paste', this.onPaste);
    }
    async load() {
        try {
            this.workspace = (await this.call('workspace-load')).data;
            this.inbox = (await this.call('questions')).data;
            if (this.inbox.length) this.selectQuestion(this.inbox[0]);
            this._loaded = true;
            if (this.owner._restoredTools) {
                this.restoreDraft(this.owner._restoredTools);
                this.owner._restoredTools = null;
            }
        } catch (e) {
            this.status = e.message;
        }
    }
    async perform(fn) {
        if (this.busy) return;
        this.busy = true;
        this.status = 'Выполняется…';
        try {
            await fn();
            return true;
        } catch (e) {
            this.status = e.message;
            return false;
        } finally {
            this.busy = false;
        }
    }
    async persist() {
        await this.call('workspace-save', this.workspace);
        this.status = 'Сохранено. Материалы вакансии применяются при следующем запуске сессии.';
    }
    get prep() {
        return this.workspace.packages.find(p => p.id === this.workspace.activePackageId);
    }
    editPrep(field, value) {
        const p = this.prep;
        if (p) {
            p[field] = value;
            this.workspace = { ...this.workspace };
        }
    }
    selectQuestion(q) {
        this.questionId = q.id;
        this.questionText = q.text;
        this.revision = q.revision;
    }
    restoreDraft(snapshot) {
        if (snapshot.toolState)
            for (const key of ['tab', 'collapsed', 'code', 'tests', 'language', 'files', 'imageMode'])
                if (snapshot.toolState[key] !== undefined) this[key] = snapshot.toolState[key];
        this.questionId = snapshot.questionId;
        this.questionText = snapshot.questionText;
        this.revision = snapshot.questionRevision;
        this.notifyAttachments();
    }
    async retry(requestId) {
        const request = this.owner._inlineRequests.get(requestId);
        if (!request?.payload) return;
        await this.perform(() => this.ask(request.question, { ...request.payload, retryId: requestId }));
    }
    async ask(text, extras = {}) {
        if (typeof text !== 'string' || !text.trim() || text.length > 30000) throw Error('Введите запрос до 30000 символов');
        const owner = this.owner,
            generation = owner._sessionGeneration;
        const previous = extras.retryId && owner._inlineRequests.get(extras.retryId);
        const request = previous
            ? { requestId: extras.retryId, context: previous.payload.context }
            : owner.beginInterviewRequest(text, extras.routing || this.routing);
        const entry = owner._inlineRequests.get(request.requestId);
        const payload = { text, ...request, mode: this.mode, ...extras };
        delete payload.retryId;
        if (previous && payload.questionId) {
            const q = this.inbox.find(q => q.id === payload.questionId);
            if (q) payload.revision = q.revision;
            else {
                delete payload.questionId;
                delete payload.revision;
            }
        }
        entry.payload = payload;
        entry.state = 'pending';
        entry.error = '';
        owner._manualRequestRevision++;
        owner.requestUpdate();
        try {
            const result = await this.ipc.invoke('interview:ask', payload);
            if (generation !== owner._sessionGeneration) throw Error('Сессия завершена');
            if (!result.success) throw Error(result.error);
            entry.state = 'complete';
            owner._manualRequestRevision++;
            owner.requestUpdate();
            return result;
        } catch (error) {
            if (generation === owner._sessionGeneration) {
                entry.state = 'failed';
                entry.error = /fetch|network|connection/i.test(error.message)
                    ? 'Соединение прервано. Проверьте сеть и повторите этот запрос.'
                    : error.message;
                owner._manualRequestRevision++;
                owner.requestUpdate();
            }
            throw error;
        }
    }
    async sendQuestion() {
        await this.perform(async () => {
            const sentId = this.questionId;
            this.tab = '';
            await this.ask(this.questionText, { questionId: sentId, revision: this.revision });
            if (this.questionId === sentId) {
                this.questionId = '';
                this.questionText = '';
                if (this.inbox.length) this.selectQuestion(this.inbox[0]);
            }
            this.status = '';
        });
    }
    notifyAttachments() {
        this.dispatchEvent(new CustomEvent('attachments-change', { detail: this.files, bubbles: true, composed: true }));
    }
    removeAttachment(index) {
        if (this.busy) return;
        this.files = this.files.filter((_, i) => i !== index);
        this.ocrText = '';
        this.notifyAttachments();
    }
    async addFiles(files) {
        try {
            for (const file of files) {
                if (this.files.length >= 4) throw new Error('До четырёх скриншотов');
                if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)
                    throw new Error('PNG/JPEG/WebP до 10 МБ');
                const bitmap = await createImageBitmap(file);
                try {
                    const canvas = document.createElement('canvas');
                    const scale = Math.min(1, 1920 / bitmap.width);
                    canvas.width = Math.round(bitmap.width * scale);
                    canvas.height = Math.round(bitmap.height * scale);
                    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
                    this.files = [...this.files, { name: file.name || 'Скриншот', url: canvas.toDataURL('image/jpeg', 0.9) }];
                } finally {
                    bitmap.close();
                }
            }
            this.ocrText = '';
            this.notifyAttachments();
        } catch (e) {
            this.status = e.message;
        }
    }
    async capture() {
        await this.perform(async () => {
            const file = await window.captureScreenDraft();
            await this.addFiles([file]);
            this.status = '';
        });
    }
    async recognize() {
        await this.perform(async () => {
            this.ocrText = (await this.call('ocr', { images: this.files.map(f => f.url.split(',')[1]) })).text;
            this.status = 'Проверьте и отредактируйте текст, затем отправьте';
        });
    }
    async importFile(file) {
        await this.perform(async () => {
            if (!this.prep) throw new Error('Сначала создайте вакансию');
            if (file.size > 10 * 1024 * 1024) throw new Error('Файл до 10 МБ');
            const reader = new FileReader();
            const data = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            const material = (await this.call('import', { name: file.name, data })).data;
            this.prep.materials = [...this.prep.materials, material];
            this.workspace = { ...this.workspace };
            await this.persist();
        });
    }
    async updateDesign() {
        await this.perform(async () => {
            const before = { ...this.workspace.design };
            const r = await this.call('ask', {
                text: this.constraint,
                requestId: crypto.randomUUID(),
                mode: 'design',
                context: JSON.stringify(before),
            });
            let proposed;
            try {
                proposed = JSON.parse(r.text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
            } catch {
                throw new Error('Модель вернула невалидную схему. Текущая версия сохранена. Повторите запрос.');
            }
            for (const key of ['requirements', 'load', 'api', 'storage', 'components', 'decisions', 'changes'])
                if (typeof proposed[key] !== 'string' || proposed[key].length > 10000) throw new Error('Неполная схема: ' + key);
            const changed = ['requirements', 'load', 'api', 'storage', 'components', 'decisions'].filter(key => before[key] !== proposed[key]);
            proposed.changes = 'Изменены поля: ' + changed.join(', ') + '\n' + proposed.changes;
            const next = {
                ...this.workspace,
                design: proposed,
                designVersions: [...this.workspace.designVersions, { at: Date.now(), design: before }].slice(-10),
            };
            await this.call('workspace-save', next);
            this.workspace = next;
            this.status = 'Проект обновлён';
            this.constraint = '';
        });
    }
    diagram() {
        let graph;
        try {
            const source = this.workspace.design.components || '';
            if (this._diagramSource !== source) {
                this._diagramLayout = layoutDiagram(source);
                this._diagramSource = source;
            }
            graph = this._diagramLayout;
        } catch (error) {
            return html`<div role="alert">${error.message}</div>`;
        }
        return html`<div class="diagram-controls">
                <button
                    aria-label="Уменьшить схему"
                    ?disabled=${this.diagramZoom <= 0.5}
                    @click=${() => (this.diagramZoom = Math.max(0.5, this.diagramZoom - 0.25))}
                >
                    −
                </button>
                <button aria-label="Сбросить масштаб схемы" @click=${() => (this.diagramZoom = 1)}>${Math.round(this.diagramZoom * 100)}%</button>
                <button
                    aria-label="Увеличить схему"
                    ?disabled=${this.diagramZoom >= 2}
                    @click=${() => (this.diagramZoom = Math.min(2, this.diagramZoom + 0.25))}
                >
                    +
                </button>
            </div>
            <div class="diagram-scroll" tabindex="0" aria-label="Область схемы">
                <svg
                    class="diagram"
                    style=${`width:${Math.ceil(graph.width * this.diagramZoom)}px;height:${Math.ceil(graph.height * this.diagramZoom)}px`}
                    viewBox=${`0 0 ${graph.width} ${graph.height}`}
                    role="img"
                    aria-label="Схема компонентов"
                >
                    <defs>
                        <marker id="design-arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
                            <path d="M0,0 L8,4 L0,8 Z" fill="#a5b4c5" />
                        </marker>
                    </defs>
                    ${graph.edges.map(edge => svg`<path d=${edge.points.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ')} fill="none" stroke="#a5b4c5" stroke-width="1.6" stroke-linejoin="round" marker-end="url(#design-arrow)" />`)}
                    ${graph.edges.filter(edge => edge.label).map(edge => svg`<rect x=${edge.x - edge.width / 2} y=${edge.y - 12} width=${edge.width} height="24" fill="#191919" rx="4"/><text x=${edge.x} y=${edge.y + 5} text-anchor="middle" fill="#ddd" font-size="14">${edge.label}</text>`)}
                    ${graph.nodes.map(n => svg`<g><title>${n.label}</title><rect x=${n.x - n.width / 2} y=${n.y - n.height / 2} width=${n.width} height=${n.height} rx="10" fill="#202832" stroke="#778a9e" /><text text-anchor="middle" fill="#f0f3f6" font-size="16">${n.lines.map((line, i) => svg`<tspan x=${n.x} y=${n.y - (n.lines.length - 1) * 11 + 5 + i * 22}>${line}</tspan>`)}</text></g>`)}
                </svg>
            </div>`;
    }
    renderDesign() {
        return html`<div class="design-workspace">
            <div class="design-header">
                <h2>System Design</h2>
                <div class="bar">
                    <button ?disabled=${this.busy} @click=${() => this.perform(() => this.persist())}>Сохранить</button>
                    <button
                        ?disabled=${this.busy || !this.workspace.designVersions.length}
                        @click=${() =>
                            this.perform(async () => {
                                const versions = [...this.workspace.designVersions];
                                const previous = versions.pop();
                                const next = { ...this.workspace, design: previous.design, designVersions: versions };
                                await this.call('workspace-save', next);
                                this.workspace = next;
                            })}
                    >
                        Отменить изменение
                    </button>
                </div>
            </div>
            <div class="design-composer">
                <textarea
                    aria-label="Задание для System Design"
                    placeholder="Задача или новое ограничение"
                    .value=${this.constraint}
                    ?disabled=${this.busy}
                    @input=${e => (this.constraint = e.target.value)}
                ></textarea>
                <button class="primary" ?disabled=${this.busy || !this.constraint.trim()} @click=${this.updateDesign}>
                    ${this.busy ? 'Обновление…' : 'Обновить с AI'}
                </button>
            </div>
            ${
                this.workspace.design.components
                    ? html`<div class="design-card">
                          ${this.diagram()}
                          <details>
                              <summary>Редактировать схему</summary>
                              <textarea
                                  aria-label="Код схемы"
                                  .value=${this.workspace.design.components}
                                  @input=${e => this.editDesign('components', e.target.value)}
                              ></textarea>
                          </details>
                      </div>`
                    : ''
            }
            <div class="grid design-fields">
                ${[
                    ['requirements', 'Требования'],
                    ['load', 'Нагрузка'],
                    ['api', 'API'],
                    ['storage', 'Хранилища'],
                    ['decisions', 'Принятые решения'],
                ].map(
                    ([key, label]) =>
                        html`<div class="design-card">
                            <label
                                >${label}<textarea
                                    .value=${this.workspace.design[key] || ''}
                                    @input=${e => this.editDesign(key, e.target.value)}
                                ></textarea>
                            </label>
                        </div>`
                )}
            </div>
            ${
                this.workspace.design.changes
                    ? html`<details class="design-card" open>
                          <summary>Последние изменения</summary>
                          <div class="design-changes">${this.workspace.design.changes}</div>
                      </details>`
                    : ''
            }
        </div>`;
    }
    editDesign(key, value) {
        this.workspace = { ...this.workspace, design: { ...this.workspace.design, [key]: value } };
    }
    renderPreparation() {
        return html`<div class="prep-content">
            <h2>Preparation</h2>
            <div class="bar">
                <select
                    .value=${this.workspace.activePackageId}
                    @change=${e => {
                        this.workspace = { ...this.workspace, activePackageId: e.target.value };
                    }}
                >
                    <option value="">Без пакета</option>
                    ${this.workspace.packages.map(p => html`<option value=${p.id} ?selected=${p.id === this.workspace.activePackageId}>${p.name}</option>`)}</select
                ><button
                    @click=${() => {
                        const p = { id: crypto.randomUUID(), name: 'Новая вакансия', vacancy: '', experience: '', materials: [] };
                        this.workspace = { ...this.workspace, packages: [...this.workspace.packages, p], activePackageId: p.id };
                    }}
                >
                    + Вакансия</button
                ><button ?disabled=${this.busy} @click=${() => this.perform(() => this.persist())}>Сохранить</button>
            </div>
            ${
                this.prep
                    ? html`<label>Название вакансии<input .value=${this.prep.name} @input=${e => this.editPrep('name', e.target.value)} /></label>
                          <div class="grid">
                              <label
                                  >Описание вакансии<textarea
                                      .value=${this.prep.vacancy}
                                      @input=${e => this.editPrep('vacancy', e.target.value)}
                                  ></textarea></label
                              ><label
                                  >Реальные истории и достижения<textarea
                                      .value=${this.prep.experience}
                                      @input=${e => this.editPrep('experience', e.target.value)}
                                  ></textarea>
                              </label>
                          </div>
                          <label
                              >Резюме и материалы: PDF, DOCX, TXT, MD (до 10 МБ)<input
                                  type="file"
                                  accept=".pdf,.docx,.txt,.md,.json,.csv"
                                  ?disabled=${this.busy}
                                  @change=${e => {
                                      const f = e.target.files[0];
                                      if (f) this.importFile(f);
                                      e.target.value = '';
                                  }} /></label
                          >${this.prep.materials.map(
                              (m, i) =>
                                  html`<details>
                                      <summary>${m.name} · ${m.text.length} символов</summary>
                                      <textarea
                                          .value=${m.text}
                                          @input=${e => {
                                              m.text = e.target.value;
                                          }}
                                      ></textarea
                                      ><button
                                          @click=${() => {
                                              this.prep.materials = this.prep.materials.filter((_, n) => n !== i);
                                              this.workspace = { ...this.workspace };
                                          }}
                                      >
                                          Убрать документ
                                      </button>
                                  </details>`
                          )}<button
                              @click=${() => {
                                  this.workspace = {
                                      ...this.workspace,
                                      packages: this.workspace.packages.filter(p => p.id !== this.prep.id),
                                      activePackageId: '',
                                  };
                              }}
                          >
                              Удалить пакет (затем сохранить)
                          </button>`
                    : ''
            }
            <p class="muted">
                Документы хранятся локально. При запросе выбранному AI отправляются подходящие фрагменты. Проверьте распознанный текст. Неуказанные
                факты AI должен обозначать как отсутствующие.
            </p>
        </div>`;
    }
    render() {
        const selected = this.inbox.find(q => q.id === this.questionId);
        const owner = this.owner;
        const selectedTopics = this.selectedTopics.filter(i => owner.topicMeta?.[i] && !owner.topicMeta[i].hidden);
        const splitOptions =
            selectedTopics.length === 1 ? [...(owner._inlineRequests?.entries() || [])].filter(([, r]) => r.index === selectedTopics[0]) : [];
        return html` ${
            !this.preparationOnly
                ? html`<div class="bar">
                      ${[
                          ['questions', 'Вопросы ' + this.inbox.length],
                          ['topics', 'Темы'],
                      ].map(
                          ([id, label]) =>
                              html`<button
                                  class=${this.tab === id ? 'active' : ''}
                                  @click=${() => {
                                      if (this.tab === id) this.collapsed = !this.collapsed;
                                      else {
                                          this.tab = id;
                                          this.collapsed = false;
                                      }
                                  }}
                              >
                                  ${label}
                              </button>`
                      )}<select
                          aria-label="Инструменты"
                          .value=${['code', 'design', 'prep'].includes(this.tab) ? this.tab : ''}
                          @change=${e => {
                              this.tab = e.target.value;
                              this.collapsed = false;
                          }}
                      >
                          <option value="">Инструменты</option>
                          <option value="code">Проверка кода</option>
                          <option value="design">System design</option>
                          <option value="prep">Вакансия</option>
                      </select>
                      <select aria-label="Тема ответа" .value=${this.routing} @change=${e => (this.routing = e.target.value)}>
                          <option value="auto">Определить тему</option>
                          <option value="current">Текущая тема</option>
                          <option value="new">Новая тема</option>
                      </select>
                      <select aria-label="Формат ответа" .value=${this.mode} @change=${e => (this.mode = e.target.value)}>
                          <option value="answer">Ответ</option>
                          <option value="technical">Задача</option>
                      </select>
                      <span class="reading-controls"
                          ><button
                              title="Уменьшить шрифт"
                              @click=${() => this.dispatchEvent(new CustomEvent('font-step', { detail: -2, bubbles: true, composed: true }))}
                          >
                              A−</button
                          ><button
                              title="Увеличить шрифт"
                              @click=${() => this.dispatchEvent(new CustomEvent('font-step', { detail: 2, bubbles: true, composed: true }))}
                          >
                              A+
                          </button></span
                      >
                      <button
                          title=${this.collapsed ? 'Развернуть панель' : 'Свернуть панель'}
                          aria-label=${this.collapsed ? 'Развернуть панель' : 'Свернуть панель'}
                          aria-expanded=${!this.collapsed}
                          ?disabled=${!this.tab}
                          @click=${() => {
                              this.collapsed = !this.collapsed;
                          }}
                          style="width:32px;height:32px;padding:4px;display:grid;place-items:center"
                      >
                          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                              <path
                                  d=${this.collapsed ? 'M3 6l5 5 5-5' : 'M3 10l5-5 5 5'}
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                              />
                          </svg>
                      </button>
                  </div>`
                : ''
        }
        ${
            (!this.collapsed && this.tab && (this.tab !== 'questions' || selected)) || this.preparationOnly
                ? html`<div class="panel">
                      ${this.preparationOnly || this.tab === 'prep' ? this.renderPreparation() : ''}
                      ${
                          !this.preparationOnly && this.tab === 'questions'
                              ? html`${this.inbox.map(q => html`<button class=${q.id === this.questionId ? 'active' : ''} @click=${() => this.selectQuestion(q)}>${q.text.slice(0, 85)}</button>`)}${
                                    selected
                                        ? html`<textarea .value=${this.questionText} @input=${e => (this.questionText = e.target.value)}></textarea
                                              >${selected.revision !== this.revision ? html`<button @click=${() => this.selectQuestion(selected)}>Получено дополнение — загрузить новую версию</button>` : ''}<button
                                                  ?disabled=${this.busy || selected.revision !== this.revision}
                                                  @click=${this.sendQuestion}
                                              >
                                                  Ответить на вопрос</button
                                              ><button
                                                  ?disabled=${this.busy}
                                                  @click=${() =>
                                                      this.perform(async () => {
                                                          await this.call('discard-question', { id: selected.id, revision: selected.revision });
                                                          this.questionId = '';
                                                          this.questionText = '';
                                                          this.status = 'Вопрос удалён';
                                                      })}
                                              >
                                                  Пропустить
                                              </button>`
                                        : ''
                                } `
                              : ''
                      }
                      ${
                          !this.preparationOnly && this.tab === 'topics'
                              ? html`<div class="bar">
                                        <button
                                            aria-label="Новая тема"
                                            title="Новая тема"
                                            @click=${() => {
                                                owner.openResponseCard();
                                                this.tab = '';
                                            }}
                                        >
                                            +</button
                                        ><button
                                            ?disabled=${selectedTopics.length < 2}
                                            @click=${() => {
                                                owner.mergeTopic(selectedTopics);
                                                this.selectedTopics = [];
                                                this.splitRequestId = '';
                                                this.requestUpdate();
                                            }}
                                        >
                                            Объединить</button
                                        ><button
                                            ?disabled=${!splitOptions.some(([id]) => id === this.splitRequestId)}
                                            @click=${() => {
                                                owner.splitTopic(this.splitRequestId);
                                                this.selectedTopics = [];
                                                this.splitRequestId = '';
                                                this.requestUpdate();
                                            }}
                                        >
                                            Отделить
                                        </button>
                                    </div>
                                    ${(owner.topicMeta || []).map((m, i) =>
                                        m.hidden
                                            ? ''
                                            : html`<div class="bar">
                                                      <input
                                                          type="checkbox"
                                                          aria-label=${`Выбрать тему: ${m.title || 'Новая тема'}`}
                                                          .checked=${selectedTopics.includes(i)}
                                                          @change=${e => {
                                                              this.selectedTopics = e.target.checked
                                                                  ? [...selectedTopics, i]
                                                                  : selectedTopics.filter(index => index !== i);
                                                              this.splitRequestId = '';
                                                          }}
                                                      />
                                                      <button
                                                          style="flex:1;text-align:left"
                                                          class=${i === owner.currentResponseIndex ? 'active' : ''}
                                                          @click=${() => {
                                                              owner.currentResponseIndex = i;
                                                              owner.requestUpdate();
                                                              this.tab = '';
                                                          }}
                                                      >
                                                          ${m.title || 'Новая тема'}</button
                                                      ><button
                                                          aria-label="Удалить тему"
                                                          @click=${() => {
                                                              owner.deleteTopic(i);
                                                              this.requestUpdate();
                                                          }}
                                                      >
                                                          Удалить
                                                      </button>
                                                  </div>
                                                  ${
                                                      selectedTopics.length === 1 && selectedTopics[0] === i
                                                          ? html`<div class="split-choices">
                                                                ${splitOptions.map(
                                                                    ([id, r]) =>
                                                                        html`<label style="display:flex;gap:8px;align-items:center;padding:5px 10px">
                                                                            <input
                                                                                type="radio"
                                                                                name="split-request"
                                                                                aria-label=${r.question}
                                                                                .checked=${this.splitRequestId === id}
                                                                                @change=${() => (this.splitRequestId = id)}
                                                                            />
                                                                            <span>${r.question}</span>
                                                                        </label>`
                                                                )}
                                                            </div>`
                                                          : ''
                                                  }`
                                    )}`
                              : ''
                      }
                      ${
                          !this.preparationOnly && this.tab === 'code'
                              ? html`<div class="bar">
                                        <select .value=${this.language} @change=${e => (this.language = e.target.value)}>
                                            <option value="go">Go</option>
                                            <option value="python">Python</option>
                                            <option value="sql">SQL (SQLite)</option></select
                                        ><button
                                            ?disabled=${this.busy}
                                            @click=${() =>
                                                this.perform(async () => {
                                                    const r = await this.call('sandbox-check');
                                                    this.status =
                                                        'Docker: ' +
                                                        Object.entries(r.images)
                                                            .map(([k, v]) => k + ': ' + (v ? 'готов' : 'скачайте образ'))
                                                            .join(', ');
                                                })}
                                        >
                                            Проверить Docker
                                        </button>
                                        <button
                                            ?disabled=${this.busy}
                                            @click=${() =>
                                                this.perform(async () => {
                                                    this.executionSnapshot = JSON.stringify({
                                                        language: this.language,
                                                        code: this.code,
                                                        tests: '',
                                                    });
                                                    const r = await this.ipc.invoke('interview:run-code', {
                                                        language: this.language,
                                                        code: this.code,
                                                        tests: '',
                                                    });
                                                    this.execution = JSON.stringify(r, null, 2);
                                                    this.status = r.success
                                                        ? 'Проверка завершена успешно'
                                                        : r.error || 'Ошибка выполнения — смотрите вывод';
                                                })}
                                        >
                                            Запустить</button
                                        ><button
                                            ?disabled=${this.busy}
                                            @click=${() =>
                                                this.perform(async () => {
                                                    await this.ask(
                                                        'Проверь решение и объясни ошибки. Язык: ' +
                                                            this.language +
                                                            '\nКод:\n' +
                                                            this.code +
                                                            '\nВывод проверки текущего кода:\n' +
                                                            (this.executionSnapshot ===
                                                            JSON.stringify({ language: this.language, code: this.code, tests: '' })
                                                                ? this.execution
                                                                : 'Текущий код ещё не запускался'),
                                                        { mode: 'technical', routing: 'current' }
                                                    );
                                                    this.status = 'Разбор готов';
                                                })}
                                        >
                                            Разобрать с AI
                                        </button>
                                    </div>
                                    <label
                                        >Код<textarea class="mono" .value=${this.code} @input=${e => (this.code = e.target.value)}></textarea>
                                    </label>
                                    <pre class="mono">${this.execution}</pre>`
                              : ''
                      }
                      ${!this.preparationOnly && this.tab === 'design' ? this.renderDesign() : ''}
                  </div>`
                : ''
        }${this.status ? html`<div role="status" style="padding:4px 10px;font-size:14px">${this.status}</div>` : ''}`;
    }
}
customElements.define('interview-tools', InterviewTools);
