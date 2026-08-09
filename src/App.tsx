import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { ThemeProvider } from "@/app/ThemeProvider";
import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";
import { PLANNED_ITEMS } from "@/app/navigation";
import NotFound from "@/app/NotFound";

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
              {/* Nenhum módulo foi construído ainda. As rotas existem para que
                a navegação seja real desde já, mas cada uma declara em que fase
                o módulo chega — nenhuma exibe dado de exemplo. */}
              {PLANNED_ITEMS.map((item) => (
                <Route
                  key={item.to}
                  path={item.to}
                  element={<ModulePlaceholder item={item} />}
                />
              ))}

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
