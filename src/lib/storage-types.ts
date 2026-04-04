export type StorageSystemType = 'unity' | 'pure' | 'alletra';

export type StorageConnectionConfig = {
  id?: string;
  sourceSystem: string;
  systemType: StorageSystemType;
  name?: string;
  url: string;
  username?: string;
  password?: string;
  passwordFile?: string;
  port?: number | null;
  apiPath?: string | null;
  enabled?: boolean;
};

export type StorageCapacityMetrics = {
  totalBytes?: number | null;
  usedBytes?: number | null;
  freeBytes?: number | null;
  provisionedBytes?: number | null;
  usableBytes?: number | null;
  dataReduction?: number | string | null;
  thinProvisioning?: number | string | null;
  thickProvisioning?: number | string | null;
  totalReduction?: number | string | null;
};

export type StorageSummary = {
  id?: string;
  sourceSystem: string;
  systemType: StorageSystemType;
  name: string;
  url: string;
  lastFetch: string;
  counts: {
    arrays: number;
    pools: number;
    luns: number;
    hosts: number;
  };
  capacity: StorageCapacityMetrics;
  raw: Record<string, unknown>;
};

export type StorageLunRecord = {
  id?: string;
  sourceSystem: string;
  systemType: StorageSystemType;
  name: string;
  wwn: string;
  host: string;
  sizeBytes: number | null;
  sizeLabel: string;
  provisioning: 'thin' | 'thick' | 'mixed' | 'unknown';
  creator: string;
  raw: Record<string, unknown>;
};

export type StorageSnapshot = {
  config: StorageConnectionConfig;
  summary: StorageSummary;
  luns: StorageLunRecord[];
};