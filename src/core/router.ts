/**
 * Hash-based router for deep linking to operations.
 * Format: #/operation/{operationId} or #/tag/{tagName}
 */
export class Router {
  private _callback: (operationId: string) => void;
  private _onHashChange = () => this.handleCurrentRoute();

  constructor(onNavigate: (operationId: string) => void) {
    this._callback = onNavigate;
  }

  init(): void {
    window.addEventListener('hashchange', this._onHashChange);
  }

  destroy(): void {
    window.removeEventListener('hashchange', this._onHashChange);
  }

  handleCurrentRoute(): void {
    const hash = window.location.hash;
    if (!hash) return;

    const match = hash.match(/^#\/operation\/(.+)$/);
    if (match) {
      this._callback(decodeURIComponent(match[1]));
    }
  }

  navigateTo(operationId: string): void {
    const hash = `#/operation/${encodeURIComponent(operationId)}`;
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    } else {
      // Hash didn't change, manually trigger callback
      this._callback(operationId);
    }
  }

  static buildHash(operationId: string): string {
    return `#/operation/${encodeURIComponent(operationId)}`;
  }
}
