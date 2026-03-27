import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'default' | 'secondary' | 'ghost' | 'danger';

export function Button({
  className,
  variant = 'default',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const variantClass: Record<ButtonVariant, string> = {
    default: 'bg-accent text-accentFg hover:opacity-90 shadow-soft',
    secondary: 'bg-panel text-fg border border-border hover:bg-muted/40',
    ghost: 'bg-transparent text-fg hover:bg-muted/30',
    danger: 'bg-danger text-white hover:opacity-90',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
}
