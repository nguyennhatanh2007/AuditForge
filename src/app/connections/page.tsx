import { ConnectionsClient } from '@/components/connections/connections-client';
import { AppShell } from '@/components/layout/app-shell';

export const metadata = {
  title: 'Kết nối hệ thống',
};

export default function Page() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-semibold">Kết nối hệ thống</h2>
          <p className="text-sm text-mutedFg">Thiết lập và kiểm tra kết nối nguồn dữ liệu.</p>
        </div>

        <ConnectionsClient />
      </div>
    </AppShell>
  );
}
