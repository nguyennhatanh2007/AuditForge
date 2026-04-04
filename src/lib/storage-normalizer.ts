import type { StorageCapacityMetrics, StorageConnectionConfig, StorageLunRecord, StorageSummary } from '@/lib/storage-types';

function toArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function toObject(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function firstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return '';
}

function firstNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function firstValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return value;
    }
  }
  return undefined;
}

function firstPrimitiveValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function collectHostValue(record: Record<string, unknown>) {
  const directHost = firstString(record, ['host', 'host_name', 'hostname', 'attached_host_name', 'owner_host']);
  if (directHost) {
    return directHost;
  }

  const listValue = firstValue(record, ['hosts', 'attached_hosts', 'initiators', 'host_access', 'host_groups']);
  if (!listValue) {
    return '';
  }

  const list = toArray(listValue);
  if (list.length === 0) {
    return typeof listValue === 'string' ? listValue : '';
  }

  const names = list.map((item) => {
    const objectValue = toObject(item);
    return firstString(objectValue, ['name', 'host', 'host_name', 'initiator', 'wwn', 'id']) || String(item).trim();
  });

  return names.filter(Boolean).join(', ');
}

function deriveProvisioning(record: Record<string, unknown>): 'thin' | 'thick' | 'mixed' | 'unknown' {
  const provisioning = firstValue(record, ['provisioning', 'provisioning_type', 'allocation_type', 'type']);
  if (typeof provisioning === 'string' && provisioning.trim()) {
    const normalized = provisioning.trim().toLowerCase();
    if (normalized.includes('thin')) {
      return 'thin';
    }
    if (normalized.includes('thick')) {
      return 'thick';
    }
    if (normalized.includes('mix')) {
      return 'mixed';
    }
  }

  const isThin = firstValue(record, ['is_thin', 'thin', 'thin_provisioned', 'thin_provisioning']);
  const isThick = firstValue(record, ['is_thick', 'thick', 'thick_provisioned', 'thick_provisioning']);

  if (isThin === true || isThin === 'true') {
    return 'thin';
  }
  if (isThick === true || isThick === 'true') {
    return 'thick';
  }

  return 'unknown';
}

