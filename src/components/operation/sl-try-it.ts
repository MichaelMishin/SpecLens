import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { resetStyles } from '../../styles/reset.css.js';
import type { ParsedOperation, ParsedServer, SecurityScheme, AuthState } from '../../core/types.js';
import { sample as sampleFromSchema } from 'openapi-sampler';

interface TryItResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
}

@customElement('sl-try-it')
export class SlTryIt extends LitElement {
  static override styles = [
    resetStyles,
    css`
      :host {
        display: block;
      }

      .try-it {
        border: 1px solid var(--sl-color-border);
        border-radius: var(--sl-radius-md);
        overflow: hidden;
      }

      .form-section {
        padding: var(--sl-spacing-md) var(--sl-spacing-lg);
      }

      .form-section + .form-section {
        border-top: 1px solid var(--sl-color-border);
      }

      .form-label {
        font-size: var(--sl-font-size-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--sl-color-text-muted);
        margin-bottom: var(--sl-spacing-sm);
      }

      .param-input-row {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-sm);
        margin-bottom: var(--sl-spacing-sm);
      }

      .param-input-row:last-child {
        margin-bottom: 0;
      }

      .param-input-name {
        font-family: var(--sl-font-mono);
        font-size: var(--sl-font-size-sm);
        color: var(--sl-color-text);
        min-width: 120px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .param-input-name .req {
        color: var(--sl-color-badge-required);
      }

      input[type="text"],
      select {
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

      input:focus, select:focus {
        border-color: var(--sl-color-primary);
      }

      input::placeholder {
        color: var(--sl-color-text-muted);
      }

      textarea {
        width: 100%;
        min-height: 120px;
        padding: var(--sl-spacing-sm);
        border: 1px solid var(--sl-color-border);
        border-radius: var(--sl-radius-sm);
        background: var(--sl-color-code-bg);
        color: var(--sl-color-code-text);
        font-family: var(--sl-font-mono);
        font-size: var(--sl-font-size-sm);
        line-height: 1.6;
        resize: vertical;
        outline: none;
        transition: border-color var(--sl-transition-fast);
      }

      textarea:focus {
        border-color: var(--sl-color-primary);
      }

      .actions-bar {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-sm);
        padding: var(--sl-spacing-md) var(--sl-spacing-lg);
        border-top: 1px solid var(--sl-color-border);
        background: var(--sl-color-bg-subtle);
      }

      .send-btn {
        padding: 8px 20px;
        border-radius: var(--sl-radius-md);
        background: var(--sl-color-primary);
        color: var(--sl-color-primary-text);
        font-weight: 600;
        font-size: var(--sl-font-size-sm);
        transition: background var(--sl-transition-fast);
      }

      .send-btn:hover {
        background: var(--sl-color-primary-hover);
      }

      .send-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .server-select {
        flex: 1;
        max-width: 400px;
      }

      /* Response */
      .response-section {
        border-top: 1px solid var(--sl-color-border);
      }

      .response-header {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-md);
        padding: var(--sl-spacing-md) var(--sl-spacing-lg);
        background: var(--sl-color-bg-subtle);
      }

      .status-badge {
        font-family: var(--sl-font-mono);
        font-weight: 700;
        font-size: var(--sl-font-size-sm);
        padding: 2px 10px;
        border-radius: var(--sl-radius-sm);
      }

      .status-2xx { background: rgba(16,185,129,0.1); color: var(--sl-color-success); }
      .status-3xx { background: rgba(59,130,246,0.1); color: var(--sl-color-info); }
      .status-4xx { background: rgba(245,158,11,0.1); color: var(--sl-color-warning); }
      .status-5xx { background: rgba(239,68,68,0.1); color: var(--sl-color-danger); }

      .response-time {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
        margin-left: auto;
      }

      .response-body {
        padding: var(--sl-spacing-md) var(--sl-spacing-lg);
      }

      .response-body pre {
        background: var(--sl-color-code-bg);
        border: 1px solid var(--sl-color-border);
        border-radius: var(--sl-radius-sm);
        padding: var(--sl-spacing-md);
        font-size: var(--sl-font-size-sm);
        color: var(--sl-color-code-text);
        overflow-x: auto;
        line-height: 1.6;
        max-height: 400px;
        overflow-y: auto;
      }

      .response-headers {
        padding: 0 var(--sl-spacing-lg) var(--sl-spacing-md);
      }

      .response-headers-title {
        font-size: var(--sl-font-size-xs);
        font-weight: 600;
        color: var(--sl-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: var(--sl-spacing-xs);
        cursor: pointer;
      }

      .response-headers pre {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
        background: var(--sl-color-code-bg);
        border: 1px solid var(--sl-color-border);
        border-radius: var(--sl-radius-sm);
        padding: var(--sl-spacing-sm);
      }

      .error-msg {
        padding: var(--sl-spacing-md) var(--sl-spacing-lg);
        color: var(--sl-color-danger);
        font-size: var(--sl-font-size-sm);
      }

      .error-msg .cors-hint {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
        margin-top: var(--sl-spacing-xs);
      }

      .loading-bar {
        height: 2px;
        background: var(--sl-color-primary);
        animation: sl-loading-pulse 1.5s ease infinite;
      }

      @keyframes sl-loading-pulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
    `,
  ];

