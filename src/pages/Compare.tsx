import { Link } from "react-router-dom";
import { ArrowLeft, X, BedDouble, Maximize2, Car, MapPin, Bath } from "lucide-react";
import Seo from "@/components/Seo";
import { useCompare } from "@/hooks/useCompare";
import { useProperties } from "@/hooks/useContent";
import { formatPrice } from "@/lib/whatsapp";

function pricePerM2(price: number | null, area: number | null): string {
  if (!price || !area || Number(area) === 0) return "—";
  return formatPrice(Number(price) / Number(area));
}

export default function Compare() {
  const { items, remove, clear } = useCompare();
  // hydrate latest data from db if available
  const { data: all = [] } = useProperties();
  const enriched = items.map((it) => {
    const fresh = (all as any[]).find((p) => p.id === it.id);
    return fresh ?? it;
  });

  return (
    <>
      <Seo title="Comparar imóveis · Pérola Patriani" description="Compare imóveis lado a lado." path="/comparar" />
      <section className="container-editorial py-12">
        <Link to="/imoveis" className="inline-flex items-center gap-2 text-sm text-muted-foreground story-link mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar ao portfólio
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <p className="eyebrow mb-3">Comparador</p>
            <h1 className="font-display text-4xl md:text-5xl text-graphite text-balance">
              Compare imóveis <em className="text-rose-burnt">lado a lado</em>
            </h1>
          </div>
          {enriched.length > 0 && (
            <button onClick={clear} className="text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-rose-burnt">
              Limpar tudo
            </button>
          )}
        </div>

        {enriched.length === 0 ? (
          <div className="luxe-card p-12 text-center max-w-xl mx-auto">
            <p className="text-muted-foreground mb-6">
              Você ainda não selecionou imóveis. Navegue pelo portfólio e use o botão <strong>Comparar</strong> nos cards.
            </p>
            <Link to="/imoveis" className="inline-flex items-center gap-2 rounded-full bg-graphite px-6 py-3 text-xs uppercase tracking-[0.22em] text-pearl hover:bg-rose-burnt transition-colors">
              Ver imóveis
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className={`grid gap-6 min-w-[600px]`} style={{ gridTemplateColumns: `repeat(${enriched.length}, minmax(0, 1fr))` }}>
              {enriched.map((p: any) => (
                <div key={p.id} className="luxe-card overflow-hidden flex flex-col">
                  <div className="relative aspect-[4/3] bg-champagne">
                    {p.cover_url && <img src={p.cover_url} alt={p.title} className="h-full w-full object-cover" />}
                    <button
                      onClick={() => remove(p.id)}
                      aria-label="Remover"
                      className="absolute top-3 right-3 bg-graphite/80 text-pearl rounded-full p-1.5 hover:bg-rose-burnt"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </div>
                  <div className="p-5 space-y-4 flex-1 flex flex-col">
                    {p.neighborhood_name && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> <span className="font-editorial uppercase tracking-[0.2em]">{p.neighborhood_name}</span>
                      </div>
                    )}
                    <h3 className="font-display text-xl text-graphite leading-tight">{p.title}</h3>

                    <dl className="space-y-2.5 text-sm border-t border-border/60 pt-4 mt-auto">
                      <Row label="Preço">
                        <span className="font-display text-rose-burnt">{formatPrice(p.price)}</span>
                      </Row>
                      <Row label="Área">{p.area_m2 != null ? `${Number(p.area_m2)} m²` : "—"}</Row>
                      <Row label="R$ / m²">{pricePerM2(p.price, p.area_m2)}</Row>
                      <Row label="Bairro">{p.neighborhood_name ?? "—"}</Row>
                      <Row label="Dormitórios">
                        <span className="inline-flex items-center gap-1.5"><BedDouble className="h-3.5 w-3.5" />{p.bedrooms ?? "—"}</span>
                      </Row>
                      <Row label="Suítes">
                        <span className="inline-flex items-center gap-1.5"><Bath className="h-3.5 w-3.5" />{p.suites ?? "—"}</span>
                      </Row>
                      <Row label="Vagas">
                        <span className="inline-flex items-center gap-1.5"><Car className="h-3.5 w-3.5" />{p.parking ?? "—"}</span>
                      </Row>
                      <Row label="Tipo">{p.property_type ?? "—"}</Row>
                    </dl>

                    <Link
                      to={`/imoveis/${p.slug}`}
                      className="block text-center rounded-full bg-graphite py-3 text-[10px] uppercase tracking-[0.22em] text-pearl hover:bg-rose-burnt transition-colors mt-3"
                    >
                      Ver imóvel
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</dt>
      <dd className="text-graphite text-right">{children}</dd>
    </div>
  );
}
