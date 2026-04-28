import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import { useNeighborhoods } from "@/hooks/useContent";

export default function Neighborhoods() {
  const { data = [] } = useNeighborhoods();
  return (
    <>
      <Seo title="Bairros · Pérola Patriani" path="/bairros" />
      <section className="container-editorial py-16">
        <p className="eyebrow mb-4">Litoral Paulista</p>
        <h1 className="font-display text-5xl md:text-6xl text-graphite mb-12 text-balance">
          Os endereços mais <em className="text-rose-burnt">desejados</em>
        </h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((n) => (
            <Link key={n.id} to={`/bairros/${n.slug}`} className="group block luxe-card overflow-hidden">
              <div className="aspect-[4/3] overflow-hidden bg-champagne">
                {n.image_url && <img src={n.image_url} alt={n.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" />}
              </div>
              <div className="p-6">
                <h3 className="font-display text-2xl text-graphite mb-2">{n.name}</h3>
                <p className="text-sm text-muted-foreground">{n.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
