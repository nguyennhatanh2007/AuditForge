import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { getExportRootDir, getSystemExportDir } from '@/config/storage';

export type ExportRecord = Record<string, string | number | boolean | null>;

export type ExportDataset = {
  systemName: string;
  objectType: 'vm' | 'host' | 'lun';
  records: ExportRecord[];
  sourceFile: string;
};

function isJsonFile(fileName: string) {
  return fileName.toLowerCase().endsWith('.json');
}

function isCsvFile(fileName: string) {
  return fileName.toLowerCase().endsWith('.csv');
}

function parseScalar(value: string) {
  const trimmed = value.trim();
  if (trimmed === '') return '';
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (!Number.isNaN(Number(trimmed)) && trimmed !== '') return Number(trimmed);
  return trimmed;
}

function parseCsv(content: string): ExportRecord[] {
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];

  const headers = lines[0].split(',').map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const record: ExportRecord = {};
    headers.forEach((header, index) => {
      record[header] = parseScalar(values[index] ?? '');
    });
    return record;
  });
}

async function readDatasetFile(filePath: string) {
  const raw = await readFile(filePath, 'utf8');
  if (isJsonFile(filePath)) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as ExportRecord[];
    }
    if (Array.isArray(parsed.records)) {
      return parsed.records as ExportRecord[];
    }
    return [];
  }
  if (isCsvFile(filePath)) {
    return parseCsv(raw);
  }
  return [];
}

function detectObjectType(fileName: string): 'vm' | 'host' | 'lun' | null {
  const lower = fileName.toLowerCase();
  if (lower.includes('vm')) return 'vm';
  if (lower.includes('host')) return 'host';
  if (lower.includes('lun') || lower.includes('volume')) return 'lun';
  return null;
}

export async function readExportDatasets() {
  const rootDir = getExportRootDir();
  const systems = await readdir(rootDir, { withFileTypes: true }).catch(() => []);
  const datasets: ExportDataset[] = [];

  for (const systemEntry of systems) {
    if (!systemEntry.isDirectory()) {
      continue;
    }

    const systemName = systemEntry.name;
    const systemDir = getSystemExportDir(systemName);
    const files = await readdir(systemDir, { withFileTypes: true }).catch(() => []);

    for (const fileEntry of files) {
      if (!fileEntry.isFile()) {
        continue;
      }

      const objectType = detectObjectType(fileEntry.name);
      if (!objectType) {
        continue;
      }

      const sourceFile = path.join(systemDir, fileEntry.name);
      const records = await readDatasetFile(sourceFile);
      datasets.push({ systemName, objectType, records, sourceFile });
    }
  }

  return datasets;
}

export function getRecordIdentifier(record: ExportRecord, objectType: 'vm' | 'host' | 'lun') {
  const candidateKeys =
    objectType === 'lun'
      ? ['identifier', 'serial', 'name', 'lun', 'volume', 'id']
      : objectType === 'host'
        ? ['identifier', 'name', 'host', 'uuid', 'id']
        : ['identifier', 'name', 'vm', 'uuid', 'id'];

  for (const key of candidateKeys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return '';
}

export function normalizeExportValue(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value).trim();
}
