# SpecLens

A modern, lightweight OpenAPI documentation renderer built as a web component. Drop it into any page via CDN — no build step required.

> **Version:** 0.3.0

## Features

- **Zero-dependency usage** — single script tag, works in any framework or plain HTML
- **Web component** — `<spec-lens>` custom element with Shadow DOM style isolation
- **Try It console** — live API request execution with support for JSON, `multipart/form-data`, and `application/x-www-form-urlencoded` bodies
- **Code samples** — generated snippets for cURL, JavaScript, Python, Node.js, Go, Java, PHP, Ruby, and C#
- **Full-text search** — fast in-page search powered by MiniSearch, covering both operations and guides
- **Guides** — built-in documentation tab with category sidebar; load guides from an external JSON manifest or inline via config
- **Ask AI** — one-click buttons on every operation to open a structured prompt in ChatGPT or Claude
- **Copy route** — hover a route header to copy its deeplink hash to the clipboard
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
  guidesUrl: '/guides.json', // optional guides manifest
});
```

### npm

```bash
npm install @michaelmishin/speclens
```

## Guides

SpecLens can render a **Guides** section alongside the API reference. When guides are configured, a top-level tab bar appears in the header to switch between _API Reference_ and _Guides_.

### External manifest (recommended)

Create a JSON file that is an array of guide objects and point `guides-url` (or `guidesUrl` in `SpecLens.init()`) at it:

```html
<spec-lens spec-url="/openapi.json" guides-url="/guides.json"></spec-lens>
```

```json
[
  { "title": "Getting Started", "slug": "getting-started", "url": "/docs/getting-started.md", "category": "Basics", "order": 1 },
  { "title": "Authentication",  "slug": "authentication",  "url": "/docs/authentication.md",  "category": "Basics", "order": 2 },
  { "title": "Pagination",      "slug": "pagination",      "url": "/docs/pagination.md",      "category": "Advanced", "order": 1 }
]
```

Each guide is fetched and rendered from its `url` (a Markdown file). You can also embed content inline by omitting `url` and providing a `content` string.

### Guide object fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Display title shown in sidebar and page header |
| `slug` | string | URL-safe identifier — used in hash routing `#/guide/{slug}` |
| `url` | string | URL to a Markdown file to fetch |
| `content` | string | Inline Markdown content (takes precedence over `url`) |
| `category` | string | Sidebar group name (defaults to _General_) |
| `order` | number | Sort order within the category |

### Inline guides via config

```js
SpecLens.init('#docs', {
  specUrl: '/openapi.json',
  guides: [
    { title: 'Getting Started', slug: 'getting-started', content: '# Hello\nWelcome!', category: 'Basics' },
  ],
});
```

Inline guides and an external manifest can be combined — inline guides override on slug collision.

## Ask AI

Every operation header includes an **Ask AI** button that generates a structured Markdown prompt describing the endpoint (method, path, parameters, request body, responses) and opens it in ChatGPT or Claude.

To hide the button, add the `hide-ask-ai` attribute:

```html
<spec-lens spec-url="/openapi.json" hide-ask-ai></spec-lens>
```

Or via config:

```js
SpecLens.init('#docs', { specUrl: '/openapi.json', hideAskAi: true });
```

## Customization

### Layout Modes

Use the `layout` attribute to control how SpecLens integrates with the surrounding page.

| Value | Behavior |
|-------|----------|
| `page` (default) | Renders its own sticky header with title, Authorize, and theme toggle. Best for standalone CDN use. |
| `embed` | Suppresses the header entirely. The sidebar starts at the top of the container, and an Authorize button appears at the bottom of the sidebar when the API has security schemes. Use this when embedding inside an existing app that already has a navbar. |

```html
<!-- Standalone page -->
<spec-lens layout="page" spec-url="/openapi.json"></spec-lens>

<!-- Inside an existing app with its own navbar -->
<spec-lens layout="embed" spec-url="/openapi.json"></spec-lens>
```

### Named Slots (page mode)

In `layout="page"` mode, the header exposes two named slots for customization:

| Slot | Replaces |
|------|----------|
| `logo` | The API title + version badge in the header |
| `header-actions` | Additional items in the header action row, placed before the theme toggle |

```html
<spec-lens spec-url="/openapi.json">
  <!-- Replace the title/version with your own logo -->
  <img slot="logo" src="/my-logo.svg" alt="My API" height="28" />

  <!-- Add extra nav items next to the theme toggle -->
  <a slot="header-actions" href="/changelog">Changelog</a>
</spec-lens>
```

### Programmatic Theme Control

In `layout="embed"` mode the theme toggle button is not visible. Use the `setTheme()` method or the `theme` attribute to control it from the host app:

```js
const docs = document.querySelector('spec-lens');

// Programmatic method
docs.setTheme('dark');   // 'light' | 'dark' | 'auto'

// Or set the attribute
docs.setAttribute('theme', 'dark');
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

The demo page (`index.html`) loads the Petstore spec from `demo/petstore.json` and a guides manifest from `demo/guides.json`.

## Architecture

| Path | Purpose |
|------|---------|
| `src/index.ts` | Entry point — registers `<spec-lens>`, exports `SpecLens.init()` |
| `src/spec-lens.ts` | Root orchestrator Lit component |
| `src/core/` | Parser, router (hash-based), full-text search, theme utilities, guides loader, AI prompt builder |
| `src/components/guides/` | `sl-guide-sidebar` and `sl-guide-view` Lit components |
| `src/components/layout/` | Header (with nav tabs and global search trigger), sidebar, search overlay |
| `src/components/operation/` | Operation detail, parameters, request body, responses, Try-It console, Ask AI |
| `src/components/` | Auth, code samples, schema renderer |
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
