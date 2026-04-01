import { css } from 'lit';

export const themeStyles = css`
  /* ── Light Theme (default) ────────────────── */
  :host,
  :host([data-theme="light"]),
  .sl-root[data-theme="light"] {
    --sl-color-primary: #6366f1;
    --sl-color-primary-hover: #4f46e5;
    --sl-color-primary-text: #ffffff;

    --sl-color-bg: #ffffff;
    --sl-color-bg-subtle: #f8fafc;
    --sl-color-surface: #ffffff;
    --sl-color-surface-raised: #f1f5f9;

    --sl-color-text: #0f172a;
    --sl-color-text-secondary: #334155;
    --sl-color-text-muted: #64748b;

    --sl-color-border: #e2e8f0;
    --sl-color-border-hover: #cbd5e1;

    --sl-color-code-bg: #f8fafc;
    --sl-color-code-text: #1e293b;

    --sl-color-success: #10b981;
    --sl-color-warning: #f59e0b;
    --sl-color-danger: #ef4444;
    --sl-color-info: #3b82f6;

    --sl-color-badge-deprecated: #f59e0b;
    --sl-color-badge-deprecated-bg: rgba(245, 158, 11, 0.1);
    --sl-color-badge-required: #ef4444;

    --sl-color-sidebar-bg: #f8fafc;
    --sl-color-sidebar-hover: #e2e8f0;
    --sl-color-sidebar-active: rgba(99, 102, 241, 0.08);

    --sl-color-overlay: rgba(0, 0, 0, 0.4);
  }

  /* ── Dark Theme ───────────────────────────── */
  :host([data-theme="dark"]),
  .sl-root[data-theme="dark"] {
    --sl-color-primary: #818cf8;
    --sl-color-primary-hover: #6366f1;
    --sl-color-primary-text: #ffffff;

    --sl-color-bg: #0f172a;
    --sl-color-bg-subtle: #1e293b;
    --sl-color-surface: #1e293b;
    --sl-color-surface-raised: #334155;

    --sl-color-text: #f1f5f9;
    --sl-color-text-secondary: #cbd5e1;
    --sl-color-text-muted: #94a3b8;

    --sl-color-border: #334155;
    --sl-color-border-hover: #475569;

    --sl-color-code-bg: #1e293b;
    --sl-color-code-text: #e2e8f0;

    --sl-color-success: #34d399;
    --sl-color-warning: #fbbf24;
    --sl-color-danger: #f87171;
    --sl-color-info: #60a5fa;

    --sl-color-badge-deprecated: #fbbf24;
    --sl-color-badge-deprecated-bg: rgba(251, 191, 36, 0.15);
    --sl-color-badge-required: #f87171;

    --sl-color-sidebar-bg: #1e293b;
    --sl-color-sidebar-hover: #334155;
    --sl-color-sidebar-active: rgba(129, 140, 248, 0.12);

    --sl-color-overlay: rgba(0, 0, 0, 0.6);

    --sl-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
    --sl-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3);
    --sl-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3);
    --sl-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
  }
`;
