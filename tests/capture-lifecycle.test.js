const test = require('node:test'),
    assert = require('node:assert/strict'),
    fs = require('node:fs'),
    vm = require('node:vm');
test('back cancels a pending permission wait and discards its late stream; next start succeeds', async () => {
    const source = fs.readFileSync('src/utils/renderer.js', 'utf8');
    const capture = source.slice(source.indexOf('let captureAttempt = null;'), source.indexOf('function setupLinuxMicProcessing'));
    const stop = source.slice(source.indexOf('function stopCapture()'), source.indexOf('// Send text message to Gemini'));
    const pending = [];
    let stopped = 0;
    const context = {
        mediaStream: null,
        screenshotInterval: null,
        audioContext: null,
        audioProcessor: null,
        micAudioProcessor: null,
        microphoneStream: null,
        microphoneContext: null,
        hiddenVideo: null,
        offscreenCanvas: null,
        offscreenContext: null,
        currentImageQuality: 'medium',
        isMacOS: false,
        isLinux: false,
        SAMPLE_RATE: 24000,
        console: { log() {}, warn() {}, error() {} },
        preferencesCache: { audioMode: 'speaker_only' },
        loadPreferencesCache: async () => {},
        setupWindowsLoopbackProcessing() {},
        cheatingDaddy: { setStatus() {} },
        navigator: { mediaDevices: { getDisplayMedia: () => new Promise(r => pending.push(r)) } },
    };
    vm.createContext(context);
    vm.runInContext(capture + '\n' + stop, context);
    const stream = () => ({
        getTracks: () => [
            {
                stop() {
                    stopped++;
                },
            },
        ],
        getAudioTracks: () => [],
        getVideoTracks: () => [{ getSettings: () => ({}) }],
    });
    const first = context.startCapture();
    await new Promise(setImmediate);
    context.stopCapture();
    assert.equal(await first, false);
    const second = context.startCapture();
    await new Promise(setImmediate);
    pending[0](stream());
    await new Promise(setImmediate);
    await new Promise(setImmediate);
    const current = stream();
    pending[1](current);
    assert.equal(await second, true);
    assert.equal(stopped, 1);
    assert.equal(context.mediaStream, current);
});
