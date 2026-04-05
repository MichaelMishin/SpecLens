import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { resetStyles } from '../../styles/reset.css.js';

@customElement('sl-nav-tabs')
export class SlNavTabs extends LitElement {
  static override styles = [
    resetStyles,
    css`
      :host {
        display: block;
        background: var(--sl-color-surface);
        border-bottom: 1px solid var(--sl-color-border);
        z-index: 99;
      }

      .tabs {
        display: flex;
        align-items: stretch;
        gap: var(--sl-spacing-xs);
        padding: 0 var(--sl-spacing-xl);
        height: 42px;
      }

      .tab {
        position: relative;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0 var(--sl-spacing-md);
        font-size: var(--sl-font-size-sm);
        font-weight: 600;
        color: var(--sl-color-text-muted);
        cursor: pointer;
        border: none;
        background: none;
        transition: color var(--sl-transition-fast);
        white-space: nowrap;
      }

      .tab:hover {
        color: var(--sl-color-text);
      }

      .tab.active {
        color: var(--sl-color-primary);
      }

      .tab.active::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: var(--sl-spacing-sm);
        right: var(--sl-spacing-sm);
        height: 2px;
        background: var(--sl-color-primary);
        border-radius: 2px 2px 0 0;
      }

      .tab svg {
        flex-shrink: 0;
      }
    `,
  ];

  @property() activeTab: 'api' | 'guides' = 'api';

  private _switchTab(tab: 'api' | 'guides') {
    if (tab === this.activeTab) return;
    this.dispatchEvent(new CustomEvent('tab-change', { detail: tab }));
  }

  override render() {
    return html`
      <div class="tabs">
        <button
          class="tab ${this.activeTab === 'api' ? 'active' : ''}"
          @click=${() => this._switchTab('api')}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 4h12M2 8h8M2 12h10"/>
          </svg>
          API Reference
        </button>
        <button
          class="tab ${this.activeTab === 'guides' ? 'active' : ''}"
          @click=${() => this._switchTab('guides')}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3h10a2 2 0 012 2v8a1 1 0 01-1 1H5a2 2 0 01-2-2V3z"/>
            <path d="M2 3a2 2 0 012-2h6l4 4"/>
            <path d="M5 9h6M5 12h4"/>
          </svg>
          Guides
        </button>
      </div>
    `;
  }
}
