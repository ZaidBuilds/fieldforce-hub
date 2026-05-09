import { Bell, Search, Menu, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import OnlineIndicator from './OnlineIndicator';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function AppHeader({ title, subtitle, action }: AppHeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-6 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
      <div className="flex items-center gap-3 lg:hidden">
        <Logo />
        <div className="ml-auto flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={() => navigate('/app/jobs')} aria-label="Search">
            <Search className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Menu">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1 min-w-0">
          {title && (
            <h1 className="truncate font-heading text-2xl font-bold text-foreground sm:text-[28px]">
              {title}
            </h1>
          )}
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <OnlineIndicator />
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search jobs, customers…" className="h-10 w-72 rounded-full border-border/70 bg-secondary pl-9" />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
              ⌘K
            </kbd>
          </div>
          <Button size="icon" variant="outline" className="rounded-full" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          {action ?? (
            <Button onClick={() => navigate('/app/jobs')} className="gap-2 rounded-full gradient-primary text-primary-foreground shadow-glow">
              <Plus className="h-4 w-4" /> New Job
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}