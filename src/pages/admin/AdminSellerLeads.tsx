import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Mail, Phone, Home } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const STATUS = [
  { value: "novo", label: "Novo", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "em_contato", label: "Em contato", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "captado", label: "Captado", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "descartado", label: "Descartado", color: "bg-gray-100 text-gray-700 border-gray-200" },
] as const;

export default function AdminSellerLeads() {
  const qc = useQueryClient();
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["seller_leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("seller_leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("seller_leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["seller_leads"] }); toast({ title: "Removido" }); },
  });

  const updStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("seller_leads").update({ status } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["seller_leads"] }); toast({ title: "Status atualizado" }); },
  });

  if (isLoading) return <p className="text-muted-foreground">Carregando…</p>;
  if (!leads.length) {
    return (
      <div className="text-center py-20">
        <Home className="h-10 w-10 mx-auto text-muted-foreground/40 mb-4" />
        <p className="font-display text-2xl text-graphite">Nenhuma captação ainda</p>
        <p className="text-muted-foreground mt-2">Os cadastros de proprietários aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt">{leads.length} captação{leads.length !== 1 ? "ões" : ""}</p>
      {leads.map((l: any) => (
        <div key={l.id} className="glass-strong rounded-2xl p-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-lg text-graphite">{l.name}</p>
              <p className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={l.status ?? "novo"}
                onChange={(e) => updStatus.mutate({ id: l.id, status: e.target.value })}
                className={`text-xs font-semibold rounded-full px-2.5 py-1 border cursor-pointer outline-none ${STATUS.find(s => s.value === (l.status ?? "novo"))?.color}`}
              >
                {STATUS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button onClick={() => del.mutate(l.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-graphite">
            <p><strong>Tipo:</strong> {l.property_type ?? "—"}</p>
            <p><strong>Bairro:</strong> {l.neighborhood ?? "—"}</p>
            {l.address && <p className="sm:col-span-2"><strong>Endereço:</strong> {l.address}</p>}
            {l.bedrooms && <p><strong>Dormitórios:</strong> {l.bedrooms}</p>}
            {l.desired_price && <p><strong>Valor desejado:</strong> R$ {Number(l.desired_price).toLocaleString("pt-BR")}</p>}
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {l.phone && <a href={`https://wa.me/55${String(l.phone).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 story-link text-graphite"><Phone className="h-3.5 w-3.5 text-rose-burnt" /> {l.phone}</a>}
            {l.email && <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1.5 story-link text-graphite"><Mail className="h-3.5 w-3.5 text-rose-burnt" /> {l.email}</a>}
          </div>
          {l.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap border-t border-border pt-3">{l.notes}</p>}
        </div>
      ))}
    </div>
  );
}