  @property({ type: Object }) operation!: ParsedOperation;
  @property({ type: Array }) servers: ParsedServer[] = [];
  @property({ type: Array }) securitySchemes: SecurityScheme[] = [];
  @property({ type: Object }) authState: AuthState = { apiKeys: {}, bearerTokens: {} };
  @property({ type: String }) proxyUrl = '';

  @state() private _paramValues: Record<string, string> = {};
  @state() private _bodyValue = '';
  @state() private _selectedServer = 0;
  @state() private _response: TryItResponse | null = null;
  @state() private _loading = false;
  @state() private _error: string | null = null;
  @state() private _showResponseHeaders = false;
  @state() private _initialized = false;

  override willUpdate() {
    if (!this._initialized && this.operation) {
      this._initDefaults();
      this._initialized = true;
    }
  }

  private _initDefaults() {
    const defaults: Record<string, string> = {};
    for (const p of this.operation.parameters) {
      if (p.example !== undefined) {
        defaults[`${p.in}:${p.name}`] = String(p.example);
      }
    }
    this._paramValues = defaults;

    // Pre-fill body
    if (this.operation.requestBody) {
      const content = this.operation.requestBody.content[0];
      if (content?.schema) {
        try {
          const sample = sampleFromSchema(content.schema as Record<string, unknown>);
          this._bodyValue = JSON.stringify(sample, null, 2);
        } catch {
          this._bodyValue = '{}';
        }
      }
    }
  }

  private _buildUrl(): string {
    const serverObjs = this.operation.servers.length > 0 ? this.operation.servers : this.servers;
    const server = serverObjs[this._selectedServer] ?? serverObjs[0];
    if (!server) return this.operation.path;

    let baseUrl = server.url.replace(/\/+$/, '');
    // Replace server variables with defaults
    for (const [key, val] of Object.entries(server.variables)) {
      baseUrl = baseUrl.replace(`{${key}}`, val.default);
    }

    // Replace path params
    let path = this.operation.path;
    for (const p of this.operation.parameters.filter(p => p.in === 'path')) {
      const value = this._paramValues[`path:${p.name}`] ?? '';
      path = path.replace(`{${p.name}}`, encodeURIComponent(value));
    }

    // Query params
    const queryParams = this.operation.parameters
      .filter(p => p.in === 'query')
      .map(p => {
        const value = this._paramValues[`query:${p.name}`];
        return value ? `${encodeURIComponent(p.name)}=${encodeURIComponent(value)}` : null;
      })
      .filter(Boolean);

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return `${baseUrl}${path}${queryString}`;
  }

  private _buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // Header params
    for (const p of this.operation.parameters.filter(p => p.in === 'header')) {
      const value = this._paramValues[`header:${p.name}`];
      if (value) headers[p.name] = value;
    }

    // Auth
    for (const secReq of this.operation.security) {
      for (const schemeName of Object.keys(secReq)) {
        const scheme = this.securitySchemes.find(s => s.key === schemeName);
        if (!scheme) continue;

        if (scheme.type === 'apiKey' && scheme.in === 'header' && scheme.name) {
          const val = this.authState.apiKeys[schemeName];
          if (val) headers[scheme.name] = val;
        }
        if (scheme.type === 'http') {
          const val = this.authState.bearerTokens[schemeName];
          if (val) {
            if (scheme.scheme === 'bearer') {
              headers['Authorization'] = `Bearer ${val}`;
            } else if (scheme.scheme === 'basic') {
              headers['Authorization'] = `Basic ${btoa(val)}`;
            }
          }
        }
      }
    }

    // Content-Type for body
    if (this.operation.requestBody) {
      const content = this.operation.requestBody.content[0];
      if (content) {
        headers['Content-Type'] = content.mediaType;
      }
    }

