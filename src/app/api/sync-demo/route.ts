import { NextResponse } from 'next/server';

/**
 * Demo endpoint to show discrepancy comparison logic
 * Uses mock data to simulate real system responses
 */

export async function POST(request: Request) {
  try {
    console.log('\n🎯 Demo Sync - Using Mock Data\n');

    // Mock iTOP data (reference system)
    const itopVMs = [
      {
        id: 1,
        name: 'web-server-01',
        fields: { name: 'web-server-01', ram: '8192', cpu: 4 }
      },
      {
        id: 2,
        name: 'db-server-01',
        fields: { name: 'db-server-01', ram: '16384', cpu: 8 }
      },
      {
        id: 3,
        name: 'legacy-server', // Exists in iTOP but not in ESXi
        fields: { name: 'legacy-server', ram: '4096', cpu: 2 }
      }
    ];

    // Mock ESXi data
    const esxiVMs = [
      {
        name: 'web-server-01',
        memory_mb: 8192,
        numCPU: 4
      },
      {
        name: 'db-server-01',
        memory_mb: 16768, // Different memory!
        numCPU: 8
      },
      {
        name: 'new-vm-02', // Exists in ESXi but not in iTOP
        memory_mb: 4096,
        numCPU: 2
      }
    ];

    const vmDataMap = {
      itop: new Map(itopVMs.map(vm => [vm.fields?.name || vm.name, vm])),
      esxi: new Map(esxiVMs.map(vm => [vm.name, vm]))
    };

    const discrepancies = [];

    console.log(`📊 Comparing ${vmDataMap.esxi.size} ESXi VMs against ${vmDataMap.itop.size} iTOP VMs\n`);

    // Check for VMs in ESXi but not in iTOP
    for (const [vmName, esxiVm] of vmDataMap.esxi.entries()) {
      if (!vmDataMap.itop.has(vmName)) {
        discrepancies.push({
          objectType: 'vm',
          identifier: vmName,
          sourceSystem: 'esxi',
          type: 'missing_in_itop',
          severity: 'medium',
          summary: `VM "${vmName}" exists in ESXi but not in iTOP CMDB`
        });
        console.log(`   ⚠️  MISSING IN iTOP: ${vmName}`);
      } else {
        // Compare field values
        const itopVm = vmDataMap.itop.get(vmName);
        const esxiMemory = esxiVm.memory_mb || 0;
        const itopMemory = itopVm.fields?.ram ? parseInt(itopVm.fields.ram) : 0;

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
            summary: `Memory mismatch for VM "${vmName}": iTOP=${itopMemory}MB, ESXi=${esxiMemory}MB`
          });
          console.log(`   🔄 MISMATCH: ${vmName} memory - iTOP=${itopMemory}MB vs ESXi=${esxiMemory}MB`);
        } else {
          console.log(`   ✅ MATCH: ${vmName}`);
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
          summary: `VM "${vmName}" exists in iTOP but not in ESXi (may have been deleted)`
        });
        console.log(`   ⚠️  EXTRA IN iTOP: ${vmName} (deleted or removed)`);
      }
    }

    console.log(`\n✅ Found ${discrepancies.length} discrepancies\n`);

    return NextResponse.json({
      ok: true,
      data: {
        systems: ['itop', 'esxi'],
        mode: 'demo',
        note: 'This is mock data to demo the comparison logic. Real data requires systems at 192.168.23.131 and 192.168.23.130',
        discrepancies,
        vmComparison: {
          itopVMs: vmDataMap.itop.size,
          esxiVMs: vmDataMap.esxi.size
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Demo sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Demo failed' },
      { status: 500 }
    );
  }
}
