import type { Knex } from 'knex';
import { getMysqlConfig } from '@/config/mysql';

let dbInstance: Knex | null = null;

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const { connection } = getMysqlConfig();
  const normalizedConnection = connection as { host?: string; user?: string; database?: string } | undefined;

  if (!normalizedConnection?.host || !normalizedConnection?.user || !normalizedConnection?.database) {
    return null;
  }

  const knexFactory = require('knex') as unknown as (config: Record<string, unknown>) => Knex;

  dbInstance = knexFactory({
    ...getMysqlConfig(),
    connection: {
      ...(getMysqlConfig().connection as Record<string, unknown>),
      multipleStatements: false,
    },
    pool: { min: 0, max: 10 },
  });

  return dbInstance;
}
