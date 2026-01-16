/**
 * Teste de integração do Knowledge Graph
 */

import { describe, it, expect } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import ProjectKnowledgeGraph from '../../src/cognitive/ProjectKnowledgeGraph.js';
import SemanticQueryEngine from '../../src/cognitive/SemanticQueryEngine.js';

const testConfig = {
  paths: {
    proactive: join(tmpdir(), 'ultra-ia-proactive-test'),
    logs: join(tmpdir(), 'ultra-ia-proactive-test-logs')
  }
};

describe('Knowledge Graph Integration', () => {
  it('deve buscar nós via SemanticQueryEngine', () => {
    const graph = new ProjectKnowledgeGraph(testConfig);
    const engine = new SemanticQueryEngine(testConfig);

    graph.upsertNode({
      id: 'fn:hello',
      type: 'function',
      name: 'hello',
      filePath: '/tmp/hello.js',
      content: 'function hello() { return \"ok\"; }'
    });

    const results = engine.search('hello', 5);
    expect(results.length).toBeGreaterThan(0);
    const found = results.some(result => result.name === 'hello');
    expect(found).toBe(true);
  });
});
