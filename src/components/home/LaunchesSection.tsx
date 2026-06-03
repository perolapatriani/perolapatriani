import { ArrowRight } from "lucide-react";
import { useLaunches } from "@/hooks/useContent";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { wa } from "@/lib/whatsapp";
import { WaLink } from "@/components/WaLink";

export default function LaunchesSection() {
  const { data: launches = [] } = useLaunches();
  const ref = useScrollReveal<HTMLDivElement>();
  const featured = launches[0];
  if (!featured) return null;

  return (
    <section className="section-spacing bg-graphite text-pearl overflow-hidden" ref={ref}>
      <div className="container-editorial">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-elegant">
              <img
                src={featured.cover_url ?? ""}
                alt={featured.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform [transition-duration:2000ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:scale-105"
              />
            </div>
            <div className="hidden md:block absolute -bottom-6 -right-6 glass-strong rounded-2xl p-5 max-w-[220px] text-graphite">
              <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt">Em construção</p>
              <p className="font-display text-xl mt-1">{featured.delivery_date}</p>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-7">
            <p className="font-editorial text-xs uppercase tracking-[0.32em] text-blush">Lançamento exclusivo</p>
            <h2 className="font-display text-4xl md:text-5xl text-pearl leading-tight text-balance">
              {featured.name}
            </h2>
            <p className="font-editorial text-sm uppercase tracking-[0.24em] text-pearl/60">
              {featured.location}
            </p>
            <p className="text-pearl/80 leading-relaxed text-pretty">
              {featured.description}
            </p>
            <ul className="grid gap-2 pt-2">
              {(featured.highlights ?? []).map((h: string) => (
                <li key={h} className="flex items-start gap-3 text-sm text-pearl/85">
                  <span className="mt-2 h-1 w-6 bg-blush rounded-full flex-shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
            <WaLink
              href={wa.launch(featured.name)}
              source="launches_section"
              intent="launch"
              label={featured.name}
              className="group inline-flex items-center gap-3 rounded-full bg-blush px-7 py-3.5 text-xs uppercase tracking-[0.22em] text-graphite transition-all duration-500 hover:bg-pearl mt-4"
            >
              Quero conhecer
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" strokeWidth={1.5} />
            </WaLink>
          </div>
        </div>
      </div>
    </section>
  );
}
