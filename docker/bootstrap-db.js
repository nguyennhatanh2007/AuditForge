const mysql = require('mysql2/promise');

const databaseName = process.env.DB_NAME || 'auditforge';
const host = process.env.DB_HOST || '127.0.0.1';
const port = Number(process.env.DB_PORT || 3306);
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';

async function ensureDatabase(connection) {
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
}

async function ensureSchema(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS system_configs (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      system_type ENUM('itop', 'vcenter', 'unity', 'pure', 'alletra') NOT NULL,
      name VARCHAR(191) NOT NULL,
      url VARCHAR(500) NOT NULL,
      api_path VARCHAR(500) NULL,
      auth_mode VARCHAR(50) NULL,
      username VARCHAR(191) NULL,
      encrypted_password TEXT NULL,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      last_checked_at TIMESTAMP NULL,
      last_connection_result TEXT NULL,
      last_connection_test_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS sync_jobs (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      started_at TIMESTAMP NOT NULL,
      finished_at TIMESTAMP NULL,
      status ENUM('running', 'success', 'failed', 'partial') NOT NULL,
      total_sources INT NOT NULL DEFAULT 0,
      succeeded_sources INT NOT NULL DEFAULT 0,
      discrepancies INT NOT NULL DEFAULT 0,
      note TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS discrepancies (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      sync_job_id INT UNSIGNED NULL,
      object_type VARCHAR(32) NOT NULL,
      identifier VARCHAR(255) NOT NULL,
      source_system VARCHAR(191) NOT NULL,
      discrepancy_type ENUM('missing_in_itop', 'extra_in_itop', 'field_mismatch') NOT NULL,
      field_name VARCHAR(191) NULL,
      itop_value TEXT NULL,
      source_value TEXT NULL,
      severity ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
      summary TEXT NOT NULL,
      is_exception BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX discrepancies_object_identifier_idx (object_type, identifier),
      INDEX discrepancies_source_identifier_idx (source_system, identifier),
      CONSTRAINT discrepancies_sync_job_fk FOREIGN KEY (sync_job_id) REFERENCES sync_jobs(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS exceptions (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      object_type ENUM('vm', 'host', 'lun') NOT NULL,
      identifier VARCHAR(255) NOT NULL,
      source_system VARCHAR(191) NOT NULL,
      reason TEXT NOT NULL,
      created_by VARCHAR(191) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX exceptions_lookup_idx (object_type, identifier, source_system)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

(async () => {
  const adminConnection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: false,
  });

  try {
    console.log(`Ensuring database exists: ${databaseName}`);
    await ensureDatabase(adminConnection);
  } finally {
    await adminConnection.end();
  }

  const dbConnection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database: databaseName,
    multipleStatements: false,
  });

  try {
    console.log('Ensuring schema exists');
    await ensureSchema(dbConnection);
    console.log('Database bootstrap complete');
  } finally {
    await dbConnection.end();
  }
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});