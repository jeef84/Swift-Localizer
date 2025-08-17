#!/usr/bin/env node
import { Command } from 'commander';
import { readCatalog, writeCatalog } from './fs.js';
import { scanCatalog } from './scan.js';
import { validateCatalog } from './validate.js';
import { runTranslate } from './translate.js';
import { repairPlaceholdersInCatalog } from './repair.js';
import { runProofread } from './proofread.js';
import { enforceFormality } from './formality.js';
import { suggestProofreading } from './suggest.js';
import 'dotenv/config';

const program = new Command();

program
  .name('swift-localizer')
  .description('Scan, validate, and translate Xcode .xcstrings catalogs')
  .version('1.0.0');

program
  .command('scan')
  .requiredOption('--in <path>', 'Path to .xcstrings')
  .option('--langs <list>', 'Comma separated language codes')
  .action((opts) => {
    const catalog = readCatalog(opts.in);
    const langs = parseLangsOrAll(opts.langs, catalog);
    const res = scanCatalog(catalog, langs);
    console.log(JSON.stringify(res, null, 2));
  });

program
  .command('validate')
  .requiredOption('--in <path>', 'Path to .xcstrings')
  .option('--langs <list>', 'Comma separated language codes')
  .action((opts) => {
    const catalog = readCatalog(opts.in);
    const langs = parseLangsOrAll(opts.langs, catalog);
    const report = validateCatalog(catalog, langs);
    console.log(JSON.stringify(report, null, 2));
    if (report.issues.length > 0) process.exitCode = 2;
  });

program
  .command('translate')
  .requiredOption('--in <path>', 'Path to .xcstrings input')
  .option('--out <path>', 'Output path (defaults to overwrite input)')
  .option('--langs <list>', 'Comma separated language codes')
  .option('--model <model>', 'OpenAI model', 'gpt-4.1-nano')
  .option('--concurrency <n>', 'Parallel requests', (v) => parseInt(v, 10))
  .option('--batch-size <n>', 'Items per call', (v) => parseInt(v, 10))
  .option('--max-keys <n>', 'Limit keys per language for pilot runs', (v) => parseInt(v, 10))
  .option('--only-empties', 'Translate only empty entries', false)
  .option('--include-keys <list>', 'Comma-separated list of keys to include')
  .option('--dry-run', 'Do not write changes, only simulate', false)
  .action(async (opts) => {
    const inputPath = opts.in as string;
    const outputPath = (opts.out as string) || inputPath;
    const catalog = readCatalog(inputPath);
    const langs = parseLangsOrAll(opts.langs, catalog);
    const updated = await runTranslate(catalog, {
      langs,
      model: opts.model,
      concurrency: opts.concurrency,
      batchSize: opts['batchSize'],
      maxKeys: opts['maxKeys'],
      onlyEmpties: !!opts['onlyEmpties'],
      includeKeys: opts['includeKeys'] ? String(opts['includeKeys']).split(',') : undefined,
      dryRun: !!opts['dryRun'],
      inPath: inputPath,
      outPath: outputPath,
    });
    if (!opts['dryRun']) writeCatalog(outputPath, updated);
  });

program
  .command('repair-placeholders')
  .requiredOption('--in <path>', 'Path to .xcstrings input')
  .option('--out <path>', 'Output path (defaults to overwrite input)')
  .option('--langs <list>', 'Comma separated language codes')
  .action((opts) => {
    const inputPath = opts.in as string;
    const outputPath = (opts.out as string) || inputPath;
    const catalog = readCatalog(inputPath);
    const langs = parseLangsOrAll(opts.langs, catalog);
    const { fixed, total } = repairPlaceholdersInCatalog(catalog, langs);
    writeCatalog(outputPath, catalog);
    console.log(JSON.stringify({ fixed, total }));
    if (fixed < total) process.exitCode = 3;
  });

