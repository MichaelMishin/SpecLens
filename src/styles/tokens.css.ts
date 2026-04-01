import { css } from 'lit';

export const tokenStyles = css`
  :host {
    /* ── Typography ───────────────────────────── */
    --sl-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    --sl-font-mono: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;

    --sl-font-size-xs: 0.75rem;
    --sl-font-size-sm: 0.8125rem;
    --sl-font-size-base: 0.875rem;
    --sl-font-size-md: 1rem;
    --sl-font-size-lg: 1.125rem;
    --sl-font-size-xl: 1.5rem;
    --sl-font-size-2xl: 2rem;

    /* ── Spacing ──────────────────────────────── */
    --sl-spacing-xs: 0.25rem;
    --sl-spacing-sm: 0.5rem;
    --sl-spacing-md: 0.75rem;
    --sl-spacing-lg: 1rem;
    --sl-spacing-xl: 1.5rem;
    --sl-spacing-2xl: 2rem;
    --sl-spacing-3xl: 3rem;

    /* ── Borders & Radius ─────────────────────── */
    --sl-radius-sm: 4px;
    --sl-radius-md: 6px;
    --sl-radius-lg: 8px;
    --sl-radius-xl: 12px;
    --sl-radius-full: 9999px;

    /* ── Shadows ──────────────────────────────── */
    --sl-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --sl-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
    --sl-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
    --sl-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);

    /* ── HTTP Method Colors ───────────────────── */
    --sl-color-get: #10b981;
    --sl-color-get-bg: rgba(16, 185, 129, 0.1);
    --sl-color-post: #3b82f6;
    --sl-color-post-bg: rgba(59, 130, 246, 0.1);
    --sl-color-put: #f59e0b;
    --sl-color-put-bg: rgba(245, 158, 11, 0.1);
    --sl-color-delete: #ef4444;
    --sl-color-delete-bg: rgba(239, 68, 68, 0.1);
    --sl-color-patch: #8b5cf6;
    --sl-color-patch-bg: rgba(139, 92, 246, 0.1);
    --sl-color-options: #6b7280;
    --sl-color-options-bg: rgba(107, 114, 128, 0.1);
    --sl-color-head: #6b7280;
    --sl-color-head-bg: rgba(107, 114, 128, 0.1);
    --sl-color-trace: #6b7280;
    --sl-color-trace-bg: rgba(107, 114, 128, 0.1);

    /* ── Transitions ─────────────────────────── */
    --sl-transition-fast: 150ms ease;
    --sl-transition-base: 250ms ease;

    /* ── Layout ───────────────────────────────── */
    --sl-sidebar-width: 280px;
    --sl-header-height: 56px;
  }
`;
