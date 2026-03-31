import { lazy, Suspense, useState } from "react";
import { TelegramPutariaPage } from "./pages/landing/LandingPages";
import { GruposPutariaTelegramPage } from "./pages/landing/LandingPages";
import { TelegramPornoPage } from "./pages/landing/LandingPages";
import { TelegramXxxPage } from "./pages/landing/LandingPages";
import { GruposTelegram18Page } from "./pages/landing/LandingPages";
import { NovinhasTelegramPage } from "./pages/landing/LandingPages";
import { VazadosTelegramPage } from "./pages/landing/LandingPages";
import { OnlyfansTelegramPage } from "./pages/landing/LandingPages";
import { CanalDePutariaPage } from "./pages/landing/LandingPages";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
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
                    <Route path="/telegram-putaria" element={<TelegramPutariaPage />} />
                    <Route path="/grupos-putaria-telegram" element={<GruposPutariaTelegramPage />} />
                    <Route path="/telegram-porno" element={<TelegramPornoPage />} />
                    <Route path="/telegram-xxx" element={<TelegramXxxPage />} />
                    <Route path="/grupos-telegram-18" element={<GruposTelegram18Page />} />
                    <Route path="/novinhas-telegram" element={<NovinhasTelegramPage />} />
                    <Route path="/vazados-telegram" element={<VazadosTelegramPage />} />
                    <Route path="/onlyfans-telegram" element={<OnlyfansTelegramPage />} />
                    <Route path="/canal-de-putaria" element={<CanalDePutariaPage />} />
                    <Route path="/2257" element={<Usc2257 />} />
                    <Route path="/removal" element={<Removal />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/" element={<Index />} />
                    <Route path="/grupos-telegram" element={<GruposTelegram />} />

                    {/* Landing pages SEO — keywords de alto volume */}
                    <Route path="/telegram-porno" element={<CategoryLanding />} />
                    <Route path="/telegram-xxx" element={<CategoryLanding />} />
                    <Route path="/putaria-telegram" element={<CategoryLanding />} />
                    <Route path="/telegram-putaria" element={<CategoryLanding />} />
                    <Route path="/grupos-putaria-telegram" element={<CategoryLanding />} />
                    <Route path="/grupos-telegram-18" element={<CategoryLanding />} />
                    <Route path="/novinhas-telegram" element={<CategoryLanding />} />
                    <Route path="/vazados-telegram" element={<CategoryLanding />} />
                    <Route path="/onlyfans-telegram" element={<CategoryLanding />} />
                    <Route path="/canal-de-putaria" element={<CategoryLanding />} />

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
