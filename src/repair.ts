import type { LanguageCode, XCStringsCatalog } from './types.js';

// Match printf tokens (with optional positional index) and Swift interpolation \(var)
const placeholderRegex = /(%(?:\d+\$)?(?:lld|ld|d|f|lf|@))|(\\\([^)]+\))/g;

function extractOrderedPrintfPlaceholders(text: string): string[] {
  if (!text) return [];
  const out: string[] = [];
  for (const m of text.matchAll(placeholderRegex)) {
    const token = m[0];
    if (token.startsWith('%')) out.push(token);
  }
  return out;
}

function hasPlaceholderMismatch(source: string, target: string): boolean {
  const src = extractOrderedPrintfPlaceholders(source).slice().sort().join('|');
  const tgt = extractOrderedPrintfPlaceholders(target).slice().sort().join('|');
  return src !== tgt;
}

function repairValueUsingSourcePlaceholders(source: string, target: string): string | null {
  const srcTokens = extractOrderedPrintfPlaceholders(source);
  const tgtTokens = extractOrderedPrintfPlaceholders(target);
  if (srcTokens.length === 0) return null;
  if (srcTokens.length !== tgtTokens.length) return null;

  let i = 0;
  const repaired = target.replace(placeholderRegex, (match) => {
    if (match.startsWith('%')) {
      const replacement = srcTokens[i++] ?? match;
      return replacement;
    }
    return match; // keep Swift interpolation as-is
  });
  return repaired;
}

export function repairPlaceholdersInCatalog(catalog: XCStringsCatalog, langs: LanguageCode[]): { fixed: number; total: number } {
  let total = 0;
  let fixed = 0;
  const keys = Object.keys(catalog.strings);
  for (const key of keys) {
    const entry = catalog.strings[key];
    const source = entry.localizations?.[catalog.sourceLanguage]?.stringUnit?.value ?? '';
    if (!source) continue;
    for (const lang of langs) {
      const value = entry.localizations?.[lang]?.stringUnit?.value ?? '';
      if (!value) continue; // leave empties to translate step
      if (!hasPlaceholderMismatch(source, value)) continue;
      total++;
      const repaired = repairValueUsingSourcePlaceholders(source, value);
      if (repaired && repaired !== value) {
        const e: any = entry as any;
        e.localizations = e.localizations || {};
        e.localizations[lang] = e.localizations[lang] || {};
        e.localizations[lang].stringUnit = {
          state: 'translated',
          value: repaired,
        };
        fixed++;
      }
    }
  }
  return { fixed, total };
}



