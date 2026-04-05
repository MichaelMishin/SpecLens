export type RouteInfo =
  | { type: 'operation'; id: string }
  | { type: 'guide'; slug: string };

/**
 * Hash-based router for deep linking to operations and guides.
 * Formats: #/operation/{operationId} | #/guide/{slug}
 */
export class Router {
  private _callback: (route: RouteInfo) => void;
  private _onHashChange = () => this.handleCurrentRoute();

  constructor(onNavigate: (route: RouteInfo) => void) {
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

    const opMatch = hash.match(/^#\/operation\/(.+)$/);
    if (opMatch) {
      this._callback({ type: 'operation', id: decodeURIComponent(opMatch[1]) });
      return;
    }

    const guideMatch = hash.match(/^#\/guide\/(.+)$/);
    if (guideMatch) {
      this._callback({ type: 'guide', slug: decodeURIComponent(guideMatch[1]) });
    }
  }

  navigateTo(operationId: string): void {
    const hash = `#/operation/${encodeURIComponent(operationId)}`;
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    } else {
      this._callback({ type: 'operation', id: operationId });
    }
  }

  navigateToGuide(slug: string): void {
    const hash = `#/guide/${encodeURIComponent(slug)}`;
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    } else {
      this._callback({ type: 'guide', slug });
    }
  }

  static buildHash(operationId: string): string {
    return `#/operation/${encodeURIComponent(operationId)}`;
  }

  static buildGuideHash(slug: string): string {
    return `#/guide/${encodeURIComponent(slug)}`;
  }
}
