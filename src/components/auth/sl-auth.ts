import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { resetStyles } from '../../styles/reset.css.js';
import type { SecurityScheme, AuthState } from '../../core/types.js';

@customElement('sl-auth')
export class SlAuth extends LitElement {
  static override styles = [
    resetStyles,
    css`
      :host {
        display: block;
        border-bottom: 1px solid var(--sl-color-border);
        background: var(--sl-color-bg-subtle);
      }

      .auth-panel {
        max-width: 960px;
        margin: 0 auto;
        padding: var(--sl-spacing-lg) var(--sl-spacing-2xl);
      }

      .auth-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--sl-spacing-md);
      }

      .auth-title {
        font-size: var(--sl-font-size-md);
        font-weight: 600;
        color: var(--sl-color-text);
      }

      .close-btn {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--sl-radius-md);
        color: var(--sl-color-text-muted);
        transition: all var(--sl-transition-fast);
      }

      .close-btn:hover {
        background: var(--sl-color-surface-raised);
        color: var(--sl-color-text);
      }

      .scheme-list {
        display: flex;
        flex-direction: column;
        gap: var(--sl-spacing-md);
      }

      .scheme-card {
        padding: var(--sl-spacing-md) var(--sl-spacing-lg);
        border: 1px solid var(--sl-color-border);
        border-radius: var(--sl-radius-md);
        background: var(--sl-color-surface);
      }

      .scheme-name {
        font-size: var(--sl-font-size-sm);
        font-weight: 600;
        color: var(--sl-color-text);
        margin-bottom: var(--sl-spacing-xs);
      }

      .scheme-type {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
        margin-bottom: var(--sl-spacing-sm);
      }

      .scheme-desc {
        font-size: var(--sl-font-size-sm);
        color: var(--sl-color-text-secondary);
        margin-bottom: var(--sl-spacing-sm);
      }

      .input-group {
        display: flex;
        gap: var(--sl-spacing-sm);
        align-items: center;
      }

      .input-label {
        font-size: var(--sl-font-size-xs);
        font-weight: 500;
        color: var(--sl-color-text-muted);
        min-width: 60px;
      }

      input[type="text"],
      input[type="password"] {
        flex: 1;
        padding: 6px 10px;
        border: 1px solid var(--sl-color-border);
        border-radius: var(--sl-radius-sm);
        background: var(--sl-color-bg);
        color: var(--sl-color-text);
        font-family: var(--sl-font-mono);
        font-size: var(--sl-font-size-sm);
        outline: none;
        transition: border-color var(--sl-transition-fast);
      }

      input:focus {
        border-color: var(--sl-color-primary);
      }

      input::placeholder {
        color: var(--sl-color-text-muted);
      }
    `,
  ];

  @property({ type: Array }) securitySchemes: SecurityScheme[] = [];
  @property({ type: Object }) authState: AuthState = { apiKeys: {}, bearerTokens: {} };

  @state() private _localState: AuthState = { apiKeys: {}, bearerTokens: {} };

  override willUpdate(): void {
    // Sync external state to local on first render
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

  private _renderScheme(scheme: SecurityScheme) {
    if (scheme.type === 'apiKey') {
      return html`
        <div class="scheme-card">
          <div class="scheme-name">${scheme.key}</div>
          <div class="scheme-type">API Key (${scheme.in}: ${scheme.name})</div>
          ${scheme.description ? html`<div class="scheme-desc">${scheme.description}</div>` : null}
          <div class="input-group">
            <span class="input-label">Value</span>
            <input
              type="password"
              placeholder="Enter API key…"
              .value=${this._localState.apiKeys[scheme.key] ?? ''}
              @input=${(e: Event) => this._updateApiKey(scheme.key, (e.target as HTMLInputElement).value)}
            />
          </div>
        </div>
      `;
    }

    if (scheme.type === 'http' && (scheme.scheme === 'bearer' || scheme.scheme === 'basic')) {
      const label = scheme.scheme === 'bearer'
        ? `Bearer${scheme.bearerFormat ? ` (${scheme.bearerFormat})` : ''}`
        : 'Basic (username:password)';

      return html`
        <div class="scheme-card">
          <div class="scheme-name">${scheme.key}</div>
          <div class="scheme-type">HTTP ${label}</div>
          ${scheme.description ? html`<div class="scheme-desc">${scheme.description}</div>` : null}
          <div class="input-group">
            <span class="input-label">Token</span>
            <input
              type="password"
              placeholder="Enter token…"
              .value=${this._localState.bearerTokens[scheme.key] ?? ''}
              @input=${(e: Event) => this._updateBearerToken(scheme.key, (e.target as HTMLInputElement).value)}
            />
          </div>
        </div>
      `;
    }

    // Unsupported scheme type
    return html`
      <div class="scheme-card">
        <div class="scheme-name">${scheme.key}</div>
        <div class="scheme-type">${scheme.type} — not supported in Try It</div>
        ${scheme.description ? html`<div class="scheme-desc">${scheme.description}</div>` : null}
      </div>
    `;
  }

  override render() {
    return html`
      <div class="auth-panel">
        <div class="auth-header">
          <span class="auth-title">Authentication</span>
          <button class="close-btn" @click=${() => this.dispatchEvent(new CustomEvent('close-auth'))}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="scheme-list">
          ${this.securitySchemes.map(s => this._renderScheme(s))}
        </div>
      </div>
    `;
  }
}
