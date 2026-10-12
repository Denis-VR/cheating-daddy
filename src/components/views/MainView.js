import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

const OPENROUTER_RESPONSE_MODELS = [
    { id: 'openai/gpt-5-nano', label: 'GPT-5 Nano', speed: 5, reasoning: 2, input: '0.05', output: '0.40' },
    { id: 'openai/gpt-5.4-mini', label: 'GPT-5.4 Mini', speed: 4, reasoning: 4, input: '0.75', output: '4.50' },
    { id: 'openai/gpt-5.4-nano', label: 'GPT-5.4 Nano', speed: 4, reasoning: 3, input: '0.20', output: '1.25' },
];

const LOCAL_LLM_PRESETS = [
    { value: 'unsloth/Qwen3.5-0.8B-GGUF:Q4_K_M', label: 'Qwen 3.5 0.8B Q4 — 0.74 GB · Быстрее' },
    { value: 'unsloth/Qwen3.5-0.8B-GGUF:Q8_0', label: 'Qwen 3.5 0.8B Q8 — 1.02 GB' },
    { value: 'unsloth/Qwen3.5-2B-GGUF:Q4_K_M', label: 'Qwen 3.5 2B Q4 — 1.95 GB' },
    { value: 'unsloth/Qwen3.5-2B-GGUF:Q8_0', label: 'Qwen 3.5 2B Q8 — 2.68 GB' },
    { value: 'unsloth/Qwen3.5-4B-GGUF:Q4_K_M', label: 'Qwen 3.5 4B Q4 — 3.42 GB · Рекомендуется' },
    { value: 'unsloth/Qwen3.5-4B-GGUF:Q8_0', label: 'Qwen 3.5 4B Q8 — 5.16 GB' },
    { value: 'unsloth/Qwen3.5-9B-GGUF:Q4_K_M', label: 'Qwen 3.5 9B Q4 — 6.60 GB' },
    { value: 'unsloth/Qwen3.5-9B-GGUF:Q8_0', label: 'Qwen 3.5 9B Q8 — 10.45 GB' },
    { value: 'unsloth/Qwen3.5-27B-GGUF:Q4_K_M', label: 'Qwen 3.5 27B Q4 — 17.67 GB' },
    { value: 'unsloth/Qwen3.5-35B-A3B-GGUF:Q4_K_M', label: 'Qwen 3.5 35B-A3B Q4 — 22.92 GB · Большая' },
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
            max-width: 820px;
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

        .model-card {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            text-align: left;
        }
        .model-ratings {
            display: flex;
            gap: 24px;
        }
        .model-ratings span {
            display: grid;
            gap: 4px;
            flex: 1;
        }
        .model-ratings meter {
            width: 100%;
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

        .form-wrapper {
            padding: 20px;
            gap: 14px;
        }
        .setup-card {
            padding: 14px;
            border: 1px solid var(--border);
            border-radius: 10px;
            background: var(--bg-surface);
        }
        .section-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            font-weight: 600;
            font-size: 15px;
            margin-bottom: 10px;
        }
        .page-title {
            font-size: 22px;
            margin: 0;
        }
        .context-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
        }
        label {
            display: grid;
            gap: 6px;
            font-size: 13px;
            color: var(--text-secondary);
        }
        label select,
        label input {
            width: 100%;
            min-width: 0;
        }
        .text-button,
        .model-select {
            border: 1px solid var(--border);
            border-radius: 7px;
            padding: 7px 10px;
            color: var(--text-primary);
            background: var(--bg-elevated);
            cursor: pointer;
        }
        .text-button {
            font-size: 12px;
        }
        .model-select {
            width: 100%;
            display: flex;
            justify-content: space-between;
            text-align: left;
            gap: 12px;
            font-size: 14px;
        }
        .model-select span {
            color: var(--text-muted);
        }
        .model-select[aria-pressed='true'] {
            border-color: var(--accent);
        }
        .connection-settings {
            margin-top: 12px;
        }
        .connection-settings summary {
            cursor: pointer;
            font-size: 13px;
            color: var(--text-secondary);
        }
        .connection-settings > label,
        .connection-settings > div {
            margin-top: 12px;
        }
        .model-backdrop {
            position: fixed;
            inset: 0;
            background: #0009;
            display: grid;
            place-items: center;
            z-index: 100;
            padding: 20px;
        }
        .model-dialog {
            width: min(460px, 100%);
            max-height: 80vh;
            overflow: auto;
            padding: 20px;
            border: 1px solid var(--border);
            border-radius: 12px;
            background: var(--bg-app);
            display: grid;
            gap: 14px;
        }
        .model-options {
            display: grid;
            gap: 8px;
        }
        @media (max-width: 600px) {
            .context-grid {
                grid-template-columns: 1fr;
            }
            .form-wrapper {
                padding: 12px;
            }
        }
    `;

    static properties = {
        recovery: { type: Object },
        review: { type: Object },
        _contextPrefs: { state: true },
        _workspace: { state: true },
        _modelPicker: { state: true },
        _sharingVisible: { state: true },
        _selectionBusy: { state: true },
        _pageError: { state: true },

        onStart: { type: Function },
        onExternalLink: { type: Function },
        selectedProfile: { type: String },
        onProfileChange: { type: Function },
        isInitializing: { type: Boolean },
        errorMessage: { type: String },
        whisperЗагрузка: { type: Boolean },
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
        this._contextPrefs = { aiProfiles: [], instructionPresets: [] };
        this._workspace = { resumes: [], vacancies: [], activeResumeId: '', activeVacancyId: '' };
        this._modelPicker = false;
        this._selectionBusy = false;
        this._pageError = '';

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

            this._sharingVisible = config.showInScreenSharing === true;
            this._contextPrefs = prefs;
            const workspace = await window.require('electron').ipcRenderer.invoke('interview:workspace-load');
            if (!workspace.success) throw Error(workspace.error);
            this._workspace = workspace.data;
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
            this._pageError = e.message;
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
        if (changedProperties.has('_modelPicker')) {
            this.shadowRoot.querySelector(this._modelPicker ? '.model-dialog button' : '.model-select')?.focus();
        }
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
        if (this._modelPicker && e.key === 'Tab') {
            const controls = [...this.shadowRoot.querySelectorAll('.model-dialog button, .model-dialog input')];
            const current = controls.indexOf(this.shadowRoot.activeElement);
            if ((e.shiftKey && current <= 0) || (!e.shiftKey && current === controls.length - 1)) {
                e.preventDefault();
                controls[e.shiftKey ? controls.length - 1 : 0]?.focus();
            }
        }
        if (e.key === 'Escape' && this._modelPicker) {
            this._modelPicker = false;
            return;
        }
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
        if (this.isInitializing || this.downloadProgress.active || this._selectionBusy) return;

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
                    ${isDownloading ? (hasPercentage ? `${percentage}%` : 'Подготовка…') : 'Начать сессию'}
                    ${isDownloading ? '' : html`<span class="shortcut-hint">${isMac ? cmdIcon : ctrlIcon}${enterIcon}</span>`}
                </span>
            </button>
            ${
                isDownloading
                    ? html`
                          <div class="download-controls">
                              <span>Загрузка: ${this.downloadProgress.label || 'Файлы локального AI'}</span>
                              <button class="download-cancel" @click=${() => this.onCancelDownload()}>Отмена</button>
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
                        <span class="config-summary-title">Распознавание речи</span>
                        <span class="config-summary-description">Подключение Gemini Live</span>
                    </span>
                    ${this._renderConfigChevron()}
                </summary>
                <div class="config-content">
                    <div class="form-group">
                        <label class="form-label">API-ключ Gemini</label>
                        <input
                            type="password"
                            placeholder="Обязательно"
                            .value=${this._geminiKey}
                            @input=${e => this._saveGeminiKey(e.target.value)}
                            class=${this._keyError ? 'error' : ''}
                        />
                        <div class="form-hint">
                            <span class="link" @click=${() => this.onExternalLink('https://aistudio.google.com/apikey')}>Получить ключ Gemini</span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Модель Gemini Live</label>
                        <input type="text" .value=${this._geminiLiveModel} @input=${e => this._saveGeminiLiveModel(e.target.value)} />
                    </div>
                </div>
            </details>

            <details class="config-section">
                <summary class="config-summary">
                    <span class="config-summary-text">
                        <span class="config-summary-title">Ответы AI</span>
                        <span class="config-summary-description">Ключ Groq и модель ответа</span>
                    </span>
                    ${this._renderConfigChevron()}
                </summary>
                <div class="config-content">
                    <div class="form-group">
                        <label class="form-label">API-ключ Groq</label>
                        <input type="password" placeholder="Необязательно" .value=${this._groqKey} @input=${e => this._saveGroqKey(e.target.value)} />
                        <div class="form-hint">
                            <span class="link" @click=${() => this.onExternalLink('https://console.groq.com/keys')}>Получить ключ Groq</span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Модель Groq</label>
                        <input type="text" .value=${this._groqModel} @input=${e => this._saveGroqModel(e.target.value)} />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Модель изображений Groq</label>
                        <input type="text" .value=${this._groqImageModel} @input=${e => this._saveGroqImageModel(e.target.value)} />
                    </div>

                    <label class="config-checkbox">
                        <input
                            type="checkbox"
                            .checked=${this._disableGroqThinking}
                            @change=${e => this._saveDisableGroqThinking(e.target.checked)}
                        />
                        <span class="config-checkbox-text">
                            <span class="config-summary-title">Короткое рассуждение</span>
                            <span class="config-summary-description">Ускоряет генерацию ответа</span>
                        </span>
                    </label>

                    <div class="config-note">
                        If the Groq API key is empty, Gemini Live is used for answers instead. Its answer quality may be lower.
                    </div>
                </div>
            </details>

            ${this._renderDivider()}

            <!-- Cloud promo intentionally removed from the active UI. -->

            <div class="mode-links">
                <button class="mode-link" @click=${() => this._saveMode('local')}>Локальные модели</button>
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
        if (!result.success) {
            this._keyError = true;
            this._pageError = result.error || 'Не удалось сохранить настройки';
        }
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

    async _selectContext(field, id) {
        if (this._selectionBusy) return;
        this._selectionBusy = true;
        this._pageError = '';
        try {
            if (field === 'activeResumeId' || field === 'activeVacancyId') {
                const result = await window.require('electron').ipcRenderer.invoke('interview:workspace-save', { ...this._workspace, [field]: id });
                if (!result.success) throw Error(result.error);
                this._workspace = result.data;
            } else {
                const patch = { [field]: id };
                if (field === 'activeInstructionId' && !id) {
                    patch.instructionPresets = [
                        ...this._contextPrefs.instructionPresets.filter(p => p.id !== 'no-instructions'),
                        { id: 'no-instructions', name: 'Без дополнительных инструкций', text: '' },
                    ];
                    patch.activeInstructionId = 'no-instructions';
                }
                const result = await cheatingDaddy.storage.setPreferences(patch);
                if (!result.success) throw Error(result.error);
                this._contextPrefs = await cheatingDaddy.storage.getPreferences();
                if (field === 'selectedProfile') await this.onProfileChange(id);
            }
        } catch (e) {
            this._pageError = e.message;
        } finally {
            this._selectionBusy = false;
        }
    }
    _renderContext() {
        const prefs = this._contextPrefs;
        return html`<section class="setup-card">
            <div class="section-heading">
                Контекст сессии
                <button class="text-button" @click=${() => window.cheatingDaddy.element().navigate('ai-customize')}>Редактировать →</button>
            </div>
            <div class="context-grid">
                ${[
                    ['activeResumeId', 'Резюме', this._workspace.resumes, this._workspace.activeResumeId, 'Без резюме'],
                    ['activeVacancyId', 'Вакансия', this._workspace.vacancies, this._workspace.activeVacancyId, 'Без вакансии'],
                    ['selectedProfile', 'Профиль', prefs.aiProfiles, prefs.selectedProfile, 'Без профиля'],
                    ['activeInstructionId', 'Доп. инструкции', prefs.instructionPresets, prefs.activeInstructionId, 'Без дополнительных инструкций'],
                ].map(
                    ([field, label, items, active, empty]) =>
                        html`<label
                            >${label}<select
                                aria-label=${label}
                                ?disabled=${this._selectionBusy}
                                .value=${active || ''}
                                @change=${e => this._selectContext(field, e.target.value)}
                            >
                                ${empty ? html`<option value="" ?selected=${!active}>${empty}</option>` : ''}
                                ${(items || []).map(item => html`<option value=${item.id} ?selected=${item.id === active}>${item.name}</option>`)}
                            </select></label
                        >`
                )}
            </div>
        </section>`;
    }
    _renderHostedMode() {
        const router = this._mode === 'openrouter',
            prefix = router ? 'openrouter' : 'openai';
        const model = this[`_${prefix}Model`];
        return html`<section class="setup-card">
                <div class="section-heading">Модель ответа</div>
                <button class="model-select" @click=${() => (this._modelPicker = true)}>${model}<span>Выбрать ▾</span></button>
                <details class="connection-settings" ?open=${this._keyError || !this[`_${prefix}Key`]}>
                    <summary>Подключение и распознавание</summary>
                    <label
                        >API-ключ ${router ? 'OpenRouter' : 'OpenAI'}<input
                            type="password"
                            autocomplete="off"
                            aria-label="API-ключ"
                            .value=${this[`_${prefix}Key`]}
                            @input=${e => this._saveHostedField(prefix + 'Key', e.target.value, true)}
                    /></label>
                    <div class="context-grid">
                        ${[
                            ['TranscriptionModel', 'Распознавание речи', router ? 'openai/whisper-1' : 'whisper-1'],
                            ['OcrModel', 'Распознавание текста на снимке', router ? 'google/gemini-2.5-flash-lite' : 'gpt-4o-mini'],
                            ['VisionModel', 'Анализ изображений', model],
                        ].map(
                            ([suffix, label, fallback]) =>
                                html`<label
                                    >${label}<input
                                        .value=${this._hostedModels[prefix + suffix] || fallback}
                                        @input=${e => this._saveHostedField(prefix + suffix, e.target.value)}
                                /></label>`
                        )}
                    </div>
                    ${this._renderBenchmark()}
                </details>
            </section>
            ${
                this._modelPicker
                    ? html`<div class="model-backdrop" @click=${() => (this._modelPicker = false)}>
                          <section
                              class="model-dialog"
                              role="dialog"
                              aria-modal="true"
                              aria-label="Выбор модели"
                              @click=${e => e.stopPropagation()}
                              @keydown=${e => {
                                  if (e.key === 'Escape') this._modelPicker = false;
                              }}
                          >
                              <div class="section-heading">
                                  Модель ответа<button
                                      class="text-button"
                                      aria-label="Закрыть выбор модели"
                                      @click=${() => (this._modelPicker = false)}
                                  >
                                      ✕
                                  </button>
                              </div>
                              <div class="model-options">
                                  ${(router
                                      ? OPENROUTER_RESPONSE_MODELS
                                      : [
                                            { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
                                            { id: 'gpt-5.4-nano', label: 'GPT-5.4 Nano' },
                                        ]
                                  ).map(
                                      item =>
                                          html`<button
                                              class="model-select model-card"
                                              aria-pressed=${model === item.id}
                                              @click=${async () => {
                                                  await this._saveHostedField(prefix + 'Model', item.id);
                                                  this._modelPicker = false;
                                              }}
                                          >
                                              <strong>${item.label} ${model === item.id ? '✓' : ''}</strong>
                                              ${
                                                  router
                                                      ? html`<div class="model-ratings">
                                                                <span
                                                                    >Скорость ${item.speed}/5
                                                                    <meter min="0" max="5" value=${item.speed}></meter></span
                                                                ><span
                                                                    >Интеллект ${item.reasoning}/5
                                                                    <meter min="0" max="5" value=${item.reasoning}></meter
                                                                ></span>
                                                            </div>
                                                            <small>Вход $${item.input} · выход $${item.output} / 1 млн токенов</small>`
                                                      : ''
                                              }
                                          </button>`
                                  )}
                              </div>
                              <label
                                  >Другая модель<input
                                      aria-label="ID модели"
                                      .value=${model}
                                      @change=${e => this._saveHostedField(prefix + 'Model', e.target.value)}
                              /></label>
                              <button class="text-button" @click=${() => (this._modelPicker = false)}>Готово</button>
                          </section>
                      </div>`
                    : ''
            }`;
    }
    _renderBridgeMode() {
        const claude = this._mode === 'claude-code';
        return html`<section class="setup-card">
            <div class="section-heading">${claude ? 'Claude Code' : 'ChatGPT через Codex'}</div>
            <p class="form-hint">
                ${claude ? 'Используется вход в установленный Claude Code.' : 'Используется вход в ChatGPT через установленный Codex CLI.'}
            </p>
            <label
                >Модель<input
                    placeholder="По умолчанию из CLI"
                    .value=${this._hostedModels[this._mode + 'Model'] || ''}
                    @input=${e => this._saveHostedField(this._mode + 'Model', e.target.value)}
            /></label>
            <details class="connection-settings">
                <summary>Подключение</summary>
                <p class="form-hint">
                    ${claude ? 'Для входа выполните в терминале: claude auth login' : 'Для входа выполните в терминале: codex login'}
                </p>
                <label
                    >Распознавание речи и снимков<select
                        .value=${this._hostedModels.bridgeMediaProvider || 'openrouter'}
                        @change=${e => this._saveHostedField('bridgeMediaProvider', e.target.value)}
                    >
                        <option value="openrouter">OpenRouter API</option>
                        <option value="openai">OpenAI API</option>
                        <option value="none">Только текст — без API</option>
                    </select></label
                >
                ${
                    this._hostedModels.bridgeMediaProvider !== 'none'
                        ? html`<label
                              >API-ключ для речи и снимков<input
                                  type="password"
                                  .value=${this._hostedModels.bridgeMediaProvider === 'openai' ? this._openaiKey : this._openrouterKey}
                                  @input=${e => this._saveHostedField((this._hostedModels.bridgeMediaProvider === 'openai' ? 'openai' : 'openrouter') + 'Key', e.target.value, true)}
                          /></label>`
                        : ''
                }
                <p class="form-hint">
                    Подписка используется для ответов. Распознавание через API оплачивается отдельно; в режиме «Только текст» прослушивание и снимки
                    недоступны.
                </p>
            </details>
        </section>`;
    }

    _renderLocalMode() {
        return html`
            <details class="config-section">
                <summary class="config-summary">
                    <span class="config-summary-text">
                        <span class="config-summary-title">Языковая модель</span>
                        <span class="config-summary-description">Локальная модель GGUF</span>
                    </span>
                    ${this._renderConfigChevron()}
                </summary>
                <div class="config-content">
                    <div class="form-group">
                        <label class="form-label">Модель</label>
                        <select
                            .value=${this._useCustomLocalLlmModel ? 'custom' : this._localLlmModel}
                            @change=${event => this._selectLocalLlmModel(event.target.value)}
                        >
                            ${LOCAL_LLM_PRESETS.map(preset => html`<option value=${preset.value}>${preset.label}</option>`)}
                            <option value="custom">Другая модель Hugging Face или файл GGUF…</option>
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
                        <div class="form-hint">Размер включает модель изображений. Q4 требует меньше памяти; Q8 сохраняет больше точности.</div>
                    </div>
                </div>
            </details>

            <details class="config-section">
                <summary class="config-summary">
                    <span class="config-summary-text">
                        <span class="config-summary-title">Распознавание речи</span>
                        <span class="config-summary-description">Распознавание речи Whisper</span>
                    </span>
                    ${this._renderConfigChevron()}
                </summary>
                <div class="config-content">
                    <div class="form-group">
                        <div class="whisper-label-row">
                            <label class="form-label">Модель Whisper</label>
                            ${this.whisperDownloading ? html`<div class="whisper-spinner"></div>` : ''}
                        </div>
                        <select .value=${this._whisperModel} @change=${e => this._saveWhisperModel(e.target.value)}>
                            <option value="tiny.en" ?selected=${this._whisperModel === 'tiny.en'}>Tiny · английский · 75 МБ · быстрее</option>
                            <option value="base.en" ?selected=${this._whisperModel === 'base.en'}>Base · английский · 142 МБ</option>
                            <option value="small.en" ?selected=${this._whisperModel === 'small.en'}>Small · английский · 466 МБ · точнее</option>
                        </select>
                        <div class="form-hint">${this.whisperDownloading ? 'Загрузка модели…' : 'Загрузится при первом запуске'}</div>
                    </div>
                </div>
            </details>

            ${this._renderDivider()}

            <!-- Cloud promo intentionally removed from the active UI. -->

            <div class="mode-links">
                <button class="mode-link" @click=${() => this._saveMode('byok')}>Подключение через API-ключи</button>
            </div>
        `;
    }

    // ── Main render ──

    render() {
        return html`<div class="form-wrapper">
            <div class="section-heading page-title">Новая сессия</div>
            ${this._sharingVisible ? html`<div role="status" style="padding:10px;border:1px solid #e9ac45;border-radius:8px;color:#e9ac45">Окно видно при демонстрации экрана · <button class="text-button" @click=${() => window.cheatingDaddy.element().navigate('customize')}>Настройки</button></div>` : ''}
            <session-console .recovery=${this.recovery} .review=${this.review} @start-session=${this._handleStart}></session-console>
            ${
                this.downloadProgress.active
                    ? html`<div class="form-hint">
                          Загрузка: ${this.downloadProgress.label || 'модели'} ${this.downloadProgress.percentage ?? ''}%
                          <button class="text-button" @click=${() => this.onCancelDownload()}>Отмена</button>
                      </div>`
                    : ''
            }
            ${this.errorMessage || this._pageError ? html`<div class="form-hint" role="alert">${this.errorMessage || this._pageError}</div>` : ''}
            ${this._renderContext()}
            <section class="setup-card">
                <label
                    >Подключение AI<select id="provider-mode" .value=${this._mode} @change=${e => this._saveMode(e.target.value)}>
                        <option value="openrouter">OpenRouter · API</option>
                        <option value="openai">OpenAI · API</option>
                        <option value="claude-code">Claude Code · мост</option>
                        <option value="codex">ChatGPT · через Codex</option>
                        <option value="byok">Gemini / Groq · API</option>
                        <option value="local">Локальные модели</option>
                    </select></label
                >
            </section>
            ${['openai', 'openrouter'].includes(this._mode) ? this._renderHostedMode() : ''}
            ${['claude-code', 'codex'].includes(this._mode) ? this._renderBridgeMode() : ''} ${this._mode === 'byok' ? this._renderByokMode() : ''}
            ${this._mode === 'local' ? this._renderLocalMode() : ''}
        </div>`;
    }

    _renderLocalHelp(closeIcon) {
        return html`
            <div class="help-dialog-backdrop" @click=${this._closeLocalHelp}>
                <section class="help-dialog" role="dialog" aria-modal="true" aria-labelledby="local-help-title" @click=${this._handleHelpDialogClick}>
                    <div class="help-dialog-header">
                        <div id="local-help-title" class="help-dialog-title">Настройка локального AI</div>
                        <button class="help-btn" @click=${this._closeLocalHelp} aria-label="Закрыть справку">${closeIcon}</button>
                    </div>

                    <div class="help-content">
                        <div class="help-section">
                            <div class="help-section-title">Локальный AI</div>
                            <div class="help-section-text">
                                Cheating Daddy запускает llama.cpp и whisper.cpp на вашем компьютере. Внешний AI-сервис и установка Ollama не нужны.
                            </div>
                        </div>

                        <div class="help-section">
                            <div class="help-section-title">Автоматическая установка</div>
                            <div class="help-section-text">
                                При первом запуске приложение скачает движки и выбранные модели, проверит контрольные суммы и сохранит файлы в
                                каталоге настроек.
                            </div>
                        </div>

                        <div class="help-section">
                            <div class="help-section-title">Модель по умолчанию</div>
                            <div class="help-models">
                                <div class="help-model">
                                    <span class="help-model-name">Qwen3.5 4B Q4_K_M</span><span>Около 2,7 ГБ — баланс скорости и качества</span>
                                </div>
                            </div>
                        </div>

                        <div class="help-section">
                            <div class="help-section-title">Whisper</div>
                            <div class="help-section-text">Выбранная модель whisper.cpp скачивается один раз и хранится в каталоге настроек.</div>
                        </div>

                        <hr class="help-divider" />

                        <div class="help-section">
                            <div class="help-section-title">Компьютер работает медленно?</div>
                            <div class="help-section-text">
                                Локальные модели нагружают процессор и память. Если компьютер тормозит, выберите облачного провайдера.
                            </div>
                        </div>

                        <button
                            class="help-cloud-btn"
                            @click=${() => {
                                this._closeLocalHelp();
                                this._saveMode('byok');
                            }}
                        >
                            Перейти к Gemini / Groq
                        </button>
                    </div>
                </section>
            </div>
        `;
    }
}

customElements.define('main-view', MainView);
