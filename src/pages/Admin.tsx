import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, ExternalLink } from "lucide-react";
import Seo from "@/components/Seo";
import { useFeaturedProperties, useLaunches, usePosts, useTestimonials, useNeighborhoods } from "@/hooks/useContent";

export default function Admin() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<null | boolean>(null);

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/auth");
    });
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const { data, error } = await supabase
        .from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
      if (!active) return;
      if (error || !data) {
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
      }
    })();
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [navigate]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const { data: properties = [] } = useFeaturedProperties(50);
  const { data: launches = [] } = useLaunches();
  const { data: posts = [] } = usePosts();
  const { data: testimonials = [] } = useTestimonials();
  const { data: neighborhoods = [] } = useNeighborhoods();

  if (isAdmin === null) {
    return <div className="min-h-[60vh] grid place-items-center font-display text-2xl">Verificando acesso…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-6 text-center">
        <div className="space-y-4 max-w-md">
          <h1 className="font-display text-3xl text-graphite">Acesso restrito</h1>
          <p className="text-muted-foreground">Sua conta ainda não tem permissão de administrador.</p>
          <p className="text-sm text-muted-foreground">
            Entre em contato com o suporte Lovable para conceder acesso à conta da Pérola.
          </p>
          <button onClick={logout} className="rounded-full bg-graphite px-6 py-3 text-xs uppercase tracking-[0.22em] text-pearl">Sair</button>
        </div>
      </div>
    );
  }

  const Tile = ({ title, count, hint }: { title: string; count: number; hint: string }) => (
    <div className="luxe-card p-8">
      <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt">{title}</p>
      <p className="font-display text-5xl text-graphite mt-2">{count}</p>
      <p className="text-xs text-muted-foreground mt-3">{hint}</p>
    </div>
  );

  return (
    <>
      <Seo title="Painel · Pérola Patriani" path="/admin" />
      <section className="container-editorial py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="eyebrow mb-2">Painel administrativo</p>
            <h1 className="font-display text-4xl text-graphite">Olá, Pérola</h1>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs uppercase tracking-[0.2em] hover:bg-champagne transition-colors">
            <LogOut className="h-3.5 w-3.5" /> Sair
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
          <Tile title="Imóveis" count={properties.length} hint="Em destaque agora" />
          <Tile title="Lançamentos" count={launches.length} hint="Empreendimentos ativos" />
          <Tile title="Bairros" count={neighborhoods.length} hint="Regiões cadastradas" />
          <Tile title="Depoimentos" count={testimonials.length} hint="Publicados" />
          <Tile title="Posts" count={posts.length} hint="Artigos do blog" />
        </div>

        <div className="glass-strong rounded-3xl p-8 space-y-4">
          <h2 className="font-display text-2xl text-graphite">Gestão de conteúdo</h2>
          <p className="text-muted-foreground">
            Esta versão inicial do painel mostra um resumo do site. Para cadastrar e editar imóveis, lançamentos, bairros, depoimentos e posts com upload de imagens, posso preparar a próxima etapa do painel — é só pedir.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 pt-4">
            <Link to="/imoveis" className="flex items-center justify-between rounded-2xl border border-border p-5 hover:bg-champagne transition-colors">
              <span className="font-display text-lg">Ver imóveis publicados</span>
              <ExternalLink className="h-4 w-4 text-rose-burnt" />
            </Link>
            <Link to="/" className="flex items-center justify-between rounded-2xl border border-border p-5 hover:bg-champagne transition-colors">
              <span className="font-display text-lg">Ver site público</span>
              <ExternalLink className="h-4 w-4 text-rose-burnt" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
