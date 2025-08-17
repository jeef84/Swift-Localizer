import type { LanguageCode, XCStringsCatalog } from './types.js';
import { createOpenAIClient } from './openai.js';

export interface ProofreadSuggestion {
  key: string;
  category: 'grammar' | 'preposition' | 'wrong-translation' | 'tone' | 'punctuation' | 'terminology' | 'other';
  reason: string;
  replacement: string;
}

const placeholderRegex = /(%(?:\d+\$)?(?:lld|ld|d|f|lf|@))|(\\\([^)]+\))/g;

function extractPlaceholders(text: string): string[] {
  if (!text) return [];
  const out: string[] = [];
  for (const m of text.matchAll(placeholderRegex)) {
    if (m[0]) out.push(m[0]);
  }
  return out.sort();
}

function placeholdersMatch(a: string, b: string): boolean {
  return extractPlaceholders(a).join('|') === extractPlaceholders(b).join('|');
}

export interface SuggestOptions {
  lang: LanguageCode;
  model: string;
  includeKeys?: string[];
  maxKeys?: number;
  apply?: boolean;
}

export async function suggestProofreading(catalog: XCStringsCatalog, opts: SuggestOptions) {
  const client = createOpenAIClient();
  const keys = Object.keys(catalog.strings).filter(k => !opts.includeKeys || opts.includeKeys.includes(k));
  const limitedKeys = typeof opts.maxKeys === 'number' ? keys.slice(0, Math.max(0, opts.maxKeys)) : keys;

  const batch: Array<{ key: string; source: string; target: string }> = [];
  for (const key of limitedKeys) {
    const entry = catalog.strings[key];
    const source = entry.localizations?.[catalog.sourceLanguage]?.stringUnit?.value ?? '';
    const target = entry.localizations?.[opts.lang]?.stringUnit?.value ?? '';
    if (!target) continue; // skip empties here
    batch.push({ key, source, target });
  }

  if (batch.length === 0) return { suggestions: [] as ProofreadSuggestion[], applied: 0 };

  const system = `You are a senior localization copy editor. Review ${opts.lang} UI strings for: grammar, prepositions, terminology, tone/register consistency, punctuation. Keep meaning. Preserve placeholders exactly (%d, %1$@, %lld, and Swift interpolation like \\(...)). Return only JSON { suggestions: [{key, category, reason, replacement}] }.`;
  const user = { lang: opts.lang, items: batch };

  const resp = await client.responses.create({
    model: opts.model,
    temperature: 0.1,
    input: [
      { role: 'system', content: [{ type: 'input_text', text: system }] },
      { role: 'user', content: [{ type: 'input_text', text: JSON.stringify(user) }] },
    ],
  });

  const text = (resp as any).output_text ?? (resp as any).output?.[0]?.content?.[0]?.text;
  if (!text || typeof text !== 'string') throw new Error('Unexpected OpenAI response format');

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw e;
    parsed = JSON.parse(m[0]);
  }

  const suggestions: ProofreadSuggestion[] = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];

  let applied = 0;
  if (opts.apply) {
    for (const s of suggestions) {
      const entry = catalog.strings[s.key];
      if (!entry) continue;
      const current = entry.localizations?.[opts.lang]?.stringUnit?.value ?? '';
      if (!current) continue;
      if (!placeholdersMatch(current, s.replacement)) continue; // safety
      const e: any = entry as any;
      e.localizations = e.localizations || {};
      e.localizations[opts.lang] = e.localizations[opts.lang] || {};
      e.localizations[opts.lang].stringUnit = { state: 'translated', value: String(s.replacement).trim() };
      applied++;
    }
  }

  return { suggestions, applied };
}


