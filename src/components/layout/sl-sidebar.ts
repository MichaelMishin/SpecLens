import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { resetStyles } from '../../styles/reset.css.js';
import type { TagGroup, SearchEngine, SearchResult } from '../../core/types.js';

@customElement('sl-sidebar')
export class SlSidebar extends LitElement {
  static override styles = [
    resetStyles,
    css`
      :host {
        display: block;
      }

      .sidebar {
        position: sticky;
        top: var(--sl-header-height);
        width: var(--sl-sidebar-width);
        height: calc(100vh - var(--sl-header-height));
        overflow-y: auto;
        overflow-x: hidden;
        background: var(--sl-color-sidebar-bg);
        border-right: 1px solid var(--sl-color-border);
        padding: 0;
        flex-shrink: 0;
        scrollbar-width: thin;
        scrollbar-color: var(--sl-color-border) transparent;
        display: flex;
        flex-direction: column;
      }

      .sidebar::-webkit-scrollbar {
        width: 4px;
      }
      .sidebar::-webkit-scrollbar-thumb {
        background: var(--sl-color-border);
        border-radius: 2px;
      }

      .overlay {
        display: none;
      }

      @media (max-width: 768px) {
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          z-index: 200;
          transform: translateX(-100%);
          transition: transform var(--sl-transition-base);
          box-shadow: var(--sl-shadow-xl);
        }

        :host([open]) .sidebar {
          transform: translateX(0);
        }

        .overlay {
          display: block;
          position: fixed;
          inset: 0;
          background: var(--sl-color-overlay);
          z-index: 199;
          opacity: 0;
          pointer-events: none;
          transition: opacity var(--sl-transition-base);
        }

        :host([open]) .overlay {
          opacity: 1;
          pointer-events: auto;
        }
      }

      /* ── Search ────────────────────────── */
      .search-box {
        padding: var(--sl-spacing-md) var(--sl-spacing-md) var(--sl-spacing-sm);
        flex-shrink: 0;
      }

      .search-input-wrap {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-sm);
        padding: 6px 10px;
        border: 1px solid var(--sl-color-border);
        border-radius: var(--sl-radius-md);
        background: var(--sl-color-bg);
        transition: border-color var(--sl-transition-fast);
      }

      .search-input-wrap:focus-within {
        border-color: var(--sl-color-primary);
      }

      .search-icon {
        color: var(--sl-color-text-muted);
        flex-shrink: 0;
      }

      .search-input {
        flex: 1;
        border: none;
        background: none;
        color: var(--sl-color-text);
        font-size: var(--sl-font-size-sm);
        outline: none;
        min-width: 0;
      }

      .search-input::placeholder {
        color: var(--sl-color-text-muted);
      }

      .search-shortcut {
        font-size: 0.625rem;
        padding: 1px 5px;
        border-radius: 3px;
        background: var(--sl-color-surface-raised);
        border: 1px solid var(--sl-color-border);
        color: var(--sl-color-text-muted);
        font-family: var(--sl-font-mono);
        flex-shrink: 0;
      }

      /* ── Nav ───────────────────────────── */
      .nav-list {
        flex: 1;
        overflow-y: auto;
        padding: var(--sl-spacing-xs) 0 var(--sl-spacing-md);
        scrollbar-width: thin;
        scrollbar-color: var(--sl-color-border) transparent;
      }

      .nav-list::-webkit-scrollbar {
        width: 4px;
      }
      .nav-list::-webkit-scrollbar-thumb {
        background: var(--sl-color-border);
        border-radius: 2px;
      }

      .intro-link {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-sm);
        padding: 8px var(--sl-spacing-lg);
        font-size: var(--sl-font-size-sm);
        font-weight: 600;
        color: var(--sl-color-text-secondary);
        cursor: pointer;
        transition: all var(--sl-transition-fast);
        border-left: 2px solid transparent;
      }

      .intro-link:hover {
        background: var(--sl-color-sidebar-hover);
        color: var(--sl-color-text);
      }

      .intro-link.active {
        background: var(--sl-color-sidebar-active);
        color: var(--sl-color-primary);
        border-left-color: var(--sl-color-primary);
      }

      .tag-group {
        margin-bottom: var(--sl-spacing-xs);
      }

      .tag-header {
        display: flex;
        align-items: center;
        padding: var(--sl-spacing-sm) var(--sl-spacing-lg);
        font-size: var(--sl-font-size-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--sl-color-text-muted);
        cursor: default;
        user-select: none;
      }

      .op-link {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-sm);
        padding: 5px var(--sl-spacing-lg) 5px calc(var(--sl-spacing-lg) + 4px);
        font-size: var(--sl-font-size-sm);
        color: var(--sl-color-text-secondary);
        cursor: pointer;
        transition: all var(--sl-transition-fast);
        text-decoration: none;
        border-left: 2px solid transparent;
      }

      .op-link:hover {
        background: var(--sl-color-sidebar-hover);
        color: var(--sl-color-text);
      }

      .op-link.active {
        background: var(--sl-color-sidebar-active);
        color: var(--sl-color-primary);
        border-left-color: var(--sl-color-primary);
      }

      .method-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        min-width: 42px;
        padding: 1px 0;
        border-radius: var(--sl-radius-sm);
        font-size: 0.625rem;
        font-weight: 700;
        font-family: var(--sl-font-mono);
        text-transform: uppercase;
        letter-spacing: 0.02em;
      }

      .method-get { background: var(--sl-color-get-bg); color: var(--sl-color-get); }
      .method-post { background: var(--sl-color-post-bg); color: var(--sl-color-post); }
      .method-put { background: var(--sl-color-put-bg); color: var(--sl-color-put); }
      .method-delete { background: var(--sl-color-delete-bg); color: var(--sl-color-delete); }
      .method-patch { background: var(--sl-color-patch-bg); color: var(--sl-color-patch); }
      .method-options,
      .method-head,
      .method-trace { background: var(--sl-color-options-bg); color: var(--sl-color-options); }

      .op-path {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--sl-font-size-xs);
      }

      .no-results {
        padding: var(--sl-spacing-md) var(--sl-spacing-lg);
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
        text-align: center;
      }
    `,
  ];

