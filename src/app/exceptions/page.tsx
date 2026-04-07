import { AppShell } from '@/components/layout/app-shell';
import { ExceptionsClient } from '@/components/exceptions/exceptions-client';

export default function ExceptionsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-semibold">Ngoại lệ</h2>
          <p className="text-sm text-mutedFg">Quản lý các bản ghi cần loại trừ khỏi danh sách sai lệch.</p>
        </div>
        <ExceptionsClient />
      </div>
    </AppShell>
  );
}
