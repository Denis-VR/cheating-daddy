const fs = require('node:fs');
const path = require('node:path');

// Text only, opt-in at the session boundary. Audio is never written here.
class TranscriptJournal {
    constructor(directory) {
        this.directory = directory;
    }
    path(id) {
        if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,150}$/.test(id)) throw Error('Invalid session ID');
        return path.join(this.directory, `${id}.transcript.jsonl`);
    }
    append(id, line) {
        if (
            !line ||
            typeof line.text !== 'string' ||
            !line.text.trim() ||
            line.text.length > 30000 ||
            !['system', 'mic'].includes(line.channel) ||
            !Number.isFinite(line.startAt) ||
            !Number.isFinite(line.endAt)
        )
            throw Error('Invalid transcript segment');
        const filename = this.path(id);
        fs.mkdirSync(this.directory, { recursive: true });
        const entry =
            JSON.stringify({
                id: String(line.id || ''),
                text: line.text,
                channel: line.channel,
                startAt: line.startAt,
                endAt: line.endAt,
                at: line.endAt,
            }) + '\n';
        const size = fs.existsSync(filename) ? fs.statSync(filename).size : 0;
        if (size + Buffer.byteLength(entry) > 10 * 1024 * 1024) throw Error('Достигнут предел журнала 10 МБ');
        fs.appendFileSync(filename, entry, { mode: 0o600 });
    }
    read(id) {
        const filename = this.path(id);
        if (!fs.existsSync(filename)) return [];
        if (fs.statSync(filename).size > 10 * 1024 * 1024) throw Error('Журнал слишком большой');
        return fs
            .readFileSync(filename, 'utf8')
            .split('\n')
            .filter(Boolean)
            .map(line => JSON.parse(line));
    }
    remove(id) {
        fs.rmSync(this.path(id), { force: true });
    }
}
module.exports = { TranscriptJournal };
