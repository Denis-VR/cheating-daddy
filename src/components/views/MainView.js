import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

const OPENROUTER_RESPONSE_MODELS = [
    { id: 'openai/gpt-5-nano', label: 'GPT-5 Nano', speed: 5, reasoning: 2, input: '0.05', output: '0.40' },
    { id: 'openai/gpt-5.4-mini', label: 'GPT-5.4 Mini', speed: 4, reasoning: 4, input: '0.75', output: '4.50' },
    { id: 'openai/gpt-5.4-nano', label: 'GPT-5.4 Nano', speed: 4, reasoning: 3, input: '0.20', output: '1.25' },
];

const LOCAL_LLM_PRESETS = [
    { value: 'unsloth/Qwen3.5-0.8B-GGUF:Q4_K_M', label: 'Qwen 3.5 0.8B Q4 — 0.74 GB · Fastest' },
    { value: 'unsloth/Qwen3.5-0.8B-GGUF:Q8_0', label: 'Qwen 3.5 0.8B Q8 — 1.02 GB' },
    { value: 'unsloth/Qwen3.5-2B-GGUF:Q4_K_M', label: 'Qwen 3.5 2B Q4 — 1.95 GB' },
    { value: 'unsloth/Qwen3.5-2B-GGUF:Q8_0', label: 'Qwen 3.5 2B Q8 — 2.68 GB' },
    { value: 'unsloth/Qwen3.5-4B-GGUF:Q4_K_M', label: 'Qwen 3.5 4B Q4 — 3.42 GB · Recommended' },
    { value: 'unsloth/Qwen3.5-4B-GGUF:Q8_0', label: 'Qwen 3.5 4B Q8 — 5.16 GB' },
    { value: 'unsloth/Qwen3.5-9B-GGUF:Q4_K_M', label: 'Qwen 3.5 9B Q4 — 6.60 GB' },
    { value: 'unsloth/Qwen3.5-9B-GGUF:Q8_0', label: 'Qwen 3.5 9B Q8 — 10.45 GB' },
    { value: 'unsloth/Qwen3.5-27B-GGUF:Q4_K_M', label: 'Qwen 3.5 27B Q4 — 17.67 GB' },
    { value: 'unsloth/Qwen3.5-35B-A3B-GGUF:Q4_K_M', label: 'Qwen 3.5 35B-A3B Q4 — 22.92 GB · Largest' },
];

