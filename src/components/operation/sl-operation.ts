import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { resetStyles } from '../../styles/reset.css.js';
import { marked } from 'marked';
import type { ParsedOperation, ParsedServer, SecurityScheme, AuthState } from '../../core/types.js';

import './sl-parameters.js';
import './sl-request-body.js';
import './sl-responses.js';
import '../code/sl-code-samples.js';
import '../schema/sl-schema.js';

@customElement('sl-operation')
export class SlOperation extends LitElement {
  static override styles = [
    resetStyles,
    css`
      :host {
        display: block;
        margin-bottom: var(--sl-spacing-lg);
      }

      .operation {
        border: 1px solid var(--sl-color-border);
        border-radius: var(--sl-radius-lg);
        overflow: hidden;
        transition: box-shadow var(--sl-transition-fast);
      }

      .operation:hover {
        box-shadow: var(--sl-shadow-sm);
      }

      .op-header {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-md);
        padding: var(--sl-spacing-md) var(--sl-spacing-lg);
        cursor: pointer;
        user-select: none;
        transition: background var(--sl-transition-fast);
      }

      .op-header:hover {
        background: var(--sl-color-bg-subtle);
      }

      .method-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 56px;
        padding: 4px 10px;
        border-radius: var(--sl-radius-md);
        font-size: var(--sl-font-size-xs);
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
        font-family: var(--sl-font-mono);
        font-size: var(--sl-font-size-base);
        font-weight: 500;
        color: var(--sl-color-text);
        word-break: break-all;
      }

      .op-summary {
        flex: 1;
        font-size: var(--sl-font-size-sm);
        color: var(--sl-color-text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .badge-deprecated {
        font-size: var(--sl-font-size-xs);
        font-weight: 600;
        padding: 2px 8px;
        border-radius: var(--sl-radius-full);
        background: var(--sl-color-badge-deprecated-bg);
        color: var(--sl-color-badge-deprecated);
      }

      .try-it-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 14px;
        border-radius: var(--sl-radius-md);
        font-size: var(--sl-font-size-xs);
        font-weight: 600;
        color: var(--sl-color-primary);
        border: 1px solid var(--sl-color-primary);
        background: transparent;
        cursor: pointer;
        transition: all var(--sl-transition-fast);
        white-space: nowrap;
      }

      .try-it-btn:hover {
        background: var(--sl-color-primary);
        color: var(--sl-color-primary-text);
      }

      .expand-icon {
        color: var(--sl-color-text-muted);
        transition: transform var(--sl-transition-fast);
        flex-shrink: 0;
      }

      .expand-icon.expanded {
        transform: rotate(180deg);
      }

      .op-body {
        border-top: 1px solid var(--sl-color-border);
        display: grid;
        grid-template-columns: 3fr 2fr;
        gap: 0;
        min-height: 0;
      }

      .op-content {
        padding: var(--sl-spacing-lg);
        min-width: 0;
        overflow: hidden;
      }

      .op-code-panel {
        padding: var(--sl-spacing-lg);
        border-left: 1px solid var(--sl-color-border);
        background: var(--sl-color-bg-subtle);
        min-width: 0;
        overflow: hidden;
      }

      .op-responses-panel {
        margin-top: var(--sl-spacing-2xl);
        padding-top: var(--sl-spacing-xl);
        border-top: 1px solid var(--sl-color-border);
      }

      .op-code-sticky {
        position: sticky;
        top: calc(var(--sl-header-height) + var(--sl-spacing-lg));
      }

      .op-description {
        font-size: var(--sl-font-size-base);
        color: var(--sl-color-text-secondary);
        line-height: 1.7;
        margin-bottom: var(--sl-spacing-lg);
      }

      .op-description p {
        margin: 0 0 var(--sl-spacing-sm) 0;
      }

      .op-description p:last-child {
        margin-bottom: 0;
      }

      .op-description code {
        background: var(--sl-color-code-bg);
        padding: 2px 5px;
        border-radius: var(--sl-radius-sm);
        font-size: 0.85em;
      }

      .section-title {
        font-size: var(--sl-font-size-sm);
        font-weight: 600;
        color: var(--sl-color-text);
        margin: var(--sl-spacing-lg) 0 var(--sl-spacing-sm) 0;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .section-title:first-child {
        margin-top: 0;
      }

      .response-schema-block {
        margin-bottom: var(--sl-spacing-md);
        border: 1px solid var(--sl-color-border);
        border-radius: var(--sl-radius-md);
        overflow: hidden;
      }

      .response-schema-header {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-sm);
        padding: var(--sl-spacing-sm) var(--sl-spacing-md);
        background: var(--sl-color-bg-subtle);
        border-bottom: 1px solid var(--sl-color-border);
      }

      .response-schema-status {
        font-family: var(--sl-font-mono);
        font-size: var(--sl-font-size-xs);
        font-weight: 700;
      }

      .response-schema-status.status-2xx { color: var(--sl-color-success); }
      .response-schema-status.status-3xx { color: var(--sl-color-info); }
      .response-schema-status.status-4xx { color: var(--sl-color-warning); }
      .response-schema-status.status-5xx { color: var(--sl-color-danger); }
      .response-schema-status.status-default { color: var(--sl-color-text-muted); }

      .response-schema-desc {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
      }

      .copy-link-btn {
        margin-left: auto;
        padding: 4px 8px;
        border-radius: var(--sl-radius-sm);
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
        opacity: 0;
        transition: opacity var(--sl-transition-fast);
      }

      .op-header:hover .copy-link-btn {
        opacity: 1;
      }

      .copy-link-btn:hover {
        background: var(--sl-color-surface-raised);
        color: var(--sl-color-text);
      }

      @media (max-width: 900px) {
        .op-body {
          grid-template-columns: 1fr;
        }
        .op-code-panel {
          border-left: none;
          border-top: 1px solid var(--sl-color-border);
        }
        .op-code-sticky {
          position: static;
        }
      }
    `,
  ];

