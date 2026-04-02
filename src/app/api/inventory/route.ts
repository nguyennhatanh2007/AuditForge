import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { VcenterService } from '@/services/vcenter.service';
import { ItopService } from '@/services/itop.service';
import { decryptSecret } from '@/lib/crypto';

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
      results[config.system_type] = data;
    } catch (error) {
      console.error(`Failed to fetch from ${config.system_type}:`, error);
      results[config.system_type] = {
        error: error instanceof Error ? error.message : 'Unknown error',
        system: config.system_type,
        lastFetch: new Date().toISOString(),
      };
    }
  }

  return NextResponse.json({
    data: results,
    timestamp: new Date().toISOString(),
    totalSystems: Object.keys(results).length,
  });
}

async function fetchSystemInventory(systemType: string) {
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  const config = await db('configurations')
    .select('*')
    .where('system_type', systemType)
    .where('enabled', true)
    .first();

  if (!config) {
    return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
  }

  const data = await getSystemData(config);
  return NextResponse.json({ data });
}

async function getSystemData(config: any) {
  switch (config.system_type) {
    case 'vcenter':
      return await getVcenterData(config);
    case 'itop':
      return await getItopData(config);
    default:
      return {
        error: `System type ${config.system_type} not supported in inventory`,
        system: config.system_type,
      };
  }
}

async function getVcenterData(config: any) {
  try {
    const password = decryptSecret(config.encrypted_password);
    const service = new VcenterService(config.url, config.username, password);

    const [vms, hosts, datastores] = await Promise.all([
      service.fetchInventory().catch(() => []),
      service.fetchHosts().catch(() => []),
      service.fetchDatastores().catch(() => []),
    ]);

    return {
      system: 'vCenter/ESXi',
      url: config.url,
      lastFetch: new Date().toISOString(),
      data: {
        virtualMachines: {
          count: vms.length,
          items: vms.map((vm: any) => ({
            name: vm.name || 'Unknown',
            id: vm.moid || vm.config?.uuid || '-',
            ram: vm.memory_mb ? `${vm.memory_mb}MB` : '-',
            cpus: vm.cpu_count || 0,
            disk: vm.disk_gb ? `${vm.disk_gb}GB` : '-',
            powerState: vm.power_state || '-',
          })),
        },
        hosts: {
          count: hosts.length,
          items: hosts.map((host: any) => ({
            name: host.name || 'Unknown',
            id: host.moid || '-',
            cpus: host.cpu_count || 0,
            ram: host.memory_mb ? `${host.memory_mb}MB` : '-',
            connectionState: host.connection_state || '-',
          })),
        },
        datastores: {
          count: datastores.length,
          items: datastores.map((ds: any) => ({
            name: ds.name || 'Unknown',
            id: ds.moid || '-',
            capacity: ds.capacity_mb ? `${ds.capacity_mb}MB` : '-',
            freeSpace: ds.free_space_mb ? `${ds.free_space_mb}MB` : '-',
            type: ds.type || '-',
          })),
        },
      },
    };
  } catch (error) {
    console.error('vCenter fetch error:', error);
    throw error;
  }
}

async function getItopData(config: any) {
  try {
    const password = decryptSecret(config.encrypted_password);
    const service = new ItopService(config.url, config.username, password);

    const [vms, servers, volumes] = await Promise.all([
      service.fetchVirtualMachines().catch(() => []),
      service.fetchServers().catch(() => []),
      service.fetchLogicalVolumes().catch(() => []),
    ]);

    return {
      system: 'iTOP CMDB',
      url: config.url,
      lastFetch: new Date().toISOString(),
      data: {
        virtualMachines: {
          count: vms.length,
          items: vms.map((vm: any) => ({
            name: vm.fields?.name || 'Unknown',
            id: vm.key || '-',
            ram: vm.fields?.ram ? `${vm.fields.ram}MB` : '-',
            cpus: vm.fields?.cpus || 0,
            disk: vm.fields?.disk ? `${vm.fields.disk}GB` : '-',
            description: vm.fields?.description || '',
          })),
        },
        servers: {
          count: servers.length,
          items: servers.map((srv: any) => ({
            name: srv.fields?.name || 'Unknown',
            id: srv.key || '-',
            osType: srv.fields?.os_type || '-',
            ram: srv.fields?.ram ? `${srv.fields.ram}MB` : '-',
            cpus: srv.fields?.cpus || 0,
            description: srv.fields?.description || '',
          })),
        },
        logicalVolumes: {
          count: volumes.length,
          items: volumes.map((vol: any) => ({
            name: vol.fields?.name || 'Unknown',
            id: vol.key || '-',
            size: vol.fields?.size ? `${vol.fields.size}GB` : '-',
            type: vol.fields?.type || '-',
            status: vol.fields?.status || '-',
          })),
        },
      },
    };
  } catch (error) {
    console.error('iTOP fetch error:', error);
    throw error;
  }
}