export class MainView extends LitElement {
    static styles = css`
        * {
            font-family: var(--font);
            cursor: default;
            user-select: none;
            box-sizing: border-box;
        }

        :host {
            min-width: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: 0;
        }

        .benchmark-toggle,
        .benchmark-actions button {
            color: var(--text-primary);
            background: var(--bg-elevated);
            border: 1px solid var(--border-strong);
            border-radius: 7px;
            padding: 9px 12px;
            cursor: pointer;
        }
        .benchmark-panel {
            display: grid;
            gap: 10px;
            min-width: 0;
        }
        .benchmark-panel textarea {
            box-sizing: border-box;
            width: 100%;
            min-height: 90px;
            color: var(--text-primary);
            background: var(--bg-elevated);
            border: 1px solid var(--border-strong);
            border-radius: 7px;
            padding: 10px;
            font: inherit;
        }
        .benchmark-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .benchmark-actions button:disabled {
            opacity: 0.45;
            cursor: default;
        }
        .benchmark-result {
            border: 1px solid var(--border);
            border-radius: 7px;
            padding: 10px;
        }
        .benchmark-result summary {
            display: flex;
            justify-content: space-between;
            cursor: pointer;
        }
        .benchmark-result pre {
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            font: inherit;
            font-size: 13px;
            max-height: 240px;
            overflow-y: auto;
        }
        .model-cards {
            display: grid;
            gap: 8px;
        }
        .model-card {
            display: block;
            width: 100%;
            padding: 13px 14px;
            text-align: left;
            color: var(--text-primary);
            background: var(--bg-elevated);
            border: 1px solid var(--border-strong);
            border-radius: 10px;
            cursor: pointer;
            font: inherit;
        }
        .model-card:hover {
            border-color: #707780;
        }
        .model-card[aria-pressed='true'] {
            border-color: #79b9ac;
            background: #142321;
        }
        .model-card:focus-visible,
        .custom-model:focus-visible {
            outline: 2px solid #79b9ac;
            outline-offset: 3px;
        }
        .model-card-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;
            font-size: 14px;
            font-weight: 600;
        }
        .model-radio {
            width: 13px;
            height: 13px;
            border: 1px solid #727c7b;
            border-radius: 50%;
            flex-shrink: 0;
        }
        .model-card[aria-pressed='true'] .model-radio {
            background: #91d4c4;
            border-color: #91d4c4;
            box-shadow: inset 0 0 0 3px #142321;
        }
        .model-metrics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        .model-metric {
            display: grid;
            gap: 6px;
        }
        .model-metric-label {
            display: flex;
            justify-content: space-between;
            color: #abb5b8;
            font-size: 11px;
        }
        .model-meter {
            display: flex;
            gap: 4px;
        }
        .model-meter i {
            height: 3px;
            flex: 1;
            border-radius: 3px;
            background: #394344;
        }
        .model-meter i.filled {
            background: #91d4c4;
        }
        .model-price {
            display: flex;
            flex-wrap: wrap;
            gap: 5px 14px;
            margin-top: 11px;
            color: #b3bdc0;
            font-size: 11px;
        }
        .model-price strong {
            color: #f2f7f6;
            font-weight: 600;
            font-size: 12px;
        }
        .model-price-unit {
            color: #b3bdc0;
            font-size: 11px;
            line-height: 1.5;
            margin-top: 6px;
        }
        .custom-model {
            background: transparent;
            color: var(--text-secondary);
            border: 1px dashed var(--border-strong);
            border-radius: 8px;
            padding: 9px;
            cursor: pointer;
        }
        .custom-model[aria-pressed='true'] {
            border-color: #91d4c4;
            color: #91d4c4;
        }

        .form-wrapper {
            width: 100%;
            max-width: 420px;
            display: flex;
            flex-direction: column;
            gap: var(--space-md);
        }

        .page-title {
            font-size: var(--font-size-xl);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
            margin-bottom: var(--space-xs);
        }

        .page-title .mode-suffix {
            opacity: 0.5;
        }

        .page-subtitle {
            font-size: var(--font-size-sm);
            color: var(--text-muted);
            margin-bottom: var(--space-md);
        }

        /* ── Cloud promo card ── */

        .cloud-promo {
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 14px 16px;
            border-radius: var(--radius-md);
            border: 1px solid rgba(59, 130, 246, 0.45);
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.09) 100%);
            cursor: pointer;
            transition:
                border-color 0.2s,
                background 0.2s;
        }

        .cloud-promo:hover {
            border-color: rgba(59, 130, 246, 0.65);
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.16) 0%, rgba(139, 92, 246, 0.12) 100%);
            box-shadow:
                0 0 20px rgba(59, 130, 246, 0.15),
                0 0 40px rgba(139, 92, 246, 0.08);
        }

        .cloud-promo-glow {
            position: absolute;
            top: -40%;
            right: -20%;
            width: 120px;
            height: 120px;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
            pointer-events: none;
        }

        .cloud-promo-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .cloud-promo-title {
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
        }

        .cloud-promo-arrow {
            color: var(--accent);
            font-size: 16px;
            transition: transform 0.2s;
        }

        .cloud-promo:hover .cloud-promo-arrow {
            transform: translateX(2px);
        }

        .cloud-promo-desc {
            font-size: var(--font-size-xs);
            color: var(--text-secondary);
            line-height: var(--line-height);
        }

        /* ── Form controls ── */

        .form-group {
            display: flex;
            flex-direction: column;
            gap: var(--space-xs);
        }

        .config-section {
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            background: var(--bg-surface);
            overflow: hidden;
        }

        .config-summary {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-md);
            padding: 12px 14px;
            cursor: pointer;
            list-style: none;
        }

        .config-summary::-webkit-details-marker {
            display: none;
        }

        .config-summary-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .config-summary-title {
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            color: var(--text-primary);
        }

        .config-summary-description {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
        }

        .config-chevron {
            width: 16px;
            height: 16px;
            color: var(--text-muted);
            transition: transform var(--transition);
        }

        .config-section[open] .config-chevron {
            transform: rotate(180deg);
        }

        .config-content {
            display: flex;
            flex-direction: column;
            gap: var(--space-md);
            padding: 14px;
            border-top: 1px solid var(--border);
        }

        .config-note {
            padding: 10px 12px;
            border: 1px solid rgba(212, 160, 23, 0.28);
            border-radius: var(--radius-sm);
            background: rgba(212, 160, 23, 0.08);
            color: var(--text-secondary);
            font-size: var(--font-size-xs);
            line-height: var(--line-height);
        }

        .config-checkbox {
            display: flex;
            align-items: flex-start;
            gap: var(--space-sm);
            cursor: pointer;
        }

        .config-checkbox input {
            width: 16px;
            height: 16px;
            margin-top: 2px;
            padding: 0;
            accent-color: var(--accent);
            cursor: pointer;
        }

        .config-checkbox-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .form-label {
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-medium);
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        input,
        select,
        textarea {
            background: var(--bg-elevated);
            color: var(--text-primary);
            border: 1px solid var(--border);
            padding: 10px 12px;
            width: 100%;
            border-radius: var(--radius-sm);
            font-size: var(--font-size-sm);
            font-family: var(--font);
            transition:
                border-color var(--transition),
                box-shadow var(--transition);
        }

        input:hover:not(:focus),
        select:hover:not(:focus),
        textarea:hover:not(:focus) {
            border-color: var(--text-muted);
        }

        input:focus,
        select:focus,
        textarea:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 1px var(--accent);
        }

        input::placeholder,
        textarea::placeholder {
            color: var(--text-muted);
        }

        input.error {
            border-color: var(--danger, #ef4444);
        }

        select {
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23999' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
            background-position: right 8px center;
            background-repeat: no-repeat;
            background-size: 14px;
            padding-right: 28px;
        }

        textarea {
            resize: vertical;
            min-height: 80px;
            line-height: var(--line-height);
        }

        .form-hint {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
        }

        .form-hint a,
        .form-hint span.link {
            color: var(--accent);
            text-decoration: none;
            cursor: pointer;
        }

        .form-hint span.link:hover {
            text-decoration: underline;
        }

        .whisper-label-row {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .whisper-spinner {
            width: 12px;
            height: 12px;
            border: 2px solid var(--border);
            border-top-color: var(--accent);
            border-radius: 50%;
            animation: whisper-spin 0.8s linear infinite;
        }

        @keyframes whisper-spin {
            to {
                transform: rotate(360deg);
            }
        }

        /* ── Start button ── */

        .start-button {
            position: relative;
            overflow: hidden;
            background: #e8e8e8;
            color: #111111;
            border: none;
            padding: 12px var(--space-md);
            border-radius: var(--radius-sm);
            font-size: var(--font-size-base);
            font-weight: var(--font-weight-semibold);
            cursor: pointer;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--space-sm);
        }

        .start-button canvas.btn-aurora {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
        }

        .start-button canvas.btn-dither {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            opacity: 0.1;
            mix-blend-mode: overlay;
            pointer-events: none;
            image-rendering: pixelated;
        }

        .start-button .btn-label {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            gap: var(--space-sm);
        }

        .start-button:hover {
            opacity: 0.9;
        }

        .start-button.disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .start-button.disabled:hover {
            opacity: 0.5;
        }

        .download-progress-fill {
            position: absolute;
            inset: 0 auto 0 0;
            z-index: 2;
            width: 0;
            background: rgba(17, 17, 17, 0.16);
            transition: width 0.2s ease;
            pointer-events: none;
        }

        .download-progress-fill.indeterminate {
            width: 38%;
            animation: download-progress-slide 1.2s ease-in-out infinite;
        }

        .download-controls {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-md);
            margin-top: var(--space-xs);
            font-size: var(--font-size-xs);
            color: var(--text-muted);
        }

        .download-cancel {
            flex: none;
            padding: 0;
            border: none;
            background: none;
            color: var(--danger, #ef4444);
            font: inherit;
            cursor: pointer;
        }

        .download-cancel:hover {
            text-decoration: underline;
        }

        @keyframes download-progress-slide {
            from {
                transform: translateX(-105%);
            }
            to {
                transform: translateX(270%);
            }
        }

        .shortcut-hint {
            display: inline-flex;
            align-items: center;
            gap: 2px;
            opacity: 0.5;
            font-family: var(--font-mono);
        }

        /* ── Divider ── */

        .divider {
            display: flex;
            align-items: center;
            gap: var(--space-md);
            margin: var(--space-sm) 0;
        }

        .divider-line {
            flex: 1;
            height: 1px;
            background: var(--border);
        }

        .divider-text {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
            text-transform: lowercase;
        }

        /* ── Mode switch links ── */

        .mode-links {
            display: flex;
            justify-content: center;
            gap: var(--space-lg);
        }

        .mode-link {
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
            cursor: pointer;
            background: none;
            border: none;
            padding: 0;
            transition: color var(--transition);
        }

        .mode-link:hover {
            color: var(--text-primary);
        }

        /* ── Mode option cards ── */

        .mode-cards {
            display: flex;
            gap: var(--space-sm);
        }

        .mode-card {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 12px 14px;
            border-radius: var(--radius-md);
            border: 1px solid var(--border);
            background: var(--bg-elevated);
            cursor: pointer;
            transition:
                border-color 0.2s,
                background 0.2s;
        }

        .mode-card:hover {
            border-color: var(--text-muted);
            background: var(--bg-hover);
        }

        .mode-card-title {
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
        }

        .mode-card-desc {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
            line-height: var(--line-height);
        }

        /* ── Title row with help ── */

        .title-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: var(--space-xs);
        }

        .title-row .page-title {
            margin-bottom: 0;
        }

        .help-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: 4px;
            border-radius: var(--radius-sm);
            transition: color 0.2s;
            display: flex;
            align-items: center;
        }

        .help-btn:hover {
            color: var(--text-secondary);
        }

        .help-btn * {
            pointer-events: none;
        }

        .help-dialog-backdrop {
            position: fixed;
            inset: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: var(--space-lg);
            background: rgba(0, 0, 0, 0.62);
        }

        .help-dialog {
            width: min(680px, 100%);
            max-height: calc(100vh - 48px);
            display: flex;
            flex-direction: column;
            gap: var(--space-md);
            padding: var(--space-lg);
            overflow: hidden;
            background: var(--bg-surface);
            border: 1px solid var(--border-strong);
            border-radius: var(--radius-lg);
            color: var(--text-primary);
        }

        .help-dialog-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-md);
        }

        .help-dialog-title {
            font-size: var(--font-size-lg);
            font-weight: var(--font-weight-semibold);
        }

        /* ── Help content ── */

        .help-content {
            display: flex;
            flex-direction: column;
            gap: var(--space-md);
            overflow-y: auto;
        }

        .help-section {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .help-section-title {
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
        }

        .help-section-text {
            font-size: var(--font-size-xs);
            color: var(--text-secondary);
            line-height: var(--line-height);
        }

        .help-code {
            font-family: var(--font-mono);
            font-size: 11px;
            background: var(--bg-hover);
            padding: 6px 8px;
            border-radius: var(--radius-sm);
            color: var(--text-primary);
            display: block;
        }

        .help-link {
            color: var(--accent);
            cursor: pointer;
            text-decoration: none;
        }

        .help-link:hover {
            text-decoration: underline;
        }

        .help-models {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .help-model {
            font-size: var(--font-size-xs);
            color: var(--text-secondary);
            display: flex;
            justify-content: space-between;
        }

        .help-model-name {
            font-family: var(--font-mono);
            font-size: 11px;
            color: var(--text-primary);
        }

        .help-divider {
            border: none;
            border-top: 1px solid var(--border);
            margin: 0;
        }

        .help-cloud-btn {
            background: #e8e8e8;
            color: #111111;
            border: none;
            padding: 10px var(--space-md);
            border-radius: var(--radius-sm);
            font-size: var(--font-size-sm);
            font-family: var(--font);
            font-weight: var(--font-weight-semibold);
            cursor: pointer;
            width: 100%;
            transition: opacity 0.15s;
        }

        .help-cloud-btn:hover {
            opacity: 0.9;
        }

        .help-warn {
            font-size: var(--font-size-xs);
            color: var(--warning);
            line-height: var(--line-height);
        }
    `;

