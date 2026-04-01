import MiniSearch from 'minisearch';
import type { ParsedOperation, SearchResult, SearchEngine } from './types.js';

/**
 * Build a full-text search index from parsed operations.
 */
export function buildSearchIndex(operations: ParsedOperation[]): SearchEngine {
  const miniSearch = new MiniSearch<{
    id: string;
    operationId: string;
    summary: string;
    description: string;
    path: string;
    method: string;
    tags: string;
  }>({
    fields: ['operationId', 'summary', 'description', 'path', 'method', 'tags'],
    storeFields: ['operationId', 'summary', 'path', 'method', 'tags'],
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      boost: {
        summary: 3,
        operationId: 2,
        tags: 2,
        path: 1.5,
      },
    },
  });

  const documents = operations.map(op => ({
    id: op.operationId,
    operationId: op.operationId,
    summary: op.summary,
    description: op.description,
    path: op.path,
    method: op.method,
    tags: op.tags.join(' '),
  }));

  miniSearch.addAll(documents);

  return {
    search(query: string): SearchResult[] {
      if (!query.trim()) return [];
      return miniSearch.search(query).map(result => ({
        operationId: result.operationId as string,
        path: result.path as string,
        method: result.method as string as SearchResult['method'],
        summary: result.summary as string,
        tags: (result.tags as string).split(' ').filter(Boolean),
        score: result.score,
      }));
    },

    autoSuggest(query: string): string[] {
      if (!query.trim()) return [];
      return miniSearch.autoSuggest(query).map(s => s.suggestion);
    },
  };
}
