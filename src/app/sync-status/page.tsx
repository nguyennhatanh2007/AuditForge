import { AppShell } from '@/components/layout/app-shell';
import { SyncDataTable } from '@/components/sync-status/sync-data-table';
import { SyncDataSummary } from '@/components/sync-status/sync-data-summary';

export default function SyncStatusPage() {
  return (
    <AppShell>
      <div className="container mx-auto p-6 space-y-8">
        <SyncDataSummary />
        <div className="border-t border-border/70 pt-8">
          <SyncDataTable />
        </div>
      </div>
    </AppShell>
  );
}
