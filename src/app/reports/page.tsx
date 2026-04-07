import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function ReportsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-semibold">Báo cáo</h2>
          <p className="text-sm text-mutedFg">Xuất nhanh dữ liệu đối soát và ngoại lệ.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <h3 className="text-lg font-semibold">Báo cáo sai lệch</h3>
            <p className="mt-2 text-sm text-mutedFg">Xuất danh sách sai lệch hiện tại.</p>
            <Button className="mt-4">Xuất Excel</Button>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold">Báo cáo ngoại lệ</h3>
            <p className="mt-2 text-sm text-mutedFg">Xuất danh sách ngoại lệ đang áp dụng.</p>
            <Button className="mt-4" variant="secondary">Xuất Excel</Button>
          </Card>
        </div>
        <Card>
          <h3 className="text-lg font-semibold">Báo cáo hoạch định dung lượng</h3>
          <p className="mt-2 text-sm text-mutedFg">
            Theo dõi mức dùng, headroom và dự báo dung lượng.
          </p>
          <Link href="/capacity-planning" className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accentFg shadow-soft transition hover:opacity-90">
            Mở báo cáo capacity planning
          </Link>
        </Card>
      </div>
    </AppShell>
  );
}
