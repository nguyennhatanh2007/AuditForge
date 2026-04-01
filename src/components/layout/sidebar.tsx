'use client';

import { BarChart3, Database, FileBarChart2, ShieldAlert, Settings, RefreshCcw, LayoutDashboard, HardDrive } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const items = [
  { href: '/', label: 'Bảng điều khiển', icon: LayoutDashboard },
  { href: '/inventory', label: 'Kho dữ liệu', icon: HardDrive },
  { href: '/discrepancies', label: 'Sai lệch dữ liệu', icon: ShieldAlert },
  { href: '/exceptions', label: 'Ngoại lệ', icon: Database },
  { href: '/sync-jobs', label: 'Lịch sử đồng bộ', icon: RefreshCcw },
  { href: '/configurations', label: 'Cấu hình kết nối', icon: Settings },
  { href: '/reports', label: 'Báo cáo', icon: FileBarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-border bg-[#0b1220] px-4 py-5 text-slate-100 lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accentFg shadow-soft">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Audit Forge</div>
          <div className="text-lg font-semibold">Đồng bộ CMDB</div>
        </div>
      </div>
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition hover:bg-white/8',
                active && 'bg-white/10 text-white',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        Luồng đồng bộ hiện đại, có nhận diện và bỏ qua bản ghi ngoại lệ.
      </div>
    </aside>
  );
}
