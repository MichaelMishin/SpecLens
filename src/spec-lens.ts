import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { resetStyles } from './styles/reset.css.js';
import { tokenStyles } from './styles/tokens.css.js';
import { themeStyles } from './styles/theme.css.js';
import { parseSpec } from './core/parser.js';
import { buildSearchIndex } from './core/search.js';
import { Router } from './core/router.js';
import { ThemeManager } from './core/theme.js';
import { marked } from 'marked';
import type { SpecLensConfig, ParsedSpec, ParsedOperation, AuthState, SearchEngine } from './core/types.js';

import './components/layout/sl-header.js';
import './components/layout/sl-sidebar.js';
import './components/operation/sl-operation.js';
import './components/operation/sl-try-it.js';
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
        max-width: 1400px;
        margin: 0 auto;
      }

      /* ── Introduction Section ──────────── */
      .sl-introduction {
        margin-bottom: var(--sl-spacing-3xl);
        padding-bottom: var(--sl-spacing-2xl);
        border-bottom: 1px solid var(--sl-color-border);
      }

      .sl-intro-title {
        font-size: var(--sl-font-size-2xl);
        font-weight: 800;
        color: var(--sl-color-text);
        margin: 0 0 var(--sl-spacing-sm) 0;
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-md);
      }

      .sl-intro-version {
        font-size: var(--sl-font-size-sm);
        font-weight: 600;
        padding: 3px 10px;
        border-radius: var(--sl-radius-full);
        background: var(--sl-color-primary);
        color: var(--sl-color-primary-text);
      }

      .sl-intro-desc {
        font-size: var(--sl-font-size-base);
        color: var(--sl-color-text-secondary);
        line-height: 1.7;
        max-width: 900px;
      }

      .sl-intro-desc p {
        margin: 0 0 var(--sl-spacing-md) 0;
      }
      .sl-intro-desc p:last-child {
        margin-bottom: 0;
      }

      /* ── Headings ──────────────────────── */
      .sl-intro-desc h1,
      .sl-intro-desc h2,
      .sl-intro-desc h3,
      .sl-intro-desc h4,
      .sl-intro-desc h5,
      .sl-intro-desc h6 {
        color: var(--sl-color-text);
        font-weight: 700;
        margin: var(--sl-spacing-xl) 0 var(--sl-spacing-sm) 0;
        line-height: 1.3;
      }
      .sl-intro-desc h1 { font-size: 1.6rem; border-bottom: 2px solid var(--sl-color-border); padding-bottom: var(--sl-spacing-sm); }
      .sl-intro-desc h2 { font-size: 1.3rem; border-bottom: 1px solid var(--sl-color-border); padding-bottom: var(--sl-spacing-xs); }
      .sl-intro-desc h3 { font-size: 1.1rem; }
      .sl-intro-desc h4 { font-size: 1rem; }
      .sl-intro-desc h5 { font-size: 0.9rem; }
      .sl-intro-desc h1:first-child,
      .sl-intro-desc h2:first-child,
      .sl-intro-desc h3:first-child {
        margin-top: 0;
      }

      /* ── Inline code ───────────────────── */
      .sl-intro-desc code {
        background: var(--sl-color-code-bg);
        padding: 2px 7px;
        border-radius: var(--sl-radius-sm);
        font-size: 0.85em;
        font-family: var(--sl-font-mono);
        border: 1px solid var(--sl-color-border);
      }

      /* ── Code blocks ───────────────────── */
      .sl-intro-desc pre {
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: var(--sl-radius-md);
        padding: var(--sl-spacing-md);
        overflow-x: auto;
        margin: var(--sl-spacing-md) 0;
        line-height: 1.6;
      }
      .sl-intro-desc pre code {
        background: none;
        border: none;
        padding: 0;
        border-radius: 0;
        color: #e6edf3;
        font-size: var(--sl-font-size-sm);
        font-family: var(--sl-font-mono);
      }

      /* ── Links (button-like) ───────────── */
      .sl-intro-desc a {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--sl-color-primary);
        text-decoration: none;
        font-weight: 500;
        padding: 2px 8px;
        border-radius: var(--sl-radius-sm);
        border: 1px solid transparent;
        transition: all var(--sl-transition-fast);
      }
      .sl-intro-desc a:hover {
        background: rgba(99, 102, 241, 0.08);
        border-color: rgba(99, 102, 241, 0.25);
        text-decoration: none;
      }
      .sl-intro-desc a:active {
        background: rgba(99, 102, 241, 0.15);
      }

      /* ── Tables ────────────────────────── */
      .sl-intro-desc table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        border: 1px solid var(--sl-color-border);
        border-radius: var(--sl-radius-md);
        overflow: hidden;
        margin: var(--sl-spacing-md) 0;
        font-size: var(--sl-font-size-sm);
      }
      .sl-intro-desc thead {
        background: var(--sl-color-bg-subtle);
      }
      .sl-intro-desc th {
        text-align: left;
        padding: var(--sl-spacing-sm) var(--sl-spacing-md);
        font-weight: 600;
        color: var(--sl-color-text);
        border-bottom: 2px solid var(--sl-color-border);
        white-space: nowrap;
      }
      .sl-intro-desc td {
        padding: var(--sl-spacing-sm) var(--sl-spacing-md);
        border-bottom: 1px solid var(--sl-color-border);
        color: var(--sl-color-text-secondary);
      }
      .sl-intro-desc tr:last-child td {
        border-bottom: none;
      }
      .sl-intro-desc tbody tr:hover {
        background: var(--sl-color-bg-subtle);
      }

      /* ── Blockquotes ───────────────────── */
      .sl-intro-desc blockquote {
        border-left: 3px solid var(--sl-color-primary);
        background: rgba(99, 102, 241, 0.05);
        margin: var(--sl-spacing-md) 0;
        padding: var(--sl-spacing-sm) var(--sl-spacing-lg);
        border-radius: 0 var(--sl-radius-md) var(--sl-radius-md) 0;
        color: var(--sl-color-text-secondary);
      }
      .sl-intro-desc blockquote p {
        margin-bottom: var(--sl-spacing-xs);
      }
      .sl-intro-desc blockquote code {
        background: rgba(99, 102, 241, 0.1);
        border-color: rgba(99, 102, 241, 0.2);
      }

      /* ── Lists ─────────────────────────── */
      .sl-intro-desc ul,
      .sl-intro-desc ol {
        margin: var(--sl-spacing-sm) 0;
        padding-left: var(--sl-spacing-xl);
      }
      .sl-intro-desc li {
        margin-bottom: var(--sl-spacing-xs);
      }
      .sl-intro-desc li strong {
        color: var(--sl-color-text);
      }

      /* ── Horizontal rules ──────────────── */
      .sl-intro-desc hr {
        border: none;
        height: 1px;
        background: var(--sl-color-border);
        margin: var(--sl-spacing-xl) 0;
      }

      /* ── Bootstrap-style badges (from spec HTML) ── */
      .sl-intro-desc .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 40px;
        padding: 2px 10px;
        border-radius: var(--sl-radius-full);
        font-size: 0.75rem;
        font-weight: 700;
        font-family: var(--sl-font-mono);
        line-height: 1.5;
        letter-spacing: 0.02em;
      }
      .sl-intro-desc .bg-success { background: var(--sl-color-get-bg); color: var(--sl-color-get); }
      .sl-intro-desc .bg-primary { background: var(--sl-color-post-bg); color: var(--sl-color-post); }
      .sl-intro-desc .bg-info { background: var(--sl-color-put-bg); color: var(--sl-color-put); }
      .sl-intro-desc .bg-danger { background: var(--sl-color-delete-bg); color: var(--sl-color-delete); }
      .sl-intro-desc .bg-secondary { background: var(--sl-color-bg-subtle); color: var(--sl-color-text-secondary); border: 1px solid var(--sl-color-border); }

      /* ── Bootstrap-style alert divs ────── */
      .sl-intro-desc .alert {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-sm);
        padding: var(--sl-spacing-sm) var(--sl-spacing-lg);
        border-radius: var(--sl-radius-md);
        font-size: var(--sl-font-size-sm);
        font-weight: 600;
        margin: var(--sl-spacing-md) 0;
      }
      .sl-intro-desc .alert-success {
        background: var(--sl-color-get-bg);
        color: var(--sl-color-get);
        border: 1px solid rgba(16, 185, 129, 0.2);
      }
      .sl-intro-desc .alert-danger {
        background: var(--sl-color-delete-bg);
        color: var(--sl-color-delete);
        border: 1px solid rgba(239, 68, 68, 0.2);
      }

      /* ── Bootstrap-style buttons (from spec HTML) ── */
      .sl-intro-desc button,
      .sl-intro-desc .btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 16px;
        border-radius: var(--sl-radius-md);
        font-size: var(--sl-font-size-sm);
        font-weight: 600;
        cursor: pointer;
        transition: all var(--sl-transition-fast);
        border: 1px solid var(--sl-color-get);
        background: transparent;
        color: var(--sl-color-get);
      }
      .sl-intro-desc button:hover,
      .sl-intro-desc .btn:hover {
        background: var(--sl-color-get);
        color: #fff;
      }

      /* ── Images ────────────────────────── */
      .sl-intro-desc img {
        max-width: 100%;
        height: auto;
        border-radius: var(--sl-radius-md);
        margin: var(--sl-spacing-sm) 0;
      }

      .sl-intro-server {
        display: inline-flex;
        align-items: center;
        gap: var(--sl-spacing-sm);
        margin-top: var(--sl-spacing-md);
        padding: var(--sl-spacing-sm) var(--sl-spacing-md);
        border-radius: var(--sl-radius-md);
        background: var(--sl-color-bg-subtle);
        border: 1px solid var(--sl-color-border);
        font-size: var(--sl-font-size-sm);
      }

      .sl-intro-server-label {
        color: var(--sl-color-text-muted);
        font-weight: 500;
      }

      .sl-intro-server-url {
        font-family: var(--sl-font-mono);
        color: var(--sl-color-text);
      }

      .sl-intro-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--sl-spacing-md);
        margin-top: var(--sl-spacing-sm);
        font-size: var(--sl-font-size-sm);
        color: var(--sl-color-text-secondary);
      }

      .sl-intro-meta a {
        color: var(--sl-color-primary);
        text-decoration: none;
      }

      .sl-intro-meta a:hover {
        text-decoration: underline;
      }

      /* ── Loading / Error ───────────────── */
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

      /* ── Tag Groups ────────────────────── */
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

      /* ── Try It Modal ──────────────────── */
      .try-it-overlay {
        position: fixed;
        inset: 0;
        z-index: 300;
      }

      .try-it-backdrop {
        position: absolute;
        inset: 0;
        background: var(--sl-color-overlay);
        animation: sl-fade-in 150ms ease;
      }

      @keyframes sl-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .try-it-modal {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: min(680px, calc(100vw - 2rem));
        max-height: calc(100vh - 4rem);
        background: var(--sl-color-surface);
        border-radius: var(--sl-radius-xl);
        box-shadow: var(--sl-shadow-xl);
        border: 1px solid var(--sl-color-border);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        animation: sl-modal-in 200ms ease;
      }

      @keyframes sl-modal-in {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.96); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }

      .try-it-header {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-md);
        padding: var(--sl-spacing-md) var(--sl-spacing-xl);
        border-bottom: 1px solid var(--sl-color-border);
        flex-shrink: 0;
      }

      .try-it-header .method-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 52px;
        padding: 3px 10px;
        border-radius: var(--sl-radius-md);
        font-size: var(--sl-font-size-xs);
        font-weight: 700;
        font-family: var(--sl-font-mono);
        text-transform: uppercase;
      }

      .method-get { background: var(--sl-color-get-bg); color: var(--sl-color-get); }
      .method-post { background: var(--sl-color-post-bg); color: var(--sl-color-post); }
      .method-put { background: var(--sl-color-put-bg); color: var(--sl-color-put); }
      .method-delete { background: var(--sl-color-delete-bg); color: var(--sl-color-delete); }
      .method-patch { background: var(--sl-color-patch-bg); color: var(--sl-color-patch); }
      .method-options,
      .method-head,
      .method-trace { background: var(--sl-color-options-bg); color: var(--sl-color-options); }

      .try-it-header .try-it-path {
        font-family: var(--sl-font-mono);
        font-size: var(--sl-font-size-sm);
        font-weight: 500;
        color: var(--sl-color-text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
      }

      .try-it-close {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--sl-radius-md);
        color: var(--sl-color-text-muted);
        transition: all var(--sl-transition-fast);
        flex-shrink: 0;
      }

      .try-it-close:hover {
        background: var(--sl-color-surface-raised);
        color: var(--sl-color-text);
      }

      .try-it-body {
        flex: 1;
        overflow-y: auto;
        padding: 0;
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
  @state() private _sidebarOpen = false;
  @state() private _authOpen = false;
  @state() private _activeOperationId = '';
  @state() private _navigateToId = '';
  @state() private _authState: AuthState = { apiKeys: {}, bearerTokens: {} };
  @state() private _tryItOperation: ParsedOperation | null = null;

  private _search: SearchEngine | null = null;
  private _router: Router | null = null;
  private _themeManager: ThemeManager | null = null;
  private _observer: IntersectionObserver | null = null;

  private _handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      const sidebar = this.renderRoot.querySelector('sl-sidebar') as any;
      sidebar?.focusSearch();
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this._themeManager = new ThemeManager(this);
    this._themeManager.init(this.theme);
    this._router = new Router((opId) => {
      this._activeOperationId = opId;
      this._navigateToId = opId;
      this._scrollToOperation(opId);
    });
    this._router.init();
    document.addEventListener('keydown', this._handleKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._router?.destroy();
    this._themeManager?.destroy();
    this._observer?.disconnect();
    document.removeEventListener('keydown', this._handleKeyDown);
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

      // After render, handle initial route + set up scroll tracking
      await this.updateComplete;
      this._router?.handleCurrentRoute();
      this._setupScrollTracking();
    } catch (err) {
      this._loading = false;
      this._error = err instanceof Error ? err.message : String(err);
    }
  }

  private _setupScrollTracking(): void {
    this._observer?.disconnect();

    this._observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id === 'introduction') {
              this._activeOperationId = '';
            } else if (id.startsWith('op-')) {
              this._activeOperationId = id.replace('op-', '');
            }
          }
        }
      },
      {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0,
      }
    );

    // Observe introduction
    const intro = this.renderRoot.querySelector('#introduction');
    if (intro) this._observer.observe(intro);

    // Observe all operations
    const ops = this.renderRoot.querySelectorAll('[id^="op-"]');
    ops.forEach(el => this._observer!.observe(el));
  }

  private _scrollToOperation(operationId: string): void {
    if (!operationId) return;
    const el = this.renderRoot.querySelector(`#op-${CSS.escape(operationId)}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private _scrollToIntro(): void {
    this._activeOperationId = '';
    const el = this.renderRoot.querySelector('#introduction');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private _handleThemeToggle(): void {
    const newTheme = this._themeManager?.toggle() ?? 'auto';
    this.theme = newTheme;
  }

  private _handleAuthUpdate(e: CustomEvent<AuthState>): void {
    this._authState = e.detail;
  }

  private _handleTryIt(e: CustomEvent<ParsedOperation>): void {
    this._tryItOperation = e.detail;
  }

  override render() {
    return html`
      <div class="sl-root" data-theme=${this._themeManager?.resolved ?? 'light'}>
        ${this._spec ? html`
          <sl-header
            .spec=${this._spec}
            .authOpen=${this._authOpen}
            @toggle-theme=${this._handleThemeToggle}
            @toggle-sidebar=${() => this._sidebarOpen = !this._sidebarOpen}
            @toggle-auth=${() => this._authOpen = !this._authOpen}
          ></sl-header>

          <div class="sl-body">
            <sl-sidebar
              .tagGroups=${this._spec.tagGroups}
              .activeOperationId=${this._activeOperationId}
              .open=${this._sidebarOpen}
              .searchEngine=${this._search}
              @navigate=${(e: CustomEvent<string>) => this._router?.navigateTo(e.detail)}
              @navigate-intro=${() => this._scrollToIntro()}
              @close-sidebar=${() => this._sidebarOpen = false}
            ></sl-sidebar>

            <main class="sl-main">
              <section class="sl-introduction" id="introduction">
                <h1 class="sl-intro-title">
                  ${this._spec.title}
                  <span class="sl-intro-version">${this._spec.version}</span>
                </h1>
                ${this._spec.description ? html`
                  <div class="sl-intro-desc" .innerHTML=${marked.parse(this._spec.description) as string}></div>
                ` : html`
                  <div class="sl-intro-desc">
                    <p>Welcome to the <strong>${this._spec.title}</strong> API documentation.</p>
                  </div>
                `}
                ${this._spec.servers.length > 0 ? html`
                  <div class="sl-intro-server">
                    <span class="sl-intro-server-label">Base URL</span>
                    <span class="sl-intro-server-url">${this._spec.servers[0].url}</span>
                  </div>
                ` : null}
                ${this._spec.contact ? html`
                  <div class="sl-intro-meta">
                    ${this._spec.contact.name ? html`<span class="sl-intro-meta-item"><strong>Contact:</strong> ${this._spec.contact.url ? html`<a href="${this._spec.contact.url}" target="_blank" rel="noopener">${this._spec.contact.name}</a>` : this._spec.contact.name}</span>` : null}
                    ${this._spec.contact.email ? html`<span class="sl-intro-meta-item"><strong>Email:</strong> <a href="mailto:${this._spec.contact.email}">${this._spec.contact.email}</a></span>` : null}
                  </div>
                ` : null}
                ${this._spec.license ? html`
                  <div class="sl-intro-meta">
                    <span class="sl-intro-meta-item"><strong>License:</strong> ${this._spec.license.url ? html`<a href="${this._spec.license.url}" target="_blank" rel="noopener">${this._spec.license.name}</a>` : this._spec.license.name}</span>
                  </div>
                ` : null}
                ${this._spec.termsOfService ? html`
                  <div class="sl-intro-meta">
                    <span class="sl-intro-meta-item"><a href="${this._spec.termsOfService}" target="_blank" rel="noopener">Terms of Service</a></span>
                  </div>
                ` : null}
              </section>

              ${this._spec.tagGroups.map(group => html`
                <section class="sl-tag-group" id="tag-${CSS.escape(group.name)}">
                  <h2 class="sl-tag-group-title">${group.name}</h2>
                  ${group.description ? html`<div class="sl-tag-group-desc sl-intro-desc" .innerHTML=${marked.parse(group.description) as string}></div>` : null}
                  ${group.operations.map(op => html`
                    <sl-operation
                      id="op-${op.operationId}"
                      .operation=${op}
                      .servers=${this._spec!.servers}
                      .securitySchemes=${this._spec!.securitySchemes}
                      .authState=${this._authState}
                      .proxyUrl=${this.proxyUrl || this.config?.proxyUrl || ''}
                      .activeOperationId=${this._navigateToId}
                      ?hide-try-it=${this.hideTryIt || this.config?.hideTryIt}
                      ?hide-code-samples=${this.hideCodeSamples || this.config?.hideCodeSamples}
                      @try-it=${this._handleTryIt}
                    ></sl-operation>
                  `)}
                </section>
              `)}
            </main>
          </div>

          ${this._authOpen && this._spec.securitySchemes.length > 0 ? html`
            <sl-auth
              .securitySchemes=${this._spec.securitySchemes}
              .authState=${this._authState}
              @auth-update=${this._handleAuthUpdate}
              @close-auth=${() => this._authOpen = false}
            ></sl-auth>
          ` : null}

          ${this._tryItOperation ? html`
            <div class="try-it-overlay">
              <div class="try-it-backdrop" @click=${() => this._tryItOperation = null}></div>
              <div class="try-it-modal">
                <div class="try-it-header">
                  <span class="method-badge method-${this._tryItOperation.method}">${this._tryItOperation.method}</span>
                  <span class="try-it-path">${this._tryItOperation.path}</span>
                  <button class="try-it-close" @click=${() => this._tryItOperation = null}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round"/>
                    </svg>
                  </button>
                </div>
                <div class="try-it-body">
                  <sl-try-it
                    .operation=${this._tryItOperation}
                    .servers=${this._spec!.servers}
                    .securitySchemes=${this._spec!.securitySchemes}
                    .authState=${this._authState}
                    .proxyUrl=${this.proxyUrl || this.config?.proxyUrl || ''}
                  ></sl-try-it>
                </div>
              </div>
            </div>
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
