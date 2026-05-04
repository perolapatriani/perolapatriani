import { useParams, Link } from "react-router-dom";
import { ArrowLeft, BedDouble, Maximize2, Car, Bath, MapPin, Play } from "lucide-react";
import Seo from "@/components/Seo";
import { useProperty } from "@/hooks/useContent";
import { formatPrice, wa } from "@/lib/whatsapp";
import { WaLink } from "@/components/WaLink";

function getEmbedUrl(url: string): string {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
}

export default function PropertyDetail() {
  const { slug } = useParams();
  const { data: p, isLoading } = useProperty(slug);

  if (isLoading) return <div className="container-editorial py-20 text-center font-display text-2xl">Carregando…</div>;
  if (!p) return <div className="container-editorial py-20 text-center font-display text-2xl">Imóvel não encontrado.</div>;

  return (
    <>
      <Seo title={`${p.title} · Pérola Patriani`} description={p.description ?? undefined} image={p.cover_url ?? undefined} path={`/imoveis/${p.slug}`} />
      <section className="container-editorial py-12">
        <Link to="/imoveis" className="inline-flex items-center gap-2 text-sm text-muted-foreground story-link mb-8">
          <ArrowLeft className="h-4 w-4" /> Voltar ao portfólio
        </Link>

        <div className="grid lg:grid-cols-3 gap-4 mb-12">
          <div className="lg:col-span-2 aspect-[4/3] rounded-3xl overflow-hidden">
            {p.cover_url && <img src={p.cover_url} alt={p.title} className="h-full w-full object-cover" />}
          </div>
          <div className="grid gap-4">
            {(p.photos ?? []).slice(0, 2).map((url: string, i: number) => (
              <div key={i} className="aspect-[4/3] rounded-3xl overflow-hidden bg-champagne">
                <img src={url} alt={`${p.title} foto ${i+1}`} loading="lazy" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            {p.neighborhood_name && (
              <p className="font-editorial text-xs uppercase tracking-[0.3em] text-rose-burnt flex items-center gap-2">
                <MapPin className="h-3 w-3" /> {p.neighborhood_name} · Cód. {p.code}
              </p>
            )}
            <h1 className="font-display text-4xl md:text-6xl text-graphite text-balance">{p.title}</h1>
            <div className="font-display text-4xl text-rose-burnt">{formatPrice(p.price)}</div>

            <div className="flex flex-wrap gap-6 py-6 border-y border-border text-sm text-graphite">
              {p.bedrooms != null && <span className="flex items-center gap-2"><BedDouble className="h-4 w-4" strokeWidth={1.5} /> {p.bedrooms} dormitórios</span>}
              {p.suites != null && p.suites > 0 && <span className="flex items-center gap-2"><Bath className="h-4 w-4" strokeWidth={1.5} /> {p.suites} suítes</span>}
              {p.area_m2 != null && <span className="flex items-center gap-2"><Maximize2 className="h-4 w-4" strokeWidth={1.5} /> {Number(p.area_m2)} m²</span>}
              {p.parking != null && p.parking > 0 && <span className="flex items-center gap-2"><Car className="h-4 w-4" strokeWidth={1.5} /> {p.parking} vagas</span>}
            </div>

            <div className="prose max-w-none text-graphite/80 leading-relaxed">
              <p>{p.description}</p>
            </div>

            {p.video_url && (
              <div className="mt-8">
                <p className="font-editorial text-xs uppercase tracking-[0.3em] text-rose-burnt mb-4 flex items-center gap-2">
                  <Play className="h-3 w-3" /> Tour em vídeo
                </p>
                <div className="aspect-video rounded-3xl overflow-hidden bg-champagne">
                  <iframe
                    src={getEmbedUrl(p.video_url)}
                    title={`Vídeo - ${p.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}
          </div>

          <aside className="lg:col-span-1">
            <div className="glass-strong rounded-3xl p-8 sticky top-28 space-y-5">
              <p className="font-editorial text-xs uppercase tracking-[0.3em] text-rose-burnt">Falar sobre este imóvel</p>
              <h3 className="font-display text-2xl text-graphite">Atendimento consultivo direto com Pérola</h3>
              <WaLink href={wa.property(p.code, p.title)} source="property_detail" intent="property" label={p.title} code={p.code} value={20} redirectToThanks
                className="block text-center rounded-full bg-graphite py-4 text-xs uppercase tracking-[0.22em] text-pearl hover:bg-rose-burnt transition-colors">
                Conversar no WhatsApp
              </WaLink>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
