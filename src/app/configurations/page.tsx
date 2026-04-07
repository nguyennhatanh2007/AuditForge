import { AppShell } from '@/components/layout/app-shell';
import { ConfigurationsClient } from '@/components/configurations/configurations-client';

export default function ConfigurationsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-semibold">Cấu hình nguồn</h2>
          <p className="text-sm text-mutedFg">Quản lý thông tin truy cập các hệ thống.</p>
        </div>
        <ConfigurationsClient />
      </div>
    </AppShell>
  );
}
