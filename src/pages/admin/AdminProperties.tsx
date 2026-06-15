import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Star, Instagram, Sparkles } from "lucide-react";
import InstagramCardDialog from "@/components/admin/InstagramCardDialog";
import { Field, TextInput, TextArea, Select, PrimaryButton, GhostButton } from "@/components/admin/Field";
import ImageUploader from "@/components/admin/ImageUploader";
import { slugify } from "@/lib/slug";

type Property = {
  id?: string;
  title: string;
  slug: string;
  code: string | null;
  property_type: string;
  purpose: string;
  price: number | null;
  bedrooms: number;
  suites: number;
  parking: number;
  area_m2: number | null;
  description: string | null;
  neighborhood_name: string | null;
  cover_url: string | null;
  photos: string[];
  video_url: string | null;
  status: string;
  is_featured: boolean;
  is_new: boolean;
  latitude: number | null;
  longitude: number | null;
};

const empty: Property = {
  title: "", slug: "", code: "", property_type: "Apartamento", purpose: "venda",
  price: null, bedrooms: 0, suites: 0, parking: 0, area_m2: null,
  description: "", neighborhood_name: "", cover_url: null, photos: [],
  video_url: null, status: "ativo", is_featured: false, is_new: false,
  latitude: null, longitude: null,
};

