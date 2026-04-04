# SpecLens

A modern, lightweight OpenAPI documentation renderer built as a web component. Drop it into any page via CDN — no build step required.

> **Version:** 0.1.2

## Features

- **Zero-dependency usage** — single script tag, works in any framework or plain HTML
- **Web component** — `<spec-lens>` custom element with Shadow DOM style isolation
- **Try It console** — live API request execution with support for JSON, `multipart/form-data`, and `application/x-www-form-urlencoded` bodies
- **Code samples** — generated snippets for cURL, JavaScript, Python, Node.js, Go, Java, PHP, Ruby, and C#
- **Full-text search** — fast in-page search powered by MiniSearch
- **Light & dark themes** — auto-detects system preference, overridable via CSS custom properties
- **OpenAPI 3.x support** — parsed and validated by `@apidevtools/swagger-parser`

## Usage

### CDN (recommended for quick start)

```html
<script src="https://unpkg.com/@michaelmishin/speclens/dist/speclens.iife.js"></script>

<spec-lens spec-url="/openapi.json"></spec-lens>
```

### ES Module

```js
import '@michaelmishin/speclens';

// or via SpecLens.init() for programmatic control
import { SpecLens } from '@michaelmishin/speclens';

SpecLens.init('#docs', {
  specUrl: '/openapi.json',
  theme: 'auto', // 'light' | 'dark' | 'auto'
});
```

### npm

```bash
npm install @michaelmishin/speclens
```

## Theming

SpecLens exposes CSS custom properties for theming from outside the Shadow DOM:

```css
spec-lens {
  --sl-color-primary: #6366f1;
  --sl-color-bg: #ffffff;
  --sl-color-text: #1a1a1a;
  --sl-font-sans: 'Inter', system-ui, sans-serif;
  --sl-font-mono: 'Fira Code', monospace;
}
```

## Development

```bash
npm install
npm run dev      # Vite dev server → http://localhost:5173
npm run build    # Produces dist/speclens.js (ESM) + dist/speclens.iife.js (IIFE)
```

The demo page (`index.html`) loads the Petstore spec from `demo/petstore.json`.

## Architecture

| Path | Purpose |
|------|---------|
| `src/index.ts` | Entry point — registers `<spec-lens>`, exports `SpecLens.init()` |
| `src/spec-lens.ts` | Root orchestrator Lit component |
| `src/core/` | Parser, router (hash-based), full-text search, theme utilities |
| `src/components/` | Lit web components (layout, operation detail, schema, code samples, auth) |
| `src/styles/` | Design tokens, theme CSS, reset — authored as Lit `css` tagged templates |
| `src/shims/` | Browser shims for Node.js `util`/`path` (required by swagger-parser) |

## Stack

- [Lit v3](https://lit.dev) — web components
- [Vite](https://vitejs.dev) — build (library mode)
- [TypeScript](https://www.typescriptlang.org)
- [@apidevtools/swagger-parser](https://github.com/APIDevTools/swagger-parser) — spec parsing & validation
- [MiniSearch](https://lucaong.github.io/minisearch/) — full-text search
- [httpsnippet-lite](https://github.com/Kong/httpsnippet) — code sample generation
- [openapi-sampler](https://github.com/Redocly/openapi-sampler) — request body example generation

## License

MIT
