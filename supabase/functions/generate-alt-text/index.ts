// Gera alt text descritivo para fotos de imóvel usando Gemini multimodal. Admin-only.
import { corsHeaders, requireAdmin } from "../_shared/auth.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY ausente");
    const body = await req.json();
    const urls: string[] = Array.isArray(body?.urls) ? body.urls.slice(0, 12) : [];
    const context = String(body?.context ?? "").slice(0, 300);
    if (urls.length === 0) {
      return new Response(JSON.stringify({ error: "Forneça pelo menos 1 URL de imagem" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content: any[] = [
      { type: "text", text: `Gere um alt text descritivo, conciso (até 120 caracteres) e em PT-BR para cada imagem abaixo, na MESMA ordem. Foco em acessibilidade e SEO: o que se vê, ambiente, iluminação, diferencial visível. Sem clichês ("foto de"). Contexto do imóvel: ${context || "(sem contexto)"}\n\nResponda APENAS JSON: {"alts":["...","..."]}` },
      ...urls.map((u) => ({ type: "image_url", image_url: { url: u } })),
    ];

    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você gera alt text em PT-BR para fotos de imóveis. Responda SEMPRE em JSON válido." },
          { role: "user", content },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      console.error("Gemini alt error", upstream.status, t);
      if (upstream.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`Gemini ${upstream.status}: ${t}`);
    }

    const json = await upstream.json();
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const alts: string[] = Array.isArray(parsed?.alts) ? parsed.alts.map((s: unknown) => String(s).slice(0, 160)) : [];

    return new Response(JSON.stringify({ ok: true, alts }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-alt-text error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
