import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SiteLayout from "./components/layout/SiteLayout";
import Index from "./pages/Index.tsx";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import Launches from "./pages/Launches";
import LaunchDetail from "./pages/LaunchDetail";
import Neighborhoods from "./pages/Neighborhoods";
import NeighborhoodDetail from "./pages/NeighborhoodDetail";
import About from "./pages/About";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Contact from "./pages/Contact";
import Thanks from "./pages/Thanks";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminProperties from "./pages/admin/AdminProperties";
import AdminLaunches from "./pages/admin/AdminLaunches";
import AdminNeighborhoods from "./pages/admin/AdminNeighborhoods";
import AdminTestimonials from "./pages/admin/AdminTestimonials";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminLeads from "./pages/admin/AdminLeads";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/imoveis" element={<Properties />} />
              <Route path="/imoveis/:slug" element={<PropertyDetail />} />
              <Route path="/lancamentos" element={<Launches />} />
              <Route path="/lancamentos/:slug" element={<LaunchDetail />} />
              <Route path="/bairros" element={<Neighborhoods />} />
              <Route path="/bairros/:slug" element={<NeighborhoodDetail />} />
              <Route path="/sobre" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/contato" element={<Contact />} />
              <Route path="/obrigado" element={<Thanks />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />}>
                <Route index element={<AdminOverview />} />
                <Route path="leads" element={<AdminLeads />} />
                <Route path="imoveis" element={<AdminProperties />} />
                <Route path="lancamentos" element={<AdminLaunches />} />
                <Route path="bairros" element={<AdminNeighborhoods />} />
                <Route path="depoimentos" element={<AdminTestimonials />} />
                <Route path="posts" element={<AdminPosts />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