export default function AdminProperties() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin", "properties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Property[];
    },
  });

  const [editing, setEditing] = useState<Property | null>(null);
  const [saving, setSaving] = useState(false);
  const [igCard, setIgCard] = useState<Property | null>(null);

  const onChange = (k: keyof Property, v: any) => setEditing((p) => p ? { ...p, [k]: v } : p);

  useEffect(() => {
    if (editing && !editing.id && editing.title) {
      setEditing((p) => p ? { ...p, slug: p.slug || slugify(p.title) } : p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.title]);

  const save = async () => {
    if (!editing) return;
    if (!editing.title || !editing.slug) { toast.error("Título e slug obrigatórios"); return; }
    setSaving(true);
    try {
      const payload = {
        ...editing,
        cover_url: editing.cover_url || editing.photos[0] || null,
        slug: slugify(editing.slug),
      };
      const { id, ...rest } = payload;
      const { error } = id
        ? await supabase.from("properties").update(rest).eq("id", id)
        : await supabase.from("properties").insert(rest);
      if (error) throw error;
      toast.success("Imóvel salvo");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin", "properties"] });
      qc.invalidateQueries({ queryKey: ["properties"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este imóvel?")) return;
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Imóvel removido");
    qc.invalidateQueries({ queryKey: ["admin", "properties"] });
    qc.invalidateQueries({ queryKey: ["properties"] });
  };

  if (editing) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl text-graphite">{editing.id ? "Editar imóvel" : "Novo imóvel"}</h2>
          <GhostButton onClick={() => setEditing(null)}>Cancelar</GhostButton>
        </div>

        <div className="luxe-card p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Título"><TextInput value={editing.title} onChange={(e) => onChange("title", e.target.value)} /></Field>
            <Field label="Slug (URL)" hint="Gerado automaticamente"><TextInput value={editing.slug} onChange={(e) => onChange("slug", e.target.value)} /></Field>
            <Field label="Código"><TextInput value={editing.code ?? ""} onChange={(e) => onChange("code", e.target.value)} /></Field>
            <Field label="Bairro" hint="Usado para posicionar no mapa"><TextInput value={editing.neighborhood_name ?? ""} onChange={(e) => onChange("neighborhood_name", e.target.value)} /></Field>
            <Field label="Tipo">
              <Select value={editing.property_type} onChange={(e) => onChange("property_type", e.target.value)}>
                <option>Apartamento</option><option>Casa</option><option>Cobertura</option>
                <option>Terreno</option><option>Comercial</option><option>Sobrado</option>
              </Select>
            </Field>
            <Field label="Finalidade">
              <Select value={editing.purpose} onChange={(e) => onChange("purpose", e.target.value)}>
                <option value="venda">Venda</option><option value="locacao">Locação</option>
              </Select>
            </Field>
            <Field label="Preço (R$)"><TextInput type="number" value={editing.price ?? ""} onChange={(e) => onChange("price", e.target.value ? Number(e.target.value) : null)} /></Field>
            <Field label="Área (m²)"><TextInput type="number" value={editing.area_m2 ?? ""} onChange={(e) => onChange("area_m2", e.target.value ? Number(e.target.value) : null)} /></Field>
            <Field label="Dormitórios"><TextInput type="number" value={editing.bedrooms} onChange={(e) => onChange("bedrooms", Number(e.target.value))} /></Field>
            <Field label="Suítes"><TextInput type="number" value={editing.suites} onChange={(e) => onChange("suites", Number(e.target.value))} /></Field>
            <Field label="Vagas"><TextInput type="number" value={editing.parking} onChange={(e) => onChange("parking", Number(e.target.value))} /></Field>
            <Field label="Status">
              <Select value={editing.status} onChange={(e) => onChange("status", e.target.value)}>
                <option value="ativo">Ativo</option><option value="vendido">Vendido</option><option value="rascunho">Rascunho</option>
              </Select>
            </Field>
          </div>

          <Field label="Descrição">
            <TextArea value={editing.description ?? ""} onChange={(e) => onChange("description", e.target.value)} rows={5} />
          </Field>

          <Field label="Vídeo (URL do YouTube ou Vimeo)" hint="Cole o link completo do vídeo">
            <TextInput value={editing.video_url ?? ""} onChange={(e) => onChange("video_url", e.target.value || null)} placeholder="https://www.youtube.com/watch?v=..." />
          </Field>

          <ImageUploader
            value={editing.photos}
            onChange={(urls) => setEditing((p) => p ? { ...p, photos: urls, cover_url: p.cover_url ?? urls[0] ?? null } : p)}
            folder="properties"
            label="Fotos"
          />

          <div className="flex flex-wrap gap-6 pt-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.is_featured} onChange={(e) => onChange("is_featured", e.target.checked)} />
              Destaque na home
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.is_new} onChange={(e) => onChange("is_new", e.target.checked)} />
              Novidade
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <PrimaryButton onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar imóvel"}</PrimaryButton>
            <GhostButton onClick={() => setEditing(null)}>Cancelar</GhostButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl text-graphite">Imóveis</h2>
        <PrimaryButton onClick={() => setEditing({ ...empty })}><Plus className="h-3.5 w-3.5" /> Novo imóvel</PrimaryButton>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="luxe-card p-10 text-center">
          <p className="font-display text-2xl text-graphite mb-2">Nenhum imóvel cadastrado</p>
          <p className="text-muted-foreground mb-6">Cadastre seu primeiro imóvel para aparecer no site.</p>
          <PrimaryButton onClick={() => setEditing({ ...empty })}><Plus className="h-3.5 w-3.5" /> Criar imóvel</PrimaryButton>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((p) => (
            <div key={p.id} className="luxe-card p-4 flex gap-4 items-center">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-champagne flex-shrink-0">
                {p.cover_url && <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg text-graphite truncate">{p.title}</h3>
                  {p.is_featured && <Star className="h-4 w-4 text-rose-burnt fill-rose-burnt" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.code} · {p.neighborhood_name} · {p.property_type} · {p.status}
                </p>
                <p className="text-sm text-rose-burnt font-medium mt-0.5">
                  {p.price ? `R$ ${Number(p.price).toLocaleString("pt-BR")}` : "Sob consulta"}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIgCard(p)} className="p-2 rounded-full hover:bg-champagne transition text-rose-burnt" aria-label="Card Instagram" title="Gerar card para Instagram"><Instagram className="h-4 w-4" /></button>
                <button onClick={() => setEditing(p)} className="p-2 rounded-full hover:bg-champagne transition" aria-label="Editar"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => p.id && remove(p.id)} className="p-2 rounded-full hover:bg-destructive/10 text-destructive transition" aria-label="Excluir"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <InstagramCardDialog property={igCard} onClose={() => setIgCard(null)} />
    </div>
  );
}
