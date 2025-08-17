import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { XCStringsCatalog } from './types.js';

export function readJsonFile<T>(path: string): T {
  const raw = readFileSync(path, 'utf8');
  return JSON.parse(raw) as T;
}

export function writeJsonFile(path: string, data: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export function readCatalog(path: string): XCStringsCatalog {
  return readJsonFile<XCStringsCatalog>(path);
}

export function writeCatalog(path: string, catalog: XCStringsCatalog) {
  writeJsonFile(path, catalog);
}


