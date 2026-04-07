#!/usr/bin/env node

/**
 * Test script for real-time sync endpoint
 * Calls POST /api/sync-live to fetch and compare data from ESXi and iTOP
 */

const http = require('http');

const postData = JSON.stringify({});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/sync-live',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

console.log('🚀 Testing real-time sync endpoint...\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('\n✅ Sync response received:\n');
      console.log(JSON.stringify(response, null, 2));

      if (response.ok) {
        console.log('\n📊 Summary:');
        console.log(`   Systems synced: ${response.data.systems.join(', ')}`);
        console.log(`   Discrepancies found: ${response.data.discrepancies.length}`);
        console.log(`   iTOP VMs: ${response.data.vmComparison.itopVMs}`);
        console.log(`   ESXi VMs: ${response.data.vmComparison.esxiVMs}`);

        if (response.data.discrepancies.length > 0) {
          console.log('\n🔍 Discrepancies:');
          response.data.discrepancies.forEach((d, idx) => {
            console.log(
              `   ${idx + 1}. [${d.severity}] ${d.type}: ${d.summary}`
            );
          });
        }
      }
    } catch (e) {
      console.error('Error parsing response:', e);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
});

req.write(postData);
req.end();

console.log('📨 Request sent to POST /api/sync-live...\n');
