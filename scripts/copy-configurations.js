#!/usr/bin/env node
const knexFactory = require('knex');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load .env.local manually if present (avoid adding dotenv dependency)
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const contents = fs.readFileSync(envPath, 'utf8');
  contents.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) {
      let val = m[2];
      // strip quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[m[1]] = process.env[m[1]] ?? val;
    }
  });
}

function deriveKey() {
  const seed = process.env.SYNC_ENCRYPTION_KEY || 'auditforge-dev-key';
  return crypto.createHash('sha256').update(seed).digest();
}
function encryptSecret(value) {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

(async function main(){
  const dbConfig = {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    pool: { min: 0, max: 2 },
  };

  const knex = knexFactory(dbConfig);

  try {
    const exists = await knex.schema.hasTable('configurations');
    if (!exists) {
      console.log('Table `configurations` does not exist. Nothing to copy.');
      process.exit(0);
    }

    const rows = await knex('configurations').select('*');
    console.log(`Found ${rows.length} rows in configurations.`);

    for (const row of rows) {
      // Map fields conservatively
      const system_type = row.system_type || row.systemType || row.system || row.type || null;
      if (!system_type) {
        console.warn('Skipping row with no system_type/name:', row);
        continue;
      }

      // Check for duplicate by url or name
      const existsTarget = await knex('system_configs').where('url', row.url).orWhere('name', row.name).first();
      if (existsTarget) {
        console.log(`Skipping existing system_configs entry for url=${row.url} or name=${row.name}`);
        continue;
      }

      // Determine encrypted_password
      let encrypted_password = null;
      if (row.encrypted_password) {
        encrypted_password = row.encrypted_password;
      } else if (row.password) {
        encrypted_password = encryptSecret(row.password);
      } else if (row.secret) {
        encrypted_password = encryptSecret(row.secret);
      }

      const payload = {
        system_type: system_type,
        name: row.name || row.label || `import-${Date.now()}`,
        url: row.url || row.host || row.endpoint || '',
        username: row.username || row.user || null,
        encrypted_password: encrypted_password || null,
        enabled: row.enabled === undefined ? true : Boolean(row.enabled),
        port: row.port ?? null,
        api_path: row.api_path ?? row.apiPath ?? null,
        last_test_status: row.last_test_status ?? null,
      };

      const [id] = await knex('system_configs').insert(payload);
      console.log(`Inserted system_configs id=${id} name=${payload.name} system_type=${payload.system_type}`);
    }

    console.log('Done.');
  } catch (err) {
    console.error('Error during copy:', err);
    process.exit(2);
  } finally {
    await knex.destroy();
  }
})();
