import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { resetStyles } from '../../styles/reset.css.js';
import type { ParsedOperation, ParsedServer, SecurityScheme, AuthState } from '../../core/types.js';
import { HTTPSnippet, type HarRequest } from 'httpsnippet-lite';
import { sample as sampleFromSchema } from 'openapi-sampler';

interface LanguageOption {
  id: string;
  label: string;
  target: string;
  client: string;
}

const LANGUAGES: LanguageOption[] = [
  { id: 'curl', label: 'cURL', target: 'shell', client: 'curl' },
  { id: 'javascript', label: 'JavaScript', target: 'javascript', client: 'fetch' },
  { id: 'python', label: 'Python', target: 'python', client: 'requests' },
  { id: 'node', label: 'Node.js', target: 'node', client: 'fetch' },
  { id: 'go', label: 'Go', target: 'go', client: 'native' },
  { id: 'java', label: 'Java', target: 'java', client: 'okhttp' },
  { id: 'php', label: 'PHP', target: 'php', client: 'guzzle' },
  { id: 'ruby', label: 'Ruby', target: 'ruby', client: 'native' },
  { id: 'csharp', label: 'C#', target: 'csharp', client: 'httpclient' },
];

@customElement('sl-code-samples')
export class SlCodeSamples extends LitElement {
  static override styles = [
    resetStyles,
    css`
      :host {
        display: block;
      }

      .code-samples {
        border: 1px solid var(--sl-color-border);
        border-radius: var(--sl-radius-md);
        overflow: hidden;
      }

      .tabs {
        display: flex;
        gap: 0;
        border-bottom: 1px solid var(--sl-color-border);
        background: var(--sl-color-surface-raised);
        overflow-x: auto;
        scrollbar-width: none;
      }

      .tabs::-webkit-scrollbar {
        display: none;
      }

      .tab {
        padding: var(--sl-spacing-sm) var(--sl-spacing-md);
        font-size: var(--sl-font-size-xs);
        font-weight: 500;
        color: var(--sl-color-text-muted);
        white-space: nowrap;
        border-bottom: 2px solid transparent;
        transition: all var(--sl-transition-fast);
      }

      .tab:hover {
        color: var(--sl-color-text);
      }

      .tab.active {
        color: var(--sl-color-primary);
        border-bottom-color: var(--sl-color-primary);
      }

      .tab.spec-sample {
        border-left: 1px solid var(--sl-color-border);
      }

      .code-wrapper {
        position: relative;
      }

      .copy-btn {
        position: absolute;
        top: var(--sl-spacing-sm);
        right: var(--sl-spacing-sm);
        padding: 4px 10px;
        border-radius: var(--sl-radius-sm);
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
        background: var(--sl-color-surface-raised);
        border: 1px solid var(--sl-color-border);
        transition: all var(--sl-transition-fast);
        z-index: 1;
      }

      .copy-btn:hover {
        color: var(--sl-color-text);
        background: var(--sl-color-surface);
      }

      .copy-btn.copied {
        color: var(--sl-color-success);
      }

      pre {
        padding: var(--sl-spacing-md);
        padding-right: 80px;
        font-size: var(--sl-font-size-sm);
        color: var(--sl-color-code-text);
        background: var(--sl-color-code-bg);
        overflow-x: auto;
        line-height: 1.6;
        max-height: 400px;
        overflow-y: auto;
      }

      /* Basic syntax highlighting */
      .token-string { color: #22863a; }
      .token-keyword { color: #d73a49; }
      .token-comment { color: #6a737d; }
      .token-number { color: #005cc5; }

      :host-context([data-theme="dark"]) .token-string,
      :host-context(.sl-root[data-theme="dark"]) .token-string { color: #85e89d; }
      :host-context([data-theme="dark"]) .token-keyword,
      :host-context(.sl-root[data-theme="dark"]) .token-keyword { color: #f97583; }
      :host-context([data-theme="dark"]) .token-comment,
      :host-context(.sl-root[data-theme="dark"]) .token-comment { color: #6a737d; }
      :host-context([data-theme="dark"]) .token-number,
      :host-context(.sl-root[data-theme="dark"]) .token-number { color: #79b8ff; }
    `,
  ];

  @property({ type: Object }) operation!: ParsedOperation;
  @property({ type: Array }) servers: ParsedServer[] = [];
  @property({ type: Object }) authState: AuthState = { apiKeys: {}, bearerTokens: {} };
  @property({ type: Array }) securitySchemes: SecurityScheme[] = [];

  @state() private _activeTab = 0;
  @state() private _snippets = new Map<string, string>();
  @state() private _copied = false;

  private _allTabs: { id: string; label: string; isSpec: boolean }[] = [];

  override async willUpdate() {
    if (!this.operation) return;

    // Build tab list: generated langs + spec samples
    this._allTabs = [
      ...LANGUAGES.map(l => ({ id: l.id, label: l.label, isSpec: false })),
      ...this.operation.codeSamples.map(s => ({ id: `spec:${s.lang}`, label: s.label, isSpec: true })),
    ];

    // Generate snippets if not cached
    if (this._snippets.size === 0) {
      await this._generateSnippets();
    }
  }

