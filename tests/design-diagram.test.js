const test = require('node:test');
const assert = require('node:assert/strict');
const example = `flowchart TD
A[Client] --> B[API Service]
B --> C[Short Code Generator]
B --> D[Redis Cache]
D --> E[Postgres]
B --> F[Redirect Response]
E --> D`;
test('design layout respects hierarchy, keeps every label and routes reverse edges separately', async () => {
    const { layoutDiagram } = await import('../src/utils/design-diagram.mjs');
    const graph = layoutDiagram(example);
    assert.equal(graph.nodes.length, 6);
    assert.equal(graph.edges.length, 6);
    const nodes = Object.fromEntries(graph.nodes.map(n => [n.id, n]));
    assert.ok(nodes.A.y < nodes.B.y && nodes.B.y < nodes.D.y);
    assert.equal(nodes.C.label, 'Short Code Generator');
    assert.notDeepEqual(
        graph.edges.find(e => e.v === 'D' && e.w === 'E').points,
        [...graph.edges.find(e => e.v === 'E' && e.w === 'D').points].reverse()
    );
    for (const edge of graph.edges) {
        for (let i = 1; i < edge.points.length; i++) {
            const a = edge.points[i - 1],
                b = edge.points[i];
            for (let step = 1; step < 20; step++) {
                const x = a.x + ((b.x - a.x) * step) / 20,
                    y = a.y + ((b.y - a.y) * step) / 20;
                for (const n of graph.nodes)
                    assert.ok(
                        !(x > n.x - n.width / 2 + 1 && x < n.x + n.width / 2 - 1 && y > n.y - n.height / 2 + 1 && y < n.y + n.height / 2 - 1),
                        `edge enters ${n.id}`
                    );
            }
        }
    }
});
test('diagram supports chains, labels, directions and self-loops without truncating long names', async () => {
    const { layoutDiagram } = await import('../src/utils/design-diagram.mjs');
    const g = layoutDiagram('flowchart LR\nA[Очень длинное название сервиса обработки уведомлений] -->|HTTP| B --> C\nC --> C');
    assert.equal(g.edges.length, 3);
    assert.ok(g.nodes[0].x < g.nodes[1].x);
    assert.equal(g.nodes[0].lines.join(' '), g.nodes[0].label);
    assert.throws(() => layoutDiagram('flowchart TD\nA --> unsupported syntax'), /прочитать/);
    assert.throws(() => layoutDiagram('flowchart TD'), /нет блоков/);
});
