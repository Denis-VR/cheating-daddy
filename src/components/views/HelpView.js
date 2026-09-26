import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import { unifiedPageStyles } from './sharedPageStyles.js';

export class HelpView extends LitElement {
    static styles = [
        unifiedPageStyles,
        css`
            .shortcut-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--space-sm);
            }

            .shortcut-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: var(--space-sm);
                padding: var(--space-sm);
                border: 1px solid var(--border);
                border-radius: var(--radius-sm);
                background: var(--bg-elevated);
            }

            .shortcut-label {
                color: var(--text-secondary);
                font-size: var(--font-size-xs);
            }

            .shortcut-keys {
                display: inline-flex;
                gap: 4px;
                flex-wrap: wrap;
                justify-content: flex-end;
            }

            .key {
                border: 1px solid var(--border);
                border-radius: var(--radius-sm);
                padding: 2px 6px;
                font-size: var(--font-size-xs);
                color: var(--text-primary);
                background: var(--bg-surface);
                font-family: var(--font-mono);
            }

            .list {
                display: grid;
                gap: var(--space-sm);
            }

            .list-item {
                padding: var(--space-sm);
                border: 1px solid var(--border);
                border-radius: var(--radius-sm);
                color: var(--text-secondary);
                font-size: var(--font-size-sm);
                line-height: 1.45;
                background: var(--bg-elevated);
            }

            details {
                padding: 12px 0;
                border-bottom: 1px solid var(--border);
            }
            summary {
                cursor: pointer;
                color: var(--text-primary);
                font-weight: 600;
            }
            details p {
                color: var(--text-secondary);
                line-height: 1.65;
                margin: 10px 0 0;
            }

            @media (max-width: 820px) {
                .shortcut-grid {
                    grid-template-columns: 1fr;
                }
            }
        `,
    ];

    static properties = {
        onExternalLinkClick: { type: Function },
        keybinds: { type: Object },
    };

    constructor() {
        super();
        this.onExternalLinkClick = () => {};
        this.keybinds = this.getDefaultKeybinds();
        this._loadKeybinds();
    }

    async _loadKeybinds() {
        try {
            const keybinds = await cheatingDaddy.storage.getKeybinds();
            if (keybinds) {
                this.keybinds = { ...this.getDefaultKeybinds(), ...keybinds };
                this.requestUpdate();
            }
        } catch (error) {
            console.error('Error loading keybinds:', error);
        }
    }

    getDefaultKeybinds() {
        const isMac = cheatingDaddy.isMacOS || navigator.platform.includes('Mac');
        return {
            moveUp: isMac ? 'Alt+Up' : 'Ctrl+Up',
            moveDown: isMac ? 'Alt+Down' : 'Ctrl+Down',
            moveLeft: isMac ? 'Alt+Left' : 'Ctrl+Left',
            moveRight: isMac ? 'Alt+Right' : 'Ctrl+Right',
            toggleVisibility: isMac ? 'Cmd+\\' : 'Ctrl+\\',
            toggleClickThrough: isMac ? 'Cmd+M' : 'Ctrl+M',
            nextStep: isMac ? 'Cmd+Enter' : 'Ctrl+Enter',
            previousResponse: isMac ? 'Cmd+[' : 'Ctrl+[',
            nextResponse: isMac ? 'Cmd+]' : 'Ctrl+]',
            focusMode: isMac ? 'Cmd+Shift+F' : 'Ctrl+Shift+F',
            increaseFont: isMac ? 'Cmd+Alt+Up' : 'Ctrl+Alt+Up',
            decreaseFont: isMac ? 'Cmd+Alt+Down' : 'Ctrl+Alt+Down',
            decreaseOpacity: isMac ? 'Cmd+Alt+Left' : 'Ctrl+Alt+Left',
            increaseOpacity: isMac ? 'Cmd+Alt+Right' : 'Ctrl+Alt+Right',
            toggleTeleprompter: isMac ? 'Cmd+Alt+S' : 'Ctrl+Alt+S',
            scrollUp: isMac ? 'Cmd+Shift+Up' : 'Ctrl+Shift+Up',
            scrollDown: isMac ? 'Cmd+Shift+Down' : 'Ctrl+Shift+Down',
        };
    }

    _formatKeybind(keybind) {
        return (keybind || 'Не назначено').split('+').map(key => html`<span class="key">${key}</span>`);
    }

    _open(url) {
        this.onExternalLinkClick(url);
    }

