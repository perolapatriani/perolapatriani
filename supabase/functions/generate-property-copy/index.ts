// Gera título + descrição premium de um imóvel a partir de bullet points,
// usando Gemini. Admin-only.
import { corsHeaders, requireAdmin } from "../_shared/auth.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY ausente");
    const body = await req.json();
    const bullets: string = String(body?.bullets ?? "").slice(0, 4000).trim();
    const context: Record<string, unknown> = body?.context ?? {};
    if (bullets.length < 10) {
      return new Response(JSON.stringify({ error: "Forneça mais informações sobre o imóvel" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tools = [{
      type: "function",
      function: {
        name: "gerar_copy",
        description: "Gera título de venda + descrição premium do imóvel.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Título curto e atraente (até 80 chars). Ex: 'Cobertura duplex pé na areia em Cibratel II'." },
            description: { type: "string", description: "Descrição em 3-4 parágrafos curtos (300-600 chars no total), tom boutique, sem clichês de corretor, destacando diferenciais. Sem emojis. Em PT-BR." },
            seo_meta: { type: "string", description: "Meta description SEO (até 160 chars), atraente para buscadores." },
          },
          required: ["title", "description", "seo_meta"],
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
          { role: "system", content: "Você é redator chefe de uma consultoria imobiliária boutique de alto padrão na Baixada Santista (Itanhaém, Peruíbe, Mongaguá, Praia Grande, Santos, Guarujá). Escreva sempre em português brasileiro elegante. Use SEMPRE a ferramenta gerar_copy." },
          { role: "user", content: `Contexto do imóvel:\n${JSON.stringify(context)}\n\nInformações brutas:\n${bullets}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "gerar_copy" } },
      }),
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      console.error("Gemini copy error", upstream.status, t);
      if (upstream.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`Gemini ${upstream.status}: ${t}`);
    }

    const json = await upstream.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments;
    if (!args) throw new Error("IA não retornou estrutura");
    const data = typeof args === "string" ? JSON.parse(args) : args;

    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-property-copy error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
