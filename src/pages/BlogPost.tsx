import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Seo from "@/components/Seo";
import { usePost } from "@/hooks/useContent";

export default function BlogPost() {
  const { slug } = useParams();
  const { data: p, isLoading } = usePost(slug);
  if (isLoading) return <div className="container-editorial py-20 text-center">Carregando…</div>;
  if (!p) return <div className="container-editorial py-20 text-center">Post não encontrado.</div>;

  return (
    <>
      <Seo title={`${p.title} · Diário Pérola`} description={p.excerpt ?? undefined} image={p.cover_url ?? undefined} path={`/blog/${p.slug}`} />
      <article className="container-editorial py-12 max-w-3xl">
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
        <div className="prose prose-neutral max-w-none font-body text-graphite/85 whitespace-pre-line leading-relaxed text-lg">
          {p.content}
        </div>
      </article>
    </>
  );
}
