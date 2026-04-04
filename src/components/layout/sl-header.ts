import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { resetStyles } from '../../styles/reset.css.js';
import type { ParsedSpec } from '../../core/types.js';

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

      .auth-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: var(--sl-font-size-sm);
        font-weight: 600;
        height: 34px;
        padding: 0 14px;
        border-radius: var(--sl-radius-full);
        border: 1.5px solid var(--sl-color-border);
        color: var(--sl-color-text-secondary);
        background: transparent;
        letter-spacing: 0.01em;
        transition: all var(--sl-transition-fast);
      }

      .auth-btn:hover {
        border-color: var(--sl-color-primary);
        color: var(--sl-color-primary);
        background: var(--sl-color-sidebar-active);
      }

      .auth-btn.active {
        background: var(--sl-color-primary);
        color: var(--sl-color-primary-text);
        border-color: var(--sl-color-primary);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
      }

      .auth-btn.active:hover {
        background: var(--sl-color-primary-hover);
        border-color: var(--sl-color-primary-hover);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
      }
    `,
  ];

  @property({ type: Object }) spec: ParsedSpec | null = null;
  @property({ type: Boolean }) authOpen = false;

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
          <slot name="logo">
            <span class="title">${this.spec.title}</span>
            <span class="version">${this.spec.version}</span>
          </slot>
        </div>

        <div class="spacer"></div>

        <div class="actions">
          ${this.spec.securitySchemes.length > 0 ? html`
            <button
              class="auth-btn ${this.authOpen ? 'active' : ''}"
              @click=${() => this.dispatchEvent(new CustomEvent('toggle-auth'))}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="7" width="10" height="7" rx="1.5"/>
                <path d="M5.5 7V5a2.5 2.5 0 015 0v2"/>
              </svg>
              Authorize
            </button>
          ` : null}

          <slot name="header-actions"></slot>

          <button class="action-btn" @click=${() => this.dispatchEvent(new CustomEvent('toggle-theme'))} title="Toggle theme">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="9" cy="9" r="4"/>
              <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.3 3.3l1.4 1.4M13.3 13.3l1.4 1.4M3.3 14.7l1.4-1.4M13.3 4.7l1.4-1.4"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }
}
