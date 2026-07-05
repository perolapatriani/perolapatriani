import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Share2, CalendarClock } from "lucide-react";
import BlogCardDialog from "@/components/admin/BlogCardDialog";
import { Field, TextInput, TextArea, PrimaryButton, GhostButton } from "@/components/admin/Field";
import ImageUploader from "@/components/admin/ImageUploader";
import { slugify } from "@/lib/slug";

type Post = {
  id?: string; title: string; slug: string; excerpt: string | null;
  content: string | null; cover_url: string | null; author: string | null;
  is_published: boolean; published_at: string | null; scheduled_for: string | null;
};
const empty: Post = { title: "", slug: "", excerpt: "", content: "", cover_url: null, author: "Pérola Patriani", is_published: false, published_at: null, scheduled_for: null };

export default function AdminPosts() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin", "posts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Post[];
    },
  });
  const [editing, setEditing] = useState<Post | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [cardPost, setCardPost] = useState<Post | null>(null);

  const generateWeekly = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-weekly-post");
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Rascunho gerado! Revise antes de publicar.");
      qc.invalidateQueries({ queryKey: ["admin", "posts"] });
    } catch (e: any) { toast.error(e.message || "Falha ao gerar"); }
    finally { setGenerating(false); }
  };

  useEffect(() => {
    if (editing && !editing.id && editing.title) {
      setEditing((p) => p ? { ...p, slug: p.slug || slugify(p.title) } : p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.title]);

  const onChange = (k: keyof Post, v: any) => setEditing((p) => p ? { ...p, [k]: v } : p);

  const save = async () => {
    if (!editing) return;
    if (!editing.title) return toast.error("Título obrigatório");
    setSaving(true);
    try {
      const payload = {
        ...editing,
        slug: slugify(editing.slug || editing.title),
        published_at: editing.is_published ? (editing.published_at || new Date().toISOString()) : null,
      };
      const { id, ...rest } = payload;
      const { error } = id
        ? await supabase.from("posts").update(rest).eq("id", id)
        : await supabase.from("posts").insert(rest);
      if (error) throw error;
      toast.success("Post salvo");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin", "posts"] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "posts"] });
    qc.invalidateQueries({ queryKey: ["posts"] });
    toast.success("Removido");
  };

  if (editing) {
    return (
      <div className="space-y-6 max-w-4xl">
        <h2 className="font-display text-3xl text-graphite">{editing.id ? "Editar post" : "Novo post"}</h2>
        <div className="luxe-card p-8 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Título"><TextInput value={editing.title} onChange={(e) => onChange("title", e.target.value)} /></Field>
            <Field label="Slug"><TextInput value={editing.slug} onChange={(e) => onChange("slug", e.target.value)} /></Field>
            <Field label="Autor"><TextInput value={editing.author ?? ""} onChange={(e) => onChange("author", e.target.value)} /></Field>
          </div>
          <Field label="Resumo"><TextArea value={editing.excerpt ?? ""} onChange={(e) => onChange("excerpt", e.target.value)} rows={3} /></Field>
          <Field label="Conteúdo (markdown ou texto)"><TextArea value={editing.content ?? ""} onChange={(e) => onChange("content", e.target.value)} rows={12} /></Field>
          <ImageUploader value={editing.cover_url ? [editing.cover_url] : []} onChange={(urls) => onChange("cover_url", urls[0] ?? null)} multiple={false} folder="posts" label="Capa" />
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-3xl text-graphite">Blog</h2>
        <div className="flex gap-2">
          <GhostButton onClick={generateWeekly} disabled={generating}>
            <Sparkles className="h-3.5 w-3.5" /> {generating ? "Gerando…" : "Gerar post da semana (IA)"}
          </GhostButton>
          <PrimaryButton onClick={() => setEditing({ ...empty })}><Plus className="h-3.5 w-3.5" /> Novo post</PrimaryButton>
        </div>
      </div>
      {isLoading ? <p>Carregando…</p> : items.length === 0 ? (
        <div className="luxe-card p-10 text-center">
          <p className="font-display text-2xl mb-4">Nenhum post</p>
          <PrimaryButton onClick={() => setEditing({ ...empty })}><Plus className="h-3.5 w-3.5" /> Criar</PrimaryButton>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((p) => (
            <div key={p.id} className="luxe-card p-4 flex gap-4 items-center">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-champagne flex-shrink-0">
                {p.cover_url && <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg truncate">{p.title}</h3>
                <p className="text-xs text-muted-foreground">{p.is_published ? "Publicado" : "Rascunho"} · {p.author}</p>
              </div>
              <button onClick={() => setCardPost(p)} className="p-2 rounded-full hover:bg-champagne text-rose-burnt" title="Cards Instagram + TikTok"><Share2 className="h-4 w-4" /></button>
              <button onClick={() => setEditing(p)} className="p-2 rounded-full hover:bg-champagne"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => p.id && remove(p.id)} className="p-2 rounded-full hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
      <BlogCardDialog post={cardPost} onClose={() => setCardPost(null)} />
    </div>
  );
}
