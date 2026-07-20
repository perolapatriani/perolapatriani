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
  name: "add_crm_note",
  title: "Adicionar nota ao CRM",
  description: "Registra uma nota interna na linha do tempo de um contato do CRM.",
  inputSchema: {
    contact_id: z.string().uuid(),
    note: z.string().min(1).max(2000).describe("Conteúdo da nota"),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ contact_id, note }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("crm_events")
      .insert({
        contact_id,
        type: "note",
        source: "mcp",
        title: "Nota (via assistente)",
        payload: { note },
      })
      .select()
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: "Nota registrada." }],
      structuredContent: { event: data },
    };
  },
});
