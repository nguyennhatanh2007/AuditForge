import 'dotenv/config';
import knex from 'knex';
import { getMysqlConfig } from '../src/config/mysql';

async function migrate() {
  const db = knex(getMysqlConfig());
  try {
    console.log('Running migrations...');
    const result = await db.migrate.latest();
    console.log('Migrations completed:', result);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await db.destroy();
  }
}

migrate();
