import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Quotations from "./pages/Quotations";
import QuotationDetail from "./pages/QuotationDetail";
import SalesOrders from "./pages/SalesOrders";
import Invoices from "./pages/Invoices";
import Deliveries from "./pages/Deliveries";
import Inventory from "./pages/Inventory";
import Payments from "./pages/Payments";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/quotations" element={<Quotations />} />
          <Route path="/quotations/:id" element={<QuotationDetail />} />
          <Route path="/sales-orders" element={<SalesOrders />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/deliveries" element={<Deliveries />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
