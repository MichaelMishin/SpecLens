import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { resetStyles } from './styles/reset.css.js';
import { tokenStyles } from './styles/tokens.css.js';
import { themeStyles } from './styles/theme.css.js';
import { parseSpec } from './core/parser.js';
import { buildSearchIndex } from './core/search.js';
import { Router } from './core/router.js';
import { ThemeManager } from './core/theme.js';
import type { SpecLensConfig, ParsedSpec, AuthState, SearchEngine } from './core/types.js';

import './components/layout/sl-header.js';
import './components/layout/sl-sidebar.js';
import './components/layout/sl-search.js';
import './components/operation/sl-operation.js';
import './components/auth/sl-auth.js';

@customElement('spec-lens')
export class SpecLensElement extends LitElement {
  static override styles = [
    resetStyles,
    tokenStyles,
    themeStyles,
    css`
      :host {
        display: block;
        font-family: var(--sl-font-family);
        color: var(--sl-color-text);
        background: var(--sl-color-bg);
        min-height: 100vh;
      }

      .sl-root {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      .sl-body {
        display: flex;
        flex: 1;
      }

      .sl-main {
        flex: 1;
        min-width: 0;
        padding: var(--sl-spacing-xl) var(--sl-spacing-2xl);
        max-width: 960px;
        margin: 0 auto;
      }

      .sl-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        gap: var(--sl-spacing-md);
      }

      .sl-loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--sl-color-border);
        border-top-color: var(--sl-color-primary);
        border-radius: 50%;
        animation: sl-spin 0.8s linear infinite;
      }

      @keyframes sl-spin {
        to { transform: rotate(360deg); }
      }

      .sl-loading-text {
        color: var(--sl-color-text-muted);
        font-size: 0.875rem;
      }

      .sl-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        gap: var(--sl-spacing-md);
        color: var(--sl-color-delete);
        text-align: center;
        padding: var(--sl-spacing-xl);
      }

      .sl-error-icon {
        font-size: 2rem;
      }

      .sl-error-title {
        font-size: 1.25rem;
        font-weight: 600;
      }

      .sl-error-detail {
        font-size: 0.875rem;
        color: var(--sl-color-text-muted);
        max-width: 500px;
        word-break: break-word;
      }

      .sl-tag-group {
        margin-bottom: var(--sl-spacing-2xl);
      }

      .sl-tag-group-title {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 var(--sl-spacing-xs) 0;
        padding-bottom: var(--sl-spacing-sm);
        border-bottom: 2px solid var(--sl-color-border);
        color: var(--sl-color-text);
      }

      .sl-tag-group-desc {
        font-size: 0.875rem;
        color: var(--sl-color-text-muted);
        margin: 0 0 var(--sl-spacing-lg) 0;
      }

      @media (max-width: 768px) {
        .sl-main {
          padding: var(--sl-spacing-md);
        }
      }
    `,
  ];

  @property({ attribute: 'spec-url' })
  specUrl = '';

  @property({ attribute: 'proxy-url' })
  proxyUrl = '';

  @property({ attribute: 'theme', reflect: true })
  theme: 'light' | 'dark' | 'auto' = 'auto';

  @property({ type: Boolean, attribute: 'hide-try-it' })
  hideTryIt = false;

  @property({ type: Boolean, attribute: 'hide-code-samples' })
  hideCodeSamples = false;

  config: SpecLensConfig = {};

  @state() private _spec: ParsedSpec | null = null;
  @state() private _loading = false;
  @state() private _error: string | null = null;
  @state() private _searchOpen = false;
  @state() private _sidebarOpen = false;
  @state() private _authOpen = false;
  @state() private _activeOperationId = '';
  @state() private _authState: AuthState = { apiKeys: {}, bearerTokens: {} };

