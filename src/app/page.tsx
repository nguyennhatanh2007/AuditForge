import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { listSyncJobs, listSystemConfigs, listDiscrepancies } from '@/lib/crud';
import { discrepancies, syncJobs, systemConfigs } from '@/lib/mock-data';
import { ArrowUpRight, ShieldAlert, ServerCog, Database, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  let liveSystemConfigs = systemConfigs;
  let liveSyncJobs = syncJobs;
  let liveDiscrepancies = discrepancies;

  try {
    liveSystemConfigs = await listSystemConfigs();
    liveSyncJobs = await listSyncJobs(1);
    liveDiscrepancies = (await listDiscrepancies({ page: 1, pageSize: 1 })).items;
  } catch {
    liveSystemConfigs = systemConfigs;
    liveSyncJobs = syncJobs;
    liveDiscrepancies = discrepancies;
  }

  const stats = [
    { label: 'Nguồn đang bật', value: liveSystemConfigs.filter((item) => item.enabled).length, icon: ServerCog },
    { label: 'Sai lệch mở', value: liveDiscrepancies.length, icon: ShieldAlert },
    { label: 'Ngoại lệ', value: 1, icon: Database },
    { label: 'Trạng thái gần nhất', value: liveSyncJobs[0]?.status?.toUpperCase?.() ?? 'CHƯA CÓ', icon: RefreshCcw },
  ];

  return (
    <AppShell>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-mutedFg">{item.label}</p>
                  <div className="mt-1 text-2xl font-semibold">{item.value}</div>
                </div>
                <div className="rounded-lg bg-accent/15 p-2 text-accent shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold">Lần đồng bộ gần nhất</h3>
              <p className="text-xs text-mutedFg">Thông tin chi tiết lần chạy</p>
            </div>
            <Link href="/sync-jobs" className="inline-flex items-center gap-1 text-xs text-accent shrink-0">
              Xem <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-3 space-y-2 text-xs text-mutedFg">
            <div className="flex justify-between">
              <span>Job ID:</span>
              <span className="font-mono">{liveSyncJobs[0]?.id?.slice(0, 8) ?? 'Chưa có'}</span>
            </div>
            <div className="flex justify-between">
              <span>Trạng thái:</span>
              <span className="font-medium">{liveSyncJobs[0]?.status?.toUpperCase?.() ?? 'CHƯA CÓ'}</span>
            </div>
            <div className="flex justify-between">
              <span>Nguồn xử lý:</span>
              <span>{liveSyncJobs[0]?.succeededSources ?? 0}/{liveSyncJobs[0]?.totalSources ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Sai lệch:</span>
              <span>{liveSyncJobs[0]?.discrepancies ?? 0}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div>
            <h3 className="text-sm font-semibold">Phạm vi hệ thống ({liveSystemConfigs.length})</h3>
          </div>
          <div className="mt-3 space-y-2 text-xs">
            {liveSystemConfigs.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-slate-50 px-3 py-2">
                <div className="min-w-0 truncate">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-mutedFg"> · {item.systemType.toUpperCase()}</span>
                </div>
                <span className={`shrink-0 ${item.enabled ? 'text-emerald-300' : 'text-amber-300'}`}>{item.enabled ? '✓' : '◎'}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
