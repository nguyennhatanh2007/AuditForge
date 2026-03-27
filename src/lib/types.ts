export type ObjectType = 'vm' | 'host' | 'lun';

export type DiscrepancyType = 'missing_in_itop' | 'extra_in_itop' | 'field_mismatch';

export type SystemType = 'itop' | 'vcenter' | 'unity' | 'pure' | 'alletra';

export type SyncJobStatus = 'running' | 'success' | 'failed' | 'partial';

export type DiscrepancyRecord = {
  id: string;
  objectType: ObjectType;
  identifier: string;
  sourceSystem: string;
  type: DiscrepancyType;
  field?: string;
  itopValue?: string;
  sourceValue?: string;
  severity: 'low' | 'medium' | 'high';
  summary: string;
  createdAt: string;
};

export type ExceptionRecord = {
  id: string;
  objectType: ObjectType;
  identifier: string;
  sourceSystem: string;
  reason: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type SystemConfigRecord = {
  id: string;
  systemType: SystemType;
  name: string;
  url: string;
  username?: string;
  secretMasked: string;
  enabled: boolean;
  lastCheckedAt?: string;
};

export type SyncJobRecord = {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: SyncJobStatus;
  totalSources: number;
  succeededSources: number;
  discrepancies: number;
  note?: string;
};
