import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { usePosts } from "@/hooks/useContent";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function BlogSection() {
  const { data: posts = [] } = usePosts(3);
  const ref = useScrollReveal<HTMLDivElement>();
  if (!posts.length) return null;

  return (
    <section className="section-spacing" ref={ref}>
      <div className="container-editorial scroll-reveal">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-14">
          <div className="max-w-2xl space-y-4">
            <p className="eyebrow">Diário Pérola</p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-graphite text-balance">
              Conteúdo para decisões <em className="text-rose-burnt">mais inteligentes</em>
            </h2>
          </div>
          <Link to="/blog" className="story-link text-sm uppercase tracking-[0.22em] text-graphite inline-flex items-center gap-2">
            Ler tudo <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((p) => (
            <Link key={p.id} to={`/blog/${p.slug}`} className="group block">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-champagne mb-5">
                {p.cover_url && (
                  <img
                    src={p.cover_url}
                    alt={p.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                  />
                )}
              </div>
              <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt mb-3">Artigo</p>
              <h3 className="font-display text-2xl text-graphite leading-tight mb-3 group-hover:text-rose-burnt transition-colors">
                {p.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
