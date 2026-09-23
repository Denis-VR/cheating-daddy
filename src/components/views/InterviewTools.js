import { html, svg, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

export class InterviewTools extends LitElement {
    static properties = {
        preparationOnly: { type: Boolean, reflect: true },
        tab: { state: true },
        collapsed: { state: true },
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
            color: var(--text-muted);
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
        .primary {
            border-color: var(--accent);
        }
    `;
    constructor() {
        super();
        this.tab = 'questions';
        this.collapsed = false;
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
            this.status = 'Схема обновлена. Изменения перечислены ниже.';
        });
    }
    diagram() {
        const lines = (this.workspace.design.components || '').split(/[\n;]/);
        const nodes = new Map(),
            edges = [];
        const parse = s => {
            const m = s.trim().match(/^([\w-]+)(?:\["?([^\]"]+)"?\])?$/);
            if (!m) return null;
            nodes.set(m[1], m[2] || nodes.get(m[1]) || m[1]);
            return m[1];
        };
        for (const line of lines) {
            const parts = line.split('-->');
            if (parts.length === 2) {
                const a = parse(parts[0]),
                    b = parse(parts[1]);
                if (a && b) edges.push([a, b]);
            } else if (!line.includes('flowchart')) parse(line);
        }
        const ids = [...nodes.keys()].slice(0, 16),
            pos = id => ({ x: 20 + (ids.indexOf(id) % 4) * 185, y: 20 + Math.floor(ids.indexOf(id) / 4) * 60 });
        return html`<svg class="diagram" viewBox="0 0 760 260" role="img" aria-label="Схема компонентов">
            <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="currentColor" />
                </marker>
            </defs>
            ${edges.filter(([a, b]) => ids.includes(a) && ids.includes(b)).map(([a, b]) => svg`<line x1=${pos(a).x + 145} y1=${pos(a).y + 16} x2=${pos(b).x} y2=${pos(b).y + 16} stroke="currentColor" marker-end="url(#arrow)" />`)}${ids.map(id => svg`<rect x=${pos(id).x} y=${pos(id).y} width="145" height="32" rx="6" fill="var(--bg-app)" stroke="currentColor" /><text x=${pos(id).x + 7} y=${pos(id).y + 21} fill="currentColor" font-size="11">${nodes.get(id).slice(0, 22)}</text>`)}
        </svg>`;
    }
    renderPreparation() {
        return html`<div class="bar">
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
                ><button ?disabled=${this.busy} @click=${() => this.perform(() => this.persist())}>Сохранить выбор</button>
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
            </p>`;
    }
    render() {
        const selected = this.inbox.find(q => q.id === this.questionId);
        const owner = this.owner;
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
                      <details class="options">
                          <summary>Настройки ответа</summary>
                          <div class="options-body">
                              <select aria-label="Тема ответа" .value=${this.routing} @change=${e => (this.routing = e.target.value)}>
                                  <option value="auto">Определить тему</option>
                                  <option value="current">Текущая тема</option>
                                  <option value="new">Новая тема</option></select
                              ><select .value=${this.mode} @change=${e => (this.mode = e.target.value)}>
                                  <option value="answer">Ответ в 3 уровня</option>
                                  <option value="technical">Техническая задача</option>
                              </select>
                          </div>
                      </details>
                      <span class="reading-controls"
                          ><button
                              title="Уменьшить шрифт"
                              @click=${() => this.dispatchEvent(new CustomEvent('font-step', { detail: -2, bubbles: true, composed: true }))}
                          >
                              A−</button
                          ><button
                              title="Только ответ (Cmd/Ctrl+Shift+F)"
                              @click=${() => this.dispatchEvent(new CustomEvent('focus-toggle', { bubbles: true, composed: true }))}
                          >
                              Только ответ</button
                          ><button
                              title="Увеличить шрифт"
                              @click=${() => this.dispatchEvent(new CustomEvent('font-step', { detail: 2, bubbles: true, composed: true }))}
                          >
                              A+
                          </button></span
                      >
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
                                            ? html`<textarea
                                                      .value=${this.questionText}
                                                      @input=${e => (this.questionText = e.target.value)}
                                                  ></textarea
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
                                    }
                                    <div class="bar">
                                        ${['Короче', 'Пример на Go', 'Почему?', 'Сравнить'].map(
                                            text =>
                                                html`<button
                                                    ?disabled=${this.busy || owner.currentResponseIndex < 0}
                                                    @click=${() =>
                                                        this.perform(async () => {
                                                            await this.ask(text, { routing: 'current' });
                                                            this.status = '';
                                                        })}
                                                >
                                                    ${text}
                                                </button>`
                                        )}
                                    </div>`
                              : ''
                      }
                      ${
                          !this.preparationOnly && this.tab === 'topics'
                              ? html`<div class="bar">
                                        <button
                                            @click=${() => {
                                                owner.openResponseCard();
                                                this.tab = '';
                                            }}
                                        >
                                            + Новая тема</button
                                        ><button
                                            @click=${() => {
                                                owner.mergeTopic();
                                                this.requestUpdate();
                                            }}
                                        >
                                            Объединить</button
                                        ><button
                                            @click=${() => {
                                                owner.splitTopic();
                                                this.requestUpdate();
                                            }}
                                        >
                                            Отделить уточнение
                                        </button>
                                    </div>
                                    ${(owner.topicMeta || []).map((m, i) =>
                                        m.hidden
                                            ? ''
                                            : html`<div class="bar">
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
                                              </div>`
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
                                    </div>
                                    <div class="grid">
                                        <label
                                            >Код<textarea
                                                class="mono"
                                                .value=${this.code}
                                                @input=${e => (this.code = e.target.value)}
                                            ></textarea></label
                                        ><label
                                            >Тесты (Go: package main; SQL: проверки / SELECT)<textarea
                                                class="mono"
                                                .value=${this.tests}
                                                @input=${e => (this.tests = e.target.value)}
                                            ></textarea>
                                        </label>
                                    </div>
                                    <button
                                        ?disabled=${this.busy}
                                        @click=${() =>
                                            this.perform(async () => {
                                                this.executionSnapshot = JSON.stringify({
                                                    language: this.language,
                                                    code: this.code,
                                                    tests: this.tests,
                                                });
                                                const r = await this.ipc.invoke('interview:run-code', {
                                                    language: this.language,
                                                    code: this.code,
                                                    tests: this.tests,
                                                });
                                                this.execution = JSON.stringify(r, null, 2);
                                                this.status = r.success
                                                    ? 'Проверка завершена успешно'
                                                    : r.error || 'Ошибка выполнения — смотрите вывод';
                                            })}
                                    >
                                        Запустить в изоляции</button
                                    ><button
                                        ?disabled=${this.busy}
                                        @click=${() =>
                                            this.perform(async () => {
                                                await this.ask(
                                                    'Проверь решение и объясни ошибки. Язык: ' +
                                                        this.language +
                                                        '\nКод:\n' +
                                                        this.code +
                                                        '\nТесты:\n' +
                                                        this.tests +
                                                        '\nВывод проверки текущего кода:\n' +
                                                        (this.executionSnapshot ===
                                                        JSON.stringify({ language: this.language, code: this.code, tests: this.tests })
                                                            ? this.execution
                                                            : 'Текущий код ещё не запускался'),
                                                    { mode: 'technical', routing: 'current' }
                                                );
                                                this.status = 'Разбор готов';
                                            })}
                                    >
                                        Разобрать с AI
                                    </button>
                                    <pre class="mono">${this.execution}</pre>
                                    <p class="muted">
                                        Без сети, 512 МБ, 1 CPU, лимит 45 секунд. Go без внешних зависимостей. SQL проверяется в SQLite, не
                                        PostgreSQL.
                                    </p>`
                              : ''
                      }
                      ${
                          !this.preparationOnly && this.tab === 'design'
                              ? html`${this.diagram()}
                                    <div class="grid">
                                        ${[
                                            ['requirements', 'Требования'],
                                            ['load', 'Нагрузка'],
                                            ['api', 'API'],
                                            ['storage', 'Хранилища'],
                                            ['components', 'Схема: A[Название] --> B[Название]'],
                                            ['decisions', 'Принятые решения'],
                                        ].map(
                                            ([key, label]) =>
                                                html`<label
                                                    >${label}<textarea
                                                        .value=${this.workspace.design[key] || ''}
                                                        @input=${e => {
                                                            this.workspace = {
                                                                ...this.workspace,
                                                                design: { ...this.workspace.design, [key]: e.target.value },
                                                            };
                                                        }}
                                                    ></textarea>
                                                </label>`
                                        )}
                                    </div>
                                    <label
                                        >Новое задание или ограничение<textarea
                                            .value=${this.constraint}
                                            @input=${e => (this.constraint = e.target.value)}
                                        ></textarea>
                                    </label>
                                    <div class="bar">
                                        <button ?disabled=${this.busy || !this.constraint.trim()} @click=${this.updateDesign}>
                                            Обновить проект с AI</button
                                        ><button ?disabled=${this.busy} @click=${() => this.perform(() => this.persist())}>Сохранить вручную</button
                                        ><button
                                            ?disabled=${this.busy || !this.workspace.designVersions.length}
                                            @click=${() =>
                                                this.perform(async () => {
                                                    const versions = [...this.workspace.designVersions];
                                                    const previous = versions.pop();
                                                    const next = { ...this.workspace, design: previous.design, designVersions: versions };
                                                    await this.call('workspace-save', next);
                                                    this.workspace = next;
                                                    this.status = 'Версия восстановлена';
                                                })}
                                        >
                                            Откатить версию
                                        </button>
                                    </div>
                                    <pre class="mono">${this.workspace.design.changes || ''}</pre>`
                              : ''
                      }
                  </div>`
                : ''
        }${this.status ? html`<div role="status" style="padding:4px 10px;font-size:14px">${this.status}</div>` : ''}`;
    }
}
customElements.define('interview-tools', InterviewTools);
