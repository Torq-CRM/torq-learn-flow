import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocationProvider } from "@/contexts/LocationContext";
import AppGate from "@/components/AppGate";
import AdminShell from "@/components/AdminShell";
import AdminToolbar from "@/components/AdminToolbar";
import TrainingPage from "@/pages/TrainingPage";
import SubjectDetailPage from "@/pages/SubjectDetailPage";
import ReportPage from "@/pages/ReportPage";
import AutomationPage from "@/pages/AutomationPage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LocationProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/training" replace />} />
              <Route path="/admin" element={<AdminShell />}>
                <Route index element={<AdminPage />} />
              </Route>
              <Route element={<AppGate />}>
                <Route path="/training" element={<TrainingPage />} />
                <Route path="/training/:subjectId" element={<SubjectDetailPage />} />
                <Route path="/report" element={<ReportPage />} />
                <Route path="/automation" element={<AutomationPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <AdminToolbar />
          </LocationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
