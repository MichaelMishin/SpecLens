import { Buffer } from 'buffer';

// Polyfill Buffer for swagger-parser's browser usage
if (typeof (globalThis as Record<string, unknown>).Buffer === 'undefined') {
  (globalThis as Record<string, unknown>).Buffer = Buffer;
}

import { SpecLensElement } from './spec-lens.js';
import type { SpecLensConfig } from './core/types.js';

// Register the custom element
if (!customElements.get('spec-lens')) {
  customElements.define('spec-lens', SpecLensElement);
}

// Public API
export const SpecLens = {
  /**
   * Mount SpecLens into a container element.
   *
   * @example
   * ```html
   * <div id="docs"></div>
   * <script src="https://cdn.jsdelivr.net/npm/speclens/dist/speclens.iife.js"></script>
   * <script>
   *   SpecLens.init('#docs', { specUrl: './openapi.json' });
   * </script>
   * ```
   */
  init(selector: string, config: SpecLensConfig): SpecLensElement {
    const container = document.querySelector(selector);
    if (!container) {
      throw new Error(`[SpecLens] Container not found: ${selector}`);
    }

    const el = document.createElement('spec-lens') as SpecLensElement;

    if (config.specUrl) {
      el.setAttribute('spec-url', config.specUrl);
    }
    if (config.theme && config.theme !== 'auto') {
      el.setAttribute('theme', config.theme);
    }
    if (config.proxyUrl) {
      el.setAttribute('proxy-url', config.proxyUrl);
    }
    if (config.hideTryIt) {
      el.setAttribute('hide-try-it', '');
    }
    if (config.hideCodeSamples) {
      el.setAttribute('hide-code-samples', '');
    }
    if (config.guidesUrl) {
      el.setAttribute('guides-url', config.guidesUrl);
    }

    // Pass full config object for properties not expressible as attributes
    el.config = config;

    container.appendChild(el);
    return el;
  },
};

// Re-export types for ESM consumers
export type { SpecLensConfig, Guide, GuideCategory, LoadedGuide } from './core/types.js';
export { SpecLensElement } from './spec-lens.js';
