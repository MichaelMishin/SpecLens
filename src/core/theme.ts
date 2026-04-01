import type { LitElement } from 'lit';

const STORAGE_KEY = 'speclens-theme';

export type ResolvedTheme = 'light' | 'dark';

/**
 * Manages theme state: auto-detects system preference, persists choice,
 * and reflects the resolved theme onto the host element.
 */
export class ThemeManager {
  private _host: LitElement;
  private _preference: 'light' | 'dark' | 'auto' = 'auto';
  private _mediaQuery: MediaQueryList | null = null;
  private _mediaListener = () => this._apply();

  resolved: ResolvedTheme = 'light';

  constructor(host: LitElement) {
    this._host = host;
  }

  init(preference: 'light' | 'dark' | 'auto'): void {
    // Check localStorage for saved preference
    const stored = this._readStorage();
    this._preference = stored ?? preference;

    // Listen for system theme changes
    this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._mediaQuery.addEventListener('change', this._mediaListener);

    this._apply();
  }

  destroy(): void {
    this._mediaQuery?.removeEventListener('change', this._mediaListener);
  }

  setTheme(preference: 'light' | 'dark' | 'auto'): void {
    this._preference = preference;
    this._writeStorage(preference);
    this._apply();
  }

  toggle(): 'light' | 'dark' {
    const next = this.resolved === 'light' ? 'dark' : 'light';
    this.setTheme(next);
    return next;
  }

  private _apply(): void {
    if (this._preference === 'auto') {
      this.resolved = this._mediaQuery?.matches ? 'dark' : 'light';
    } else {
      this.resolved = this._preference;
    }

    this._host.setAttribute('data-theme', this.resolved);
    this._host.requestUpdate();
  }

  private _readStorage(): 'light' | 'dark' | 'auto' | null {
    try {
      const val = localStorage.getItem(STORAGE_KEY);
      if (val === 'light' || val === 'dark' || val === 'auto') return val;
    } catch { /* localStorage not available */ }
    return null;
  }

  private _writeStorage(value: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch { /* localStorage not available */ }
  }
}
