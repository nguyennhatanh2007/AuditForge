import { getDb } from '@/lib/db';
import { encryptSecret } from '@/lib/crypto';
import type { Knex } from 'knex';
import type { ConnectionTestResult } from '@/lib/connection-test';

export type ConfigSystemType = 'itop' | 'vcenter' | 'unity' | 'pure' | 'alletra';
export type ExceptionObjectType = 'vm' | 'host' | 'lun';
export type DiscrepancyObjectType = 'vm' | 'host' | 'lun';
export type DiscrepancyKind = 'missing_in_itop' | 'extra_in_itop' | 'field_mismatch';
export type DiscrepancySeverity = 'low' | 'medium' | 'high';

export type SystemConfigInput = {
  systemType: ConfigSystemType;
  name: string;
  url: string;
  username?: string | null;
  password?: string | null;
  enabled?: boolean;
  port?: number | null;
  apiPath?: string | null;
};

export type ExceptionInput = {
  objectType: ExceptionObjectType;
  identifier: string;
  sourceSystem: string;
  reason: string;
  createdBy: string;
};

export type DiscrepancyInput = {
  objectType: DiscrepancyObjectType;
  identifier: string;
  sourceSystem: string;
  type: DiscrepancyKind;
  field?: string | null;
  itopValue?: string | null;
  sourceValue?: string | null;
  severity: DiscrepancySeverity;
  summary: string;
};

export type SyncJobInput = {
  startedAt: string;
  finishedAt?: string | null;
  status: 'running' | 'success' | 'failed' | 'partial';
  totalSources: number;
  succeededSources: number;
  discrepancies: number;
  note?: string | null;
};

