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
  name: "list_crm_contacts",
  title: "Listar contatos do CRM",
  description: "Lista contatos do CRM (requer permissão de admin). Filtra por busca, origem ou status.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).default(25),
    search: z.string().optional().describe("Busca por nome, telefone ou e-mail"),
    status: z.string().optional().describe("Filtrar por status"),
    source: z.string().optional().describe("Filtrar por origem (source_last)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, search, status, source }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    let query = supabaseForUser(ctx)
      .from("crm_contacts")
      .select("id,name,raw_phone,raw_email,status,source_first,source_last,ai_score,last_interaction_at,created_at")
      .order("last_interaction_at", { ascending: false })
      .limit(limit);
    if (search) {
      const s = search.replace(/[%,()]/g, "");
      query = query.or(`name.ilike.%${s}%,raw_phone.ilike.%${s}%,raw_email.ilike.%${s}%`);
    }
    if (status) query = query.eq("status", status);
    if (source) query = query.eq("source_last", source);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { contacts: data ?? [] },
    };
  },
});
