import { NextResponse } from 'next/server';
import { listSyncJobs, trimSyncJobsHistory } from '@/lib/crud';

export async function GET(request: Request) {
  try {
    await trimSyncJobsHistory(3);
    const jobs = await listSyncJobs(3);

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
