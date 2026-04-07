import type { ExportDataset, ExportRecord } from '@/lib/export-reader';
import { getRecordIdentifier, normalizeExportValue } from '@/lib/export-reader';

export type GeneratedDiscrepancy = {
  objectType: 'vm' | 'host' | 'lun';
  identifier: string;
  sourceSystem: string;
  type: 'missing_in_itop' | 'extra_in_itop' | 'field_mismatch';
  field?: string | null;
  itopValue?: string | null;
  sourceValue?: string | null;
  severity: 'low' | 'medium' | 'high';
  summary: string;
};

const comparisonFields: Record<'vm' | 'host' | 'lun', string[]> = {
  vm: ['name', 'powerState', 'serial', 'connectedHost', 'vCpu', 'ram', 'vDisk', 'datastore', 'cluster', 'size'],
  host: ['name', 'serial', 'cpu', 'ram', 'cluster', 'datastore'],
  lun: ['name', 'serial', 'size', 'datastore', 'connectedHost', 'volume'],
};

function indexByIdentifier(records: ExportRecord[], objectType: 'vm' | 'host' | 'lun') {
  const map = new Map<string, ExportRecord>();
  for (const record of records) {
    const identifier = getRecordIdentifier(record, objectType);
    if (identifier) {
      map.set(identifier, record);
    }
  }
  return map;
}

function buildSeverity(type: GeneratedDiscrepancy['type']) {
  return type === 'field_mismatch' ? 'high' : 'medium';
}

export function compareExportDatasets(datasets: ExportDataset[]) {
  const itopDatasets = datasets.filter((dataset) => dataset.systemName.toLowerCase() === 'itop');
  const sourceDatasets = datasets.filter((dataset) => dataset.systemName.toLowerCase() !== 'itop');
  const results: GeneratedDiscrepancy[] = [];

  for (const sourceDataset of sourceDatasets) {
    const itopDataset = itopDatasets.find((dataset) => dataset.objectType === sourceDataset.objectType);
    const sourceIndex = indexByIdentifier(sourceDataset.records, sourceDataset.objectType);
    const itopIndex = indexByIdentifier(itopDataset?.records ?? [], sourceDataset.objectType);

    for (const [identifier, sourceRecord] of sourceIndex.entries()) {
      const itopRecord = itopIndex.get(identifier);
      if (!itopRecord) {
        results.push({
          objectType: sourceDataset.objectType,
          identifier,
          sourceSystem: sourceDataset.systemName,
          type: 'missing_in_itop',
          severity: 'medium',
          summary: `Đối tượng có trong ${sourceDataset.systemName} nhưng chưa có trong iTop.`,
        });
        continue;
      }

      for (const field of comparisonFields[sourceDataset.objectType]) {
        const sourceValue = normalizeExportValue(sourceRecord[field]);
        const itopValue = normalizeExportValue(itopRecord[field]);
        if (sourceValue !== itopValue) {
          results.push({
            objectType: sourceDataset.objectType,
            identifier,
            sourceSystem: sourceDataset.systemName,
            type: 'field_mismatch',
            field,
            itopValue,
            sourceValue,
            severity: buildSeverity('field_mismatch'),
            summary: `Trường ${field} khác nhau giữa iTop và nguồn ${sourceDataset.systemName}.`,
          });
        }
      }
    }

    for (const [identifier] of itopIndex.entries()) {
      if (!sourceIndex.has(identifier)) {
        results.push({
          objectType: sourceDataset.objectType,
          identifier,
          sourceSystem: sourceDataset.systemName,
          type: 'extra_in_itop',
          severity: 'medium',
          summary: `Đối tượng vẫn có trong iTop nhưng không còn xuất hiện ở ${sourceDataset.systemName}.`,
        });
      }
    }
  }

  return results;
}
