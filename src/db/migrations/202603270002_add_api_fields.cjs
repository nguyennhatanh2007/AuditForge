exports.up = async function up(knex) {
  const hasUrl = await knex.schema.hasColumn('system_configs', 'api_path');
  if (!hasUrl) {
    await knex.schema.alterTable('system_configs', (table) => {
      table.string('api_path', 500).nullable().after('url');
      table.string('auth_mode', 50).nullable().after('api_path');
    });
  }
};

exports.down = async function down(knex) {
  const hasApiPath = await knex.schema.hasColumn('system_configs', 'api_path');
  if (hasApiPath) {
    await knex.schema.alterTable('system_configs', (table) => {
      table.dropColumn('api_path');
      table.dropColumn('auth_mode');
    });
  }
};