import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('system_configs', (table) => {
    table.increments('id').primary();
    table.enum('system_type', ['itop', 'vcenter', 'unity', 'pure', 'alletra']).notNullable();
    table.string('name', 191).notNullable();
    table.string('url', 500).notNullable();
    table.string('username', 191).nullable();
    table.text('encrypted_password').nullable();
    table.boolean('enabled').notNullable().defaultTo(true);
    table.timestamp('last_checked_at').nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('sync_jobs', (table) => {
    table.increments('id').primary();
    table.timestamp('started_at').notNullable();
    table.timestamp('finished_at').nullable();
    table.enum('status', ['running', 'success', 'failed', 'partial']).notNullable();
    table.integer('total_sources').notNullable().defaultTo(0);
    table.integer('succeeded_sources').notNullable().defaultTo(0);
    table.integer('discrepancies').notNullable().defaultTo(0);
    table.text('note').nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('discrepancies', (table) => {
    table.increments('id').primary();
    table.integer('sync_job_id').unsigned().nullable().references('id').inTable('sync_jobs').onDelete('CASCADE');
    table.string('object_type', 32).notNullable();
    table.string('identifier', 255).notNullable();
    table.string('source_system', 191).notNullable();
    table.enum('discrepancy_type', ['missing_in_itop', 'extra_in_itop', 'field_mismatch']).notNullable();
    table.string('field_name', 191).nullable();
    table.text('itop_value').nullable();
    table.text('source_value').nullable();
    table.enum('severity', ['low', 'medium', 'high']).notNullable().defaultTo('medium');
    table.text('summary').notNullable();
    table.boolean('is_exception').notNullable().defaultTo(false);
    table.timestamps(true, true);
    table.index(['object_type', 'identifier']);
    table.index(['source_system', 'identifier']);
  });

  await knex.schema.createTable('exceptions', (table) => {
    table.increments('id').primary();
    table.enum('object_type', ['vm', 'host', 'lun']).notNullable();
    table.string('identifier', 255).notNullable();
    table.string('source_system', 191).notNullable();
    table.text('reason').notNullable();
    table.string('created_by', 191).notNullable();
    table.timestamps(true, true);
    table.index(['object_type', 'identifier', 'source_system'], 'exceptions_lookup_idx');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('exceptions');
  await knex.schema.dropTableIfExists('discrepancies');
  await knex.schema.dropTableIfExists('sync_jobs');
  await knex.schema.dropTableIfExists('system_configs');
}
