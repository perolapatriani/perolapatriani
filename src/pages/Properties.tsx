import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Seo from "@/components/Seo";
import PropertyCard from "@/components/PropertyCard";
import { useProperties, useNeighborhoods } from "@/hooks/useContent";
import { Skeleton } from "@/components/ui/skeleton";

export default function Properties() {
  const [params, setParams] = useSearchParams();
  const { data: all = [], isLoading } = useProperties();
  const { data: neighborhoods = [] } = useNeighborhoods();

  const tipo = params.get("tipo") ?? "";
  const finalidade = params.get("finalidade") ?? "";
  const bairro = params.get("bairro") ?? "";

  const filtered = useMemo(() => {
    return all.filter((p: any) => {
      if (tipo && p.property_type !== tipo) return false;
      if (bairro && p.neighborhood_name !== bairro) return false;
      return true;
    });
  }, [all, tipo, bairro]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  };

  return (
    <>
      <Seo title="Imóveis · Pérola Patriani" description="Portfólio de imóveis selecionados no litoral paulista." path="/imoveis" />
      <section className="container-editorial py-16">
        <p className="eyebrow mb-4">Portfólio</p>
        <h1 className="font-display text-5xl md:text-6xl text-graphite mb-10 text-balance">
          Imóveis com curadoria <em className="text-rose-burnt">Pérola</em>
        </h1>

        <div className="glass-strong rounded-2xl p-5 mb-10 grid gap-3 md:grid-cols-3">
          <select value={tipo} onChange={(e) => update("tipo", e.target.value)}
            aria-label="Filtrar por tipo de imóvel"
            className="rounded-xl bg-pearl/70 border border-border px-4 py-3 text-sm">
            <option value="">Todos os tipos</option>
            <option>Apartamento</option><option>Cobertura</option><option>Casa</option>
          </select>
          <select value={bairro} onChange={(e) => update("bairro", e.target.value)}
            aria-label="Filtrar por bairro"
            className="rounded-xl bg-pearl/70 border border-border px-4 py-3 text-sm">
            <option value="">Todos os bairros</option>
            {neighborhoods.map((n) => <option key={n.id}>{n.name}</option>)}
          </select>
          <select value={finalidade} onChange={(e) => update("finalidade", e.target.value)}
            aria-label="Filtrar por finalidade"
            className="rounded-xl bg-pearl/70 border border-border px-4 py-3 text-sm">
            <option value="">Qualquer finalidade</option>
            <option>Compra</option><option>Locação</option><option>Investimento</option>
          </select>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-20 text-muted-foreground font-display text-2xl">
            Nenhum imóvel encontrado com esses critérios.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p: any) => <PropertyCard key={p.id} p={p} />)}
          </div>
        )}
      </section>
    </>
  );
}
