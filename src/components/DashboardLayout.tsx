import { ReactNode } from 'react';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function DashboardLayout({ children, title, subtitle, action }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="px-4 py-4 sm:px-6 sm:py-6 lg:ml-64">
        <AppHeader title={title} subtitle={subtitle} action={action} />
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
