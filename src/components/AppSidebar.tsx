import { LayoutDashboard, Briefcase, Users, FileText, MapPin, Settings, Calendar, BarChart3, Repeat, Package, Wallet, Map, Receipt, Sparkles } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Logo from './Logo';

const navGroups = [
  {
    label: 'Operations',
    items: [
      { to: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/app/schedule', icon: Calendar, label: 'Schedule' },
      { to: '/app/jobs', icon: Briefcase, label: 'Jobs' },
      { to: '/app/map', icon: Map, label: 'Map' },
      { to: '/app/contracts', icon: Repeat, label: 'AMC Contracts' },
    ],
  },
  {
    label: 'Directory',
    items: [
      { to: '/app/technicians', icon: Users, label: 'Technicians' },
      { to: '/app/customers', icon: MapPin, label: 'Customers' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/app/invoices', icon: FileText, label: 'Invoices' },
      { to: '/app/collections', icon: Receipt, label: 'Collections' },
      { to: '/app/inventory', icon: Package, label: 'Inventory' },
      { to: '/app/expenses', icon: Wallet, label: 'Expenses' },
      { to: '/app/reports', icon: BarChart3, label: 'Reports' },
      { to: '/app/insights', icon: Sparkles, label: 'Insights' },
    ],
  },
];

export default function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col gradient-sidebar border-r border-sidebar-border lg:flex">
      <div className="flex h-16 items-center px-5 border-b border-sidebar-border">
        <Logo variant="light" />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navGroups.map(group => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40">
              {group.label}
            </p>
            {group.items.map(item => {
              const isActive = item.end
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
                  )}
                  <item.icon className={cn("h-[18px] w-[18px]", isActive && "text-sidebar-primary")} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <NavLink
          to="/app/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            location.pathname === '/app/settings'
              ? "bg-sidebar-accent text-sidebar-primary"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          )}
        >
          <Settings className="h-[18px] w-[18px]" />
          Settings
        </NavLink>
        <div className="mt-3 rounded-xl bg-sidebar-accent/40 p-3">
          <p className="text-xs font-semibold text-sidebar-foreground">Pro tip</p>
          <p className="mt-1 text-[11px] leading-snug text-sidebar-foreground/60">
            Send WhatsApp invoice to customers right after job completion.
          </p>
        </div>
      </div>
    </aside>
  );
}
