const fs = require('node:fs');
const path = require('node:path');
const storage = require('../storage');
function loadWorkspace() {
    try {
        return JSON.parse(fs.readFileSync(path.join(storage.getConfigDir(), 'interview-workspace.json'), 'utf8'));
    } catch (error) {
        if (error.code !== 'ENOENT') throw new Error('Не удалось прочитать пакет подготовки: ' + error.message);
        return { packages: [], activePackageId: '', design: {}, designVersions: [] };
    }
}
function saveWorkspace(value) {
    if (!value || JSON.stringify(value).length > 2000000 || !Array.isArray(value.packages) || value.packages.length > 30)
        throw new Error('Пакет слишком большой (лимит 2 МБ / 30 вакансий)');
    for (const p of value.packages) {
        if (
            !p ||
            typeof p.id !== 'string' ||
            typeof p.name !== 'string' ||
            !Array.isArray(p.materials) ||
            p.materials.length > 20 ||
            [p.name, p.vacancy, p.experience, ...p.materials.flatMap(m => [m.name, m.text])].some(t => typeof t !== 'string' || t.length > 200000)
        )
            throw new Error('Некорректный пакет');
    }
    if (value.activePackageId && !value.packages.some(p => p.id === value.activePackageId)) throw new Error('Пакет не найден');
    if (!value.design || typeof value.design !== 'object' || JSON.stringify(value.design).length > 60000) throw new Error('Схема слишком большая');
    value.designVersions = (value.designVersions || []).slice(-10);
    const file = path.join(storage.getConfigDir(), 'interview-workspace.json');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file + '.tmp', JSON.stringify(value));
    fs.renameSync(file + '.tmp', file);
    return value;
}
async function extractDocument({ name, data }) {
    if (typeof name !== 'string' || typeof data !== 'string' || data.length > 16000000) throw new Error('Файл до 10 МБ');
    const buffer = Buffer.from(data, 'base64');
    if (buffer.length > 10 * 1024 * 1024) throw new Error('Файл до 10 МБ');
    let text;
    if (/\.(txt|md|csv|json)$/i.test(name)) text = buffer.toString('utf8');
    else if (/\.docx$/i.test(name)) text = (await require('mammoth').extractRawText({ buffer })).value;
    else if (/\.pdf$/i.test(name)) {
        if (!Promise.withResolvers)
            Promise.withResolvers = function () {
                let resolve, reject;
                const promise = new Promise((a, b) => {
                    resolve = a;
                    reject = b;
                });
                return { promise, resolve, reject };
            };
        if (!process.getBuiltinModule) process.getBuiltinModule = name => require(name);
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const document = await pdfjs.getDocument({
            data: new Uint8Array(buffer),
            isEvalSupported: false,
            useSystemFonts: false,
            standardFontDataUrl: path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'standard_fonts') + path.sep,
        }).promise;
        try {
            if (document.numPages > 60) throw new Error('До 60 страниц PDF');
            const pages = [];
            for (let i = 1; i <= document.numPages; i++)
                pages.push((await (await document.getPage(i)).getTextContent()).items.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join(''));
            text = pages.join('\n\n');
        } finally {
            await document.destroy();
        }
    } else throw new Error('Поддерживаются PDF, DOCX, TXT, MD, CSV, JSON');
    if (!text.trim()) throw new Error('Текст не найден. Для сканированного PDF используйте скриншот и OCR.');
    if (text.length > 200000) throw new Error('Текст превышает 200000 символов; разделите файл');
    return { name, text };
}
module.exports = { loadWorkspace, saveWorkspace, extractDocument };