  private _search: SearchEngine | null = null;
  private _router: Router | null = null;
  private _themeManager: ThemeManager | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this._themeManager = new ThemeManager(this);
    this._themeManager.init(this.theme);
    this._router = new Router((opId) => {
      this._activeOperationId = opId;
      this._scrollToOperation(opId);
    });
    this._router.init();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._router?.destroy();
    this._themeManager?.destroy();
  }

  override willUpdate(changed: PropertyValues): void {
    if (changed.has('specUrl') || changed.has('config')) {
      this._loadSpec();
    }
    if (changed.has('theme')) {
      this._themeManager?.setTheme(this.theme);
    }
  }

  private async _loadSpec(): Promise<void> {
    const specSource = this.config?.spec || this.specUrl;
    if (!specSource) return;

    this._loading = true;
    this._error = null;
    this._spec = null;

    try {
      const spec = await parseSpec(specSource);
      this._spec = spec;
      this._search = buildSearchIndex(spec.allOperations);
      this._loading = false;

      // After render, handle initial route
      await this.updateComplete;
      this._router?.handleCurrentRoute();
    } catch (err) {
      this._loading = false;
      this._error = err instanceof Error ? err.message : String(err);
    }
  }

  private _scrollToOperation(operationId: string): void {
    if (!operationId) return;
    const el = this.renderRoot.querySelector(`#op-${CSS.escape(operationId)}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private _handleSearch(e: CustomEvent<string>): void {
    // Navigate to the selected operation
    const opId = e.detail;
    this._searchOpen = false;
    this._router?.navigateTo(opId);
  }

  private _handleThemeToggle(): void {
    const newTheme = this._themeManager?.toggle() ?? 'auto';
    this.theme = newTheme;
  }

  private _handleAuthUpdate(e: CustomEvent<AuthState>): void {
    this._authState = e.detail;
  }

  override render() {
    return html`
      <div class="sl-root" data-theme=${this._themeManager?.resolved ?? 'light'}>
        ${this._spec ? html`
          <sl-header
            .spec=${this._spec}
            .authOpen=${this._authOpen}
            @toggle-search=${() => this._searchOpen = !this._searchOpen}
            @toggle-theme=${this._handleThemeToggle}
            @toggle-sidebar=${() => this._sidebarOpen = !this._sidebarOpen}
            @toggle-auth=${() => this._authOpen = !this._authOpen}
          ></sl-header>

          ${this._authOpen && this._spec.securitySchemes.length > 0 ? html`
            <sl-auth
              .securitySchemes=${this._spec.securitySchemes}
              .authState=${this._authState}
              @auth-update=${this._handleAuthUpdate}
              @close-auth=${() => this._authOpen = false}
            ></sl-auth>
          ` : null}

          <div class="sl-body">
            <sl-sidebar
              .tagGroups=${this._spec.tagGroups}
              .activeOperationId=${this._activeOperationId}
              .open=${this._sidebarOpen}
              @navigate=${(e: CustomEvent<string>) => this._router?.navigateTo(e.detail)}
              @close-sidebar=${() => this._sidebarOpen = false}
            ></sl-sidebar>

            <main class="sl-main">
              ${this._spec.tagGroups.map(group => html`
                <section class="sl-tag-group" id="tag-${CSS.escape(group.name)}">
                  <h2 class="sl-tag-group-title">${group.name}</h2>
                  ${group.description ? html`<p class="sl-tag-group-desc">${group.description}</p>` : null}
                  ${group.operations.map(op => html`
                    <sl-operation
                      id="op-${op.operationId}"
                      .operation=${op}
                      .servers=${this._spec!.servers}
                      .securitySchemes=${this._spec!.securitySchemes}
                      .authState=${this._authState}
                      .proxyUrl=${this.proxyUrl || this.config?.proxyUrl || ''}
                      .activeOperationId=${this._activeOperationId}
                      ?hide-try-it=${this.hideTryIt || this.config?.hideTryIt}
                      ?hide-code-samples=${this.hideCodeSamples || this.config?.hideCodeSamples}
                    ></sl-operation>
                  `)}
                </section>
              `)}
            </main>
          </div>

          ${this._searchOpen && this._search ? html`
            <sl-search
              .searchEngine=${this._search}
              @select=${this._handleSearch}
              @close=${() => this._searchOpen = false}
            ></sl-search>
          ` : null}
        ` : null}

        ${this._loading ? html`
          <div class="sl-loading">
            <div class="sl-loading-spinner"></div>
            <div class="sl-loading-text">Loading API specification…</div>
          </div>
        ` : null}

        ${this._error ? html`
          <div class="sl-error">
            <div class="sl-error-icon">⚠</div>
            <div class="sl-error-title">Failed to load specification</div>
            <div class="sl-error-detail">${this._error}</div>
          </div>
        ` : null}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'spec-lens': SpecLensElement;
  }
}
