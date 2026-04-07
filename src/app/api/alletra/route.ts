import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { resolveStorageConfigById, resolveStorageConfigBySource, resolveStorageConfigs, resolveStoragePassword } from '@/lib/storage-targets';
import type { StorageConnectionConfig } from '@/lib/storage-types';
import { AlletraService } from '@/services/alletra.service';

export const runtime = 'nodejs';

type AlletraView = 'all' | 'systems' | 'arrays' | 'pools' | 'volumes';

const ALLETRA_VIEWS = new Set<AlletraView>(['all', 'systems', 'arrays', 'pools', 'volumes']);

type AlletraWarning = {
  sourceSystem: string;
  scope: Exclude<AlletraView, 'all'>;
  message: string;
};

type AlletraSnapshot = {
  config: {
    id?: string;
    sourceSystem: string;
    name?: string;
    url: string;
  };
  fetchedAt: string;
  systems: unknown[];
  arrays: unknown[];
  pools: unknown[];
  volumes: unknown[];
};

async function hydrateConfig(config: StorageConnectionConfig) {
  return {
    ...config,
    password: await resolveStoragePassword(config),
  };
}

function asAlletraConfig(config: StorageConnectionConfig | null, selector?: 'configId' | 'sourceSystem') {
  if (!config) {
    return { config: null, error: selector ? `${selector} not found` : null };
  }

  if (config.systemType !== 'alletra') {
    return { config: null, error: `Selected config is ${config.systemType}, expected alletra` };
  }

  return { config, error: null };
}

async function fetchSnapshot(config: StorageConnectionConfig, view: AlletraView) {
  const hydrated = await hydrateConfig(config);
  const service = new AlletraService(hydrated.url, hydrated.username, hydrated.password);
  const warnings: AlletraWarning[] = [];

  const runFetch = async (scope: Exclude<AlletraView, 'all'>, enabled: boolean, fetcher: () => Promise<unknown[]>) => {
    if (!enabled) {
      return [];
    }

    try {
      return await fetcher();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push({
        sourceSystem: hydrated.sourceSystem,
        scope,
        message,
      });
      logger.warn('Partial Alletra fetch failed', {
        sourceSystem: hydrated.sourceSystem,
        scope,
        message,
      });
      return [];
    }
  };

  const includeAll = view === 'all';
  const [systems, arrays, pools, volumes] = await Promise.all([
    runFetch('systems', includeAll || view === 'systems', () => service.fetchSystems()),
    runFetch('arrays', includeAll || view === 'arrays', () => service.fetchArrays()),
    runFetch('pools', includeAll || view === 'pools', () => service.fetchPools()),
    runFetch('volumes', includeAll || view === 'volumes', () => service.fetchVolumes()),
  ]);

  const snapshot: AlletraSnapshot = {
    config: {
      id: hydrated.id,
      sourceSystem: hydrated.sourceSystem,
      name: hydrated.name,
      url: hydrated.url,
    },
    fetchedAt: new Date().toISOString(),
    systems,
    arrays,
    pools,
    volumes,
  };

  return { snapshot, warnings };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const requestedView = (searchParams.get('view') ?? 'all').trim().toLowerCase() as AlletraView;
    const view: AlletraView = ALLETRA_VIEWS.has(requestedView) ? requestedView : 'all';
    const sourceSystem = searchParams.get('sourceSystem')?.trim();
    const configId = searchParams.get('configId')?.trim();

    logger.debug('Alletra API request received', {
      view,
      sourceSystem: sourceSystem ?? null,
      configId: configId ?? null,
    });

    let configs: StorageConnectionConfig[] = [];

    if (configId) {
      const selected = asAlletraConfig(await resolveStorageConfigById(configId), 'configId');
      if (!selected.config) {
        return NextResponse.json({ error: selected.error ?? 'Alletra config not found' }, { status: 404 });
      }
      configs = [selected.config];
    } else if (sourceSystem) {
      const selected = asAlletraConfig(await resolveStorageConfigBySource(sourceSystem), 'sourceSystem');
      if (!selected.config) {
        return NextResponse.json({ error: selected.error ?? 'Alletra config not found' }, { status: 404 });
      }
      configs = [selected.config];
    } else {
      const allConfigs = await resolveStorageConfigs();
      configs = allConfigs.filter((config) => config.systemType === 'alletra' && config.enabled !== false);
    }

    if (configs.length === 0) {
      return NextResponse.json({ data: [], warnings: [], meta: { view, totalConfigs: 0 } });
    }

    const snapshots: AlletraSnapshot[] = [];
    const warnings: AlletraWarning[] = [];

    for (const config of configs) {
      const { snapshot, warnings: snapshotWarnings } = await fetchSnapshot(config, view);
      snapshots.push(snapshot);
      warnings.push(...snapshotWarnings);
    }

    if (view === 'all') {
      return NextResponse.json({
        data: snapshots,
        warnings,
        meta: {
          view,
          totalConfigs: snapshots.length,
        },
      });
    }

    const flattened = snapshots.flatMap((snapshot) => snapshot[view]);
    return NextResponse.json({
      data: flattened,
      warnings,
      meta: {
        view,
        totalConfigs: snapshots.length,
        totalRecords: flattened.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Alletra API request failed', { message });
    return NextResponse.json({ error: message || 'Failed to fetch Alletra data' }, { status: 500 });
  }
}
