import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Mail, Phone, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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

  return (
    <div className="space-y-4">
      <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt">
        {leads.length} lead{leads.length !== 1 ? "s" : ""}
      </p>
      {leads.map((l) => (
        <div key={l.id} className="glass-strong rounded-2xl p-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-lg text-graphite">{l.name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(l.created_at).toLocaleString("pt-BR")} · {l.source}
              </p>
            </div>
            <button
              onClick={() => deleteMut.mutate(l.id)}
              className="text-muted-foreground hover:text-destructive transition p-1"
              title="Remover"
            >
              <Trash2 className="h-4 w-4" />
            </button>
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
