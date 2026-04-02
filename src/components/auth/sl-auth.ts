import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { resetStyles } from '../../styles/reset.css.js';
import { marked } from 'marked';
import type { SecurityScheme, AuthState } from '../../core/types.js';

@customElement('sl-auth')
export class SlAuth extends LitElement {
  static override styles = [
    resetStyles,
    css`
      :host {
        display: block;
        position: fixed;
        inset: 0;
        z-index: 300;
      }

      .overlay {
        position: absolute;
        inset: 0;
        background: var(--sl-color-overlay);
        animation: sl-fade-in 150ms ease;
      }

      @keyframes sl-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .modal {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: min(580px, calc(100vw - 2rem));
        max-height: calc(100vh - 4rem);
        background: var(--sl-color-surface);
        border-radius: var(--sl-radius-xl);
        box-shadow: var(--sl-shadow-xl);
        border: 1px solid var(--sl-color-border);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        animation: sl-modal-in 200ms cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes sl-modal-in {
        from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }

      .modal-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        padding: var(--sl-spacing-xl);
        border-bottom: 1px solid var(--sl-color-border);
        flex-shrink: 0;
        gap: var(--sl-spacing-md);
      }

      .modal-title-area {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-md);
      }

      .modal-icon {
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        border-radius: var(--sl-radius-lg);
        background: var(--sl-color-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
      }

      .modal-title-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .modal-title {
        font-size: var(--sl-font-size-lg);
        font-weight: 700;
        color: var(--sl-color-text);
        line-height: 1.2;
      }

      .modal-subtitle {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
      }

      .close-btn {
        width: 32px;
        height: 32px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--sl-radius-md);
        color: var(--sl-color-text-muted);
        transition: all var(--sl-transition-fast);
        margin-top: 2px;
      }

      .close-btn:hover {
        background: var(--sl-color-surface-raised);
        color: var(--sl-color-text);
      }

      .modal-body {
        flex: 1;
        overflow-y: auto;
        padding: var(--sl-spacing-xl);
      }

      .scheme-list {
        display: flex;
        flex-direction: column;
        gap: var(--sl-spacing-md);
      }

      .scheme-card {
        border: 1px solid var(--sl-color-border);
        border-left: 3px solid var(--sl-color-primary);
        border-radius: var(--sl-radius-lg);
        background: var(--sl-color-bg-subtle);
        overflow: hidden;
        transition: border-color var(--sl-transition-fast);
      }

      .scheme-card:focus-within {
        border-color: var(--sl-color-primary);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }

      .scheme-card-inner {
        padding: var(--sl-spacing-md) var(--sl-spacing-lg);
        display: flex;
        flex-direction: column;
        gap: var(--sl-spacing-sm);
      }

      .scheme-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--sl-spacing-sm);
      }

      .scheme-name {
        font-size: var(--sl-font-size-sm);
        font-weight: 700;
        color: var(--sl-color-text);
      }

      .scheme-badge {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        padding: 2px 8px;
        border-radius: var(--sl-radius-full);
        background: rgba(99, 102, 241, 0.1);
        color: var(--sl-color-primary);
        white-space: nowrap;
      }

      .scheme-meta {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .scheme-meta code {
        font-family: var(--sl-font-mono);
        background: var(--sl-color-surface-raised);
        padding: 1px 5px;
        border-radius: 3px;
        color: var(--sl-color-text-secondary);
      }

      .scheme-desc {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
        line-height: 1.6;
        border-top: 1px solid var(--sl-color-border);
        padding-top: var(--sl-spacing-sm);
      }

      .scheme-desc p {
        margin: 0 0 var(--sl-spacing-xs) 0;
      }

      .scheme-desc p:last-child {
        margin-bottom: 0;
      }

      .scheme-desc code {
        background: var(--sl-color-surface-raised);
        padding: 1px 5px;
        border-radius: 3px;
        font-size: 0.85em;
        font-family: var(--sl-font-mono);
      }

      .scheme-desc a {
        color: var(--sl-color-primary);
        text-decoration: none;
      }

      .scheme-desc a:hover {
        text-decoration: underline;
      }

      .input-row {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-sm);
        border-top: 1px solid var(--sl-color-border);
        padding-top: var(--sl-spacing-sm);
      }

      .input-label {
        font-size: var(--sl-font-size-xs);
        font-weight: 600;
        color: var(--sl-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        min-width: 46px;
      }

      .input-wrapper {
        flex: 1;
        position: relative;
        display: flex;
        align-items: center;
      }

      input[type="text"],
      input[type="password"] {
        width: 100%;
        padding: 8px 40px 8px 12px;
        border: 1.5px solid var(--sl-color-border);
        border-radius: var(--sl-radius-md);
        background: var(--sl-color-bg);
        color: var(--sl-color-text);
        font-family: var(--sl-font-mono);
        font-size: var(--sl-font-size-sm);
        outline: none;
        transition: border-color var(--sl-transition-fast), box-shadow var(--sl-transition-fast);
      }

      input:focus {
        border-color: var(--sl-color-primary);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
      }

      input::placeholder {
        color: var(--sl-color-text-muted);
        font-family: var(--sl-font-family);
        font-style: italic;
      }

      .toggle-visibility {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--sl-radius-sm);
        color: var(--sl-color-text-muted);
        transition: all var(--sl-transition-fast);
      }

      .toggle-visibility:hover {
        background: var(--sl-color-surface-raised);
        color: var(--sl-color-text);
      }

      .unsupported-card {
        padding: var(--sl-spacing-md) var(--sl-spacing-lg);
        border: 1px dashed var(--sl-color-border);
        border-radius: var(--sl-radius-lg);
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--sl-spacing-md);
      }

      .unsupported-name {
        font-size: var(--sl-font-size-sm);
        font-weight: 600;
        color: var(--sl-color-text);
      }

      .unsupported-type {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
        margin-top: 2px;
      }

      .unsupported-badge {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        padding: 2px 8px;
        border-radius: var(--sl-radius-full);
        background: var(--sl-color-surface-raised);
        color: var(--sl-color-text-muted);
        white-space: nowrap;
        flex-shrink: 0;
      }

      .modal-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--sl-spacing-sm);
        padding: var(--sl-spacing-md) var(--sl-spacing-xl);
        border-top: 1px solid var(--sl-color-border);
        background: var(--sl-color-bg-subtle);
        flex-shrink: 0;
      }

      .footer-info {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
      }

      .footer-actions {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-sm);
      }

      .btn-secondary {
        padding: 7px 16px;
        border-radius: var(--sl-radius-md);
        font-size: var(--sl-font-size-sm);
        font-weight: 500;
        color: var(--sl-color-text-secondary);
        border: 1px solid var(--sl-color-border);
        transition: all var(--sl-transition-fast);
      }

      .btn-secondary:hover {
        background: var(--sl-color-surface-raised);
        color: var(--sl-color-text);
        border-color: var(--sl-color-border-hover);
      }

      .btn-primary {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 7px 18px;
        border-radius: var(--sl-radius-md);
        font-size: var(--sl-font-size-sm);
        font-weight: 600;
        color: var(--sl-color-primary-text);
        background: var(--sl-color-primary);
        transition: all var(--sl-transition-fast);
        box-shadow: 0 1px 3px rgba(99, 102, 241, 0.3);
      }

      .btn-primary:hover {
        background: var(--sl-color-primary-hover);
        box-shadow: 0 2px 6px rgba(99, 102, 241, 0.4);
      }
    `,
  ];

