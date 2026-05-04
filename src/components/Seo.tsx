import { Helmet } from "react-helmet-async";

interface SeoProps {
  title: string;
  description?: string;
  image?: string;
  path?: string;
}

const DEFAULT_DESC =
  "Consultoria imobiliária no litoral paulista. Imóveis de alto padrão, lançamentos e atendimento consultivo com Pérola Patriani.";

export default function Seo({ title, description = DEFAULT_DESC, image, path = "" }: SeoProps) {
  const fullTitle = title.includes("Pérola") ? title : `${title} · Pérola Patriani`;
  const url = `https://perolapatriani.com.br${path}`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
}
