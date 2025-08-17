import type { LanguageCode, XCStringsCatalog } from './types.js';
import { validateCatalog } from './validate.js';
import { repairPlaceholdersInCatalog } from './repair.js';
import { runTranslate } from './translate.js';

export interface ProofreadOptions {
  langs: LanguageCode[];
  fixPlaceholders?: boolean; // default true
  fillEmpties?: boolean; // default false
  // translate options when filling empties
  model?: string;
  concurrency?: number;
  batchSize?: number;
}

export async function runProofread(catalog: XCStringsCatalog, opts: ProofreadOptions) {
  const initial = validateCatalog(catalog, opts.langs);

  let fixedPlaceholders = 0;
  let totalPlaceholderIssues = 0;
  if (opts.fixPlaceholders !== false) {
    const beforeIssues = initial.issues.filter(i => i.type === 'placeholder-mismatch').length;
    const res = repairPlaceholdersInCatalog(catalog, opts.langs);
    fixedPlaceholders = res.fixed;
    totalPlaceholderIssues = beforeIssues;
  }

  if (opts.fillEmpties) {
    await runTranslate(catalog, {
      langs: opts.langs,
      model: opts.model ?? 'gpt-4.1-nano',
      concurrency: opts.concurrency ?? 4,
      batchSize: opts.batchSize ?? 10,
      onlyEmpties: true,
      inPath: '',
    });
  }

  const final = validateCatalog(catalog, opts.langs);

  return {
    initialIssueCount: initial.issues.length,
    finalIssueCount: final.issues.length,
    fixedPlaceholders,
    totalPlaceholderIssues,
    remainingIssues: final.issues,
  };
}


