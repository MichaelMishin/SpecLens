import type { ParsedOperation } from './types.js';

// ChatGPT and Claude both support ?q= / ?q= URL params but have URL length limits.
// encodeURIComponent() can triple the byte count for non-ASCII.
// ~8 000 encoded chars is safe across both platforms without server-side rejections.
const SAFE_ENCODED_LENGTH = 8000;

export type AiTarget = 'chatgpt' | 'claude';
export type AiOpenResult = 'url' | 'clipboard';

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
      const schema = p.schema as Record<string, unknown> | null;
      const type = schema?.type ?? 'any';
      const enumVals = schema?.enum as string[] | undefined;

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
        lines.push('```json');
        lines.push(schemaStr);
        lines.push('```');
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
          lines.push(`\`${content.mediaType}\`\n\`\`\`json\n${schemaStr}\n\`\`\``);
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

  return lines.join('\n');
}

function _baseUrl(target: AiTarget): string {
  return target === 'chatgpt' ? 'https://chatgpt.com/' : 'https://claude.ai/new';
}

/**
 * Opens the AI chat with the prompt.
 * - If the URL-encoded prompt fits within safe URL limits, opens directly with ?q=.
 * - Otherwise copies the full prompt to clipboard and opens the chat homepage,
 *   returning 'clipboard' so the caller can show a hint to the user.
 */
export async function openAiWithPrompt(prompt: string, target: AiTarget): Promise<AiOpenResult> {
  const encoded = encodeURIComponent(prompt);
  if (encoded.length <= SAFE_ENCODED_LENGTH) {
    window.open(`${_baseUrl(target)}?q=${encoded}`, '_blank', 'noopener,noreferrer');
    return 'url';
  }
  // Too large for a URL — copy full prompt to clipboard and open the chat
  await navigator.clipboard.writeText(prompt);
  window.open(_baseUrl(target), '_blank', 'noopener,noreferrer');
  return 'clipboard';
}
