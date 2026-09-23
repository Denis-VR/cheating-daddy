const test = require('node:test');
const assert = require('node:assert/strict');
const { HostedSession, SpeechSegmenter, readCompletion, wavFrom24k } = require('../src/utils/hosted-ai');
function stream(parts) {
    return new ReadableStream({
        start(c) {
            parts.forEach(p => c.enqueue(typeof p === 'string' ? Buffer.from(p) : p));
            c.close();
        },
    });
}
function completion(text) {
    return `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\ndata: [DONE]\n\n`;
}
function session(overrides = {}) {
    return new HostedSession({
        provider: 'openrouter',
        key: 'test',
        model: 'openai/gpt-4o-mini',
        systemPrompt: 'Custom profile',
        language: 'ru-RU',
        emit() {},
        save() {},
        ...overrides,
    });
}
test('SSE survives every byte boundary, Unicode, comments, CRLF and multiple events', async () => {
    const bytes = Buffer.from(': keepalive\r\n' + completion('Привет!').replaceAll('\n', '\r\n'));
    const result = await readCompletion(stream([...bytes].map(b => Buffer.from([b]))), () => {});
    assert.equal(result, 'Привет!');
});
test('SSE rejects provider errors and truncated connections instead of reporting success', async () => {
    await assert.rejects(
        readCompletion(stream(['data: {"error":{"message":"Quota exceeded"}}\n']), () => {}),
        /Quota exceeded/
    );
    await assert.rejects(
        readCompletion(stream([completion('partial').replace('data: [DONE]\n\n', '')]), () => {}),
        /interrupted/
    );
});
test('queued questions preserve ordering, current question, system instructions and separate IDs', async () => {
    const requests = [],
        events = [],
        saved = [];
    let concurrent = 0,
        maxConcurrent = 0;
    const s = session({
        emit: (...e) => events.push(e),
        save: (...e) => saved.push(e),
        fetchImpl: async (url, init) => {
            concurrent++;
            maxConcurrent = Math.max(concurrent, maxConcurrent);
            requests.push(JSON.parse(init.body));
            await new Promise(r => setTimeout(r, 5));
            concurrent--;
            return { ok: true, body: stream([completion(`answer${requests.length}`)]) };
        },
    });
    const results = await Promise.all([s.enqueue({ text: 'first question' }), s.enqueue({ text: 'second question' })]);
    assert.ok(results.every(r => r.success));
    assert.match(requests[0].messages[0].content, /^Custom profile/);
    assert.equal(maxConcurrent, 1);
    assert.equal(requests[0].messages.at(-1).content, 'first question');
    assert.deepEqual(
        requests[1].messages.slice(1).map(m => m.content),
        ['first question', 'answer1', 'second question']
    );
    assert.equal(new Set(events.filter(e => e[0] === 'new-response').map(e => e[1].id)).size, 2);
    assert.equal(saved.length, 2);
});
test('HTTP auth error is visible; next job can recover without lost or wrong question', async () => {
    let count = 0;
    const events = [];
    const s = session({
        emit: (...e) => events.push(e),
        fetchImpl: async () =>
            ++count === 1
                ? { ok: false, status: 401, json: async () => ({ error: { message: 'Invalid key' } }) }
                : { ok: true, body: stream([completion('ok')]) },
    });
    assert.equal((await s.enqueue({ text: 'failed' })).success, false);
    assert.equal((await s.enqueue({ text: 'next' })).success, true);
    assert.match(events.find(e => e[0] === 'new-response')[1].text, /401/);
});
test('close aborts current job, drops queued jobs and suppresses late response/save events', async () => {
    const events = [];
    let saved = false;
    let begun;
    const ready = new Promise(r => (begun = r));
    const s = session({
        emit: (...e) => events.push(e),
        save: () => (saved = true),
        fetchImpl: async (_, { signal }) => {
            begun();
            await new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))));
        },
    });
    const first = s.enqueue({ text: 'first' }),
        second = s.enqueue({ text: 'second' });
    await ready;
    s.close();
    assert.ok((await Promise.all([first, second])).every(r => !r.success));
    assert.equal(saved, false);
    assert.equal(events.filter(e => e[0].includes('response')).length, 0);
});
function tone(frames) {
    const b = Buffer.alloc(frames * 960);
    for (let i = 0; i < b.length; i += 2) b.writeInt16LE(4000, i);
    return b;
}
test('VAD uses time-based frames, skips silence, preserves speech and caps long speech', () => {
    const utterances = [];
    const vad = new SpeechSegmenter(pcm => utterances.push(pcm));
    vad.push(Buffer.alloc(48000));
    assert.equal(utterances.length, 0);
    const audio = Buffer.concat([tone(25), Buffer.alloc(960 * 40)]);
    for (let i = 0; i < audio.length; i += 137) vad.push(audio.subarray(i, i + 137));
    assert.equal(utterances.length, 1);
    vad.push(tone(2100));
    assert.equal(utterances.length, 3);
    assert.ok(utterances.every(pcm => pcm.length <= 960000));
});
test('pause drops both input channels and discards unfinished utterances', async () => {
    const s = session();
    const jobs = [];
    s.enqueue = job => {
        jobs.push(job);
        return Promise.resolve({ success: true });
    };
    s.audio(tone(20));
    s.setPaused(true);
    s.audio(tone(30), 'system');
    s.audio(tone(30), 'mic');
    s.setPaused(false);
    s.audio(Buffer.alloc(960 * 50));
    assert.equal(jobs.length, 0);
    s.audio(Buffer.concat([tone(20), Buffer.alloc(960 * 40)]), 'mic');
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].channel, 'mic');
});
test('OpenRouter transcription uses same provider key and feeds transcript into chat', async () => {
    const calls = [];
    const s = session({
        fetchImpl: async (url, init) => {
            calls.push({ url, ...init });
            return url.endsWith('transcriptions')
                ? { ok: true, json: async () => ({ text: 'Что такое индекс?' }) }
                : { ok: true, body: stream([completion('Ответ')]) };
        },
    });
    assert.equal((await s.enqueue({ pcm: tone(25) })).success, true);
    const transcription = JSON.parse(calls[0].body);
    assert.equal(transcription.model, 'openai/whisper-1');
    assert.equal(transcription.language, 'ru');
    assert.equal(calls[0].headers.Authorization, calls[1].headers.Authorization);
    assert.equal(JSON.parse(calls[1].body).messages.at(-1).content, 'Что такое индекс?');
});
test('OpenAI transcription uses multipart; screenshots share ordered chat context', async () => {
    const calls = [];
    const s = session({
        provider: 'openai',
        model: 'gpt-4o-mini',
        fetchImpl: async (url, init) => {
            calls.push({ url, ...init });
            return url.endsWith('transcriptions')
                ? { ok: true, json: async () => ({ text: 'question' }) }
                : { ok: true, body: stream([completion('answer')]) };
        },
    });
    await s.enqueue({ pcm: tone(25) });
    await s.enqueue({ text: 'look', image: 'aGVsbG8=' });
    assert.equal(calls[0].body.get('model'), 'whisper-1');
    assert.equal(calls[0].body.get('file').type, 'audio/wav');
    assert.equal(JSON.parse(calls[2].body).messages.at(-1).content[1].image_url.url, 'data:image/jpeg;base64,aGVsbG8=');
});
test('WAV is mono PCM16 at 16 kHz with correct duration and length', () => {
    const wav = wavFrom24k(Buffer.alloc(48000));
    assert.equal(wav.length, 32044);
    assert.equal(wav.readUInt32LE(24), 16000);
    assert.equal(wav.readUInt16LE(22), 1);
    assert.equal(wav.readUInt32LE(40), 32000);
});

