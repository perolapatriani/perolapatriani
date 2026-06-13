import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Phone, Mail, Wand2, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminMatchLeads() {
  const qc = useQueryClient();
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["match_leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("match_leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: props = [] } = useQuery({
    queryKey: ["all_properties_min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("id,title,slug,code");
      if (error) throw error;
      return data;
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("match_leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["match_leads"] }); toast({ title: "Removido" }); },
  });

  if (isLoading) return <p className="text-muted-foreground">Carregando…</p>;
  if (!leads.length) {
    return (
      <div className="text-center py-20">
        <Wand2 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-4" />
        <p className="font-display text-2xl text-graphite">Nenhum match ainda</p>
        <p className="text-muted-foreground mt-2">Quem usar o Match de Perfil aparecerá aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt">{leads.length} match{leads.length !== 1 ? "es" : ""}</p>
      {leads.map((l: any) => {
        const recos = (l.recommended_property_ids ?? []).map((id: string) => props.find((p: any) => p.id === id)).filter(Boolean);
        return (
          <div key={l.id} className="glass-strong rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-lg text-graphite">{l.name}</p>
                <p className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <button onClick={() => del.mutate(l.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              {l.phone && <a href={`https://wa.me/55${String(l.phone).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 story-link text-graphite"><Phone className="h-3.5 w-3.5 text-rose-burnt" /> {l.phone}</a>}
              {l.email && <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1.5 story-link text-graphite"><Mail className="h-3.5 w-3.5 text-rose-burnt" /> {l.email}</a>}
            </div>
            <div className="text-sm">
              <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Respostas</p>
              <div className="grid sm:grid-cols-2 gap-1 text-graphite">
                {Object.entries(l.answers ?? {}).map(([k, v]) => v ? <p key={k}><strong className="capitalize">{k}:</strong> {String(v)}</p> : null)}
              </div>
            </div>
            {l.ai_reasoning && (
              <div className="bg-champagne/40 rounded-xl p-4">
                <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt mb-2">Análise IA</p>
                <p className="text-sm text-graphite italic">"{l.ai_reasoning}"</p>
              </div>
            )}
            {recos.length > 0 && (
              <div>
                <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Imóveis sugeridos</p>
                <div className="space-y-1">
                  {recos.map((p: any) => (
                    <a key={p.id} href={`/imoveis/${p.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-graphite hover:text-rose-burnt">
                      <ExternalLink className="h-3 w-3" /> {p.code ? `${p.code} · ` : ""}{p.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
