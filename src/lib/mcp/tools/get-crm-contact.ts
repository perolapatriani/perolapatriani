import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_crm_contact",
  title: "Detalhes de contato CRM",
  description: "Retorna o contato e sua linha do tempo de eventos (formulários, notas, interações).",
  inputSchema: {
    contact_id: z.string().uuid().describe("ID do contato no CRM"),
    events_limit: z.number().int().min(1).max(100).default(30),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ contact_id, events_limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const [{ data: contact, error: cErr }, { data: events, error: eErr }] = await Promise.all([
      supabase.from("crm_contacts").select("*").eq("id", contact_id).maybeSingle(),
      supabase.from("crm_events").select("id,type,source,title,payload,created_at")
        .eq("contact_id", contact_id).order("created_at", { ascending: false }).limit(events_limit),
    ]);
    if (cErr) return { content: [{ type: "text", text: cErr.message }], isError: true };
    if (eErr) return { content: [{ type: "text", text: eErr.message }], isError: true };
    if (!contact) return { content: [{ type: "text", text: "Contato não encontrado" }], isError: true };
    const result = { contact, events: events ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
