import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Mail, Phone, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

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

export default function AdminLeads() {
  const qc = useQueryClient();
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

  return (
    <div className="space-y-6">
      {/* Funnel summary */}
      <div className="flex flex-wrap gap-3">
        {STATUS_OPTIONS.map((o) => (
          <div key={o.value} className={`rounded-xl border px-4 py-2 text-center ${o.color}`}>
            <p className="text-2xl font-display">{counts[o.value]}</p>
            <p className="text-[10px] uppercase tracking-widest">{o.label}</p>
          </div>
        ))}
      </div>

      <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt">
        {leads.length} lead{leads.length !== 1 ? "s" : ""}
      </p>

      {leads.map((l) => (
        <div key={l.id} className="glass-strong rounded-2xl p-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="font-display text-lg text-graphite">{l.name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(l.created_at).toLocaleString("pt-BR")} · {l.source}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge
                status={(l as any).status ?? "novo"}
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
        </div>
      ))}
    </div>
  );
}
