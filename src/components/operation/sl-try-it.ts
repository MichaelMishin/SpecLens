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

const SERVER_STORAGE_KEY = 'sl-try-it-server';

@customElement('sl-try-it')
export class SlTryIt extends LitElement {
  static override styles = [
    resetStyles,
    css`
      :host {
        display: block;
        height: 100%;
      }

      /* ── Split-pane layout ──────────────── */
      .try-it-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        height: 100%;
        min-height: 0;
      }

      @media (max-width: 768px) {
        .try-it-layout {
          grid-template-columns: 1fr;
          grid-template-rows: auto 1fr;
        }
      }

      /* ── Left: Request Panel ────────────── */
      .request-panel {
        display: flex;
        flex-direction: column;
        border-right: 1px solid var(--sl-color-border);
        overflow: hidden;
      }

      @media (max-width: 768px) {
        .request-panel {
          border-right: none;
          border-bottom: 1px solid var(--sl-color-border);
        }
      }

      .request-scroll {
        flex: 1;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--sl-color-border) transparent;
      }

      .request-scroll::-webkit-scrollbar { width: 5px; }
      .request-scroll::-webkit-scrollbar-thumb { background: var(--sl-color-border); border-radius: 3px; }

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
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-sm);
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
        min-width: 110px;
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

      select {
        appearance: none;
        -webkit-appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 8px center;
        padding-right: 28px;
      }

      select:hover {
        border-color: var(--sl-color-primary);
      }

      input:focus, select:focus {
        border-color: var(--sl-color-primary);
      }

      input::placeholder {
        color: var(--sl-color-text-muted);
      }

      .content-type-badge {
        display: inline-block;
        font-family: var(--sl-font-mono);
        font-size: var(--sl-font-size-xs);
        font-weight: 400;
        text-transform: none;
        letter-spacing: 0;
        color: var(--sl-color-text-muted);
        background: var(--sl-color-surface-raised);
        border: 1px solid var(--sl-color-border);
        border-radius: var(--sl-radius-sm);
        padding: 1px 6px;
      }

      .no-schema-note {
        font-size: var(--sl-font-size-sm);
        color: var(--sl-color-text-muted);
        padding: var(--sl-spacing-xs) 0;
      }

      textarea {
        width: 100%;
        min-height: 200px;
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

      /* JSON syntax colors */
      .json-key { color: var(--sl-json-key, #0550ae); }
      .json-string { color: var(--sl-json-string, #0a3069); }
      .json-number { color: var(--sl-json-number, #0550ae); }
      .json-boolean { color: var(--sl-json-boolean, #cf222e); }
      .json-null { color: var(--sl-json-null, #6e7781); }
      .json-brace { color: var(--sl-json-brace, #64748b); }

      /* ── File upload ─────────────────────── */
      .file-upload-row {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-sm);
        flex: 1;
      }

      .file-upload-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: var(--sl-radius-sm);
        border: 1px dashed var(--sl-color-border);
        background: var(--sl-color-bg-subtle);
        color: var(--sl-color-text-secondary);
        font-size: var(--sl-font-size-sm);
        cursor: pointer;
        transition: all var(--sl-transition-fast);
        white-space: nowrap;
      }

      .file-upload-btn:hover {
        border-color: var(--sl-color-primary);
        color: var(--sl-color-primary);
        background: rgba(99, 102, 241, 0.05);
      }

      .file-name {
        font-family: var(--sl-font-mono);
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 180px;
      }

      .file-size {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
        white-space: nowrap;
      }

      .file-clear {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: var(--sl-radius-sm);
        color: var(--sl-color-text-muted);
        cursor: pointer;
        flex-shrink: 0;
        transition: all var(--sl-transition-fast);
      }

      .file-clear:hover {
        background: var(--sl-color-surface-raised);
        color: var(--sl-color-danger);
      }

      .hidden-file-input {
        display: none;
      }

      /* ── Whole-body file upload ───────────── */
      .body-file-upload {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--sl-spacing-sm);
        padding: var(--sl-spacing-lg);
        border: 2px dashed var(--sl-color-border);
        border-radius: var(--sl-radius-md);
        background: var(--sl-color-bg-subtle);
        cursor: pointer;
        transition: all var(--sl-transition-fast);
      }

      .body-file-upload:hover {
        border-color: var(--sl-color-primary);
        background: rgba(99, 102, 241, 0.04);
      }

      .body-file-upload-icon {
        width: 32px;
        height: 32px;
        color: var(--sl-color-text-muted);
      }

      .body-file-upload-text {
        font-size: var(--sl-font-size-sm);
        color: var(--sl-color-text-secondary);
      }

      .body-file-upload-hint {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
      }

      .body-file-selected {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-sm);
        padding: var(--sl-spacing-sm) var(--sl-spacing-md);
        border: 1px solid var(--sl-color-border);
        border-radius: var(--sl-radius-sm);
        background: var(--sl-color-bg-subtle);
      }

      /* ── Actions bar ─────────────────────── */
      .actions-bar {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-sm);
        padding: var(--sl-spacing-md) var(--sl-spacing-lg);
        border-top: 1px solid var(--sl-color-border);
        background: var(--sl-color-bg-subtle);
        flex-shrink: 0;
      }

      .server-select {
        flex: 1;
        min-width: 0;
      }

      .send-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 20px;
        border-radius: var(--sl-radius-md);
        background: var(--sl-color-primary);
        color: var(--sl-color-primary-text);
        font-weight: 600;
        font-size: var(--sl-font-size-sm);
        transition: background var(--sl-transition-fast);
        white-space: nowrap;
      }

      .send-btn:hover {
        background: var(--sl-color-primary-hover);
      }

      .send-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .enter-hint {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-color-text-muted);
        display: flex;
        align-items: center;
        gap: 4px;
        margin-left: auto;
      }

      .enter-hint kbd {
        display: inline-flex;
        align-items: center;
        padding: 1px 6px;
        border-radius: 3px;
        background: var(--sl-color-surface-raised);
        color: var(--sl-color-text-secondary);
        font-family: var(--sl-font-mono);
        font-size: 10px;
        font-weight: 600;
        border: 1px solid var(--sl-color-border);
      }

      /* ── Right: Response Panel ──────────── */
      .response-panel {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 300px;
        --sl-resp-bg: var(--sl-color-bg-subtle, #f0f2f5);
        --sl-resp-border: var(--sl-color-border, #dce0e6);
        --sl-resp-text: var(--sl-color-text-secondary, #64748b);
        --sl-resp-text-dim: var(--sl-color-text-muted, #b0b8c4);
        --sl-resp-text-faint: var(--sl-color-border, #d4d9e0);
        --sl-resp-accent: var(--sl-color-primary, #6366f1);
        --sl-resp-accent-dim: rgba(99, 102, 241, 0.1);
        --sl-resp-glow: rgba(99, 102, 241, 0.08);
        --sl-resp-code-bg: var(--sl-color-code-bg, #f8fafc);
        --sl-resp-code-text: var(--sl-color-code-text, #1e293b);
        --sl-resp-header-text: var(--sl-color-text-muted, #64748b);
        background: var(--sl-resp-bg);
      }

      /* ── Placeholder (no request yet) ───── */
      .placeholder {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--sl-spacing-xl);
        user-select: none;
        position: relative;
        overflow: hidden;
      }

      /* Background grid pattern */
      .placeholder::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image:
          radial-gradient(circle, var(--sl-resp-text-faint) 0.5px, transparent 0.5px);
        background-size: 24px 24px;
        opacity: 0.5;
        mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black, transparent);
        -webkit-mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black, transparent);
      }

      .placeholder-visual {
        position: relative;
        width: 280px;
        height: 220px;
        margin-bottom: var(--sl-spacing-lg);
      }

      /* Pulsing rings */
      .pulse-ring {
        position: absolute;
        border-radius: 50%;
        border: 1px solid var(--sl-resp-accent);
        opacity: 0;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .pulse-ring-1 {
        width: 80px;
        height: 80px;
        animation: sl-pulse-ring 4s ease-out 0s infinite;
      }

      .pulse-ring-2 {
        width: 80px;
        height: 80px;
        animation: sl-pulse-ring 4s ease-out 1.3s infinite;
      }

      .pulse-ring-3 {
        width: 80px;
        height: 80px;
        animation: sl-pulse-ring 4s ease-out 2.6s infinite;
      }

      @keyframes sl-pulse-ring {
        0% {
          width: 80px; height: 80px; opacity: 0.4;
        }
        100% {
          width: 280px; height: 280px; opacity: 0;
        }
      }

      /* Center icon container */
      .placeholder-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: var(--sl-resp-accent-dim);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 40px var(--sl-resp-glow), 0 0 80px var(--sl-resp-glow);
      }

      .placeholder-icon svg {
        color: var(--sl-resp-accent);
        filter: drop-shadow(0 0 8px var(--sl-resp-glow));
      }

      /* Decorative orbit paths */
      .orbit {
        position: absolute;
        border-radius: 50%;
        border: 1px dashed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .orbit-1 {
        width: 140px;
        height: 140px;
        border-color: var(--sl-resp-text-faint);
        opacity: 0.6;
      }

      .orbit-2 {
        width: 210px;
        height: 210px;
        border-color: var(--sl-resp-text-faint);
        opacity: 0.3;
      }

      /* Orbiting dots */
      .orbit-dot {
        position: absolute;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        top: 50%;
        left: 50%;
      }

      .orbit-dot-1 {
        background: var(--sl-resp-accent);
        animation: sl-orbit-1 8s linear infinite;
        box-shadow: 0 0 6px var(--sl-resp-accent);
      }

      .orbit-dot-2 {
        width: 4px;
        height: 4px;
        background: var(--sl-resp-text-dim);
        animation: sl-orbit-2 12s linear infinite;
      }

      .orbit-dot-3 {
        width: 5px;
        height: 5px;
        background: var(--sl-resp-accent);
        opacity: 0.5;
        animation: sl-orbit-2 12s linear 6s infinite;
      }

      @keyframes sl-orbit-1 {
        from { transform: rotate(0deg) translateX(70px) rotate(0deg); }
        to   { transform: rotate(360deg) translateX(70px) rotate(-360deg); }
      }

      @keyframes sl-orbit-2 {
        from { transform: rotate(0deg) translateX(105px) rotate(0deg); }
        to   { transform: rotate(360deg) translateX(105px) rotate(-360deg); }
      }

      /* Floating code particles */
      .code-particle {
        position: absolute;
        font-family: var(--sl-font-mono);
        font-size: 11px;
        color: var(--sl-resp-text-dim);
        opacity: 0;
        animation: sl-float 6s ease-in-out infinite;
      }

      .code-particle:nth-child(1) { top: 15%; left: 8%; animation-delay: 0s; }
      .code-particle:nth-child(2) { top: 75%; left: 12%; animation-delay: 1.5s; }
      .code-particle:nth-child(3) { top: 20%; right: 10%; animation-delay: 3s; }
      .code-particle:nth-child(4) { bottom: 15%; right: 8%; animation-delay: 4.5s; }
      .code-particle:nth-child(5) { top: 50%; left: 3%; animation-delay: 2s; }
      .code-particle:nth-child(6) { bottom: 30%; right: 5%; animation-delay: 0.8s; }

      @keyframes sl-float {
        0%, 100% { opacity: 0; transform: translateY(8px); }
        20%, 80% { opacity: 0.6; }
        50% { opacity: 0.8; transform: translateY(-8px); }
      }

      /* Text content */
      .placeholder-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--sl-resp-text);
        margin-bottom: 6px;
        position: relative;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .placeholder-caret {
        color: var(--sl-resp-accent);
        animation: sl-blink 1.2s step-end infinite;
        font-family: var(--sl-font-mono);
      }

      @keyframes sl-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }

      .placeholder-hint {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-resp-text-dim);
        text-align: center;
        max-width: 280px;
        line-height: 1.6;
        position: relative;
      }

      .placeholder-hint strong {
        color: var(--sl-resp-accent);
        font-weight: 600;
      }

      .placeholder-kbd {
        display: inline-flex;
        align-items: center;
        padding: 1px 6px;
        border-radius: 3px;
        background: var(--sl-resp-accent-dim);
        color: var(--sl-resp-accent);
        font-family: var(--sl-font-mono);
        font-size: 10px;
        font-weight: 600;
        border: 1px solid rgba(99, 102, 241, 0.15);
        vertical-align: 1px;
      }

      /* ── Loading state ──────────────────── */
      .loading-bar {
        height: 2px;
        background: var(--sl-color-primary);
        animation: sl-loading-pulse 1.5s ease infinite;
        flex-shrink: 0;
      }

      @keyframes sl-loading-pulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }

      /* ── Response content ───────────────── */
      .response-scroll {
        flex: 1;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--sl-resp-border) transparent;
      }

      .response-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
      .response-scroll::-webkit-scrollbar-track { background: transparent; }
      .response-scroll::-webkit-scrollbar-thumb { background: var(--sl-resp-border); border-radius: 3px; }

      .response-header {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-md);
        padding: var(--sl-spacing-md) var(--sl-spacing-lg);
        border-bottom: 1px solid var(--sl-resp-border);
        flex-shrink: 0;
      }

      .status-badge {
        font-family: var(--sl-font-mono);
        font-weight: 700;
        font-size: var(--sl-font-size-sm);
        padding: 2px 10px;
        border-radius: var(--sl-radius-sm);
      }

      .status-2xx { background: rgba(16,185,129,0.15); color: #10b981; }
      .status-3xx { background: rgba(59,130,246,0.15); color: #3b82f6; }
      .status-4xx { background: rgba(245,158,11,0.15); color: #f59e0b; }
      .status-5xx { background: rgba(239,68,68,0.15); color: #ef4444; }

      .response-time {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-resp-header-text);
        margin-left: auto;
        font-family: var(--sl-font-mono);
      }

      .response-body {
        padding: var(--sl-spacing-md) var(--sl-spacing-lg);
      }

      .response-body {
        position: relative;
      }

      .response-body pre {
        background: var(--sl-resp-code-bg);
        border: 1px solid var(--sl-resp-border);
        border-radius: var(--sl-radius-sm);
        padding: var(--sl-spacing-md);
        padding-right: 60px;
        font-size: var(--sl-font-size-sm);
        color: var(--sl-resp-code-text);
        overflow-x: auto;
        line-height: 1.6;
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 100%;
        scrollbar-width: thin;
        scrollbar-color: var(--sl-resp-border) transparent;
      }

      .copy-btn {
        position: absolute;
        top: var(--sl-spacing-sm);
        right: var(--sl-spacing-sm);
        padding: 4px 10px;
        border-radius: var(--sl-radius-sm);
        font-size: var(--sl-font-size-xs);
        color: var(--sl-resp-text-dim);
        background: var(--sl-resp-bg);
        border: 1px solid var(--sl-resp-border);
        transition: all var(--sl-transition-fast);
        z-index: 1;
        cursor: pointer;
      }

      .copy-btn:hover {
        color: var(--sl-resp-text);
        background: var(--sl-resp-code-bg);
        border-color: var(--sl-resp-text-dim);
      }

      .copy-btn.copied {
        color: #10b981;
        border-color: #10b981;
      }

      .response-body pre::-webkit-scrollbar { width: 6px; height: 6px; }
      .response-body pre::-webkit-scrollbar-track { background: transparent; }
      .response-body pre::-webkit-scrollbar-thumb { background: var(--sl-resp-border); border-radius: 3px; }

      .response-headers-section {
        padding: 0 var(--sl-spacing-lg) var(--sl-spacing-md);
      }

      .response-headers-title {
        font-size: var(--sl-font-size-xs);
        font-weight: 600;
        color: var(--sl-resp-header-text);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: var(--sl-spacing-xs);
        cursor: pointer;
        transition: color var(--sl-transition-fast);
      }

      .response-headers-title:hover {
        color: var(--sl-resp-text);
      }

      .response-headers-section pre {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-resp-header-text);
        line-height: 1.6;
        margin: 0;
        white-space: pre-wrap;
      }

      .error-msg {
        padding: var(--sl-spacing-lg);
        display: flex;
        flex-direction: column;
        gap: var(--sl-spacing-xs);
      }

      .error-msg .error-text {
        color: #ef4444;
        font-size: var(--sl-font-size-sm);
        font-family: var(--sl-font-mono);
      }

      .error-msg .cors-hint {
        font-size: var(--sl-font-size-xs);
        color: var(--sl-resp-header-text);
        line-height: 1.5;
      }

      .error-msg .cors-hint code {
        color: var(--sl-resp-text);
        background: var(--sl-resp-code-bg);
        padding: 1px 5px;
        border-radius: 3px;
        font-family: var(--sl-font-mono);
        border: 1px solid var(--sl-resp-border);
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
  @state() private _formFields: Record<string, string | File> = {};
  @state() private _bodyFile: File | null = null;
  @state() private _selectedServer = 0;
  @state() private _response: TryItResponse | null = null;
  @state() private _loading = false;
  @state() private _error: string | null = null;
  @state() private _showResponseHeaders = false;
  @state() private _initialized = false;
  @state() private _copied = false;

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

    // Restore last-used server from localStorage
    try {
      const storedUrl = localStorage.getItem(SERVER_STORAGE_KEY);
      if (storedUrl) {
        const serverObjs = this.operation.servers.length > 0 ? this.operation.servers : this.servers;
        const idx = serverObjs.findIndex(s => s.url === storedUrl);
        if (idx >= 0) this._selectedServer = idx;
      }
    } catch { /* localStorage unavailable */ }

    // Pre-fill body
    if (this.operation.requestBody) {
      const content = this.operation.requestBody.content[0];
      if (content && this._isFormMediaType(content.mediaType) && content.schema) {
        const schema = content.schema as Record<string, unknown>;
        const props = (schema['properties'] ?? {}) as Record<string, Record<string, unknown>>;
        const fields: Record<string, string> = {};
        for (const [key, prop] of Object.entries(props)) {
          if (prop['example'] !== undefined) fields[key] = String(prop['example']);
          else if (prop['default'] !== undefined) fields[key] = String(prop['default']);
        }
        this._formFields = fields;
      } else if (content && !this._isBinaryBody()) {
        if (content.schema) {
          try {
            const sample = sampleFromSchema(content.schema as Record<string, unknown>);
            this._bodyValue = JSON.stringify(sample, null, 2);
          } catch {
            this._bodyValue = '{}';
          }
        }
      }
    }
  }

  private _isFormMediaType(mediaType: string): boolean {
    return mediaType === 'multipart/form-data' || mediaType === 'application/x-www-form-urlencoded';
  }

  private _isFormBody(): boolean {
    const mediaType = this.operation.requestBody?.content[0]?.mediaType ?? '';
    return this._isFormMediaType(mediaType);
  }

  private _isBinaryBody(): boolean {
    const content = this.operation.requestBody?.content[0];
    if (!content) return false;
    const mediaType = content.mediaType;
    if (mediaType === 'application/octet-stream') return true;
    if (mediaType.startsWith('image/') || mediaType.startsWith('audio/') || mediaType.startsWith('video/')) return true;
    const schema = content.schema as Record<string, unknown> | null;
    if (schema && schema['type'] === 'string' && schema['format'] === 'binary') return true;
    return false;
  }

  private _isFileProperty(prop: Record<string, unknown>, isMultipart: boolean): boolean {
    if (!isMultipart) return false;
    if (prop['format'] === 'binary') return true;
    if (prop['type'] === 'string' && prop['format'] === 'binary') return true;
    if (prop['type'] === 'string' && prop['contentMediaType']) return true;
    return false;
  }

  private _formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private _handleServerChange(e: Event) {
    const idx = (e.target as HTMLSelectElement).selectedIndex;
    this._selectedServer = idx;
    const serverObjs = this.operation.servers.length > 0 ? this.operation.servers : this.servers;
    const server = serverObjs[idx];
    if (server) {
      try { localStorage.setItem(SERVER_STORAGE_KEY, server.url); } catch { /* ok */ }
    }
  }

  private _triggerFileInput(fieldKey: string) {
    const input = this.renderRoot.querySelector<HTMLInputElement>(`input[data-field="${CSS.escape(fieldKey)}"]`);
    input?.click();
  }

  private _triggerBodyFileInput() {
    const input = this.renderRoot.querySelector<HTMLInputElement>('input.body-file-hidden');
    input?.click();
  }

  private _handleFieldFileChange(e: Event, key: string) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      this._formFields = { ...this._formFields, [key]: file };
    }
  }

  private _clearFieldFile(key: string) {
    const { [key]: _removed, ...rest } = this._formFields;
    this._formFields = rest;
    const input = this.renderRoot.querySelector<HTMLInputElement>(`input[data-field="${CSS.escape(key)}"]`);
    if (input) input.value = '';
  }

  private _handleBodyFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      this._bodyFile = file;
    }
  }

  private _clearBodyFile() {
    this._bodyFile = null;
    const input = this.renderRoot.querySelector<HTMLInputElement>('input.body-file-hidden');
    if (input) input.value = '';
  }

  private _buildUrl(): string {
    const serverObjs = this.operation.servers.length > 0 ? this.operation.servers : this.servers;
    const server = serverObjs[this._selectedServer] ?? serverObjs[0];
    if (!server) return this.operation.path;

    let baseUrl = server.url.replace(/\/+$/, '');
    for (const [key, val] of Object.entries(server.variables)) {
      baseUrl = baseUrl.replace(`{${key}}`, val.default);
    }

    let path = this.operation.path;
    for (const p of this.operation.parameters.filter(p => p.in === 'path')) {
      const value = this._paramValues[`path:${p.name}`] ?? '';
      path = path.replace(`{${p.name}}`, encodeURIComponent(value));
    }

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

    for (const p of this.operation.parameters.filter(p => p.in === 'header')) {
      const value = this._paramValues[`header:${p.name}`];
      if (value) headers[p.name] = value;
    }

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

    if (this.operation.requestBody) {
      const content = this.operation.requestBody.content[0];
      if (content && content.mediaType !== 'multipart/form-data' && !this._isBinaryBody()) {
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

    let requestBody: string | FormData | URLSearchParams | File | undefined;
    if (hasBody) {
      const mediaType = this.operation.requestBody!.content[0]?.mediaType ?? '';
      if (this._isBinaryBody() && this._bodyFile) {
        requestBody = this._bodyFile;
        headers['Content-Type'] = this._bodyFile.type || mediaType;
      } else if (mediaType === 'multipart/form-data') {
        const fd = new FormData();
        for (const [key, value] of Object.entries(this._formFields)) {
          if (value instanceof File) {
            fd.append(key, value, value.name);
          } else if ((value as string).trim() !== '') {
            fd.append(key, value as string);
          }
        }
        requestBody = fd;
      } else if (mediaType === 'application/x-www-form-urlencoded') {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(this._formFields)) {
          if (typeof value === 'string' && value.trim() !== '') {
            params.append(key, value);
          }
        }
        requestBody = params;
      } else {
        requestBody = this._bodyValue;
      }
    }

    const start = performance.now();

    try {
      const resp = await fetch(targetUrl, {
        method: this.operation.method.toUpperCase(),
        headers,
        body: requestBody,
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

  private _highlightJson(text: string): ReturnType<typeof html> {
    try {
      JSON.parse(text);
    } catch {
      return html`${text}`;
    }

    const tokens: ReturnType<typeof html>[] = [];
    // Regex to match JSON tokens
    const re = /("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b|(true|false)|(null)|([{}[\],])/g;
    let last = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      if (match.index > last) {
        tokens.push(html`${text.slice(last, match.index)}`);
      }
      if (match[1] !== undefined) {
        // key
        tokens.push(html`<span class="json-key">${match[1]}</span>:`);
      } else if (match[2] !== undefined) {
        tokens.push(html`<span class="json-string">${match[2]}</span>`);
      } else if (match[3] !== undefined) {
        tokens.push(html`<span class="json-number">${match[3]}</span>`);
      } else if (match[4] !== undefined) {
        tokens.push(html`<span class="json-boolean">${match[4]}</span>`);
      } else if (match[5] !== undefined) {
        tokens.push(html`<span class="json-null">${match[5]}</span>`);
      } else if (match[6] !== undefined) {
        tokens.push(html`<span class="json-brace">${match[6]}</span>`);
      }
      last = re.lastIndex;
    }
    if (last < text.length) {
      tokens.push(html`${text.slice(last)}`);
    }
    return html`${tokens}`;
  }

  private async _copyResponse() {
    if (!this._response) return;
    const text = this._formatBody(this._response.body);
    await navigator.clipboard.writeText(text);
    this._copied = true;
    setTimeout(() => { this._copied = false; }, 2000);
  }

  private _handleGlobalKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !this._loading) {
      e.preventDefault();
      this._send();
    }
  }

  private _renderFormFields() {
    const content = this.operation.requestBody!.content[0];
    const mediaType = content.mediaType;
    const isMultipart = mediaType === 'multipart/form-data';
    const schema = content.schema as Record<string, unknown> | null;
    const props = ((schema?.['properties'] ?? {}) as Record<string, Record<string, unknown>>);
    const required: string[] = (schema?.['required'] ?? []) as string[];
    const entries = Object.entries(props);

    return html`
      <div class="form-section">
        <div class="form-label">
          Request Body
          <span class="content-type-badge">${mediaType}</span>
        </div>
        ${entries.length === 0 ? html`
          <p class="no-schema-note">No schema properties defined for this content type.</p>
        ` : entries.map(([key, prop]) => html`
          <div class="param-input-row">
            <div class="param-input-name">
              ${key}
              ${required.includes(key) ? html`<span class="req">*</span>` : null}
            </div>
            ${this._isFileProperty(prop, isMultipart) ? html`
              <input
                class="hidden-file-input"
                type="file"
                data-field="${key}"
                @change=${(e: Event) => this._handleFieldFileChange(e, key)}
              />
              <div class="file-upload-row">
                ${this._formFields[key] instanceof File ? html`
                  <span class="file-name">${(this._formFields[key] as File).name}</span>
                  <span class="file-size">${this._formatFileSize((this._formFields[key] as File).size)}</span>
                  <span class="file-clear" @click=${() => this._clearFieldFile(key)} title="Remove file">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                      <path d="M4 4l8 8M12 4l-8 8"/>
                    </svg>
                  </span>
                ` : html`
                  <button class="file-upload-btn" @click=${() => this._triggerFileInput(key)}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M8 12V3"/>
                      <path d="M4.5 6.5L8 3l3.5 3.5"/>
                      <path d="M14 10v3a1 1 0 01-1 1H3a1 1 0 01-1-1v-3"/>
                    </svg>
                    Choose file
                  </button>
                `}
              </div>
            ` : html`
              <input
                type="text"
                placeholder="${(prop['description'] as string | undefined) ?? key}"
                .value=${typeof this._formFields[key] === 'string' ? (this._formFields[key] as string) : ''}
                @input=${(e: Event) => { this._formFields = { ...this._formFields, [key]: (e.target as HTMLInputElement).value }; }}
              />
            `}
          </div>
        `)}
      </div>
    `;
  }

  private _renderBinaryBodyUpload() {
    const content = this.operation.requestBody!.content[0];
    const mediaType = content.mediaType;

    return html`
      <div class="form-section">
        <div class="form-label">
          Request Body
          <span class="content-type-badge">${mediaType}</span>
        </div>
        <input
          class="body-file-hidden hidden-file-input"
          type="file"
          @change=${this._handleBodyFileChange}
        />
        ${this._bodyFile ? html`
          <div class="body-file-selected">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z"/>
              <path d="M9 2v4h4"/>
            </svg>
            <span class="file-name">${this._bodyFile.name}</span>
            <span class="file-size">${this._formatFileSize(this._bodyFile.size)}</span>
            <span class="file-clear" @click=${this._clearBodyFile} title="Remove file">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M4 4l8 8M12 4l-8 8"/>
              </svg>
            </span>
          </div>
        ` : html`
          <div class="body-file-upload" @click=${this._triggerBodyFileInput}>
            <svg class="body-file-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 16V4"/>
              <path d="M7 9l5-5 5 5"/>
              <path d="M20 14v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5"/>
            </svg>
            <span class="body-file-upload-text">Click to select a file</span>
            <span class="body-file-upload-hint">or drag and drop</span>
          </div>
        `}
      </div>
    `;
  }

  private _renderPlaceholder() {
    return html`
      <div class="placeholder">
        <!-- Floating code particles -->
        <span class="code-particle">GET /</span>
        <span class="code-particle">200 OK</span>
        <span class="code-particle">{ }</span>
        <span class="code-particle">Bearer</span>
        <span class="code-particle">JSON</span>
        <span class="code-particle">→ res</span>

        <div class="placeholder-visual">
          <!-- Orbit paths -->
          <div class="orbit orbit-1"></div>
          <div class="orbit orbit-2"></div>

          <!-- Orbiting dots -->
          <div class="orbit-dot orbit-dot-1"></div>
          <div class="orbit-dot orbit-dot-2"></div>
          <div class="orbit-dot orbit-dot-3"></div>

          <!-- Pulsing rings -->
          <div class="pulse-ring pulse-ring-1"></div>
          <div class="pulse-ring pulse-ring-2"></div>
          <div class="pulse-ring pulse-ring-3"></div>

          <!-- Center icon -->
          <div class="placeholder-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 2L11 13"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
            </svg>
          </div>
        </div>

        <div class="placeholder-title">
          <span class="placeholder-caret">▌</span>
          Ready to send
        </div>
        <div class="placeholder-hint">
          Configure your request on the left panel, then press
          <strong>Send Request</strong> to see the response here.
        </div>
      </div>
    `;
  }

  override render() {
    if (!this.operation) return html``;

    const pathParams = this.operation.parameters.filter(p => p.in === 'path');
    const queryParams = this.operation.parameters.filter(p => p.in === 'query');
    const headerParams = this.operation.parameters.filter(p => p.in === 'header');
    const serverObjs = this.operation.servers.length > 0 ? this.operation.servers : this.servers;

    return html`
      <div class="try-it-layout" @keydown=${this._handleGlobalKeyDown}>
        <!-- Left: Request Panel -->
        <div class="request-panel">
          <div class="request-scroll">
            ${serverObjs.length > 0 ? html`
              <div class="form-section">
                <div class="form-label">Server</div>
                <select class="server-select" @change=${this._handleServerChange}>
                  ${serverObjs.map((s, i) => html`
                    <option ?selected=${i === this._selectedServer}>
                      ${s.url}${s.description ? ` — ${s.description}` : ''}
                    </option>
                  `)}
                </select>
              </div>
            ` : null}

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
              ${this._isBinaryBody()
                ? this._renderBinaryBodyUpload()
                : this._isFormBody()
                  ? this._renderFormFields()
                  : html`
                    <div class="form-section">
                      <div class="form-label">Request Body</div>
                      <textarea
                        .value=${this._bodyValue}
                        @input=${(e: Event) => { this._bodyValue = (e.target as HTMLTextAreaElement).value; }}
                        @blur=${(e: Event) => {
                          const ta = e.target as HTMLTextAreaElement;
                          try {
                            const formatted = JSON.stringify(JSON.parse(ta.value), null, 2);
                            this._bodyValue = formatted;
                            ta.value = formatted;
                          } catch { /* keep as-is */ }
                        }}
                      ></textarea>
                    </div>
                  `}
            ` : null}
          </div>

          <div class="actions-bar">
            <button class="send-btn" @click=${this._send} ?disabled=${this._loading}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 2l12 6-12 6V9l8-1-8-1V2z"/>
              </svg>
              ${this._loading ? 'Sending…' : 'Send Request'}
            </button>
            <span class="enter-hint"><kbd>Ctrl+Enter</kbd> to send</span>
          </div>
        </div>

        <!-- Right: Response Panel -->
        <div class="response-panel">
          ${this._loading ? html`<div class="loading-bar"></div>` : null}

          ${this._response ? html`
            <div class="response-header">
              <span class="status-badge ${this._getStatusClass(this._response.status)}">
                ${this._response.status} ${this._response.statusText}
              </span>
              <span class="response-time">${this._response.time}ms</span>
            </div>
            <div class="response-scroll">
              <div class="response-body">
                <button class="copy-btn ${this._copied ? 'copied' : ''}" @click=${this._copyResponse}>
                  ${this._copied ? '✓ Copied' : 'Copy'}
                </button>
                <pre><code>${this._highlightJson(this._formatBody(this._response.body))}</code></pre>
              </div>
              <div class="response-headers-section">
                <div class="response-headers-title" @click=${() => this._showResponseHeaders = !this._showResponseHeaders}>
                  Response Headers ${this._showResponseHeaders ? '▾' : '▸'}
                </div>
                ${this._showResponseHeaders ? html`
                  <pre>${Object.entries(this._response.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}</pre>
                ` : null}
              </div>
            </div>
          ` : this._error ? html`
            <div class="error-msg">
              <div class="error-text">${this._error}</div>
              <div class="cors-hint">
                If this is a CORS error, the API server may need to allow cross-origin requests,
                or you can configure a <code>proxyUrl</code> in SpecLens.
              </div>
            </div>
          ` : !this._loading ? this._renderPlaceholder() : null}
        </div>
      </div>
    `;
  }
}
