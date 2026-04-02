import { AppShell } from '@/components/layout/app-shell';
import { InvenuoryClient } from '@/components/inventory/inventory-client';

export default function InventoryPage() {
  return (
    <AppShell>
      <InvenuoryClient />
    </AppShell>
  );
}