  @property({ type: Object }) operation!: ParsedOperation;
  @property({ type: Array }) servers: ParsedServer[] = [];
  @property({ type: Array }) securitySchemes: SecurityScheme[] = [];
  @property({ type: Object }) authState: AuthState = { apiKeys: {}, bearerTokens: {} };
  @property({ type: String }) proxyUrl = '';
  @property({ type: Boolean, attribute: 'hide-try-it' }) hideTryIt = false;
  @property({ type: Boolean, attribute: 'hide-code-samples' }) hideCodeSamples = false;
  @property({ type: String }) activeOperationId = '';

  @state() private _expanded = false;

  override willUpdate(changed: Map<string, unknown>): void {
    if (changed.has('activeOperationId') && this.activeOperationId) {
      if (this.activeOperationId === this.operation?.operationId) {
        this._expanded = true;
      }
    }
  }

  private _toggle() {
    this._expanded = !this._expanded;
  }

  private _copyLink(e: Event) {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#/operation/${encodeURIComponent(this.operation.operationId)}`;
    navigator.clipboard.writeText(url);
  }

  private _openTryIt(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('try-it', {
      detail: this.operation,
      bubbles: true,
      composed: true,
    }));
  }

  override render() {
    const op = this.operation;
    if (!op) return html``;

    return html`
      <div class="operation">
        <div class="op-header" @click=${this._toggle}>
          <span class="method-badge method-${op.method}">${op.method}</span>
          <span class="op-path">${op.path}</span>
          <span class="op-summary">${op.summary}</span>
          ${op.deprecated ? html`<span class="badge-deprecated">Deprecated</span>` : null}
          ${!this.hideTryIt ? html`
            <button class="try-it-btn" @click=${this._openTryIt}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 2l10 6-10 6V2z"/>
              </svg>
              Try It
            </button>
          ` : null}
          <button class="copy-link-btn" @click=${this._copyLink} title="Copy link">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="5" y="5" width="8" height="8" rx="1"/>
              <path d="M3 11V3h8"/>
            </svg>
          </button>
          <svg class="expand-icon ${this._expanded ? 'expanded' : ''}" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 6l4 4 4-4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        ${this._expanded ? html`
          <div class="op-body">
            <div class="op-content">
              ${op.description ? html`
                <div class="op-description" .innerHTML=${marked.parse(op.description) as string}></div>
              ` : null}

              ${op.parameters.length > 0 ? html`
                <div class="section-title">Parameters</div>
                <sl-parameters .parameters=${op.parameters}></sl-parameters>
              ` : null}

              ${op.requestBody ? html`
                <div class="section-title">Request Body ${op.requestBody.required ? html`<span style="color:var(--sl-color-badge-required)">*</span>` : ''}</div>
                <sl-request-body .requestBody=${op.requestBody}></sl-request-body>
              ` : null}

              ${op.responses.some(r => r.content[0]?.schema) ? html`
                <div class="section-title">Response Schema</div>
                ${op.responses.filter(r => r.content[0]?.schema).map(r => html`
                  <div class="response-schema-block">
                    <div class="response-schema-header">
                      <span class="response-schema-status status-${r.statusCode.startsWith('2') ? '2xx' : r.statusCode.startsWith('3') ? '3xx' : r.statusCode.startsWith('4') ? '4xx' : r.statusCode.startsWith('5') ? '5xx' : 'default'}">${r.statusCode}</span>
                      ${r.description ? html`<span class="response-schema-desc">${r.description}</span>` : null}
                    </div>
                    <sl-schema .schema=${r.content[0].schema}></sl-schema>
                  </div>
                `)}
              ` : null}
            </div>

            ${!this.hideCodeSamples ? html`
              <div class="op-code-panel">
                <div class="op-code-sticky">
                  <div class="section-title">Code Samples</div>
                  <sl-code-samples
                    .operation=${op}
                    .servers=${this.servers}
                    .authState=${this.authState}
                    .securitySchemes=${this.securitySchemes}
                  ></sl-code-samples>
                </div>
                ${op.responses.length > 0 ? html`
                  <div class="op-responses-panel">
                    <div class="section-title">Responses</div>
                    <sl-responses .responses=${op.responses}></sl-responses>
                  </div>
                ` : null}
              </div>
            ` : html`<div></div>`}
          </div>
        ` : null}
      </div>
    `;
  }
}
