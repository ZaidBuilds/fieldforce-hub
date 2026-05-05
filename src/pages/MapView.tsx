import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons (vite/leaflet)
const icon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:50%;background:hsl(var(--primary));border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export default function MapView() {
  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, status, latitude, longitude, address, city, customers(name)')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Default to India center if no jobs
  const center: [number, number] = jobs.length
    ? [Number(jobs[0].latitude), Number(jobs[0].longitude)]
    : [20.5937, 78.9629];

  return (
    <DashboardLayout title="Job Map" subtitle="Visualize jobs across the city">
      <Card className="overflow-hidden border-border/70 shadow-card">
        <CardContent className="p-0">
          <div className="h-[70vh] w-full">
            <MapContainer center={center} zoom={jobs.length ? 11 : 5} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {jobs.map((j: any) => (
                <Marker key={j.id} position={[Number(j.latitude), Number(j.longitude)]} icon={icon}>
                  <Popup>
                    <div className="space-y-1">
                      <p className="font-semibold">{j.title}</p>
                      <p className="text-xs">{j.customers?.name}</p>
                      <p className="text-xs text-muted-foreground">{j.address}, {j.city}</p>
                      <Link to={`/app/jobs/${j.id}`} className="text-xs text-primary underline">Open job</Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
      {jobs.length === 0 && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          No jobs with coordinates yet. Add latitude/longitude to a job to see it here.
        </p>
      )}
    </DashboardLayout>
  );
}