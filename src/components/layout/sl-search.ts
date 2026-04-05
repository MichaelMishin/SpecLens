import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { resetStyles } from '../../styles/reset.css.js';
import type { SearchEngine, UnifiedSearchResult } from '../../core/types.js';
import type { SearchScope } from '../../core/search.js';

@customElement('sl-search')
export class SlSearch extends LitElement {
  static override styles = [
    resetStyles,
    css`
      :host {
        display: block;
        position: fixed;
        inset: 0;
        z-index: 300;
      }

      .overlay {
        position: absolute;
        inset: 0;
        background: var(--sl-color-overlay);
        animation: sl-fade-in 150ms ease;
      }

      @keyframes sl-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .modal {
        position: absolute;
        top: 15%;
        left: 50%;
        transform: translateX(-50%);
        width: min(560px, calc(100vw - 2rem));
        background: var(--sl-color-surface);
        border-radius: var(--sl-radius-xl);
        box-shadow: var(--sl-shadow-xl);
        border: 1px solid var(--sl-color-border);
        overflow: hidden;
        animation: sl-slide-up 150ms ease;
      }

      @keyframes sl-slide-up {
        from { opacity: 0; transform: translateX(-50%) translateY(8px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }

      .input-wrapper {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-sm);
        padding: var(--sl-spacing-md) var(--sl-spacing-lg);
        border-bottom: 1px solid var(--sl-color-border);
      }

      .search-icon {
        color: var(--sl-color-text-muted);
        flex-shrink: 0;
      }

      input {
        flex: 1;
        border: none;
        background: none;
        color: var(--sl-color-text);
        font-size: var(--sl-font-size-md);
        outline: none;
      }

      input::placeholder {
        color: var(--sl-color-text-muted);
      }

      .esc-hint {
        font-size: var(--sl-font-size-xs);
        padding: 2px 6px;
        border-radius: 3px;
        background: var(--sl-color-surface-raised);
        border: 1px solid var(--sl-color-border);
        color: var(--sl-color-text-muted);
        font-family: var(--sl-font-mono);
      }

      .results {
        max-height: 400px;
        overflow-y: auto;
        padding: var(--sl-spacing-sm) 0;
      }

      .result-item {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-sm);
        padding: var(--sl-spacing-sm) var(--sl-spacing-lg);
        cursor: pointer;
        transition: background var(--sl-transition-fast);
      }

      .result-item:hover,
      .result-item.highlighted {
        background: var(--sl-color-surface-raised);
      }

      .method-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        min-width: 48px;
        padding: 2px 0;
        border-radius: var(--sl-radius-sm);
        font-size: 0.625rem;
        font-weight: 700;
        font-family: var(--sl-font-mono);
        text-transform: uppercase;
      }

      .method-get { background: var(--sl-color-get-bg); color: var(--sl-color-get); }
      .method-post { background: var(--sl-color-post-bg); color: var(--sl-color-post); }
      .method-put { background: var(--sl-color-put-bg); color: var(--sl-color-put); }
      .method-delete { background: var(--sl-color-delete-bg); color: var(--sl-color-delete); }
      .method-patch { background: var(--sl-color-patch-bg); color: var(--sl-color-patch); }
      .method-options,
      .method-head,
      .method-trace { background: var(--sl-color-options-bg); color: var(--sl-color-options); }

      .result-info {
        min-width: 0;
        flex: 1;
      }

      .result-path {
        font-family: var(--sl-font-mono);
        font-size: var(--sl-font-size-sm);
        color: var(--sl-color-text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .result-summary {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .no-results {
        text-align: center;
        padding: var(--sl-spacing-xl);
        color: var(--sl-color-text-muted);
        font-size: var(--sl-font-size-sm);
      }

      .empty-state {
        text-align: center;
        padding: var(--sl-spacing-xl);
        color: var(--sl-color-text-muted);
        font-size: var(--sl-font-size-sm);
      }

      /* ── Guide result ───────────────────── */
      .guide-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        min-width: 48px;
        padding: 2px 0;
        border-radius: var(--sl-radius-sm);
        font-size: 0.625rem;
        font-weight: 700;
        text-transform: uppercase;
        background: var(--sl-color-bg-subtle);
        color: var(--sl-color-text-muted);
        border: 1px solid var(--sl-color-border);
      }

      /* ── Scope filter ────────────────────── */
      .scope-bar {
        display: flex;
        gap: 4px;
        padding: 4px var(--sl-spacing-lg) var(--sl-spacing-sm);
      }

      .scope-chip {
        padding: 3px 10px;
        border-radius: 999px;
        font-size: var(--sl-font-size-xs);
        font-weight: 600;
        cursor: pointer;
        transition: all var(--sl-transition-fast);
        border: 1px solid var(--sl-color-border);
        background: transparent;
        color: var(--sl-color-text-muted);
      }

      .scope-chip:hover {
        background: var(--sl-color-surface-raised);
        color: var(--sl-color-text);
      }

      .scope-chip.active {
        background: var(--sl-color-primary);
        color: #fff;
        border-color: var(--sl-color-primary);
      }

      /* ── Keyword chips ───────────────────── */
      .keywords-section {
        padding: var(--sl-spacing-sm) var(--sl-spacing-lg) var(--sl-spacing-md);
      }

      .keywords-label {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
        margin-bottom: 6px;
      }

      .keywords-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .keyword-chip {
        padding: 3px 10px;
        border-radius: 999px;
        font-size: var(--sl-font-size-xs);
        cursor: pointer;
        transition: all var(--sl-transition-fast);
        border: 1px solid var(--sl-color-border);
        background: var(--sl-color-surface-raised);
        color: var(--sl-color-text-muted);
      }

      .keyword-chip:hover {
        background: var(--sl-color-primary);
        color: #fff;
        border-color: var(--sl-color-primary);
      }
    `,
  ];

