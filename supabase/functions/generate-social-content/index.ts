// Gera roteiro de carrossel Instagram + roteiro TikTok/Reels para um imóvel. Admin-only.
import { corsHeaders, requireAdmin } from "../_shared/auth.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY ausente");
    const body = await req.json();
    const ctx = body?.property ?? {};
    if (!ctx?.title) {
      return new Response(JSON.stringify({ error: "Property context obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tools = [{
      type: "function",
      function: {
        name: "gerar_social",
        description: "Roteiros prontos pra publicar.",
        parameters: {
          type: "object",
          properties: {
            instagram_carousel: {
              type: "object",
              properties: {
                slides: {
                  type: "array",
                  description: "5-7 slides. Slide 1 = capa/hook. Último = CTA.",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Texto grande do slide (até 60 chars)." },
                      subtitle: { type: "string", description: "Linha de apoio (até 100 chars)." },
                    },
                    required: ["title", "subtitle"], additionalProperties: false,
                  },
                },
                caption: { type: "string", description: "Legenda completa do post, 600-900 chars, com quebras de linha, storytelling, CTA pra WhatsApp." },
                hashtags: { type: "array", items: { type: "string" }, description: "10-15 hashtags mistas (alto e médio volume), locais e de nicho." },
              },
              required: ["slides", "caption", "hashtags"], additionalProperties: false,
            },
            tiktok_script: {
              type: "object",
              properties: {
                hook: { type: "string", description: "Hook de 3-5 segundos pra prender o usuário (texto na tela)." },
                scenes: {
                  type: "array",
                  description: "5-7 cenas curtas (3-5s cada).",
                  items: {
                    type: "object",
                    properties: {
                      visual: { type: "string", description: "O que mostrar (ambiente, ângulo, movimento de câmera)." },
                      voiceover: { type: "string", description: "Narração curta em PT-BR (1 frase)." },
                      onscreen_text: { type: "string", description: "Texto na tela (opcional)." },
                    },
                    required: ["visual", "voiceover"], additionalProperties: false,
                  },
                },
                cta: { type: "string", description: "Chamada final pro WhatsApp." },
                suggested_audio: { type: "string", description: "Sugestão de áudio/trilha (gênero ou tipo)." },
              },
              required: ["hook", "scenes", "cta", "suggested_audio"], additionalProperties: false,
            },
          },
          required: ["instagram_carousel", "tiktok_script"],
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
          { role: "system", content: "Você é social media estrategista de uma consultoria imobiliária boutique de alto padrão na Baixada Santista. Cria conteúdo elegante, com storytelling, sem clichês de corretor, sem emojis em excesso (no máximo 2 por bloco). PT-BR. Use SEMPRE a ferramenta gerar_social." },
          { role: "user", content: `Imóvel:\n${JSON.stringify(ctx, null, 2)}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "gerar_social" } },
      }),
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      console.error("Gemini social error", upstream.status, t);
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
    console.error("generate-social-content error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
