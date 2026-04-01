import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import type {
  OASDocument,
  ParsedSpec,
  ParsedOperation,
  ParsedParameter,
  ParsedRequestBody,
  ParsedResponse,
  ParsedMediaType,
  ParsedServer,
  SecurityScheme,
  TagGroup,
  HttpMethod,
  CodeSample,
  SecurityRequirement,
} from './types.js';
import { HTTP_METHODS } from './types.js';

/**
 * Parse an OpenAPI spec from a URL string or inline object.
 * Returns a fully dereferenced and normalized ParsedSpec.
 */
export async function parseSpec(source: string | object): Promise<ParsedSpec> {
  const raw = await SwaggerParser.dereference(source as string) as OASDocument;
  return normalizeSpec(raw);
}

function normalizeSpec(doc: OASDocument): ParsedSpec {
  const info = doc.info;
  const servers = (doc.servers ?? []).map(normalizeServer);
  const securitySchemes = extractSecuritySchemes(doc);
  const globalSecurity = (doc.security ?? []) as SecurityRequirement[];

  // Build operations grouped by tag
  const operationsByTag = new Map<string, ParsedOperation[]>();
  const tagMeta = new Map<string, string>();

  // Collect tag descriptions
  for (const tag of doc.tags ?? []) {
    tagMeta.set(tag.name, tag.description ?? '');
  }

  const allOperations: ParsedOperation[] = [];
  let unnamedCounter = 0;

  const paths = doc.paths ?? {};
  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;
    const pi = pathItem as OpenAPIV3.PathItemObject;

    // Path-level parameters
    const pathParams = (pi.parameters ?? []) as OpenAPIV3.ParameterObject[];

    for (const method of HTTP_METHODS) {
      const operation = pi[method] as OpenAPIV3.OperationObject | undefined;
      if (!operation) continue;

      const operationId = operation.operationId || `unnamed-${++unnamedCounter}-${method}-${path}`;
      const tags = operation.tags?.length ? operation.tags : ['default'];

      const parsed = normalizeOperation(
        operationId, path, method, operation, pathParams, servers, globalSecurity
      );

      allOperations.push(parsed);

      for (const tag of tags) {
        if (!operationsByTag.has(tag)) {
          operationsByTag.set(tag, []);
        }
        operationsByTag.get(tag)!.push(parsed);
      }
    }
  }

  // Build tag groups in tag definition order, then remaining
  const tagOrder = (doc.tags ?? []).map(t => t.name);
  const seenTags = new Set<string>();
  const tagGroups: TagGroup[] = [];

  for (const tagName of tagOrder) {
    seenTags.add(tagName);
    const ops = operationsByTag.get(tagName);
    if (ops?.length) {
      tagGroups.push({
        name: tagName,
        description: tagMeta.get(tagName) ?? '',
        operations: ops,
      });
    }
  }

  // Any remaining tags not in the tags array
  for (const [tagName, ops] of operationsByTag) {
    if (!seenTags.has(tagName) && ops.length) {
      tagGroups.push({
        name: tagName,
        description: tagMeta.get(tagName) ?? '',
        operations: ops,
      });
    }
  }

  const externalDocs = (doc as OpenAPIV3.Document).externalDocs
    ? { url: (doc as OpenAPIV3.Document).externalDocs!.url, description: (doc as OpenAPIV3.Document).externalDocs!.description ?? '' }
    : null;

  return {
    title: info.title,
    version: info.version,
    description: info.description ?? '',
    contact: info.contact ? { name: info.contact.name, url: info.contact.url, email: info.contact.email } : null,
    license: info.license ? { name: info.license.name, url: (info.license as OpenAPIV3.LicenseObject).url } : null,
    termsOfService: info.termsOfService ?? '',
    servers,
    securitySchemes,
    globalSecurity,
    tagGroups,
    allOperations,
    externalDocs,
    raw: doc,
  };
}

function normalizeServer(server: OpenAPIV3.ServerObject): ParsedServer {
  const variables: ParsedServer['variables'] = {};
  for (const [key, val] of Object.entries(server.variables ?? {})) {
    variables[key] = {
      default: val.default,
      enum: val.enum,
      description: val.description ?? '',
    };
  }
  return {
    url: server.url,
    description: server.description ?? '',
    variables,
  };
}

