import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { VcenterService } from '@/services/vcenter.service';
import { ItopService } from '@/services/itop.service';
import { UnityService } from '@/services/unity.service';
import { PureService } from '@/services/pure.service';
import { AlletraService } from '@/services/alletra.service';

export async function POST(request: NextRequest) {
  try {
    const { systemType, operation } = await request.json();

    if (!systemType) {
      return NextResponse.json({ error: 'Missing systemType' }, { status: 400 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const config = await db('system_configs')
      .select('*')
      .where('systemType', systemType)
      .where('enabled', true)
      .first();

    if (!config) {
      return NextResponse.json({ error: `Configuration for ${systemType} not found` }, { status: 404 });
    }

    let result;

    switch (systemType) {
      case 'vcenter':
        result = await syncVcenter(config, operation);
        break;
      case 'itop':
        result = await syncItop(config, operation);
        break;
      case 'unity':
        result = await syncUnity(config, operation);
        break;
      case 'pure':
        result = await syncPure(config, operation);
        break;
      case 'alletra':
        result = await syncAlletra(config, operation);
        break;
      default:
        return NextResponse.json({ error: 'Unknown system type' }, { status: 400 });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    console.error('Sync error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function syncVcenter(config: any, operation?: string) {
  const service = new VcenterService(config.url, config.username, config.password);

  switch (operation) {
    case 'vms':
      return await service.fetchInventory();
    case 'hosts':
      return await service.fetchHosts();
    case 'datastores':
      return await service.fetchDatastores();
    default:
      return await Promise.all([
        service.fetchInventory(),
        service.fetchHosts(),
        service.fetchDatastores(),
      ]);
  }
}

async function syncItop(config: any, operation?: string) {
  const service = new ItopService(config.url, config.username, config.password);

  switch (operation) {
    case 'servers':
      return await service.fetchServers();
    case 'cis':
      return await service.fetchCIs();
    default:
      return await Promise.all([
        service.fetchServers(),
        service.fetchCIs(),
      ]);
  }
}

async function syncUnity(config: any, operation?: string) {
  const service = new UnityService(config.url, config.username, config.password);

  switch (operation) {
    case 'systems':
      return await service.fetchSystems();
    case 'pools':
      return await service.fetchPools();
    case 'luns':
      return await service.fetchLUNs();
    default:
      return await Promise.all([
        service.fetchSystems(),
        service.fetchPools(),
        service.fetchLUNs(),
      ]);
  }
}

async function syncPure(config: any, operation?: string) {
  const service = new PureService(config.url, config.username, config.password);

  switch (operation) {
    case 'arrays':
      return await service.fetchArrays();
    case 'volumes':
      return await service.fetchVolumes();
    case 'hosts':
      return await service.fetchHosts();
    case 'volume-groups':
      return await service.fetchVolumeGroups();
    default:
      return await Promise.all([
        service.fetchArrays(),
        service.fetchVolumes(),
        service.fetchHosts(),
        service.fetchVolumeGroups(),
      ]);
  }
}

async function syncAlletra(config: any, operation?: string) {
  const service = new AlletraService(config.url, config.username, config.password);

  switch (operation) {
    case 'systems':
      return await service.fetchSystems();
    case 'volumes':
      return await service.fetchVolumes();
    case 'arrays':
      return await service.fetchArrays();
    case 'pools':
      return await service.fetchPools();
    default:
      return await Promise.all([
        service.fetchSystems(),
        service.fetchVolumes(),
        service.fetchArrays(),
        service.fetchPools(),
      ]);
  }
}
