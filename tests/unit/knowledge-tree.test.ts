import assert from 'node:assert/strict';
import test from 'node:test';
import { getKnowledgeGrowth, renderKnowledgeTree } from '../../frontend/src/components/knowledge-tree.ts';

const stats = (points: number) => ({ total: points, known: 0, reviewEvents: 0 });

test('knowledge tree advances through all five growth stages', () => {
  const cases = [
    { points: 0, stage: 0, label: 'Hạt giống' },
    { points: 1, stage: 1, label: 'Nảy mầm' },
    { points: 10, stage: 2, label: 'Ra lá' },
    { points: 30, stage: 3, label: 'Cây non' },
    { points: 70, stage: 4, label: 'Tươi tốt' },
  ];

  for (const expected of cases) {
    const growth = getKnowledgeGrowth(stats(expected.points));
    assert.equal(growth.stage, expected.stage);
    assert.equal(growth.label, expected.label);
    assert.ok(growth.progress >= 0 && growth.progress <= 100);
  }
});

test('knowledge tree counts saved, known and reviewed activity without invalid SVG output', () => {
  const growth = getKnowledgeGrowth({ total: 4, known: 3, reviewEvents: 20 });
  assert.equal(growth.points, 30);
  assert.equal(growth.stage, 3);

  for (const points of [0, 1, 9, 10, 29, 30, 69, 70, 999]) {
    const markup = renderKnowledgeTree(stats(points));
    assert.match(markup, /<svg viewBox="0 0 360 280"/);
    assert.match(markup, new RegExp(`data-stage="${getKnowledgeGrowth(stats(points)).stage}"`));
    assert.doesNotMatch(markup, /NaN|undefined/);
  }
});
