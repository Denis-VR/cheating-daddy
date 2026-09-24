import { graphlib, layout } from '../../node_modules/@dagrejs/dagre/dist/dagre.esm.js';

// Only plain flowchart nodes and arrows are accepted; labels are rendered as text.
export function layoutDiagram(source) {
    if (typeof source !== 'string' || source.length > 10000) throw Error('Слишком большая схема');
    const graph = new graphlib.Graph({ multigraph: true });
    graph.setGraph({ rankdir: 'TB', nodesep: 36, ranksep: 64, edgesep: 22, marginx: 24, marginy: 24 });
    graph.setDefaultEdgeLabel(() => ({}));
    const labels = new Map();
    let edgeCount = 0;
    const node = token => {
        const match = token.trim().match(/^([\w-]+)(?:\["?([^\]"]+)"?\])?$/u);
        if (!match) throw Error('Не удалось прочитать блок: ' + token.slice(0, 60));
        const [, id, label] = match;
        if (label || !labels.has(id)) labels.set(id, label || id);
        return id;
    };
    for (const raw of source.replace(/^```(?:mermaid)?\s*|\s*```$/g, '').split(/[\n;]/)) {
        const line = raw.trim();
        if (!line || line.startsWith('%%')) continue;
        const direction = line.match(/^(?:flowchart|graph)\s+(TD|TB|BT|LR|RL)$/);
        if (direction) {
            graph.graph().rankdir = direction[1] === 'TD' ? 'TB' : direction[1];
            continue;
        }
        const parts = line.split('-->');
        let previous = node(parts[0]);
        for (let i = 1; i < parts.length; i++) {
            let next = parts[i].trim(),
                label = '';
            const annotated = next.match(/^\|([^|]+)\|\s*(.*)$/);
            if (annotated) {
                label = annotated[1];
                next = annotated[2];
            }
            const target = node(next);
            graph.setEdge(
                previous,
                target,
                { label, width: label ? Math.min(400, label.length * 8 + 16) : 0, height: label ? 24 : 0 },
                String(edgeCount++)
            );
            previous = target;
        }
    }
    if (!labels.size) throw Error('В схеме нет блоков');
    if (labels.size > 60 || edgeCount > 120) throw Error('До 60 блоков и 120 связей');
    for (const [id, label] of labels) {
        const lines = [];
        for (const paragraph of label.split(/<br\s*\/?\s*>|\\n/)) {
            let line = '';
            for (const word of paragraph.split(/\s+/)) {
                if (line && (line + ' ' + word).length > 28) {
                    lines.push(line);
                    line = '';
                }
                let rest = word;
                while (rest.length > 28) {
                    if (line) {
                        lines.push(line);
                        line = '';
                    }
                    lines.push(rest.slice(0, 28));
                    rest = rest.slice(28);
                }
                line = line ? line + ' ' + rest : rest;
            }
            lines.push(line);
        }
        graph.setNode(id, {
            label,
            lines,
            width: Math.max(150, Math.max(...lines.map(x => x.length)) * 9 + 32),
            height: Math.max(52, lines.length * 22 + 24),
        });
    }
    layout(graph);
    return {
        ...graph.graph(),
        nodes: graph.nodes().map(id => ({ id, ...graph.node(id) })),
        edges: graph.edges().map(edge => ({ ...edge, ...graph.edge(edge) })),
    };
}
