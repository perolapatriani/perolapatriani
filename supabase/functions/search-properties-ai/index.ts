// Busca em linguagem natural — Gemini converte texto livre em filtros
// estruturados, e retornamos os imóveis que batem. Público.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY ausente");
    const { query } = await req.json();
    const q = String(query ?? "").slice(0, 400).trim();
    if (q.length < 3) {
      return new Response(JSON.stringify({ error: "Consulta muito curta" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tools = [{
      type: "function",
      function: {
        name: "filtrar",
        description: "Converte busca em filtros estruturados.",
        parameters: {
          type: "object",
          properties: {
            property_type: { type: "string", enum: ["Apartamento", "Casa", "Cobertura", "Terreno", "Comercial", "Sobrado", ""], description: "Tipo, ou vazio." },
            neighborhood_keyword: { type: "string", description: "Palavra-chave do bairro (ex: 'cibratel', 'centro'), ou vazio." },
            min_bedrooms: { type: "integer", minimum: 0, maximum: 10, description: "Mínimo de dormitórios, 0 se indiferente." },
            min_suites: { type: "integer", minimum: 0, maximum: 10, description: "Mínimo de suítes, 0 se indiferente." },
            min_parking: { type: "integer", minimum: 0, maximum: 10, description: "Mínimo de vagas, 0 se indiferente." },
            max_price: { type: "integer", description: "Preço máximo em reais, 0 se sem limite." },
            min_price: { type: "integer", description: "Preço mínimo em reais, 0 se sem mínimo." },
            keywords: { type: "string", description: "Palavras-chave adicionais (ex: 'vista mar', 'piscina', 'pé na areia') ou vazio." },
            interpretation: { type: "string", description: "Frase curta em PT-BR resumindo o que entendeu da busca." },
          },
          required: ["property_type", "neighborhood_keyword", "min_bedrooms", "min_suites", "min_parking", "max_price", "min_price", "keywords", "interpretation"],
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
          { role: "system", content: "Você converte buscas em linguagem natural sobre imóveis do litoral paulista em filtros. Use SEMPRE a ferramenta filtrar. Quando o usuário fala em valores como '1.5M' = 1500000, '800k' = 800000." },
          { role: "user", content: q },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "filtrar" } },
      }),
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      console.error("Gemini search error", upstream.status, t);
      if (upstream.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("upstream_failed");
    }

    const json = await upstream.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments;
    if (!args) throw new Error("IA não retornou estrutura");
    const f = typeof args === "string" ? JSON.parse(args) : args;

    // Aplica filtros no banco
    const supabase = createClient(SUPABASE_URL, ANON_KEY);
    let qb = supabase.from("properties").select("id,slug,title,code,property_type,neighborhood_name,price,bedrooms,suites,parking,area_m2,cover_url,description,is_featured,is_new")
      .eq("status", "ativo");
    if (f.property_type) qb = qb.eq("property_type", f.property_type);
    if (f.neighborhood_keyword) qb = qb.ilike("neighborhood_name", `%${f.neighborhood_keyword}%`);
    if (f.min_bedrooms > 0) qb = qb.gte("bedrooms", f.min_bedrooms);
    if (f.min_suites > 0) qb = qb.gte("suites", f.min_suites);
    if (f.min_parking > 0) qb = qb.gte("parking", f.min_parking);
    if (f.min_price > 0) qb = qb.gte("price", f.min_price);
    if (f.max_price > 0) qb = qb.lte("price", f.max_price);
    if (f.keywords) {
      const kws = f.keywords.split(/[, ]+/).filter(Boolean).slice(0, 3);
      for (const kw of kws) qb = qb.ilike("description", `%${kw}%`);
    }

    const { data: properties = [], error } = await qb.limit(24);
    if (error) throw error;

    return new Response(JSON.stringify({
      interpretation: f.interpretation,
      filters: f,
      properties,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-properties-ai error", e);
    return new Response(JSON.stringify({ error: "Não foi possível processar sua busca agora." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
