const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const { runBridge, bridgeArgs, bridgeEnvironment } = require('../src/utils/cli-bridge');
const { HostedSession } = require('../src/utils/hosted-ai');
function fakeSpawn(output, code = 0, inspect = () => {}) {
    return (binary, args, options) => {
        const child = new EventEmitter();
        child.stdout = new EventEmitter();
        child.stderr = new EventEmitter();
        child.stdin = new EventEmitter();
        child.kill = () => {};
        child.stdin.end = prompt => {
            inspect({ binary, args, options, prompt });
            queueMicrotask(() => {
                child.stdout.emit('data', output);
                child.emit('close', code);
            });
        };
        return child;
    };
}
test('bridges send prompts on stdin without shell, parse provider responses and remove temporary workspace', async () => {
    for (const provider of ['codex', 'claude-code']) {
        let call;
        const output =
            provider === 'codex'
                ? JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: 'Ответ' } }) + '\n'
                : JSON.stringify({ result: 'Ответ' });
        const result = await runBridge(
            { provider, messages: [{ role: 'user', content: 'literal `$(x)`' }] },
            fakeSpawn(output, 0, v => (call = v)),
            () => '/fake/cli'
        );
        assert.equal(result, 'Ответ');
        assert.equal(call.options.shell, false);
        assert.match(call.prompt, /literal/);
        assert.ok(!call.args.some(a => a.includes('literal')));
        assert.equal(fs.existsSync(call.options.cwd), false);
    }
});
test('bridge reports expired Claude login and Codex turn errors', async () => {
    await assert.rejects(
        runBridge({ provider: 'claude-code', messages: [] }, fakeSpawn('{"is_error":true,"result":"OAuth session expired"}', 1), () => '/fake'),
        /claude auth login/
    );
    await assert.rejects(
        runBridge({ provider: 'codex', messages: [] }, fakeSpawn('{"type":"turn.failed","error":{"message":"quota"}}\n'), () => '/fake'),
        /quota/
    );
    await assert.rejects(
        runBridge({ provider: 'codex', messages: [] }, fakeSpawn(''), () => '/fake'),
        /пустой/
    );
});
test('bridge validates models, disables Claude tools and does not forward API credentials', () => {
    assert.throws(() => bridgeArgs('codex', '--shell x'));
    const args = bridgeArgs('claude-code');
    assert.equal(args[args.indexOf('--tools') + 1], '');
    const env = bridgeEnvironment();
    assert.equal(env.OPENAI_API_KEY, undefined);
    assert.equal(env.ANTHROPIC_API_KEY, undefined);
    assert.equal(env.CODEX_API_KEY, undefined);
});
test('bridge cancellation kills the child promptly', async () => {
    const controller = new AbortController();
    let killed = false;
    const pending = runBridge(
        { provider: 'codex', messages: [], signal: controller.signal },
        () => {
            const child = new EventEmitter();
            child.stdout = new EventEmitter();
            child.stderr = new EventEmitter();
            child.stdin = new EventEmitter();
            child.stdin.end = () => controller.abort();
            child.kill = () => (killed = true);
            return child;
        },
        () => '/fake'
    );
    await assert.rejects(pending, /отменён/);
    assert.equal(killed, true);
});
test('hosted workflow uses bridge for answers, includes preparation, and rejects media in text-only mode', async () => {
    const emitted = [];
    let sent;
    const s = new HostedSession({
        provider: 'openai',
        key: 'unused',
        model: 'test',
        reviewAudio: true,
        mediaEnabled: false,
        completion: async messages => {
            sent = messages;
            return 'Ответ';
        },
        preparation: { name: 'Java', vacancy: 'Backend', materials: [{ name: 'CV', text: 'Kafka' }] },
        emit: (...event) => emitted.push(event),
        save() {},
        fetchImpl: () => {
            throw Error('API should not be called');
        },
    });
    assert.equal((await s.enqueue({ text: 'Kafka', requestId: 'one' })).success, true);
    assert.match(sent[0].content, /Java/);
    assert.match(sent[0].content, /Kafka/);
    assert.equal(emitted.find(([event]) => event === 'new-response')[1].id, 'one');
    assert.equal((await s.enqueue({ text: 'screen', images: ['AAAA'] })).success, false);
    s.close();
});
