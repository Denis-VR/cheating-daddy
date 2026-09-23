const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const IMAGES = { go: 'golang:1.25-alpine', python: 'python:3.13-alpine', sql: 'python:3.13-alpine' };
function docker(args, timeout = 30000) {
    return new Promise(resolve => {
        const child = spawn(process.env.CD_DOCKER || (process.platform === 'darwin' ? '/usr/local/bin/docker' : 'docker'), args, {
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        let output = '',
            timedOut = false;
        const append = data => {
            output = (output + data.toString()).slice(-60000);
        };
        child.stdout.on('data', append);
        child.stderr.on('data', append);
        const timer = setTimeout(() => {
            timedOut = true;
            child.kill('SIGKILL');
        }, timeout);
        child.on('error', error => {
            clearTimeout(timer);
            resolve({ success: false, output: error.message, exitCode: -1 });
        });
        child.on('close', code => {
            clearTimeout(timer);
            resolve({
                success: code === 0 && !timedOut,
                output: timedOut ? output + '\nПревышено время выполнения. Контейнер остановлен.' : output,
                exitCode: code,
                timedOut,
            });
        });
    });
}
async function checkSandbox() {
    const status = await docker(['info', '--format', '{{.ServerVersion}}'], 5000);
    if (!status.success) return { success: false, output: 'Запустите Docker Desktop. ' + status.output };
    const images = {};
    for (const [language, image] of Object.entries(IMAGES)) images[language] = (await docker(['image', 'inspect', image], 5000)).success;
    return { success: true, images };
}
let running = false;
async function runCode({ language, code, tests = '' } = {}) {
    if (!IMAGES[language] || typeof code !== 'string' || code.length > 80000 || typeof tests !== 'string' || tests.length > 80000)
        throw new Error('Выберите Go, Python или SQL; код и тесты до 80000 символов');
    if (running) throw new Error('Дождитесь завершения текущей проверки');
    running = true;
    let directory;
    const name = 'cd-check-' + randomUUID();
    try {
        directory = await fs.mkdtemp(path.join(os.tmpdir(), 'cd-code-'));
        await fs.chmod(directory, 0o755);
        let command;
        if (language === 'go') {
            await fs.writeFile(path.join(directory, 'main.go'), code);
            if (tests.trim()) await fs.writeFile(path.join(directory, 'main_test.go'), tests);
            command = ['sh', '-c', `cp /input/* /work/; cd /work; ${tests.trim() ? 'go test -v -timeout 12s' : 'go run main.go'}`];
        } else if (language === 'python') {
            await fs.writeFile(path.join(directory, 'main.py'), code + '\n' + tests);
            command = ['python', '-I', '/input/main.py'];
        } else {
            await fs.writeFile(path.join(directory, 'query.sql'), code);
            await fs.writeFile(path.join(directory, 'test.sql'), tests);
            await fs.writeFile(
                path.join(directory, 'run.py'),
                `import sqlite3\nc=sqlite3.connect(':memory:')\ns=open('/input/query.sql').read()+'\\n'+open('/input/test.sql').read()\nb=''\nfor ch in s:\n b+=ch\n if ch==';' and sqlite3.complete_statement(b):\n  r=c.execute(b)\n  if r.description: print([d[0] for d in r.description], r.fetchall())\n  b=''\nif b.strip():\n r=c.execute(b)\n if r.description: print(r.fetchall())\n`
            );
            command = ['python', '-I', '/input/run.py'];
        }
        const result = await docker(
            [
                'run',
                '--name',
                name,
                '--rm',
                '--pull=never',
                '--network=none',
                '--read-only',
                '--cap-drop=ALL',
                '--security-opt=no-new-privileges',
                '--pids-limit=96',
                '--memory=512m',
                '--cpus=1',
                '--user=65534:65534',
                '--tmpfs=/tmp:rw,exec,nosuid,size=192m',
                '--tmpfs=/work:rw,nosuid,size=96m',
                '--mount',
                `type=bind,src=${directory},dst=/input,readonly`,
                '-e',
                'GOCACHE=/tmp/go-cache',
                '-e',
                'GOPATH=/tmp/go',
                '-e',
                'GO111MODULE=off',
                '-e',
                'GOMAXPROCS=2',
                IMAGES[language],
                ...command,
            ],
            45000
        );
        return {
            ...result,
            engine: IMAGES[language],
            note:
                language === 'sql'
                    ? 'SQLite: не проверяет особенности PostgreSQL.'
                    : 'Изолированная проверка; отсутствие ошибок не доказывает корректность всех случаев.',
        };
    } finally {
        await docker(['rm', '-f', name], 5000);
        if (directory) await fs.rm(directory, { recursive: true, force: true });
        running = false;
    }
}
module.exports = { runCode, checkSandbox };
