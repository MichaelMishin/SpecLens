// Minimal shim for Node.js 'util' module used by @jsdevtools/ono
export function inspect(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2) ?? String(obj);
  } catch {
    return String(obj);
  }
}

export function format(fmt: string, ...args: unknown[]): string {
  let i = 0;
  return fmt.replace(/%[sdj%]/g, (match) => {
    if (match === '%%') return '%';
    if (i >= args.length) return match;
    const val = args[i++];
    if (match === '%s') return String(val);
    if (match === '%d') return String(Number(val));
    if (match === '%j') {
      try { return JSON.stringify(val); } catch { return '[Circular]'; }
    }
    return String(val);
  });
}

export function inherits(ctor: Function, superCtor: Function): void {
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: { value: ctor, writable: true, configurable: true },
  });
}

export default { inspect, format, inherits };
