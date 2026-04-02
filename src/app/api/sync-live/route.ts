import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { VcenterService } from '@/services/vcenter.service';
import { ItopService } from '@/services/itop.service';
import { decryptSecret } from '@/lib/crypto';

interface DiscrepancyRecord {
  objectType: 'vm' | 'host' | 'lun';
  identifier: string;
  sourceSystem: string;  // esxi, itop
  type: 'missing_in_itop' | 'extra_in_itop' | 'field_mismatch';
  field?: string | null;
  itopValue?: string | null;
  sourceValue?: string | null;
  severity: 'low' | 'medium' | 'high';
  summary: string;
}

interface SystemData {
  systemType: string;
  data: any;
  error?: string;
}

export async function POST(request: Request) {
  try {
    console.log('🔄 Starting real-time sync process...\n');

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Get configurations from database
    const configs = await db('configurations')
      .select('*')
      .where('enabled', true);

    if (configs.length === 0) {
      return NextResponse.json({ error: 'No enabled configurations found' }, { status: 400 });
    }

    console.log(`📊 Found ${configs.length} enabled systems\n`);

    // Fetch data from each system
    const systemDataMap: { [key: string]: any } = {};
    const vmDataMap: { itop: Map<string, any>; esxi: Map<string, any> } = {
      itop: new Map(),
      esxi: new Map(),
    };
    const volumeDataMap: { itop: Map<string, any>; storage: Map<string, any> } = {
      itop: new Map(),
      storage: new Map(),
    };

    for (const config of configs) {
      try {
        console.log(`\n📡 Fetching from ${config.system_type.toUpperCase()}...`);
        let data;

        if (config.system_type === 'itop') {
          data = await fetchItopData(config);
          // Map VMs for comparison
          if (data.vms && Array.isArray(data.vms)) {
            data.vms.forEach((vm: any) => {
              const id = vm.fields?.name || vm.name || `vm-${Math.random()}`;
              vmDataMap.itop.set(id, vm);
            });
          }
          // Map volumes for comparison
          if (data.volumes && Array.isArray(data.volumes)) {
            data.volumes.forEach((vol: any) => {
              const id = vol.fields?.name || vol.name || `vol-${Math.random()}`;
              volumeDataMap.itop.set(id, vol);
            });
          }
        } else if (config.system_type === 'vcenter') {
          data = await fetchVcenterData(config);
          // Map VMs for comparison
          if (data.vms && Array.isArray(data.vms)) {
            data.vms.forEach((vm: any) => {
              const id = vm.name || vm.config?.name || `vm-${Math.random()}`;
              vmDataMap.esxi.set(id, vm);
            });
          }
          // Map datastores as volumes for comparison
          if (data.datastores && Array.isArray(data.datastores)) {
            data.datastores.forEach((ds: any) => {
              const id = ds.name || `ds-${Math.random()}`;
              volumeDataMap.storage.set(id, ds);
            });
          }
        }

        systemDataMap[config.system_type] = data;
        console.log(`   ✅ ${config.system_type}: ${JSON.stringify(data).substring(0, 100)}...`);
      } catch (error) {
        console.error(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
        systemDataMap[config.system_type] = { error: error instanceof Error ? error.message : String(error) };
      }
    }

    // Compare systems
    console.log('\n\n🔍 Comparing systems...\n');
    const discrepancies: DiscrepancyRecord[] = [];

    console.log(`   iTOP has ${vmDataMap.itop.size} VMs`);
    console.log(`   ESXi has ${vmDataMap.esxi.size} VMs\n`);

    // Compare ESXi VMs against iTOP
    if (vmDataMap.esxi.size > 0 || vmDataMap.itop.size > 0) {
      // Check for VMs in ESXi but not in iTOP
      for (const [vmName, esxiVm] of vmDataMap.esxi.entries()) {
        if (!vmDataMap.itop.has(vmName)) {
          discrepancies.push({
            objectType: 'vm',
            identifier: vmName,
            sourceSystem: 'esxi',
            type: 'missing_in_itop',
            severity: 'medium',
            summary: `VM "${vmName}" exists in ESXi but not in iTOP CMDB`,
          });
          console.log(`   ⚠️  Missing in iTOP: ${vmName}`);
        } else {
          // Compare field values (name, RAM, CPU, disk)
          const itopVm = vmDataMap.itop.get(vmName)!;
          const esxiMemory = esxiVm.memory_mb || 0;
          const itopMemory = itopVm.fields?.ram ? parseInt(itopVm.fields.ram) : 0;
          const esxiCpus = esxiVm.cpu_count || 0;
          const itopCpus = itopVm.fields?.cpus ? parseInt(itopVm.fields.cpus) : 0;
          const esxiDisk = esxiVm.disk_gb || 0;
          const itopDisk = itopVm.fields?.disk ? parseInt(itopVm.fields.disk) : 0;

          // Compare memory
          if (esxiMemory !== itopMemory && esxiMemory > 0 && itopMemory > 0) {
            discrepancies.push({
              objectType: 'vm',
              identifier: vmName,
              sourceSystem: 'esxi',
              type: 'field_mismatch',
              field: 'memory',
              itopValue: `${itopMemory}MB`,
              sourceValue: `${esxiMemory}MB`,
              severity: 'high',
              summary: `Memory mismatch for VM "${vmName}": iTOP=${itopMemory}MB, ESXi=${esxiMemory}MB`,
            });
            console.log(`   🔄 Field mismatch for ${vmName}: RAM (iTOP=${itopMemory}MB, ESXi=${esxiMemory}MB)`);
          }

          // Compare CPU
          if (esxiCpus !== itopCpus && esxiCpus > 0 && itopCpus > 0) {
            discrepancies.push({
              objectType: 'vm',
              identifier: vmName,
              sourceSystem: 'esxi',
              type: 'field_mismatch',
              field: 'cpu',
              itopValue: `${itopCpus}`,
              sourceValue: `${esxiCpus}`,
              severity: 'medium',
              summary: `CPU mismatch for VM "${vmName}": iTOP=${itopCpus}, ESXi=${esxiCpus}`,
            });
            console.log(`   🔄 Field mismatch for ${vmName}: CPU (iTOP=${itopCpus}, ESXi=${esxiCpus})`);
          }

          // Compare disk
          if (esxiDisk !== itopDisk && esxiDisk > 0 && itopDisk > 0) {
            discrepancies.push({
              objectType: 'vm',
              identifier: vmName,
              sourceSystem: 'esxi',
              type: 'field_mismatch',
              field: 'disk',
              itopValue: `${itopDisk}GB`,
              sourceValue: `${esxiDisk}GB`,
              severity: 'medium',
              summary: `Disk mismatch for VM "${vmName}": iTOP=${itopDisk}GB, ESXi=${esxiDisk}GB`,
            });
            console.log(`   🔄 Field mismatch for ${vmName}: Disk (iTOP=${itopDisk}GB, ESXi=${esxiDisk}GB)`);
          }
        }
      }

      // Check for VMs in iTOP but not in ESXi
      for (const [vmName] of vmDataMap.itop.entries()) {
        if (!vmDataMap.esxi.has(vmName)) {
          discrepancies.push({
            objectType: 'vm',
            identifier: vmName,
            sourceSystem: 'esxi',
            type: 'extra_in_itop',
            severity: 'medium',
            summary: `VM "${vmName}" exists in iTOP but not in ESXi (may have been deleted or inventory not synced)`,
          });
          console.log(`   ⚠️  Extra in iTOP: ${vmName}`);
        }
      }
    }

    // Compare Logical Volumes/Datastores
    console.log(`\n🔍 Comparing volumes...`);
    console.log(`   iTOP has ${volumeDataMap.itop.size} Logical Volumes`);
    console.log(`   Storage systems have ${volumeDataMap.storage.size} Volumes\n`);

    if (volumeDataMap.itop.size > 0 || volumeDataMap.storage.size > 0) {
      // Check for volumes in storage but not in iTOP
      for (const [volName, storageVol] of volumeDataMap.storage.entries()) {
        if (!volumeDataMap.itop.has(volName)) {
          discrepancies.push({
            objectType: 'lun',
            identifier: volName,
            sourceSystem: 'storage',
            type: 'missing_in_itop',
            severity: 'medium',
            summary: `Logical Volume "${volName}" exists in Storage but not in iTOP CMDB`,
          });
          console.log(`   ⚠️  Missing in iTOP: ${volName}`);
        } else {
          // Compare volume field values (name, size, type)
          const itopVol = volumeDataMap.itop.get(volName)!;
          const storageSize = storageVol.capacity_mb || storageVol.size || 0;
          const itopSize = itopVol.fields?.size ? parseInt(itopVol.fields.size) : 0;
          const storageType = storageVol.type || '';
          const itopType = itopVol.fields?.type || '';

          // Compare size
          if (storageSize !== itopSize && storageSize > 0 && itopSize > 0) {
            discrepancies.push({
              objectType: 'lun',
              identifier: volName,
              sourceSystem: 'storage',
              type: 'field_mismatch',
              field: 'size',
              itopValue: `${itopSize}MB`,
              sourceValue: `${storageSize}MB`,
              severity: 'high',
              summary: `Size mismatch for Volume "${volName}": iTOP=${itopSize}MB, Storage=${storageSize}MB`,
            });
            console.log(`   🔄 Field mismatch for ${volName}: Size (iTOP=${itopSize}MB, Storage=${storageSize}MB)`);
          }

          // Compare type
          if (storageType !== itopType && storageType && itopType) {
            discrepancies.push({
              objectType: 'lun',
              identifier: volName,
              sourceSystem: 'storage',
              type: 'field_mismatch',
              field: 'type',
              itopValue: itopType,
              sourceValue: storageType,
              severity: 'medium',
              summary: `Type mismatch for Volume "${volName}": iTOP=${itopType}, Storage=${storageType}`,
            });
            console.log(`   🔄 Field mismatch for ${volName}: Type (iTOP=${itopType}, Storage=${storageType})`);
          }
        }
      }

      // Check for volumes in iTOP but not in storage systems
      for (const [volName] of volumeDataMap.itop.entries()) {
        if (!volumeDataMap.storage.has(volName)) {
          discrepancies.push({
            objectType: 'lun',
            identifier: volName,
            sourceSystem: 'storage',
            type: 'extra_in_itop',
            severity: 'medium',
            summary: `Logical Volume "${volName}" exists in iTOP but not in Storage Systems (may have been deleted)`,
          });
          console.log(`   ⚠️  Extra in iTOP: ${volName}`);
        }
      }
    }

    console.log(`\n✅ Found ${discrepancies.length} discrepancies\n`);

    // Store sync job in database
    const syncJobId = await db('sync_jobs').insert({
      started_at: new Date(),
      finished_at: new Date(),
      status: discrepancies.length === 0 ? 'success' : 'partial',
      total_sources: Object.keys(systemDataMap).length,
      succeeded_sources: Object.keys(systemDataMap).filter(
        (key) => !systemDataMap[key]?.error
      ).length,
      discrepancies: discrepancies.length,
      note: `Real-time sync with ${Object.keys(systemDataMap).join(', ')}`,
    });

    console.log(`📝 Sync job ${syncJobId} created`);

    // Store discrepancies in database
    if (discrepancies.length > 0) {
      const discrepancyRecords = discrepancies.map((disc) => ({
        sync_job_id: syncJobId[0],
        object_type: disc.objectType,
        identifier: disc.identifier,
        source_system: disc.sourceSystem,
        discrepancy_type: disc.type,
        field_name: disc.field || null,
        itop_value: disc.itopValue || null,
        source_value: disc.sourceValue || null,
        severity: disc.severity,
        summary: disc.summary,
        is_exception: false,
      }));

      await db('discrepancies').insert(discrepancyRecords);
      console.log(`📝 ${discrepancyRecords.length} discrepancies saved\n`);
    }

    // Return results with database sync info
    return NextResponse.json({
      ok: true,
      data: {
        syncJobId: syncJobId[0],
        systems: Object.keys(systemDataMap),
        discrepancies,
        vmComparison: {
          itopVMs: vmDataMap.itop.size,
          esxiVMs: vmDataMap.esxi.size,
        },
        timestamp: new Date().toISOString(),
        saved: true,
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

async function fetchItopData(config: any) {
  try {
    const password = decryptSecret(config.encrypted_password);
    const service = new ItopService(config.url, config.username, password);

    console.log('   Fetching VMs...');
    const vms = await service.fetchVirtualMachines();
    console.log(`   → Fetched ${vms.length} VMs`);
    if (vms.length > 0) {
      console.log(`   → First VM: ${JSON.stringify(vms[0]).substring(0, 100)}...`);
    }

    console.log('   Fetching Servers...');
    const servers = await service.fetchServers();
    console.log(`   → Fetched ${servers.length} Servers`);
    if (servers.length > 0) {
      console.log(`   → First Server: ${JSON.stringify(servers[0]).substring(0, 100)}...`);
    }

    console.log('   Fetching Storage...');
    const volumes = await service.fetchLogicalVolumes();
    console.log(`   → Fetched ${volumes.length} Volumes`);

    return { vms, servers, volumes };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`   ❌ iTOP Error: ${errMsg}`);
    throw new Error(`iTOP fetch failed: ${errMsg}`);
  }
}

async function fetchVcenterData(config: any) {
  try {
    const password = decryptSecret(config.encrypted_password);
    const service = new VcenterService(config.url, config.username, password);

    // Note: testConnection() may fail with HTTP 400 on standalone ESXi
    // but the inventory endpoints (/rest/vcenter/*) still work and return empty arrays
    // Unit tests confirm this behavior is expected

    console.log('   Fetching VMs...');
    const vms = await service.fetchInventory();
    console.log(`   → Fetched ${vms.length} VMs`);
    if (vms.length > 0) {
      console.log(`   → First VM: ${JSON.stringify(vms[0]).substring(0, 100)}...`);
    }

    console.log('   Fetching Hosts...');
    const hosts = await service.fetchHosts();
    console.log(`   → Fetched ${hosts.length} Hosts`);

    console.log('   Fetching Datastores...');
    const datastores = await service.fetchDatastores();
    console.log(`   → Fetched ${datastores.length} Datastores`);

    return { vms, hosts, datastores };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`   ❌ vCenter Error: ${errMsg}`);
    throw new Error(`vCenter fetch failed: ${errMsg}`);
  }
}
