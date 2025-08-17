import type { LanguageCode, XCStringsCatalog } from './types.js';
import { rewriteFormalityBatch, createOpenAIClient } from './openai.js';

export interface FormalityOptions {
  lang: LanguageCode;
  formality: 'formal' | 'informal';
  model: string;
  keys?: string[]; // optional subset
  batchSize?: number;
  concurrency?: number;
}

export async function enforceFormality(catalog: XCStringsCatalog, opts: FormalityOptions) {
  const client = createOpenAIClient();
  const keys = Object.keys(catalog.strings).filter(k => !opts.keys || opts.keys.includes(k));
  const batchSize = Math.max(1, Math.min(100, opts.batchSize ?? 25));
  let rewritten = 0;

  for (let i = 0; i < keys.length; i += batchSize) {
    const slice = keys.slice(i, i + batchSize);
    const items = slice.map(key => ({ key, text: catalog.strings[key].localizations[opts.lang]?.stringUnit?.value ?? '' }));
    const map = await rewriteFormalityBatch(client, items, opts.lang, opts.model, opts.formality);
    for (const [key, value] of Object.entries(map)) {
      const entry = catalog.strings[key];
      if (!entry) continue;
      const e: any = entry as any;
      e.localizations = e.localizations || {};
      e.localizations[opts.lang] = e.localizations[opts.lang] || {};
      if (typeof value === 'string' && value.trim().length > 0) {
        e.localizations[opts.lang].stringUnit = { state: 'translated', value: value.trim() };
        rewritten++;
      }
    }
  }

  return { rewritten, total: keys.length };
}