function extractSecuritySchemes(doc: OASDocument): SecurityScheme[] {
  const schemes: SecurityScheme[] = [];
  const components = (doc as OpenAPIV3.Document).components;
  if (!components?.securitySchemes) return schemes;

  for (const [key, scheme] of Object.entries(components.securitySchemes)) {
    const s = scheme as OpenAPIV3.SecuritySchemeObject;
    schemes.push({
      key,
      type: s.type as SecurityScheme['type'],
      name: (s as OpenAPIV3.ApiKeySecurityScheme).name,
      in: (s as OpenAPIV3.ApiKeySecurityScheme).in as SecurityScheme['in'],
      scheme: (s as OpenAPIV3.HttpSecurityScheme).scheme,
      bearerFormat: (s as OpenAPIV3.HttpSecurityScheme).bearerFormat,
      description: s.description ?? '',
    });
  }
  return schemes;
}

function normalizeOperation(
  operationId: string,
  path: string,
  method: HttpMethod,
  operation: OpenAPIV3.OperationObject,
  pathParams: OpenAPIV3.ParameterObject[],
  globalServers: ParsedServer[],
  _globalSecurity: SecurityRequirement[],
): ParsedOperation {
  // Merge path-level + operation-level parameters (operation takes precedence)
  const mergedParams = new Map<string, OpenAPIV3.ParameterObject>();
  for (const p of pathParams) {
    mergedParams.set(`${p.in}:${p.name}`, p);
  }
  for (const p of (operation.parameters ?? []) as OpenAPIV3.ParameterObject[]) {
    mergedParams.set(`${p.in}:${p.name}`, p);
  }

  const parameters: ParsedParameter[] = Array.from(mergedParams.values()).map(p => ({
    name: p.name,
    in: p.in as ParsedParameter['in'],
    required: p.required ?? false,
    deprecated: p.deprecated ?? false,
    description: p.description ?? '',
    schema: (p.schema as object) ?? null,
    example: p.example ?? (p.schema as OpenAPIV3.SchemaObject)?.example ?? undefined,
  }));

  // Request body
  let requestBody: ParsedRequestBody | null = null;
  if (operation.requestBody) {
    const rb = operation.requestBody as OpenAPIV3.RequestBodyObject;
    requestBody = {
      required: rb.required ?? false,
      description: rb.description ?? '',
      content: normalizeContent(rb.content),
    };
  }

  // Responses
  const responses: ParsedResponse[] = [];
  for (const [statusCode, resp] of Object.entries(operation.responses ?? {})) {
    const r = resp as OpenAPIV3.ResponseObject;
    const headers: ParsedResponse['headers'] = {};
    for (const [hName, hVal] of Object.entries(r.headers ?? {})) {
      const h = hVal as OpenAPIV3.HeaderObject;
      headers[hName] = {
        description: h.description ?? '',
        schema: (h.schema as object) ?? null,
      };
    }
    responses.push({
      statusCode,
      description: r.description ?? '',
      headers,
      content: r.content ? normalizeContent(r.content) : [],
    });
  }

  // Sort responses: 2xx first, then 3xx, 4xx, 5xx, then default
  responses.sort((a, b) => {
    if (a.statusCode === 'default') return 1;
    if (b.statusCode === 'default') return -1;
    return a.statusCode.localeCompare(b.statusCode);
  });

  // Code samples from vendor extension
  const codeSamples: CodeSample[] = [];
  const xSamples = (operation as Record<string, unknown>)['x-codeSamples']
    ?? (operation as Record<string, unknown>)['x-code-samples'];
  if (Array.isArray(xSamples)) {
    for (const s of xSamples) {
      if (s && typeof s === 'object' && 'lang' in s && 'source' in s) {
        codeSamples.push({
          lang: String(s.lang),
          label: String(s.label ?? s.lang),
          source: String(s.source),
        });
      }
    }
  }

  // Servers (operation-level or global)
  const servers = (operation.servers ?? []).map(normalizeServer);

  return {
    operationId,
    path,
    method,
    summary: operation.summary ?? '',
    description: operation.description ?? '',
    tags: operation.tags ?? ['default'],
    deprecated: operation.deprecated ?? false,
    parameters,
    requestBody,
    responses,
    security: (operation.security ?? _globalSecurity) as SecurityRequirement[],
    servers: servers.length > 0 ? servers : globalServers,
    codeSamples,
  };
}

function normalizeContent(content: Record<string, OpenAPIV3.MediaTypeObject>): ParsedMediaType[] {
  return Object.entries(content).map(([mediaType, mt]) => ({
    mediaType,
    schema: (mt.schema as object) ?? null,
    example: mt.example ?? undefined,
    examples: mt.examples
      ? Object.fromEntries(
          Object.entries(mt.examples).map(([k, v]) => [
            k,
            (v as OpenAPIV3.ExampleObject).value ?? v,
          ])
        )
      : {},
  }));
}