test('uncertain or empty speech never triggers chat completion', async () => {
    for (const payload of [
        { text: '.' },
        { text: 'Редактор субтитров А. Иванов' },
        { text: 'hallucination', segments: [{ no_speech_prob: 0.95 }] },
    ]) {
        let requests = 0;
        const s = session({
            fetchImpl: async () => {
                requests++;
                return { ok: true, json: async () => payload };
            },
        });
        await s.enqueue({ pcm: tone(25) });
        assert.equal(requests, 1);
    }
});

test('pause permits manual text and image requests with correlated IDs while audio remains blocked', async () => {
    const events = [],
        requests = [];
    const s = session({
        emit: (...e) => events.push(e),
        fetchImpl: async (_url, init) => {
            requests.push(JSON.parse(init.body));
            return { ok: true, body: stream([completion('answer')]) };
        },
    });
    s.setPaused(true);
    s.audio(tone(25));
    assert.equal((await s.enqueue({ pcm: tone(25) })).success, false);
    assert.equal((await s.enqueue({ text: 'Followup', requestId: 'manual-1', context: 'Chosen answer' })).success, true);
    assert.equal((await s.enqueue({ text: 'Read screenshot', image: 'aGVsbG8=', requestId: 'manual-2' })).success, true);
    assert.equal(requests.length, 3);
    assert.match(requests[0].messages.at(-1).content, /Chosen answer[\s\S]*Followup/);
    assert.deepEqual(
        events.filter(e => e[0] === 'new-response').map(e => e[1].id),
        ['manual-1', 'manual-2']
    );
    assert.equal(s.paused, true);
});

