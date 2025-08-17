import OpenAI from 'openai';
import type { LanguageCode } from './types.js';

export function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set');
  }
  return new OpenAI({ apiKey });
}

export interface TranslationItem {
  key: string;
  source: string;
  notes?: string;
}

export async function translateBatch(
  client: OpenAI,
  items: TranslationItem[],
  targetLanguage: LanguageCode,
  model: string
): Promise<Record<string, string>> {
  const system = `You are a professional app localizer. Preserve placeholders exactly: printf like %d, %lld, %1$@, %f and Swift interpolation like \\(amount). Do not add or remove them. Return only JSON mapping keys to translated strings.`;

  const jsonSchema = {
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'Map of key to translated text',
  } as const;

  const user = { targetLanguage, items };

  const resp = await client.responses.create({
    model,
    temperature: 0.2,
    input: [
      {
        role: 'system',
        content: [
          { type: 'input_text', text: system + ' Only output minified JSON object with keys and translated values.' },
        ],
      },
      {
        role: 'user',
        content: [
          { type: 'input_text', text: JSON.stringify(user) },
        ],
      },
    ],
  });

  const text = (resp as any).output_text ?? (resp as any).output?.[0]?.content?.[0]?.text;
  if (!text || typeof text !== 'string') {
    throw new Error('Unexpected OpenAI response format');
  }
  let parsed: Record<string, string> = {};
  try {
    parsed = JSON.parse(text) as Record<string, string>;
  } catch (e) {
    // Last-ditch: try to extract JSON substring
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw e;
    parsed = JSON.parse(m[0]);
  }
  // Some responses may wrap under { translations: { key: value } }
  if (parsed && typeof parsed === 'object' && 'translations' in parsed && typeof (parsed as any).translations === 'object') {
    parsed = (parsed as any).translations as Record<string, string>;
  }

  // If the map is missing any keys, fall back to array mode and map by index
  const missing = items.filter(it => !(it.key in parsed));
  if (missing.length > 0) {
    const fallbackMap = await translateBatchArray(client, items, targetLanguage, model);
    parsed = { ...parsed, ...fallbackMap };
  }
  return parsed;
}

export interface RewriteItem {
  key: string;
  text: string;
}

export async function rewriteFormalityBatch(
  client: OpenAI,
  items: RewriteItem[],
  targetLanguage: LanguageCode,
  model: string,
  formality: 'formal' | 'informal'
): Promise<Record<string, string>> {
  const system = `You are a professional app localizer. Rewrite the provided ${targetLanguage} UI strings to ${formality} register. Preserve placeholders exactly (printf like %d, %1$@, %lld and Swift interpolation like \\(...)). Do not change meaning. Return only a JSON map key -> rewritten string.`;

  const user = { targetLanguage, formality, items };

  const resp = await client.responses.create({
    model,
    temperature: 0.1,
    input: [
      { role: 'system', content: [{ type: 'input_text', text: system }] },
      { role: 'user', content: [{ type: 'input_text', text: JSON.stringify(user) }] },
    ],
  });

  const text = (resp as any).output_text ?? (resp as any).output?.[0]?.content?.[0]?.text;
  if (!text || typeof text !== 'string') {
    throw new Error('Unexpected OpenAI response format');
  }
  let parsed: Record<string, string> = {};
  try {
    parsed = JSON.parse(text) as Record<string, string>;
  } catch (e) {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw e;
    parsed = JSON.parse(m[0]);
  }
  if (parsed && typeof parsed === 'object' && 'translations' in parsed && typeof (parsed as any).translations === 'object') {
    parsed = (parsed as any).translations as Record<string, string>;
  }
  return parsed;
}

async function translateBatchArray(
  client: OpenAI,
  items: TranslationItem[],
  targetLanguage: LanguageCode,
  model: string
): Promise<Record<string, string>> {
  const system = `You are a professional app localizer. Preserve placeholders exactly: printf like %d, %lld, %1$@, %f and Swift interpolation like \\(amount). Do not add or remove them. Output a JSON array of translated strings in the same order as the input. Do not include keys or any extra text.`;

  const user = {
    targetLanguage,
    sourceStrings: items.map(i => i.source),
  };

  const resp = await client.responses.create({
    model,
    temperature: 0.2,
    input: [
      {
        role: 'system',
        content: [
          { type: 'input_text', text: system + ' Only output a minified JSON array of strings.' },
        ],
      },
      {
        role: 'user',
        content: [
          { type: 'input_text', text: JSON.stringify(user) },
        ],
      },
    ],
  });

  const text = (resp as any).output_text ?? (resp as any).output?.[0]?.content?.[0]?.text;
  if (!text || typeof text !== 'string') {
    throw new Error('Unexpected OpenAI response format');
  }
  let arr: unknown;
  try {
    arr = JSON.parse(text);
  } catch (e) {
    const m = text.match(/\[[\s\S]*\]/);
    if (!m) throw e;
    arr = JSON.parse(m[0]);
  }
  if (!Array.isArray(arr)) {
    throw new Error('Expected JSON array in array mode');
  }
  const out: Record<string, string> = {};
  for (let i = 0; i < items.length && i < (arr as any[]).length; i++) {
    out[items[i].key] = String((arr as any[])[i] ?? '').trim();
  }
  return out;
}


