import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ReportsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-semibold">Báo cáo</h2>
          <p className="text-sm text-mutedFg">Xuất Excel cho danh sách sai lệch và ngoại lệ sẽ được bổ sung ở bước sau.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <h3 className="text-lg font-semibold">Xuất sai lệch</h3>
            <p className="mt-2 text-sm text-mutedFg">Tạo file Excel chứa các bản ghi sai lệch đang hiển thị.</p>
            <Button className="mt-4">Xuất Excel</Button>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold">Xuất ngoại lệ</h3>
            <p className="mt-2 text-sm text-mutedFg">Tạo file Excel chứa danh sách ngoại lệ phục vụ kiểm tra.</p>
            <Button className="mt-4" variant="secondary">Xuất Excel</Button>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
