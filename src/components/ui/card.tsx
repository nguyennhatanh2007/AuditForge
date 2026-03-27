import { cn } from '@/lib/utils';
import type { PropsWithChildren } from 'react';

export function Card({ className, children }: PropsWithChildren<{ className?: string }>) {
  return <div className={cn('rounded-2xl border border-border bg-panel/90 p-5 shadow-soft', className)}>{children}</div>;
}
