import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Instagram } from "lucide-react";
import { Field, TextInput, TextArea, Select, PrimaryButton, GhostButton } from "@/components/admin/Field";
import InstagramCardDialog from "@/components/admin/InstagramCardDialog";
import ImageUploader from "@/components/admin/ImageUploader";
import { slugify } from "@/lib/slug";

type Launch = {
  id?: string;
  name: string;
  slug: string;
  location: string | null;
  description: string | null;
  delivery_date: string | null;
  highlights: string[];
  cover_url: string | null;
  photos: string[];
  status: string;
};

const empty: Launch = {
  name: "", slug: "", location: "", description: "", delivery_date: "",
  highlights: [], cover_url: null, photos: [], status: "ativo",
};

export default function AdminLaunches() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin", "launches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("launches").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Launch[];
    },
  });
  const [editing, setEditing] = useState<Launch | null>(null);
  const [highlightsText, setHighlightsText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) setHighlightsText(editing.highlights.join("\n"));
  }, [editing?.id]);

  useEffect(() => {
    if (editing && !editing.id && editing.name) {
      setEditing((p) => p ? { ...p, slug: p.slug || slugify(p.name) } : p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.name]);

  const onChange = (k: keyof Launch, v: any) => setEditing((p) => p ? { ...p, [k]: v } : p);

  const save = async () => {
    if (!editing) return;
    if (!editing.name || !editing.slug) return toast.error("Nome e slug obrigatórios");
    setSaving(true);
    try {
      const payload = {
        ...editing,
        slug: slugify(editing.slug),
        cover_url: editing.cover_url || editing.photos[0] || null,
        highlights: highlightsText.split("\n").map(s => s.trim()).filter(Boolean),
      };
      const { id, ...rest } = payload;
      const { error } = id
        ? await supabase.from("launches").update(rest).eq("id", id)
        : await supabase.from("launches").insert(rest);
      if (error) throw error;
      toast.success("Lançamento salvo");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin", "launches"] });
      qc.invalidateQueries({ queryKey: ["launches"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este lançamento?")) return;
    const { error } = await supabase.from("launches").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Lançamento removido");
    qc.invalidateQueries({ queryKey: ["admin", "launches"] });
    qc.invalidateQueries({ queryKey: ["launches"] });
  };

  if (editing) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl text-graphite">{editing.id ? "Editar lançamento" : "Novo lançamento"}</h2>
          <GhostButton onClick={() => setEditing(null)}>Cancelar</GhostButton>
        </div>
        <div className="luxe-card p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Nome"><TextInput value={editing.name} onChange={(e) => onChange("name", e.target.value)} /></Field>
            <Field label="Slug"><TextInput value={editing.slug} onChange={(e) => onChange("slug", e.target.value)} /></Field>
            <Field label="Localização"><TextInput value={editing.location ?? ""} onChange={(e) => onChange("location", e.target.value)} /></Field>
            <Field label="Entrega"><TextInput value={editing.delivery_date ?? ""} onChange={(e) => onChange("delivery_date", e.target.value)} placeholder="Ex: Dez/2027" /></Field>
            <Field label="Status">
              <Select value={editing.status} onChange={(e) => onChange("status", e.target.value)}>
                <option value="ativo">Ativo</option><option value="encerrado">Encerrado</option>
              </Select>
            </Field>
          </div>
          <Field label="Descrição"><TextArea value={editing.description ?? ""} onChange={(e) => onChange("description", e.target.value)} rows={4} /></Field>
          <Field label="Diferenciais (um por linha)">
            <TextArea value={highlightsText} onChange={(e) => setHighlightsText(e.target.value)} rows={5} placeholder="Vista mar&#10;Spa privativo&#10;Concierge 24h" />
          </Field>
          <ImageUploader value={editing.photos} onChange={(urls) => setEditing((p) => p ? { ...p, photos: urls, cover_url: p.cover_url ?? urls[0] ?? null } : p)} folder="launches" label="Fotos" />
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
        <h2 className="font-display text-3xl text-graphite">Lançamentos</h2>
        <PrimaryButton onClick={() => setEditing({ ...empty })}><Plus className="h-3.5 w-3.5" /> Novo lançamento</PrimaryButton>
      </div>
      {isLoading ? <p className="text-muted-foreground">Carregando…</p> :
       items.length === 0 ? (
         <div className="luxe-card p-10 text-center">
           <p className="font-display text-2xl text-graphite mb-2">Nenhum lançamento</p>
           <PrimaryButton onClick={() => setEditing({ ...empty })}><Plus className="h-3.5 w-3.5" /> Criar lançamento</PrimaryButton>
         </div>
       ) : (
         <div className="grid gap-3">
           {items.map((l) => (
             <div key={l.id} className="luxe-card p-4 flex gap-4 items-center">
               <div className="w-20 h-20 rounded-lg overflow-hidden bg-champagne flex-shrink-0">
                 {l.cover_url && <img src={l.cover_url} alt={l.name} className="w-full h-full object-cover" />}
               </div>
               <div className="flex-1 min-w-0">
                 <h3 className="font-display text-lg text-graphite truncate">{l.name}</h3>
                 <p className="text-xs text-muted-foreground">{l.location} · Entrega {l.delivery_date} · {l.status}</p>
               </div>
               <button onClick={() => setEditing(l)} className="p-2 rounded-full hover:bg-champagne"><Pencil className="h-4 w-4" /></button>
               <button onClick={() => l.id && remove(l.id)} className="p-2 rounded-full hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
             </div>
           ))}
         </div>
       )}
    </div>
  );
}
