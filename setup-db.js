const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    // Create database if not exists
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    console.log('✓ Database created/exists');

    // Select the database
    await connection.execute(`USE \`${process.env.DB_NAME}\``);

    // Create configurations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`configurations\` (
        \`id\` varchar(36) PRIMARY KEY,
        \`system_type\` varchar(50) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`url\` varchar(1024),
        \`username\` varchar(255),
        \`password_encrypted\` text,
        \`enabled\` boolean DEFAULT true,
        \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`last_test_at\` timestamp,
        \`test_passed\` boolean
      )
    `);
    console.log('✓ configurations table created');

    // Create discrepancies table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`discrepancies\` (
        \`id\` varchar(36) PRIMARY KEY,
        \`configuration_id\` varchar(36),
        \`object_type\` varchar(100),
        \`object_id\` varchar(255),
        \`field_name\` varchar(100),
        \`value_system_a\` longtext,
        \`value_system_b\` longtext,
        \`severity\` enum('low', 'medium', 'high') DEFAULT 'low',
        \`discovered_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`marked_exception_at\` timestamp,
        FOREIGN KEY (\`configuration_id\`) REFERENCES \`configurations\`(\`id\`) ON DELETE CASCADE
      )
    `);
    console.log('✓ discrepancies table created');

    // Create exceptions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`exceptions\` (
        \`id\` varchar(36) PRIMARY KEY,
        \`discrepancy_id\` varchar(36),
        \`reason\` text,
        \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`expires_at\` timestamp,
        FOREIGN KEY (\`discrepancy_id\`) REFERENCES \`discrepancies\`(\`id\`) ON DELETE CASCADE
      )
    `);
    console.log('✓ exceptions table created');

    // Create sync_jobs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`sync_jobs\` (
        \`id\` varchar(36) PRIMARY KEY,
        \`configuration_id\` varchar(36),
        \`status\` enum('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
        \`started_at\` timestamp,
        \`completed_at\` timestamp,
        \`error_message\` text,
        \`records_synced\` int DEFAULT 0,
        FOREIGN KEY (\`configuration_id\`) REFERENCES \`configurations\`(\`id\`) ON DELETE CASCADE
      )
    `);
    console.log('✓ sync_jobs table created');

    console.log('\n✅ Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
  } finally {
    await connection.end();
  }
}

setupDatabase();
