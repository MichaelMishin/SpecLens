import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { resetStyles } from '../../styles/reset.css.js';
import type { TagGroup, HttpMethod } from '../../core/types.js';

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
        padding: var(--sl-spacing-md) 0;
        flex-shrink: 0;
        scrollbar-width: thin;
        scrollbar-color: var(--sl-color-border) transparent;
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
        font-family: var(--sl-font-mono);
        font-size: var(--sl-font-size-xs);
      }
    `,
  ];

  @property({ type: Array }) tagGroups: TagGroup[] = [];
  @property({ type: String }) activeOperationId = '';
  @property({ type: Boolean, reflect: true }) open = false;

  private _navigate(operationId: string) {
    this.dispatchEvent(new CustomEvent('navigate', { detail: operationId }));
    this.dispatchEvent(new CustomEvent('close-sidebar'));
  }

  override render() {
    return html`
      <div class="overlay" @click=${() => this.dispatchEvent(new CustomEvent('close-sidebar'))}></div>
      <nav class="sidebar">
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
                <span class="op-path">${op.path}</span>
              </a>
            `)}
          </div>
        `)}
      </nav>
    `;
  }
}