  @property({ type: Array }) securitySchemes: SecurityScheme[] = [];
  @property({ type: Object }) authState: AuthState = { apiKeys: {}, bearerTokens: {} };

  @state() private _localState: AuthState = { apiKeys: {}, bearerTokens: {} };
  @state() private _showTokens = new Set<string>();

  override willUpdate(): void {
    if (Object.keys(this._localState.apiKeys).length === 0 &&
        Object.keys(this._localState.bearerTokens).length === 0) {
      this._localState = { ...this.authState };
    }
  }

  private _updateApiKey(schemeName: string, value: string) {
    this._localState = {
      ...this._localState,
      apiKeys: { ...this._localState.apiKeys, [schemeName]: value },
    };
    this._emit();
  }

  private _updateBearerToken(schemeName: string, value: string) {
    this._localState = {
      ...this._localState,
      bearerTokens: { ...this._localState.bearerTokens, [schemeName]: value },
    };
    this._emit();
  }

  private _emit() {
    this.dispatchEvent(new CustomEvent('auth-update', { detail: this._localState }));
  }

  private _toggleShow(key: string) {
    const next = new Set(this._showTokens);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    this._showTokens = next;
  }

  private _close() {
    this.dispatchEvent(new CustomEvent('close-auth'));
  }

  private _renderScheme(scheme: SecurityScheme) {
    const eyeIcon = (visible: boolean) => html`
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        ${visible
          ? html`<path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/>`
          : html`<path d="M1 1l14 14M6.7 6.7A2 2 0 0010.3 10.3M3.4 3.4A7 7 0 001 8s2.5 5 7 5a7 7 0 003.6-1"/><path d="M8 3c4.4 0 7 5 7 5a12.8 12.8 0 01-1.7 2.3"/>`}
      </svg>
    `;

    if (scheme.type === 'apiKey') {
      const visible = this._showTokens.has(scheme.key);
      return html`
        <div class="scheme-card">
          <div class="scheme-card-inner">
            <div class="scheme-header">
              <span class="scheme-name">${scheme.key}</span>
              <span class="scheme-badge">API Key</span>
            </div>
            <div class="scheme-meta">
              In <code>${scheme.in}</code> as <code>${scheme.name}</code>
            </div>
            <div class="scheme-desc" .innerHTML=${marked.parse(scheme.description || 'Enter your API key to authenticate requests.') as string}></div>
            <div class="input-row">
              <span class="input-label">Value</span>
              <div class="input-wrapper">
                <input
                  type="${visible ? 'text' : 'password'}"
                  placeholder="Enter API key…"
                  .value=${this._localState.apiKeys[scheme.key] ?? ''}
                  @input=${(e: Event) => this._updateApiKey(scheme.key, (e.target as HTMLInputElement).value)}
                />
                <button class="toggle-visibility" @click=${() => this._toggleShow(scheme.key)} title="${visible ? 'Hide' : 'Show'} value">
                  ${eyeIcon(visible)}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (scheme.type === 'http' && (scheme.scheme === 'bearer' || scheme.scheme === 'basic')) {
      const visible = this._showTokens.has(scheme.key);
      const badgeLabel = scheme.scheme === 'bearer' ? 'Bearer Token' : 'Basic Auth';
      const metaLabel = scheme.scheme === 'bearer'
        ? html`HTTP Bearer${scheme.bearerFormat ? html` · <code>${scheme.bearerFormat}</code>` : null}`
        : html`HTTP Basic <code>username:password</code>`;

      return html`
        <div class="scheme-card">
          <div class="scheme-card-inner">
            <div class="scheme-header">
              <span class="scheme-name">${scheme.key}</span>
              <span class="scheme-badge">${badgeLabel}</span>
            </div>
            <div class="scheme-meta">${metaLabel}</div>
            <div class="scheme-desc" .innerHTML=${marked.parse(scheme.description || 'Enter your bearer token to authenticate requests.') as string}></div>
            <div class="input-row">
              <span class="input-label">Token</span>
              <div class="input-wrapper">
                <input
                  type="${visible ? 'text' : 'password'}"
                  placeholder="Enter token…"
                  .value=${this._localState.bearerTokens[scheme.key] ?? ''}
                  @input=${(e: Event) => this._updateBearerToken(scheme.key, (e.target as HTMLInputElement).value)}
                />
                <button class="toggle-visibility" @click=${() => this._toggleShow(scheme.key)} title="${visible ? 'Hide' : 'Show'} token">
                  ${eyeIcon(visible)}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return html`
      <div class="unsupported-card">
        <div>
          <div class="unsupported-name">${scheme.key}</div>
          <div class="unsupported-type">${scheme.description ?? 'No description'}</div>
        </div>
        <span class="unsupported-badge">${scheme.type} — not supported</span>
      </div>
    `;
  }

  override render() {
    const schemeCount = this.securitySchemes.length;
    return html`
      <div class="overlay" @click=${this._close}></div>
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title-area">
            <div class="modal-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="9" width="12" height="9" rx="2"/>
                <path d="M7 9V7a3 3 0 016 0v2"/>
                <circle cx="10" cy="14" r="1.2" fill="currentColor" stroke="none"/>
              </svg>
            </div>
            <div class="modal-title-text">
              <span class="modal-title">Authorization</span>
              <span class="modal-subtitle">${schemeCount} security scheme${schemeCount !== 1 ? 's' : ''} configured</span>
            </div>
          </div>
          <button class="close-btn" @click=${this._close} title="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M4 4l8 8M12 4l-8 8"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="scheme-list">
            ${this.securitySchemes.map(s => this._renderScheme(s))}
          </div>
        </div>
        <div class="modal-footer">
          <span class="footer-info">Credentials are stored in memory only</span>
          <div class="footer-actions">
            <button class="btn-secondary" @click=${this._close}>Cancel</button>
            <button class="btn-primary" @click=${this._close}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 8l4 4 6-6"/>
              </svg>
              Save &amp; Close
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
