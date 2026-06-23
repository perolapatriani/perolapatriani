// Traduz título + descrição de um imóvel para EN e ES usando Gemini. Admin-only.
import { corsHeaders, requireAdmin } from "../_shared/auth.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY ausente");
    const body = await req.json();
    const title = String(body?.title ?? "").slice(0, 200).trim();
    const description = String(body?.description ?? "").slice(0, 4000).trim();
    if (!title && !description) {
      return new Response(JSON.stringify({ error: "Forneça título ou descrição" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tools = [{
      type: "function",
      function: {
        name: "traduzir",
        description: "Traduz para EN e ES preservando tom boutique.",
        parameters: {
          type: "object",
          properties: {
            en: {
              type: "object",
              properties: { title: { type: "string" }, description: { type: "string" } },
              required: ["title", "description"], additionalProperties: false,
            },
            es: {
              type: "object",
              properties: { title: { type: "string" }, description: { type: "string" } },
              required: ["title", "description"], additionalProperties: false,
            },
          },
          required: ["en", "es"],
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
          { role: "system", content: "Você é tradutor sênior especializado em real estate de luxo. Traduza preservando elegância e fluência natural (não literal). Inglês americano. Espanhol neutro. Use SEMPRE a ferramenta traduzir." },
          { role: "user", content: `Título: ${title}\n\nDescrição:\n${description}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "traduzir" } },
      }),
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      console.error("Gemini translate error", upstream.status, t);
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
    console.error("translate-property error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
