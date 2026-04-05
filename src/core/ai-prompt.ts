import type { ParsedOperation } from './types.js';

const MAX_PROMPT_LENGTH = 6000;

export type AiTarget = 'chatgpt' | 'claude';

export function generateAiPrompt(op: ParsedOperation): string {
  const lines: string[] = [];

  lines.push(`I'm working with the following REST API endpoint and need help understanding how to use it correctly.\n`);

  // Method + path
  lines.push(`## Endpoint`);
  lines.push(`**${op.method.toUpperCase()} ${op.path}**`);
  if (op.summary) lines.push(`\n${op.summary}`);
  if (op.description) lines.push(`\n${op.description}`);

  // Parameters
  if (op.parameters.length > 0) {
    lines.push(`\n## Parameters`);
    for (const p of op.parameters) {
      const flags: string[] = [];
      if (p.required) flags.push('required');
      if (p.deprecated) flags.push('deprecated');
      const type = p.schema ? (p.schema as Record<string, unknown>).type ?? 'any' : 'any';
      const enumVals = p.schema ? (p.schema as Record<string, unknown>).enum as string[] | undefined : undefined;

      let line = `- **${p.name}** (${p.in}, ${type}${flags.length ? ', ' + flags.join(', ') : ''})`;
      if (p.description) line += `: ${p.description}`;
      if (enumVals?.length) line += ` — Allowed values: ${enumVals.join(', ')}`;
      if (p.example !== undefined) line += ` — Example: \`${JSON.stringify(p.example)}\``;
      lines.push(line);
    }
  }

  // Request body
  if (op.requestBody) {
    lines.push(`\n## Request Body${op.requestBody.required ? ' (required)' : ''}`);
    if (op.requestBody.description) lines.push(op.requestBody.description);
    for (const content of op.requestBody.content) {
      lines.push(`\nContent-Type: \`${content.mediaType}\``);
      if (content.schema) {
        const schemaStr = JSON.stringify(content.schema, null, 2);
        if (schemaStr.length < 2000) {
          lines.push('```json');
          lines.push(schemaStr);
          lines.push('```');
        } else {
          lines.push('Schema: (large schema, key properties shown)');
          const props = (content.schema as Record<string, unknown>).properties as Record<string, unknown> | undefined;
          if (props) {
            for (const [key, val] of Object.entries(props)) {
              const t = (val as Record<string, unknown>)?.type ?? 'object';
              lines.push(`- ${key}: ${t}`);
            }
          }
        }
      }
      if (content.example !== undefined) {
        lines.push(`\nExample:\n\`\`\`json\n${JSON.stringify(content.example, null, 2)}\n\`\`\``);
      }
    }
  }

  // Responses
  if (op.responses.length > 0) {
    lines.push(`\n## Responses`);
    for (const r of op.responses) {
      lines.push(`\n### ${r.statusCode}${r.description ? ' — ' + r.description : ''}`);
      for (const content of r.content) {
        if (content.schema) {
          const schemaStr = JSON.stringify(content.schema, null, 2);
          if (schemaStr.length < 1500) {
            lines.push(`\`${content.mediaType}\`\n\`\`\`json\n${schemaStr}\n\`\`\``);
          } else {
            lines.push(`\`${content.mediaType}\` — (large schema)`);
          }
        }
      }
    }
  }

  // Security
  if (op.security.length > 0) {
    lines.push(`\n## Authentication`);
    for (const req of op.security) {
      const schemes = Object.entries(req).map(([name, scopes]) =>
        scopes.length > 0 ? `${name} (scopes: ${scopes.join(', ')})` : name
      );
      lines.push(`- ${schemes.join(' + ')}`);
    }
  }

  lines.push(`\nPlease help me understand this endpoint, write an example request, and explain the expected response.`);

  let prompt = lines.join('\n');

  // Truncate if needed to stay within safe URL length limits
  if (prompt.length > MAX_PROMPT_LENGTH) {
    prompt = prompt.slice(0, MAX_PROMPT_LENGTH - 3) + '...';
  }

  return prompt;
}

export function buildAiUrl(prompt: string, target: AiTarget): string {
  const encoded = encodeURIComponent(prompt);
  switch (target) {
    case 'chatgpt':
      return `https://chatgpt.com/?q=${encoded}`;
    case 'claude':
      return `https://claude.ai/new?q=${encoded}`;
  }
}
