import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { resetStyles } from '../../styles/reset.css.js';
import { marked } from 'marked';
import { generateAiPrompt, openAiWithPrompt } from '../../core/ai-prompt.js';
import type { AiTarget } from '../../core/ai-prompt.js';
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

      /* ── Copy Route Button ───────────────── */
      .copy-route-btn {
        padding: 4px 6px;
        border-radius: var(--sl-radius-sm);
        color: var(--sl-color-text-muted);
        opacity: 0;
        transition: opacity var(--sl-transition-fast);
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
      }

      .op-header:hover .copy-route-btn {
        opacity: 1;
      }

      .copy-route-btn:hover {
        background: var(--sl-color-surface-raised);
        color: var(--sl-color-text);
      }

      .copy-route-btn .copied-check {
        color: var(--sl-color-success, #22c55e);
      }

      /* ── Ask AI Button ───────────────────── */
      .ask-ai-wrapper {
        flex-shrink: 0;
        opacity: 0;
        transition: opacity var(--sl-transition-fast);
      }

      .op-header:hover .ask-ai-wrapper {
        opacity: 1;
      }

      .ask-ai-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 12px;
        border-radius: var(--sl-radius-md);
        font-size: var(--sl-font-size-xs);
        font-weight: 600;
        color: var(--sl-color-text-muted);
        border: 1px solid var(--sl-color-border);
        background: transparent;
        cursor: pointer;
        transition: all var(--sl-transition-fast);
        white-space: nowrap;
      }

      .ask-ai-btn:hover {
        background: var(--sl-color-surface-raised);
        color: var(--sl-color-text);
        border-color: var(--sl-color-text-muted);
      }

      .ai-menu {
        position: fixed;
        z-index: 9999;
        min-width: 150px;
        background: var(--sl-color-surface);
        border: 1px solid var(--sl-color-border);
        border-radius: var(--sl-radius-md);
        box-shadow: var(--sl-shadow-md);
        padding: 4px 0;
        animation: sl-menu-in 120ms ease;
      }

      @keyframes sl-menu-in {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .ai-menu-item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 8px 14px;
        font-size: var(--sl-font-size-sm);
        color: var(--sl-color-text);
        cursor: pointer;
        transition: background var(--sl-transition-fast);
        white-space: nowrap;
        text-align: left;
      }

      .ai-menu-item:hover {
        background: var(--sl-color-bg-subtle);
      }

      .ai-menu-item svg {
        flex-shrink: 0;
      }

      /* ── AI clipboard toast ──────────────── */
      .ai-toast {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 18px;
        background: var(--sl-color-text);
        color: var(--sl-color-bg);
        border-radius: var(--sl-radius-lg);
        font-size: var(--sl-font-size-sm);
        font-weight: 500;
        box-shadow: var(--sl-shadow-lg);
        white-space: nowrap;
        animation: sl-toast-in 200ms ease;
      }

      @keyframes sl-toast-in {
        from { opacity: 0; transform: translateX(-50%) translateY(8px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
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
  @property({ type: Boolean, attribute: 'hide-ask-ai' }) hideAskAi = false;
  @property({ type: String }) activeOperationId = '';

  @state() private _expanded = false;
  @state() private _routeCopied = false;
  @state() private _aiMenuOpen = false;
  @state() private _aiMenuRect: DOMRect | null = null;
  @state() private _aiToast = false;

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

  private _copyRoute(e: Event) {
    e.stopPropagation();
    navigator.clipboard.writeText(this.operation.path);
    this._routeCopied = true;
    setTimeout(() => { this._routeCopied = false; }, 1500);
  }

  private _toggleAiMenu(e: Event) {
    e.stopPropagation();
    if (!this._aiMenuOpen) {
      this._aiMenuRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    }
    this._aiMenuOpen = !this._aiMenuOpen;
    if (this._aiMenuOpen) {
      const close = (ev: Event) => {
        const path = ev.composedPath();
        const wrapper = this.renderRoot.querySelector('.ask-ai-wrapper');
        const menu = this.renderRoot.querySelector('.ai-menu');
        if (!path.includes(wrapper as Element) && !path.includes(menu as Element)) {
          this._aiMenuOpen = false;
          document.removeEventListener('click', close, true);
        }
      };
      requestAnimationFrame(() => document.addEventListener('click', close, true));
    }
  }

  private async _openAi(target: AiTarget, e: Event) {
    e.stopPropagation();
    this._aiMenuOpen = false;
    const prompt = generateAiPrompt(this.operation);
    const result = await openAiWithPrompt(prompt, target);
    if (result === 'clipboard') {
      this._aiToast = true;
      setTimeout(() => { this._aiToast = false; }, 4000);
    }
  }

  override render() {
    const op = this.operation;
    if (!op) return html``;

    return html`
      <div class="operation">
        <div class="op-header" @click=${this._toggle}>
          <span class="method-badge method-${op.method}">${op.method}</span>
          <span class="op-path">${op.path}</span>
          <button class="copy-route-btn" style=${this._routeCopied ? 'opacity:1' : ''} @click=${this._copyRoute} title="Copy route path">
            ${this._routeCopied ? html`
              <svg class="copied-check" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 8.5l3.5 3.5 6.5-7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            ` : html`
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="5" y="5" width="8" height="8" rx="1"/>
                <path d="M3 11V3h8"/>
              </svg>
            `}
          </button>
          <span class="op-summary">${op.summary}</span>
          ${op.deprecated ? html`<span class="badge-deprecated">Deprecated</span>` : null}
          ${!this.hideAskAi ? html`
            <div class="ask-ai-wrapper" style=${this._aiMenuOpen ? 'opacity:1' : ''}>
              <button class="ask-ai-btn" @click=${this._toggleAiMenu}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1l1.5 3.5L13 6l-3.5 1.5L8 11 6.5 7.5 3 6l3.5-1.5L8 1zM3 11l.75 1.75L5.5 13.5l-1.75.75L3 16l-.75-1.75L.5 13.5l1.75-.75L3 11zM12.5 10l.75 1.75 1.75.75-1.75.75-.75 1.75-.75-1.75L10 12.5l1.75-.75.75-1.75z"/>
                </svg>
                Ask AI
              </button>
            </div>
          ` : null}
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
      ${this._aiMenuOpen && this._aiMenuRect ? html`
        <div class="ai-menu" style="top:${this._aiMenuRect.bottom + 4}px;right:${window.innerWidth - this._aiMenuRect.right}px">
          <button class="ai-menu-item" @click=${(e: Event) => this._openAi('chatgpt', e)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.677l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.612-1.5z"/>
            </svg>
            ChatGPT
          </button>
          <button class="ai-menu-item" @click=${(e: Event) => this._openAi('claude', e)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.827 3.52h-3.654L5 20.48h3.213l1.436-4.115h4.847l1.367 4.115H19L13.827 3.52zm-3.192 10.6 1.85-5.3 1.744 5.3h-3.594z"/>
            </svg>
            Claude
          </button>
        </div>
      ` : null}
      ${this._aiToast ? html`
        <div class="ai-toast">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="5" y="5" width="8" height="8" rx="1"/>
            <path d="M3 11V3h8"/>
          </svg>
          Prompt copied — paste it into the chat
        </div>
      ` : null}
    `;
  }
}
