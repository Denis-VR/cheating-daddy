import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import { unifiedPageStyles } from './sharedPageStyles.js';

export class AICustomizeView extends LitElement {
    static styles = [
        unifiedPageStyles,
        css`
            .editor-layout {
                display: grid;
                grid-template-columns: 210px minmax(0, 1fr);
                gap: 20px;
            }
            .list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .list button {
                text-align: left;
                overflow-wrap: anywhere;
            }
            .list button.selected {
                border-color: var(--accent);
                background: var(--bg-elevated);
            }
            .editor {
                display: flex;
                flex-direction: column;
                gap: 14px;
                min-width: 0;
            }
            .tabs {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
            }
            textarea.control {
                min-height: 360px;
                line-height: 1.5;
                font-family: var(--font-mono);
            }
            @media (max-width: 750px) {
                .editor-layout {
                    grid-template-columns: 1fr;
                }
                .list {
                    max-height: 180px;
                    overflow: auto;
                }
            }
            .actions {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            button {
                padding: 9px 14px;
                background: var(--bg-surface);
                color: var(--text-primary);
                border: 1px solid var(--border);
                border-radius: 6px;
                cursor: pointer;
            }
            button.primary {
                background: var(--accent);
                color: var(--bg-app);
            }
            textarea.control {
                min-height: 220px;
                resize: vertical;
                user-select: text;
            }
            input.control {
                user-select: text;
            }
        `,
    ];
    static properties = {
        selectedProfile: { type: String },
        onProfileChange: { type: Function },
        _profiles: { state: true },
        _tab: { state: true },
        _presets: { state: true },
        _selectedId: { state: true },
        _activeId: { state: true },
        _status: { state: true },
        _saving: { state: true },
        _loaded: { state: true },
    };
    constructor() {
        super();
        this.selectedProfile = 'interview';
        this.onProfileChange = () => {};
        this._profiles = [];
        this._tab = 'profiles';
        this._presets = [];
        this._selectedId = '';
        this._activeId = '';
        this._status = '';
        this._saving = false;
        this._loaded = false;
        this._loadFromStorage();
    }
    async _loadFromStorage() {
        try {
            const prefs = await cheatingDaddy.storage.getPreferences();
            this._presets = prefs.instructionPresets || [{ id: 'default', name: 'Мои инструкции', text: prefs.customPrompt || '' }];
            this._profiles = prefs.aiProfiles || [];
            this.selectedProfile = prefs.selectedProfile;
            this._activeId = prefs.activeInstructionId || this._presets[0].id;
            this._selectedId = this.selectedProfile || this._profiles[0]?.id || '';
            this._loaded = true;
        } catch (error) {
            this._status = error.message;
        }
    }
    get _items() {
        return this._tab === 'profiles' ? this._profiles : this._presets;
    }
    _setItems(items) {
        if (this._tab === 'profiles') this._profiles = items;
        else this._presets = items;
    }
    _switch(tab) {
        this._tab = tab;
        this._selectedId = (tab === 'profiles' ? this.selectedProfile : this._activeId) || this._items[0]?.id || '';
    }
    _edit(field, value) {
        this._setItems(this._items.map(item => (item.id === this._selectedId ? { ...item, [field]: value } : item)));
        this._status = 'Есть несохранённые изменения';
    }
    _create() {
        const id = crypto.randomUUID();
        this._setItems([...this._items, { id, name: this._tab === 'profiles' ? 'Новый профиль' : 'Новые инструкции', text: '' }]);
        this._selectedId = id;
        this._status = 'Заполните название и текст, затем сохраните';
    }
    _delete() {
        if (!this._items.length) return;
        this._setItems(this._items.filter(item => item.id !== this._selectedId));
        if (this._tab === 'instructions' && !this._items.length)
            this._setItems([{ id: crypto.randomUUID(), name: 'Без дополнительных инструкций', text: '' }]);
        this._selectedId = this._items[0]?.id || '';
        this._status = 'Удаление будет применено после сохранения';
    }
    async _save() {
        this._saving = true;
        try {
            const profile = this._tab === 'profiles' ? this._selectedId : this.selectedProfile;
            const active = this._tab === 'instructions' ? this._selectedId : this._activeId;
            const selectedProfile = this._profiles.some(p => p.id === profile) ? profile : this._profiles[0]?.id || '';
            const activeInstructionId = this._presets.some(p => p.id === active) ? active : this._presets[0].id;
            const result = await cheatingDaddy.storage.setPreferences({
                aiProfiles: this._profiles,
                selectedProfile,
                instructionPresets: this._presets,
                activeInstructionId,
            });
            if (!result.success) throw new Error(result.error || 'Не удалось сохранить');
            this.selectedProfile = selectedProfile;
            this._activeId = activeInstructionId;
            await this.onProfileChange(selectedProfile);
            this._status = 'Сохранено. Применится при следующем запуске сессии.';
        } catch (error) {
            this._status = error.message;
        } finally {
            this._saving = false;
        }
    }
    render() {
        const current = this._items.find(item => item.id === this._selectedId);
        const active = this._tab === 'profiles' ? this.selectedProfile : this._activeId;
        return html`<div class="unified-page">
            <div class="unified-wrap">
                <div class="page-title">AI Customization</div>
                <div class="tabs">
                    <button class=${this._tab === 'profiles' ? 'primary' : ''} @click=${() => this._switch('profiles')}>Профили</button>
                    <button class=${this._tab === 'instructions' ? 'primary' : ''} @click=${() => this._switch('instructions')}>
                        Дополнительные инструкции
                    </button>
                </div>
                <section class="surface editor-layout">
                    <div class="list">
                        <button @click=${this._create} ?disabled=${!this._loaded || this._saving}>
                            + ${this._tab === 'profiles' ? 'Новый профиль' : 'Новый набор'}
                        </button>
                        ${this._items.map(
                            item =>
                                html`<button
                                    class=${item.id === this._selectedId ? 'selected' : ''}
                                    @click=${() => {
                                        this._selectedId = item.id;
                                    }}
                                >
                                    ${item.name}${item.id === active ? ' ✓' : ''}
                                </button>`
                        )}
                    </div>
                    <div class="editor">
                        ${
                            current
                                ? html`
                                      <label for="editor-name">Название</label>
                                      <input
                                          id="editor-name"
                                          class="control"
                                          maxlength="100"
                                          .value=${current.name}
                                          @input=${e => this._edit('name', e.target.value)}
                                      />
                                      <label for="editor-text"
                                          >${this._tab === 'profiles' ? 'Полный текст профиля' : 'Дополнительные инструкции'}</label
                                      >
                                      <textarea
                                          id="editor-text"
                                          class="control"
                                          maxlength="30000"
                                          .value=${current.text}
                                          @input=${e => this._edit('text', e.target.value)}
                                      ></textarea>
                                      <div class="actions"><button @click=${this._delete} ?disabled=${this._saving}>Удалить выбранный</button></div>
                                  `
                                : html`<p>Профилей нет. Можно создать новый или сохранить режим без профиля.</p>`
                        }
                        <div class="actions">
                            <button class="primary" @click=${this._save} ?disabled=${!this._loaded || this._saving}>Сохранить и использовать</button>
                        </div>
                        <div role="status">${this._status}</div>
                    </div>
                </section>
            </div>
        </div>`;
    }
}
customElements.define('ai-customize-view', AICustomizeView);
