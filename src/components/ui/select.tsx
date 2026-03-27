import { cn } from '@/lib/utils';
import type { SelectHTMLAttributes } from 'react';

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-11 w-full rounded-xl border border-border bg-transparent px-3 text-sm outline-none transition focus:border-accent',
        className,
      )}
      {...props}
    />
  );
}