type SystemConfigRow = {
  id: number;
  system_type: ConfigSystemType;
  name: string;
  url: string;
  username: string | null;
  encrypted_password: string | null;
  port: number | null;
  api_path: string | null;
  last_test_status: string | null;
  last_test_code: string | null;
  last_test_message: string | null;
  enabled: number | boolean;
  last_checked_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type SystemConfigForTest = {
  id: string;
  systemType: ConfigSystemType;
  name: string;
  url: string;
  username: string | null;
  encryptedPassword: string | null;
  port: number | null;
  apiPath: string | null;
  enabled: boolean;
};

type ExceptionRow = {
  id: number;
  object_type: ExceptionObjectType;
  identifier: string;
  source_system: string;
  reason: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
};

type DiscrepancyRow = {
  id: number;
  sync_job_id: number | null;
  object_type: DiscrepancyObjectType;
  identifier: string;
  source_system: string;
  discrepancy_type: DiscrepancyKind;
  field_name: string | null;
  itop_value: string | null;
  source_value: string | null;
  severity: DiscrepancySeverity;
  summary: string;
  is_exception: number | boolean;
  created_at: Date;
  updated_at: Date;
};

type SyncJobRow = {
  id: number;
  started_at: Date;
  finished_at: Date | null;
  status: 'running' | 'success' | 'failed' | 'partial';
  total_sources: number;
  succeeded_sources: number;
  discrepancies: number;
  note: string | null;
  created_at: Date;
  updated_at: Date;
};

type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

function requireDb(): Knex {
  const db = getDb();
  if (!db) {
    throw new Error('DATABASE_NOT_CONFIGURED');
  }
  return db;
}

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function mapSystemConfig(row: SystemConfigRow) {
  return {
    id: String(row.id),
    systemType: row.system_type,
    name: row.name,
    url: row.url,
    username: row.username ?? '',
    port: row.port ?? undefined,
    apiPath: row.api_path ?? undefined,
    secretMasked: row.encrypted_password ? '••••••••' : '',
    enabled: Boolean(row.enabled),
    lastCheckedAt: toIso(row.last_checked_at) ?? undefined,
    lastTestStatus: row.last_test_status ?? undefined,
    lastTestCode: row.last_test_code ?? undefined,
    lastTestMessage: row.last_test_message ?? undefined,
  };
}

function mapException(row: ExceptionRow) {
  return {
    id: String(row.id),
    objectType: row.object_type,
    identifier: row.identifier,
    sourceSystem: row.source_system,
    reason: row.reason,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function mapDiscrepancy(row: DiscrepancyRow) {
  return {
    id: String(row.id),
    objectType: row.object_type,
    identifier: row.identifier,
    sourceSystem: row.source_system,
    type: row.discrepancy_type,
    field: row.field_name ?? undefined,
    itopValue: row.itop_value ?? undefined,
    sourceValue: row.source_value ?? undefined,
    severity: row.severity,
    summary: row.summary,
    createdAt: row.created_at.toISOString(),
    isException: Boolean(row.is_exception),
  };
}

function mapSyncJob(row: SyncJobRow) {
  return {
    id: String(row.id),
    startedAt: row.started_at.toISOString(),
    finishedAt: row.finished_at ? row.finished_at.toISOString() : undefined,
    status: row.status,
    totalSources: row.total_sources,
    succeededSources: row.succeeded_sources,
    discrepancies: row.discrepancies,
    note: row.note ?? undefined,
  };
}

export async function listSystemConfigs(search = '') {
  const db = requireDb();
  const rows = await db<SystemConfigRow>('system_configs')
    .modify((builder) => {
      if (search.trim()) {
        builder.where((inner) => {
          inner.where('name', 'like', `%${search}%`).orWhere('url', 'like', `%${search}%`);
        });
      }
    })
    .orderBy('updated_at', 'desc');
  return rows.map(mapSystemConfig);
}

export async function createSystemConfig(input: SystemConfigInput) {
  const db = requireDb();
  const payload = {
    system_type: input.systemType,
    name: input.name,
    url: input.url,
    username: input.username ?? null,
    encrypted_password: input.password ? encryptSecret(input.password) : null,
    enabled: input.enabled ?? true,
    port: input.port ?? null,
    api_path: input.apiPath ?? null,
  };
  const [id] = await db('system_configs').insert(payload);
  const row = await db<SystemConfigRow>('system_configs').where({ id }).first();
  return row ? mapSystemConfig(row) : null;
}

export async function updateSystemConfig(id: number, input: Partial<SystemConfigInput>) {
  const db = requireDb();
  const payload: Record<string, string | number | boolean | null> = {};
  if (input.systemType) payload.system_type = input.systemType;
  if (input.name !== undefined) payload.name = input.name;
  if (input.url !== undefined) payload.url = input.url;
  if (input.username !== undefined) payload.username = input.username ?? null;
  if (input.password !== undefined) payload.encrypted_password = input.password ? encryptSecret(input.password) : null;
  if (input.enabled !== undefined) payload.enabled = input.enabled;
  if (input.port !== undefined) payload.port = input.port ?? null;
  if (input.apiPath !== undefined) payload.api_path = input.apiPath ?? null;
  await db('system_configs').where({ id }).update(payload);
  const row = await db<SystemConfigRow>('system_configs').where({ id }).first();
  return row ? mapSystemConfig(row) : null;
}

export async function deleteSystemConfig(id: number) {
  const db = requireDb();
  return db('system_configs').where({ id }).delete();
}

export async function getSystemConfigForTest(id: number): Promise<SystemConfigForTest | null> {
  const db = requireDb();
  const row = await db<SystemConfigRow>('system_configs').where({ id }).first();
  if (!row) return null;
  return {
    id: String(row.id),
    systemType: row.system_type,
    name: row.name,
    url: row.url,
    username: row.username,
    encryptedPassword: row.encrypted_password,
    port: row.port,
    apiPath: row.api_path,
    enabled: Boolean(row.enabled),
  };
}

export async function recordSystemConfigTestOutcome(id: number, result: ConnectionTestResult) {
  const db = requireDb();
  await db('system_configs').where({ id }).update({
    last_checked_at: new Date().toISOString(),
    last_test_status: result.ok ? 'success' : 'failed',
    last_test_code: result.code ?? null,
    last_test_message: `${result.message} ${result.details}`.trim().slice(0, 2000),
  });
}

export async function listSyncJobs(limit = 20) {
  const db = requireDb();
  const rows = await db<SyncJobRow>('sync_jobs').orderBy('started_at', 'desc').limit(limit);
  return rows.map(mapSyncJob);
}

export async function getLatestSyncJobId() {
  const db = requireDb();
  const row = await db<SyncJobRow>('sync_jobs').orderBy('started_at', 'desc').first();
  return row ? row.id : null;
}

export async function createSyncJob(input: SyncJobInput) {
  const db = requireDb();
  const [id] = await db('sync_jobs').insert({
    started_at: input.startedAt,
    finished_at: input.finishedAt ?? null,
    status: input.status,
    total_sources: input.totalSources,
    succeeded_sources: input.succeededSources,
    discrepancies: input.discrepancies,
    note: input.note ?? null,
  });
  const row = await db<SyncJobRow>('sync_jobs').where({ id }).first();
  return row ? mapSyncJob(row) : null;
}

export async function updateSyncJob(id: number, input: Partial<SyncJobInput>) {
  const db = requireDb();
  const payload: Record<string, string | number | null> = {};
  if (input.startedAt !== undefined) payload.started_at = input.startedAt;
  if (input.finishedAt !== undefined) payload.finished_at = input.finishedAt ?? null;
  if (input.status !== undefined) payload.status = input.status;
  if (input.totalSources !== undefined) payload.total_sources = input.totalSources;
  if (input.succeededSources !== undefined) payload.succeeded_sources = input.succeededSources;
  if (input.discrepancies !== undefined) payload.discrepancies = input.discrepancies;
  if (input.note !== undefined) payload.note = input.note ?? null;
  await db('sync_jobs').where({ id }).update(payload);
  const row = await db<SyncJobRow>('sync_jobs').where({ id }).first();
  return row ? mapSyncJob(row) : null;
}

export async function deleteDiscrepanciesBySyncJob(syncJobId: number) {
  const db = requireDb();
  return db('discrepancies').where({ sync_job_id: syncJobId }).delete();
}

export async function insertDiscrepancies(syncJobId: number, items: DiscrepancyInput[]) {
  const db = requireDb();
  if (!items.length) {
    return [];
  }

  const rows = items.map((item) => ({
    sync_job_id: syncJobId,
    object_type: item.objectType,
    identifier: item.identifier,
    source_system: item.sourceSystem,
    discrepancy_type: item.type,
    field_name: item.field ?? null,
    itop_value: item.itopValue ?? null,
    source_value: item.sourceValue ?? null,
    severity: item.severity,
    summary: item.summary,
    is_exception: false,
  }));

  return db('discrepancies').insert(rows);
}

export async function listExceptions(search = '') {
  const db = requireDb();
  const rows = await db<ExceptionRow>('exceptions')
    .modify((builder) => {
      if (search.trim()) {
        builder.where((inner) => {
          inner
            .where('identifier', 'like', `%${search}%`)
            .orWhere('source_system', 'like', `%${search}%`)
            .orWhere('reason', 'like', `%${search}%`);
        });
      }
    })
    .orderBy('updated_at', 'desc');
  return rows.map(mapException);
}

export async function createException(input: ExceptionInput) {
  const db = requireDb();
  const [id] = await db('exceptions').insert({
    object_type: input.objectType,
    identifier: input.identifier,
    source_system: input.sourceSystem,
    reason: input.reason,
    created_by: input.createdBy,
  });
  const row = await db<ExceptionRow>('exceptions').where({ id }).first();
  return row ? mapException(row) : null;
}

export async function updateException(id: number, input: Partial<ExceptionInput>) {
  const db = requireDb();
  const payload: Record<string, string> = {};
  if (input.objectType) payload.object_type = input.objectType;
  if (input.identifier !== undefined) payload.identifier = input.identifier;
  if (input.sourceSystem !== undefined) payload.source_system = input.sourceSystem;
  if (input.reason !== undefined) payload.reason = input.reason;
  if (input.createdBy !== undefined) payload.created_by = input.createdBy;
  await db('exceptions').where({ id }).update(payload);
  const row = await db<ExceptionRow>('exceptions').where({ id }).first();
  return row ? mapException(row) : null;
}

export async function deleteException(id: number) {
  const db = requireDb();
  return db('exceptions').where({ id }).delete();
}

export async function listDiscrepancies(params: {
  search?: string;
  objectType?: DiscrepancyObjectType | 'all';
  type?: DiscrepancyKind | 'all';
  page?: number;
  pageSize?: number;
  syncJobId?: number | null;
}) {
  const db = requireDb();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 10));
  const query = db<DiscrepancyRow>({ discrepancies: 'discrepancies' })
    .select('discrepancies.*')
    .modify((builder) => {
      if (params.syncJobId) {
        builder.where('discrepancies.sync_job_id', params.syncJobId);
      }
    });

  if (params.search?.trim()) {
    query.where((builder) => {
      builder
        .where('discrepancies.identifier', 'like', `%${params.search?.trim()}%`)
        .orWhere('discrepancies.summary', 'like', `%${params.search?.trim()}%`)
        .orWhere('discrepancies.source_system', 'like', `%${params.search?.trim()}%`);
    });
  }

  if (params.objectType && params.objectType !== 'all') {
    query.where('discrepancies.object_type', params.objectType);
  }

  if (params.type && params.type !== 'all') {
    query.where('discrepancies.discrepancy_type', params.type);
  }

  query.whereNotExists(function existsClause() {
    this.select(requireDb().raw('1'))
      .from({ exceptions: 'exceptions' })
      .whereRaw('exceptions.object_type = discrepancies.object_type')
      .whereRaw('exceptions.identifier = discrepancies.identifier')
      .whereRaw('exceptions.source_system = discrepancies.source_system');
  });

  const totalRow = await query.clone().clearSelect().count<{ total: string }[]>({ total: '*' }).first();
  const rows = await query.orderBy('discrepancies.updated_at', 'desc').limit(pageSize).offset((page - 1) * pageSize);

  return {
    items: rows.map(mapDiscrepancy),
    total: Number(totalRow?.total ?? 0),
    page,
    pageSize,
  } satisfies PageResult<ReturnType<typeof mapDiscrepancy>>;
}

export async function createDiscrepancy(input: DiscrepancyInput) {
  const db = requireDb();
  const [id] = await db('discrepancies').insert({
    sync_job_id: null,
    object_type: input.objectType,
    identifier: input.identifier,
    source_system: input.sourceSystem,
    discrepancy_type: input.type,
    field_name: input.field ?? null,
    itop_value: input.itopValue ?? null,
    source_value: input.sourceValue ?? null,
    severity: input.severity,
    summary: input.summary,
    is_exception: false,
  });
  const row = await db<DiscrepancyRow>('discrepancies').where({ id }).first();
  return row ? mapDiscrepancy(row) : null;
}

export async function updateDiscrepancy(id: number, input: Partial<DiscrepancyInput>) {
  const db = requireDb();
  const payload: Record<string, string | null> = {};
  if (input.objectType) payload.object_type = input.objectType;
  if (input.identifier !== undefined) payload.identifier = input.identifier;
  if (input.sourceSystem !== undefined) payload.source_system = input.sourceSystem;
  if (input.type !== undefined) payload.discrepancy_type = input.type;
  if (input.field !== undefined) payload.field_name = input.field ?? null;
  if (input.itopValue !== undefined) payload.itop_value = input.itopValue ?? null;
  if (input.sourceValue !== undefined) payload.source_value = input.sourceValue ?? null;
  if (input.severity !== undefined) payload.severity = input.severity;
  if (input.summary !== undefined) payload.summary = input.summary;
  await db('discrepancies').where({ id }).update(payload);
  const row = await db<DiscrepancyRow>('discrepancies').where({ id }).first();
  return row ? mapDiscrepancy(row) : null;
}

export async function deleteDiscrepancy(id: number) {
  const db = requireDb();
  return db('discrepancies').where({ id }).delete();
}

export async function markDiscrepancyAsException(id: number, reason: string, createdBy: string) {
  const db = requireDb();
  const discrepancy = await db<DiscrepancyRow>('discrepancies').where({ id }).first();
  if (!discrepancy) {
    return null;
  }

  const [exceptionId] = await db('exceptions').insert({
    object_type: discrepancy.object_type,
    identifier: discrepancy.identifier,
    source_system: discrepancy.source_system,
    reason,
    created_by: createdBy,
  });

  await db('discrepancies').where({ id }).update({ is_exception: true });
  const exception = await db<ExceptionRow>('exceptions').where({ id: exceptionId }).first();
  return exception ? mapException(exception) : null;
}
