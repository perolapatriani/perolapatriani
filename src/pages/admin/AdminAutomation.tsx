import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Instagram, Facebook, AtSign, Send, RefreshCw, Sparkles, CalendarDays, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { PrimaryButton, GhostButton, Select } from "@/components/admin/Field";

type SocialPost = {
  id: string; channel: string; kind: string; status: string; caption: string | null;
  hashtags: string[]; image_url: string | null; link_url: string | null;
  scheduled_for: string | null; published_at: string | null; error_message: string | null;
  reach: number; likes: number; comments: number; clicks: number;
};

const channelIcon: Record<string, typeof Instagram> = {
  instagram: Instagram, facebook: Facebook, threads: AtSign,
};

const statusStyle: Record<string, string> = {
  publicado: "bg-emerald-100 text-emerald-800",
  agendado: "bg-amber-100 text-amber-800",
  processando: "bg-sky-100 text-sky-800",
  erro: "bg-destructive/10 text-destructive",
  aguardando_integracao: "bg-muted text-muted-foreground",
  rascunho: "bg-muted text-muted-foreground",
};

const statusLabel: Record<string, string> = {
  publicado: "Publicado", agendado: "Agendado", processando: "Processando",
  erro: "Erro", aguardando_integracao: "Aguardando integração", rascunho: "Rascunho",
};

