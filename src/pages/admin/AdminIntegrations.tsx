import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Instagram, Facebook, AtSign, BarChart3, Search, Target, CheckCircle2, XCircle } from "lucide-react";
import { Field, TextInput, PrimaryButton } from "@/components/admin/Field";

type Integration = {
  id?: string;
  provider: string;
  is_enabled: boolean;
  config: Record<string, string>;
  status: string;
};

const PROVIDERS = [
  {
    key: "instagram", label: "Instagram Business", icon: Instagram,
    help: "Conta Instagram Business vinculada a uma Página do Facebook. Precisa do ID da conta e de um token com permissão de publicação.",
    fields: [{ k: "business_id", label: "ID da conta Instagram Business" }, { k: "username", label: "@usuário" }],
    secret: "META_ACCESS_TOKEN / INSTAGRAM_BUSINESS_ID",
  },
  {
    key: "facebook", label: "Página do Facebook", icon: Facebook,
    help: "Página conectada ao mesmo app da Meta usado pelo Instagram.",
    fields: [{ k: "page_id", label: "ID da Página" }, { k: "page_name", label: "Nome da Página" }],
    secret: "FACEBOOK_PAGE_ID",
  },
  {
    key: "threads", label: "Threads", icon: AtSign,
    help: "Perfil Threads vinculado ao Instagram Business.",
    fields: [{ k: "user_id", label: "ID do usuário Threads" }],
    secret: "THREADS_USER_ID",
  },
  {
    key: "google_analytics", label: "Google Analytics 4", icon: BarChart3,
    help: "Cole o ID de medição (G-XXXXXXX) para acompanhar o tráfego.",
    fields: [{ k: "measurement_id", label: "ID de medição (G-…)" }],
  },
  {
    key: "search_console", label: "Google Search Console", icon: Search,
    help: "Cole o código de verificação HTML para provar a propriedade do site.",
    fields: [{ k: "verification", label: "Código de verificação" }],
  },
  {
    key: "meta_pixel", label: "Meta Pixel", icon: Target,
    help: "ID do Pixel para medir conversões vindas do Instagram e Facebook.",
    fields: [{ k: "pixel_id", label: "ID do Pixel" }],
  },
];

export default function AdminIntegrations() {
  const qc = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});

  const { data: rows = [] } = useQuery({
    queryKey: ["admin", "integration_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("integration_settings").select("*");
      if (error) throw error;
      return (data ?? []) as unknown as Integration[];
    },
  });

  const get = (provider: string) => rows.find((r) => r.provider === provider);

  const value = (provider: string, k: string) =>
    drafts[provider]?.[k] ?? (get(provider)?.config?.[k] ?? "");

  const setValue = (provider: string, k: string, v: string) =>
    setDrafts((d) => ({ ...d, [provider]: { ...(d[provider] ?? {}), [k]: v } }));

  const save = async (provider: string) => {
    setSaving(provider);
    try {
      const existing = get(provider);
      const config = { ...(existing?.config ?? {}), ...(drafts[provider] ?? {}) };
      const filled = Object.values(config).some((v) => String(v ?? "").trim());
      const payload = {
        provider, config, is_enabled: filled,
        status: filled ? "conectado" : "nao_conectado",
        last_checked_at: new Date().toISOString(),
      };
      const { error } = existing?.id
        ? await supabase.from("integration_settings").update(payload).eq("id", existing.id)
        : await supabase.from("integration_settings").insert(payload as never);
      if (error) throw error;
      toast.success("Integração salva");
      qc.invalidateQueries({ queryKey: ["admin", "integration_settings"] });
    } catch (e: any) { toast.error(e.message); } finally { setSaving(null); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl text-graphite">Integrações</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Aqui ficam os identificadores das contas. Os tokens de acesso (que são sigilosos) são guardados
          separadamente, num cofre do backend — nunca no banco de dados nem no navegador.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-pearl/40 px-5 py-4 text-xs text-muted-foreground space-y-1">
        <p><strong className="text-graphite">Para publicar automaticamente no Instagram</strong> você precisa de:</p>
        <p>1. Conta Instagram <strong>Business</strong> vinculada a uma Página do Facebook.</p>
        <p>2. Um app na Meta for Developers com as permissões <code>instagram_content_publish</code> e <code>pages_show_list</code>.</p>
        <p>3. Um token de acesso de longa duração — me avise quando tiver, que eu guardo no cofre com segurança.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {PROVIDERS.map(({ key, label, icon: Icon, help, fields, secret }) => {
          const row = get(key);
          const connected = row?.is_enabled;
          return (
            <div key={key} className="luxe-card p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-champagne">
                    <Icon className="h-4 w-4 text-rose-burnt" />
                  </span>
                  <div>
                    <h3 className="font-display text-xl leading-tight">{label}</h3>
                    <p className={`text-[11px] inline-flex items-center gap-1 ${connected ? "text-emerald-700" : "text-muted-foreground"}`}>
                      {connected ? <><CheckCircle2 className="h-3 w-3" /> Conectado</> : <><XCircle className="h-3 w-3" /> Não conectado</>}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{help}</p>
              <div className="space-y-3">
                {fields.map((f) => (
                  <Field key={f.k} label={f.label}>
                    <TextInput value={value(key, f.k)} onChange={(e) => setValue(key, f.k, e.target.value)} />
                  </Field>
                ))}
              </div>
              {secret && (
                <p className="text-[11px] text-muted-foreground">
                  Token guardado no cofre como <code>{secret}</code>.
                </p>
              )}
              <PrimaryButton onClick={() => save(key)} disabled={saving === key}>
                {saving === key ? "Salvando…" : "Salvar"}
              </PrimaryButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}
