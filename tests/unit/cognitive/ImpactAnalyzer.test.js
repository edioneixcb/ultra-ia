/**
 * Testes unitários para ImpactAnalyzer
 */

import { describe, it, expect } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import ProjectKnowledgeGraph from '../../../src/cognitive/ProjectKnowledgeGraph.js';
import ImpactAnalyzer from '../../../src/cognitive/ImpactAnalyzer.js';

const testConfig = {
  paths: {
    proactive: join(tmpdir(), 'ultra-ia-proactive-test'),
    logs: join(tmpdir(), 'ultra-ia-proactive-test-logs')
  }
};

describe('ImpactAnalyzer', () => {
  it('deve calcular impacto baseado em arestas', () => {
    const graph = new ProjectKnowledgeGraph(testConfig);
    const analyzer = new ImpactAnalyzer(testConfig);

    graph.upsertNode({
      id: 'file:/tmp/a.js',
      type: 'file',
      name: 'a.js',
      filePath: '/tmp/a.js',
      content: 'export const a = 1;'
    });
    graph.upsertNode({
      id: 'file:/tmp/b.js',
      type: 'file',
      name: 'b.js',
      filePath: '/tmp/b.js',
      content: 'import { a } from "./a";'
    });
    graph.addEdge({
      sourceId: 'file:/tmp/b.js',
      targetId: 'file:/tmp/a.js',
      relationship: 'imports'
    });

    const result = analyzer.analyze('/tmp/a.js', 2);
    expect(result.impactedFiles).toContain('/tmp/a.js');
    expect(result.impactedFiles).toContain('/tmp/b.js');
  });
});
