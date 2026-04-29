import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Field, TextInput, TextArea, PrimaryButton, GhostButton } from "@/components/admin/Field";
import ImageUploader from "@/components/admin/ImageUploader";

type Item = {
  id?: string; client_name: string; text: string; rating: number;
  photo_url: string | null; display_order: number; is_published: boolean;
};
const empty: Item = { client_name: "", text: "", rating: 5, photo_url: null, display_order: 0, is_published: true };

export default function AdminTestimonials() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin", "testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("testimonials").select("*").order("display_order");
      if (error) throw error;
      return data as Item[];
    },
  });
  const [editing, setEditing] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);

  const onChange = (k: keyof Item, v: any) => setEditing((p) => p ? { ...p, [k]: v } : p);

  const save = async () => {
    if (!editing) return;
    if (!editing.client_name || !editing.text) return toast.error("Nome e depoimento obrigatórios");
    setSaving(true);
    try {
      const { id, ...rest } = editing;
      const { error } = id
        ? await supabase.from("testimonials").update(rest).eq("id", id)
        : await supabase.from("testimonials").insert(rest);
      if (error) throw error;
      toast.success("Depoimento salvo");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin", "testimonials"] });
      qc.invalidateQueries({ queryKey: ["testimonials"] });
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir depoimento?")) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "testimonials"] });
    qc.invalidateQueries({ queryKey: ["testimonials"] });
    toast.success("Removido");
  };

  if (editing) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h2 className="font-display text-3xl text-graphite">{editing.id ? "Editar depoimento" : "Novo depoimento"}</h2>
        <div className="luxe-card p-8 space-y-5">
          <div className="grid sm:grid-cols-3 gap-5">
            <Field label="Nome do cliente"><TextInput value={editing.client_name} onChange={(e) => onChange("client_name", e.target.value)} /></Field>
            <Field label="Nota (1-5)"><TextInput type="number" min={1} max={5} value={editing.rating} onChange={(e) => onChange("rating", Number(e.target.value))} /></Field>
            <Field label="Ordem"><TextInput type="number" value={editing.display_order} onChange={(e) => onChange("display_order", Number(e.target.value))} /></Field>
          </div>
          <Field label="Depoimento"><TextArea value={editing.text} onChange={(e) => onChange("text", e.target.value)} rows={5} /></Field>
          <ImageUploader value={editing.photo_url ? [editing.photo_url] : []} onChange={(urls) => onChange("photo_url", urls[0] ?? null)} multiple={false} folder="testimonials" label="Foto do cliente" />
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editing.is_published} onChange={(e) => onChange("is_published", e.target.checked)} />
            Publicado
          </label>
          <div className="flex gap-3">
            <PrimaryButton onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</PrimaryButton>
            <GhostButton onClick={() => setEditing(null)}>Cancelar</GhostButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl text-graphite">Depoimentos</h2>
        <PrimaryButton onClick={() => setEditing({ ...empty })}><Plus className="h-3.5 w-3.5" /> Novo</PrimaryButton>
      </div>
      {isLoading ? <p>Carregando…</p> : items.length === 0 ? (
        <div className="luxe-card p-10 text-center">
          <p className="font-display text-2xl mb-4">Nenhum depoimento</p>
          <PrimaryButton onClick={() => setEditing({ ...empty })}><Plus className="h-3.5 w-3.5" /> Criar</PrimaryButton>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((t) => (
            <div key={t.id} className="luxe-card p-4 flex gap-4 items-start">
              {t.photo_url && <img src={t.photo_url} alt={t.client_name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg">{t.client_name} <span className="text-xs text-rose-burnt">({t.rating}★)</span></h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{t.text}</p>
              </div>
              <button onClick={() => setEditing(t)} className="p-2 rounded-full hover:bg-champagne"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => t.id && remove(t.id)} className="p-2 rounded-full hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
