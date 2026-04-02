#!/usr/bin/env node

import axios from 'axios';

const API_BASE = 'http://localhost:3000';

async function testRealData() {
  console.log('\n' + '='*60);
  console.log('  REAL SYSTEM DATA RETRIEVAL TEST');
  console.log('='*60 + '\n');
  
  try {
    // Call the sync endpoint
    const response = await axios.post(`${API_BASE}/api/sync-live`, {}, {
      timeout: 60000
    });
    
    console.log('✅ Connected to real systems successfully!\n');
    
    const data = response.data.data || response.data;
    
    console.log('SYSTEMS TESTED:');
    console.log('  🔹 iTOP CMDB at 192.168.23.131');
    console.log('  🔹 vCenter/ESXi at 192.168.23.130\n');
    
    console.log('DATA RETRIEVED:');
    console.log(`  📊 Systems: ${JSON.stringify(data.systems)}`);
    console.log(`  💾 VM Comparison:`);
    console.log(`     - iTOP VMs found: ${data.vmComparison.itopVMs}`);
    console.log(`     - ESXi VMs found: ${data.vmComparison.esxiVMs}`);
    console.log(`  🔍 Discrepancies detected: ${data.discrepancies.length}`);
    console.log(`  🕐 Sync timestamp: ${data.timestamp}\n`);
    
    if (data.discrepancies.length > 0) {
      console.log('DISCREPANCIES FOUND:');
      data.discrepancies.slice(0, 5).forEach((disc, i) => {
        console.log(`  ${i+1}. ${disc.identifier}`);
        console.log(`     Type: ${disc.type}`);
        console.log(`     Severity: ${disc.severity}`);
      });
    } else {
      console.log('✅ NO DISCREPANCIES - Systems are synchronized!\n');
    }
    
    console.log('='*60);
    console.log('  REAL SYSTEM CONNECTION: SUCCESS ✅');
    console.log('='*60 + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testRealData();
