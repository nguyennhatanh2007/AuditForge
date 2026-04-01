import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { VcenterService } from '@/services/vcenter.service';
import { ItopService } from '@/services/itop.service';
import { UnityService } from '@/services/unity.service';
import { PureService } from '@/services/pure.service';
import { AlletraService } from '@/services/alletra.service';

export async function GET(request: NextRequest) {
  try {
    const systemType = request.nextUrl.searchParams.get('systemType');
    
    if (!systemType) {
      // Fetch from all enabled systems
      return await fetchAllSystems();
    }

    // Fetch from specific system
    return await fetchSystemInventory(systemType);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch inventory';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function fetchAllSystems() {
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  const configs = await db('configurations')
    .select('*')
    .where('enabled', true);

  const results: Record<string, any> = {};

  for (const config of configs) {
    try {
      const data = await getSystemData(config);
      results[config.systemType] = data;
    } catch (error) {
      console.error(`Failed to fetch from ${config.systemType}:`, error);
      results[config.systemType] = [];
    }
  }

  return NextResponse.json({ data: results });
}

async function fetchSystemInventory(systemType: string) {
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  const config = await db('configurations')
    .select('*')
    .where('systemType', systemType)
    .where('enabled', true)
    .first();

  if (!config) {
    return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
  }

  const data = await getSystemData(config);
  return NextResponse.json({ data });
}

async function getSystemData(config: any) {
  switch (config.systemType) {
    case 'vcenter':
      return await getVcenterData(config);
    case 'itop':
      return await getItopData(config);
    case 'unity':
      return await getUnityData(config);
    case 'pure':
      return await getPureData(config);
    case 'alletra':
      return await getAlletraData(config);
    default:
      return [];
  }
}

async function getVcenterData(config: any) {
  try {
    const service = new VcenterService(config.url, config.username, config.password);
    const [vms, hosts, datastores] = await Promise.all([
      service.fetchInventory(),
      service.fetchHosts(),
      service.fetchDatastores(),
    ]);
    return { vms, hosts, datastores };
  } catch (error) {
    console.error('vCenter fetch error:', error);
    return [];
  }
}

async function getItopData(config: any) {
  try {
    const service = new ItopService(config.url, config.username, config.password);
    const [servers, cis] = await Promise.all([
      service.fetchServers(),
      service.fetchCIs(),
    ]);
    return { servers, cis };
  } catch (error) {
    console.error('iTop fetch error:', error);
    return [];
  }
}

async function getUnityData(config: any) {
  try {
    const service = new UnityService(config.url, config.username, config.password);
    const [systems, pools, luns] = await Promise.all([
      service.fetchSystems(),
      service.fetchPools(),
      service.fetchLUNs(),
    ]);
    return { systems, pools, luns };
  } catch (error) {
    console.error('Unity fetch error:', error);
    return [];
  }
}

async function getPureData(config: any) {
  try {
    const service = new PureService(config.url, config.password);
    const [arrays, volumes, hosts, volumeGroups] = await Promise.all([
      service.fetchArrays(),
      service.fetchVolumes(),
      service.fetchHosts(),
      service.fetchVolumeGroups(),
    ]);
    return { arrays, volumes, hosts, volumeGroups };
  } catch (error) {
    console.error('Pure Storage fetch error:', error);
    return [];
  }
}

async function getAlletraData(config: any) {
  try {
    const service = new AlletraService(config.url, config.username, config.password);
    const [systems, volumes, arrays, pools] = await Promise.all([
      service.fetchSystems(),
      service.fetchVolumes(),
      service.fetchArrays(),
      service.fetchPools(),
    ]);
    return { systems, volumes, arrays, pools };
  } catch (error) {
    console.error('Alletra fetch error:', error);
    return [];
  }
}