    static properties = {
        onStart: { type: Function },
        onExternalLink: { type: Function },
        selectedProfile: { type: String },
        onProfileChange: { type: Function },
        isInitializing: { type: Boolean },
        errorMessage: { type: String },
        whisperDownloading: { type: Boolean },
        downloadProgress: { type: Object },
        onCancelDownload: { type: Function },
        // Internal state
        _benchmarkImages: { state: true },
        _benchmarkOpen: { state: true },
        _benchmarkBusy: { state: true },
        _benchmarkText: { state: true },
        _benchmarkResults: { state: true },
        _benchmarkError: { state: true },
        _recording: { state: true },
        _recordedAudio: { state: true },
        _audioPending: { state: true },
        _mode: { state: true },
        _instructionName: { state: true },
        _token: { state: true },
        _geminiKey: { state: true },
        _groqKey: { state: true },
        _openaiKey: { state: true },
        _openrouterKey: { state: true },
        _openaiModel: { state: true },
        _openrouterModel: { state: true },
        _hostedModels: { state: true },
        _customRouterModel: { state: true },
        _customStt: { state: true },
        _geminiLiveModel: { state: true },
        _groqModel: { state: true },
        _groqImageModel: { state: true },
        _disableGroqThinking: { state: true },
        _tokenError: { state: true },
        _keyError: { state: true },
        // Local AI state
        _localLlmModel: { state: true },
        _useCustomLocalLlmModel: { state: true },
        _whisperModel: { state: true },
        _showLocalHelp: { state: true },
    };

    constructor() {
        super();
        this.onStart = () => {};
        this.onExternalLink = () => {};
        this.selectedProfile = 'interview';
        this.onProfileChange = () => {};
        this.isInitializing = false;
        this.errorMessage = '';
        this.whisperDownloading = false;
        this.downloadProgress = { active: false, label: '', percentage: null };
        this.onCancelDownload = () => {};

        this._mode = 'byok';
        this._instructionName = '';
        this._token = '';
        this._geminiKey = '';
        this._groqKey = '';
        this._openaiKey = '';
        this._openrouterKey = '';
        this._openaiModel = 'gpt-4o-mini';
        this._openrouterModel = 'openai/gpt-5.4-nano';
        this._hostedModels = {};
        this._benchmarkText = '';
        this._benchmarkImages = [];
        this._benchmarkResults = [];
        this._recordEpoch = 0;
        this._customStt = {};
        this._geminiLiveModel = 'gemini-3.1-flash-live-preview';
        this._groqModel = 'qwen/qwen3.6-27b';
        this._groqImageModel = 'qwen/qwen3.6-27b';
        this._disableGroqThinking = true;
        this._tokenError = false;
        this._keyError = false;
        this._showLocalHelp = false;
        this._localLlmModel = 'unsloth/Qwen3.5-4B-GGUF:Q4_K_M';
        this._useCustomLocalLlmModel = false;
        this._whisperModel = 'tiny.en';

        this._animId = null;
        this._time = 0;
        this._mouseX = -1;
        this._mouseY = -1;

        this.boundKeydownHandler = this._handleKeydown.bind(this);
        this._loadFromStorage();
    }

