import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { resetStyles } from '../../styles/reset.css.js';

interface SchemaObj {
  type?: string;
  properties?: Record<string, SchemaObj>;
  items?: SchemaObj;
  required?: string[];
  description?: string;
  format?: string;
  enum?: unknown[];
  const?: unknown;
  default?: unknown;
  example?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  readOnly?: boolean;
  writeOnly?: boolean;
  nullable?: boolean;
  deprecated?: boolean;
  allOf?: SchemaObj[];
  oneOf?: SchemaObj[];
  anyOf?: SchemaObj[];
  discriminator?: { propertyName: string; mapping?: Record<string, string> };
  additionalProperties?: boolean | SchemaObj;
  title?: string;
  $ref?: string;
}

@customElement('sl-schema')
export class SlSchema extends LitElement {
  static override styles = [
    resetStyles,
    css`
      :host {
        display: block;
        font-size: var(--sl-font-size-sm);
      }

      .schema-tree {
        border: 1px solid var(--sl-color-border);
        border-radius: var(--sl-radius-md);
        overflow: hidden;
      }

      .schema-row {
        display: grid;
        grid-template-columns: minmax(140px, auto) auto 1fr;
        gap: var(--sl-spacing-sm);
        padding: var(--sl-spacing-sm) var(--sl-spacing-md);
        border-bottom: 1px solid var(--sl-color-border);
        align-items: start;
      }

      .schema-row:last-child {
        border-bottom: none;
      }

      .schema-row.nested {
        padding-left: calc(var(--sl-spacing-md) + var(--sl-indent, 0px));
      }

      .prop-name {
        font-family: var(--sl-font-mono);
        font-weight: 500;
        color: var(--sl-color-text);
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-xs);
      }

      .toggle-btn {
        width: 16px;
        height: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--sl-color-text-muted);
        transition: transform var(--sl-transition-fast);
        flex-shrink: 0;
      }

      .toggle-btn.expanded {
        transform: rotate(90deg);
      }

      .type-info {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
      }

      .type-badge {
        font-family: var(--sl-font-mono);
        font-size: var(--sl-font-size-xs);
        padding: 1px 6px;
        border-radius: var(--sl-radius-sm);
        background: var(--sl-color-surface-raised);
        color: var(--sl-color-text-muted);
      }

      .required-badge {
        font-size: 0.6875rem;
        color: var(--sl-color-badge-required);
        font-weight: 600;
      }

      .readonly-badge,
      .writeonly-badge,
      .deprecated-badge,
      .nullable-badge {
        font-size: 0.6875rem;
        padding: 0 4px;
        border-radius: var(--sl-radius-sm);
      }

      .readonly-badge { color: var(--sl-color-info); }
      .writeonly-badge { color: var(--sl-color-warning); }
      .deprecated-badge { color: var(--sl-color-badge-deprecated); }
      .nullable-badge { color: var(--sl-color-text-muted); }

      .prop-desc {
        color: var(--sl-color-text-secondary);
        line-height: 1.5;
      }

      .constraints {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
        margin-top: 2px;
      }

      .enum-values {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 4px;
      }

      .enum-pill {
        font-family: var(--sl-font-mono);
        font-size: 0.6875rem;
        padding: 0 6px;
        border-radius: var(--sl-radius-sm);
        background: var(--sl-color-surface-raised);
        color: var(--sl-color-text-secondary);
      }

      .composition-label {
        font-size: var(--sl-font-size-xs);
        font-weight: 600;
        padding: var(--sl-spacing-xs) var(--sl-spacing-md);
        color: var(--sl-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        background: var(--sl-color-bg-subtle);
        border-bottom: 1px solid var(--sl-color-border);
      }

      .additional-props {
        padding: var(--sl-spacing-xs) var(--sl-spacing-md);
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
        font-style: italic;
        border-bottom: 1px solid var(--sl-color-border);
      }
    `,
  ];

  @property({ type: Object }) schema: SchemaObj | null = null;
  @property({ type: Number }) depth = 0;

  @state() private _expanded = new Set<string>();
  private _seen = new WeakSet<object>();

  private _toggleProp(key: string) {
    const next = new Set(this._expanded);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this._expanded = next;
  }

  private _renderType(s: SchemaObj): string {
    if (s.type === 'array' && s.items) {
      return `${s.items.type ?? 'any'}[]`;
    }
    return s.type ?? (s.oneOf ? 'oneOf' : s.anyOf ? 'anyOf' : s.allOf ? 'allOf' : 'any');
  }

  private _isExpandable(s: SchemaObj): boolean {
    if (s.type === 'object' && s.properties) return true;
    if (s.type === 'array' && s.items?.type === 'object') return true;
    if (s.allOf || s.oneOf || s.anyOf) return true;
    return false;
  }

