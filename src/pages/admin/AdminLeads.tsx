import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Mail, Phone, MessageSquare, Sparkles, Copy, Flame, ThermometerSnowflake, Thermometer } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const STATUS_OPTIONS = [
  { value: "novo", label: "Novo", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "em_contato", label: "Em contato", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "convertido", label: "Convertido", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
] as const;

function StatusBadge({ status, onChange }: { status: string; onChange: (s: string) => void }) {
  const current = STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0];
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value)}
      className={`text-xs font-semibold rounded-full px-2.5 py-1 border cursor-pointer outline-none ${current.color}`}
    >
      {STATUS_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function ScoreBadge({ score }: { score: string | null }) {
  if (!score) return null;
  const map: Record<string, { label: string; cls: string; Icon: typeof Flame }> = {
    quente: { label: "Quente", cls: "bg-rose-100 text-rose-800 border-rose-300", Icon: Flame },
    morno: { label: "Morno", cls: "bg-amber-100 text-amber-800 border-amber-300", Icon: Thermometer },
    frio: { label: "Frio", cls: "bg-sky-100 text-sky-800 border-sky-300", Icon: ThermometerSnowflake },
  };
  const m = map[score] ?? { label: score, cls: "bg-muted text-foreground border-border", Icon: Thermometer };
  const { Icon } = m;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 border ${m.cls}`}>
      <Icon className="h-3 w-3" /> {m.label}
    </span>
  );
}

export default function AdminLeads() {
  const qc = useQueryClient();
  const [qualifying, setQualifying] = useState<string | null>(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["contact_leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact_leads"] });
      toast({ title: "Lead removido" });
    },
  });

  const statusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("contact_leads")
        .update({ status } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact_leads"] });
      toast({ title: "Status atualizado" });
    },
  });

  const qualify = async (id: string) => {
    setQualifying(id);
    try {
      const { data, error } = await supabase.functions.invoke("qualify-lead", { body: { id } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Lead qualificado pela IA ✨" });
      qc.invalidateQueries({ queryKey: ["contact_leads"] });
    } catch (e: any) {
      toast({ title: "Falha ao qualificar", description: e.message, variant: "destructive" });
    } finally {
      setQualifying(null);
    }
  };

  const qualifyAll = async () => {
    const pending = leads.filter((l: any) => !l.ai_qualified_at);
    if (pending.length === 0) {
      toast({ title: "Todos os leads já estão qualificados" });
      return;
    }
    toast({ title: `Qualificando ${pending.length} lead${pending.length > 1 ? "s" : ""}…` });
    for (const l of pending) {
      try {
        await supabase.functions.invoke("qualify-lead", { body: { id: l.id } });
      } catch (e) {
        console.error("qualify failed", l.id, e);
      }
    }
    qc.invalidateQueries({ queryKey: ["contact_leads"] });
    toast({ title: "Qualificação concluída" });
  };

  const copyReply = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Resposta copiada — cole no WhatsApp da Pérola" });
  };

  if (isLoading) return <p className="text-muted-foreground">Carregando…</p>;

  if (!leads.length) {
    return (
      <div className="text-center py-20">
        <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/40 mb-4" />
        <p className="font-display text-2xl text-graphite">Nenhum lead ainda</p>
        <p className="text-muted-foreground mt-2">As mensagens do formulário de contato aparecerão aqui.</p>
      </div>
    );
  }

  const counts = {
    novo: leads.filter((l) => (l as any).status === "novo" || !(l as any).status).length,
    em_contato: leads.filter((l) => (l as any).status === "em_contato").length,
    convertido: leads.filter((l) => (l as any).status === "convertido").length,
  };

  const pendingCount = leads.filter((l: any) => !l.ai_qualified_at).length;

  return (
    <div className="space-y-6">
      {/* Funnel summary */}
      <div className="flex flex-wrap gap-3 items-center">
        {STATUS_OPTIONS.map((o) => (
          <div key={o.value} className={`rounded-xl border px-4 py-2 text-center ${o.color}`}>
            <p className="text-2xl font-display">{counts[o.value]}</p>
            <p className="text-[10px] uppercase tracking-widest">{o.label}</p>
          </div>
        ))}
        {pendingCount > 0 && (
          <button
            onClick={qualifyAll}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-graphite text-pearl px-4 py-2 text-xs font-editorial uppercase tracking-[0.2em] hover:bg-graphite/90 transition"
          >
            <Sparkles className="h-3.5 w-3.5" /> Qualificar {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
          </button>
        )}
      </div>

      <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt">
        {leads.length} lead{leads.length !== 1 ? "s" : ""}
      </p>

      {leads.map((l: any) => (
        <div key={l.id} className="glass-strong rounded-2xl p-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-display text-lg text-graphite">{l.name}</p>
                <ScoreBadge score={l.ai_score} />
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(l.created_at).toLocaleString("pt-BR")} · {l.source}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge
                status={l.status ?? "novo"}
                onChange={(s) => statusMut.mutate({ id: l.id, status: s })}
              />
              <button
                onClick={() => deleteMut.mutate(l.id)}
                className="text-muted-foreground hover:text-destructive transition p-1"
                title="Remover"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-graphite">
            {l.phone && (
              <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1.5 story-link">
                <Phone className="h-3.5 w-3.5 text-rose-burnt" /> {l.phone}
              </a>
            )}
            {l.email && (
              <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1.5 story-link">
                <Mail className="h-3.5 w-3.5 text-rose-burnt" /> {l.email}
              </a>
            )}
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{l.message}</p>

          {/* AI block */}
          {l.ai_qualified_at ? (
            <div className="rounded-xl bg-blush/30 border border-rose-burnt/20 p-4 space-y-3 mt-2">
              <div className="flex items-center gap-2 text-xs font-editorial uppercase tracking-[0.2em] text-rose-burnt">
                <Sparkles className="h-3.5 w-3.5" /> Análise da Pérola IA
              </div>
              {l.ai_summary && <p className="text-sm text-graphite leading-relaxed">{l.ai_summary}</p>}
              {l.ai_suggested_reply && (
                <div className="bg-pearl/70 rounded-lg p-3 space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Resposta sugerida</p>
                  <p className="text-sm text-graphite whitespace-pre-wrap leading-relaxed">{l.ai_suggested_reply}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyReply(l.ai_suggested_reply)}
                      className="inline-flex items-center gap-1.5 text-xs rounded-full bg-graphite text-pearl px-3 py-1.5 hover:bg-graphite/90 transition"
                    >
                      <Copy className="h-3 w-3" /> Copiar
                    </button>
                    {l.phone && (
                      <a
                        href={`https://wa.me/${String(l.phone).replace(/\D/g, "")}?text=${encodeURIComponent(l.ai_suggested_reply)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs rounded-full bg-emerald-600 text-white px-3 py-1.5 hover:bg-emerald-700 transition"
                      >
                        Abrir no WhatsApp
                      </a>
                    )}
                    <button
                      onClick={() => qualify(l.id)}
                      disabled={qualifying === l.id}
                      className="inline-flex items-center gap-1.5 text-xs rounded-full border border-rose-burnt/40 text-rose-burnt px-3 py-1.5 hover:bg-rose-burnt/10 transition disabled:opacity-50"
                    >
                      <Sparkles className="h-3 w-3" /> Gerar de novo
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => qualify(l.id)}
              disabled={qualifying === l.id}
              className="inline-flex items-center gap-1.5 text-xs rounded-full border border-rose-burnt/40 text-rose-burnt px-3 py-1.5 hover:bg-rose-burnt/10 transition disabled:opacity-50 mt-2"
            >
              <Sparkles className="h-3 w-3" /> {qualifying === l.id ? "Analisando…" : "Qualificar com IA"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
