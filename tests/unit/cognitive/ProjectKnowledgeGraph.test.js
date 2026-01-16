/**
 * Testes unitários para ProjectKnowledgeGraph
 */

import { describe, it, expect } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import ProjectKnowledgeGraph from '../../../src/cognitive/ProjectKnowledgeGraph.js';

const testConfig = {
  paths: {
    proactive: join(tmpdir(), 'ultra-ia-proactive-test'),
    logs: join(tmpdir(), 'ultra-ia-proactive-test-logs')
  }
};

describe('ProjectKnowledgeGraph', () => {
  it('deve inserir e buscar nós', () => {
    const graph = new ProjectKnowledgeGraph(testConfig);
    graph.upsertNode({
      id: 'file:/tmp/example.js',
      type: 'file',
      name: 'example.js',
      filePath: '/tmp/example.js',
      content: 'function hello() { return 1; }'
    });

    const results = graph.search('hello', 5);
    expect(results.length).toBeGreaterThan(0);
    const found = results.some(result => result.name === 'example.js');
    expect(found).toBe(true);
  });
});
