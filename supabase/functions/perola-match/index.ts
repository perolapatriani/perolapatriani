// Pérola IA Match — recebe respostas do quiz, recomenda 3 imóveis e salva lead.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

interface Answers {
  goal?: string;        // moradia / investimento / segunda moradia / locacao
  who?: string;         // solo / casal / familia / aposentado
  type?: string;        // apartamento / casa / cobertura / indiferente
  bedrooms?: string;    // 1 / 2 / 3 / 4+
  budget?: string;      // até 500k / 500k-1M / 1M-2M / 2M+
  vibe?: string;        // praia / centro / sossego / vista
  neighborhood?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ausente");

    const { name, phone, email, answers } = (await req.json()) as {
      name: string; phone: string; email?: string; answers: Answers;
    };

    if (!name?.trim() || !phone?.trim()) {
      return new Response(JSON.stringify({ error: "Nome e telefone são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

Responda APENAS com JSON válido neste formato exato:
{
  "reasoning": "explicação curta e elegante (2-3 frases) de por que esses imóveis combinam com o perfil",
  "property_ids": ["uuid1", "uuid2", "uuid3"]
}`;

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      if (upstream.status === 429) return new Response(JSON.stringify({ error: "Muitas requisições" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (upstream.status === 402) return new Response(JSON.stringify({ error: "Créditos esgotados" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`Gateway ${upstream.status}: ${t}`);
    }

    const json = await upstream.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { reasoning?: string; property_ids?: string[] } = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }

    const validIds = (parsed.property_ids ?? []).filter((id) =>
      catalog.some((p) => p.id === id),
    ).slice(0, 3);

    const reasoning = parsed.reasoning ?? "Selecionei imóveis que combinam com o seu perfil.";

    // Salva lead usando service role (bypass RLS) para evitar problemas com chamadas anônimas
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await admin.from("match_leads").insert({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || null,
      answers,
      recommended_property_ids: validIds,
      ai_reasoning: reasoning,
    });

    // Notifica por e-mail (não bloqueia resposta)
    admin.functions.invoke("notify-lead", {
      body: {
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || "",
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
