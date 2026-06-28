// Pérola IA Match — recebe respostas do quiz, recomenda 3 imóveis e salva lead.
// Usa Gemini API (gratuito).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

interface Answers {
  goal?: string;
  who?: string;
  type?: string;
  bedrooms?: string;
  budget?: string;
  vibe?: string;
  neighborhood?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY ausente");

    const raw = (await req.json()) as {
      name?: unknown; phone?: unknown; email?: unknown; answers?: Record<string, unknown>;
    };

    const name = String(raw.name ?? "").trim().slice(0, 200);
    const phone = String(raw.phone ?? "").trim().slice(0, 50);
    const email = raw.email ? String(raw.email).trim().slice(0, 254) : undefined;

    if (!name || !phone) {
      return new Response(JSON.stringify({ error: "Nome e telefone são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const capStr = (v: unknown, max = 100) => String(v ?? "").slice(0, max);
    const rawAnswers = (raw.answers ?? {}) as Record<string, unknown>;
    const answers: Answers = {
      goal: capStr(rawAnswers.goal),
      who: capStr(rawAnswers.who),
      type: capStr(rawAnswers.type),
      bedrooms: capStr(rawAnswers.bedrooms, 20),
      budget: capStr(rawAnswers.budget),
      vibe: capStr(rawAnswers.vibe),
      neighborhood: capStr(rawAnswers.neighborhood),
    };

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: props = [] } = await supabase
      .from("properties")
      .select("id,code,slug,title,property_type,neighborhood_name,price,bedrooms,suites,parking,area_m2,description")
      .eq("status", "ativo")
      .limit(60);

    const catalog = (props ?? []).map((p) => ({
      id: p.id,
      code: p.code,
      slug: p.slug,
      title: p.title,
      tipo: p.property_type,
      bairro: p.neighborhood_name,
      preco: p.price,
      dormitorios: p.bedrooms,
      suites: p.suites,
      vagas: p.parking,
      area_m2: p.area_m2,
      resumo: (p.description ?? "").slice(0, 240),
    }));

    const prompt = `Você é a Pérola IA, consultora imobiliária do litoral paulista. Com base no perfil do cliente, escolha os 3 imóveis MAIS ADEQUADOS do catálogo (somente IDs do catálogo, nunca invente).

PERFIL DO CLIENTE:
- Objetivo: ${answers.goal ?? "não informado"}
- Perfil: ${answers.who ?? "não informado"}
- Tipo preferido: ${answers.type ?? "indiferente"}
- Dormitórios: ${answers.bedrooms ?? "indiferente"}
- Orçamento: ${answers.budget ?? "não informado"}
- Estilo: ${answers.vibe ?? "não informado"}
- Bairro de interesse: ${answers.neighborhood ?? "indiferente"}

CATÁLOGO (${catalog.length} imóveis):
${JSON.stringify(catalog)}

Responda APENAS com JSON válido neste formato exato (sem markdown, sem cercas de código):
{
  "reasoning": "explicação curta e elegante (2-3 frases) de por que esses imóveis combinam com o perfil",
  "property_ids": ["uuid1", "uuid2", "uuid3"]
}`;

    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      console.error("Gemini match error", upstream.status, t);
      if (upstream.status === 429) return new Response(JSON.stringify({ error: "Muitas requisições" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Serviço temporariamente indisponível." }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const json = await upstream.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { reasoning?: string; property_ids?: string[] } = {};
    try {
      // Strip code fences if model adds them
      const cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch { parsed = {}; }

    const validIds = (parsed.property_ids ?? []).filter((id) =>
      catalog.some((p) => p.id === id),
    ).slice(0, 3);

    const reasoning = parsed.reasoning ?? "Selecionei imóveis que combinam com o seu perfil.";

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await admin.from("match_leads").insert({
      name,
      phone,
      email: email || null,
      answers,
      recommended_property_ids: validIds,
      ai_reasoning: reasoning,
    });

    admin.functions.invoke("notify-lead", {
      body: {
        name,
        phone,
        email: email || "",
        message: `Match IA\n\nRespostas: ${JSON.stringify(answers, null, 2)}\n\nIA: ${reasoning}`,
        source: "match_ia",
      },
    }).catch((err) => console.error("notify-lead failed", err));

    return new Response(
      JSON.stringify({ property_ids: validIds, reasoning }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("perola-match error", e);
    return new Response(JSON.stringify({ error: "Serviço temporariamente indisponível." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
