import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompaniesProvider } from "@/contexts/CompaniesContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import QuotationDetail from "./pages/QuotationDetail";
import SalesOrders from "./pages/SalesOrders";
import Invoices from "./pages/Invoices";
import InvoiceDetail from "./pages/InvoiceDetail";
import ProformaInvoiceDetail from "./pages/ProformaInvoiceDetail";
import ProformaInvoices from "./pages/ProformaInvoices";
import DeliveryOrders from "./pages/DeliveryOrders";
import Inventory from "./pages/Inventory";
import Customers from "./pages/Customers";
import Payments from "./pages/Payments";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import BackupHistory from "./pages/BackupHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CompaniesProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
              <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
              <Route path="/quotations/:id" element={<ProtectedRoute><QuotationDetail /></ProtectedRoute>} />
              <Route path="/sales-orders" element={<ProtectedRoute><SalesOrders /></ProtectedRoute>} />
              <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
              <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
              <Route path="/proforma-invoices" element={<ProtectedRoute><ProformaInvoices /></ProtectedRoute>} />
              <Route path="/proforma-invoices/:id" element={<ProtectedRoute><ProformaInvoiceDetail /></ProtectedRoute>} />
              <Route path="/delivery-orders" element={<ProtectedRoute><DeliveryOrders /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
              <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/backup-history" element={<ProtectedRoute><BackupHistory /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CompaniesProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
