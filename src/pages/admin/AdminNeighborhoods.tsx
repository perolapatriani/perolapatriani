import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { Field, TextInput, TextArea, PrimaryButton, GhostButton } from "@/components/admin/Field";
import ImageUploader from "@/components/admin/ImageUploader";
import { slugify } from "@/lib/slug";

type Item = {
  id?: string; name: string; slug: string; description: string | null;
  image_url: string | null; display_order: number;
};
const empty: Item = { name: "", slug: "", description: "", image_url: null, display_order: 0 };

export default function AdminNeighborhoods() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin", "neighborhoods"],
    queryFn: async () => {
      const { data, error } = await supabase.from("neighborhoods").select("*").order("display_order");
      if (error) throw error;
      return data as Item[];
    },
  });
  const [editing, setEditing] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const generateWithAi = async () => {
    if (!editing?.name) { toast.error("Informe o nome do bairro"); return; }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-neighborhood-copy", {
        body: { name: editing.name, notes: editing.description ?? "" },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const d = (data as any).data;
      const desc = `${d.description}\n\nDestaques:\n• ${d.highlights.join("\n• ")}`;
      setEditing((p) => p ? { ...p, description: desc } : p);
      toast.success("Descrição gerada — revise antes de salvar");
    } catch (e: any) { toast.error(e.message); } finally { setAiLoading(false); }
  };

  useEffect(() => {
    if (editing && !editing.id && editing.name) {
      setEditing((p) => p ? { ...p, slug: p.slug || slugify(p.name) } : p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.name]);

  const onChange = (k: keyof Item, v: any) => setEditing((p) => p ? { ...p, [k]: v } : p);

  const save = async () => {
    if (!editing) return;
    if (!editing.name) return toast.error("Nome obrigatório");
    setSaving(true);
    try {
      const payload = { ...editing, slug: slugify(editing.slug || editing.name) };
      const { id, ...rest } = payload;
      const { error } = id
        ? await supabase.from("neighborhoods").update(rest).eq("id", id)
        : await supabase.from("neighborhoods").insert(rest);
      if (error) throw error;
      toast.success("Bairro salvo");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin", "neighborhoods"] });
      qc.invalidateQueries({ queryKey: ["neighborhoods"] });
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir bairro?")) return;
    const { error } = await supabase.from("neighborhoods").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "neighborhoods"] });
    qc.invalidateQueries({ queryKey: ["neighborhoods"] });
    toast.success("Removido");
  };

  if (editing) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h2 className="font-display text-3xl text-graphite">{editing.id ? "Editar bairro" : "Novo bairro"}</h2>
        <div className="luxe-card p-8 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Nome"><TextInput value={editing.name} onChange={(e) => onChange("name", e.target.value)} /></Field>
            <Field label="Slug"><TextInput value={editing.slug} onChange={(e) => onChange("slug", e.target.value)} /></Field>
            <Field label="Ordem"><TextInput type="number" value={editing.display_order} onChange={(e) => onChange("display_order", Number(e.target.value))} /></Field>
          </div>
          <Field label="Descrição">
            <div className="space-y-2">
              <TextArea value={editing.description ?? ""} onChange={(e) => onChange("description", e.target.value)} rows={6} />
              <button
                type="button"
                onClick={generateWithAi}
                disabled={aiLoading}
                className="inline-flex items-center gap-1.5 text-xs rounded-full bg-blush/50 text-rose-burnt border border-rose-burnt/30 px-3 py-1.5 hover:bg-blush transition disabled:opacity-50"
              >
                <Sparkles className="h-3 w-3" /> {aiLoading ? "Gerando…" : "Gerar descrição com IA"}
              </button>
            </div>
          </Field>
          <ImageUploader value={editing.image_url ? [editing.image_url] : []} onChange={(urls) => onChange("image_url", urls[0] ?? null)} multiple={false} folder="neighborhoods" label="Imagem" />
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
        <h2 className="font-display text-3xl text-graphite">Bairros</h2>
        <PrimaryButton onClick={() => setEditing({ ...empty })}><Plus className="h-3.5 w-3.5" /> Novo bairro</PrimaryButton>
      </div>
      {isLoading ? <p>Carregando…</p> : items.length === 0 ? (
        <div className="luxe-card p-10 text-center">
          <p className="font-display text-2xl mb-4">Nenhum bairro</p>
          <PrimaryButton onClick={() => setEditing({ ...empty })}><Plus className="h-3.5 w-3.5" /> Criar</PrimaryButton>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((n) => (
            <div key={n.id} className="luxe-card p-4 flex gap-4 items-center">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-champagne flex-shrink-0">
                {n.image_url && <img src={n.image_url} alt={n.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg truncate">{n.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{n.description}</p>
              </div>
              <button onClick={() => setEditing(n)} className="p-2 rounded-full hover:bg-champagne"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => n.id && remove(n.id)} className="p-2 rounded-full hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