  private _renderProperty(name: string, schema: SchemaObj, isRequired: boolean, indentLevel: number): unknown {
    const key = `${indentLevel}:${name}`;
    const expanded = this._expanded.has(key);
    const expandable = this._isExpandable(schema);
    const indent = indentLevel * 20;
    const constraints: string[] = [];

    if (schema.minimum !== undefined) constraints.push(`min: ${schema.minimum}`);
    if (schema.maximum !== undefined) constraints.push(`max: ${schema.maximum}`);
    if (schema.minLength !== undefined) constraints.push(`minLen: ${schema.minLength}`);
    if (schema.maxLength !== undefined) constraints.push(`maxLen: ${schema.maxLength}`);
    if (schema.pattern) constraints.push(`pattern: ${schema.pattern}`);
    if (schema.format) constraints.push(schema.format);

    // Detect circular reference
    if (typeof schema === 'object' && schema !== null) {
      if (this._seen.has(schema)) {
        return html`
          <div class="schema-row nested" style="--sl-indent: ${indent}px">
            <div class="prop-name">${name}</div>
            <div class="type-info"><span class="type-badge">[circular]</span></div>
            <div class="prop-desc" style="font-style: italic; color: var(--sl-color-text-muted);">Circular reference</div>
          </div>
        `;
      }
      this._seen.add(schema);
    }

    return html`
      <div class="schema-row nested" style="--sl-indent: ${indent}px">
        <div class="prop-name">
          ${expandable ? html`
            <button class="toggle-btn ${expanded ? 'expanded' : ''}" @click=${() => this._toggleProp(key)}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M4 2l4 4-4 4"/>
              </svg>
            </button>
          ` : html`<span style="width:16px"></span>`}
          ${name}
        </div>
        <div class="type-info">
          <span class="type-badge">${this._renderType(schema)}</span>
          ${isRequired ? html`<span class="required-badge">required</span>` : nothing}
          ${schema.readOnly ? html`<span class="readonly-badge">read-only</span>` : nothing}
          ${schema.writeOnly ? html`<span class="writeonly-badge">write-only</span>` : nothing}
          ${schema.deprecated ? html`<span class="deprecated-badge">deprecated</span>` : nothing}
          ${schema.nullable ? html`<span class="nullable-badge">nullable</span>` : nothing}
        </div>
        <div>
          ${schema.description ? html`<div class="prop-desc">${schema.description}</div>` : nothing}
          ${constraints.length > 0 ? html`<div class="constraints">${constraints.join(' · ')}</div>` : nothing}
          ${schema.enum ? html`
            <div class="enum-values">
              ${schema.enum.map(v => html`<span class="enum-pill">${JSON.stringify(v)}</span>`)}
            </div>
          ` : nothing}
        </div>
      </div>

      ${expanded ? this._renderNestedSchema(schema, indentLevel + 1) : nothing}
    `;
  }

  private _renderNestedSchema(schema: SchemaObj, indentLevel: number): unknown {
    // Handle object properties
    if (schema.type === 'object' && schema.properties) {
      const required = new Set(schema.required ?? []);
      return html`
        ${Object.entries(schema.properties).map(([name, prop]) =>
          this._renderProperty(name, prop, required.has(name), indentLevel)
        )}
        ${schema.additionalProperties && typeof schema.additionalProperties === 'object' ? html`
          <div class="additional-props" style="padding-left: calc(var(--sl-spacing-md) + ${indentLevel * 20}px)">
            Additional properties allowed
          </div>
        ` : nothing}
      `;
    }

    // Handle array items
    if (schema.type === 'array' && schema.items?.type === 'object') {
      const items = schema.items;
      const required = new Set(items.required ?? []);
      return html`
        ${items.properties ? Object.entries(items.properties).map(([name, prop]) =>
          this._renderProperty(name, prop, required.has(name), indentLevel)
        ) : nothing}
      `;
    }

    // Handle allOf / oneOf / anyOf
    for (const [key, label] of [['allOf', 'All Of'], ['oneOf', 'One Of'], ['anyOf', 'Any Of']] as const) {
      const arr = (schema as Record<string, SchemaObj[] | undefined>)[key];
      if (arr) {
        return html`
          ${arr.map((sub, i) => html`
            <div class="composition-label" style="padding-left: calc(var(--sl-spacing-md) + ${indentLevel * 20}px)">${label} #${i + 1}</div>
            ${sub.properties
              ? Object.entries(sub.properties).map(([name, prop]) =>
                  this._renderProperty(name, prop, (sub.required ?? []).includes(name), indentLevel)
                )
              : nothing}
          `)}
        `;
      }
    }

    return nothing;
  }

  override render() {
    if (!this.schema) return html``;

    this._seen = new WeakSet();

    // Root level: render properties if it's an object
    if (this.schema.type === 'object' && this.schema.properties) {
      const required = new Set(this.schema.required ?? []);
      return html`
        <div class="schema-tree">
          ${Object.entries(this.schema.properties).map(([name, prop]) =>
            this._renderProperty(name, prop, required.has(name), 0)
          )}
          ${this.schema.additionalProperties && typeof this.schema.additionalProperties === 'object' ? html`
            <div class="additional-props">Additional properties allowed</div>
          ` : nothing}
        </div>
      `;
    }

    // Array at root
    if (this.schema.type === 'array' && this.schema.items) {
      return html`
        <div class="schema-tree">
          <div class="composition-label">Array items (${(this.schema.items as SchemaObj).type ?? 'any'})</div>
          ${this._renderNestedSchema({ type: 'object', properties: (this.schema.items as SchemaObj).properties, required: (this.schema.items as SchemaObj).required }, 0)}
        </div>
      `;
    }

    // Composition at root
    if (this.schema.allOf || this.schema.oneOf || this.schema.anyOf) {
      return html`
        <div class="schema-tree">
          ${this._renderNestedSchema(this.schema, 0)}
        </div>
      `;
    }

    // Simple type
    return html`
      <div class="schema-tree">
        <div class="schema-row">
          <div class="prop-name">(root)</div>
          <div class="type-info"><span class="type-badge">${this._renderType(this.schema)}</span></div>
          <div class="prop-desc">${this.schema.description ?? ''}</div>
        </div>
      </div>
    `;
  }
}
