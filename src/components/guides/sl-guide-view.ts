import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { resetStyles } from '../../styles/reset.css.js';
import type { LoadedGuide } from '../../core/types.js';

@customElement('sl-guide-view')
export class SlGuideView extends LitElement {
  static override styles = [
    resetStyles,
    css`
      :host {
        display: block;
        flex: 1;
        min-width: 0;
        padding: var(--sl-spacing-xl) var(--sl-spacing-2xl);
        max-width: 900px;
        margin: 0 auto;
      }

      .guide-header {
        margin-bottom: var(--sl-spacing-2xl);
        padding-bottom: var(--sl-spacing-xl);
        border-bottom: 1px solid var(--sl-color-border);
      }

      .guide-title {
        font-size: var(--sl-font-size-2xl);
        font-weight: 800;
        color: var(--sl-color-text);
        margin: 0;
        line-height: 1.3;
      }

      .guide-category {
        font-size: var(--sl-font-size-sm);
        color: var(--sl-color-text-muted);
        margin-top: var(--sl-spacing-xs);
      }

      /* ── Prose styles (mirroring sl-intro-desc) ── */

      .guide-content {
        font-size: var(--sl-font-size-base);
        color: var(--sl-color-text-secondary);
        line-height: 1.7;
      }

      .guide-content p {
        margin: 0 0 var(--sl-spacing-md) 0;
      }
      .guide-content p:last-child {
        margin-bottom: 0;
      }

      .guide-content h1,
      .guide-content h2,
      .guide-content h3,
      .guide-content h4,
      .guide-content h5,
      .guide-content h6 {
        color: var(--sl-color-text);
        font-weight: 700;
        margin: var(--sl-spacing-xl) 0 var(--sl-spacing-sm) 0;
        line-height: 1.3;
      }
      .guide-content h1 { font-size: 1.6rem; border-bottom: 2px solid var(--sl-color-border); padding-bottom: var(--sl-spacing-sm); }
      .guide-content h2 { font-size: 1.3rem; border-bottom: 1px solid var(--sl-color-border); padding-bottom: var(--sl-spacing-xs); }
      .guide-content h3 { font-size: 1.1rem; }
      .guide-content h4 { font-size: 1rem; }
      .guide-content h1:first-child,
      .guide-content h2:first-child,
      .guide-content h3:first-child {
        margin-top: 0;
      }

      .guide-content code {
        background: var(--sl-color-code-bg);
        padding: 2px 7px;
        border-radius: var(--sl-radius-sm);
        font-size: 0.85em;
        font-family: var(--sl-font-mono);
        border: 1px solid var(--sl-color-border);
      }

      .guide-content pre {
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: var(--sl-radius-md);
        padding: var(--sl-spacing-md);
        overflow-x: auto;
        margin: var(--sl-spacing-md) 0;
        line-height: 1.6;
      }
      .guide-content pre code {
        background: none;
        border: none;
        padding: 0;
        border-radius: 0;
        color: #e6edf3;
        font-size: var(--sl-font-size-sm);
        font-family: var(--sl-font-mono);
      }

      .guide-content a {
        color: var(--sl-color-primary);
        text-decoration: none;
        font-weight: 500;
        transition: all var(--sl-transition-fast);
      }
      .guide-content a:hover {
        text-decoration: underline;
      }

      .guide-content table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        border: 1px solid var(--sl-color-border);
        border-radius: var(--sl-radius-md);
        overflow: hidden;
        margin: var(--sl-spacing-md) 0;
        font-size: var(--sl-font-size-sm);
      }
      .guide-content thead {
        background: var(--sl-color-bg-subtle);
      }
      .guide-content th {
        text-align: left;
        padding: var(--sl-spacing-sm) var(--sl-spacing-md);
        font-weight: 600;
        color: var(--sl-color-text);
        border-bottom: 2px solid var(--sl-color-border);
      }
      .guide-content td {
        padding: var(--sl-spacing-sm) var(--sl-spacing-md);
        border-bottom: 1px solid var(--sl-color-border);
        color: var(--sl-color-text-secondary);
      }
      .guide-content tr:last-child td {
        border-bottom: none;
      }
      .guide-content tbody tr:hover {
        background: var(--sl-color-bg-subtle);
      }

      .guide-content blockquote {
        border-left: 3px solid var(--sl-color-primary);
        background: rgba(99, 102, 241, 0.05);
        margin: var(--sl-spacing-md) 0;
        padding: var(--sl-spacing-sm) var(--sl-spacing-lg);
        border-radius: 0 var(--sl-radius-md) var(--sl-radius-md) 0;
        color: var(--sl-color-text-secondary);
      }
      .guide-content blockquote p {
        margin-bottom: var(--sl-spacing-xs);
      }

      .guide-content ul,
      .guide-content ol {
        margin: var(--sl-spacing-sm) 0;
        padding-left: var(--sl-spacing-xl);
      }
      .guide-content li {
        margin-bottom: var(--sl-spacing-xs);
      }
      .guide-content li strong {
        color: var(--sl-color-text);
      }

      .guide-content hr {
        border: none;
        height: 1px;
        background: var(--sl-color-border);
        margin: var(--sl-spacing-xl) 0;
      }

      .guide-content img {
        max-width: 100%;
        height: auto;
        border-radius: var(--sl-radius-md);
        margin: var(--sl-spacing-sm) 0;
      }

      /* ── Empty state ───────────────────── */
      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 40vh;
        gap: var(--sl-spacing-md);
        color: var(--sl-color-text-muted);
        text-align: center;
      }

      .empty-icon {
        font-size: 2rem;
      }

      .empty-text {
        font-size: var(--sl-font-size-base);
      }

      @media (max-width: 768px) {
        :host {
          padding: var(--sl-spacing-md);
        }
      }
    `,
  ];

  @property({ type: Object }) guide: LoadedGuide | null = null;

  override render() {
    if (!this.guide) {
      return html`
        <div class="empty">
          <div class="empty-icon">📖</div>
          <div class="empty-text">Select a guide from the sidebar to get started.</div>
        </div>
      `;
    }

    return html`
      <div class="guide-header">
        <h1 class="guide-title">${this.guide.title}</h1>
        ${this.guide.category ? html`<div class="guide-category">${this.guide.category}</div>` : null}
      </div>
      <div class="guide-content" .innerHTML=${this.guide.htmlContent}></div>
    `;
  }
}
