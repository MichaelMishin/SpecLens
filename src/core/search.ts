import MiniSearch from 'minisearch';
import type { ParsedOperation, SearchResult, GuideSearchResult, UnifiedSearchResult, SearchEngine, Guide } from './types.js';

/**
 * Build a full-text search index from parsed operations and optional guides.
 */
export function buildSearchIndex(operations: ParsedOperation[], guides?: Guide[]): SearchEngine {
  const opSearch = new MiniSearch<{
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

  opSearch.addAll(documents);

  // Build guide search index if guides are provided
  let guideSearch: MiniSearch<{
    id: string;
    slug: string;
    title: string;
    category: string;
    content: string;
  }> | null = null;

  if (guides?.length) {
    guideSearch = new MiniSearch({
      fields: ['title', 'category', 'content'],
      storeFields: ['slug', 'title', 'category'],
      searchOptions: {
        prefix: true,
        fuzzy: 0.2,
        boost: {
          title: 3,
          category: 1.5,
          content: 1,
        },
      },
    });

    const guideDocs = guides.map(g => ({
      id: `guide-${g.slug}`,
      slug: g.slug,
      title: g.title,
      category: g.category || 'General',
      content: g.content || '',
    }));

    guideSearch.addAll(guideDocs);
  }

  return {
    search(query: string): UnifiedSearchResult[] {
      if (!query.trim()) return [];

      const opResults: UnifiedSearchResult[] = opSearch.search(query).map(result => ({
        type: 'operation' as const,
        operationId: result.operationId as string,
        path: result.path as string,
        method: result.method as string as SearchResult['method'],
        summary: result.summary as string,
        tags: (result.tags as string).split(' ').filter(Boolean),
        score: result.score,
      }));

      const guideResults: UnifiedSearchResult[] = guideSearch
        ? guideSearch.search(query).map(result => ({
            type: 'guide' as const,
            slug: result.slug as string,
            title: result.title as string,
            category: result.category as string,
            score: result.score,
          }))
        : [];

      // Merge and sort by score descending
      return [...opResults, ...guideResults].sort((a, b) => b.score - a.score);
    },

    autoSuggest(query: string): string[] {
      if (!query.trim()) return [];
      const opSuggestions = opSearch.autoSuggest(query).map(s => s.suggestion);
      const guideSuggestions = guideSearch
        ? guideSearch.autoSuggest(query).map(s => s.suggestion)
        : [];
      return [...new Set([...opSuggestions, ...guideSuggestions])];
    },
  };
}
