import { ConnectionsClient } from '@/components/connections/connections-client';
import { AppShell } from '@/components/layout/app-shell';

export const metadata = {
  title: 'Quản lý kết nối',
};

export default function Page() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-semibold">Quản lý kết nối</h2>
          <p className="text-sm text-mutedFg">Thêm / sửa / xóa kết nối tới VMware vCenter và các tủ đĩa.</p>
        </div>

        <ConnectionsClient />
      </div>
    </AppShell>
  );
}
