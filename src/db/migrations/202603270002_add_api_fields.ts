import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasPort = await knex.schema.hasColumn('system_configs', 'port');
  if (!hasPort) {
    await knex.schema.alterTable('system_configs', (table) => {
      table.integer('port').nullable();
    });
  }

  const hasApi = await knex.schema.hasColumn('system_configs', 'api_path');
  if (!hasApi) {
    await knex.schema.alterTable('system_configs', (table) => {
      table.string('api_path', 500).nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasApi = await knex.schema.hasColumn('system_configs', 'api_path');
  if (hasApi) {
    await knex.schema.alterTable('system_configs', (table) => {
      table.dropColumn('api_path');
    });
  }

  const hasPort = await knex.schema.hasColumn('system_configs', 'port');
  if (hasPort) {
    await knex.schema.alterTable('system_configs', (table) => {
      table.dropColumn('port');
    });
  }
}
