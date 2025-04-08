'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

interface GlowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          'relative inline-flex items-center justify-center overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900',
          className,
        )}
        ref={ref}
        {...props}
      >
        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#FF6B00_0%,#393BB2_50%,#FF6B00_100%)]" />
        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl dark:bg-slate-900">
          {children}
        </span>
      </button>
    );
  },
);

GlowButton.displayName = 'GlowButton';

export { GlowButton };