export default function AdminAutomation() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("todos");
  const [running, setRunning] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState("");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin", "social_posts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("social_posts").select("*")
        .order("scheduled_for", { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as SocialPost[];
    },
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["admin", "properties", "min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("id, title").eq("status", "ativo")
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["admin", "automation_jobs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("automation_jobs").select("*")
        .order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(
    () => (filter === "todos" ? posts : posts.filter((p) => p.status === filter)),
    [posts, filter],
  );

  const stats = useMemo(() => ({
    publicados: posts.filter((p) => p.status === "publicado").length,
    agendados: posts.filter((p) => p.status === "agendado").length,
    pendentes: posts.filter((p) => p.status === "aguardando_integracao").length,
    erros: posts.filter((p) => p.status === "erro").length,
    alcance: posts.reduce((a, p) => a + (p.reach ?? 0), 0),
    curtidas: posts.reduce((a, p) => a + (p.likes ?? 0), 0),
  }), [posts]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "social_posts"] });
    qc.invalidateQueries({ queryKey: ["admin", "automation_jobs"] });
  };

  const generate = async () => {
    if (!selectedProperty) return toast.error("Escolha um imóvel");
    setRunning("generate");
    try {
      const { data, error } = await supabase.functions.invoke("auto-publish-property", {
        body: { entity_type: "property", entity_id: selectedProperty },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Artigo criado e posts enfileirados");
      refresh();
      qc.invalidateQueries({ queryKey: ["admin", "posts"] });
    } catch (e: any) {
      toast.error(e.message ?? "Falha na automação");
    } finally { setRunning(null); }
  };

  const runQueue = async (id?: string) => {
    setRunning(id ?? "queue");
    try {
      const { data, error } = await supabase.functions.invoke("publish-social", { body: id ? { id } : {} });
      if (error) throw error;
      const res = data as any;
      if (res?.reason === "sem_integracao") toast.warning("Conecte as redes em Integrações para publicar automaticamente.");
      else toast.success(`${res?.processed ?? 0} publicação(ões) enviada(s)`);
      refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao publicar");
    } finally { setRunning(null); }
  };

  const syncMetrics = async () => {
    setRunning("metrics");
    try {
      const { error } = await supabase.functions.invoke("collect-social-metrics", { body: {} });
      if (error) throw error;
      toast.success("Métricas atualizadas");
      refresh();
    } catch (e: any) { toast.error(e.message ?? "Falha"); } finally { setRunning(null); }
  };

  const calendar = useMemo(() => {
    const map = new Map<string, SocialPost[]>();
    posts.forEach((p) => {
      const d = p.published_at ?? p.scheduled_for;
      if (!d) return;
      const key = new Date(d).toISOString().slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), p]);
    });
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 10);
  }, [posts]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-3xl text-graphite">Automação de marketing</h2>
        <div className="flex gap-2">
          <GhostButton onClick={syncMetrics} disabled={running === "metrics"}>
            <RefreshCw className="h-3.5 w-3.5" /> Métricas
          </GhostButton>
          <PrimaryButton onClick={() => runQueue()} disabled={running === "queue"}>
            <Send className="h-3.5 w-3.5" /> {running === "queue" ? "Publicando…" : "Processar fila"}
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: "Publicados", value: stats.publicados },
          { label: "Agendados", value: stats.agendados },
          { label: "Pendentes", value: stats.pendentes },
          { label: "Erros", value: stats.erros },
          { label: "Alcance", value: stats.alcance },
          { label: "Curtidas", value: stats.curtidas },
        ].map((s) => (
          <div key={s.label} className="luxe-card p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{s.label}</p>
            <p className="font-display text-3xl text-graphite mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="luxe-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-rose-burnt" />
          <h3 className="font-display text-xl">Gerar campanha completa</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Escolha um imóvel: a IA escreve o artigo otimizado para o blog (H1, H2, FAQ, palavras-chave), cria a legenda,
          hashtags, ALT text e enfileira as publicações para Instagram (feed + stories), Facebook e Threads.
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[260px] flex-1">
            <Select value={selectedProperty} onChange={(e) => setSelectedProperty(e.target.value)}>
              <option value="">Selecione um imóvel…</option>
              {properties.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </Select>
          </div>
          <PrimaryButton onClick={generate} disabled={running === "generate"}>
            {running === "generate" ? "Gerando…" : "Gerar e publicar"}
          </PrimaryButton>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="luxe-card p-6 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-rose-burnt" />
            <h3 className="font-display text-xl">Calendário editorial</h3>
          </div>
          {calendar.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nada agendado ainda.</p>
          ) : (
            <div className="space-y-3">
              {calendar.map(([day, items]) => (
                <div key={day} className="border-b border-border pb-3 last:border-0">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">
                    {new Date(day + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((it) => {
                      const Icon = channelIcon[it.channel] ?? Send;
                      return (
                        <span key={it.id} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${statusStyle[it.status] ?? ""}`}>
                          <Icon className="h-3 w-3" /> {it.kind === "story" ? "Story" : "Feed"}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-xl">Publicações</h3>
            <div className="w-56">
              <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="todos">Todos os status</option>
                {Object.keys(statusLabel).map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
              </Select>
            </div>
          </div>

          {isLoading ? <p>Carregando…</p> : filtered.length === 0 ? (
            <div className="luxe-card p-8 text-center text-muted-foreground text-sm">Nenhuma publicação nesse filtro.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((p) => {
                const Icon = channelIcon[p.channel] ?? Send;
                return (
                  <div key={p.id} className="luxe-card p-4 flex gap-4 items-start">
                    <div className="w-16 h-20 rounded-lg overflow-hidden bg-champagne flex-shrink-0">
                      {p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Icon className="h-3.5 w-3.5 text-rose-burnt" />
                        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {p.channel} · {p.kind === "story" ? "Stories" : "Feed"}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] ${statusStyle[p.status] ?? ""}`}>
                          {statusLabel[p.status] ?? p.status}
                        </span>
                      </div>
                      <p className="text-sm text-graphite/80 line-clamp-2">{p.caption}</p>
                      {p.error_message && (
                        <p className="text-xs text-destructive mt-1 inline-flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> {p.error_message}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-1">
                        {p.published_at ? <><CheckCircle2 className="h-3 w-3" /> {new Date(p.published_at).toLocaleString("pt-BR")}</>
                          : p.scheduled_for ? <><Clock className="h-3 w-3" /> {new Date(p.scheduled_for).toLocaleString("pt-BR")}</> : null}
                        {p.status === "publicado" && ` · ${p.reach} alcance · ${p.likes} curtidas · ${p.comments} comentários`}
                      </p>
                    </div>
                    {p.status !== "publicado" && (
                      <GhostButton onClick={() => runQueue(p.id)} disabled={running === p.id}>
                        {running === p.id ? "…" : "Publicar"}
                      </GhostButton>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {jobs.length > 0 && (
        <div className="luxe-card p-6">
          <h3 className="font-display text-xl mb-4">Histórico da automação</h3>
          <div className="space-y-2 text-sm">
            {jobs.map((j: any) => (
              <div key={j.id} className="flex justify-between gap-3 border-b border-border pb-2 last:border-0">
                <span className="text-muted-foreground">{j.job_type} · {j.entity_type}</span>
                <span className={j.status === "erro" ? "text-destructive" : "text-graphite"}>
                  {j.status} · {new Date(j.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
