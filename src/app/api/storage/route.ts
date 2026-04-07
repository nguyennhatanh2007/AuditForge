import { NextRequest, NextResponse } from 'next/server';
import { AlletraService } from '@/services/alletra.service';
import { PureService } from '@/services/pure.service';
import { UnityService } from '@/services/unity.service';
import { mergeStorageSnapshots, normalizeStorageLuns, normalizeStorageSummary } from '@/lib/storage-normalizer';
import { resolveStorageConfigById, resolveStorageConfigBySource, resolveStorageConfigs, resolveStoragePassword } from '@/lib/storage-targets';
import type { StorageConnectionConfig } from '@/lib/storage-types';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

function createClient(config: StorageConnectionConfig) {
  switch (config.systemType) {
    case 'unity':
      return new UnityService(config.url, config.username, config.password);
    case 'pure':
      return new PureService(config.url, config.username, config.password);
    case 'alletra':
      return new AlletraService(config.url, config.username, config.password);
    default:
      return null;
  }
}

async function hydrateConfig(config: StorageConnectionConfig) {
  return {
    ...config,
    password: await resolveStoragePassword(config),
  };
}

async function fetchConfigSnapshot(config: StorageConnectionConfig) {
  const hydrated = await hydrateConfig(config);
  const client = createClient(hydrated);

  if (!client) {
    logger.warn('Skipping unsupported storage system type', { sourceSystem: hydrated.sourceSystem, systemType: hydrated.systemType });
    return null;
  }

  const storageClient = client as unknown as Record<string, (...args: any[]) => Promise<any>>;

  logger.debug('Starting storage fetch', {
    sourceSystem: hydrated.sourceSystem,
    systemType: hydrated.systemType,
    url: hydrated.url,
    view: 'all',
  });

  const warnings: Array<{ sourceSystem: string; systemType: string; scope: string; message: string }> = [];

  const runFetch = async (scope: string, fetcher: (() => Promise<any>) | undefined) => {
    if (!fetcher) {
      return [];
    }

    try {
      return await fetcher();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push({
        sourceSystem: hydrated.sourceSystem,
        systemType: hydrated.systemType,
        scope,
        message,
      });
      logger.warn('Partial storage fetch failed', {
        sourceSystem: hydrated.sourceSystem,
        systemType: hydrated.systemType,
        scope,
        message,
      });
      return [];
    }
  };

  const [arrays, pools, luns, hosts] = await Promise.all([
    runFetch('arrays', storageClient.fetchArrays),
    runFetch('pools', storageClient.fetchPools),
    runFetch('luns', storageClient.fetchLUNs ?? storageClient.fetchVolumes),
    runFetch('hosts', storageClient.fetchHosts),
  ]);

  logger.debug('Storage fetch completed', {
    sourceSystem: hydrated.sourceSystem,
    systemType: hydrated.systemType,
    arrays: arrays.length,
    pools: pools.length,
    luns: luns.length,
    hosts: hosts.length,
  });

  return {
    summary: normalizeStorageSummary(hydrated, { arrays, pools, luns, hosts }),
    luns: normalizeStorageLuns(hydrated, luns),
    warnings,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const view = searchParams.get('view') ?? 'all';
    const sourceSystem = searchParams.get('sourceSystem')?.trim();
    const configId = searchParams.get('configId')?.trim();

    logger.debug('Storage API request received', { view, sourceSystem: sourceSystem ?? null, configId: configId ?? null });

    const config = configId
      ? await resolveStorageConfigById(configId)
      : sourceSystem
        ? await resolveStorageConfigBySource(sourceSystem)
        : null;

    const configs = config ? [config] : await resolveStorageConfigs();
    logger.debug('Resolved storage configs for request', { count: configs.length, selectedBy: configId ? 'configId' : sourceSystem ? 'sourceSystem' : 'all' });
    const snapshots: Array<{
      summary: Awaited<ReturnType<typeof normalizeStorageSummary>>;
      luns: Awaited<ReturnType<typeof normalizeStorageLuns>>;
      warnings: Array<{ sourceSystem: string; systemType: string; scope: string; message: string }>;
    }> = [];

    for (const storageConfig of configs) {
      const snapshot = await fetchConfigSnapshot(storageConfig);
      if (snapshot) {
        snapshots.push(snapshot);
      }
    }

    if (view === 'summary') {
      logger.debug('Returning storage summaries', { count: snapshots.length });
      return NextResponse.json({
        data: snapshots.map((snapshot) => snapshot.summary),
        warnings: snapshots.flatMap((snapshot) => snapshot.warnings),
      });
    }

    if (view === 'luns') {
      logger.debug('Returning storage LUNs', { count: snapshots.reduce((total, snapshot) => total + snapshot.luns.length, 0) });
      return NextResponse.json({
        data: snapshots.flatMap((snapshot) => snapshot.luns),
        warnings: snapshots.flatMap((snapshot) => snapshot.warnings),
      });
    }

    logger.debug('Returning merged storage snapshot', { count: snapshots.length });
    return NextResponse.json({
      data: mergeStorageSnapshots(snapshots),
      warnings: snapshots.flatMap((snapshot) => snapshot.warnings),
    });
  } catch (error) {
    logger.error('Storage API request failed', { message: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch storage data',
      },
      { status: 500 },
    );
  }
}