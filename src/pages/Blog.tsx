import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import { usePosts } from "@/hooks/useContent";

export default function Blog() {
  const { data: posts = [] } = usePosts();
  return (
    <>
      <Seo title="Diário Pérola · Blog" path="/blog" />
      <section className="container-editorial py-16">
        <p className="eyebrow mb-4">Diário Pérola</p>
        <h1 className="font-display text-5xl md:text-6xl text-graphite mb-12 text-balance">
          Conteúdo para decisões <em className="text-rose-burnt">mais inteligentes</em>
        </h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((p) => (
            <Link key={p.id} to={`/blog/${p.slug}`} className="group block">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-champagne mb-5">
                {p.cover_url && <img src={p.cover_url} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" />}
              </div>
              <h2 className="font-display text-2xl text-graphite group-hover:text-rose-burnt transition-colors">{p.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
