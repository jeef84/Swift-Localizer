import pLimit from 'p-limit';
import type { LanguageCode, TranslateOptions, XCStringsCatalog } from './types.js';
import { translateBatch, createOpenAIClient } from './openai.js';

type BatchUnit = { key: string; source: string };

function collectWork(
  catalog: XCStringsCatalog,
  targetLang: LanguageCode[],
  maxKeys?: number,
  onlyEmpties?: boolean,
  includeKeys?: string[]
): Record<LanguageCode, BatchUnit[]> {
  const work: Record<LanguageCode, BatchUnit[]> = {} as any;
  const keys = Object.keys(catalog.strings);
  for (const lang of targetLang) {
    work[lang] = [];
    for (const key of keys) {
      if (includeKeys && includeKeys.length > 0 && !includeKeys.includes(key)) continue;
      const entry = catalog.strings[key];
      const src = entry.localizations?.[catalog.sourceLanguage]?.stringUnit?.value ?? '';
      const existing = entry.localizations?.[lang]?.stringUnit?.value ?? '';
      if (!src?.trim()) continue;
      const isEmpty = !existing || existing.trim().length === 0;
      const isEqualToSource = existing === src;
      if (onlyEmpties) {
        if (isEmpty) work[lang].push({ key, source: src });
      } else if (isEmpty || isEqualToSource) {
        work[lang].push({ key, source: src });
      }
    }
    if (typeof maxKeys === 'number') {
      work[lang] = work[lang].slice(0, Math.max(0, maxKeys));
    }
  }
  return work;
}

export async function runTranslate(catalog: XCStringsCatalog, opts: TranslateOptions): Promise<XCStringsCatalog> {
  const client = createOpenAIClient();
  const concurrency = Math.max(1, Math.min(32, opts.concurrency ?? 8));
  const batchSize = Math.max(1, Math.min(100, opts.batchSize ?? 25));
  const limiter = pLimit(concurrency);

  const work = collectWork(catalog, opts.langs, opts.maxKeys, opts.onlyEmpties, opts.includeKeys);
  const tasks: Array<Promise<void>> = [];

  for (const lang of opts.langs) {
    const items = work[lang];
    for (let i = 0; i < items.length; i += batchSize) {
      const slice = items.slice(i, i + batchSize);
      const payload = slice.map(it => ({ key: it.key, source: it.source }));
      tasks.push(
        limiter(async () => {
          if (opts.dryRun) return;
          const map = await translateBatch(client, payload, lang, opts.model);
          for (const [key, translated] of Object.entries(map)) {
            const entry = catalog.strings[key];
            if (!entry) {
              // Unknown key returned by model; skip to avoid crash
              continue;
            }
            const e: any = entry as any;
            e.localizations = e.localizations || {};
            e.localizations[lang] = e.localizations[lang] || {};
            e.localizations[lang].stringUnit = {
              state: 'translated',
              value: String(translated ?? '').trim(),
            };
          }
        })
      );
    }
  }

  await Promise.all(tasks);
  return catalog;
}