    render() {
        const shortcutRows = [
            ['Только ответ / настройки', this.keybinds.focusMode],
            ['Увеличить шрифт', this.keybinds.increaseFont],
            ['Уменьшить шрифт', this.keybinds.decreaseFont],
            ['Прозрачнее окно', this.keybinds.decreaseOpacity],
            ['Плотнее окно', this.keybinds.increaseOpacity],
            ['Суфлёр (автопрокрутка)', this.keybinds.toggleTeleprompter],
            ['Move Window Up', this.keybinds.moveUp],
            ['Move Window Down', this.keybinds.moveDown],
            ['Move Window Left', this.keybinds.moveLeft],
            ['Move Window Right', this.keybinds.moveRight],
            ['Toggle Visibility', this.keybinds.toggleVisibility],
            ['Toggle Click-through', this.keybinds.toggleClickThrough],
            ['Ask Next Step', this.keybinds.nextStep],
            ['Previous Response', this.keybinds.previousResponse],
            ['Next Response', this.keybinds.nextResponse],
            ['Scroll Response Up', this.keybinds.scrollUp],
            ['Scroll Response Down', this.keybinds.scrollDown],
        ];

        return html`
            <div class="unified-page">
                <div class="unified-wrap">
                    <div class="page-title">Help</div>

                    <section class="surface">
                        <div class="surface-title">Как пользоваться приложением</div>
                        ${[
                            [
                                'Начало и проверка готовности',
                                'На Home выберите провайдера и модель, укажите API-ключ. «Проверить готовность» проверяет ответ модели, захват экрана и поступление звука. Для проверки системного звука включите воспроизведение; для микрофона произнесите фразу. Проверка модели делает короткий платный API-запрос. Снимок и звук этой проверки не отправляются модели. После проверки нажмите Start Session.',
                            ],
                            [
                                'Settings и язык',
                                'Speech Language задаёт язык распознавания речи. Изменения сохраняются автоматически и применяются при следующем запуске сессии. Здесь же выбираются источник звука, размер текста, внешний вид и сочетания клавиш.',
                            ],
                            [
                                'Вопросы и пауза',
                                'Распознанные вопросы собираются в разделе «Вопросы». Перед отправкой можно исправить текст. Пауза останавливает автоматическую обработку разговора; письменные запросы продолжают работать и показывают ответ в текущем окне. Введите запрос и нажмите отправку — поле очистится.',
                            ],
                            [
                                'Чтение ответов',
                                'Новые ответы не переключают вас с текущего. Переходите между ними стрелками. A− и A+ меняют размер текста. «Только ответ» скрывает инструменты; вернуться можно через «Настройки» или горячую клавишу. Код подсвечивается, таблицы отображаются внутри ответа.',
                            ],
                            [
                                'Скриншоты',
                                'Вставьте изображение из буфера или нажмите «Снять экран», затем добавьте текст задания и отправьте запрос. Можно прикрепить несколько изображений. OCR извлекает текст с помощью отдельной модели; для схем используйте анализ изображения целиком. Распознанный текст можно исправить перед отправкой.',
                            ],
                            [
                                'Темы и инструменты',
                                'Уточнения можно направлять в текущую тему, а отдельные вопросы — в новую через «Настройки ответа». Темы можно объединять, разделять и удалять. Панель инструментов сворачивается стрелкой, освобождая место для ответа.',
                            ],
                            [
                                'Preparation и AI Customization',
                                'В Preparation добавьте резюме, вакансию и реальные истории проектов, сохраните пакет перед сессией. В AI Customization можно создавать, редактировать и удалять профили инструкций, выбирать активный профиль и дополнительные инструкции. Они задают стиль и контекст ответов.',
                            ],
                            [
                                'Проверка кода и System design',
                                'Технический режим помогает разобрать уточнения, идею, код, сложность и крайние случаи. Запуск кода и тестов выполняется отдельно в Docker — он должен быть установлен и запущен. System design хранит требования, компоненты и решения; новые ограничения обновляют проект, предыдущую версию можно восстановить.',
                            ],
                            [
                                'History и разбор сессии',
                                'History хранит вопросы и ответы. Можно удалить одну историю или все. После сессии разбор выделяет повторяющиеся темы и ответы, требующие проверки, и предлагает задания на завтра. Это анализ сохранённых запросов, а не оценка ваших устных ответов.',
                            ],
                            [
                                'Сбой, повтор и восстановление',
                                'Приложение периодически сохраняет текущие темы, черновик и положение чтения. После перезапуска Home предложит продолжить незавершённую сессию. При ошибке сети нажмите «Повторить запрос» у нужного ответа. Запросы сами повторно не отправляются. Последние изменения перед внезапным сбоем могут не успеть сохраниться.',
                            ],
                            cheatingDaddy.isWindows
                                ? [
                                      'Windows: звук, микрофон и демонстрация экрана',
                                      'Системный звук захватывается автоматически, отдельных разрешений не нужно. Для микрофона включите «Разрешить классическим приложениям доступ к микрофону» в Параметры → Конфиденциальность → Микрофон. Скрытие окна от демонстрации экрана работает на Windows 10 версии 2004 и новее. Проверьте его заранее в своей программе созвона со второго устройства. Если Ctrl+Alt со стрелками поворачивает экран (драйвер Intel), переназначьте эти сочетания в Settings → Keyboard Shortcuts.',
                                  ]
                                : [
                                      'Разрешения macOS',
                                      'Для захвата нужны разрешения на запись экрана и системного звука, для микрофона — отдельное разрешение. Выдайте их именно запускаемой копии приложения в System Settings → Privacy & Security, затем полностью закройте приложение через Cmd+Q и откройте снова.',
                                  ],
                        ].map(
                            ([title, body]) =>
                                html`<details>
                                    <summary>${title}</summary>
                                    <p>${body}</p>
                                </details>`
                        )}
                    </section>

                    <section class="surface">
                        <div class="surface-title">Keyboard Shortcuts</div>
                        <div class="shortcut-grid">
                            ${shortcutRows.map(
                                ([label, keys]) => html`
                                    <div class="shortcut-row">
                                        <span class="shortcut-label">${label}</span>
                                        <span class="shortcut-keys">${this._formatKeybind(keys)}</span>
                                    </div>
                                `
                            )}
                        </div>
                    </section>
                </div>
            </div>
        `;
    }
}

customElements.define('help-view', HelpView);
