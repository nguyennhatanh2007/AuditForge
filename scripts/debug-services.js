#!/usr/bin/env node

/**
 * Debug script - directly test services with DB credentials
 */

const mysql = require('mysql2/promise');

async function testServices() {
  try {
    console.log('🔍 Testing services with DB credentials...\n');

    // Connect to MySQL
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'HappyServer$1',
      database: 'auditforge',
    });

    // Get configs
    const [rows] = await connection.execute('SELECT * FROM configurations WHERE enabled = true');
    console.log(`✅ Found ${rows.length} configurations\n`);

    rows.forEach(config => {
      console.log(`📋 ${config.system_type}:`);
      console.log(`   URL: ${config.url}`);
      console.log(`   User: ${config.username}`);
      console.log(`   Enabled: ${config.enabled}\n`);
    });

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testServices();
