'use client';

import { ReactNode } from 'react';

export function Topbar({ children }: { children?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-panel/70 px-6 py-4 backdrop-blur">
      <div>
        <p className="text-sm text-mutedFg">AuditForge</p>
        <h1 className="text-xl font-semibold text-fg">Giám sát sai lệch CMDB</h1>
      </div>
      {/* Theme toggle removed — single light theme enforced */}
      <div />
    </header>
  );
}