  @property({ type: Array }) tagGroups: TagGroup[] = [];
  @property({ type: String }) activeOperationId = '';
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: Object }) searchEngine: SearchEngine | null = null;

  @state() private _searchQuery = '';
  @state() private _searchResults: SearchResult[] = [];

  @query('.search-input') private _searchInput!: HTMLInputElement;

  focusSearch() {
    this._searchInput?.focus();
  }

  private _handleSearchInput(e: Event) {
    this._searchQuery = (e.target as HTMLInputElement).value;
    if (this.searchEngine && this._searchQuery.trim()) {
      this._searchResults = this.searchEngine.search(this._searchQuery).slice(0, 30);
    } else {
      this._searchResults = [];
    }
  }

  private _navigate(operationId: string) {
    this._searchQuery = '';
    this._searchResults = [];
    this.dispatchEvent(new CustomEvent('navigate', { detail: operationId }));
    this.dispatchEvent(new CustomEvent('close-sidebar'));
  }

  private _navigateIntro() {
    this._searchQuery = '';
    this._searchResults = [];
    this.dispatchEvent(new CustomEvent('navigate-intro'));
    this.dispatchEvent(new CustomEvent('close-sidebar'));
  }

  private _isIntroActive(): boolean {
    return !this.activeOperationId;
  }

  override render() {
    const isSearching = this._searchQuery.trim().length > 0;

    return html`
      <div class="overlay" @click=${() => this.dispatchEvent(new CustomEvent('close-sidebar'))}></div>
      <nav class="sidebar">
        <div class="search-box">
          <div class="search-input-wrap">
            <svg class="search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="7" cy="7" r="4.5"/>
              <path d="M10.5 10.5L14 14" stroke-linecap="round"/>
            </svg>
            <input
              class="search-input"
              type="text"
              placeholder="Search endpoints…"
              .value=${this._searchQuery}
              @input=${this._handleSearchInput}
            />
            <span class="search-shortcut">⌘K</span>
          </div>
        </div>

        <div class="nav-list">
          ${isSearching ? html`
            ${this._searchResults.length > 0 ? this._searchResults.map(r => html`
              <a
                class="op-link ${r.operationId === this.activeOperationId ? 'active' : ''}"
                @click=${() => this._navigate(r.operationId)}
                title="${r.method.toUpperCase()} ${r.path}"
              >
                <span class="method-badge method-${r.method}">${r.method}</span>
                <span class="op-path">${r.summary || r.path}</span>
              </a>
            `) : html`<div class="no-results">No matching endpoints</div>`}
          ` : html`
            <a class="intro-link ${this._isIntroActive() ? 'active' : ''}" @click=${this._navigateIntro}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M8 2v12M4 6l4-4 4 4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Introduction
            </a>
            ${this.tagGroups.map(group => html`
              <div class="tag-group">
                <div class="tag-header">${group.name}</div>
                ${group.operations.map(op => html`
                  <a
                    class="op-link ${op.operationId === this.activeOperationId ? 'active' : ''}"
                    @click=${() => this._navigate(op.operationId)}
                    title="${op.method.toUpperCase()} ${op.path}"
                  >
                    <span class="method-badge method-${op.method}">${op.method}</span>
                    <span class="op-path">${op.summary || op.path}</span>
                  </a>
                `)}
              </div>
            `)}
          `}
        </div>
      </nav>
    `;
  }
}
