import { useParams } from "react-router-dom";
import Seo from "@/components/Seo";
import PropertyCard from "@/components/PropertyCard";
import { useNeighborhoods, useProperties } from "@/hooks/useContent";
import { wa } from "@/lib/whatsapp";
import { WaLink } from "@/components/WaLink";

export default function NeighborhoodDetail() {
  const { slug } = useParams();
  const { data: nb = [] } = useNeighborhoods();
  const { data: all = [] } = useProperties();
  const n = nb.find((x) => x.slug === slug);
  if (!n) return <div className="container-editorial py-20 text-center">Bairro não encontrado.</div>;
  const props = all.filter((p: any) => p.neighborhood_name === n.name);

  return (
    <>
      <Seo title={`${n.name} · Pérola Patriani`} description={n.description ?? undefined} image={n.image_url ?? undefined} path={`/bairros/${n.slug}`} />
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        {n.image_url && <img src={n.image_url} alt={n.name} className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-b from-graphite/30 to-graphite/70" />
        <div className="container-editorial relative z-10 h-full flex flex-col justify-end pb-12 text-pearl">
          <p className="font-editorial text-xs uppercase tracking-[0.3em] text-blush mb-3">Bairro</p>
          <h1 className="font-display text-5xl md:text-7xl text-balance">{n.name}</h1>
        </div>
      </section>

      <section className="container-editorial py-16">
        <div className="grid lg:grid-cols-3 gap-10 mb-14">
          <div className="lg:col-span-2 text-graphite/80 leading-relaxed text-lg font-display">{n.description}</div>
          <WaLink href={wa.neighborhood(n.name)} source="neighborhood_detail" intent="neighborhood" label={n.name}
            className="self-start rounded-full bg-graphite px-7 py-4 text-center text-xs uppercase tracking-[0.22em] text-pearl hover:bg-rose-burnt transition-colors">
            Tenho interesse no bairro
          </WaLink>
        </div>

        <h2 className="font-display text-3xl text-graphite mb-8">Imóveis em {n.name}</h2>
        {props.length === 0 ? (
          <p className="text-muted-foreground">Em breve, novos imóveis selecionados nesta região.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {props.map((p: any) => <PropertyCard key={p.id} p={p} />)}
          </div>
        )}
      </section>
    </>
  );
}
