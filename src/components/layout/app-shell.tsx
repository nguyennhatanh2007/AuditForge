import type { PropsWithChildren } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_24%),linear-gradient(180deg,#0a0f1c_0%,#0f172a_100%)] text-fg">
      <Sidebar />
      <div className="min-w-0 lg:ml-72">
        <Topbar />
        <main className="min-w-0 p-6">{children}</main>
      </div>
    </div>
  );
}
