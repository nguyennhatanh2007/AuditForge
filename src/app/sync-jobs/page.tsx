import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { listSyncJobs } from '@/lib/crud';
import { syncJobs as mockSyncJobs } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export default async function SyncJobsPage() {
  let syncJobs = mockSyncJobs.slice(0, 3);

  try {
    syncJobs = await listSyncJobs(3);
  } catch {
    syncJobs = mockSyncJobs.slice(0, 3);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold">Nhật ký đồng bộ</h2>
            <p className="text-sm text-mutedFg">Theo dõi phiên chạy và trạng thái xử lý.</p>
          </div>
          <Button type="button">Tải lại</Button>
        </div>
        <div className="grid gap-4">
          {syncJobs.map((job) => (
            <Card key={job.id}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">{job.id}</div>
                  <div className="text-sm text-mutedFg">{job.note}</div>
                </div>
                <div className="text-sm text-mutedFg">
                  {job.status} · {job.succeededSources}/{job.totalSources} nguồn · {job.discrepancies} sai lệch
                </div>
              </div>
            </Card>
          ))}
          {!syncJobs.length ? <Card>Chưa có lịch sử đồng bộ nào.</Card> : null}
        </div>
      </div>
    </AppShell>
  );
}
