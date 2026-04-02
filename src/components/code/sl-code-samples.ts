import { LitElement, html, css, svg } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
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

/* ── Inline SVG icons (14×14, monochrome, currentColor) ───── */
const LANG_ICONS: Record<string, ReturnType<typeof svg>> = {
  // Terminal prompt
  curl: svg`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="1" y="2" width="14" height="12" rx="2"/>
    <path d="M4 7l3 2-3 2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9 11h3" stroke-linecap="round"/>
  </svg>`,
  // JS
  javascript: svg`<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect width="16" height="16" rx="2" fill="currentColor" opacity="0.15"/>
    <text x="3" y="13" font-size="11" font-weight="700" font-family="system-ui" fill="currentColor">JS</text>
  </svg>`,
  // Python
  python: svg`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3">
    <path d="M8 1C5 1 5 2.5 5 3.5V5h3v1H4C2.5 6 1 7 1 9.5S2.5 13 4 13h1.5v-2c0-1.5 1-2.5 2.5-2.5h3c1 0 2-1 2-2V3.5C13 2 12 1 8 1z"/>
    <path d="M8 15c3 0 3-1.5 3-2.5V11H8v-1h4c1.5 0 3-1 3-3.5S13.5 3 12 3h-1.5v2c0 1.5-1 2.5-2.5 2.5H5c-1 0-2 1-2 2v2.5C3 14 4 15 8 15z"/>
    <circle cx="6.25" cy="3.75" r="0.75" fill="currentColor" stroke="none"/>
    <circle cx="9.75" cy="12.25" r="0.75" fill="currentColor" stroke="none"/>
  </svg>`,
  // Node.js hexagon
  node: svg`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3">
    <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z"/>
    <text x="4.5" y="10.5" font-size="6" font-weight="700" font-family="system-ui" fill="currentColor" stroke="none">N</text>
  </svg>`,
  // Go
  go: svg`<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect width="16" height="16" rx="2" fill="currentColor" opacity="0.15"/>
    <text x="1.5" y="12.5" font-size="10" font-weight="700" font-family="system-ui" fill="currentColor">Go</text>
  </svg>`,
  // Java
  java: svg`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3">
    <path d="M5 2c0 0 3 1 3 4c0 3-3 4-3 4" stroke-linecap="round"/>
    <path d="M11 2c0 0-3 1-3 4c0 3 3 4 3 4" stroke-linecap="round"/>
    <path d="M3 12c2 2 8 2 10 0" stroke-linecap="round"/>
    <path d="M4 14c2 1.5 6 1.5 8 0" stroke-linecap="round"/>
  </svg>`,
  // PHP
  php: svg`<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <ellipse cx="8" cy="8" rx="7.5" ry="5.5" fill="currentColor" opacity="0.15" stroke="none"/>
    <text x="1.5" y="10.5" font-size="7" font-weight="700" font-family="system-ui" fill="currentColor">PHP</text>
  </svg>`,
  // Ruby gem
  ruby: svg`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3">
    <polygon points="8,1 14,5 14,11 8,15 2,11 2,5"/>
    <line x1="8" y1="1" x2="8" y2="15"/>
    <line x1="2" y1="5" x2="14" y2="5"/>
    <line x1="2" y1="5" x2="8" y2="15"/>
    <line x1="14" y1="5" x2="8" y2="15"/>
  </svg>`,
  // C#
  csharp: svg`<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect width="16" height="16" rx="2" fill="currentColor" opacity="0.15"/>
    <text x="2" y="12.5" font-size="10" font-weight="700" font-family="system-ui" fill="currentColor">C#</text>
  </svg>`,
};

/* ── Syntax Highlighting Engine ─────────────────────────────────── */
const _esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

type _Rule = [RegExp, string];

