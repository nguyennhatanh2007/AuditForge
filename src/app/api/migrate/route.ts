import { NextResponse } from 'next/server';
import knex from 'knex';
import { getMysqlConfig } from '@/config/mysql';

export async function POST() {
  try {
    console.log('Starting migrations...');
    const db = knex(getMysqlConfig());

    const result = await db.migrate.latest();
    console.log('Migration result:', result);

    await db.destroy();

    return NextResponse.json({
      success: true,
      message: 'Migrations completed successfully',
      result
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
