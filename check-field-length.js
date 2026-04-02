#!/usr/bin/env node

const mysql = require('mysql2/promise');

async function checkPasswordLength() {
  try {
    console.log('🔍 Checking encrypted password field lengths...\n');

    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'HappyServer$1',
      database: 'auditforge',
    });

    const [rows] = await connection.execute('SELECT system_type, LENGTH(encrypted_password) as len, encrypted_password FROM configurations');

    rows.forEach(row => {
      console.log(`${row.system_type}: Length=${row.len}`);
      console.log(`  Value: ${row.encrypted_password}`);
      console.log(`  ✓ Good\n`);
    });

    // Check table structure
    const [columns] = await connection.execute("SHOW COLUMNS FROM configurations WHERE Field = 'encrypted_password'");
    console.log('Column definition:');
    console.log(JSON.stringify(columns, null, 2));

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPasswordLength();