test('OpenRouter uses cheap OCR first and sends only extracted text to the answer model', async () => {
    const requests = [],
        events = [];
    const s = session({
        emit: (...e) => events.push(e),
        fetchImpl: async (_url, init) => {
            const body = JSON.parse(init.body);
            requests.push(body);
            return { ok: true, body: stream([completion(requests.length === 1 ? 'Invoice 12345. Total 250 USD.' : '250 USD')]) };
        },
    });
    const result = await s.enqueue({ requestId: 'screen', text: 'What is the total?', image: 'aGVsbG8=' });
    assert.equal(result.success, true);
    assert.equal(requests[0].model, 'google/gemini-2.5-flash-lite');
    assert.equal(requests[1].model, 'openai/gpt-4o-mini');
    assert.equal(typeof requests[1].messages.at(-1).content, 'string');
    assert.match(requests[1].messages.at(-1).content, /Invoice 12345/);
    assert.ok(!JSON.stringify(requests[1]).includes('data:image'));
    assert.match(events.filter(e => e[0] === 'update-response').at(-1)[1].text, /Invoice 12345[\s\S]*250 USD/);
});

for (const provider of ['openai', 'openrouter']) {
    test(`${provider}: independent STT, OCR and vision models route requests without changing text model`, async () => {
        const requests = [];
        const prefix = provider === 'openrouter' ? 'openai/' : '';
        const s = session({
            provider,
            model: `${prefix}text-model`,
            transcriptionModel: `${prefix}gpt-4o-mini-transcribe`,
            ocrModel: provider === 'openrouter' ? 'google/custom-ocr' : 'custom-ocr',
            visionModel: `${prefix}custom-vision`,
            fetchImpl: async (url, init) => {
                const body = init.body instanceof FormData ? Object.fromEntries(init.body) : JSON.parse(init.body);
                requests.push({ url, body });
                return url.endsWith('/audio/transcriptions')
                    ? { ok: true, json: async () => ({ text: 'transcribed question' }) }
                    : { ok: true, body: stream([completion('result')]) };
            },
        });
        await s.enqueue({ pcm: tone(25) });
        const ocr = await s.enqueue({ image: 'aGVsbG8=', text: 'read', imageMode: 'ocr' });
        const vision = await s.enqueue({ image: 'aGVsbG8=', text: 'diagram', imageMode: 'vision' });
        await s.enqueue({ text: 'follow up' });
        assert.deepEqual(
            requests.map(r => r.body.model),
            [s.transcriptionModel, s.model, s.ocrModel, s.model, s.visionModel, s.model]
        );
        assert.equal(requests[0].body.response_format, 'json');
        assert.equal(typeof requests[3].body.messages.at(-1).content, 'string');
        assert.ok(Array.isArray(requests[4].body.messages.at(-1).content));
        assert.equal(ocr.model, s.model);
        assert.equal(vision.model, s.visionModel);
    });
}

test('optional model IDs are validated and vision defaults to response model', () => {
    assert.equal(session().visionModel, 'openai/gpt-4o-mini');
    for (const field of ['transcriptionModel', 'ocrModel', 'visionModel']) {
        assert.throws(() => session({ [field]: 'bad\nmodel' }), /Invalid .* model ID/);
        assert.throws(() => session({ [field]: 'missing-provider' }), /Invalid .* model ID/);
    }
});
