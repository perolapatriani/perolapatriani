import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFeaturedProperties, useLaunches, usePosts, useTestimonials, useNeighborhoods } from "@/hooks/useContent";

export default function AdminOverview() {
  const { data: properties = [] } = useFeaturedProperties(50);
  const { data: launches = [] } = useLaunches();
  const { data: posts = [] } = usePosts();
  const { data: testimonials = [] } = useTestimonials();
  const { data: neighborhoods = [] } = useNeighborhoods();
  const { data: leads = [] } = useQuery({
    queryKey: ["contact_leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_leads").select("id").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const Tile = ({ title, count, hint, to }: { title: string; count: number; hint: string; to: string }) => (
    <Link to={to} className="luxe-card p-8 hover:shadow-elegant transition block">
      <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt">{title}</p>
      <p className="font-display text-5xl text-graphite mt-2">{count}</p>
      <p className="text-xs text-muted-foreground mt-3">{hint}</p>
    </Link>
  );

  return (
    <div className="space-y-10">
      <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Tile title="Leads" count={leads.length} hint="Mensagens recebidas" to="/admin/leads" />
        <Tile title="Imóveis" count={properties.length} hint="Em destaque" to="/admin/imoveis" />
        <Tile title="Lançamentos" count={launches.length} hint="Empreendimentos" to="/admin/lancamentos" />
        <Tile title="Bairros" count={neighborhoods.length} hint="Regiões" to="/admin/bairros" />
        <Tile title="Depoimentos" count={testimonials.length} hint="Publicados" to="/admin/depoimentos" />
        <Tile title="Posts" count={posts.length} hint="Artigos" to="/admin/posts" />
      </div>

      <div className="glass-strong rounded-3xl p-8 space-y-4">
        <h2 className="font-display text-2xl text-graphite">Atalhos</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link to="/imoveis" className="flex items-center justify-between rounded-2xl border border-border p-5 hover:bg-champagne transition">
            <span className="font-display text-lg">Ver imóveis publicados</span>
            <ExternalLink className="h-4 w-4 text-rose-burnt" />
          </Link>
          <Link to="/" className="flex items-center justify-between rounded-2xl border border-border p-5 hover:bg-champagne transition">
            <span className="font-display text-lg">Ver site público</span>
            <ExternalLink className="h-4 w-4 text-rose-burnt" />
          </Link>
        </div>
      </div>
    </div>
  );
}
