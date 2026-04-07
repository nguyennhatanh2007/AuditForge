#!/usr/bin/env node

/**
 * Debug vCenter/ESXi API endpoints
 */

import https from 'https';

const host = '192.168.23.130';
const port = 443;
const username = 'root';
const password = 'baoviet@123';

// Create HTTPS agent that ignores self-signed certificates
const agent = new https.Agent({
  rejectUnauthorized: false
});

// Try different possible API endpoints
const endpoints = [
  '/api',
  '/api/vcenter/vm',
  '/rest/vcenter/vm',
  '/sdk',
  '/vc-auth-service',
  '/com/vmware/cis/session',
  '/',
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    
    const options = {
      hostname: host,
      port: port,
      path: endpoint,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      agent: agent,
      timeout: 5000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          endpoint,
          status: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          dataPreview: data.substring(0, 200)
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        endpoint,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        endpoint,
        error: 'Timeout'
      });
    });

    req.end();
  });
}

async function debugVcenter() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  ESXi API Endpoint Debug               ║');
  console.log('╚════════════════════════════════════════╝\n');

  console.log(`Host: ${host}:${port}`);
  console.log(`Auth: ${username}:${password.replace(/./g, '*')}\n`);
  
  console.log('Testing endpoints...\n');

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    
    if (result.error) {
      console.log(`❌ ${endpoint.padEnd(30)} → ${result.error}`);
    } else {
      const statusColor = result.status >= 200 && result.status < 300 ? '✅' : '⚠️ ';
      console.log(`${statusColor} ${endpoint.padEnd(30)} → HTTP ${result.status} ${result.statusMessage}`);
      if (result.dataPreview) {
        console.log(`   Preview: ${result.dataPreview}...`);
      }
    }
  }
  
  console.log('\n✅ Debugging complete\n');
}

debugVcenter().catch(console.error);
