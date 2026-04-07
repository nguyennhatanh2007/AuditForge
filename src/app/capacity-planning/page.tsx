import { AppShell } from '@/components/layout/app-shell';
import { CapacityPlanningClient } from '@/components/capacity-planning/capacity-planning-client';

export default function CapacityPlanningPage() {
  return (
    <AppShell>
      <CapacityPlanningClient />
    </AppShell>
  );
}