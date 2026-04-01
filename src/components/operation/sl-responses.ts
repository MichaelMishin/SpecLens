import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { resetStyles } from '../../styles/reset.css.js';
import type { ParsedResponse } from '../../core/types.js';
import { sample as sampleFromSchema } from 'openapi-sampler';

@customElement('sl-responses')
export class SlResponses extends LitElement {
  static override styles = [
    resetStyles,
    css`
      :host {
        display: block;
      }

      .status-tabs {
        display: flex;
        gap: 0;
        border-bottom: 1px solid var(--sl-color-border);
        margin-bottom: var(--sl-spacing-md);
        overflow-x: auto;
      }

      .status-tab {
        padding: var(--sl-spacing-sm) var(--sl-spacing-md);
        font-size: var(--sl-font-size-sm);
        font-family: var(--sl-font-mono);
        font-weight: 600;
        color: var(--sl-color-text-muted);
        border-bottom: 2px solid transparent;
        transition: all var(--sl-transition-fast);
        white-space: nowrap;
      }

      .status-tab:hover {
        color: var(--sl-color-text);
      }

      .status-tab.active {
        border-bottom-color: currentColor;
      }

      .status-2xx { color: var(--sl-color-success); }
      .status-3xx { color: var(--sl-color-info); }
      .status-4xx { color: var(--sl-color-warning); }
      .status-5xx { color: var(--sl-color-danger); }
      .status-default { color: var(--sl-color-text-muted); }

      .response-content {
        font-size: var(--sl-font-size-sm);
      }

      .response-desc {
        color: var(--sl-color-text-secondary);
        margin-bottom: var(--sl-spacing-md);
        line-height: 1.6;
      }

      .headers-section {
        margin-bottom: var(--sl-spacing-md);
      }

      .headers-label {
        font-size: var(--sl-font-size-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--sl-color-text-muted);
        margin-bottom: var(--sl-spacing-xs);
      }

      .header-row {
        display: grid;
        grid-template-columns: 150px 1fr;
        gap: var(--sl-spacing-sm);
        padding: var(--sl-spacing-xs) 0;
        border-bottom: 1px solid var(--sl-color-border);
      }

      .header-name {
        font-family: var(--sl-font-mono);
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text);
      }

      .header-desc {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
      }

      .example-block {
        background: var(--sl-color-code-bg);
        border: 1px solid var(--sl-color-border);
        border-radius: var(--sl-radius-md);
        overflow: hidden;
        margin-bottom: var(--sl-spacing-md);
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

      .media-type-badge {
        font-family: var(--sl-font-mono);
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
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

  @property({ type: Array }) responses: ParsedResponse[] = [];
  @state() private _activeTab = 0;

  private _getStatusClass(code: string): string {
    if (code === 'default') return 'status-default';
    if (code.startsWith('2')) return 'status-2xx';
    if (code.startsWith('3')) return 'status-3xx';
    if (code.startsWith('4')) return 'status-4xx';
    if (code.startsWith('5')) return 'status-5xx';
    return 'status-default';
  }

  private _getExample(response: ParsedResponse): string | null {
    const content = response.content[0];
    if (!content) return null;

    if (content.example) {
      return JSON.stringify(content.example, null, 2);
    }

    if (Object.keys(content.examples).length > 0) {
      const firstExample = Object.values(content.examples)[0];
      return JSON.stringify(firstExample, null, 2);
    }

    if (content.schema) {
      try {
        const sample = sampleFromSchema(content.schema as Record<string, unknown>);
        return JSON.stringify(sample, null, 2);
      } catch {
        return null;
      }
    }

    return null;
  }

  override render() {
    if (this.responses.length === 0) return html``;

    const active = this.responses[this._activeTab];
    if (!active) return html``;

    const example = this._getExample(active);
    const headers = Object.entries(active.headers);
    const mediaType = active.content[0]?.mediaType;
    const schema = active.content[0]?.schema;

    return html`
      <div class="status-tabs">
        ${this.responses.map((r, i) => html`
          <button
            class="status-tab ${this._getStatusClass(r.statusCode)} ${i === this._activeTab ? 'active' : ''}"
            @click=${() => this._activeTab = i}
          >${r.statusCode}</button>
        `)}
      </div>

      <div class="response-content">
        ${active.description ? html`<div class="response-desc">${active.description}</div>` : null}

        ${headers.length > 0 ? html`
          <div class="headers-section">
            <div class="headers-label">Headers</div>
            ${headers.map(([name, h]) => html`
              <div class="header-row">
                <span class="header-name">${name}</span>
                <span class="header-desc">${h.description}</span>
              </div>
            `)}
          </div>
        ` : null}

        ${example ? html`
          <div class="example-block">
            <div class="example-header">
              <span class="example-label">Response Example</span>
              ${mediaType ? html`<span class="media-type-badge">${mediaType}</span>` : null}
            </div>
            <pre><code>${example}</code></pre>
          </div>
        ` : null}

        ${schema ? html`
          <div class="schema-section">
            <div class="schema-label">Schema</div>
            <sl-schema .schema=${schema}></sl-schema>
          </div>
        ` : null}
      </div>
    `;
  }
}
