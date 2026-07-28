// Coleta métricas (alcance, curtidas, comentários) dos posts publicados no Instagram/Facebook.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, requireAdmin } from "../_shared/auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const META_TOKEN = Deno.env.get("META_ACCESS_TOKEN") ?? "";
const GRAPH = "https://graph.facebook.com/v21.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const denied = await requireAdmin(req, { cronSecretKey: "automation_cron_secret" });
  if (denied) return denied;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    if (!META_TOKEN) {
      return new Response(JSON.stringify({ ok: true, updated: 0, reason: "sem_integracao" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { data: rows } = await admin.from("social_posts")
      .select("id, channel, external_id")
      .eq("status", "publicado").not("external_id", "is", null)
      .gte("published_at", since).limit(50);

    let updated = 0;
    for (const row of rows ?? []) {
      try {
        if (row.channel === "instagram") {
          const res = await fetch(`${GRAPH}/${row.external_id}?fields=like_count,comments_count&access_token=${META_TOKEN}`);
          if (!res.ok) continue;
          const j = await res.json();
          const ins = await fetch(`${GRAPH}/${row.external_id}/insights?metric=reach&access_token=${META_TOKEN}`);
          const insJson = ins.ok ? await ins.json() : null;
          const reach = insJson?.data?.[0]?.values?.[0]?.value ?? 0;
          await admin.from("social_posts").update({
            likes: j.like_count ?? 0, comments: j.comments_count ?? 0, reach,
            metrics_updated_at: new Date().toISOString(),
          }).eq("id", row.id);
          updated++;
        } else if (row.channel === "facebook") {
          const res = await fetch(`${GRAPH}/${row.external_id}?fields=likes.summary(true),comments.summary(true)&access_token=${META_TOKEN}`);
          if (!res.ok) continue;
          const j = await res.json();
          await admin.from("social_posts").update({
            likes: j.likes?.summary?.total_count ?? 0,
            comments: j.comments?.summary?.total_count ?? 0,
            metrics_updated_at: new Date().toISOString(),
          }).eq("id", row.id);
          updated++;
        }
      } catch (e) {
        console.error("metrics row error", row.id, e instanceof Error ? e.message : e);
      }
    }

    return new Response(JSON.stringify({ ok: true, updated }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("collect-social-metrics error", e);
    return new Response(JSON.stringify({ error: "Falha ao coletar métricas." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
