import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { ThemeProvider } from "@/app/ThemeProvider";
import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";
import { PLANNED_ITEMS } from "@/app/navigation";
import NotFound from "@/app/NotFound";

import CostDashboard from "@/modules/cost-intelligence/pages/CostDashboard";
import CostImport from "@/modules/cost-intelligence/pages/CostImport";
import CostEntries from "@/modules/cost-intelligence/pages/CostEntries";
import CostCenters from "@/modules/cost-intelligence/pages/CostCenters";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              {/* Módulos ainda não construídos. As rotas existem para que a
                navegação seja real desde já, mas cada uma declara em que fase
                o módulo chega — nenhuma exibe dado de exemplo. */}
              {PLANNED_ITEMS.map((item) => (
                <Route
                  key={item.to}
                  path={item.to}
                  element={<ModulePlaceholder item={item} />}
                />
              ))}

              {/* Cost Intelligence — módulo em operação. */}
              <Route path="/cost-intelligence" element={<CostDashboard />} />
              <Route
                path="/cost-intelligence/import"
                element={<CostImport />}
              />
              <Route
                path="/cost-intelligence/entries"
                element={<CostEntries />}
              />
              <Route
                path="/cost-intelligence/centers"
                element={<CostCenters />}
              />

              {/* Rotas antigas, preservadas para não quebrar link salvo. */}
              <Route
                path="/import"
                element={<Navigate to="/cost-intelligence/import" replace />}
              />
              <Route
                path="/entries"
                element={<Navigate to="/cost-intelligence/entries" replace />}
              />
              <Route
                path="/cost-centers"
                element={<Navigate to="/cost-intelligence/centers" replace />}
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
