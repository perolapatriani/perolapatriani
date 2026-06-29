import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Download, Flame, Thermometer, ThermometerSnowflake, Users, Sparkles, TrendingUp } from "lucide-react";

const STATUSES = [
  { value: "novo", label: "Novo" },
  { value: "em_contato", label: "Em contato" },
  { value: "qualificado", label: "Qualificado" },
  { value: "visitando", label: "Visitando" },
  { value: "proposta", label: "Proposta" },
  { value: "fechado", label: "Fechado" },
  { value: "perdido", label: "Perdido" },
];

const SOURCES = [
  { value: "", label: "Todas as origens" },
  { value: "contato", label: "Contato" },
  { value: "avaliacao_gratuita", label: "Avaliação" },
  { value: "match_ia", label: "Match IA" },
];

function Score({ s }: { s: string | null }) {
  if (!s) return null;
  const m: Record<string, { cls: string; Icon: typeof Flame; label: string }> = {
    quente: { cls: "bg-rose-100 text-rose-800", Icon: Flame, label: "Quente" },
    morno: { cls: "bg-amber-100 text-amber-800", Icon: Thermometer, label: "Morno" },
    frio: { cls: "bg-sky-100 text-sky-800", Icon: ThermometerSnowflake, label: "Frio" },
  };
  const it = m[s] ?? { cls: "bg-muted text-foreground", Icon: Thermometer, label: s };
  const { Icon } = it;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${it.cls}`}>
      <Icon className="h-3 w-3" /> {it.label}
    </span>
  );
}

function toCSV(rows: any[]) {
  const headers = ["Nome", "Telefone", "E-mail", "Status", "Score IA", "Origem inicial", "Origem última", "Tags", "Última interação", "Criado em"];
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push([
      r.name, r.raw_phone, r.raw_email, r.status, r.ai_score, r.source_first, r.source_last,
      (r.tags ?? []).join("|"),
      new Date(r.last_interaction_at).toISOString(),
      new Date(r.created_at).toISOString(),
    ].map(esc).join(","));
  }
  return lines.join("\n");
}

export default function AdminCrm() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [score, setScore] = useState("");

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["crm_contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_contacts" as any)
        .select("*")
        .order("last_interaction_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return contacts.filter((c) => {
      if (status && c.status !== status) return false;
      if (source && c.source_last !== source && c.source_first !== source) return false;
      if (score && c.ai_score !== score) return false;
      if (!term) return true;
      return (
        (c.name ?? "").toLowerCase().includes(term) ||
        (c.raw_email ?? "").toLowerCase().includes(term) ||
        (c.raw_phone ?? "").toLowerCase().includes(term)
      );
    });
  }, [contacts, q, status, source, score]);

  const metrics = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 3600 * 1000;
    return {
      total: contacts.length,
      novos: contacts.filter((c) => new Date(c.created_at).getTime() > weekAgo).length,
      quentes: contacts.filter((c) => c.ai_score === "quente" && c.status !== "fechado" && c.status !== "perdido").length,
      fechados: contacts.filter((c) => c.status === "fechado").length,
    };
  }, [contacts]);

  const exportCsv = () => {
    const blob = new Blob(["\ufeff" + toCSV(filtered)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crm-contatos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile icon={Users} label="Total" value={metrics.total} />
        <Tile icon={Sparkles} label="Novos (7d)" value={metrics.novos} />
        <Tile icon={Flame} label="Quentes ativos" value={metrics.quentes} accent />
        <Tile icon={TrendingUp} label="Fechados" value={metrics.fechados} />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, telefone ou e-mail…"
            className="w-full pl-9 pr-3 py-2 rounded-full border border-border bg-pearl/70 text-sm focus:outline-none focus:ring-2 focus:ring-rose-burnt/30"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-full border border-border bg-pearl/70 text-sm">
          <option value="">Todos status</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} className="px-3 py-2 rounded-full border border-border bg-pearl/70 text-sm">
          {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={score} onChange={(e) => setScore(e.target.value)} className="px-3 py-2 rounded-full border border-border bg-pearl/70 text-sm">
          <option value="">Todos scores</option>
          <option value="quente">Quente</option>
          <option value="morno">Morno</option>
          <option value="frio">Frio</option>
        </select>
        <button onClick={exportCsv} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-graphite text-pearl text-xs uppercase tracking-[0.2em] hover:bg-graphite/90">
          <Download className="h-3.5 w-3.5" /> Exportar CSV
        </button>
      </div>

      <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt">
        {filtered.length} contato{filtered.length !== 1 ? "s" : ""}
      </p>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          Nenhum contato encontrado.
        </div>
      ) : (
        <div className="glass-strong rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-champagne/50 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">Contato</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Score</th>
                <th className="text-left px-4 py-3">Origem</th>
                <th className="text-left px-4 py-3">Última interação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-champagne/30 transition">
                  <td className="px-4 py-3">
                    <Link to={`/admin/crm/${c.id}`} className="font-display text-base text-graphite hover:text-rose-burnt">
                      {c.name || "(sem nome)"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div>{c.raw_phone || "—"}</div>
                    <div>{c.raw_email || ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs rounded-full px-2 py-1 bg-muted text-foreground">
                      {STATUSES.find((s) => s.value === c.status)?.label ?? c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3"><Score s={c.ai_score} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.source_last ?? c.source_first ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(c.last_interaction_at).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Tile({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "bg-rose-50 border-rose-200" : "glass-strong"}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${accent ? "text-rose-600" : "text-rose-burnt"}`} />
      </div>
      <p className="font-display text-3xl text-graphite mt-2">{value}</p>
    </div>
  );
}
