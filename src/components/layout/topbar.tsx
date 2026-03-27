'use client';

import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function Topbar() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-panel/70 px-6 py-4 backdrop-blur">
      <div>
        <p className="text-sm text-mutedFg">AuditForge</p>
        <h1 className="text-xl font-semibold text-fg">Giám sát sai lệch CMDB</h1>
      </div>
      <Button variant="secondary" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        {theme === 'dark' ? <SunMedium className="mr-2 h-4 w-4" /> : <MoonStar className="mr-2 h-4 w-4" />}
        Đổi giao diện
      </Button>
    </header>
  );
}
