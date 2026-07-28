import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Seo, { breadcrumbLd, SITE_URL } from "@/components/Seo";
import Breadcrumbs from "@/components/Breadcrumbs";
import { usePost, usePosts } from "@/hooks/useContent";

/** Renderizador leve de markdown: títulos (##/###), listas e parágrafos. */
function ArticleBody({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/).filter((b) => b.trim());
  return (
    <div className="space-y-6 font-body text-graphite/85 leading-relaxed text-lg">
      {blocks.map((raw, i) => {
        const block = raw.trim();
        if (block.startsWith("### ")) {
          return <h3 key={i} className="font-display text-2xl text-graphite pt-2">{block.slice(4)}</h3>;
        }
        if (block.startsWith("## ")) {
          return <h2 key={i} className="font-display text-3xl text-graphite pt-4">{block.slice(3)}</h2>;
        }
        if (block.startsWith("# ")) {
          return <h2 key={i} className="font-display text-3xl text-graphite pt-4">{block.slice(2)}</h2>;
        }
        if (/^[-*]\s/m.test(block)) {
          const items = block.split("\n").filter((l) => /^[-*]\s/.test(l.trim()));
          if (items.length) {
            return (
              <ul key={i} className="list-disc pl-6 space-y-2">
                {items.map((l, j) => <li key={j}>{l.trim().replace(/^[-*]\s/, "").replace(/\*\*/g, "")}</li>)}
              </ul>
            );
          }
        }
        return <p key={i} className="whitespace-pre-line">{block.replace(/\*\*/g, "")}</p>;
      })}
    </div>
  );
}

export default function BlogPost() {
  const { slug } = useParams();
  const { data: p, isLoading } = usePost(slug);
  const { data: all = [] } = usePosts();

  if (isLoading) return <div className="container-editorial py-20 text-center">Carregando…</div>;
  if (!p) return <div className="container-editorial py-20 text-center">Post não encontrado.</div>;

  const faq = Array.isArray(p.faq) ? (p.faq as { question: string; answer: string }[]) : [];
  const related = all.filter((x) => x.slug !== p.slug).slice(0, 3);
  const description = p.meta_description ?? p.excerpt ?? undefined;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description,
    image: p.cover_url ? [p.cover_url] : undefined,
    datePublished: p.published_at ?? p.created_at,
    dateModified: p.updated_at ?? p.published_at ?? p.created_at,
    author: { "@type": "Person", name: p.author ?? "Pérola Patriani" },
    publisher: { "@type": "Organization", name: "Pérola Patriani" },
    mainEntityOfPage: `${SITE_URL}/blog/${p.slug}`,
    keywords: Array.isArray(p.keywords) ? p.keywords.join(", ") : undefined,
  };

  const faqLd = faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }
    : null;

  const crumbs = [
    { name: "Início", path: "/" },
    { name: "Diário Pérola", path: "/blog" },
    { name: p.title, path: `/blog/${p.slug}` },
  ];

  return (
    <>
      <Seo
        title={`${p.title} · Diário Pérola`}
        description={description}
        image={p.cover_url ?? undefined}
        path={`/blog/${p.slug}`}
        type="article"
        publishedAt={p.published_at}
        jsonLd={[articleLd, breadcrumbLd(crumbs), ...(faqLd ? [faqLd] : [])]}
      />
      <article className="container-editorial py-12 max-w-3xl">
        <Breadcrumbs items={crumbs} />
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground story-link mb-8">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        {p.cover_url && (
          <div className="aspect-[16/9] rounded-3xl overflow-hidden mb-10">
            <img src={p.cover_url} alt={p.title} className="h-full w-full object-cover" />
          </div>
        )}
        <h1 className="font-display text-4xl md:text-6xl text-graphite mb-6 text-balance">{p.title}</h1>
        <p className="font-editorial text-xs uppercase tracking-[0.3em] text-rose-burnt mb-10">{p.author}</p>

        <ArticleBody content={p.content ?? ""} />

        {p.property_id && (
          <div className="mt-12 rounded-2xl border border-border bg-champagne/40 p-6">
            <p className="eyebrow mb-2">Imóvel relacionado</p>
            <Link to="/imoveis" className="font-display text-2xl text-graphite hover:text-rose-burnt transition-colors">
              Ver este imóvel no portfólio →
            </Link>
          </div>
        )}

        {faq.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-3xl text-graphite mb-6">Perguntas frequentes</h2>
            <div className="space-y-5">
              {faq.map((f, i) => (
                <div key={i} className="rounded-2xl border border-border p-5">
                  <h3 className="font-display text-xl text-graphite mb-2">{f.question}</h3>
                  <p className="text-graphite/80">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-16 border-t border-border pt-10">
            <h2 className="font-display text-3xl text-graphite mb-6">Artigos relacionados</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {related.map((r) => (
                <Link key={r.id} to={`/blog/${r.slug}`} className="group block">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-champagne mb-3">
                    {r.cover_url && <img src={r.cover_url} alt={r.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                  </div>
                  <h3 className="font-display text-lg text-graphite group-hover:text-rose-burnt transition-colors">{r.title}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
