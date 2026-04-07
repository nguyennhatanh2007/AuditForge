import { NextResponse } from 'next/server';
import { listSyncJobs } from '@/lib/crud';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    
    const jobs = await listSyncJobs(Math.min(limit, 100));
    
    return NextResponse.json({
      data: jobs,
      total: jobs.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch sync jobs' },
      { status: 500 }
    );
  }
}
