import { AppShell } from '@/components/layout/app-shell';
import { SyncDataTable } from '@/components/sync-status/sync-data-table';
import { SyncDataSummary } from '@/components/sync-status/sync-data-summary';

export default function SyncStatusPage() {
  return (
    <AppShell>
      <div className="container mx-auto p-6 space-y-8">
        <div>
          <h2 className="text-3xl font-semibold">Theo dõi trạng thái đồng bộ</h2>
          <p className="text-sm text-mutedFg">Theo dõi kết quả đồng bộ và dữ liệu theo nguồn.</p>
        </div>
        <SyncDataSummary />
        <div className="border-t border-border/70 pt-8">
          <SyncDataTable />
        </div>
      </div>
    </AppShell>
  );
}
