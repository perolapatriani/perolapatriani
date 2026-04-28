import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import { useLaunches } from "@/hooks/useContent";

export default function Launches() {
  const { data: launches = [] } = useLaunches();
  return (
    <>
      <Seo title="Lançamentos · Pérola Patriani" path="/lancamentos" />
      <section className="container-editorial py-16">
        <p className="eyebrow mb-4">Empreendimentos</p>
        <h1 className="font-display text-5xl md:text-6xl text-graphite mb-12 text-balance">
          Lançamentos <em className="text-rose-burnt">selecionados</em>
        </h1>
        <div className="grid gap-10">
          {launches.map((l: any) => (
            <Link key={l.id} to={`/lancamentos/${l.slug}`} className="group grid lg:grid-cols-12 gap-8 items-center luxe-card overflow-hidden">
              <div className="lg:col-span-7 aspect-[4/3] overflow-hidden">
                {l.cover_url && <img src={l.cover_url} alt={l.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" />}
              </div>
              <div className="lg:col-span-5 p-8 space-y-4">
                <p className="font-editorial text-xs uppercase tracking-[0.3em] text-rose-burnt">{l.location}</p>
                <h2 className="font-display text-3xl md:text-4xl text-graphite">{l.name}</h2>
                <p className="text-muted-foreground">{l.description}</p>
                <p className="font-editorial text-xs uppercase tracking-[0.28em] text-graphite pt-2">{l.delivery_date}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
