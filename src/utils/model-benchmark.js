const storage = require('../storage');
const { HostedSession, PROVIDERS } = require('./hosted-ai');

async function benchmarkModels(input, { fetchImpl = fetch, signal, onResult = () => {} } = {}) {
    if (
        !input ||
        !PROVIDERS[input.provider] ||
        typeof input.text !== 'string' ||
        input.text.length > 1500 ||
        (!input.text.trim() && !input.audio && !input.images?.length)
    )
        throw Error('Введите запрос или запишите вопрос');
    if (
        input.audio &&
        (typeof input.audio !== 'string' ||
            input.audio.length > 12000000 ||
            !/^[A-Za-z0-9+/]*={0,2}$/.test(input.audio) ||
            !['webm', 'mp4', 'wav'].includes(input.format))
    )
        throw Error('Некорректная запись');
    require('./interview-workflow').validateRequest({ text: 'benchmark', requestId: 'benchmark', images: input.images });
    const config = storage.getConfig(),
        prefs = storage.getPreferences(),
        provider = input.provider;
    const credentials = storage.getCredentials();
    const session = new HostedSession({
        provider,
        key: credentials[PROVIDERS[provider].keyField] || (provider === 'openai' ? credentials.openaiApiKey : ''),
        model: config[`${provider}Model`] || PROVIDERS[provider].model,
        transcriptionModel: config[`${provider}TranscriptionModel`],
        ocrModel: config[`${provider}OcrModel`],
        visionModel: config[`${provider}VisionModel`],
        systemPrompt: require('./prompts').getHostedSystemPrompt(
            prefs.selectedProfile || 'interview',
            prefs.customPrompt || '',
            prefs.selectedLanguage || 'ru-RU'
        ),
        preparation: (() => {
            const w = require('./interview-storage').loadWorkspace();
            return w.packages.find(p => p.id === w.activePackageId);
        })(),
        language: prefs.selectedLanguage || 'ru-RU',
        emit() {},
        save() {},
        fetchImpl,
    });
    const abort = () => session.close();
    signal?.addEventListener('abort', abort, { once: true });
    const results = [];
    async function measure(role, model, fn) {
        if (signal?.aborted) throw Error('Проверка отменена');
        const started = performance.now();
        let row;
        try {
            const text = await fn();
            if (!text?.trim()) throw Error('Пустой ответ');
            row = { role, model, seconds: Math.round((performance.now() - started) / 10) / 100, text, ok: true };
        } catch (e) {
            row = { role, model, seconds: Math.round((performance.now() - started) / 10) / 100, error: e.message, ok: false };
        }
        results.push(row);
        onResult(row);
        return row;
    }
    try {
        let prompt = input.text.trim();
        if (input.audio) {
            session.controller = new AbortController();
            const stt = await measure('STT', session.transcriptionModel, () =>
                session.transcribeFile(Buffer.from(input.audio, 'base64'), input.format)
            );
            if (!stt.ok) return results;
            prompt = stt.text;
            if (prompt.length > 1500) throw Error('Запишите более короткий вопрос');
        }
        const images = input.images || [];
        prompt ||= 'Разбери изображение и ответь на вопрос на нём.';
        await measure('Ответ', session.model, async () => {
            const result = await session.enqueue({ text: prompt });
            if (!result.success) throw Error(result.error);
            return result.text;
        });
        session.history = [];
        if (!images.length) return results;
        await measure('Распознавание текста', session.ocrModel, async () => {
            const result = await session.enqueue({ images, ocrOnly: true });
            if (!result.success) throw Error(result.error);
            return result.text;
        });
        await measure('Анализ изображения', session.visionModel, async () => {
            const result = await session.enqueue({ images, imageMode: 'vision', text: prompt });
            if (!result.success) throw Error(result.error);
            return result.text;
        });
        return results;
    } finally {
        signal?.removeEventListener('abort', abort);
        session.close();
    }
}
module.exports = { benchmarkModels };
