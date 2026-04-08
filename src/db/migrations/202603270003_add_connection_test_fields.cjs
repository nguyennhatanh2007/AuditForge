exports.up = async function up(knex) {
  const hasLastResult = await knex.schema.hasColumn('system_configs', 'last_connection_result');
  if (!hasLastResult) {
    await knex.schema.alterTable('system_configs', (table) => {
      table.text('last_connection_result').nullable().after('last_checked_at');
      table.timestamp('last_connection_test_at').nullable().after('last_connection_result');
    });
  }
};

exports.down = async function down(knex) {
  const hasLastResult = await knex.schema.hasColumn('system_configs', 'last_connection_result');
  if (hasLastResult) {
    await knex.schema.alterTable('system_configs', (table) => {
      table.dropColumn('last_connection_test_at');
      table.dropColumn('last_connection_result');
    });
  }
};