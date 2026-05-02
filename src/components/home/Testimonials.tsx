import useEmblaCarousel from "embla-carousel-react";
import { Quote, Star } from "lucide-react";
import { useTestimonials } from "@/hooks/useContent";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function Testimonials() {
  const { data: items = [] } = useTestimonials();
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "start" });
  const ref = useScrollReveal<HTMLDivElement>();
  if (!items.length) return null;

  return (
    <section className="section-spacing bg-gradient-soft" ref={ref}>
      <div className="container-editorial">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <p className="eyebrow">Vozes que confiam</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-graphite text-balance">
            Histórias reais de quem encontrou <em className="text-rose-burnt">o lugar certo</em>
          </h2>
        </div>

        <div ref={emblaRef} className="overflow-hidden -mx-3">
          <div className="flex gap-6 px-3">
            {items.map((t) => (
              <div key={t.id} className="min-w-0 flex-[0_0_92%] md:flex-[0_0_60%] lg:flex-[0_0_42%]">
                <article className="glass-strong rounded-3xl p-8 md:p-10 h-full flex flex-col">
                  <Quote className="h-8 w-8 text-rose-burnt/40 mb-6" strokeWidth={1} />
                  <p className="font-display text-2xl text-graphite leading-relaxed flex-1 italic">
                    "{t.text}"
                  </p>
                  <div className="mt-8 pt-6 border-t border-blush/30 flex items-center justify-between">
                    <div>
                      <p className="font-display text-lg text-graphite">{t.client_name}</p>
                      <p className="font-editorial text-[10px] uppercase tracking-[0.28em] text-muted-foreground mt-1">Cliente Pérola</p>
                    </div>
                    <div className="flex gap-0.5 text-rose-burnt">
                      {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
