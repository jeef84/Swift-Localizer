export type LanguageCode = string; // e.g. 'en', 'ko', 'es-419'

export interface XCStringsCatalog {
  sourceLanguage: LanguageCode;
  strings: Record<string, XCStringEntry>;
  version?: string;
}

export interface XCStringEntry {
  localizations: Record<LanguageCode, {
    stringUnit?: { state?: string; value?: string };
    // Future: plural, attributes, etc.
  }>;
  // Optional metadata in Apple's format can include 'devLanguage', 'comment', etc.
}

export interface ScanResult {
  totalKeys: number;
  untranslatedByLang: Record<LanguageCode, number>;
  staleByLang: Record<LanguageCode, number>;
  missingLangs: LanguageCode[];
}

export interface TranslateOptions {
  langs: LanguageCode[];
  model: string;
  maxCostUSD?: number;
  concurrency?: number;
  batchSize?: number;
  maxKeys?: number; // limit number of keys per language for pilot runs
  onlyEmpties?: boolean; // restrict to empty translations only
  includeKeys?: string[]; // optional explicit keys to include
  dryRun?: boolean;
  cachePath?: string;
  inPath: string;
  outPath?: string;
  glossaryPath?: string;
  dntPath?: string;
}

export interface ValidationIssue {
  key: string;
  lang: LanguageCode;
  type: 'placeholder-mismatch' | 'invalid-icu' | 'length-anomaly' | 'empty';
  details: string;
}

export interface ValidationReport {
  issues: ValidationIssue[];
}


