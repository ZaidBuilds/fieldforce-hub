import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Schedule from "./pages/Schedule";
import Technicians from "./pages/Technicians";
import Customers from "./pages/Customers";
import Invoices from "./pages/Invoices";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Track from "./pages/Track";
import Feedback from "./pages/Feedback";
import MapView from "./pages/MapView";
import Contracts from "./pages/Contracts";
import Inventory from "./pages/Inventory";
import Expenses from "./pages/Expenses";
import Collections from "./pages/Collections";
import Insights from "./pages/Insights";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          {/* Public, no-auth pages */}
          <Route path="/track/:token" element={<Track />} />
          <Route path="/feedback/:token" element={<Feedback />} />
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/jobs" element={<Jobs />} />
          <Route path="/app/jobs/:id" element={<JobDetail />} />
          <Route path="/app/schedule" element={<Schedule />} />
          <Route path="/app/map" element={<MapView />} />
          <Route path="/app/contracts" element={<Contracts />} />
          <Route path="/app/inventory" element={<Inventory />} />
          <Route path="/app/expenses" element={<Expenses />} />
          <Route path="/app/collections" element={<Collections />} />
          <Route path="/app/insights" element={<Insights />} />
          <Route path="/app/technicians" element={<Technicians />} />
          <Route path="/app/customers" element={<Customers />} />
          <Route path="/app/invoices" element={<Invoices />} />
          <Route path="/app/reports" element={<Reports />} />
          <Route path="/app/settings" element={<Settings />} />
          {/* Legacy redirects */}
          <Route path="/dashboard" element={<Navigate to="/app" replace />} />
          <Route path="/jobs" element={<Navigate to="/app/jobs" replace />} />
          <Route path="/jobs/:id" element={<Navigate to="/app/jobs" replace />} />
          <Route path="/schedule" element={<Navigate to="/app/schedule" replace />} />
          <Route path="/technicians" element={<Navigate to="/app/technicians" replace />} />
          <Route path="/customers" element={<Navigate to="/app/customers" replace />} />
          <Route path="/invoices" element={<Navigate to="/app/invoices" replace />} />
          <Route path="/reports" element={<Navigate to="/app/reports" replace />} />
          <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
