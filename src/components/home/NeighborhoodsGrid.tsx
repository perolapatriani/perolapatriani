import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useNeighborhoods } from "@/hooks/useContent";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function NeighborhoodsGrid() {
  const { data: neighborhoods = [] } = useNeighborhoods();
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <section className="section-spacing" ref={ref}>
      <div className="container-editorial scroll-reveal">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <p className="eyebrow">Encontre por bairro</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-graphite text-balance">
            Os endereços mais <em className="text-rose-burnt">desejados</em> do litoral paulista
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {neighborhoods.map((n, i) => (
            <Link
              key={n.id}
              to={`/bairros/${n.slug}`}
              className="group relative overflow-hidden rounded-2xl bg-champagne aspect-[3/4] block"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {n.image_url && (
                <img
                  src={n.image_url}
                  alt={`Bairro ${n.name}`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-graphite/85 via-graphite/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between text-pearl">
                <div>
                  <h3 className="font-display text-2xl leading-none">{n.name}</h3>
                  <p className="font-editorial text-[10px] uppercase tracking-[0.28em] mt-2 text-pearl/70">
                    Ver imóveis
                  </p>
                </div>
                <ArrowUpRight className="h-5 w-5 transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1" strokeWidth={1.5} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
