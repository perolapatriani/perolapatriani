// Pérola IA — chat assistente do site. Streaming via Lovable AI Gateway.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY ausente");

    const { messages: rawMessages }: { messages: ChatMsg[] } = await req.json();
    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return new Response(JSON.stringify({ error: "messages obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MAX_MESSAGES = 20;
    const MAX_MSG_LEN = 2000;
    if (rawMessages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: "Conversa muito longa. Recarregue o chat." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const messages: ChatMsg[] = rawMessages
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MSG_LEN) }));
    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Carrega catálogo público para contextualizar a IA
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const [{ data: props = [] }, { data: launches = [] }, { data: neighborhoods = [] }] =
      await Promise.all([
        supabase
          .from("properties")
          .select("code,slug,title,property_type,neighborhood_name,price,bedrooms,suites,parking,area_m2,description")
          .eq("status", "ativo")
          .limit(40),
        supabase.from("launches").select("name,slug,location,differentials,delivery_date").eq("status", "ativo").limit(15),
        supabase.from("neighborhoods").select("name,slug,description").limit(20),
      ]);

    const catalog = {
      properties: (props ?? []).map((p) => ({
        code: p.code,
        url: `/imoveis/${p.slug}`,
        title: p.title,
        tipo: p.property_type,
        bairro: p.neighborhood_name,
        preco: p.price,
        dormitorios: p.bedrooms,
        suites: p.suites,
        vagas: p.parking,
        area_m2: p.area_m2,
      })),
      launches: (launches ?? []).map((l) => ({ name: l.name, url: `/lancamentos/${l.slug}`, location: l.location })),
      neighborhoods: (neighborhoods ?? []).map((n) => ({ name: n.name, url: `/bairros/${n.slug}` })),
    };

    const system = `Você é a Pérola IA, assistente virtual do site da consultora imobiliária Pérola Patriani, no litoral paulista (Santos, Guarujá, Itanhaém, Mongaguá, Praia Grande, Peruíbe).

PERSONALIDADE: elegante, calorosa, consultiva, direta. Fala em português brasileiro. Trata com gentileza ("você"). Evita jargão. Tom premium, nunca insistente.

OBJETIVO: ajudar o visitante a entender o portfólio, sugerir imóveis pertinentes do catálogo abaixo, esclarecer dúvidas sobre bairros/lançamentos e incentivar contato direto com a Pérola via WhatsApp (13) 99129-6030.

REGRAS:
- Só recomende imóveis que estão no CATÁLOGO abaixo. Nunca invente.
- Ao sugerir imóveis, cite o código + bairro + preço e inclua o link relativo (ex: /imoveis/slug) em markdown.
- Se o visitante perguntar algo fora do catálogo (preço de outro imóvel, disponibilidade, visita), oriente a falar com a Pérola no WhatsApp.
- Se ele demonstrar real interesse, sugira: "Quer que eu te conecte direto com a Pérola? Clique aqui: https://wa.me/5513991296030"
- Respostas curtas (até 4 parágrafos). Use markdown leve.

CATÁLOGO ATUAL:
${JSON.stringify(catalog, null, 2)}`;

    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        stream: true,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      console.error("Gemini upstream error", upstream.status, t);
      if (upstream.status === 429)
        return new Response(JSON.stringify({ error: "Muitas requisições, tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (upstream.status === 402)
        return new Response(JSON.stringify({ error: "Serviço temporariamente indisponível." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      return new Response(JSON.stringify({ error: "Serviço temporariamente indisponível." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("perola-chat error", e);
    return new Response(JSON.stringify({ error: "Serviço temporariamente indisponível." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
