// Gera um rascunho de post de blog com IA — agendado semanalmente.
// Temas: mercado de alto padrão na Baixada Santista (Itanhaém, Peruíbe, Mongaguá, Praia Grande, Santos, Guarujá),
// lifestyle/bairros, dicas de compra/venda/investimento e lançamentos do portfólio.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, requireAdmin } from "../_shared/auth.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const TEMAS = [
  "Mercado imobiliário de alto padrão na Baixada Santista — tendências e valorização",
  "Guia de bairros nobres de Itanhaém (Cibratel, Suarão, Jardim Imperador) para morar bem",
  "Por que investir em imóveis de praia entre Itanhaém, Peruíbe e Mongaguá",
  "Dicas para vender seu imóvel de alto padrão na Baixada Santista com agilidade",
  "Financiamento e ITBI: o passo a passo para comprar imóvel litorâneo em SP",
  "Casa pé na areia vs. cobertura: qual investimento valoriza mais no litoral sul de SP",
  "Lifestyle litorâneo — gastronomia, esportes náuticos e rotina premium em Itanhaém",
  "Como avaliar um lançamento imobiliário na Baixada Santista antes de comprar",
  "Decoração e home staging para valorizar imóveis de praia",
  "Locação por temporada premium — rentabilidade e cuidados no litoral sul",
];

function pickTema(seed: number) {
  return TEMAS[seed % TEMAS.length];
}

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Admin via session, or pg_cron via X-Cron-Secret.
  const denied = await requireAdmin(req, { cronSecretKey: "weekly_post_cron" });
  if (denied) return denied;

  try {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY ausente");
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    let body: any = {};
    try { body = await req.json(); } catch { /* ok */ }
    const tema: string = body?.tema || pickTema(Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7)));

    const tools = [{
      type: "function",
      function: {
        name: "criar_post",
        description: "Cria um post de blog completo em português brasileiro, tom boutique, sobre o tema indicado.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Título atraente, máx 70 caracteres." },
            excerpt: { type: "string", description: "Resumo elegante de 1 a 2 frases (máx 220 chars)." },
            content: { type: "string", description: "Conteúdo em markdown, 5–8 parágrafos, com subtítulos ## quando fizer sentido. Tom sofisticado, especialista em mercado de alto padrão na Baixada Santista (especialmente Itanhaém). Sem emojis." },
            ig_caption: { type: "string", description: "Legenda para Instagram (até 300 chars) + 6 hashtags relevantes." },
            tiktok_hook: { type: "string", description: "Hook curto de 1 frase para abrir vídeo no TikTok (até 90 chars)." },
            tiktok_body: { type: "string", description: "Trecho/conteúdo central do slide 2 do TikTok (até 180 chars)." },
            tiktok_cta: { type: "string", description: "Chamada para ação do slide 3 do TikTok (até 90 chars)." },
          },
          required: ["title", "excerpt", "content", "ig_caption", "tiktok_hook", "tiktok_body", "tiktok_cta"],
          additionalProperties: false,
        },
      },
    }];

    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é redator chefe de uma consultoria imobiliária boutique de alto padrão na Baixada Santista (Itanhaém, Peruíbe, Mongaguá, Praia Grande, Santos, Guarujá). Escreva sempre em português brasileiro elegante, sem clichês de corretor, com autoridade técnica e visão de mercado. NUNCA use emojis. Use SEMPRE a ferramenta criar_post." },
          { role: "user", content: `Escreva o post da semana sobre: "${tema}". Foque na realidade da Baixada Santista — especialmente Itanhaém. Inclua dados práticos, exemplos concretos de bairros/imóveis quando fizer sentido, e finalize com convite sutil a conhecer o portfólio Pérola Patriani.` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "criar_post" } },
      }),
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      console.error("generate-weekly-post upstream", upstream.status, t);
      if (upstream.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (upstream.status === 402) return new Response(JSON.stringify({ error: "Créditos esgotados" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("upstream_failed");
    }

    const json = await upstream.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments;
    if (!args) throw new Error("IA não retornou estrutura");
    const data = typeof args === "string" ? JSON.parse(args) : args;

    const baseSlug = slugify(data.title);
    let slug = baseSlug;
    const { data: existing } = await supabase.from("posts").select("id").eq("slug", slug).maybeSingle();
    if (existing) slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;

    const payload = {
      title: String(data.title).slice(0, 200),
      slug,
      excerpt: String(data.excerpt).slice(0, 300),
      content: String(data.content),
      author: "Pérola Patriani",
      is_published: false, // rascunho — admin revisa
      published_at: null,
      cover_url: null,
      // metadados pros cards (armazenados no início do content como bloco HTML comentado pra não poluir)
    };

    const meta = `<!--social\n${JSON.stringify({
      ig_caption: data.ig_caption,
      tiktok_hook: data.tiktok_hook,
      tiktok_body: data.tiktok_body,
      tiktok_cta: data.tiktok_cta,
      tema,
    })}\n-->`;

    const { data: inserted, error } = await supabase.from("posts").insert({
      ...payload,
      content: `${meta}\n\n${payload.content}`,
    }).select().single();
    if (error) throw error;

    // notifica admin
    supabase.functions.invoke("notify-lead", {
      body: {
        name: "Sistema",
        phone: "-",
        email: "perolapatriani@gmail.com",
        message: `Novo rascunho de blog gerado pela IA: "${data.title}". Revise no painel /admin/blog antes de publicar.`,
        source: "blog_semanal",
      },
    }).catch(() => {});

    return new Response(JSON.stringify({ ok: true, post: inserted, tema }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-weekly-post", e);
    return new Response(JSON.stringify({ error: "Não foi possível gerar o post agora." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
