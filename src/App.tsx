import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import EditProfile from "./pages/EditProfile";
import Design from "./pages/Design";
import PublicProfile from "./pages/PublicProfile";
import CollegeAdmin from "./pages/CollegeAdmin";
import ExportPage from "./pages/Export";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/hooks/useAuth";
import StyleGuide from "./pages/StyleGuide";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" storageKey="portfolio-ui-theme" disableTransitionOnChange>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/u/:slug" element={<PublicProfile />} />
                <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/app/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                <Route path="/app/design" element={<ProtectedRoute><Design /></ProtectedRoute>} />
                <Route path="/app/college" element={<ProtectedRoute><CollegeAdmin /></ProtectedRoute>} />
                <Route path="/app/export" element={<ProtectedRoute><ExportPage /></ProtectedRoute>} />
                <Route path="/style-guide" element={<StyleGuide />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
