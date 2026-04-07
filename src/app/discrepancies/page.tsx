import { AppShell } from '@/components/layout/app-shell';
import { DiscrepanciesClient } from '@/components/discrepancies/discrepancies-client';

export default function DiscrepanciesPage() {
  return (
    <AppShell>
      <DiscrepanciesClient />
    </AppShell>
  );
}
