import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';

export default function Invoices() {
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase.from('invoices').select('*, customers(name, phone)').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <DashboardLayout title="Invoices" subtitle="GST-ready invoice tracking">
      <div className="space-y-6">
        {invoices.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>No invoices yet. Invoices are generated when jobs are completed.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {invoices.map(inv => (
              <Card key={inv.id} className="shadow-card hover:shadow-card-hover transition-shadow animate-fade-in">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-heading font-semibold">{inv.invoice_number}</p>
                      <Badge variant={inv.is_paid ? 'default' : 'outline'} className={inv.is_paid ? 'bg-success text-success-foreground' : 'border-warning text-warning'}>
                        {inv.is_paid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(inv as any).customers?.name} • {format(new Date(inv.created_at), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-bold text-xl">₹{inv.total_amount.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground">GST {inv.gst_rate}%: ₹{inv.gst_amount.toLocaleString('en-IN')}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
