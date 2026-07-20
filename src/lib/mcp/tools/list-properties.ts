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
  name: "list_properties",
  title: "Listar imóveis",
  description: "Lista imóveis publicados no site (título, bairro, quartos, preço, slug).",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(20).describe("Quantos imóveis retornar"),
    neighborhood: z.string().optional().describe("Filtrar por bairro (contém)"),
    min_bedrooms: z.number().int().optional().describe("Mínimo de quartos"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, neighborhood, min_bedrooms }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    let query = supabaseForUser(ctx)
      .from("properties")
      .select("id,title,slug,neighborhood,bedrooms,bathrooms,parking,area_useful,price_sale,is_published")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (neighborhood) query = query.ilike("neighborhood", `%${neighborhood}%`);
    if (typeof min_bedrooms === "number") query = query.gte("bedrooms", min_bedrooms);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { properties: data ?? [] },
    };
  },
});
