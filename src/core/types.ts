import type { OpenAPI, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

// ── Public Configuration ────────────────────────────────────────────

export interface SpecLensConfig {
  /** URL to an OpenAPI spec (JSON or YAML). */
  specUrl?: string;
  /** Inline OpenAPI spec object. Takes precedence over specUrl. */
  spec?: object;
  /** Proxy URL for Try It requests (CORS bypass). The target URL is appended. */
  proxyUrl?: string;
  /** Color theme. Defaults to 'auto' (follows prefers-color-scheme). */
  theme?: 'light' | 'dark' | 'auto';
  /** Default language for code samples. Defaults to 'curl'. */
  defaultLanguage?: string;
  /** Hide the Try It console. */
  hideTryIt?: boolean;
  /** Hide code sample panels. */
  hideCodeSamples?: boolean;
}

// ── Internal Normalized Types ───────────────────────────────────────

export type OASDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'trace';

export const HTTP_METHODS: HttpMethod[] = [
  'get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace',
];

export interface ParsedParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required: boolean;
  deprecated: boolean;
  description: string;
  schema: object | null;
  example: unknown;
}

export interface ParsedMediaType {
  mediaType: string;
  schema: object | null;
  example: unknown;
  examples: Record<string, unknown>;
}

export interface ParsedRequestBody {
  required: boolean;
  description: string;
  content: ParsedMediaType[];
}

export interface ParsedResponse {
  statusCode: string;
  description: string;
  headers: Record<string, { description: string; schema: object | null }>;
  content: ParsedMediaType[];
}

export interface ParsedOperation {
  operationId: string;
  path: string;
  method: HttpMethod;
  summary: string;
  description: string;
  tags: string[];
  deprecated: boolean;
  parameters: ParsedParameter[];
  requestBody: ParsedRequestBody | null;
  responses: ParsedResponse[];
  security: SecurityRequirement[];
  servers: ParsedServer[];
  codeSamples: CodeSample[];
}

export interface ParsedServer {
  url: string;
  description: string;
  variables: Record<string, {
    default: string;
    enum?: string[];
    description: string;
  }>;
}

export interface SecurityScheme {
  key: string;
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect' | 'mutualTLS';
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  description: string;
}

export interface SecurityRequirement {
  [schemeName: string]: string[];
}

export interface CodeSample {
  lang: string;
  label: string;
  source: string;
}

export interface TagGroup {
  name: string;
  description: string;
  operations: ParsedOperation[];
}

export interface ParsedSpec {
  title: string;
  version: string;
  description: string;
  contact: { name?: string; url?: string; email?: string } | null;
  license: { name: string; url?: string } | null;
  termsOfService: string;
  servers: ParsedServer[];
  securitySchemes: SecurityScheme[];
  globalSecurity: SecurityRequirement[];
  tagGroups: TagGroup[];
  allOperations: ParsedOperation[];
  externalDocs: { url: string; description: string } | null;
  raw: OASDocument;
}

// ── Search Types ────────────────────────────────────────────────────

export interface SearchResult {
  operationId: string;
  path: string;
  method: HttpMethod;
  summary: string;
  tags: string[];
  score: number;
}

// ── Search Engine Interface ──────────────────────────────────────

export interface SearchEngine {
  search(query: string): SearchResult[];
  autoSuggest(query: string): string[];
}

// ── Auth State ──────────────────────────────────────────────────────

export interface AuthState {
  /** API key values keyed by security scheme name. */
  apiKeys: Record<string, string>;
  /** Bearer token values keyed by security scheme name. */
  bearerTokens: Record<string, string>;
}
