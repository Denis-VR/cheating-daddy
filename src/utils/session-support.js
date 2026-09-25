const fs = require('node:fs');
const path = require('node:path');
const storage = require('../storage');
const { PROVIDERS } = require('./hosted-ai');
const { topic } = require('./interview-workflow');

function recoveryFile() {
    return path.join(storage.getConfigDir(), 'active-session.json');
}
function validateSnapshot(value) {
    if (
        !value ||
        value.version !== 1 ||
        !Array.isArray(value.responses) ||
        value.responses.length > 500 ||
        value.responses.some(text => typeof text !== 'string' || text.length > 200000) ||
        !Array.isArray(value.topicMeta) ||
        !Array.isArray(value.inline) ||
        !Array.isArray(value.base) ||
        !Array.isArray(value.ids) ||
        typeof value.draft !== 'string' ||
        value.draft.length > 30000 ||
        !Number.isInteger(value.index) ||
        !['openai', 'openrouter'].includes(value.provider) ||
        JSON.stringify(value).length > 20000000
    )
        throw new Error('Некорректные данные восстановления');
    if (
        typeof value.sessionId !== 'string' ||
        !/^\d+$/.test(value.sessionId) ||
        value.index < -1 ||
        value.index >= value.responses.length ||
        !Number.isFinite(value.scroll) ||
        value.scroll < 0 ||
        value.topicMeta.length !== value.responses.length ||
        value.topicMeta.some(m => !m || typeof m !== 'object') ||
        typeof value.profile !== 'string' ||
        typeof value.language !== 'string'
    )
        throw Error('Некорректная сессия');
    for (const [kind, entries] of [
        ['base', value.base],
        ['ids', value.ids],
        ['inline', value.inline],
    ]) {
        if (entries.length > 2000) throw Error('Слишком много запросов');
        for (const entry of entries) {
            if (!Array.isArray(entry) || entry.length !== 2) throw Error('Некорректный запрос');
            const [key, data] = entry;
            if (kind === 'base' && (!Number.isInteger(key) || key < 0 || key >= value.responses.length || typeof data !== 'string'))
                throw Error('Некорректная карточка');
            if (kind === 'ids' && (typeof key !== 'string' || !Number.isInteger(data) || data < 0 || data >= value.responses.length))
                throw Error('Некорректная ссылка');
            if (kind === 'inline') {
                if (
                    typeof key !== 'string' ||
                    !data ||
                    !Number.isInteger(data.index) ||
                    data.index < 0 ||
                    data.index >= value.responses.length ||
                    typeof data.question !== 'string' ||
                    typeof data.text !== 'string'
                )
                    throw Error('Некорректный ответ');
                if (data.payload) require('./interview-workflow').validateRequest(data.payload);
            }
        }
    }
    if (
        value.toolState &&
        (!Array.isArray(value.toolState.files) ||
            value.toolState.files.length > 4 ||
            value.toolState.files.some(f => typeof f.name !== 'string' || typeof f.url !== 'string' || !f.url.startsWith('data:image/jpeg;base64,')))
    )
        throw Error('Некорректные вложения');
    return value;
}
function readRecovery() {
    try {
        return validateSnapshot(JSON.parse(fs.readFileSync(recoveryFile(), 'utf8')));
    } catch (e) {
        if (e.code === 'ENOENT') return null;
        throw e;
    }
}
function saveRecovery(value) {
    if (value === null) {
        fs.rmSync(recoveryFile(), { force: true });
        return;
    }
    validateSnapshot(value);
    fs.mkdirSync(storage.getConfigDir(), { recursive: true });
    fs.writeFileSync(recoveryFile() + '.tmp', JSON.stringify(value), { mode: 0o600 });
    fs.renameSync(recoveryFile() + '.tmp', recoveryFile());
}
function reviewSession(session) {
    const turns = [
        ...(session.conversationHistory || []).map(t => ({ q: t.transcription || '', a: t.ai_response || '' })),
        ...(session.screenAnalysisHistory || []).map(t => ({ q: t.prompt || '', a: t.response || '' })),
    ];
    const groups = new Map();
    for (const turn of turns) {
        const key = topic(turn.q) || turn.q.slice(0, 80) || 'Задание со скриншота';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(turn);
    }
    const difficult = [],
        verify = [],
        tomorrow = [];
    for (const [name, items] of groups) {
        const clarification = items.find(t => /не понял|не понимаю|почему|подробнее|объясни|пример|уточни/i.test(t.q));
        if (items.length > 1 || clarification)
            difficult.push({
                topic: name,
                evidence: (clarification || items.at(-1)).q.slice(0, 260),
                reason:
                    items.length > 1
                        ? `${items.length} обращений к теме; это повод повторить её, не оценка ответа`
                        : 'Запрошено объяснение или пример',
            });
        const questionable = items.find(t => /```|\bO\(|всегда|никогда|гарант|верси|\d+\s*(мс|ms|%|rps)|возможно|не уверен/i.test(t.a));
        if (questionable)
            verify.push({
                topic: name,
                evidence: questionable.q.slice(0, 260),
                reason: /```/.test(questionable.a)
                    ? 'Перезапустить код и тесты; наличие кода в истории не подтверждает его правильность'
                    : 'Проверить ограничения, числа и категоричные утверждения по документации',
            });
        tomorrow.push({
            topic: name,
            task: `За 60 секунд ответить без подсказки: ${items[0].q.slice(0, 220)}. Затем привести пример и один крайний случай.`,
        });
    }
    return {
        count: turns.length,
        difficult: difficult.slice(0, 10),
        verify: verify.slice(0, 10),
        tomorrow: tomorrow.slice(0, 5),
        note: 'Автоматический разбор вопросов и подсказок AI. Устные ответы кандидата не оценивались; правильность подсказок не подтверждена.',
    };
}
async function probeModel(provider, fetchImpl = fetch) {
    if (!PROVIDERS[provider]) throw new Error('Проверка модели доступна для OpenAI / OpenRouter');
    const config = storage.getConfig(),
        credentials = storage.getCredentials();
    const p = PROVIDERS[provider],
        key = credentials[p.keyField] || (provider === 'openai' ? credentials.openaiApiKey : '');
    if (!key) throw new Error('Не указан API-ключ');
    const started = Date.now();
    const response = await fetchImpl(p.baseUrl + '/chat/completions', {
        method: 'POST',
        signal: AbortSignal.timeout(20000),
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: config[provider + 'Model'] || p.model,
            messages: [{ role: 'user', content: 'Reply only OK.' }],
            max_completion_tokens: 256,
            stream: false,
        }),
    });
    if (!response.ok)
        throw new Error(
            `Модель недоступна: HTTP ${response.status}${response.status === 401 ? ' — проверьте API-ключ' : response.status === 429 ? ' — лимит или баланс' : response.status === 403 ? ' — доступ запрещён' : ''}`
        );
    const body = await response.json();
    if (!body.choices?.[0]?.message?.content) throw new Error('Модель вернула пустой ответ');
    return { seconds: Math.round((Date.now() - started) / 100) / 10, model: config[provider + 'Model'] || p.model };
}
async function probeSystemAudio() {
    if (process.platform !== 'darwin') return { detected: false, unsupported: true, message: 'Проверка системного звука пока доступна на macOS' };
    const { app } = require('electron');
    const executable = app.isPackaged ? path.join(process.resourcesPath, 'SystemAudioDump') : path.join(__dirname, '../assets/SystemAudioDump');
    return new Promise(resolve => {
        const child = require('node:child_process').spawn(executable, [], { stdio: ['ignore', 'pipe', 'pipe'] });
        let samples = 0,
            peak = 0,
            done = false,
            error = '',
            remainder = Buffer.alloc(0);
        const finish = () => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            child.kill('SIGKILL');
            resolve({
                detected: peak > 0.003,
                samples,
                peak,
                message:
                    error ||
                    (peak > 0.003 ? 'Системный звук поступает' : 'Системный звук не поступает. Включите речь или музыку и повторите проверку.'),
            });
        };
        const timer = setTimeout(finish, 6000);
        child.stdout.on('data', chunk => {
            const data = remainder.length ? Buffer.concat([remainder, chunk]) : chunk;
            const length = data.length - (data.length % 2);
            remainder = data.subarray(length);
            let squares = 0;
            for (let i = 0; i < length; i += 2) {
                const sample = data.readInt16LE(i) / 32768;
                squares += sample * sample;
                samples++;
            }
            if (length) peak = Math.max(peak, Math.sqrt(squares / (length / 2)));
        });
        child.stderr.on('data', () => {});
        child.on('error', e => {
            error = e.message;
            finish();
        });
        child.on('exit', () => {
            if (!done) {
                error = 'Захват звука завершился раньше времени. Проверьте разрешение записи экрана и аудио.';
                finish();
            }
        });
    });
}
function installSessionSupport(ipcMain, isActive) {
    const guarded = fn => async (_event, value) => {
        try {
            return { success: true, data: await fn(value) };
        } catch (e) {
            return { success: false, error: e.message };
        }
    };
    const benchmarks = new Map();
    ipcMain.handle('session:benchmark-cancel', event => {
        benchmarks.get(event.sender.id)?.abort();
        return { success: true };
    });
    ipcMain.handle('session:benchmark', async (event, input) => {
        if (isActive() || benchmarks.size) return { success: false, error: 'Дождитесь завершения текущей проверки или сессии' };
        const controller = new AbortController();
        const senderId = event.sender.id;
        const stop = () => controller.abort();
        benchmarks.set(senderId, controller);
        event.sender.once('destroyed', stop);
        try {
            const data = await require('./model-benchmark').benchmarkModels(input, {
                signal: controller.signal,
                onResult: row => {
                    if (!event.sender.isDestroyed()) event.sender.send('session:benchmark-result', row);
                },
            });
            return { success: true, data };
        } catch (e) {
            return { success: false, error: e.message };
        } finally {
            benchmarks.delete(senderId);
            if (!event.sender.isDestroyed()) event.sender.removeListener('destroyed', stop);
        }
    });
    ipcMain.handle('session:recovery-load', guarded(readRecovery));
    ipcMain.handle('session:recovery-save', guarded(saveRecovery));
    ipcMain.on('session:recovery-sync', (event, value) => {
        try {
            saveRecovery(value);
            event.returnValue = { success: true };
        } catch (e) {
            event.returnValue = { success: false, error: e.message };
        }
    });
    ipcMain.handle(
        'session:review',
        guarded(id => {
            if (typeof id !== 'string' || !/^\d+$/.test(id)) throw new Error('Некорректная сессия');
            const session = storage.getSession(id);
            if (!session) throw new Error('История не найдена');
            return reviewSession(session);
        })
    );
    let debriefing = false;
    ipcMain.handle(
        'session:ai-debrief',
        guarded(async value => {
            if (!value || typeof value.id !== 'string') throw new Error('Некорректная сессия');
            if (debriefing) throw new Error('Разбор уже готовится');
            debriefing = true;
            try {
                return await require('./debrief').generateDebrief(value.id, { force: value.force === true });
            } finally {
                debriefing = false;
            }
        })
    );
    let probing = false;
    ipcMain.handle(
        'session:preflight',
        guarded(async provider => {
            if (isActive() || probing) throw new Error('Завершите текущую сессию или дождитесь проверки');
            probing = true;
            try {
                const results = await Promise.allSettled([probeModel(provider), probeSystemAudio()]);
                return results.map(r => (r.status === 'fulfilled' ? { ok: true, ...r.value } : { ok: false, message: r.reason.message }));
            } finally {
                probing = false;
            }
        })
    );
}
module.exports = { validateSnapshot, readRecovery, saveRecovery, reviewSession, probeModel, probeSystemAudio, installSessionSupport };
