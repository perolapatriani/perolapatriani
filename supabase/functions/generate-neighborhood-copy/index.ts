// Gera descrição rica de bairro com Gemini. Admin-only.
import { corsHeaders, requireAdmin } from "../_shared/auth.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY ausente");
    const body = await req.json();
    const name = String(body?.name ?? "").slice(0, 120).trim();
    const notes = String(body?.notes ?? "").slice(0, 2000).trim();
    if (!name) {
      return new Response(JSON.stringify({ error: "Nome do bairro obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tools = [{
      type: "function",
      function: {
        name: "gerar_bairro",
        description: "Gera descrição rica de bairro.",
        parameters: {
          type: "object",
          properties: {
            description: { type: "string", description: "Descrição rica em 2-3 parágrafos (300-500 chars), com perfil do bairro, vibe, quem mora, vida cotidiana, principais atrativos. Tom boutique elegante, PT-BR, sem clichês. Sem emojis." },
            highlights: { type: "array", items: { type: "string" }, description: "3-5 destaques curtos (até 60 chars cada). Ex: 'Praia preservada de Cibratel', 'Acesso direto à Rio-Santos'." },
            seo_meta: { type: "string", description: "Meta description SEO (até 160 chars) para a página do bairro." },
          },
          required: ["description", "highlights", "seo_meta"],
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
          { role: "system", content: "Você é redator chefe de uma consultoria imobiliária boutique de alto padrão na Baixada Santista (Itanhaém, Peruíbe, Mongaguá, Praia Grande, Santos, Guarujá). Conhece a fundo cada bairro da região. Escreva em PT-BR elegante e contemporâneo. Use SEMPRE a ferramenta gerar_bairro." },
          { role: "user", content: `Bairro: ${name}\n\nNotas adicionais:\n${notes || "(sem notas)"}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "gerar_bairro" } },
      }),
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      console.error("Gemini neighborhood error", upstream.status, t);
      if (upstream.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`Gemini ${upstream.status}: ${t}`);
    }

    const json = await upstream.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("IA não retornou estrutura");
    const data = typeof args === "string" ? JSON.parse(args) : args;

    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-neighborhood-copy error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
