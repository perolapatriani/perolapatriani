import { useEffect, useState, ReactNode } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Sparkles, MapPin, MessageSquareQuote, FileText, LayoutDashboard, LogOut } from "lucide-react";
import Seo from "@/components/Seo";

const navItems = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, end: true },
  { to: "/admin/imoveis", label: "Imóveis", icon: Building2 },
  { to: "/admin/lancamentos", label: "Lançamentos", icon: Sparkles },
  { to: "/admin/bairros", label: "Bairros", icon: MapPin },
  { to: "/admin/depoimentos", label: "Depoimentos", icon: MessageSquareQuote },
  { to: "/admin/posts", label: "Blog", icon: FileText },
];

export default function AdminLayout({ children }: { children?: ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "noauth" | "noadmin" | "ok">("loading");

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/auth");
    });
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (!session) { setState("noauth"); navigate("/auth"); return; }
      const { data } = await supabase
        .from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
      if (!active) return;
      setState(data ? "ok" : "noadmin");
    })();
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [navigate]);

  const logout = async () => { await supabase.auth.signOut(); navigate("/auth"); };

  if (state === "loading") {
    return <div className="min-h-[60vh] grid place-items-center font-display text-2xl">Verificando acesso…</div>;
  }
  if (state === "noadmin") {
    return (
      <div className="min-h-[60vh] grid place-items-center px-6 text-center">
        <div className="space-y-4 max-w-md">
          <h1 className="font-display text-3xl text-graphite">Acesso restrito</h1>
          <p className="text-muted-foreground">Sua conta ainda não tem permissão de administrador.</p>
          <button onClick={logout} className="rounded-full bg-graphite px-6 py-3 text-xs uppercase tracking-[0.22em] text-pearl">Sair</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Seo title="Painel · Pérola Patriani" path="/admin" />
      <div className="container-editorial py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="eyebrow mb-2">Painel administrativo</p>
            <h1 className="font-display text-4xl text-graphite">Olá, Pérola</h1>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs uppercase tracking-[0.2em] hover:bg-champagne transition-colors">
            <LogOut className="h-3.5 w-3.5" /> Sair
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-8 border-b border-border">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-[0.2em] whitespace-nowrap transition ${
                  isActive ? "bg-graphite text-pearl" : "hover:bg-champagne text-muted-foreground"
                }`
              }
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </NavLink>
          ))}
        </div>

        {children ?? <Outlet />}
      </div>
    </>
  );
}
