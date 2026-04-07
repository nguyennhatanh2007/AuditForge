import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-xl border border-border bg-transparent px-3 text-sm outline-none transition placeholder:text-mutedFg focus:border-accent',
        className,
      )}
      {...props}
    />
  );
}
