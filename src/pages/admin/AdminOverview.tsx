import { Link } from "react-router-dom";
import { ExternalLink, TrendingUp, Users, Home, Wand2, Star, Building2, Eye, Calculator } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Lead = { id: string; created_at: string; status?: string | null };

function startOfWeek(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}
function startOfPrevWeek() {
  const s = startOfWeek();
  s.setDate(s.getDate() - 7);
  return s;
}

function trend(now: number, prev: number) {
  if (prev === 0) return now > 0 ? 100 : 0;
  return Math.round(((now - prev) / prev) * 100);
}

export default function AdminOverview() {
  const { data: properties = [] } = useQuery({
    queryKey: ["admin", "metrics", "properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id,title,is_featured,status,price,neighborhood_name,created_at,code,cover_url");
      if (error) throw error;
      return data;
    },
  });

  const { data: contactLeads = [] } = useQuery({
    queryKey: ["admin", "metrics", "contact_leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_leads").select("id,created_at,source,status");
      if (error) throw error;
      return data as (Lead & { source?: string })[];
    },
  });

  const { data: sellerLeads = [] } = useQuery({
    queryKey: ["admin", "metrics", "seller_leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("seller_leads").select("id,created_at,status");
      if (error) throw error;
      return data as Lead[];
    },
  });

  const { data: matchLeads = [] } = useQuery({
    queryKey: ["admin", "metrics", "match_leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("match_leads").select("id,created_at,status");
      if (error) throw error;
      return data as Lead[];
    },
  });
  const { data: siteEvents = [] } = useQuery({
    queryKey: ["admin", "metrics", "site_events"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 864e5).toISOString();
      const { data, error } = await supabase
        .from("site_events")
        .select("id,type,property_id,payload,created_at,path")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return data as { id: string; type: string; property_id: string | null; payload: any; created_at: string; path: string | null }[];
    },
  });

  const propertyViews = siteEvents.filter((e) => e.type === "property_view");
  const financingSims = siteEvents.filter((e) => e.type === "financing_simulation");

  // 14-day interactions series
  const interDays: { label: string; views: number; sims: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
    const next = new Date(d); next.setDate(d.getDate() + 1);
    const views = propertyViews.filter((e) => { const t = +new Date(e.created_at); return t >= +d && t < +next; }).length;
    const sims = financingSims.filter((e) => { const t = +new Date(e.created_at); return t >= +d && t < +next; }).length;
    interDays.push({ label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), views, sims });
  }
  const maxInter = Math.max(1, ...interDays.map((d) => Math.max(d.views, d.sims)));

  // Top viewed properties (last 30d)
  const viewCounts = new Map<string, { count: number; title: string }>();
  propertyViews.forEach((e) => {
    if (!e.property_id) return;
    const cur = viewCounts.get(e.property_id) || { count: 0, title: e.payload?.title || "Imóvel" };
    cur.count += 1;
    cur.title = e.payload?.title || cur.title;
    viewCounts.set(e.property_id, cur);
  });
  const topViewed = [...viewCounts.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 5);

  
  const weekStart = startOfWeek().getTime();
  const prevStart = startOfPrevWeek().getTime();
  const inWeek = (arr: Lead[]) =>
    arr.filter((l) => new Date(l.created_at).getTime() >= weekStart).length;
  const inPrev = (arr: Lead[]) =>
    arr.filter((l) => {
      const t = new Date(l.created_at).getTime();
      return t >= prevStart && t < weekStart;
    }).length;

  const allLeads = [
    ...contactLeads.map((l) => ({ ...l, kind: "Contato" })),
    ...sellerLeads.map((l) => ({ ...l, kind: "Captação" })),
    ...matchLeads.map((l) => ({ ...l, kind: "Match IA" })),
  ];
  const totalLeadsWeek = inWeek(allLeads);
  const totalLeadsPrev = inPrev(allLeads);
  const leadsTrend = trend(totalLeadsWeek, totalLeadsPrev);

  const newLeads = allLeads
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 8);

  // 7-day sparkline
  const days: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const c = allLeads.filter((l) => {
      const t = +new Date(l.created_at);
      return t >= +d && t < +next;
    }).length;
    days.push({ label: d.toLocaleDateString("pt-BR", { weekday: "short" })[0].toUpperCase(), count: c });
  }
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  // properties by status
  const propStatusCount = (s: string) => properties.filter((p) => p.status === s).length;
  const featuredCount = properties.filter((p) => p.is_featured).length;
  const avgPrice = (() => {
    const prices = properties.map((p) => Number(p.price)).filter((n) => n > 0);
    if (!prices.length) return 0;
    return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  })();

  // neighborhoods ranking by property count
  const byHood = new Map<string, number>();
  properties.forEach((p) => {
    if (!p.neighborhood_name) return;
    byHood.set(p.neighborhood_name, (byHood.get(p.neighborhood_name) || 0) + 1);
  });
  const topHoods = [...byHood.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const Tile = ({
    title,
    count,
    hint,
    to,
    icon: Icon,
    trendPct,
  }: {
    title: string;
    count: number;
    hint: string;
    to: string;
    icon: any;
    trendPct?: number;
  }) => (
    <Link to={to} className="luxe-card p-6 hover:shadow-elegant transition block">
      <div className="flex items-center justify-between">
        <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt">{title}</p>
        <Icon className="h-4 w-4 text-rose-burnt/70" />
      </div>
      <p className="font-display text-4xl text-graphite mt-2">{count}</p>
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-muted-foreground">{hint}</p>
        {trendPct !== undefined && (
          <span className={`text-[10px] font-semibold ${trendPct >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {trendPct >= 0 ? "↑" : "↓"} {Math.abs(trendPct)}%
          </span>
        )}
      </div>
    </Link>
  );

  return (
    <div className="space-y-10">
      {/* Top KPI tiles */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile
          title="Leads esta semana"
          count={totalLeadsWeek}
          hint={`vs ${totalLeadsPrev} semana anterior`}
          to="/admin/leads"
          icon={TrendingUp}
          trendPct={leadsTrend}
        />
        <Tile title="Contatos" count={contactLeads.length} hint="Total recebidos" to="/admin/leads" icon={Users} />
        <Tile title="Captações" count={sellerLeads.length} hint="Quer vender" to="/admin/captacoes" icon={Home} />
        <Tile title="Match IA" count={matchLeads.length} hint="Quiz respondidos" to="/admin/match" icon={Wand2} />
      </div>

      {/* Sparkline + new leads */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="luxe-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl text-graphite">Leads — últimos 7 dias</h3>
            <span className="text-xs text-muted-foreground">{allLeads.filter(l => +new Date(l.created_at) >= Date.now() - 7 * 864e5).length} leads</span>
          </div>
          <div className="flex items-end gap-2 h-32">
            {days.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gradient-to-t from-rose-burnt to-rose-blush rounded-t-md transition" style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: d.count ? 6 : 2 }} title={`${d.count} leads`} />
                <span className="text-[10px] text-muted-foreground">{d.label}</span>
                <span className="text-[10px] font-semibold text-graphite -mt-1">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="luxe-card p-6">
          <h3 className="font-display text-xl text-graphite mb-4">Últimos leads</h3>
          {newLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum lead ainda.</p>
          ) : (
            <ul className="space-y-2">
              {newLeads.map((l: any) => (
                <li key={`${l.kind}-${l.id}`} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                  <span className="inline-flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-champagne text-graphite">{l.kind}</span>
                    <span className="text-muted-foreground">{l.status || "novo"}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Properties stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="luxe-card p-6">
          <div className="flex items-center gap-2 text-rose-burnt">
            <Building2 className="h-4 w-4" />
            <p className="font-editorial text-[10px] uppercase tracking-[0.3em]">Total imóveis</p>
          </div>
          <p className="font-display text-4xl text-graphite mt-2">{properties.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{propStatusCount("ativo")} ativos · {propStatusCount("vendido")} vendidos</p>
        </div>
        <div className="luxe-card p-6">
          <div className="flex items-center gap-2 text-rose-burnt">
            <Star className="h-4 w-4" />
            <p className="font-editorial text-[10px] uppercase tracking-[0.3em]">Em destaque</p>
          </div>
          <p className="font-display text-4xl text-graphite mt-2">{featuredCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Aparecem na home</p>
        </div>
        <div className="luxe-card p-6">
          <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt">Ticket médio</p>
          <p className="font-display text-3xl text-graphite mt-2">
            {avgPrice ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(avgPrice) : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Preço médio do catálogo</p>
        </div>
        <div className="luxe-card p-6">
          <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt">Conversão</p>
          <p className="font-display text-4xl text-graphite mt-2">
            {properties.length ? `${Math.round((allLeads.length / properties.length) * 10) / 10}` : "0"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Leads por imóvel</p>
        </div>
      </div>

      {/* Top bairros */}
      {topHoods.length > 0 && (
        <div className="luxe-card p-6">
          <h3 className="font-display text-xl text-graphite mb-4">Bairros com mais imóveis</h3>
          <div className="space-y-3">
            {topHoods.map(([name, count]) => {
              const pct = (count / topHoods[0][1]) * 100;
              return (
                <div key={name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-graphite">{name}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-champagne overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-rose-burnt to-rose-blush" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="glass-strong rounded-3xl p-6 space-y-4">
        <h2 className="font-display text-xl text-graphite">Atalhos</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link to="/imoveis" className="flex items-center justify-between rounded-2xl border border-border p-4 hover:bg-champagne transition">
            <span className="font-display text-base">Imóveis publicados</span>
            <ExternalLink className="h-4 w-4 text-rose-burnt" />
          </Link>
          <Link to="/match" className="flex items-center justify-between rounded-2xl border border-border p-4 hover:bg-champagne transition">
            <span className="font-display text-base">Quiz Match IA</span>
            <ExternalLink className="h-4 w-4 text-rose-burnt" />
          </Link>
          <Link to="/" className="flex items-center justify-between rounded-2xl border border-border p-4 hover:bg-champagne transition">
            <span className="font-display text-base">Site público</span>
            <ExternalLink className="h-4 w-4 text-rose-burnt" />
          </Link>
        </div>
      </div>
    </div>
  );
}
