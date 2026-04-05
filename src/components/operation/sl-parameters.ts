import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { resetStyles } from '../../styles/reset.css.js';
import { marked } from 'marked';
import type { ParsedParameter } from '../../core/types.js';

@customElement('sl-parameters')
export class SlParameters extends LitElement {
  static override styles = [
    resetStyles,
    css`
      :host {
        display: block;
      }

      .param-group {
        margin-bottom: var(--sl-spacing-md);
      }

      .param-group-label {
        font-size: var(--sl-font-size-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--sl-color-text-muted);
        margin-bottom: var(--sl-spacing-xs);
        padding: var(--sl-spacing-xs) 0;
      }

      .param-row {
        display: grid;
        grid-template-columns: 180px 100px 1fr;
        gap: var(--sl-spacing-sm);
        padding: var(--sl-spacing-sm) 0;
        border-bottom: 1px solid var(--sl-color-border);
        font-size: var(--sl-font-size-sm);
        align-items: start;
      }

      .param-row:last-child {
        border-bottom: none;
      }

      .param-name-cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .param-name {
        font-family: var(--sl-font-mono);
        font-weight: 500;
        color: var(--sl-color-text);
        word-break: break-all;
      }

      .param-required {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-badge-required);
        font-weight: 600;
      }

      .param-deprecated {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-badge-deprecated);
        font-weight: 600;
      }

      .param-type {
        font-family: var(--sl-font-mono);
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
        padding-top: 2px;
      }

      .param-desc {
        color: var(--sl-color-text-secondary);
        line-height: 1.5;
      }

      .param-desc p {
        margin: 0 0 var(--sl-spacing-xs) 0;
      }

      .param-desc p:last-child {
        margin-bottom: 0;
      }

      .param-desc code {
        background: var(--sl-color-code-bg);
        padding: 1px 5px;
        border-radius: var(--sl-radius-sm);
        font-size: 0.85em;
        border: 1px solid var(--sl-color-border);
      }

      .param-desc pre {
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: var(--sl-radius-md);
        padding: var(--sl-spacing-sm) var(--sl-spacing-md);
        overflow-x: auto;
        margin: var(--sl-spacing-xs) 0;
      }

      .param-desc pre code {
        background: none;
        border: none;
        padding: 0;
        color: #e6edf3;
        font-size: var(--sl-font-size-xs);
      }

      .param-desc table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        border: 1px solid var(--sl-color-border);
        border-radius: var(--sl-radius-md);
        overflow: hidden;
        font-size: var(--sl-font-size-xs);
        margin: var(--sl-spacing-xs) 0;
      }

      .param-desc th,
      .param-desc td {
        padding: var(--sl-spacing-xs) var(--sl-spacing-sm);
        text-align: left;
        border-bottom: 1px solid var(--sl-color-border);
      }

      .param-desc th {
        background: var(--sl-color-bg-subtle);
        font-weight: 600;
        border-bottom-width: 2px;
      }

      .param-desc tr:last-child td {
        border-bottom: none;
      }

      .param-desc blockquote {
        border-left: 3px solid var(--sl-color-primary);
        background: rgba(99,102,241,0.05);
        padding: var(--sl-spacing-xs) var(--sl-spacing-sm);
        margin: var(--sl-spacing-xs) 0;
        border-radius: 0 var(--sl-radius-sm) var(--sl-radius-sm) 0;
      }

      .param-desc ul,
      .param-desc ol {
        padding-left: var(--sl-spacing-lg);
        margin: var(--sl-spacing-xs) 0;
      }

      .param-desc li {
        margin-bottom: 2px;
      }

      .param-desc a {
        color: var(--sl-color-primary);
        text-decoration: none;
      }

      .param-desc a:hover {
        text-decoration: underline;
      }

      .param-desc h1,
      .param-desc h2,
      .param-desc h3,
      .param-desc h4,
      .param-desc h5,
      .param-desc h6 {
        margin: var(--sl-spacing-xs) 0 2px 0;
        font-weight: 600;
        line-height: 1.3;
        color: var(--sl-color-text);
      }

      .param-desc h3 { font-size: 0.95em; }
      .param-desc h4 { font-size: 0.9em; }
      .param-desc h5,
      .param-desc h6 { font-size: 0.85em; }

      .param-example {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
        margin-top: 2px;
      }

      .param-example code {
        background: var(--sl-color-code-bg);
        padding: 1px 4px;
        border-radius: var(--sl-radius-sm);
        font-size: var(--sl-font-size-xs);
      }

      .param-enum {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 4px;
      }

      .enum-value {
        font-family: var(--sl-font-mono);
        font-size: 0.6875rem;
        padding: 1px 6px;
        border-radius: var(--sl-radius-sm);
        background: var(--sl-color-surface-raised);
        color: var(--sl-color-text-secondary);
      }

      @media (max-width: 768px) {
        .param-row {
          grid-template-columns: 1fr;
          gap: var(--sl-spacing-xs);
        }
      }
    `,
  ];

  @property({ type: Array }) parameters: ParsedParameter[] = [];

  private _getType(schema: Record<string, unknown> | null): string {
    if (!schema) return 'any';
    if (schema.type === 'array' && schema.items) {
      const items = schema.items as Record<string, unknown>;
      return `${items.type ?? 'any'}[]`;
    }
    return (schema.type as string) ?? (schema.oneOf ? 'oneOf' : schema.anyOf ? 'anyOf' : 'any');
  }

  private _getEnum(schema: Record<string, unknown> | null): string[] {
    if (!schema) return [];
    return (schema.enum as string[]) ?? [];
  }

  override render() {
    // Group by location
    const groups = new Map<string, ParsedParameter[]>();
    const order = ['path', 'query', 'header', 'cookie'];

    for (const p of this.parameters) {
      if (!groups.has(p.in)) groups.set(p.in, []);
      groups.get(p.in)!.push(p);
    }

    return html`
      ${order.filter(loc => groups.has(loc)).map(loc => html`
        <div class="param-group">
          <div class="param-group-label">${loc} parameters</div>
          ${groups.get(loc)!.map(param => html`
            <div class="param-row">
              <div class="param-name-cell">
                <span class="param-name">${param.name}</span>
                ${param.required ? html`<span class="param-required">required</span>` : null}
                ${param.deprecated ? html`<span class="param-deprecated">deprecated</span>` : null}
              </div>
              <div class="param-type">${this._getType(param.schema as Record<string, unknown>)}</div>
              <div>
                <div class="param-desc" .innerHTML=${marked.parse(param.description || '') as string}></div>
                ${param.example !== undefined ? html`
                  <div class="param-example">Example: <code>${JSON.stringify(param.example)}</code></div>
                ` : null}
                ${this._getEnum(param.schema as Record<string, unknown>).length > 0 ? html`
                  <div class="param-enum">
                    ${this._getEnum(param.schema as Record<string, unknown>).map(v => html`<span class="enum-value">${v}</span>`)}
                  </div>
                ` : null}
              </div>
            </div>
          `)}
        </div>
      `)}
    `;
  }
}
