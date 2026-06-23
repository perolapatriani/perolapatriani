// touch deploy
// Qualifica um lead com Gemini: temperatura (quente/morno/frio), resumo
// e sugestão de resposta pronta pra Pérola enviar no WhatsApp.
// Admin-only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, requireAdmin } from "../_shared/auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY ausente");
    const { id } = await req.json();
    if (!id || typeof id !== "string") {
      return new Response(JSON.stringify({ error: "id obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: lead, error } = await admin
      .from("contact_leads")
      .select("id,name,phone,email,message,source,created_at")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!lead) return new Response(JSON.stringify({ error: "lead não encontrado" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const tools = [{
      type: "function",
      function: {
        name: "qualificar_lead",
        description: "Classifica o lead e gera resumo + resposta sugerida.",
        parameters: {
          type: "object",
          properties: {
            score: { type: "string", enum: ["quente", "morno", "frio"], description: "Temperatura comercial do lead." },
            summary: { type: "string", description: "Análise em 1-2 frases: o que o lead quer, urgência e oportunidade." },
            suggested_reply: { type: "string", description: "Resposta pronta pra Pérola mandar pelo WhatsApp em PT-BR. Elegante, calorosa, consultiva, sem clichês. Trata por 'você'. Sem emojis em excesso (no máximo 1). Até 400 caracteres." },
          },
          required: ["score", "summary", "suggested_reply"],
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
          { role: "system", content: "Você é assistente comercial sênior da Pérola Patriani, consultora imobiliária boutique de alto padrão na Baixada Santista. Avalia leads com critério: 'quente' = pronto pra agendar visita/comprar; 'morno' = interessado mas precisa nutrir; 'frio' = curiosidade ou fora do perfil. Use SEMPRE a ferramenta qualificar_lead." },
          { role: "user", content: `Lead recebido (origem: ${lead.source}):\n\nNome: ${lead.name}\nTelefone: ${lead.phone}\nE-mail: ${lead.email || "—"}\n\nMensagem:\n${lead.message}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "qualificar_lead" } },
      }),
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      console.error("Gemini qualify error", upstream.status, t);
      if (upstream.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`Gemini ${upstream.status}: ${t}`);
    }

    const json = await upstream.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments;
    if (!args) throw new Error("IA não retornou estrutura");
    const data = typeof args === "string" ? JSON.parse(args) : args;

    const { error: upErr } = await admin.from("contact_leads").update({
      ai_score: data.score,
      ai_summary: data.summary,
      ai_suggested_reply: data.suggested_reply,
      ai_qualified_at: new Date().toISOString(),
    }).eq("id", id);
    if (upErr) throw upErr;

    return new Response(JSON.stringify({ ok: true, ...data }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("qualify-lead error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
