import { Helmet } from "react-helmet-async";

interface SeoProps {
  title: string;
  description?: string;
  image?: string;
  path?: string;
  type?: string;
  publishedAt?: string | null;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

const DEFAULT_DESC =
  "Consultoria imobiliária no litoral paulista. Imóveis de alto padrão, lançamentos e atendimento consultivo com Pérola Patriani.";

export const SITE_URL = "https://perolapatriani.com.br";

export default function Seo({
  title,
  description = DEFAULT_DESC,
  image,
  path = "",
  type = "website",
  publishedAt,
  jsonLd,
  noindex,
}: SeoProps) {
  const fullTitle = title.includes("Pérola") ? title : `${title} · Pérola Patriani`;
  const url = `${SITE_URL}${path}`;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Pérola Patriani" />
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
      {publishedAt && <meta property="article:published_time" content={publishedAt} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(block)}</script>
      ))}
    </Helmet>
  );
}

/** Gera o JSON-LD de breadcrumbs a partir de uma trilha de páginas. */
export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}
