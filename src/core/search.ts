import MiniSearch from 'minisearch';
import type { ParsedOperation, SearchResult, GuideSearchResult, UnifiedSearchResult, SearchEngine, Guide } from './types.js';

export type SearchScope = 'all' | 'api' | 'guides';

/** Stopwords to exclude from keyword extraction. */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall',
  'should', 'may', 'might', 'must', 'can', 'could', 'of', 'in', 'to',
  'for', 'with', 'on', 'at', 'from', 'by', 'about', 'as', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either',
  'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than', 'too',
  'very', 'just', 'that', 'this', 'these', 'those', 'it', 'its',
  'if', 'then', 'else', 'when', 'up', 'out', 'off', 'over', 'under',
  'again', 'further', 'once', 'here', 'there', 'where', 'why', 'how',
  'which', 'who', 'whom', 'what', 'while', 'also', 'use', 'used',
  'using', 'return', 'returns', 'returned', 'get', 'set', 'true', 'false',
  'null', 'undefined', 'string', 'number', 'boolean', 'object', 'array',
  'type', 'value', 'values', 'field', 'fields', 'example', 'default',
]);

/** Extract top keywords from text sources. */
function extractKeywords(texts: string[], max: number): string[] {
  const freq = new Map<string, number>();
  for (const text of texts) {
    const words = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/);
    for (const w of words) {
      if (w.length < 3 || STOP_WORDS.has(w)) continue;
      freq.set(w, (freq.get(w) || 0) + 1);
    }
  }
  return [...freq.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => word);
}

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

  // Extract keywords for suggestions
  const apiTexts = operations.flatMap(op => [op.summary, op.description, ...op.tags]);
  const guideTexts = (guides || []).flatMap(g => [g.title, g.category || '', g.content || '']);
  const keywords = extractKeywords([...apiTexts, ...guideTexts], 12);

  return {
    search(query: string, scope: SearchScope = 'all'): UnifiedSearchResult[] {
      if (!query.trim()) return [];

      const opResults: UnifiedSearchResult[] = scope !== 'guides'
        ? opSearch.search(query).map(result => ({
            type: 'operation' as const,
            operationId: result.operationId as string,
            path: result.path as string,
            method: result.method as string as SearchResult['method'],
            summary: result.summary as string,
            tags: (result.tags as string).split(' ').filter(Boolean),
            score: result.score,
          }))
        : [];

      const guideResults: UnifiedSearchResult[] = scope !== 'api' && guideSearch
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

    getKeywords(): string[] {
      return keywords;
    },

    hasGuides(): boolean {
      return guideSearch !== null;
    },
  };
}
