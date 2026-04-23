import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  showWordmark?: boolean;
}

export default function Logo({ className, variant = 'dark', showWordmark = true }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-glow">
        <Zap className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} fill="currentColor" />
      </div>
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className={cn(
            'font-heading text-lg font-extrabold tracking-tight',
            variant === 'light' ? 'text-sidebar-foreground' : 'text-foreground'
          )}>
            FieldForce
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
            India
          </span>
        </div>
      )}
    </div>
  );
}