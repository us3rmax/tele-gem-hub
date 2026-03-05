import { lazy, Suspense, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Footer from "@/components/Footer";
import AgeVerificationModal from "@/components/AgeVerificationModal";
import ScrollToTop from "@/components/ScrollToTop";

const GroupDetail = lazy(() => import("./pages/GroupDetail"));
const Categories = lazy(() => import("./pages/Categories"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const SubmitGroup = lazy(() => import("./pages/SubmitGroup"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const MyGroups = lazy(() => import("./pages/MyGroups"));
const Advertise = lazy(() => import("./pages/Advertise"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Dmca = lazy(() => import("./pages/Dmca"));
const Usc2257 = lazy(() => import("./pages/Usc2257"));
const Removal = lazy(() => import("./pages/Removal"));
const Blog = lazy(() => import("./pages/Blog"));
const NotFound = lazy(() => import("./pages/NotFound"));
const GruposTelegram = lazy(() => import("./pages/GruposTelegram"));
const CategoryLanding = lazy(() => import("./pages/CategoryLanding"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));

// QueryClient fora do componente mas com useState para não recriar
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 min — não refaz query se dados frescos
      gcTime: 10 * 60 * 1000, // 10 min — mantém cache mesmo fora de uso
      retry: 1,
      refetchOnWindowFocus: false, // não refaz query ao trocar de aba
    },
  },
});

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ScrollToTop />
            <AgeVerificationModal />
            <div className="flex min-h-screen flex-col">
              <Suspense
                fallback={
                  <div className="flex flex-1 items-center justify-center bg-background">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                }
              >
                <div className="flex-1">
                  <Routes>
                    <Route path="/auth/login" element={<Login />} />
                    <Route path="/auth/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/submit" element={<SubmitGroup />} />
                    <Route path="/my-groups" element={<MyGroups />} />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requireAdmin>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/group/:slug" element={<GroupDetail />} />
                    <Route path="/categorias" element={<Categories />} />
                    <Route path="/categorias/:name" element={<Categories />} />
                    <Route path="/contato" element={<Contact />} />
                    <Route path="/advertise" element={<Advertise />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/dmca" element={<Dmca />} />
                    <Route path="/2257" element={<Usc2257 />} />
                    <Route path="/removal" element={<Removal />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/" element={<Index />} />
                    <Route path="/grupos-telegram" element={<GruposTelegram />} />
                    <Route path="/telegram-porno" element={<CategoryLanding />} />
                    <Route path="/putaria-telegram" element={<CategoryLanding />} />
                    <Route path="/telegram-xxx" element={<CategoryLanding />} />
                    <Route path="/grupos-putaria-telegram" element={<CategoryLanding />} />
                    <Route path="/grupos/:category" element={<CategoryLanding />} />
                    <Route path="/categoria/:slug" element={<CategoryPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </Suspense>
              <Footer />
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
