#!/usr/bin/env node

import axios from 'axios';

const API_BASE = 'http://localhost:3000';

async function testSync() {
  console.log('\n🔴 TESTING REAL SYNC ENDPOINT\n');
  
  try {
    console.log('📍 Calling POST /api/sync-live...\n');
    const response = await axios.post(`${API_BASE}/api/sync-live`, {}, {
      timeout: 60000
    });
    
    console.log('✅ Response Status:', response.status);
    console.log('\n📋 SYNC RESULTS:\n');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.itop) {
      console.log('\n🟢 iTOP DATA:');
      console.log(`   - VMs: ${response.data.itop.vms?.length || 0}`);
      console.log(`   - Servers: ${response.data.itop.servers?.length || 0}`);
      console.log(`   - Volumes: ${response.data.itop.volumes?.length || 0}`);
      
      if (response.data.itop.vms?.length > 0) {
        console.log('\n   First VM:');
        console.log(JSON.stringify(response.data.itop.vms[0], null, 4).split('\n').slice(0, 10).join('\n'));
      }
    }
    
    if (response.data.vcenter) {
      console.log('\n🔵 VCENTER DATA:');
      console.log(`   - VMs: ${response.data.vcenter.vms?.length || 0}`);
      console.log(`   - Hosts: ${response.data.vcenter.hosts?.length || 0}`);
      console.log(`   - Datastores: ${response.data.vcenter.datastores?.length || 0}`);
    }
    
    if (response.data.discrepancies) {
      console.log('\n🔍 DISCREPANCIES:');
      console.log(`   - Total: ${response.data.discrepancies.length || 0}`);
      if (response.data.discrepancies.length > 0) {
        console.log(JSON.stringify(response.data.discrepancies.slice(0, 3), null, 2));
      } else {
        console.log('   (None found - systems are in sync!)');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testSync();
