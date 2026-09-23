import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Avvolge un elemento (tipicamente una Card) in un bordo con lo stesso gradiente viola-fucsia dei bottoni principali. */
export function GradientBorder({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-[1.5px]', className)}>
      {children}
    </div>
  );
}
