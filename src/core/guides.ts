import { marked } from 'marked';
import type { Guide, GuideCategory, LoadedGuide } from './types.js';

/**
 * Load and resolve all guides from inline config and/or an external manifest URL.
 * Returns guides grouped by category, with markdown rendered to HTML.
 */
export async function loadGuides(
  inlineGuides?: Guide[],
  guidesUrl?: string,
): Promise<{ categories: GuideCategory[]; loaded: Map<string, LoadedGuide> }> {
  let allGuides: Guide[] = [];

  // Fetch external manifest if provided
  if (guidesUrl) {
    const res = await fetch(guidesUrl);
    if (!res.ok) throw new Error(`Failed to load guides manifest: ${res.status}`);
    const manifest: Guide[] = await res.json();
    allGuides = manifest;
  }

  // Merge inline guides (inline content takes precedence on slug collision)
  if (inlineGuides?.length) {
    const slugSet = new Map<string, Guide>();
    for (const g of allGuides) slugSet.set(g.slug, g);
    for (const g of inlineGuides) slugSet.set(g.slug, g); // overwrite
    allGuides = Array.from(slugSet.values());
  }

  if (!allGuides.length) {
    return { categories: [], loaded: new Map() };
  }

  // Resolve content: fetch URLs, render markdown
  const loaded = new Map<string, LoadedGuide>();
  await Promise.all(
    allGuides.map(async (guide) => {
      let rawMarkdown = guide.content ?? '';

      if (!rawMarkdown && guide.url) {
        const res = await fetch(guide.url);
        if (res.ok) {
          rawMarkdown = await res.text();
        }
      }

      const htmlContent = rawMarkdown
        ? sanitizeHtml(await marked.parse(rawMarkdown))
        : '';

      loaded.set(guide.slug, { ...guide, htmlContent });
    }),
  );

  // Group by category
  const categoryMap = new Map<string, Guide[]>();
  for (const guide of allGuides) {
    const cat = guide.category || 'General';
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(guide);
  }

  // Sort within categories by order, then by original array position
  const categories: GuideCategory[] = [];
  for (const [name, guides] of categoryMap) {
    guides.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
    categories.push({ name, guides });
  }

  return { categories, loaded };
}

/**
 * Basic HTML sanitizer — strips <script>, <iframe>, on* attributes, and javascript: URLs.
 * This runs on the output of `marked` which already handles most XSS vectors,
 * but we add an extra layer of defense.
 */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object\b[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"')
    .replace(/href\s*=\s*'javascript:[^']*'/gi, "href='#'");
}
