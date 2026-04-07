import type { PropsWithChildren } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-white to-slate-50 text-fg">
      <Sidebar />
      <div className="min-w-0 lg:ml-72">
        <Topbar />
        <main className="min-w-0 p-6">{children}</main>
      </div>
    </div>
  );
}
