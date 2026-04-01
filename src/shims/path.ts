// Minimal shim for Node.js 'path' module used by swagger-parser
export function resolve(...parts: string[]): string {
  // In browser context, join URL-like paths
  return parts.reduce((resolved, part) => {
    if (part.startsWith('/') || part.match(/^https?:\/\//)) return part;
    return resolved.replace(/\/?$/, '/') + part;
  }, '');
}

export function join(...parts: string[]): string {
  return parts.filter(Boolean).join('/').replace(/\/+/g, '/');
}

export function dirname(p: string): string {
  const idx = p.lastIndexOf('/');
  return idx >= 0 ? p.substring(0, idx) : '.';
}

export function basename(p: string, ext?: string): string {
  const base = p.split('/').pop() ?? p;
  if (ext && base.endsWith(ext)) {
    return base.slice(0, -ext.length);
  }
  return base;
}

export function extname(p: string): string {
  const base = basename(p);
  const idx = base.lastIndexOf('.');
  return idx > 0 ? base.substring(idx) : '';
}

export function isAbsolute(p: string): boolean {
  return p.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(p) || /^https?:\/\//.test(p);
}

export const posix = { resolve, join, dirname, basename, extname, isAbsolute, sep: '/' };
export const sep = '/';

export default { resolve, join, dirname, basename, extname, isAbsolute, posix, sep };
