import { readFile } from 'node:fs/promises';
import path from 'node:path';
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

type ConfigFileEntry = Partial<StorageConnectionConfig> & {
  sourceSystem?: string;
  systemType?: StorageSystemType;
};

function normalizeSourceSystem(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function normalizeFileEntry(entry: ConfigFileEntry, index: number): StorageConnectionConfig | null {
  const systemType = entry.systemType;
  if (systemType !== 'unity' && systemType !== 'pure' && systemType !== 'alletra') {
    return null;
  }

  const sourceSystem = normalizeSourceSystem(entry.sourceSystem ?? entry.name, `${systemType}-${index + 1}`);
  const url = entry.url?.trim();
  if (!url) {
    return null;
  }

  return {
    id: entry.id,
    sourceSystem,
    systemType,
    name: entry.name?.trim() || sourceSystem,
    url,
    username: entry.username?.trim() || undefined,
    password: entry.password?.trim() || undefined,
    passwordFile: entry.passwordFile?.trim() || undefined,
    port: entry.port ?? undefined,
    apiPath: entry.apiPath?.trim() || undefined,
    enabled: entry.enabled ?? true,
  };
}

async function readPasswordFile(filePath: string) {
  const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  logger.debug('Reading storage password file', { filePath: resolvedPath });
  const raw = await readFile(resolvedPath, 'utf8');
  return raw.trim();
}

async function resolveConfigFile(filePath: string) {
  const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  logger.debug('Loading storage config file', { filePath: resolvedPath });
  const raw = await readFile(resolvedPath, 'utf8');
  const parsed = JSON.parse(raw) as ConfigFileEntry[] | Record<string, ConfigFileEntry>;
  const entries = Array.isArray(parsed) ? parsed : Object.entries(parsed).map(([key, value]) => ({ ...value, id: value.id ?? key, sourceSystem: value.sourceSystem ?? key }));
  return entries
    .map((entry, index) => normalizeFileEntry(entry, index))
    .filter((entry): entry is StorageConnectionConfig => Boolean(entry && entry.enabled !== false));
}

async function resolveDbConfigs() {
  const db = getDb();
  if (!db) {
    logger.warn('Storage config DB fallback skipped because database is unavailable');
    return [] as StorageConnectionConfig[];
  }

  logger.debug('Loading storage configs from database fallback', { systemTypes: ['unity', 'pure', 'alletra'] });
  const rows = (await db<StoredDbConfig>('system_configs')
    .select('*')
    .whereIn('system_type', ['unity', 'pure', 'alletra'])
    .orderBy('updated_at', 'desc')) as StoredDbConfig[];

  logger.debug('Loaded storage configs from database fallback', { count: rows.length });

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
  const configFile = process.env.STORAGE_SOURCE_CONFIG_FILE?.trim();
  if (configFile) {
    logger.debug('Resolving storage configs from file env', { envVar: 'STORAGE_SOURCE_CONFIG_FILE' });
    return resolveConfigFile(configFile);
  }

  const inlineJson = process.env.STORAGE_SOURCE_CONFIG_JSON?.trim();
  if (inlineJson) {
    logger.debug('Resolving storage configs from inline JSON env', { envVar: 'STORAGE_SOURCE_CONFIG_JSON' });
    const parsed = JSON.parse(inlineJson) as ConfigFileEntry[] | Record<string, ConfigFileEntry>;
    const entries = Array.isArray(parsed) ? parsed : Object.entries(parsed).map(([key, value]) => ({ ...value, id: value.id ?? key, sourceSystem: value.sourceSystem ?? key }));
    return entries
      .map((entry, index) => normalizeFileEntry(entry, index))
      .filter((entry): entry is StorageConnectionConfig => Boolean(entry && entry.enabled !== false));
  }

  logger.debug('Resolving storage configs from database fallback');
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

  if (config.passwordFile) {
    logger.debug('Using storage password file', { sourceSystem: config.sourceSystem, systemType: config.systemType, passwordFile: config.passwordFile });
    return readPasswordFile(config.passwordFile);
  }

  logger.debug('No storage password provided on config', { sourceSystem: config.sourceSystem, systemType: config.systemType });
  return undefined;
}