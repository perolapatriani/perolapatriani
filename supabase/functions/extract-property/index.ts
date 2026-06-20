// Extrai dados estruturados de imóvel a partir de texto bruto colado pela admin.
import { corsHeaders, requireAdmin } from "../_shared/auth.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Admin only — drains AI credits.
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ausente");
    const { text } = (await req.json()) as { text?: string };
    if (!text || text.trim().length < 20) {
      return new Response(JSON.stringify({ error: "Cole um texto com mais detalhes do imóvel." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tools = [{
      type: "function",
      function: {
        name: "preencher_imovel",
        description: "Preenche os campos do formulário de cadastro de imóvel a partir do texto fornecido.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Título atraente e curto (máx 80 chars). Ex: 'Apartamento 3 dormitórios em Cibratel II'." },
            description: { type: "string", description: "Descrição de venda em português, elegante e persuasiva (2-4 parágrafos curtos), destacando diferenciais. NÃO inclua preço." },
            property_type: { type: "string", enum: ["Apartamento", "Casa", "Cobertura", "Terreno", "Comercial", "Sobrado"] },
            purpose: { type: "string", enum: ["venda", "locacao"] },
            price: { type: ["number", "null"], description: "Valor de venda ou locação em reais (apenas o número)." },
            condo_fee: { type: ["number", "null"], description: "Valor do condomínio mensal, se mencionado." },
            bedrooms: { type: ["integer", "null"] },
            suites: { type: ["integer", "null"] },
            bathrooms: { type: ["integer", "null"] },
            parking: { type: ["integer", "null"] },
            area_m2: { type: ["number", "null"], description: "Área útil/privativa em m²." },
            neighborhood_name: { type: ["string", "null"] },
            code: { type: ["string", "null"], description: "Código/referência do imóvel se houver." },
          },
          required: ["title", "description", "property_type", "purpose"],
          additionalProperties: false,
        },
      },
    }];

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é especialista em extrair dados de anúncios imobiliários e reescrever descrições de venda em tom boutique, elegante e em português brasileiro. Use SEMPRE a ferramenta preencher_imovel para responder. Quando uma informação não estiver clara no texto, retorne null para campos numéricos e omita o que não tiver certeza." },
          { role: "user", content: `Texto bruto do anúncio:\n\n${text}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "preencher_imovel" } },
      }),
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      if (upstream.status === 429) return new Response(JSON.stringify({ error: "Muitas requisições, aguarde alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (upstream.status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`Gateway ${upstream.status}: ${t}`);
    }

    const json = await upstream.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments;
    if (!args) throw new Error("IA não retornou dados estruturados.");
    const data = typeof args === "string" ? JSON.parse(args) : args;

    return new Response(JSON.stringify({ data }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-property error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