  private async _generateSnippets() {
    const har = this._buildHar();
    const snippets = new Map<string, string>();

    // Add spec code samples
    for (const sample of this.operation.codeSamples) {
      snippets.set(`spec:${sample.lang}`, sample.source);
    }

    try {
      const snippet = new HTTPSnippet(har);

      for (const lang of LANGUAGES) {
        try {
          const output = await snippet.convert(lang.target as any, lang.client);
          if (output && typeof output === 'string') {
            snippets.set(lang.id, output);
          } else if (Array.isArray(output) && output.length > 0) {
            snippets.set(lang.id, output[0]);
          }
        } catch {
          snippets.set(lang.id, `// Failed to generate ${lang.label} snippet`);
        }
      }
    } catch {
      for (const lang of LANGUAGES) {
        snippets.set(lang.id, `// Failed to generate snippet`);
      }
    }

    this._snippets = snippets;
  }

  private _buildHar(): HarRequest {
    const serverObjs = this.operation.servers.length > 0 ? this.operation.servers : this.servers;
    const server = serverObjs[0];
    let baseUrl = server?.url ?? '';

    // Replace server variables
    if (server) {
      for (const [key, val] of Object.entries(server.variables)) {
        baseUrl = baseUrl.replace(`{${key}}`, val.default);
      }
    }

    // Build path with example values
    let path = this.operation.path;
    for (const p of this.operation.parameters.filter(p => p.in === 'path')) {
      const value = p.example !== undefined ? String(p.example) : `{${p.name}}`;
      path = path.replace(`{${p.name}}`, value);
    }

    const url = `${baseUrl}${path}`;

    // Query params
    const queryString = this.operation.parameters
      .filter(p => p.in === 'query' && p.example !== undefined)
      .map(p => ({ name: p.name, value: String(p.example) }));

    // Headers
    const headers: Array<{ name: string; value: string }> = [];

    // Auth headers
    for (const secReq of this.operation.security) {
      for (const schemeName of Object.keys(secReq)) {
        const scheme = this.securitySchemes.find(s => s.key === schemeName);
        if (!scheme) continue;

        if (scheme.type === 'apiKey' && scheme.in === 'header' && scheme.name) {
          const val = this.authState.apiKeys[schemeName];
          if (val) headers.push({ name: scheme.name, value: val });
        }
        if (scheme.type === 'http' && scheme.scheme === 'bearer') {
          const val = this.authState.bearerTokens[schemeName];
          if (val) headers.push({ name: 'Authorization', value: `Bearer ${val}` });
        }
      }
    }

    // Header params
    for (const p of this.operation.parameters.filter(p => p.in === 'header')) {
      if (p.example !== undefined) {
        headers.push({ name: p.name, value: String(p.example) });
      }
    }

    // Request body
    let postData: HarRequest['postData'] = undefined;
    if (this.operation.requestBody) {
      const content = this.operation.requestBody.content[0];
      if (content) {
        headers.push({ name: 'Content-Type', value: content.mediaType });
        let bodyText = '{}';
        if (content.example) {
          bodyText = JSON.stringify(content.example);
        } else if (content.schema) {
          try {
            bodyText = JSON.stringify(sampleFromSchema(content.schema as Record<string, unknown>));
          } catch { /* ignore */ }
        }
        postData = {
          mimeType: content.mediaType,
          text: bodyText,
        };
      }
    }

    return {
      method: this.operation.method.toUpperCase(),
      url,
      httpVersion: 'HTTP/1.1',
      cookies: [],
      headers,
      queryString,
      postData,
      headersSize: -1,
      bodySize: -1,
    };
  }

  private async _copy() {
    const tab = this._allTabs[this._activeTab];
    if (!tab) return;
    const code = this._snippets.get(tab.id) ?? '';
    await navigator.clipboard.writeText(code);
    this._copied = true;
    setTimeout(() => { this._copied = false; }, 2000);
  }

  override render() {
    if (!this.operation || this._allTabs.length === 0) return html``;

    const activeTabInfo = this._allTabs[this._activeTab];
    const code = activeTabInfo ? (this._snippets.get(activeTabInfo.id) ?? 'Loading…') : '';

    return html`
      <div class="code-samples">
        <div class="tabs">
          ${this._allTabs.map((tab, i) => html`
            <button
              class="tab ${i === this._activeTab ? 'active' : ''} ${tab.isSpec ? 'spec-sample' : ''}"
              @click=${() => { this._activeTab = i; this._copied = false; }}
            >${tab.label}${tab.isSpec ? ' ✦' : ''}</button>
          `)}
        </div>
        <div class="code-wrapper">
          <button class="copy-btn ${this._copied ? 'copied' : ''}" @click=${this._copy}>
            ${this._copied ? '✓ Copied' : 'Copy'}
          </button>
          <pre><code>${code}</code></pre>
        </div>
      </div>
    `;
  }
}
