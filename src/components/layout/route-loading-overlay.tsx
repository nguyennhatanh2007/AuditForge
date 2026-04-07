'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';

export function RouteLoadingOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const currentUrlRef = useRef('');

  useEffect(() => {
    try {
      const nextUrl = `${pathname}?${searchParams.toString()}`;
      if (currentUrlRef.current && currentUrlRef.current !== nextUrl) {
        setVisible(true);
        const timer = window.setTimeout(() => setVisible(false), 350);
        currentUrlRef.current = nextUrl;
        return () => window.clearTimeout(timer);
      }

      currentUrlRef.current = nextUrl;
      return undefined;
    } catch {
      setVisible(false);
      return undefined;
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    try {
      const history = window.history;
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      const triggerLoading = () => setVisible(true);

      history.pushState = function patchedPushState(...args) {
        triggerLoading();
        return originalPushState.apply(this, args);
      };

      history.replaceState = function patchedReplaceState(...args) {
        triggerLoading();
        return originalReplaceState.apply(this, args);
      };

      window.addEventListener('popstate', triggerLoading);

      return () => {
        history.pushState = originalPushState;
        history.replaceState = originalReplaceState;
        window.removeEventListener('popstate', triggerLoading);
      };
    } catch {
      setVisible(false);
      return undefined;
    }
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/20 bg-white/90 px-8 py-7 shadow-2xl">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <div className="text-center">
          <p className="text-sm font-semibold text-fg">Đang chuyển trang</p>
          <p className="text-xs text-mutedFg">Vui lòng chờ trong giây lát...</p>
        </div>
      </div>
    </div>
  );
}