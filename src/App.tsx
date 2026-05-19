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
                    {/* Admin — URL preserva aba ativa ao recarregar */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requireAdmin>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/:mainTab"
                      element={
                        <ProtectedRoute requireAdmin>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/:mainTab/:subTab"
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
                    <Route path="/telegram-putaria" element={<CategoryLanding />} />
                    <Route path="/grupos-putaria-telegram" element={<CategoryLanding />} />
                    <Route path="/telegram-porno" element={<CategoryLanding />} />
                    <Route path="/telegram-xxx" element={<CategoryLanding />} />
                    <Route path="/grupos-telegram-18" element={<CategoryLanding />} />
                    <Route path="/novinhas-telegram" element={<CategoryLanding />} />
                    <Route path="/vazados-telegram" element={<CategoryLanding />} />
                    <Route path="/onlyfans-telegram" element={<CategoryLanding />} />
                    <Route path="/canal-de-putaria" element={<CategoryLanding />} />
                    <Route path="/putaria-telegram" element={<CategoryLanding />} />
                    <Route path="/2257" element={<Usc2257 />} />
                    <Route path="/removal" element={<Removal />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/" element={<Index />} />
                    <Route path="/grupos-telegram" element={<GruposTelegram />} />

                    <Route path="/grupos/:category" element={<CategoryLanding />} />
                    <Route path="/categoria/:slug" element={<CategoryPage />} />
                    <Route path="/telegram-proibido" element={<CategoryLanding />} />
                    <Route path="/telegram-vazados" element={<CategoryLanding />} />
                    <Route path="/putaria-brasileira" element={<CategoryLanding />} />
                    <Route path="/chat-sexo-telegram" element={<CategoryLanding />} />
                    <Route path="/xvideos-putaria" element={<CategoryLanding />} />
                    <Route path="/video-sexo-telegram" element={<CategoryLanding />} />
                    <Route path="/mulheres-nuas-telegram" element={<CategoryLanding />} />
                    <Route path="/videos-eroticos-telegram" element={<CategoryLanding />} />
                    <Route path="/links-telegram" element={<CategoryLanding />} />
                    <Route path="/xvideos-porno-telegram" element={<CategoryLanding />} />
                    <Route path="/video-porno-telegram" element={<CategoryLanding />} />
                    <Route path="/porno-gratis-telegram" element={<CategoryLanding />} />
                    <Route path="/putaria-brasileira-telegram" element={<CategoryLanding />} />
                    <Route path="/grupos-de-putaria-telegram" element={<CategoryLanding />} />
                    <Route path="/grupo-de-putaria-telegram" element={<CategoryLanding />} />
                    <Route path="/vazou-telegram" element={<CategoryLanding />} />
                    <Route path="/vazado-telegram" element={<CategoryLanding />} />
                    <Route path="/famosos-nus-telegram" element={<CategoryLanding />} />
                    <Route path="/onlyfans-packs" element={<CategoryLanding />} />
                    <Route path="/onlyfans-vazados" element={<CategoryLanding />} />
                    <Route path="/grupo-telegram-18" element={<CategoryLanding />} />
                    <Route path="/grupos-telegram-pode-tudo" element={<CategoryLanding />} />
                    <Route path="/telegram-sexo" element={<CategoryLanding />} />
                    <Route path="/vazadinhos-telegram" element={<CategoryLanding />} />
                    <Route path="/amadoras-quentes" element={<CategoryLanding />} />
                    <Route path="/grupos-telegram-secretos" element={<CategoryLanding />} />
                    <Route path="/grupos-18-telegram" element={<CategoryLanding />} />
                    <Route path="/grupos-telegram-vazados" element={<CategoryLanding />} />
                    <Route path="/privacy-telegram" element={<CategoryLanding />} />
                    <Route path="/grupo-telegram-proibido" element={<CategoryLanding />} />
                    <Route path="/sexo-telegram" element={<CategoryLanding />} />
                    <Route path="/telegram-onlyfans" element={<CategoryLanding />} />
                    <Route path="/privacy-gratis" element={<CategoryLanding />} />
                    <Route path="/erome-privacy" element={<CategoryLanding />} />
                    <Route path="/privacy-vazados" element={<CategoryLanding />} />
                    <Route path="/erome-vazados" element={<CategoryLanding />} />
                    <Route path="/erome-vazado" element={<CategoryLanding />} />
                    <Route path="/erome-vazou" element={<CategoryLanding />} />
                    <Route path="/erome-gostosa" element={<CategoryLanding />} />
                    <Route path="/vazados-erome" element={<CategoryLanding />} />
                    <Route path="/dra-sophia-privacy" element={<CategoryLanding />} />
                    <Route path="/erome-juliana-silva" element={<CategoryLanding />} />
                    <Route path="/bia-albina-erome" element={<CategoryLanding />} />
                    <Route path="/michele-umezu-onlyfans" element={<CategoryLanding />} />
                    <Route path="/cosvickye-erome" element={<CategoryLanding />} />
                    <Route path="/nayzinha-erome" element={<CategoryLanding />} />
                    <Route path="/privacy-bad-mi" element={<CategoryLanding />} />
                    <Route path="/privacy-display-apk" element={<CategoryLanding />} />
                    <Route path="/erome-nicole-rodrigues" element={<CategoryLanding />} />
                    <Route path="/nyvi-estephan-erome" element={<CategoryLanding />} />
                    <Route path="/nayara-erome" element={<CategoryLanding />} />
                    <Route path="/jenifer-novaki-privacy" element={<CategoryLanding />} />
                    <Route path="/camila-prado-privacy" element={<CategoryLanding />} />
                    <Route path="/mae-e-filha-erome" element={<CategoryLanding />} />
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