  @property({ type: Object }) searchEngine: SearchEngine | null = null;

  @state() private _query = '';
  @state() private _results: UnifiedSearchResult[] = [];
  @state() private _highlightIndex = 0;
  @state() private _scope: SearchScope = 'all';

  @query('input') private _input!: HTMLInputElement;

  override firstUpdated(): void {
    this._input?.focus();
  }

  private _handleInput(e: Event): void {
    this._query = (e.target as HTMLInputElement).value;
    this._highlightIndex = 0;
    this._runSearch();
  }

  private _runSearch(): void {
    if (this.searchEngine && this._query.trim()) {
      this._results = this.searchEngine.search(this._query, this._scope).slice(0, 20);
    } else {
      this._results = [];
    }
  }

  private _setScope(scope: SearchScope): void {
    this._scope = scope;
    this._runSearch();
    this._input?.focus();
  }

  private _searchKeyword(keyword: string): void {
    this._query = keyword;
    this._highlightIndex = 0;
    this._runSearch();
    if (this._input) this._input.value = keyword;
    this._input?.focus();
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'Escape':
        this.dispatchEvent(new CustomEvent('close'));
        break;
      case 'ArrowDown':
        e.preventDefault();
        this._highlightIndex = Math.min(this._highlightIndex + 1, this._results.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._highlightIndex = Math.max(this._highlightIndex - 1, 0);
        break;
      case 'Enter':
        if (this._results[this._highlightIndex]) {
          this._selectResult(this._results[this._highlightIndex]);
        }
        break;
    }
  }

  private _selectResult(result: UnifiedSearchResult): void {
    if (result.type === 'operation') {
      this.dispatchEvent(new CustomEvent('select-operation', { detail: result.operationId }));
    } else {
      this.dispatchEvent(new CustomEvent('select-guide', { detail: result.slug }));
    }
  }

  private _renderResult(result: UnifiedSearchResult, i: number) {
    if (result.type === 'operation') {
      return html`
        <div
          class="result-item ${i === this._highlightIndex ? 'highlighted' : ''}"
          @click=${() => this._selectResult(result)}
          @mouseenter=${() => this._highlightIndex = i}
        >
          <span class="method-badge method-${result.method}">${result.method}</span>
          <div class="result-info">
            <div class="result-path">${result.path}</div>
            ${result.summary ? html`<div class="result-summary">${result.summary}</div>` : null}
          </div>
        </div>
      `;
    } else {
      return html`
        <div
          class="result-item ${i === this._highlightIndex ? 'highlighted' : ''}"
          @click=${() => this._selectResult(result)}
          @mouseenter=${() => this._highlightIndex = i}
        >
          <span class="guide-badge">Guide</span>
          <div class="result-info">
            <div class="result-path">${result.title}</div>
            <div class="result-summary">${result.category}</div>
          </div>
        </div>
      `;
    }
  }

  override render() {
    const showScopeBar = this.searchEngine?.hasGuides();
    const keywords = this.searchEngine?.getKeywords() || [];

    return html`
      <div class="overlay" @click=${() => this.dispatchEvent(new CustomEvent('close'))}></div>
      <div class="modal" @keydown=${this._handleKeyDown}>
        <div class="input-wrapper">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="7" cy="7" r="4.5"/>
            <path d="M10.5 10.5L14 14" stroke-linecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search endpoints, guides…"
            .value=${this._query}
            @input=${this._handleInput}
          />
          <span class="esc-hint">Esc</span>
        </div>

        ${showScopeBar ? html`
          <div class="scope-bar">
            <button class="scope-chip ${this._scope === 'all' ? 'active' : ''}" @click=${() => this._setScope('all')}>All</button>
            <button class="scope-chip ${this._scope === 'api' ? 'active' : ''}" @click=${() => this._setScope('api')}>API Reference</button>
            <button class="scope-chip ${this._scope === 'guides' ? 'active' : ''}" @click=${() => this._setScope('guides')}>Guides</button>
          </div>
        ` : null}

        <div class="results">
          ${this._query.trim() === '' ? html`
            ${keywords.length > 0 ? html`
              <div class="keywords-section">
                <div class="keywords-label">Suggested searches</div>
                <div class="keywords-list">
                  ${keywords.map(kw => html`
                    <button class="keyword-chip" @click=${() => this._searchKeyword(kw)}>${kw}</button>
                  `)}
                </div>
              </div>
            ` : html`
              <div class="empty-state">Start typing to search…</div>
            `}
          ` : this._results.length === 0 ? html`
            <div class="no-results">No results for "${this._query}"</div>
          ` : this._results.map((result, i) => this._renderResult(result, i))}
        </div>
      </div>
    `;
  }
}
