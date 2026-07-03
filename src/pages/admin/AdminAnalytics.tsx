import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { TrendingUp, Users, MessageSquare, Target, Download } from "lucide-react";

type Range = 7 | 30 | 90;

const COLORS = ["#B4553C", "#D89B7E", "#E8C4A8", "#8B6F5C", "#5B4438", "#C97B5C"];

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function fmtDay(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function downloadCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = r[h] ?? "";
          const s = String(v).replace(/"/g, '""');
          return /[",\n]/.test(s) ? `"${s}"` : s;
        })
        .join(","),
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminAnalytics() {
  const [range, setRange] = useState<Range>(30);
  const since = useMemo(() => daysAgo(range).toISOString(), [range]);

  const { data: events = [] } = useQuery({
    queryKey: ["analytics", "events", range],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_events")
        .select("id,contact_id,type,source,title,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["analytics", "contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_contacts")
        .select("id,status,source_first,source_last,ai_score,created_at,last_interaction_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["analytics", "properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id,neighborhood_name,status,price");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Timeseries: events per day by source
  const timeseries = useMemo(() => {
    const buckets = new Map<string, Record<string, any>>();
    for (let i = range - 1; i >= 0; i--) {
      const d = daysAgo(i);
      const key = fmtDay(d);
      buckets.set(key, { day: key, contato: 0, avaliacao_gratuita: 0, match_ia: 0, total: 0 });
    }
    events.forEach((e: any) => {
      const key = fmtDay(new Date(e.created_at));
      const row = buckets.get(key);
      if (!row) return;
      const src = (e.source || "outro").toLowerCase();
      const bucket =
        src.includes("match") ? "match_ia" : src.includes("aval") ? "avaliacao_gratuita" : "contato";
      row[bucket] = (row[bucket] || 0) + 1;
      row.total += 1;
    });
    return [...buckets.values()];
  }, [events, range]);

  const totalInteractions = events.length;
  const uniqueContacts = new Set(events.map((e: any) => e.contact_id)).size;
  const newContactsInRange = contacts.filter(
    (c: any) => new Date(c.created_at).getTime() >= daysAgo(range).getTime(),
  ).length;
  const conversion = contacts.length
    ? Math.round(
        (contacts.filter((c: any) => ["cliente", "ganho", "convertido"].includes((c.status || "").toLowerCase()))
          .length /
          contacts.length) *
          100,
      )
    : 0;

  // Sources pie
  const sourceCounts = useMemo(() => {
    const m = new Map<string, number>();
    events.forEach((e: any) => {
      const k = e.source || "outro";
      m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()].map(([name, value]) => ({ name, value }));
  }, [events]);

  // Status funnel
  const statusCounts = useMemo(() => {
    const m = new Map<string, number>();
    contacts.forEach((c: any) => {
      const k = c.status || "novo";
      m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()].map(([status, total]) => ({ status, total }));
  }, [contacts]);

  // Hour of day heat
  const hourCounts = useMemo(() => {
    const arr = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}h`, total: 0 }));
    events.forEach((e: any) => {
      const h = new Date(e.created_at).getHours();
      arr[h].total += 1;
    });
    return arr;
  }, [events]);

  // Weekday
  const weekdayCounts = useMemo(() => {
    const names = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const arr = names.map((n) => ({ dia: n, total: 0 }));
    events.forEach((e: any) => {
      arr[new Date(e.created_at).getDay()].total += 1;
    });
    return arr;
  }, [events]);

  // Event type
  const typeCounts = useMemo(() => {
    const m = new Map<string, number>();
    events.forEach((e: any) => {
      const k = e.type || "evento";
      m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()].map(([tipo, total]) => ({ tipo, total })).sort((a, b) => b.total - a.total);
  }, [events]);

  // Neighborhoods with most properties
  const hoodCounts = useMemo(() => {
    const m = new Map<string, number>();
    properties.forEach((p: any) => {
      if (!p.neighborhood_name) return;
      m.set(p.neighborhood_name, (m.get(p.neighborhood_name) || 0) + 1);
    });
    return [...m.entries()]
      .map(([bairro, total]) => ({ bairro, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [properties]);

  // AI score distribution
  const scoreBuckets = useMemo(() => {
    const b = { "0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0, "sem score": 0 };
    contacts.forEach((c: any) => {
      const s = c.ai_score;
      if (s == null) b["sem score"]++;
      else if (s <= 25) b["0-25"]++;
      else if (s <= 50) b["26-50"]++;
      else if (s <= 75) b["51-75"]++;
      else b["76-100"]++;
    });
    return Object.entries(b).map(([faixa, total]) => ({ faixa, total }));
  }, [contacts]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">Relatórios</p>
          <h2 className="font-display text-3xl text-graphite">Analytics de interações</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Todas as interações registradas no site — formulários, quiz IA, agendamentos e chat.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r as Range)}
              className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
                range === r
                  ? "bg-graphite text-pearl"
                  : "border border-border hover:bg-champagne"
              }`}
            >
              {r} dias
            </button>
          ))}
          <button
            onClick={() =>
              downloadCsv(
                `interacoes-${range}d.csv`,
                events.map((e: any) => ({
                  data: new Date(e.created_at).toLocaleString("pt-BR"),
                  tipo: e.type,
                  origem: e.source,
                  titulo: e.title,
                  contato_id: e.contact_id,
                })),
              )
            }
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-[0.2em] hover:bg-champagne transition"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="luxe-card p-6">
          <div className="flex items-center justify-between">
            <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt">Interações</p>
            <MessageSquare className="h-4 w-4 text-rose-burnt/70" />
          </div>
          <p className="font-display text-4xl text-graphite mt-2">{totalInteractions}</p>
          <p className="text-xs text-muted-foreground mt-1">últimos {range} dias</p>
        </div>
        <div className="luxe-card p-6">
          <div className="flex items-center justify-between">
            <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt">Clientes únicos</p>
            <Users className="h-4 w-4 text-rose-burnt/70" />
          </div>
          <p className="font-display text-4xl text-graphite mt-2">{uniqueContacts}</p>
          <p className="text-xs text-muted-foreground mt-1">interagiram no período</p>
        </div>
        <div className="luxe-card p-6">
          <div className="flex items-center justify-between">
            <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt">Novos leads</p>
            <TrendingUp className="h-4 w-4 text-rose-burnt/70" />
          </div>
          <p className="font-display text-4xl text-graphite mt-2">{newContactsInRange}</p>
          <p className="text-xs text-muted-foreground mt-1">cadastrados no período</p>
        </div>
        <div className="luxe-card p-6">
          <div className="flex items-center justify-between">
            <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt">Taxa de conversão</p>
            <Target className="h-4 w-4 text-rose-burnt/70" />
          </div>
          <p className="font-display text-4xl text-graphite mt-2">{conversion}%</p>
          <p className="text-xs text-muted-foreground mt-1">clientes / total</p>
        </div>
      </div>

      {/* Timeseries */}
      <div className="luxe-card p-6">
        <h3 className="font-display text-xl text-graphite mb-4">Interações por dia</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeseries}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#B4553C" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#B4553C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D89B7E" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#D89B7E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B6F5C" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#8B6F5C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="contato" stackId="1" stroke="#B4553C" fill="url(#g1)" name="Contato" />
              <Area type="monotone" dataKey="avaliacao_gratuita" stackId="1" stroke="#D89B7E" fill="url(#g2)" name="Avaliação" />
              <Area type="monotone" dataKey="match_ia" stackId="1" stroke="#8B6F5C" fill="url(#g3)" name="Match IA" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Sources pie */}
        <div className="luxe-card p-6">
          <h3 className="font-display text-xl text-graphite mb-4">Origem das interações</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceCounts}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(e: any) => `${e.name} (${e.value})`}
                >
                  {sourceCounts.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status funnel */}
        <div className="luxe-card p-6">
          <h3 className="font-display text-xl text-graphite mb-4">Funil por status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusCounts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="status" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="total" fill="#B4553C" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Hour of day */}
        <div className="luxe-card p-6">
          <h3 className="font-display text-xl text-graphite mb-4">Horários mais ativos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={1} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="#D89B7E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekday */}
        <div className="luxe-card p-6">
          <h3 className="font-display text-xl text-graphite mb-4">Dias da semana</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekdayCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#B4553C" strokeWidth={3} dot={{ fill: "#B4553C", r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Event types */}
        <div className="luxe-card p-6">
          <h3 className="font-display text-xl text-graphite mb-4">Tipos de interação</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeCounts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="tipo" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="total" fill="#8B6F5C" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Score distribution */}
        <div className="luxe-card p-6">
          <h3 className="font-display text-xl text-graphite mb-4">Distribuição de score IA</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="faixa" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="#C97B5C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Neighborhoods */}
      {hoodCounts.length > 0 && (
        <div className="luxe-card p-6">
          <h3 className="font-display text-xl text-graphite mb-4">Bairros do catálogo</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hoodCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="bairro" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="#B4553C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