    async _loadFromStorage() {
        try {
            const [config, prefs, creds] = await Promise.all([
                cheatingDaddy.storage.getConfig(),
                cheatingDaddy.storage.getPreferences(),
                cheatingDaddy.storage.getCredentials().catch(() => ({})),
            ]);

            this._instructionName = prefs.instructionPresets?.find(item => item.id === prefs.activeInstructionId)?.name || 'Мои инструкции';
            const storedMode = prefs.providerMode || 'byok';
            this._mode = storedMode === 'cloud' ? 'byok' : storedMode;

            if (storedMode === 'cloud') {
                await cheatingDaddy.storage.updatePreference('providerMode', this._mode);
            }

            // Load keys
            this._token = creds.cloudToken || '';
            this._geminiKey = (await cheatingDaddy.storage.getApiKey().catch(() => '')) || '';
            this._groqKey = (await cheatingDaddy.storage.getGroqApiKey().catch(() => '')) || '';
            this._openaiKey = creds.openaiKey || creds.openaiApiKey || '';
            this._openrouterKey = creds.openrouterKey || '';
            this._openaiModel = config.openaiModel || 'gpt-4o-mini';
            this._openrouterModel = config.openrouterModel || 'openai/gpt-5.4-nano';
            this._hostedModels = { ...config };
            this._geminiLiveModel = config.geminiLiveModel || 'gemini-3.1-flash-live-preview';
            this._groqModel = config.groqModel || 'qwen/qwen3.6-27b';
            this._groqImageModel = config.groqImageModel || 'qwen/qwen3.6-27b';
            this._disableGroqThinking = config.disableGroqThinking === true;

            // Load local AI settings
            this._localLlmModel = prefs.localLlmModel || 'unsloth/Qwen3.5-4B-GGUF:Q4_K_M';
            this._useCustomLocalLlmModel = !LOCAL_LLM_PRESETS.some(preset => preset.value === this._localLlmModel);
            this._whisperModel = prefs.whisperModel || 'tiny.en';

            this.requestUpdate();
        } catch (e) {
            console.error('Error loading MainView storage:', e);
        }
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('keydown', this.boundKeydownHandler);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._recordEpoch++;
        clearTimeout(this._recordTimer);
        this._recordStream?.getTracks().forEach(track => track.stop());
        if (this._recorder?.state === 'recording') this._recorder.stop();
        if (this._benchmarkBusy)
            window
                .require('electron')
                .ipcRenderer.invoke('session:benchmark-cancel')
                .catch(() => {});
        document.removeEventListener('keydown', this.boundKeydownHandler);
        if (this._animId) cancelAnimationFrame(this._animId);
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('_mode')) {
            // Stop old animation when switching modes
            if (this._animId) {
                cancelAnimationFrame(this._animId);
                this._animId = null;
            }
        }
    }

    _initButtonAurora() {
        const btn = this.shadowRoot.querySelector('.start-button');
        const aurora = this.shadowRoot.querySelector('canvas.btn-aurora');
        const dither = this.shadowRoot.querySelector('canvas.btn-dither');
        if (!aurora || !dither || !btn) return;

        // Mouse tracking
        this._mouseX = -1;
        this._mouseY = -1;
        btn.addEventListener('mousemove', e => {
            const rect = btn.getBoundingClientRect();
            this._mouseX = (e.clientX - rect.left) / rect.width;
            this._mouseY = (e.clientY - rect.top) / rect.height;
        });
        btn.addEventListener('mouseleave', () => {
            this._mouseX = -1;
            this._mouseY = -1;
        });

        // Dither
        const blockSize = 8;
        const cols = Math.ceil(aurora.offsetWidth / blockSize);
        const rows = Math.ceil(aurora.offsetHeight / blockSize);
        dither.width = cols;
        dither.height = rows;
        const dCtx = dither.getContext('2d');
        const img = dCtx.createImageData(cols, rows);
        for (let i = 0; i < img.data.length; i += 4) {
            const v = Math.random() > 0.5 ? 255 : 0;
            img.data[i] = v;
            img.data[i + 1] = v;
            img.data[i + 2] = v;
            img.data[i + 3] = 255;
        }
        dCtx.putImageData(img, 0, 0);

        // Aurora
        const ctx = aurora.getContext('2d');
        const scale = 0.4;
        aurora.width = Math.floor(aurora.offsetWidth * scale);
        aurora.height = Math.floor(aurora.offsetHeight * scale);

        const blobs = [
            { color: [120, 160, 230], x: 0.1, y: 0.3, vx: 0.25, vy: 0.2, phase: 0 },
            { color: [150, 120, 220], x: 0.8, y: 0.5, vx: -0.2, vy: 0.25, phase: 1.5 },
            { color: [200, 140, 210], x: 0.5, y: 0.6, vx: 0.18, vy: -0.22, phase: 3.0 },
            { color: [100, 190, 190], x: 0.3, y: 0.7, vx: 0.3, vy: 0.15, phase: 4.5 },
            { color: [220, 170, 130], x: 0.7, y: 0.4, vx: -0.22, vy: -0.25, phase: 6.0 },
        ];

        const draw = () => {
            this._time += 0.008;
            const w = aurora.width;
            const h = aurora.height;
            const maxDim = Math.max(w, h);

            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, w, h);

            const hovering = this._mouseX >= 0;

            for (const blob of blobs) {
                const t = this._time;
                const cx = (blob.x + Math.sin(t * blob.vx + blob.phase) * 0.4) * w;
                const cy = (blob.y + Math.cos(t * blob.vy + blob.phase * 0.7) * 0.4) * h;
                const r = maxDim * 0.45;

                let boost = 1;
                if (hovering) {
                    const dx = cx / w - this._mouseX;
                    const dy = cy / h - this._mouseY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    boost = 1 + 2.5 * Math.max(0, 1 - dist / 0.6);
                }

                const a0 = Math.min(1, 0.18 * boost);
                const a1 = Math.min(1, 0.08 * boost);
                const a2 = Math.min(1, 0.02 * boost);

                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
                grad.addColorStop(0, `rgba(${blob.color[0]}, ${blob.color[1]}, ${blob.color[2]}, ${a0})`);
                grad.addColorStop(0.3, `rgba(${blob.color[0]}, ${blob.color[1]}, ${blob.color[2]}, ${a1})`);
                grad.addColorStop(0.6, `rgba(${blob.color[0]}, ${blob.color[1]}, ${blob.color[2]}, ${a2})`);
                grad.addColorStop(1, `rgba(${blob.color[0]}, ${blob.color[1]}, ${blob.color[2]}, 0)`);
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
            }

            this._animId = requestAnimationFrame(draw);
        };

        draw();
    }

    _handleKeydown(e) {
        if (e.key === 'Escape' && this._showLocalHelp) {
            this._closeLocalHelp();
            return;
        }

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            this._handleStart();
        }
    }

    // ── Persistence ──

    async _saveMode(mode) {
        if (this._benchmarkBusy || this._recording || this._audioPending) return;
        this._mode = mode;
        this._tokenError = false;
        this._keyError = false;
        await cheatingDaddy.storage.updatePreference('providerMode', mode);
        this.requestUpdate();
    }

    async _saveToken(val) {
        this._token = val;
        this._tokenError = false;
        try {
            const creds = await cheatingDaddy.storage.getCredentials().catch(() => ({}));
            await cheatingDaddy.storage.setCredentials({ ...creds, cloudToken: val });
        } catch (e) {}
        this.requestUpdate();
    }

    async _saveGeminiKey(val) {
        this._geminiKey = val;
        this._keyError = false;
        await cheatingDaddy.storage.setApiKey(val);
        this.requestUpdate();
    }

    async _saveGroqKey(val) {
        this._groqKey = val;
        await cheatingDaddy.storage.setGroqApiKey(val);
        this.requestUpdate();
    }

    async _saveGeminiLiveModel(val) {
        this._geminiLiveModel = val;
        await cheatingDaddy.storage.updateConfig('geminiLiveModel', val);
        this.requestUpdate();
    }

    async _saveGroqModel(val) {
        this._groqModel = val;
        await cheatingDaddy.storage.updateConfig('groqModel', val);
        this.requestUpdate();
    }

    async _saveGroqImageModel(val) {
        this._groqImageModel = val;
        await cheatingDaddy.storage.updateConfig('groqImageModel', val);
        this.requestUpdate();
    }

    async _saveDisableGroqThinking(disabled) {
        this._disableGroqThinking = disabled;
        await cheatingDaddy.storage.updateConfig('disableGroqThinking', disabled);
        this.requestUpdate();
    }

    async _saveOpenaiKey(val) {
        this._openaiKey = val;
        try {
            const creds = await cheatingDaddy.storage.getCredentials().catch(() => ({}));
            await cheatingDaddy.storage.setCredentials({ ...creds, openaiKey: val });
        } catch (e) {}
        this.requestUpdate();
    }

    async _saveLocalLlmModel(val) {
        this._localLlmModel = val;
        await cheatingDaddy.storage.updatePreference('localLlmModel', val);
        this.requestUpdate();
    }

    async _selectLocalLlmModel(value) {
        if (value === 'custom') {
            this._useCustomLocalLlmModel = true;
            this.requestUpdate();
            return;
        }

        this._useCustomLocalLlmModel = false;
        await this._saveLocalLlmModel(value);
    }

    async _saveWhisperModel(val) {
        this._whisperModel = val;
        await cheatingDaddy.storage.updatePreference('whisperModel', val);
        this.requestUpdate();
    }

    _handleProfileChange(e) {
        this.onProfileChange(e.target.value);
    }

    _openLocalHelp() {
        this._showLocalHelp = true;
    }

    _closeLocalHelp() {
        this._showLocalHelp = false;
    }

    _handleHelpDialogClick(e) {
        e.stopPropagation();
    }

    // ── Start ──

    _handleStart() {
        if (this._benchmarkBusy || this._recording || this._audioPending) return;
        if (this.isInitializing || this.downloadProgress.active) return;

        if (this._mode === 'byok') {
            if (!this._geminiKey.trim()) {
                this._keyError = true;
                this.requestUpdate();
                return;
            }
        } else if (['openai', 'openrouter'].includes(this._mode)) {
            if (!this[this._mode === 'openai' ? '_openaiKey' : '_openrouterKey'].trim()) {
                this._keyError = true;
                return;
            }
        } else if (this._mode === 'local') {
            if (!this._localLlmModel.trim()) {
                return;
            }
        }

        this.onStart();
    }

    triggerApiKeyError() {
        this._keyError = this._mode !== 'local';
        this.requestUpdate();
        setTimeout(() => {
            this._tokenError = false;
            this._keyError = false;
            this.requestUpdate();
        }, 2000);
    }

    // ── Render helpers ──

    _renderStartButton() {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const isDownloading = this._mode === 'local' && this.downloadProgress.active;
        const percentage = this.downloadProgress.percentage;
        const hasPercentage = Number.isFinite(percentage);

        const cmdIcon = html`<svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <path
                d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"
            />
        </svg>`;
        const ctrlIcon = html`<svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <path d="M6 15l6-6 6 6" />
        </svg>`;
        const enterIcon = html`<svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <path d="M9 10l-5 5 5 5" />
            <path d="M20 4v7a4 4 0 0 1-4 4H4" />
        </svg>`;

        return html`
            <button
                class="start-button ${this.isInitializing || isDownloading ? 'disabled' : ''}"
                ?disabled=${this.isInitializing || isDownloading || this._benchmarkBusy || this._recording || this._audioPending}
                @click=${() => this._handleStart()}
            >
                <canvas class="btn-aurora"></canvas>
                <canvas class="btn-dither"></canvas>
                ${
                    isDownloading
                        ? html`<span
                              class="download-progress-fill ${hasPercentage ? '' : 'indeterminate'}"
                              style=${hasPercentage ? `width: ${percentage}%` : ''}
                          ></span>`
                        : ''
                }
                <span class="btn-label">
                    ${isDownloading ? (hasPercentage ? `${percentage}%` : 'Preparing...') : 'Start Session'}
                    ${isDownloading ? '' : html`<span class="shortcut-hint">${isMac ? cmdIcon : ctrlIcon}${enterIcon}</span>`}
                </span>
            </button>
            ${
                isDownloading
                    ? html`
                          <div class="download-controls">
                              <span>Downloading: ${this.downloadProgress.label || 'Local AI files'}</span>
                              <button class="download-cancel" @click=${() => this.onCancelDownload()}>Cancel</button>
                          </div>
                      `
                    : ''
            }
        `;
    }

    _renderDivider() {
        return html`
            <div class="divider">
                <div class="divider-line"></div>
                <span class="divider-text">or</span>
                <div class="divider-line"></div>
            </div>
        `;
    }

    // ── Cloud mode ──
    // Cloud UI intentionally disabled. Backend cloud wiring is still present in
    // the codebase, but the renderer no longer exposes this setup path.

    // ── BYOK mode ──

    _renderConfigChevron() {
        return html`
            <svg class="config-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="m5 7.5 5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        `;
    }

    _renderByokMode() {
        return html`
            <details class="config-section">
                <summary class="config-summary">
                    <span class="config-summary-text">
                        <span class="config-summary-title">Transcription</span>
                        <span class="config-summary-description">Gemini Live connection</span>
                    </span>
                    ${this._renderConfigChevron()}
                </summary>
                <div class="config-content">
                    <div class="form-group">
                        <label class="form-label">Gemini API Key</label>
                        <input
                            type="password"
                            placeholder="Required"
                            .value=${this._geminiKey}
                            @input=${e => this._saveGeminiKey(e.target.value)}
                            class=${this._keyError ? 'error' : ''}
                        />
                        <div class="form-hint">
                            <span class="link" @click=${() => this.onExternalLink('https://aistudio.google.com/apikey')}>Get Gemini key</span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Gemini Live Model</label>
                        <input type="text" .value=${this._geminiLiveModel} @input=${e => this._saveGeminiLiveModel(e.target.value)} />
                    </div>
                </div>
            </details>

            <details class="config-section">
                <summary class="config-summary">
                    <span class="config-summary-text">
                        <span class="config-summary-title">AI responses</span>
                        <span class="config-summary-description">Groq key and response model</span>
                    </span>
                    ${this._renderConfigChevron()}
                </summary>
                <div class="config-content">
                    <div class="form-group">
                        <label class="form-label">Groq API Key</label>
                        <input type="password" placeholder="Optional" .value=${this._groqKey} @input=${e => this._saveGroqKey(e.target.value)} />
                        <div class="form-hint">
                            <span class="link" @click=${() => this.onExternalLink('https://console.groq.com/keys')}>Get Groq key</span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Groq Model</label>
                        <input type="text" .value=${this._groqModel} @input=${e => this._saveGroqModel(e.target.value)} />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Groq Image Model</label>
                        <input type="text" .value=${this._groqImageModel} @input=${e => this._saveGroqImageModel(e.target.value)} />
                    </div>

                    <label class="config-checkbox">
                        <input
                            type="checkbox"
                            .checked=${this._disableGroqThinking}
                            @change=${e => this._saveDisableGroqThinking(e.target.checked)}
                        />
                        <span class="config-checkbox-text">
                            <span class="config-summary-title">Disable thinking</span>
                            <span class="config-summary-description">Faster responses with less internal reasoning</span>
                        </span>
                    </label>

                    <div class="config-note">
                        If the Groq API key is empty, Gemini Live is used for answers instead. Its answer quality may be lower.
                    </div>
                </div>
            </details>

            ${this._renderStartButton()} ${this._renderDivider()}

            <!-- Cloud promo intentionally removed from the active UI. -->

            <div class="mode-links">
                <button class="mode-link" @click=${() => this._saveMode('local')}>Use local AI</button>
            </div>
        `;
    }

    // ── Local AI mode ──

    async _saveHostedField(field, value, credential = false) {
        this[`_${field}`] = value;
        this._hostedModels = { ...this._hostedModels, [field]: value };
        this._keyError = false;
        const result = credential
            ? await cheatingDaddy.storage.setCredentials({ [field]: value.trim() })
            : await cheatingDaddy.storage.updateConfig(field, value.trim());
        if (!result.success) this._keyError = true;
    }

    async recordBenchmark() {
        if (this.isInitializing || this._benchmarkBusy) return;
        if (this._recording) {
            if (this._recorder?.state === 'recording') this._recorder.stop();
            else {
                this._recordEpoch++;
                this._recording = false;
            }
            return;
        }
        const epoch = ++this._recordEpoch;
        this._recorder = null;
        this._recording = true;
        this._recordedAudio = null;
        this._benchmarkText = '';
        this._benchmarkError = '';
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (epoch !== this._recordEpoch || !this.isConnected) {
                stream.getTracks().forEach(t => t.stop());
                return;
            }
            this._recordStream = stream;
            const mimeType = ['audio/webm;codecs=opus', 'audio/mp4'].find(type => MediaRecorder.isTypeSupported(type));
            if (!mimeType) throw Error('Запись аудио не поддерживается');
            const recorder = (this._recorder = new MediaRecorder(stream, { mimeType }));
            const chunks = [];
            recorder.ondataavailable = e => {
                if (e.data.size) chunks.push(e.data);
            };
            recorder.onstop = async () => {
                clearTimeout(this._recordTimer);
                stream.getTracks().forEach(t => t.stop());
                this._recording = false;
                if (epoch !== this._recordEpoch) return;
                this._audioPending = true;
                try {
                    const blob = new Blob(chunks, { type: mimeType });
                    if (!blob.size || blob.size > 8000000) throw Error('Запишите короткий вопрос');
                    const data = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result.split(',')[1]);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                    if (epoch === this._recordEpoch) this._recordedAudio = { audio: data, format: mimeType.includes('mp4') ? 'mp4' : 'webm' };
                } catch (e) {
                    this._benchmarkError = e.message || 'Не удалось сохранить запись';
                } finally {
                    this._audioPending = false;
                }
            };
            recorder.onerror = () => {
                this._benchmarkError = 'Не удалось записать голос';
                stream.getTracks().forEach(t => t.stop());
                this._recording = false;
            };
            recorder.start();
            this._recordTimer = setTimeout(() => {
                if (recorder.state === 'recording') recorder.stop();
            }, 60000);
        } catch (e) {
            if (epoch !== this._recordEpoch) return;
            this._recordStream?.getTracks().forEach(t => t.stop());
            this._recording = false;
            this._benchmarkError = e.message;
        }
    }

    async addBenchmarkImage(event) {
        const input = event.target;
        const files = [...(input.files || [])];
        try {
            for (const file of files) {
                if (this._benchmarkImages.length >= 4) throw Error('До 4 изображений');
                if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10000000)
                    throw Error('Выберите PNG, JPEG или WebP до 10 МБ');
                const bitmap = await createImageBitmap(file);
                const canvas = document.createElement('canvas');
                const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
                canvas.width = Math.max(1, Math.round(bitmap.width * scale));
                canvas.height = Math.max(1, Math.round(bitmap.height * scale));
                const context = canvas.getContext('2d');
                context.fillStyle = '#fff';
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
                bitmap.close();
                this._benchmarkImages = [...this._benchmarkImages, canvas.toDataURL('image/jpeg', 0.9).split(',')[1]];
            }
        } catch (e) {
            this._benchmarkError = e.message;
        }
        input.value = '';
    }

    async runBenchmark() {
        if (this.isInitializing || this._benchmarkBusy || this._recording || this._audioPending) return;
        this._benchmarkBusy = true;
        this._benchmarkResults = [];
        this._benchmarkError = '';
        const ipc = window.require('electron').ipcRenderer;
        const receive = (_event, row) => {
            this._benchmarkResults = [...this._benchmarkResults, row];
        };
        ipc.on('session:benchmark-result', receive);
        try {
            const result = await ipc.invoke('session:benchmark', {
                provider: this._mode,
                text: this._benchmarkText || '',
                images: this._benchmarkImages,
                ...this._recordedAudio,
            });
            if (!result.success) throw Error(result.error);
            this._benchmarkResults = result.data;
        } catch (e) {
            this._benchmarkError = e.message;
        } finally {
            ipc.removeListener('session:benchmark-result', receive);
            this._benchmarkBusy = false;
        }
    }

    _renderBenchmark() {
        return html`<button class="benchmark-toggle" @click=${() => (this._benchmarkOpen = !this._benchmarkOpen)}>Проверить скорость</button> ${
                this._benchmarkOpen
                    ? html`<div class="benchmark-panel">
                          <textarea
                              aria-label="Запрос для проверки скорости"
                              placeholder="Ваш запрос"
                              maxlength="1500"
                              ?disabled=${this._benchmarkBusy || this._recording || this._audioPending}
                              .value=${this._benchmarkText || ''}
                              @input=${e => {
                                  this._benchmarkText = e.target.value;
                                  this._recordedAudio = null;
                              }}
                          ></textarea>
                          <input
                              id="benchmark-images"
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              multiple
                              hidden
                              @change=${this.addBenchmarkImage}
                          />
                          <div class="benchmark-actions">
                              <button ?disabled=${this._benchmarkBusy} @click=${() => this.shadowRoot.querySelector('#benchmark-images').click()}>
                                  Изображение +
                              </button>
                              ${this._benchmarkImages.map((image, index) => html`<button ?disabled=${this._benchmarkBusy} aria-label="Удалить изображение" @click=${() => (this._benchmarkImages = this._benchmarkImages.filter((_, i) => i !== index))}><img src=${'data:image/jpeg;base64,' + image} style="width:48px;height:36px;object-fit:contain" /> ×</button>`)}
                              <button ?disabled=${this._benchmarkBusy || this._audioPending} @click=${this.recordBenchmark}>
                                  ${this._recording ? 'Завершить запись' : this._recordedAudio ? 'Перезаписать' : 'Записать голос'}
                              </button>
                              ${this._recordedAudio ? html`<button ?disabled=${this._benchmarkBusy} aria-label="Удалить запись" @click=${() => (this._recordedAudio = null)}>×</button>` : ''}
                              <button
                                  ?disabled=${this._benchmarkBusy || this._recording || this._audioPending || (!this._benchmarkText?.trim() && !this._recordedAudio && !this._benchmarkImages.length)}
                                  @click=${this.runBenchmark}
                              >
                                  Проверить
                              </button>
                              ${this._benchmarkBusy ? html`<button @click=${() => window.require('electron').ipcRenderer.invoke('session:benchmark-cancel')}>Отмена</button>` : ''}
                          </div>
                          <div class="form-hint">Полный ответ · платные API-запросы.</div>
                          ${this._benchmarkResults.map(
                              row =>
                                  html`<details class="benchmark-result">
                                      <summary>${row.role}<strong>${row.ok ? `${row.seconds} с` : 'Ошибка'}</strong></summary>
                                      <div class="form-hint">${row.model}</div>
                                      <pre>${row.text || row.error}</pre>
                                  </details>`
                          )}
                          ${this._benchmarkBusy ? html`<div role="status">Проверка…</div>` : ''}
                          ${this._benchmarkError ? html`<div role="alert">${this._benchmarkError}</div>` : ''}
                      </div>`
                    : ''
            }`;
    }

    _renderHostedMode() {
        const router = this._mode === 'openrouter';
        const keyField = router ? 'openrouterKey' : 'openaiKey';
        const modelField = router ? 'openrouterModel' : 'openaiModel';
        const customResponse = router && (this._customRouterModel || !OPENROUTER_RESPONSE_MODELS.some(model => model.id === this._openrouterModel));
        const prefix = router ? 'openrouter' : 'openai';
        const imageModels = router
            ? [...OPENROUTER_RESPONSE_MODELS.map(model => model.id), 'openai/gpt-4o-mini', 'google/gemini-2.5-flash-lite']
            : ['gpt-5.4-nano', 'gpt-4o-mini', 'gpt-4.1-mini'];
        const fields = [
            {
                suffix: 'TranscriptionModel',
                label: 'Speech to text',
                fallback: router ? 'openai/whisper-1' : 'whisper-1',
                choices: router
                    ? ['openai/gpt-4o-mini-transcribe', 'openai/whisper-1', 'openai/whisper-large-v3']
                    : ['gpt-4o-mini-transcribe-2025-12-15', 'whisper-1', 'gpt-4o-mini-transcribe', 'gpt-4o-transcribe'],
                hint: 'Модель для /audio/transcriptions. Обычная чат-модель не подойдёт.',
            },
            {
                suffix: 'OcrModel',
                label: 'Распознавание текста',
                fallback: router ? 'google/gemini-2.5-flash-lite' : 'gpt-4o-mini',
                choices: imageModels,
                hint: 'Режим «Распознать текст»: эта модель извлекает текст, модель ответа решает задачу.',
            },
            {
                suffix: 'VisionModel',
                label: 'Vision · анализ изображений',
                fallback: '',
                choices: imageModels,
                hint: 'Режим «Анализ изображения»: эта модель получает скриншот целиком и отвечает на вопрос.',
            },
        ];
        return html`
            <div class="config-section">
                <div class="config-content">
                    <div class="form-group">
                        <label class="form-label" for="hosted-key">${router ? 'OpenRouter' : 'OpenAI'} API Key</label>
                        <input
                            id="hosted-key"
                            type="password"
                            autocomplete="off"
                            placeholder="Required"
                            .value=${this[`_${keyField}`]}
                            class=${this._keyError ? 'error' : ''}
                            @input=${e => this._saveHostedField(keyField, e.target.value, true)}
                        />
                    </div>
                    <div class="form-group">
                        <label class="form-label" for=${router ? undefined : 'hosted-model'}>Response model · ответы</label>
                        ${
                            router
                                ? html`<div class="model-cards" role="group" aria-label="Модель ответа OpenRouter">
                                          ${OPENROUTER_RESPONSE_MODELS.map(
                                              model =>
                                                  html`<button
                                                      type="button"
                                                      class="model-card"
                                                      data-model=${model.id}
                                                      aria-pressed=${!customResponse && this._openrouterModel === model.id}
                                                      @click=${() => {
                                                          this._customRouterModel = false;
                                                          this._saveHostedField(modelField, model.id);
                                                      }}
                                                  >
                                                      <span class="model-card-head"
                                                          ><span>${model.label}</span><span class="model-radio" aria-hidden="true"></span
                                                      ></span>
                                                      <span class="model-metrics"
                                                          >${[
                                                              ['Speed', model.speed],
                                                              ['Reasoning', model.reasoning],
                                                          ].map(
                                                              ([label, score]) =>
                                                                  html` <span class="model-metric"
                                                                      ><span class="model-metric-label"
                                                                          ><span>${label}</span><span>${score}/5</span></span
                                                                      >
                                                                      <span class="model-meter" aria-hidden="true"
                                                                          >${[1, 2, 3, 4, 5].map(i => html`<i class=${i <= score ? 'filled' : ''}></i>`)}</span
                                                                      ></span
                                                                  >`
                                                          )}</span
                                                      >
                                                      <span class="model-price"
                                                          ><span>Input <strong>$${model.input}</strong></span
                                                          ><span>Output <strong>$${model.output}</strong></span></span
                                                      >
                                                  </button>`
                                          )}
                                          <button
                                              type="button"
                                              class="custom-model"
                                              aria-pressed=${!!customResponse}
                                              @click=${() => {
                                                  this._customRouterModel = true;
                                              }}
                                          >
                                              Другая модель…
                                          </button>
                                      </div>
                                      <div class="model-price-unit">
                                          USD за 1 млн токенов · без кеша<br />Speed / Reasoning — условные оценки, не замеры.
                                      </div>`
                                : ''
                        }
                        ${
                            !router || customResponse
                                ? html`<input
                                      id="hosted-model"
                                      aria-label="Model ID"
                                      type="text"
                                      list="hosted-response-models"
                                      .value=${this[`_${modelField}`]}
                                      placeholder=${router ? 'openai/model-id' : 'gpt-4o-mini'}
                                      @input=${e => this._saveHostedField(modelField, e.target.value)}
                                  />`
                                : ''
                        }
                        <datalist id="hosted-response-models">
                            ${(router ? OPENROUTER_RESPONSE_MODELS.map(model => model.id) : ['gpt-4o-mini', 'gpt-5.4-nano']).map(id => html`<option value=${id}></option>`)}
                        </datalist>
                        <div class="form-hint">
                            ${router ? 'Use an openai/ model ID from OpenRouter.' : 'Use an OpenAI model that supports Chat Completions.'}
                        </div>
                    </div>
                    ${fields.map(({ suffix, label, fallback, choices, hint }) => {
                        const field = `${prefix}${suffix}`;
                        const stt = suffix === 'TranscriptionModel';
                        const value = this._hostedModels[field] ?? fallback;
                        const customStt = stt && (this._customStt[prefix] || !choices.includes(value));
                        return html`<div class="form-group">
                            <label class="form-label" for=${stt ? `${field}-select` : field}>${label}</label>
                            ${
                                stt
                                    ? html`<select
                                          id=${`${field}-select`}
                                          .value=${customStt ? 'custom' : value}
                                          @change=${e => {
                                              this._customStt = { ...this._customStt, [prefix]: e.target.value === 'custom' };
                                              if (e.target.value !== 'custom') this._saveHostedField(field, e.target.value);
                                          }}
                                      >
                                          ${choices.map(id => html`<option value=${id}>${id}</option>`)}
                                          <option disabled>GPT Realtime Whisper · нужен Realtime-режим</option>
                                          <option value="custom">Другая модель…</option>
                                      </select>`
                                    : ''
                            }
                            ${
                                !stt || customStt
                                    ? html`
                                          <input
                                              id=${field}
                                              type="text"
                                              list=${`${field}-choices`}
                                              .value=${this._hostedModels[field] ?? fallback}
                                              placeholder=${suffix === 'VisionModel' ? 'Как модель ответа' : fallback}
                                              @input=${e => this._saveHostedField(field, e.target.value)}
                                          />
                                      `
                                    : ''
                            }
                            <datalist id=${`${field}-choices`}>${choices.map(id => html`<option value=${id}></option>`)}</datalist>
                            <div class="form-hint">${hint}</div>
                        </div>`;
                    })}
                    <div class="form-hint">
                        Выберите подсказку или введите свой ID модели. Распознавание текста и анализ изображений требуют поддержки изображений.
                        Настройки сохраняются автоматически и применяются в новой сессии. API оплачивается отдельно.
                    </div>
                </div>
            </div>
            ${this._renderBenchmark()} ${this._renderStartButton()}
        `;
    }

    _renderLocalMode() {
        return html`
            <details class="config-section">
                <summary class="config-summary">
                    <span class="config-summary-text">
                        <span class="config-summary-title">Language model</span>
                        <span class="config-summary-description">Local GGUF model</span>
                    </span>
                    ${this._renderConfigChevron()}
                </summary>
                <div class="config-content">
                    <div class="form-group">
                        <label class="form-label">Model</label>
                        <select
                            .value=${this._useCustomLocalLlmModel ? 'custom' : this._localLlmModel}
                            @change=${event => this._selectLocalLlmModel(event.target.value)}
                        >
                            ${LOCAL_LLM_PRESETS.map(preset => html`<option value=${preset.value}>${preset.label}</option>`)}
                            <option value="custom">Custom Hugging Face model or local GGUF…</option>
                        </select>
                        ${
                            this._useCustomLocalLlmModel
                                ? html`
                                      <input
                                          type="text"
                                          placeholder="owner/repository:quant or /absolute/model.gguf"
                                          .value=${this._localLlmModel}
                                          @input=${event => this._saveLocalLlmModel(event.target.value)}
                                      />
                                  `
                                : ''
                        }
                        <div class="form-hint">Sizes include the vision model. Q4 uses less memory; Q8 preserves more quality.</div>
                    </div>
                </div>
            </details>

            <details class="config-section">
                <summary class="config-summary">
                    <span class="config-summary-text">
                        <span class="config-summary-title">Transcription</span>
                        <span class="config-summary-description">Whisper speech-to-text model</span>
                    </span>
                    ${this._renderConfigChevron()}
                </summary>
                <div class="config-content">
                    <div class="form-group">
                        <div class="whisper-label-row">
                            <label class="form-label">Whisper Model</label>
                            ${this.whisperDownloading ? html`<div class="whisper-spinner"></div>` : ''}
                        </div>
                        <select .value=${this._whisperModel} @change=${e => this._saveWhisperModel(e.target.value)}>
                            <option value="tiny.en" ?selected=${this._whisperModel === 'tiny.en'}>Tiny English (75 MB, fastest)</option>
                            <option value="base.en" ?selected=${this._whisperModel === 'base.en'}>Base English (142 MB)</option>
                            <option value="small.en" ?selected=${this._whisperModel === 'small.en'}>Small English (466 MB, most accurate)</option>
                        </select>
                        <div class="form-hint">${this.whisperDownloading ? 'Downloading model...' : 'Downloaded automatically on first use'}</div>
                    </div>
                </div>
            </details>

            ${this._renderStartButton()} ${this._renderDivider()}

            <!-- Cloud promo intentionally removed from the active UI. -->

            <div class="mode-links">
                <button class="mode-link" @click=${() => this._saveMode('byok')}>Use own API keys</button>
            </div>
        `;
    }

    // ── Main render ──

    render() {
        const helpIcon = html`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0m9 5v.01" />
                <path d="M12 13.5a1.5 1.5 0 0 1 1-1.5a2.6 2.6 0 1 0-3-4" />
            </g>
        </svg>`;
        const closeIcon = html`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6l12 12" />
        </svg>`;

        return html`
            <div class="form-wrapper">
                ${
                    this._mode === 'local'
                        ? html`
                              <div class="title-row">
                                  <div class="page-title">Cheating Daddy <span class="mode-suffix">Local AI</span></div>
                                  <button class="help-btn" @click=${this._openLocalHelp} aria-label="Open Local AI help">${helpIcon}</button>
                              </div>
                          `
                        : html`
                              <div class="page-title">
                                  ${html`Cheating Daddy <span class="mode-suffix">${this._mode === 'openrouter' ? 'OpenRouter' : this._mode === 'openai' ? 'OpenAI' : 'BYOK'}</span>`}
                              </div>
                          `
                }
                <div class="page-subtitle">Choose how to answer your calls</div>
                <div class="form-group">
                    <label class="form-label" for="provider-mode">AI provider</label>
                    <select id="provider-mode" .value=${this._mode} @change=${e => this._saveMode(e.target.value)}>
                        <option value="openrouter">OpenRouter · OpenAI models</option>
                        <option value="openai">OpenAI</option>
                        <option value="byok">Gemini / Groq</option>
                        <option value="local">Local AI</option>
                    </select>
                </div>

                ${this.errorMessage ? html`<div class="form-hint" role="alert">${this.errorMessage}</div>` : ''}
                <div class="form-hint">Инструкции для новой сессии: ${this._instructionName}. Выбор — в AI Customization.</div>
                <!-- Cloud mode render branch intentionally disabled. -->
                ${this._mode === 'byok' ? this._renderByokMode() : ''} ${this._mode === 'local' ? this._renderLocalMode() : ''}
                ${['openai', 'openrouter'].includes(this._mode) ? this._renderHostedMode() : ''}
            </div>
            ${this._mode === 'local' && this._showLocalHelp ? this._renderLocalHelp(closeIcon) : ''}
        `;
    }

    _renderLocalHelp(closeIcon) {
        return html`
            <div class="help-dialog-backdrop" @click=${this._closeLocalHelp}>
                <section class="help-dialog" role="dialog" aria-modal="true" aria-labelledby="local-help-title" @click=${this._handleHelpDialogClick}>
                    <div class="help-dialog-header">
                        <div id="local-help-title" class="help-dialog-title">Local AI setup</div>
                        <button class="help-btn" @click=${this._closeLocalHelp} aria-label="Close Local AI help">${closeIcon}</button>
                    </div>

                    <div class="help-content">
                        <div class="help-section">
                            <div class="help-section-title">Native local AI</div>
                            <div class="help-section-text">
                                Cheating Daddy runs llama.cpp and whisper.cpp directly. Everything stays on your computer — no external AI service or
                                Ollama installation is required.
                            </div>
                        </div>

                        <div class="help-section">
                            <div class="help-section-title">Automatic setup</div>
                            <div class="help-section-text">
                                The correct native runners, selected Whisper model, and language model are downloaded and checksum-verified on first
                                use. They are stored in the Cheating Daddy config directory.
                            </div>
                        </div>

                        <div class="help-section">
                            <div class="help-section-title">Default model</div>
                            <div class="help-models">
                                <div class="help-model">
                                    <span class="help-model-name">Qwen3.5 4B Q4_K_M</span><span>About 2.7 GB — balanced local quality and speed</span>
                                </div>
                            </div>
                        </div>

                        <div class="help-section">
                            <div class="help-section-title">Whisper</div>
                            <div class="help-section-text">
                                The selected whisper.cpp model is downloaded automatically once and kept in the config directory.
                            </div>
                        </div>

                        <hr class="help-divider" />

                        <div class="help-section">
                            <div class="help-section-title">Computer hanging or slow?</div>
                            <div class="help-section-text">
                                Running models locally uses a lot of RAM and CPU. If your computer slows down or freezes, it's likely the LLM. Switch
                                back to BYOK mode if you want to use a hosted provider instead.
                            </div>
                        </div>

                        <button
                            class="help-cloud-btn"
                            @click=${() => {
                                this._closeLocalHelp();
                                this._saveMode('byok');
                            }}
                        >
                            Switch to BYOK
                        </button>
                    </div>
                </section>
            </div>
        `;
    }
}

customElements.define('main-view', MainView);
