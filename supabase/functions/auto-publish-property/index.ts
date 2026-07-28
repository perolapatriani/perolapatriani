// Motor de automação: imóvel/lançamento publicado -> artigo SEO no blog + posts sociais na fila.
// Admin-only (ou cron interno com X-Cron-Secret).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, requireAdmin, cap } from "../_shared/auth.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = "https://perolapatriani.lovable.app";
const WHATSAPP = "5513991234567";

function slugify(input: string): string {
  return String(input)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 90);
}

const articleTool = [{
  type: "function",
  function: {
    name: "gerar_artigo",
    description: "Artigo de blog otimizado para SEO sobre um imóvel.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "H1 do artigo, até 65 caracteres, com palavra-chave e bairro." },
        meta_description: { type: "string", description: "Meta description, 140-158 caracteres." },
        excerpt: { type: "string", description: "Resumo de 1-2 frases." },
        keywords: { type: "array", items: { type: "string" }, description: "6-10 palavras-chave." },
        content: {
          type: "string",
          description: "Artigo completo em markdown, 700-1100 palavras, com pelo menos 4 subtítulos ## (H2), parágrafos curtos, sem inventar dados que não foram informados.",
        },
        faq: {
          type: "array",
          description: "4 perguntas frequentes.",
          items: {
            type: "object",
            properties: { question: { type: "string" }, answer: { type: "string" } },
            required: ["question", "answer"], additionalProperties: false,
          },
        },
        instagram_caption: { type: "string", description: "Legenda de Instagram, 500-900 chars, storytelling elegante, com CTA para WhatsApp." },
        story_text: { type: "string", description: "Texto curto para Stories, até 120 caracteres." },
        hashtags: { type: "array", items: { type: "string" }, description: "10-15 hashtags sem o símbolo #." },
        alt_text: { type: "string", description: "ALT text descritivo da foto de capa, até 120 caracteres." },
      },
      required: ["title", "meta_description", "excerpt", "keywords", "content", "faq", "instagram_caption", "story_text", "hashtags", "alt_text"],
      additionalProperties: false,
    },
  },
}];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const denied = await requireAdmin(req, { cronSecretKey: "automation_cron_secret" });
  if (denied) return denied;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  let jobId: string | null = null;

  try {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY ausente");
    const body = await req.json().catch(() => ({}));
    const entityType = body?.entity_type === "launch" ? "launch" : "property";
    const entityId = cap(body?.entity_id, 64);
    const autoPublish = body?.auto_publish !== false;
    if (!entityId) {
      return new Response(JSON.stringify({ error: "entity_id obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const table = entityType === "launch" ? "launches" : "properties";
    const { data: entity, error: entErr } = await admin.from(table).select("*").eq("id", entityId).maybeSingle();
    if (entErr || !entity) throw new Error("Registro não encontrado");

    const { data: job } = await admin.from("automation_jobs").insert({
      job_type: "auto_publish", entity_type: entityType, entity_id: entityId, status: "processando",
    }).select("id").maybeSingle();
    jobId = job?.id ?? null;

    // já existe artigo para esse imóvel?
    const { data: existing } = await admin.from("posts").select("id, slug").eq("property_id", entityId).maybeSingle();

    const ctx = {
      titulo: entity.title ?? entity.name,
      tipo: entity.property_type ?? "lançamento",
      finalidade: entity.purpose,
      preco: entity.price,
      quartos: entity.bedrooms,
      suites: entity.suites,
      vagas: entity.parking,
      area_m2: entity.area_m2,
      bairro: entity.neighborhood_name ?? entity.location,
      descricao: cap(entity.description, 3000),
      diferenciais: entity.highlights,
      entrega: entity.delivery_date,
    };

    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Você é redatora sênior de uma consultoria imobiliária boutique de alto padrão na Baixada Santista (litoral de São Paulo). Escreve em PT-BR, tom editorial, elegante, sem clichês de corretor e sem exageros. Nunca invente números, valores ou características que não foram informados. Use SEMPRE a ferramenta gerar_artigo.",
          },
          { role: "user", content: `Dados do imóvel:\n${JSON.stringify(ctx, null, 2)}` },
        ],
        tools: articleTool,
        tool_choice: { type: "function", function: { name: "gerar_artigo" } },
      }),
    });

    if (!upstream.ok) {
      console.error("gemini error", upstream.status);
      if (upstream.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de uso da IA atingido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Falha ao gerar conteúdo com IA");
    }

    const json = await upstream.json();
    const rawArgs = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!rawArgs) throw new Error("IA não retornou conteúdo estruturado");
    const a = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;

    const baseSlug = slugify(a.title || ctx.titulo || "imovel");
    const slug = existing?.slug ?? `${baseSlug}-${String(entityId).slice(0, 6)}`;
    const cover = entity.cover_url ?? (Array.isArray(entity.photos) ? entity.photos[0] : null) ?? null;

    const postRow = {
      title: cap(a.title, 160),
      slug,
      excerpt: cap(a.excerpt, 400),
      meta_description: cap(a.meta_description, 200),
      keywords: Array.isArray(a.keywords) ? a.keywords.slice(0, 12).map((k: string) => cap(k, 60)) : [],
      faq: Array.isArray(a.faq) ? a.faq.slice(0, 6) : [],
      content: cap(a.content, 20000),
      cover_url: cover,
      author: "Pérola Patriani",
      property_id: entityType === "property" ? entityId : null,
      auto_generated: true,
      is_published: autoPublish,
      published_at: autoPublish ? new Date().toISOString() : null,
    };

    let postId = existing?.id ?? null;
    if (postId) {
      const { error } = await admin.from("posts").update(postRow).eq("id", postId);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await admin.from("posts").insert(postRow).select("id").maybeSingle();
      if (error) throw new Error(error.message);
      postId = data?.id ?? null;
    }

    // posts sociais na fila
    const link = entityType === "property" ? `${SITE_URL}/imoveis/${entity.slug}` : `${SITE_URL}/lancamentos/${entity.slug}`;
    const hashtags = (Array.isArray(a.hashtags) ? a.hashtags : []).slice(0, 15).map((h: string) => cap(h.replace(/^#/, ""), 40));
    const cta = `\n\nFale comigo no WhatsApp: https://wa.me/${WHATSAPP}\n${link}`;
    const caption = cap(a.instagram_caption, 1800) + cta;
    const location = cap(ctx.bairro ?? "Baixada Santista", 100);

    const socialRows = [
      { channel: "instagram", kind: "feed", caption, hashtags },
      { channel: "instagram", kind: "story", caption: cap(a.story_text, 200), hashtags: [] },
      { channel: "facebook", kind: "feed", caption, hashtags },
      { channel: "threads", kind: "feed", caption: cap(a.instagram_caption, 480) + `\n${link}`, hashtags: hashtags.slice(0, 5) },
    ].map((r) => ({
      ...r,
      status: "agendado",
      alt_text: cap(a.alt_text, 200),
      location_name: location,
      link_url: link,
      image_url: cover,
      property_id: entityType === "property" ? entityId : null,
      launch_id: entityType === "launch" ? entityId : null,
      post_id: postId,
      scheduled_for: new Date().toISOString(),
    }));

    // não duplicar fila para o mesmo imóvel se já houver pendências
    const { data: pending } = await admin
      .from("social_posts").select("id")
      .eq(entityType === "property" ? "property_id" : "launch_id", entityId)
      .in("status", ["agendado", "processando"]).limit(1);

    if (!pending || pending.length === 0) {
      const { error } = await admin.from("social_posts").insert(socialRows);
      if (error) console.error("social insert", error.message);
    }

    if (jobId) await admin.from("automation_jobs").update({ status: "concluido", result: { post_id: postId, slug } }).eq("id", jobId);

    return new Response(JSON.stringify({ ok: true, post_id: postId, slug, social_queued: !pending || pending.length === 0 }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("auto-publish-property error", e);
    const msg = e instanceof Error ? e.message : "erro";
    if (jobId) await admin.from("automation_jobs").update({ status: "erro", error_message: cap(msg, 400) }).eq("id", jobId);
    return new Response(JSON.stringify({ error: "Não foi possível concluir a automação." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
