import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import PropertyCard from "@/components/PropertyCard";
import { useFeaturedProperties } from "@/hooks/useContent";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeaturedProperties() {
  const { data: properties = [], isLoading } = useFeaturedProperties(8);
  const [emblaRef] = useEmblaCarousel({ loop: false, align: "start", dragFree: true });
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <section className="section-spacing bg-gradient-soft" ref={ref}>
      <div className="container-editorial scroll-reveal">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-14">
          <div className="max-w-2xl space-y-4">
            <p className="eyebrow">Imóveis em evidência</p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-graphite text-balance">
              Curadoria de <em className="text-rose-burnt">imóveis</em> selecionados a dedo
            </h2>
            <p className="text-muted-foreground max-w-lg">
              Cada imóvel é avaliado com olhar consultivo. Estética, localização e potencial de valorização — tudo equilibrado para uma escolha certeira.
            </p>
          </div>
          <Link to="/imoveis" className="story-link inline-flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-graphite">
            Ver todo o portfólio <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />)}
          </div>
        ) : (
          <div ref={emblaRef} className="overflow-hidden -mx-3">
            <div className="flex gap-6 px-3">
              {properties.map((p) => (
                <div key={p.id} className="min-w-0 flex-[0_0_88%] sm:flex-[0_0_55%] lg:flex-[0_0_36%]">
                  <PropertyCard p={p as any} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