    return headers;
  }

  private async _send() {
    this._loading = true;
    this._error = null;
    this._response = null;

    const url = this._buildUrl();
    const headers = this._buildHeaders();
    const hasBody = this.operation.requestBody && ['post', 'put', 'patch'].includes(this.operation.method);

    const targetUrl = this.proxyUrl ? `${this.proxyUrl}${encodeURIComponent(url)}` : url;

    const start = performance.now();

    try {
      const resp = await fetch(targetUrl, {
        method: this.operation.method.toUpperCase(),
        headers,
        body: hasBody ? this._bodyValue : undefined,
      });

      const time = Math.round(performance.now() - start);
      const body = await resp.text();

      const respHeaders: Record<string, string> = {};
      resp.headers.forEach((v, k) => { respHeaders[k] = v; });

      this._response = {
        status: resp.status,
        statusText: resp.statusText,
        headers: respHeaders,
        body,
        time,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._error = msg;
    } finally {
      this._loading = false;
    }
  }

  private _getStatusClass(status: number): string {
    if (status < 300) return 'status-2xx';
    if (status < 400) return 'status-3xx';
    if (status < 500) return 'status-4xx';
    return 'status-5xx';
  }

  private _formatBody(body: string): string {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }

  override render() {
    if (!this.operation) return html``;

    const pathParams = this.operation.parameters.filter(p => p.in === 'path');
    const queryParams = this.operation.parameters.filter(p => p.in === 'query');
    const headerParams = this.operation.parameters.filter(p => p.in === 'header');
    const serverObjs = this.operation.servers.length > 0 ? this.operation.servers : this.servers;

    return html`
      <div class="try-it">
        ${pathParams.length > 0 ? html`
          <div class="form-section">
            <div class="form-label">Path Parameters</div>
            ${pathParams.map(p => html`
              <div class="param-input-row">
                <div class="param-input-name">${p.name} ${p.required ? html`<span class="req">*</span>` : null}</div>
                <input
                  type="text"
                  placeholder="${p.example ?? p.name}"
                  .value=${this._paramValues[`path:${p.name}`] ?? ''}
                  @input=${(e: Event) => { this._paramValues = { ...this._paramValues, [`path:${p.name}`]: (e.target as HTMLInputElement).value }; }}
                />
              </div>
            `)}
          </div>
        ` : null}

        ${queryParams.length > 0 ? html`
          <div class="form-section">
            <div class="form-label">Query Parameters</div>
            ${queryParams.map(p => html`
              <div class="param-input-row">
                <div class="param-input-name">${p.name} ${p.required ? html`<span class="req">*</span>` : null}</div>
                <input
                  type="text"
                  placeholder="${p.example ?? ''}"
                  .value=${this._paramValues[`query:${p.name}`] ?? ''}
                  @input=${(e: Event) => { this._paramValues = { ...this._paramValues, [`query:${p.name}`]: (e.target as HTMLInputElement).value }; }}
                />
              </div>
            `)}
          </div>
        ` : null}

        ${headerParams.length > 0 ? html`
          <div class="form-section">
            <div class="form-label">Header Parameters</div>
            ${headerParams.map(p => html`
              <div class="param-input-row">
                <div class="param-input-name">${p.name}</div>
                <input
                  type="text"
                  placeholder="${p.example ?? ''}"
                  .value=${this._paramValues[`header:${p.name}`] ?? ''}
                  @input=${(e: Event) => { this._paramValues = { ...this._paramValues, [`header:${p.name}`]: (e.target as HTMLInputElement).value }; }}
                />
              </div>
            `)}
          </div>
        ` : null}

        ${this.operation.requestBody ? html`
          <div class="form-section">
            <div class="form-label">Request Body</div>
            <textarea
              .value=${this._bodyValue}
              @input=${(e: Event) => { this._bodyValue = (e.target as HTMLTextAreaElement).value; }}
            ></textarea>
          </div>
        ` : null}

        <div class="actions-bar">
          ${serverObjs.length > 1 ? html`
            <select class="server-select" @change=${(e: Event) => { this._selectedServer = (e.target as HTMLSelectElement).selectedIndex; }}>
              ${serverObjs.map(s => html`<option>${s.url}${s.description ? ` — ${s.description}` : ''}</option>`)}
            </select>
          ` : null}
          <button class="send-btn" @click=${this._send} ?disabled=${this._loading}>
            ${this._loading ? 'Sending…' : 'Send Request'}
          </button>
        </div>

        ${this._loading ? html`<div class="loading-bar"></div>` : null}

        ${this._error ? html`
          <div class="error-msg">
            ${this._error}
            <div class="cors-hint">
              If this is a CORS error, the API server may need to allow cross-origin requests,
              or you can configure a <code>proxyUrl</code> in SpecLens.
            </div>
          </div>
        ` : null}

        ${this._response ? html`
          <div class="response-section">
            <div class="response-header">
              <span class="status-badge ${this._getStatusClass(this._response.status)}">
                ${this._response.status} ${this._response.statusText}
              </span>
              <span class="response-time">${this._response.time}ms</span>
            </div>
            <div class="response-body">
              <pre><code>${this._formatBody(this._response.body)}</code></pre>
            </div>
            <div class="response-headers">
              <div class="response-headers-title" @click=${() => this._showResponseHeaders = !this._showResponseHeaders}>
                Headers ${this._showResponseHeaders ? '▾' : '▸'}
              </div>
              ${this._showResponseHeaders ? html`
                <pre>${Object.entries(this._response.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}</pre>
              ` : null}
            </div>
          </div>
        ` : null}
      </div>
    `;
  }
}
