import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Suspense, lazy } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/hooks/useAuth";
import Landing from "./pages/Landing";

// Route-level code splitting: heavy dependencies (jsPDF, jszip, html2canvas,
// recharts, gsap) now load only on the routes that need them, keeping the
// initial bundle small and first paint fast.
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Design = lazy(() => import("./pages/Design"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CollegeAdmin = lazy(() => import("./pages/CollegeAdmin"));
const ExportPage = lazy(() => import("./pages/Export"));
const Discover = lazy(() => import("./pages/Discover"));
const TemplateGallery = lazy(() => import("./pages/TemplateGallery"));
const StyleGuide = lazy(() => import("./pages/StyleGuide"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" aria-busy="true" aria-label="Loading">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
    </div>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" storageKey="portfolio-ui-theme" disableTransitionOnChange>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/u/:slug" element={<PublicProfile />} />
                  <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/app/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                  <Route path="/app/design" element={<ProtectedRoute><Design /></ProtectedRoute>} />
                  <Route path="/app/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/app/college" element={<ProtectedRoute><CollegeAdmin /></ProtectedRoute>} />
                  <Route path="/app/export" element={<ProtectedRoute><ExportPage /></ProtectedRoute>} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/templates" element={<TemplateGallery />} />
                  <Route path="/templates/:id" element={<TemplateGallery />} />
                  <Route path="/style-guide" element={<StyleGuide />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
