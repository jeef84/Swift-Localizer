import type { LanguageCode, ScanResult, XCStringsCatalog } from './types.js';

export function scanCatalog(catalog: XCStringsCatalog, targetLangs: LanguageCode[]): ScanResult {
  const untranslatedByLang: Record<LanguageCode, number> = {};
  const staleByLang: Record<LanguageCode, number> = {};
  const missingLangs: LanguageCode[] = [];

  const keys = Object.keys(catalog.strings);
  for (const lang of targetLangs) {
    let untranslated = 0;
    let stale = 0;

    for (const key of keys) {
      const entry = catalog.strings[key];
      const loc = entry.localizations?.[lang];
      if (!loc || !loc.stringUnit || !loc.stringUnit.value) {
        untranslated += 1;
        continue;
      }
      const value = loc.stringUnit.value?.trim() ?? '';
      if (value.length === 0) {
        untranslated += 1;
        continue;
      }
      // Staleness heuristic placeholder: compare to source when equal? Not reliable.
      // For now, mark stale if value equals source exactly but language isn't source.
      if (lang !== catalog.sourceLanguage) {
        const source = entry.localizations?.[catalog.sourceLanguage]?.stringUnit?.value ?? '';
        if (source && value === source) {
          stale += 1;
        }
      }
    }

    untranslatedByLang[lang] = untranslated;
    staleByLang[lang] = stale;
  }

  for (const lang of targetLangs) {
    // Missing entirely from any string
    const hasAny = keys.some(k => !!catalog.strings[k].localizations?.[lang]);
    if (!hasAny) missingLangs.push(lang);
  }

  return {
    totalKeys: keys.length,
    untranslatedByLang,
    staleByLang,
    missingLangs,
  };
}


