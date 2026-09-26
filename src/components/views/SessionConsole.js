import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
export class SessionConsole extends LitElement {
    static properties = { recovery: { type: Object }, busy: { state: true }, results: { state: true }, review: { type: Object } };
    static styles = css`
        :host {
            display: block;
            padding: 12px 20px;
            background: var(--bg-app, #111);
            color: var(--text-primary, #eee);
            font: 14px/1.6 var(--font, sans-serif);
            overflow-wrap: anywhere;
            -webkit-app-region: no-drag;
            flex-shrink: 0;
        }
        * {
            box-sizing: border-box;
        }
        .console {
            display: grid;
            gap: 12px;
        }
        .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        button {
            font: inherit;
            color: inherit;
            background: var(--bg-elevated, #222);
            border: 1px solid var(--border, #444);
            border-radius: 7px;
            padding: 8px 12px;
            cursor: pointer;
            max-width: 100%;
            line-height: 1.4;
            white-space: normal;
            justify-self: start;
            -webkit-app-region: no-drag;
        }
        button:disabled {
            opacity: 0.5;
        }
        p {
            margin: 6px 0;
        }
        details {
            margin-top: 8px;
        }
        details > button {
            display: block;
            margin-top: 16px;
        }
        summary {
            cursor: pointer;
        }
        li {
            margin: 5px 0;
        }
        .bad {
            color: #ffab91;
        }
        .ok {
            color: #8eddb1;
        }
    `;
    constructor() {
        super();
        this.results = [];
        this.busy = false;
    }
    get owner() {
        return window.cheatingDaddy.element();
    }
    microphone() {
        return this.measureAudio({
            acquire: () => navigator.mediaDevices.getUserMedia({ audio: true }),
            label: 'Микрофон',
            silent: 'Микрофон: сигнал не обнаружен. Произнесите фразу и повторите.',
            ticks: 30,
        });
    }
    // Windows has no SystemAudioDump: listen to the same loopback stream the session uses.
    systemAudio() {
        return this.measureAudio({
            acquire: () => navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }),
            label: 'Системный звук',
            silent: 'Системный звук не поступает. Включите речь или музыку и повторите проверку.',
            ticks: 60,
        });
    }
    async measureAudio({ acquire, label, silent, ticks }) {
        let stream,
            context,
            timer,
            expired = false;
        try {
            stream = await Promise.race([
                acquire().then(s => {
                    if (expired) {
                        s.getTracks().forEach(t => t.stop());
                        throw Error('Истекло ожидание разрешения');
                    }
                    return s;
                }),
                new Promise((_, reject) => {
                    timer = setTimeout(() => {
                        expired = true;
                        reject(Error(`${label}: разрешение не получено за 10 секунд`));
                    }, 10000);
                }),
            ]);
            clearTimeout(timer);
            if (!stream.getAudioTracks().length) return { ok: false, text: `${label}: аудиодорожка недоступна` };
            context = new AudioContext();
            await context.resume();
            const analyser = context.createAnalyser();
            context.createMediaStreamSource(stream).connect(analyser);
            const data = new Float32Array(analyser.fftSize);
            let peak = 0;
            for (let i = 0; i < ticks; i++) {
                analyser.getFloatTimeDomainData(data);
                for (const n of data) peak = Math.max(peak, Math.abs(n));
                await new Promise(r => setTimeout(r, 100));
            }
            return { ok: peak > 0.003, text: peak > 0.003 ? `${label}: звук поступает` : silent };
        } catch (e) {
            return { ok: false, text: e.message };
        } finally {
            clearTimeout(timer);
            stream?.getTracks().forEach(t => t.stop());
            if (context) await context.close();
        }
    }
    async check() {
        if (this.busy) return;
        this.busy = true;
        this.owner._preflightBusy = true;
        this.owner.requestUpdate();
        this.results = [];
        const ipc = window.require('electron').ipcRenderer;
        try {
            const prefs = await window.cheatingDaddy.storage.getPreferences();
            const [api, screen, mic] = await Promise.all([
                ipc.invoke('session:preflight', prefs.providerMode),
                ipc.invoke('capture-screen-draft'),
                ['mic_only', 'both'].includes(prefs.audioMode) ? this.microphone() : Promise.resolve(null),
            ]);
            const loopback = window.cheatingDaddy.isWindows && prefs.audioMode !== 'mic_only' ? await this.systemAudio() : null;
            if (!api.success) this.results.push({ ok: false, text: api.error });
            else {
                const [model, audio] = api.data;
                this.results.push({ ok: model.ok, text: model.ok ? `Модель ${model.model} отвечает за ${model.seconds} с` : model.message });
                if (loopback) this.results.push(loopback);
                else if (prefs.audioMode !== 'mic_only') this.results.push({ ok: audio.ok && audio.detected, text: audio.message });
            }
            this.results.push({ ok: screen.success, text: screen.success ? 'Захват экрана работает' : screen.error });
            if (mic) this.results.push(mic);
        } catch (e) {
            this.results = [{ ok: false, text: e.message }];
        } finally {
            this.busy = false;
            this.owner._preflightBusy = false;
            this.owner.requestUpdate();
            this.results = [...this.results];
        }
    }
    render() {
        return html`<div class="console">
            ${
                this.recovery
                    ? html`<p>Сохранена незавершённая сессия (${new Date(this.recovery.savedAt).toLocaleString()}).</p>
                          <div class="actions">
                              <button ?disabled=${this.busy} @click=${() => this.owner.resumeSession()}>Продолжить сессию</button
                              ><button ?disabled=${this.busy} @click=${() => this.owner.discardRecovery()}>Начать заново</button>
                          </div>`
                    : ''
            }
            <button ?disabled=${this.busy || this.owner._starting} @click=${this.check}>${this.busy ? 'Проверка…' : 'Проверить готовность'}</button>

            ${this.results.map(r => html`<p class=${r.ok ? 'ok' : 'bad'}>${r.ok ? '✓' : '!'} ${r.text}</p>`)}
            ${
                this.review
                    ? html`<details open>
                          <summary>Разбор завершённой сессии</summary>
                          <p>${this.review.note}</p>
                          <ul>
                              ${this.review.tomorrow.map(r => html`<li>${r.task}</li>`)}
                          </ul>
                          <div class="actions">
                              <button
                                  @click=${() => {
                                      this.owner._reviewToOpen = this.owner._lastFinishedSessionId;
                                      this.owner._autoDebrief = true;
                                      this.owner.navigate('history');
                                  }}
                              >
                                  ИИ-итоги собеса</button
                              ><button
                                  @click=${() => {
                                      this.owner._reviewToOpen = this.owner._lastFinishedSessionId;
                                      this.owner.navigate('history');
                                  }}
                              >
                                  Открыть полный разбор в History
                              </button>
                          </div>
                      </details>`
                    : ''
            }
        </div>`;
    }
}
customElements.define('session-console', SessionConsole);