function formatBytes(value: number | null) {
  if (value === null) {
    return '-';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function normalizeCapacity(record: Record<string, unknown>): StorageCapacityMetrics {
  const totalBytes = firstNumber(record, ['total_capacity_bytes', 'total_bytes', 'total_capacity', 'capacity_bytes', 'capacity', 'size_total', 'size']);
  const usedBytes = firstNumber(record, ['used_capacity_bytes', 'used_bytes', 'used_capacity', 'used', 'total_used', 'consumed_capacity']);
  const freeBytes = firstNumber(record, ['free_capacity_bytes', 'free_bytes', 'free_capacity', 'free', 'available_capacity', 'available']);
  const provisionedBytes = firstNumber(record, ['provisioned_capacity_bytes', 'provisioned_bytes', 'provisioned_capacity', 'provisioned', 'total_provisioned', 'virtual']);
  const usableBytes = firstNumber(record, ['usable_capacity_bytes', 'usable_bytes', 'usable_capacity', 'usable']);

  return {
    totalBytes,
    usedBytes,
    freeBytes,
    provisionedBytes,
    usableBytes,
    dataReduction: firstPrimitiveValue(record, ['data_reduction', 'dataReduction', 'reduction', 'data_reduction_ratio', 'compression_ratio']) ?? null,
    thinProvisioning: firstPrimitiveValue(record, ['thin_provisioning', 'thinProvisioning']) ?? null,
    thickProvisioning: firstPrimitiveValue(record, ['thick_provisioning', 'thickProvisioning']) ?? null,
    totalReduction: firstPrimitiveValue(record, ['total_reduction', 'totalReduction']) ?? null,
  };
}

function pickSummaryRecord(raw: unknown) {
  const records = toArray(raw);
  if (records.length === 0) {
    return toObject(raw);
  }

  const candidates = records.map((item) => toObject(item));
  return candidates.sort((left, right) => {
    const leftScore = (firstNumber(left, ['total_capacity_bytes', 'total_capacity', 'capacity', 'size']) ?? 0) + (firstNumber(left, ['usable_capacity', 'usable', 'free_capacity']) ?? 0);
    const rightScore = (firstNumber(right, ['total_capacity_bytes', 'total_capacity', 'capacity', 'size']) ?? 0) + (firstNumber(right, ['usable_capacity', 'usable', 'free_capacity']) ?? 0);
    return rightScore - leftScore;
  })[0] ?? {};
}

export function normalizeStorageSummary(config: StorageConnectionConfig, payloads: {
  arrays: unknown;
  pools: unknown;
  luns: unknown;
  hosts: unknown;
}) {
  const arrayRecords = toArray(payloads.arrays).map((item) => toObject(item));
  const poolRecords = toArray(payloads.pools).map((item) => toObject(item));
  const lunRecords = toArray(payloads.luns).map((item) => toObject(item));
  const hostRecords = toArray(payloads.hosts).map((item) => toObject(item));

  const summarySource = pickSummaryRecord(arrayRecords.length > 0 ? arrayRecords : poolRecords.length > 0 ? poolRecords : lunRecords);
  const capacity = normalizeCapacity(summarySource);

  return {
    id: config.id,
    sourceSystem: config.sourceSystem,
    systemType: config.systemType,
    name: config.name || config.sourceSystem,
    url: config.url,
    lastFetch: new Date().toISOString(),
    counts: {
      arrays: arrayRecords.length,
      pools: poolRecords.length,
      luns: lunRecords.length,
      hosts: hostRecords.length,
    },
    capacity,
    raw: {
      sampleArray: arrayRecords[0] ?? {},
      samplePool: poolRecords[0] ?? {},
      sampleLun: lunRecords[0] ?? {},
      sampleHost: hostRecords[0] ?? {},
    },
  } as StorageSummary;
}

export function normalizeStorageLuns(config: StorageConnectionConfig, records: unknown): StorageLunRecord[] {
  return toArray(records).map((item, index) => {
    const record = toObject(item);
    const name = firstString(record, ['name', 'volume_name', 'lun_name', 'display_name', 'resource_name', 'id']) || `${config.sourceSystem}-lun-${index + 1}`;
    const sizeBytes = firstNumber(record, ['size_bytes', 'size', 'capacity_bytes', 'capacity', 'total_size', 'used_size', 'provisioned_size']);

    return {
      id: config.id,
      sourceSystem: config.sourceSystem,
      systemType: config.systemType,
      name,
      wwn: firstString(record, ['wwn', 'world_wide_name', 'serial', 'naa', 'id']),
      host: collectHostValue(record),
      sizeBytes,
      sizeLabel: formatBytes(sizeBytes),
      provisioning: deriveProvisioning(record),
      creator: firstString(record, ['created_by', 'creator', 'createdBy', 'owner', 'user_name', 'initiator']) || '',
      raw: record,
    };
  });
}

export function mergeStorageSnapshots(snapshots: Array<{ summary: StorageSummary; luns: StorageLunRecord[] }>) {
  return {
    arrays: snapshots,
    totals: snapshots.reduce(
      (accumulator, snapshot) => {
        accumulator.arrays += 1;
        accumulator.luns += snapshot.luns.length;
        accumulator.totalBytes += snapshot.summary.capacity.totalBytes ?? 0;
        accumulator.usedBytes += snapshot.summary.capacity.usedBytes ?? 0;
        accumulator.freeBytes += snapshot.summary.capacity.freeBytes ?? 0;
        accumulator.provisionedBytes += snapshot.summary.capacity.provisionedBytes ?? 0;
        accumulator.usableBytes += snapshot.summary.capacity.usableBytes ?? 0;
        return accumulator;
      },
      {
        arrays: 0,
        luns: 0,
        totalBytes: 0,
        usedBytes: 0,
        freeBytes: 0,
        provisionedBytes: 0,
        usableBytes: 0,
      },
    ),
  };
}