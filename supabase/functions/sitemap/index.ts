// Sitemap XML dinâmico — inclui páginas fixas, imóveis, lançamentos, bairros e artigos publicados.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = "https://perolapatriani.lovable.app";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function url(path: string, lastmod?: string | null, changefreq = "weekly", priority = "0.7") {
  return [
    "  <url>",
    `    <loc>${esc(SITE_URL + path)}</loc>`,
    lastmod ? `    <lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].filter(Boolean).join("\n");
}

Deno.serve(async () => {
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const [props, launches, hoods, posts] = await Promise.all([
    admin.from("properties").select("slug, updated_at").eq("status", "ativo"),
    admin.from("launches").select("slug, updated_at").eq("status", "ativo"),
    admin.from("neighborhoods").select("slug, updated_at"),
    admin.from("posts").select("slug, updated_at").eq("is_published", true),
  ]);

  const parts = [
    url("/", null, "daily", "1.0"),
    url("/imoveis", null, "daily", "0.9"),
    url("/lancamentos", null, "weekly", "0.8"),
    url("/bairros", null, "monthly", "0.6"),
    url("/blog", null, "daily", "0.8"),
    url("/sobre", null, "monthly", "0.5"),
    url("/contato", null, "monthly", "0.5"),
    url("/vender", null, "monthly", "0.7"),
    url("/match", null, "monthly", "0.6"),
    ...(props.data ?? []).map((p) => url(`/imoveis/${p.slug}`, p.updated_at, "weekly", "0.8")),
    ...(launches.data ?? []).map((p) => url(`/lancamentos/${p.slug}`, p.updated_at, "weekly", "0.7")),
    ...(hoods.data ?? []).map((p) => url(`/bairros/${p.slug}`, p.updated_at, "monthly", "0.6")),
    ...(posts.data ?? []).map((p) => url(`/blog/${p.slug}`, p.updated_at, "weekly", "0.7")),
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...parts,
    "</urlset>",
  ].join("\n");

  return new Response(xml, {
    status: 200,
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=1800", "Access-Control-Allow-Origin": "*" },
  });
});
