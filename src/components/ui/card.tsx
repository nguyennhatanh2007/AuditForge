import { cn } from '@/lib/utils';
import type { HTMLAttributes, PropsWithChildren } from 'react';

export function Card({ className, children, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={cn('rounded-2xl border border-border bg-panel/90 p-5 shadow-soft', className)} {...props}>
      {children}
    </div>
  );
}
