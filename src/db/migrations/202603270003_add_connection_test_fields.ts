import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasStatus = await knex.schema.hasColumn('system_configs', 'last_test_status');
  const hasCode = await knex.schema.hasColumn('system_configs', 'last_test_code');
  const hasMessage = await knex.schema.hasColumn('system_configs', 'last_test_message');

  if (!hasStatus || !hasCode || !hasMessage) {
    await knex.schema.alterTable('system_configs', (table) => {
      if (!hasStatus) table.string('last_test_status', 32).nullable();
      if (!hasCode) table.string('last_test_code', 64).nullable();
      if (!hasMessage) table.text('last_test_message').nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasStatus = await knex.schema.hasColumn('system_configs', 'last_test_status');
  const hasCode = await knex.schema.hasColumn('system_configs', 'last_test_code');
  const hasMessage = await knex.schema.hasColumn('system_configs', 'last_test_message');

  if (hasStatus || hasCode || hasMessage) {
    await knex.schema.alterTable('system_configs', (table) => {
      if (hasStatus) table.dropColumn('last_test_status');
      if (hasCode) table.dropColumn('last_test_code');
      if (hasMessage) table.dropColumn('last_test_message');
    });
  }
}
