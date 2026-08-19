import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { ThemeProvider } from "@/app/ThemeProvider";
import { AuthProvider } from "@/app/auth/AuthProvider";
import { ProtectedRoute } from "@/app/auth/ProtectedRoute";
import { LoginPage } from "@/app/auth/LoginPage";
import { ForgotPasswordPage } from "@/app/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/app/auth/ResetPasswordPage";
import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";
import { SettingsPage } from "@/app/settings/SettingsPage";
import { CommandCenterPage } from "@/modules/command-center/CommandCenterPage";
import { IntelligencePage } from "@/modules/intelligence/IntelligencePage";
import { CalendarPage } from "@/modules/calendar/CalendarPage";
import { ContentPage } from "@/modules/content/ContentPage";
import { SocialPage } from "@/modules/social/SocialPage";
import { PLANNED_ITEMS } from "@/app/navigation";
import NotFound from "@/app/NotFound";

const queryClient = new QueryClient();

/** Envolve uma tela protegida com a checagem de sessão e a shell de navegação. */
function AppRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Sem AppLayout: ninguém está logado ainda quando estas
                aparecem, não há sidebar nem organização para mostrar. */}
              <Route path="/entrar" element={<LoginPage />} />
              <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
              <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

              {/* Nenhum destes módulos foi construído ainda. As rotas existem
                para que a navegação seja real desde já, mas cada uma declara
                em que fase o módulo chega — nenhuma exibe dado de exemplo. */}
              {PLANNED_ITEMS.map((item) => (
                <Route
                  key={item.to}
                  path={item.to}
                  element={
                    <AppRoute>
                      <ModulePlaceholder item={item} />
                    </AppRoute>
                  }
                />
              ))}

              <Route
                path="/"
                element={
                  <AppRoute>
                    <CommandCenterPage />
                  </AppRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <AppRoute>
                    <SettingsPage />
                  </AppRoute>
                }
              />

              <Route
                path="/intelligence"
                element={
                  <AppRoute>
                    <IntelligencePage />
                  </AppRoute>
                }
              />

              <Route
                path="/calendar"
                element={
                  <AppRoute>
                    <CalendarPage />
                  </AppRoute>
                }
              />

              <Route
                path="/content"
                element={
                  <AppRoute>
                    <ContentPage />
                  </AppRoute>
                }
              />

              <Route
                path="/social"
                element={
                  <AppRoute>
                    <SocialPage />
                  </AppRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
