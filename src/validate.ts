import type { ValidationIssue, ValidationReport, XCStringsCatalog } from './types.js';

const placeholderRegex = /(%(?:\d+\$)?(?:lld|ld|d|f|lf|@))|\\\([^)]+\)/g; // printf and SwiftUI interpolation

function extractPlaceholders(text: string): string[] {
  if (!text) return [];
  const out: string[] = [];
  for (const m of text.matchAll(placeholderRegex)) {
    if (m[0]) out.push(m[0]);
  }
  return out.sort();
}

export function validateCatalog(catalog: XCStringsCatalog, langs: string[]): ValidationReport {
  const issues: ValidationIssue[] = [];
  const keys = Object.keys(catalog.strings);

  for (const key of keys) {
    const entry = catalog.strings[key];
    const source = entry.localizations?.[catalog.sourceLanguage]?.stringUnit?.value ?? '';
    const srcPlaceholders = extractPlaceholders(source);

    for (const lang of langs) {
      const value = entry.localizations?.[lang]?.stringUnit?.value ?? '';
      if ((value?.trim() ?? '').length === 0) {
        issues.push({ key, lang, type: 'empty', details: 'Empty translation' });
        continue;
      }
      const tgtPlaceholders = extractPlaceholders(value);
      if (srcPlaceholders.join('|') !== tgtPlaceholders.join('|')) {
        issues.push({ key, lang, type: 'placeholder-mismatch', details: `src=[${srcPlaceholders.join(', ')}] tgt=[${tgtPlaceholders.join(', ')}]` });
      }
      if (value.length > Math.max(120, Math.ceil((source?.length ?? 0) * 3))) {
        issues.push({ key, lang, type: 'length-anomaly', details: `len=${value.length} vs src=${source?.length ?? 0}` });
      }
    }
  }

  return { issues };
}


