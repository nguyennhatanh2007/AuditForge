import { decryptSecret } from '@/lib/crypto';
import { getDb } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { StorageConnectionConfig, StorageSystemType } from '@/lib/storage-types';

type StoredDbConfig = {
  id: number;
  system_type: StorageSystemType;
  name: string;
  url: string;
  username: string | null;
  encrypted_password: string | null;
  port: number | null;
  api_path: string | null;
  enabled: number | boolean;
};

async function resolveDbConfigs() {
  const db = getDb();
  if (!db) {
    logger.warn('Storage config DB lookup skipped because database is unavailable');
    return [] as StorageConnectionConfig[];
  }

  logger.debug('Loading storage configs from database', { systemTypes: ['unity', 'pure', 'alletra'] });
  const rows = (await db<StoredDbConfig>('system_configs')
    .select('*')
    .whereIn('system_type', ['unity', 'pure', 'alletra'])
    .orderBy('updated_at', 'desc')) as StoredDbConfig[];

  logger.debug('Loaded storage configs from database', { count: rows.length });

  return rows.map((row) => ({
    id: String(row.id),
    sourceSystem: row.name,
    systemType: row.system_type,
    name: row.name,
    url: row.url,
    username: row.username ?? undefined,
    password: row.encrypted_password ? decryptSecret(row.encrypted_password) : undefined,
    port: row.port ?? undefined,
    apiPath: row.api_path ?? undefined,
    enabled: Boolean(row.enabled),
  }));
}

export async function resolveStorageConfigs() {
  logger.debug('Resolving storage configs from database');
  return resolveDbConfigs();
}

export async function resolveStorageConfigBySource(sourceSystem: string) {
  const configs = await resolveStorageConfigs();
  const normalized = sourceSystem.trim().toLowerCase();
  return configs.find((config) => config.sourceSystem.toLowerCase() === normalized || config.name?.toLowerCase() === normalized || config.id?.toLowerCase() === normalized) ?? null;
}

export async function resolveStorageConfigById(id: string) {
  const configs = await resolveStorageConfigs();
  return configs.find((config) => config.id === id) ?? null;
}

export async function resolveStoragePassword(config: StorageConnectionConfig) {
  if (config.password) {
    logger.debug('Using inline storage password', { sourceSystem: config.sourceSystem, systemType: config.systemType });
    return config.password;
  }

  logger.debug('No storage password provided on config', { sourceSystem: config.sourceSystem, systemType: config.systemType });
  return undefined;
}