// Worker de publicação social: processa social_posts agendados (Instagram Feed/Stories, Facebook, Threads).
// Chamado pelo cron (X-Cron-Secret) ou manualmente por admin.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, requireAdmin, cap } from "../_shared/auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GRAPH = "https://graph.facebook.com/v21.0";

const META_TOKEN = Deno.env.get("META_ACCESS_TOKEN") ?? "";
const IG_USER_ID = Deno.env.get("INSTAGRAM_BUSINESS_ID") ?? "";
const FB_PAGE_ID = Deno.env.get("FACEBOOK_PAGE_ID") ?? "";
const THREADS_USER_ID = Deno.env.get("THREADS_USER_ID") ?? "";

type Row = Record<string, any>;

function fullCaption(row: Row): string {
  const tags = Array.isArray(row.hashtags) && row.hashtags.length
    ? "\n\n" + row.hashtags.map((h: string) => `#${h.replace(/^#/, "")}`).join(" ")
    : "";
  return cap((row.caption ?? "") + tags, 2100);
}

async function graph(path: string, params: Record<string, string>) {
  const res = await fetch(`${GRAPH}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...params, access_token: META_TOKEN }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("graph error", path, res.status, JSON.stringify(json).slice(0, 400));
    throw new Error("Rede social recusou a publicação. Verifique a integração.");
  }
  return json;
}

async function publishInstagram(row: Row): Promise<string> {
  if (!IG_USER_ID) throw new Error("Instagram não conectado");
  if (!row.image_url) throw new Error("Imagem ausente");
  const params: Record<string, string> = { image_url: row.image_url };
  if (row.kind === "story") {
    params.media_type = "STORIES";
  } else {
    params.caption = fullCaption(row);
    if (row.alt_text) params.alt_text = cap(row.alt_text, 200);
  }
  const container = await graph(`${IG_USER_ID}/media`, params);
  const published = await graph(`${IG_USER_ID}/media_publish`, { creation_id: String(container.id) });
  return String(published.id ?? container.id);
}

async function publishFacebook(row: Row): Promise<string> {
  if (!FB_PAGE_ID) throw new Error("Facebook não conectado");
  const params: Record<string, string> = { message: fullCaption(row) };
  if (row.image_url) params.url = row.image_url;
  const endpoint = row.image_url ? `${FB_PAGE_ID}/photos` : `${FB_PAGE_ID}/feed`;
  const res = await graph(endpoint, params);
  return String(res.post_id ?? res.id);
}

async function publishThreads(row: Row): Promise<string> {
  if (!THREADS_USER_ID) throw new Error("Threads não conectado");
  const res = await fetch(`https://graph.threads.net/v1.0/${THREADS_USER_ID}/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      media_type: row.image_url ? "IMAGE" : "TEXT",
      ...(row.image_url ? { image_url: row.image_url } : {}),
      text: cap(row.caption ?? "", 480),
      access_token: META_TOKEN,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("threads error", res.status);
    throw new Error("Threads recusou a publicação.");
  }
  const pub = await fetch(`https://graph.threads.net/v1.0/${THREADS_USER_ID}/threads_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ creation_id: String(json.id), access_token: META_TOKEN }),
  });
  const pubJson = await pub.json().catch(() => ({}));
  if (!pub.ok) throw new Error("Threads recusou a publicação.");
  return String(pubJson.id ?? json.id);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const denied = await requireAdmin(req, { cronSecretKey: "automation_cron_secret" });
  if (denied) return denied;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const onlyId = typeof body?.id === "string" ? body.id : null;

    const query = onlyId
      ? admin.from("social_posts").select("*").eq("id", onlyId).limit(1)
      : admin.from("social_posts").select("*").eq("status", "agendado")
          .lte("scheduled_for", new Date().toISOString()).limit(10);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    if (!rows?.length) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!META_TOKEN) {
      await admin.from("social_posts")
        .update({ status: "aguardando_integracao", error_message: "Conecte as redes sociais em Admin → Integrações." })
        .in("id", rows.map((r) => r.id));
      return new Response(JSON.stringify({ ok: true, processed: 0, reason: "sem_integracao" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let published = 0;
    for (const row of rows) {
      await admin.from("social_posts").update({ status: "processando" }).eq("id", row.id);
      try {
        let externalId = "";
        if (row.channel === "instagram") externalId = await publishInstagram(row);
        else if (row.channel === "facebook") externalId = await publishFacebook(row);
        else if (row.channel === "threads") externalId = await publishThreads(row);
        else throw new Error("Canal não suportado");

        await admin.from("social_posts").update({
          status: "publicado", external_id: externalId, published_at: new Date().toISOString(), error_message: null,
        }).eq("id", row.id);
        published++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "erro";
        await admin.from("social_posts").update({ status: "erro", error_message: cap(msg, 300) }).eq("id", row.id);
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: published }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("publish-social error", e);
    return new Response(JSON.stringify({ error: "Falha ao processar a fila de publicações." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
