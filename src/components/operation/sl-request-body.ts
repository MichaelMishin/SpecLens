import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { resetStyles } from '../../styles/reset.css.js';
import type { ParsedRequestBody } from '../../core/types.js';
import { sample as sampleFromSchema } from 'openapi-sampler';

@customElement('sl-request-body')
export class SlRequestBody extends LitElement {
  static override styles = [
    resetStyles,
    css`
      :host {
        display: block;
      }

      .desc {
        font-size: var(--sl-font-size-sm);
        color: var(--sl-color-text-secondary);
        margin-bottom: var(--sl-spacing-sm);
      }

      .media-tabs {
        display: flex;
        gap: 0;
        border-bottom: 1px solid var(--sl-color-border);
        margin-bottom: var(--sl-spacing-md);
      }

      .media-tab {
        padding: var(--sl-spacing-sm) var(--sl-spacing-md);
        font-size: var(--sl-font-size-xs);
        font-family: var(--sl-font-mono);
        color: var(--sl-color-text-muted);
        border-bottom: 2px solid transparent;
        transition: all var(--sl-transition-fast);
      }

      .media-tab:hover {
        color: var(--sl-color-text);
      }

      .media-tab.active {
        color: var(--sl-color-primary);
        border-bottom-color: var(--sl-color-primary);
      }

      .example-block {
        background: var(--sl-color-code-bg);
        border: 1px solid var(--sl-color-border);
        border-radius: var(--sl-radius-md);
        overflow: hidden;
      }

      .example-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--sl-spacing-sm) var(--sl-spacing-md);
        border-bottom: 1px solid var(--sl-color-border);
        background: var(--sl-color-surface-raised);
      }

      .example-label {
        font-size: var(--sl-font-size-xs);
        font-weight: 600;
        color: var(--sl-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .copy-btn {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
        padding: 2px 8px;
        border-radius: var(--sl-radius-sm);
        transition: all var(--sl-transition-fast);
      }

      .copy-btn:hover {
        background: var(--sl-color-surface);
        color: var(--sl-color-text);
      }

      pre {
        padding: var(--sl-spacing-md);
        font-size: var(--sl-font-size-sm);
        color: var(--sl-color-code-text);
        overflow-x: auto;
        line-height: 1.6;
      }

      .schema-section {
        margin-top: var(--sl-spacing-md);
      }

      .schema-label {
        font-size: var(--sl-font-size-xs);
        font-weight: 600;
        color: var(--sl-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: var(--sl-spacing-sm);
      }
    `,
  ];

  @property({ type: Object }) requestBody: ParsedRequestBody | null = null;
  @state() private _activeMediaType = 0;

  private _getSample(schema: object | null): string {
    if (!schema) return '{}';
    try {
      const sample = sampleFromSchema(schema as Record<string, unknown>);
      return JSON.stringify(sample, null, 2);
    } catch {
      return '{}';
    }
  }

  private _copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  override render() {
    if (!this.requestBody) return html``;
    const rb = this.requestBody;
    const content = rb.content[this._activeMediaType];
    if (!content) return html``;

    const example = content.example
      ? JSON.stringify(content.example, null, 2)
      : this._getSample(content.schema);

    return html`
      ${rb.description ? html`<div class="desc">${rb.description}</div>` : null}

      ${rb.content.length > 1 ? html`
        <div class="media-tabs">
          ${rb.content.map((c, i) => html`
            <button
              class="media-tab ${i === this._activeMediaType ? 'active' : ''}"
              @click=${() => this._activeMediaType = i}
            >${c.mediaType}</button>
          `)}
        </div>
      ` : null}

      <div class="example-block">
        <div class="example-header">
          <span class="example-label">Example</span>
          <button class="copy-btn" @click=${() => this._copy(example)}>Copy</button>
        </div>
        <pre><code>${example}</code></pre>
      </div>

      ${content.schema ? html`
        <div class="schema-section">
          <div class="schema-label">Schema</div>
          <sl-schema .schema=${content.schema}></sl-schema>
        </div>
      ` : null}
    `;
  }
}