const _SQ  = /^'(?:[^'\\]|\\.)*'/;
const _DQ  = /^"(?:[^"\\]|\\.)*"/;
const _BQ  = /^`(?:[^`\\]|\\.)*`/;
const _BCMT = /^\/\*[\s\S]*?\*\//;
const _LCMT = /^\/\/[^\n]*/;
const _HCMT = /^#[^\n]*/;
const _NUM  = /^\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/;
const _FN   = /^[a-zA-Z_$][\w$]*(?=\s*\()/;
const _CLS  = /^\b[A-Z][a-zA-Z0-9_]*\b/;
const _kw   = (s: string): RegExp => new RegExp('^\\b(' + s + ')\\b');

const _R: Record<string, _Rule[]> = {
  curl: [
    [_HCMT, 'hl-cmt'],
    [_SQ, 'hl-str'],
    [_DQ, 'hl-str'],
    [/^https?:\/\/[^\s'">) \\]+/, 'hl-url'],
    [/^--?[a-zA-Z][\w-]*/, 'hl-flag'],
    [_kw('curl|wget|echo|export|set|bash|sh|cat|grep|env|printf'), 'hl-kw'],
    [/^\$\{?[A-Za-z_]\w*\}?/, 'hl-var'],
    [_NUM, 'hl-num'],
  ],
  javascript: [
    [_BCMT, 'hl-cmt'],
    [_LCMT, 'hl-cmt'],
    [_BQ, 'hl-str'],
    [_SQ, 'hl-str'],
    [_DQ, 'hl-str'],
    [_kw('const|let|var|function|return|async|await|if|else|for|while|class|new|import|from|export|default|try|catch|finally|throw|of|in|typeof|instanceof|null|undefined|true|false|this|switch|case|break|continue|delete|void|do|yield|static|super|extends'), 'hl-kw'],
    [_kw('console|JSON|Promise|fetch|Response|Request|URL|Headers|Object|Array|String|Number|Boolean|Math|Date|Error|require|module|exports|process|Buffer|globalThis'), 'hl-type'],
    [_NUM, 'hl-num'],
    [_FN, 'hl-fn'],
  ],
  python: [
    [/^"""[\s\S]*?"""/, 'hl-str'],
    [/^'''[\s\S]*?'''/, 'hl-str'],
    [_HCMT, 'hl-cmt'],
    [/^[fFrRbB]?'(?:[^'\\]|\\.)*'/, 'hl-str'],
    [/^[fFrRbB]?"(?:[^"\\]|\\.)*"/, 'hl-str'],
    [_kw('import|from|def|class|return|if|elif|else|for|while|with|as|try|except|finally|raise|pass|break|continue|and|or|not|in|is|None|True|False|lambda|yield|global|nonlocal|del|assert|async|await'), 'hl-kw'],
    [_kw('print|len|range|str|int|float|bool|list|dict|tuple|set|requests|json|os|sys|re|super|type|object|Exception|ValueError|TypeError|AttributeError'), 'hl-type'],
    [_NUM, 'hl-num'],
    [_FN, 'hl-fn'],
    [_CLS, 'hl-cls'],
  ],
  go: [
    [_BCMT, 'hl-cmt'],
    [_LCMT, 'hl-cmt'],
    [/^`[^`]*`/, 'hl-str'],
    [_DQ, 'hl-str'],
    [_kw('package|import|func|var|const|type|struct|interface|return|if|else|for|range|go|defer|select|case|default|break|continue|switch|map|chan|make|new|nil|true|false|append|len|cap|delete|copy|close|panic|recover'), 'hl-kw'],
    [_kw('string|int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|float32|float64|bool|byte|rune|error|any|uintptr'), 'hl-type'],
    [_NUM, 'hl-num'],
    [_FN, 'hl-fn'],
    [_CLS, 'hl-cls'],
  ],
  java: [
    [_BCMT, 'hl-cmt'],
    [_LCMT, 'hl-cmt'],
    [_DQ, 'hl-str'],
    [_kw('public|private|protected|static|final|abstract|class|interface|enum|extends|implements|return|if|else|for|while|do|try|catch|finally|throw|throws|new|this|super|import|package|void|null|true|false|instanceof|switch|case|default|break|continue|synchronized|volatile'), 'hl-kw'],
    [_kw('String|Integer|Long|Double|Float|Boolean|Object|List|Map|Set|ArrayList|HashMap|HttpClient|HttpRequest|HttpResponse|Response|Request|URI|URL|System|Math|Arrays|Collections|Optional|Stream|StringBuilder'), 'hl-type'],
    [/^@[a-zA-Z]+/, 'hl-att'],
    [/^\b\d+(?:\.\d+)?[LlDdFf]?\b/, 'hl-num'],
    [_FN, 'hl-fn'],
    [_CLS, 'hl-cls'],
  ],
  php: [
    [_BCMT, 'hl-cmt'],
    [/^(?:\/\/|#)[^\n]*/, 'hl-cmt'],
    [_SQ, 'hl-str'],
    [_DQ, 'hl-str'],
    [_kw('use|namespace|class|interface|trait|extends|implements|public|private|protected|static|final|function|return|if|else|elseif|for|foreach|while|do|switch|case|default|break|continue|try|catch|finally|throw|new|echo|print|null|true|false|NULL|TRUE|FALSE|array|match|fn|yield|readonly|enum'), 'hl-kw'],
    [/^\$[a-zA-Z_][a-zA-Z0-9_]*/, 'hl-var'],
    [_NUM, 'hl-num'],
    [_FN, 'hl-fn'],
    [_CLS, 'hl-cls'],
  ],
  ruby: [
    [_HCMT, 'hl-cmt'],
    [_SQ, 'hl-str'],
    [_DQ, 'hl-str'],
    [_kw('require|require_relative|include|extend|def|class|module|end|if|elsif|else|unless|while|until|for|do|return|yield|begin|rescue|ensure|raise|then|when|case|nil|true|false|self|super|puts|print|p|pp|lambda|proc|attr_accessor|attr_reader|attr_writer'), 'hl-kw'],
    [/^:[a-zA-Z_][a-zA-Z0-9_?!]*/, 'hl-sym'],
    [/^@{1,2}[a-zA-Z_][a-zA-Z0-9_]*/, 'hl-var'],
    [_NUM, 'hl-num'],
    [/^[a-zA-Z_][a-zA-Z0-9_?!]*(?=\s*\()/, 'hl-fn'],
    [_CLS, 'hl-cls'],
  ],
  csharp: [
    [_BCMT, 'hl-cmt'],
    [_LCMT, 'hl-cmt'],
    [/^@"[^"]*"/, 'hl-str'],
    [_DQ, 'hl-str'],
    [_kw('using|namespace|class|interface|struct|enum|record|abstract|sealed|override|virtual|partial|public|private|protected|internal|static|readonly|const|new|return|if|else|for|foreach|while|do|switch|case|default|break|continue|try|catch|finally|throw|this|base|null|true|false|var|dynamic|async|await|in|out|ref|params|is|as|typeof|sizeof|nameof'), 'hl-kw'],
    [_kw('string|int|long|double|float|decimal|bool|byte|char|object|void|Task|List|Dictionary|HashSet|IEnumerable|HttpClient|HttpResponseMessage|StringContent|Uri|Console|Math|String|Array|Exception'), 'hl-type'],
    [/^\b\d+(?:\.\d+)?(?:[mMlLdDfFuU])?\b/, 'hl-num'],
    [_FN, 'hl-fn'],
    [_CLS, 'hl-cls'],
  ],
  json: [
    [/^"(?:[^"\\]|\\.)*"(?=\s*:)/, 'hl-key'],
    [_DQ, 'hl-str'],
    [_kw('true|false|null'), 'hl-kw'],
    [/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/, 'hl-num'],
  ],
};

const _LANG_MAP: Record<string, string> = {
  node: 'javascript', shell: 'curl', bash: 'curl', sh: 'curl',
  js: 'javascript', ts: 'javascript', typescript: 'javascript',
  py: 'python', golang: 'go', rb: 'ruby', 'c#': 'csharp',
  cs: 'csharp', dotnet: 'csharp',
};

function _highlight(code: string, lang: string): string {
  const key = _LANG_MAP[lang] ?? lang;
  const rules = _R[key] ?? _R['json'];
  let out = '';
  let rem = code;
  while (rem.length > 0) {
    let hit = false;
    for (const [re, cls] of rules) {
      const m = re.exec(rem);
      if (m && m.index === 0) {
        out += `<span class="${cls}">${_esc(m[0])}</span>`;
        rem = rem.slice(m[0].length);
        hit = true;
        break;
      }
    }
    if (!hit) { out += _esc(rem[0]); rem = rem.slice(1); }
  }
  return out;
}

@customElement('sl-code-samples')
export class SlCodeSamples extends LitElement {
  static override styles = [
    resetStyles,
    css`
      :host {
        display: block;
      }

      .code-samples {
        border: 1px solid #30363d;
        border-radius: var(--sl-radius-md);
        overflow: hidden;
        background: #0d1117;
      }

      .tabs {
        display: flex;
        align-items: stretch;
        border-bottom: 1px solid #30363d;
        background: #161b22;
        position: relative;
      }

      /* Hidden measurement proxy — all tabs rendered off-screen at natural width */
      .tabs-measure {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        visibility: hidden;
        display: flex;
        white-space: nowrap;
        user-select: none;
      }

      .tabs-inner {
        display: flex;
        flex: 1;
        min-width: 0;
        overflow: hidden;
      }

      .tab {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: var(--sl-spacing-sm) var(--sl-spacing-md);
        font-size: var(--sl-font-size-xs);
        font-weight: 500;
        color: #8b949e;
        white-space: nowrap;
        flex-shrink: 0;
        border-bottom: 2px solid transparent;
        transition: all var(--sl-transition-fast);
        cursor: pointer;
      }

      .tab:hover {
        color: #e6edf3;
        background: rgba(255,255,255,0.04);
      }

      .tab.active {
        color: #e6edf3;
        border-bottom-color: #58a6ff;
      }

      .tab-icon {
        display: inline-flex;
        flex-shrink: 0;
        opacity: 0.7;
      }

      .tab.active .tab-icon {
        opacity: 1;
      }

      .tab.spec-sample {
        border-left: 1px solid #30363d;
      }

      .tabs-more-wrap {
        flex-shrink: 0;
        position: relative;
        border-left: 1px solid #30363d;
        display: flex;
        align-items: stretch;
      }

      .tabs-more-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: var(--sl-spacing-sm) var(--sl-spacing-md);
        font-size: var(--sl-font-size-xs);
        font-weight: 500;
        color: #8b949e;
        white-space: nowrap;
        cursor: pointer;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        transition: all var(--sl-transition-fast);
      }

      .tabs-more-btn:hover,
      .tabs-more-btn.open {
        color: #e6edf3;
        background: rgba(255,255,255,0.04);
      }

      .tabs-dropdown {
        position: absolute;
        top: calc(100% + 4px);
        right: 0;
        z-index: 100;
        background: #1c2128;
        border: 1px solid #30363d;
        border-radius: var(--sl-radius-md);
        padding: 4px;
        min-width: 148px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      }

      .dropdown-item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 6px 10px;
        border-radius: var(--sl-radius-sm);
        font-size: var(--sl-font-size-xs);
        font-weight: 500;
        color: #8b949e;
        white-space: nowrap;
        cursor: pointer;
        background: transparent;
        border: none;
        text-align: left;
        box-sizing: border-box;
        transition: all var(--sl-transition-fast);
      }

      .dropdown-item:hover {
        color: #e6edf3;
        background: rgba(255,255,255,0.06);
      }

      .dropdown-item.active {
        color: #e6edf3;
        background: rgba(88,166,255,0.12);
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
        color: #8b949e;
        background: #21262d;
        border: 1px solid #30363d;
        transition: all var(--sl-transition-fast);
        z-index: 1;
        cursor: pointer;
      }

      .copy-btn:hover {
        color: #e6edf3;
        background: #30363d;
        border-color: #8b949e;
      }

      .copy-btn.copied {
        color: #3fb950;
        border-color: #3fb950;
      }

      pre {
        margin: 0;
        padding: var(--sl-spacing-md);
        padding-right: 80px;
        font-family: var(--sl-font-mono);
        font-size: var(--sl-font-size-sm);
        color: #e6edf3;
        background: #0d1117;
        overflow-x: auto;
        line-height: 1.65;
        max-height: 60vh;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: #484f58 #0d1117;
      }

      pre::-webkit-scrollbar { width: 6px; height: 6px; }
      pre::-webkit-scrollbar-track { background: #0d1117; }
      pre::-webkit-scrollbar-thumb { background: #484f58; border-radius: 3px; }
      pre::-webkit-scrollbar-thumb:hover { background: #6e7681; }
      pre::-webkit-scrollbar-corner { background: #0d1117; }

      code { font-family: inherit; }

      /* ── IDE syntax token colors (VS Code Dark+ palette) ── */
      .hl-kw   { color: #569cd6; }
      .hl-str  { color: #ce9178; }
      .hl-cmt  { color: #6a9955; font-style: italic; }
      .hl-num  { color: #b5cea8; }
      .hl-fn   { color: #dcdcaa; }
      .hl-var  { color: #9cdcfe; }
      .hl-type { color: #4ec9b0; }
      .hl-flag { color: #c586c0; }
      .hl-url  { color: #58a6ff; text-decoration: underline; text-underline-offset: 2px; }
      .hl-cls  { color: #4ec9b0; }
      .hl-sym  { color: #c586c0; }
      .hl-att  { color: #c586c0; }
      .hl-key  { color: #9cdcfe; }
    `,
  ];

  @property({ type: Object }) operation!: ParsedOperation;
  @property({ type: Array }) servers: ParsedServer[] = [];
  @property({ type: Object }) authState: AuthState = { apiKeys: {}, bearerTokens: {} };
  @property({ type: Array }) securitySchemes: SecurityScheme[] = [];

  @state() private _activeTab = 0;
  @state() private _snippets = new Map<string, string>();
  @state() private _copied = false;
  @state() private _overflowStart = Infinity;
  @state() private _moreOpen = false;

  private _allTabs: { id: string; label: string; isSpec: boolean }[] = [];
  private _tabNaturalWidths: number[] = [];
  private _ro?: ResizeObserver;
  private _prevOperation: ParsedOperation | null = null;
  private _dropdownPortal: HTMLDivElement | null = null;
  private _docClickHandler: EventListener | null = null;

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._ro?.disconnect();
    this._ro = undefined;
    this._closeDropdownPortal();
  }

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

  override updated(changed: Map<PropertyKey, unknown>) {
    // Reset tab measurements when the operation changes
    if (changed.has('operation') && this.operation !== this._prevOperation) {
      this._prevOperation = this.operation;
      this._tabNaturalWidths = [];
      this._overflowStart = Infinity;
    }
    // Measure proxy tab widths — runs after first render and after tab list changes
    const needsMeasure =
      this._tabNaturalWidths.length === 0 ||
      this._tabNaturalWidths.length !== this._allTabs.length;
    if (needsMeasure && this._allTabs.length > 0) {
      this._tabNaturalWidths = []; // clear stale widths so recompute sees them as fresh
      requestAnimationFrame(() => this._measureTabWidths());
    }
  }

  private _measureTabWidths() {
    // Read from the hidden proxy row — children always render at full natural width
    const measure = this.shadowRoot?.querySelector<HTMLElement>('.tabs-measure');
    if (!measure) return;
    const proxyTabs = Array.from(measure.querySelectorAll<HTMLElement>('.tab'));
    this._tabNaturalWidths = proxyTabs.map(el => el.getBoundingClientRect().width);

    if (!this._ro) {
      // Observe the outer .tabs bar — width is stable regardless of More-button presence
      const tabsEl = this.shadowRoot?.querySelector<HTMLElement>('.tabs');
      if (tabsEl) {
        this._ro = new ResizeObserver(() => this._recomputeOverflow());
        this._ro.observe(tabsEl);
      }
    }
    this._recomputeOverflow();
  }

  private _recomputeOverflow() {
    const tabsEl = this.shadowRoot?.querySelector<HTMLElement>('.tabs');
    if (!tabsEl || this._tabNaturalWidths.length === 0) return;

    const containerW = tabsEl.getBoundingClientRect().width;
    const totalNatural = this._tabNaturalWidths.reduce((a, b) => a + b, 0);

    // All tabs fit — no overflow needed
    if (totalNatural <= containerW) {
      if (this._overflowStart !== this._tabNaturalWidths.length) {
        this._overflowStart = this._tabNaturalWidths.length;
      }
      return;
    }

    // Overflow detected: reserve space for the More button, find cut-off index
    const MORE_BTN_W = 80;
    const effectiveW = containerW - MORE_BTN_W;
    let total = 0;
    let overflowAt = 0;
    for (let i = 0; i < this._tabNaturalWidths.length; i++) {
      total += this._tabNaturalWidths[i];
      if (total > effectiveW) {
        overflowAt = i;
        break;
      }
      overflowAt = i + 1;
    }
    if (overflowAt !== this._overflowStart) {
      this._overflowStart = overflowAt;
    }
  }

  private _toggleMore(e: Event) {
    e.stopPropagation();
    if (this._dropdownPortal) {
      this._closeDropdownPortal();
    } else {
      this._openDropdownPortal(e.currentTarget as HTMLElement);
    }
  }

  private _openDropdownPortal(triggerBtn: HTMLElement) {
    this._closeDropdownPortal();

    const rect = triggerBtn.getBoundingClientRect();
    const portal = document.createElement('div');

    Object.assign(portal.style, {
      position: 'fixed',
      top: `${rect.bottom + 4}px`,
      right: `${Math.round(window.innerWidth - rect.right)}px`,
      zIndex: '2147483647',
      background: '#1c2128',
      border: '1px solid #30363d',
      borderRadius: '6px',
      padding: '4px',
      minWidth: '148px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '0.75rem',
    });

    this._allTabs.slice(this._overflowStart).forEach((tab, ii) => {
      const tabIndex = this._overflowStart + ii;
      const isActive = tabIndex === this._activeTab;

      const item = document.createElement('button');
      item.textContent = tab.label + (tab.isSpec ? ' ✦' : '');
      Object.assign(item.style, {
        display: 'block',
        width: '100%',
        padding: '6px 10px',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: '500',
        color: isActive ? '#e6edf3' : '#8b949e',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        background: isActive ? 'rgba(88,166,255,0.12)' : 'transparent',
        border: 'none',
        textAlign: 'left',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
      });

      item.addEventListener('mouseenter', () => {
        if (tabIndex !== this._activeTab) {
          item.style.color = '#e6edf3';
          item.style.background = 'rgba(255,255,255,0.06)';
        }
      });
      item.addEventListener('mouseleave', () => {
        if (tabIndex !== this._activeTab) {
          item.style.color = '#8b949e';
          item.style.background = 'transparent';
        }
      });
      item.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this._activeTab = tabIndex;
        this._copied = false;
        this._closeDropdownPortal();
      });

      portal.appendChild(item);
    });

    document.body.appendChild(portal);
    this._dropdownPortal = portal;
    this._moreOpen = true;

    // Close on any outside click or scroll, deferred so the current click doesn't immediately close it
    const handler = (ev: Event) => {
      if (ev.type === 'scroll' || !portal.contains(ev.target as Node)) {
        this._closeDropdownPortal();
      }
    };
    setTimeout(() => {
      document.addEventListener('click', handler, { capture: true });
      document.addEventListener('scroll', handler, { capture: true, once: true });
      this._docClickHandler = handler;
    }, 0);
  }

  private _closeDropdownPortal() {
    if (this._dropdownPortal) {
      this._dropdownPortal.remove();
      this._dropdownPortal = null;
    }
    if (this._docClickHandler) {
      document.removeEventListener('click', this._docClickHandler, { capture: true });
      document.removeEventListener('scroll', this._docClickHandler, { capture: true });
      this._docClickHandler = null;
    }
    if (this._moreOpen) {
      this._moreOpen = false;
    }
  }

  private _onRootClick(_e: Event) { /* no-op — kept for template compat */ }

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
    const queryString: Array<{ name: string; value: string }> = this.operation.parameters
      .filter(p => p.in === 'query' && p.example !== undefined)
      .map(p => ({ name: p.name, value: String(p.example) }));

    // Headers
    const headers: Array<{ name: string; value: string }> = [];

    // Auth headers/query params — use first matching security requirement (alternatives are OR-ed)
    const secReq = this.operation.security[0];
    if (secReq) {
      for (const schemeName of Object.keys(secReq)) {
        const scheme = this.securitySchemes.find(s => s.key === schemeName);
        if (!scheme) continue;

        if (scheme.type === 'apiKey' && scheme.name) {
          const val = this.authState.apiKeys[schemeName] || '<YOUR_API_KEY>';
          if (scheme.in === 'header') {
            headers.push({ name: scheme.name, value: val });
          } else if (scheme.in === 'query') {
            queryString.push({ name: scheme.name, value: val });
          }
        } else if (scheme.type === 'http') {
          if (scheme.scheme === 'bearer') {
            const val = this.authState.bearerTokens[schemeName] || '<YOUR_TOKEN>';
            headers.push({ name: 'Authorization', value: `Bearer ${val}` });
          } else if (scheme.scheme === 'basic') {
            const val = this.authState.apiKeys[schemeName] || 'username:password';
            headers.push({ name: 'Authorization', value: `Basic ${btoa(val)}` });
          }
        } else if (scheme.type === 'oauth2' || scheme.type === 'openIdConnect') {
          const val = this.authState.bearerTokens[schemeName] || '<YOUR_ACCESS_TOKEN>';
          headers.push({ name: 'Authorization', value: `Bearer ${val}` });
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

  private _getIcon(tabId: string) {
    // For spec samples (id starts with "spec:"), use generic code icon
    if (tabId.startsWith('spec:')) {
      return svg`<svg class="tab-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M5 4L1 8l4 4M11 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    }
    const icon = LANG_ICONS[tabId];
    return icon ? html`<span class="tab-icon">${icon}</span>` : null;
  }

  private _highlightCode(code: string, tabId: string): string {
    const lang = tabId.startsWith('spec:')
      ? tabId.slice(5).toLowerCase()
      : tabId;
    return _highlight(code, lang);
  }

  override render() {
    if (!this.operation || this._allTabs.length === 0) return html``;

    const activeTabInfo = this._allTabs[this._activeTab];
    const code = activeTabInfo ? (this._snippets.get(activeTabInfo.id) ?? 'Loading…') : '';
    const hasOverflow = this._overflowStart < this._allTabs.length;

    return html`
      <div class="code-samples">
        <div class="tabs">
          <!-- Hidden proxy: all tabs at natural size, used only for measurement -->
          <div class="tabs-measure" aria-hidden="true">
            ${this._allTabs.map(tab => html`
              <button class="tab ${tab.isSpec ? 'spec-sample' : ''}" tabindex="-1">
                ${this._getIcon(tab.id)}${tab.label}${tab.isSpec ? ' ✦' : ''}
              </button>
            `)}
          </div>
          <!-- Visible tabs: the subset that fits -->
          <div class="tabs-inner">
            ${this._allTabs.slice(0, this._overflowStart).map((tab, i) => html`
              <button
                class="tab ${i === this._activeTab ? 'active' : ''} ${tab.isSpec ? 'spec-sample' : ''}"
                @click=${() => { this._activeTab = i; this._copied = false; this._closeDropdownPortal(); }}
              >${this._getIcon(tab.id)}${tab.label}${tab.isSpec ? ' ✦' : ''}</button>
            `)}
          </div>
          ${hasOverflow ? html`
            <div class="tabs-more-wrap">
              <button class="tabs-more-btn ${this._moreOpen ? 'open' : ''}" @click=${this._toggleMore}>
                More
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="${this._moreOpen ? 'M1 7l4-4 4 4' : 'M1 3l4 4 4-4'}" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          ` : null}
        </div>
        <div class="code-wrapper">
          <button class="copy-btn ${this._copied ? 'copied' : ''}" @click=${this._copy}>
            ${this._copied ? '✓ Copied' : 'Copy'}
          </button>
          <pre><code>${unsafeHTML(this._highlightCode(code, activeTabInfo?.id ?? ''))}</code></pre>
        </div>
      </div>
    `;
  }
}
