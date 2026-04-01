import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { resetStyles } from '../../styles/reset.css.js';
import type { ParsedSpec } from '../../core/types.js';
import { marked } from 'marked';

@customElement('sl-header')
export class SlHeader extends LitElement {
  static override styles = [
    resetStyles,
    css`
      :host {
        display: block;
        position: sticky;
        top: 0;
        z-index: 100;
        background: var(--sl-color-surface);
        border-bottom: 1px solid var(--sl-color-border);
        backdrop-filter: blur(8px);
      }

      .header {
        display: flex;
        align-items: center;
        height: var(--sl-header-height);
        padding: 0 var(--sl-spacing-xl);
        gap: var(--sl-spacing-md);
      }

      .hamburger {
        display: none;
        padding: var(--sl-spacing-sm);
        border-radius: var(--sl-radius-md);
        color: var(--sl-color-text-muted);
      }

      .hamburger:hover {
        background: var(--sl-color-surface-raised);
      }

      @media (max-width: 768px) {
        .hamburger { display: flex; }
      }

      .title-area {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-sm);
        min-width: 0;
      }

      .title {
        font-size: var(--sl-font-size-lg);
        font-weight: 700;
        color: var(--sl-color-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .version {
        font-size: var(--sl-font-size-xs);
        font-weight: 600;
        padding: 2px 8px;
        border-radius: var(--sl-radius-full);
        background: var(--sl-color-primary);
        color: var(--sl-color-primary-text);
        white-space: nowrap;
      }

      .spacer { flex: 1; }

      .actions {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-xs);
      }

      .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: var(--sl-radius-md);
        color: var(--sl-color-text-muted);
        transition: all var(--sl-transition-fast);
      }

      .action-btn:hover {
        background: var(--sl-color-surface-raised);
        color: var(--sl-color-text);
      }

      .search-btn {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-sm);
        padding: 6px 12px;
        border-radius: var(--sl-radius-md);
        border: 1px solid var(--sl-color-border);
        color: var(--sl-color-text-muted);
        font-size: var(--sl-font-size-sm);
        transition: all var(--sl-transition-fast);
        min-width: 200px;
      }

      .search-btn:hover {
        border-color: var(--sl-color-border-hover);
        color: var(--sl-color-text-secondary);
      }

      .search-btn .shortcut {
        margin-left: auto;
        font-size: var(--sl-font-size-xs);
        padding: 1px 5px;
        border-radius: 3px;
        background: var(--sl-color-surface-raised);
        border: 1px solid var(--sl-color-border);
        font-family: var(--sl-font-mono);
      }

      @media (max-width: 768px) {
        .search-btn {
          min-width: unset;
          padding: 6px 10px;
        }
        .search-btn .search-text,
        .search-btn .shortcut {
          display: none;
        }
      }

      .info-bar {
        padding: var(--sl-spacing-md) var(--sl-spacing-xl);
        border-top: 1px solid var(--sl-color-border);
        font-size: var(--sl-font-size-sm);
      }

      .info-bar .description {
        color: var(--sl-color-text-secondary);
        line-height: 1.6;
      }

      .info-bar .description p {
        margin: 0 0 var(--sl-spacing-sm) 0;
      }

      .info-bar .description p:last-child {
        margin-bottom: 0;
      }

      .server-bar {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-sm);
        padding: var(--sl-spacing-sm) var(--sl-spacing-xl);
        border-top: 1px solid var(--sl-color-border);
        background: var(--sl-color-bg-subtle);
        font-size: var(--sl-font-size-sm);
      }

      .server-label {
        color: var(--sl-color-text-muted);
        font-weight: 500;
        white-space: nowrap;
      }

      .server-select {
        padding: 4px 8px;
        border-radius: var(--sl-radius-sm);
        border: 1px solid var(--sl-color-border);
        background: var(--sl-color-surface);
        color: var(--sl-color-text);
        font-family: var(--sl-font-mono);
        font-size: var(--sl-font-size-sm);
        max-width: 400px;
      }

      .auth-btn {
        font-size: var(--sl-font-size-sm);
        padding: 4px 12px;
        border-radius: var(--sl-radius-md);
        border: 1px solid var(--sl-color-border);
        color: var(--sl-color-text-secondary);
        font-weight: 500;
        transition: all var(--sl-transition-fast);
      }

      .auth-btn:hover {
        border-color: var(--sl-color-primary);
        color: var(--sl-color-primary);
      }

      .auth-btn.active {
        background: var(--sl-color-primary);
        color: var(--sl-color-primary-text);
        border-color: var(--sl-color-primary);
      }
    `,
  ];

  @property({ type: Object }) spec: ParsedSpec | null = null;
  @property({ type: Boolean }) authOpen = false;

  private _handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      this.dispatchEvent(new CustomEvent('toggle-search'));
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('keydown', this._handleKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._handleKeyDown);
  }

  override render() {
    if (!this.spec) return html``;

    return html`
      <div class="header">
        <button class="hamburger" @click=${() => this.dispatchEvent(new CustomEvent('toggle-sidebar'))}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          </svg>
        </button>

        <div class="title-area">
          <span class="title">${this.spec.title}</span>
          <span class="version">${this.spec.version}</span>
        </div>

        <div class="spacer"></div>

        <div class="actions">
          <button class="search-btn" @click=${() => this.dispatchEvent(new CustomEvent('toggle-search'))}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="7" cy="7" r="4.5"/>
              <path d="M10.5 10.5L14 14" stroke-linecap="round"/>
            </svg>
            <span class="search-text">Search endpoints…</span>
            <span class="shortcut">⌘K</span>
          </button>

          ${this.spec.securitySchemes.length > 0 ? html`
            <button
              class="auth-btn ${this.authOpen ? 'active' : ''}"
              @click=${() => this.dispatchEvent(new CustomEvent('toggle-auth'))}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align: -2px; margin-right: 4px;">
                <rect x="3" y="7" width="10" height="7" rx="1"/>
                <path d="M5 7V5a3 3 0 016 0v2"/>
              </svg>
              Auth
            </button>
          ` : null}

          <button class="action-btn" @click=${() => this.dispatchEvent(new CustomEvent('toggle-theme'))} title="Toggle theme">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="9" cy="9" r="4"/>
              <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.3 3.3l1.4 1.4M13.3 13.3l1.4 1.4M3.3 14.7l1.4-1.4M13.3 4.7l1.4-1.4"/>
            </svg>
          </button>
        </div>
      </div>

      ${this.spec.description ? html`
        <div class="info-bar">
          <div class="description" .innerHTML=${marked.parse(this.spec.description) as string}></div>
        </div>
      ` : null}

      ${this.spec.servers.length > 0 ? html`
        <div class="server-bar">
          <span class="server-label">Server:</span>
          <select class="server-select">
            ${this.spec.servers.map(s => html`
              <option value=${s.url}>${s.url}${s.description ? ` — ${s.description}` : ''}</option>
            `)}
          </select>
        </div>
      ` : null}
    `;
  }
}