program
  .command('proofread')
  .requiredOption('--in <path>', 'Path to .xcstrings input')
  .option('--out <path>', 'Output path (defaults to overwrite input)')
  .option('--langs <list>', 'Comma separated language codes')
  .option('--fix-placeholders', 'Auto-fix positional placeholder mismatches', true)
  .option('--fill-empties', 'Attempt to translate empty entries', false)
  .option('--model <model>', 'OpenAI model', 'gpt-4.1-nano')
  .option('--concurrency <n>', 'Parallel requests', (v) => parseInt(v, 10))
  .option('--batch-size <n>', 'Items per call', (v) => parseInt(v, 10))
  .action(async (opts) => {
    const inputPath = opts.in as string;
    const outputPath = (opts.out as string) || inputPath;
    const catalog = readCatalog(inputPath);
    const langs = parseLangsOrAll(opts.langs, catalog);
    const report = await runProofread(catalog, {
      langs,
      fixPlaceholders: !!opts['fixPlaceholders'],
      fillEmpties: !!opts['fillEmpties'],
      model: opts.model,
      concurrency: opts.concurrency,
      batchSize: opts['batchSize'],
    });
    writeCatalog(outputPath, catalog);
    console.log(JSON.stringify(report, null, 2));
    if (report.finalIssueCount > 0) process.exitCode = 4;
  });

program
  .command('formality')
  .requiredOption('--in <path>', 'Path to .xcstrings input')
  .option('--out <path>', 'Output path (defaults to overwrite input)')
  .requiredOption('--lang <code>', 'Language code (e.g., zh-Hans, ko)')
  .requiredOption('--register <formal|informal>', 'Desired register (formal or informal)')
  .option('--model <model>', 'OpenAI model', 'gpt-4.1-nano')
  .option('--include-keys <list>', 'Comma-separated list of keys to include')
  .action(async (opts) => {
    const inputPath = opts.in as string;
    const outputPath = (opts.out as string) || inputPath;
    const catalog = readCatalog(inputPath);
    const res = await enforceFormality(catalog, {
      lang: String(opts.lang),
      formality: String(opts.register) as 'formal' | 'informal',
      model: String(opts.model),
      keys: opts['includeKeys'] ? String(opts['includeKeys']).split(',') : (opts['include-keys'] ? String(opts['include-keys']).split(',') : undefined),
    });
    writeCatalog(outputPath, catalog);
    console.log(JSON.stringify(res, null, 2));
  });

program
  .command('suggest')
  .requiredOption('--in <path>', 'Path to .xcstrings input')
  .option('--out <path>', 'Output path (write if --apply is set; defaults to overwrite input)')
  .requiredOption('--lang <code>', 'Language code to proofread (e.g., de, zh-Hans)')
  .option('--include-keys <list>', 'Comma-separated list of keys to include')
  .option('--max-keys <n>', 'Limit keys for sampling', (v) => parseInt(v, 10))
  .option('--apply', 'Apply safe suggestions that preserve placeholders', false)
  .option('--model <model>', 'OpenAI model', 'gpt-4.1-nano')
  .action(async (opts) => {
    const inputPath = opts.in as string;
    const outputPath = (opts.out as string) || inputPath;
    const catalog = readCatalog(inputPath);
    const res = await suggestProofreading(catalog, {
      lang: String(opts.lang),
      model: String(opts.model),
      includeKeys: opts['includeKeys'] ? String(opts['includeKeys']).split(',') : (opts['include-keys'] ? String(opts['include-keys']).split(',') : undefined),
      maxKeys: opts['maxKeys'],
      apply: !!opts['apply'],
    });
    if (opts['apply']) writeCatalog(outputPath, catalog);
    console.log(JSON.stringify(res, null, 2));
  });

program.parseAsync().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});

function parseLangsOrAll(input: unknown, catalog: import('./types.js').XCStringsCatalog): string[] {
  const explicit = typeof input === 'string' ? input.split(',').map(s => s.trim()).filter(Boolean) : [];
  if (explicit.length > 0) return explicit;
  const set = new Set<string>();
  const keys = Object.keys(catalog.strings || {});
  for (const key of keys) {
    const entry = catalog.strings[key];
    if (!entry || !entry.localizations) continue;
    for (const lang of Object.keys(entry.localizations)) {
      if (lang && lang !== catalog.sourceLanguage) set.add(lang);
    }
  }
  return Array.from(set).sort();
}


