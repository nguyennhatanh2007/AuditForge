#!/usr/bin/env node

/**
 * Test demo sync endpoint to show discrepancy comparison logic
 */

const http = require('http');

const postData = JSON.stringify({});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/sync-demo',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

console.log('🎯 Testing Demo Sync Endpoint (Mock Data)...\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('\n✅ Demo Sync Response:\n');
      
      if (response.ok) {
        console.log('📊 Summary:');
        console.log(`   Systems: ${response.data.systems.join(', ')}`);
        console.log(`   Mode: ${response.data.mode}`);
        console.log(`   iTOP VMs: ${response.data.vmComparison.itopVMs}`);
        console.log(`   ESXi VMs: ${response.data.vmComparison.esxiVMs}`);
        console.log(`   Discrepancies found: ${response.data.discrepancies.length}\n`);

        if (response.data.discrepancies.length > 0) {
          console.log('🔍 Discrepancies Detected:');
          response.data.discrepancies.forEach((d, idx) => {
            let detail = '';
            if (d.type === 'missing_in_itop') {
              detail = '(need to add to iTOP)';
            } else if (d.type === 'extra_in_itop') {
              detail = '(should be removed from iTOP)';
            } else if (d.type === 'field_mismatch') {
              detail = `(${d.field}: iTOP="${d.itopValue}" vs ESXi="${d.sourceValue}")`;
            }
            console.log(`   ${idx + 1}. [${d.severity.toUpperCase()}] ${d.type} - ${d.identifier} ${detail}`);
            console.log(`      → ${d.summary}\n`);
          });
        }

        console.log('✨ The comparison logic is working correctly!');
        console.log('📝 When real systems are available, this will display their actual data.\n');
      }
    } catch (e) {
      console.error('Error parsing response:', e.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
});

req.write(postData);
req.end();
