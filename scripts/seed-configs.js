#!/usr/bin/env node

/**
 * Seed configurations into database with proper encryption
 */

const fs = require('fs');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

// Load environment variables from .env.local
const envFile = fs.readFileSync('.env.local', 'utf-8');
envFile.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/^\$/, '');
    }
  }
});

const algorithm = 'aes-256-gcm';

function deriveKey() {
  const seed = process.env.SYNC_ENCRYPTION_KEY ?? 'auditforge-dev-key';
  return crypto.createHash('sha256').update(seed).digest();
}

function encryptSecret(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

async function seedConfigurations() {
  let connection;

  try {
    console.log('🔌 Connecting to MySQL...');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'HappyServer$1',
      database: 'auditforge',
    });

    console.log('✅ Connected to database\n');

    // Clear existing configurations
    console.log('🗑️  Clearing existing configurations...');
    try {
      await connection.execute('DELETE FROM configurations');
    } catch (e) {
      // Table might not exist
    }

    // Create configurations table if it doesn't exist
    console.log('📋 Creating configurations table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS configurations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        system_type VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        url VARCHAR(255) NOT NULL,
        username VARCHAR(255),
        encrypted_password VARCHAR(500),
        port INT,
        api_path VARCHAR(255),
        last_test_status VARCHAR(50),
        last_test_code VARCHAR(10),
        last_test_message TEXT,
        enabled BOOLEAN DEFAULT true,
        last_checked_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Add iTOP configuration
    console.log('📝 Adding iTOP configuration...');
    const itopPassword = encryptSecret('baoviet@123');
    await connection.execute(
      `INSERT INTO configurations 
      (system_type, name, url, username, encrypted_password, port, api_path, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        'itop',
        'iTOP CMDB (Production)',
        'http://192.168.23.131/itop',
        'admin',
        itopPassword,
        null,
        '/webservices/rest.php',
        true,
      ]
    );
    console.log('✅ iTOP added\n');

    // Add vCenter/ESXi configuration
    console.log('📝 Adding vCenter/ESXi configuration...');
    const esxiPassword = encryptSecret('baoviet@123');
    await connection.execute(
      `INSERT INTO configurations 
      (system_type, name, url, username, encrypted_password, port, api_path, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        'vcenter',
        'vCenter/ESXi Host',
        'https://192.168.23.130',
        'root',
        esxiPassword,
        443,
        '/api',
        true,
      ]
    );
    console.log('✅ vCenter added\n');

    // Verify configurations
    console.log('📊 Verifying configurations...');
    const [rows] = await connection.execute('SELECT * FROM configurations');
    console.log(`Total configurations: ${rows.length}`);
    rows.forEach((row) => {
      console.log(`  ✓ ${row.system_type.toUpperCase()}: ${row.name} @ ${row.url}`);
    });

    console.log('\n🎉 Database seeding complete!');

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedConfigurations();
