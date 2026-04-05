import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { resetStyles } from '../../styles/reset.css.js';
import type { GuideCategory } from '../../core/types.js';

@customElement('sl-guide-sidebar')
export class SlGuideSidebar extends LitElement {
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

      /* ── Nav ───────────────────────────── */
      .nav-list {
        flex: 1;
        overflow-y: auto;
        padding: var(--sl-spacing-sm) 0 var(--sl-spacing-md);
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

      .category {
        margin-bottom: var(--sl-spacing-xs);
      }

      .category-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--sl-spacing-sm) var(--sl-spacing-lg);
        font-size: var(--sl-font-size-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--sl-color-text-muted);
        cursor: pointer;
        user-select: none;
        transition: color var(--sl-transition-fast);
      }

      .category-header:hover {
        color: var(--sl-color-text);
      }

      .category-header .chevron {
        transition: transform var(--sl-transition-fast);
      }

      .category-header.collapsed .chevron {
        transform: rotate(-90deg);
      }

      .category-guides {
        overflow: hidden;
      }

      .category-guides.collapsed {
        display: none;
      }

      .guide-link {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-sm);
        padding: 7px var(--sl-spacing-lg) 7px calc(var(--sl-spacing-lg) + 4px);
        font-size: var(--sl-font-size-sm);
        color: var(--sl-color-text-secondary);
        cursor: pointer;
        transition: all var(--sl-transition-fast);
        text-decoration: none;
        border-left: 2px solid transparent;
      }

      .guide-link:hover {
        background: var(--sl-color-sidebar-hover);
        color: var(--sl-color-text);
        text-decoration: none;
      }

      .guide-link.active {
        background: var(--sl-color-sidebar-active);
        color: var(--sl-color-primary);
        border-left-color: var(--sl-color-primary);
      }

      .guide-icon {
        flex-shrink: 0;
        color: var(--sl-color-text-muted);
      }

      .guide-link.active .guide-icon {
        color: var(--sl-color-primary);
      }

      .guide-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `,
  ];

  @property({ type: Array }) categories: GuideCategory[] = [];
  @property({ type: String }) activeGuideSlug = '';
  @property({ type: Boolean, reflect: true }) open = false;

  @state() private _collapsedCategories = new Set<string>();

  private _toggleCategory(name: string) {
    if (this._collapsedCategories.has(name)) {
      this._collapsedCategories.delete(name);
    } else {
      this._collapsedCategories.add(name);
    }
    this.requestUpdate();
  }

  private _navigateGuide(slug: string) {
    this.dispatchEvent(new CustomEvent('navigate-guide', { detail: slug }));
    this.dispatchEvent(new CustomEvent('close-sidebar'));
  }

  override render() {
    return html`
      <div class="overlay" @click=${() => this.dispatchEvent(new CustomEvent('close-sidebar'))}></div>
      <nav class="sidebar">
        <div class="nav-list">
          ${this.categories.map(cat => {
            const collapsed = this._collapsedCategories.has(cat.name);
            return html`
              <div class="category">
                <div
                  class="category-header ${collapsed ? 'collapsed' : ''}"
                  @click=${() => this._toggleCategory(cat.name)}
                >
                  <span>${cat.name}</span>
                  <svg class="chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 4.5l3 3 3-3"/>
                  </svg>
                </div>
                <div class="category-guides ${collapsed ? 'collapsed' : ''}">
                  ${cat.guides.map(g => html`
                    <a
                      class="guide-link ${g.slug === this.activeGuideSlug ? 'active' : ''}"
                      @click=${() => this._navigateGuide(g.slug)}
                    >
                      <svg class="guide-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
                        <path d="M6 5h4M6 8h4M6 11h2"/>
                      </svg>
                      <span class="guide-title">${g.title}</span>
                    </a>
                  `)}
                </div>
              </div>
            `;
          })}
        </div>
      </nav>
    `;
  }
}
