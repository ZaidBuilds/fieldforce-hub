import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Enums } from '@/integrations/supabase/types';

const statusConfig: Record<Enums<'job_status'>, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-warning/15 text-warning border-warning/30' },
  assigned: { label: 'Assigned', className: 'bg-accent/15 text-accent border-accent/30' },
  in_progress: { label: 'In Progress', className: 'bg-primary/15 text-primary border-primary/30' },
  completed: { label: 'Completed', className: 'bg-success/15 text-success border-success/30' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/15 text-destructive border-destructive/30' },
};

export default function JobStatusBadge({ status }: { status: Enums<'job_status'> }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  );
}
