import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Seo from "@/components/Seo";
import PropertyCard from "@/components/PropertyCard";
import { useProperties, useNeighborhoods, useLaunches } from "@/hooks/useContent";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Sparkles, Search, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function Properties() {
  const [params, setParams] = useSearchParams();
  const { data: all = [], isLoading } = useProperties();
  const { data: launches = [] } = useLaunches();
  const { data: neighborhoods = [] } = useNeighborhoods();

  const tipo = params.get("tipo") ?? "";
  const finalidade = params.get("finalidade") ?? "";
  const bairro = params.get("bairro") ?? "";

  // AI search state
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<{
    interpretation: string;
    properties: any[];
  } | null>(null);

  const runAiSearch = async () => {
    if (aiQuery.trim().length < 3) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-properties-ai", {
        body: { query: aiQuery.trim() },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setAiResults({
        interpretation: (data as any).interpretation,
        properties: (data as any).properties ?? [],
      });
    } catch (e: any) {
      toast({ title: "Falha na busca", description: e.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const clearAi = () => {
    setAiResults(null);
    setAiQuery("");
  };

  const filteredProps = useMemo(() => {
    return all.filter((p: any) => {
      if (tipo === "Lançamento") return false;
      if (tipo && p.property_type !== tipo) return false;
      if (bairro && p.neighborhood_name !== bairro) return false;
      return true;
    });
  }, [all, tipo, bairro]);

  const filteredLaunches = useMemo(() => {
    if (tipo && tipo !== "Lançamento") return [];
    return launches.filter((l: any) => {
      if (bairro && l.location && !l.location.toLowerCase().includes(bairro.toLowerCase())) return false;
      return true;
    });
  }, [launches, tipo, bairro]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  };

  const empty = !aiResults && filteredProps.length === 0 && filteredLaunches.length === 0;

  return (
    <>
      <Seo title="Imóveis · Pérola Patriani" description="Portfólio de imóveis e lançamentos selecionados no litoral paulista." path="/imoveis" />
      <section className="container-editorial py-16">
        <p className="eyebrow mb-4">Portfólio</p>
        <h1 className="font-display text-5xl md:text-6xl text-graphite mb-10 text-balance">
          Imóveis com curadoria <em className="text-rose-burnt">Pérola</em>
        </h1>

        {/* AI Search */}
        <div className="glass-strong rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-rose-burnt" />
            <p className="font-editorial text-[11px] uppercase tracking-[0.24em] text-rose-burnt">
              Busca inteligente — descreva o que procura
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runAiSearch()}
                placeholder='Ex: "apê de 3 quartos perto da praia até 1.5M" ou "cobertura com vista mar em Cibratel"'
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-pearl/70 border border-border text-sm outline-none focus:border-rose-burnt"
              />
            </div>
            <button
              onClick={runAiSearch}
              disabled={aiLoading || aiQuery.trim().length < 3}
              className="inline-flex items-center gap-2 rounded-xl bg-graphite text-pearl px-5 py-3 text-sm font-editorial uppercase tracking-[0.18em] hover:bg-graphite/90 transition disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Buscar
            </button>
            {aiResults && (
              <button
                onClick={clearAi}
                className="inline-flex items-center gap-1 rounded-xl border border-border px-4 py-3 text-sm hover:bg-muted transition"
                title="Limpar busca IA"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {aiResults && (
            <p className="text-xs text-muted-foreground mt-3 italic">
              <Sparkles className="inline h-3 w-3 mr-1 text-rose-burnt" />
              {aiResults.interpretation} · {aiResults.properties.length} resultado{aiResults.properties.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {!aiResults && (
          <div className="glass-strong rounded-2xl p-5 mb-10 grid gap-3 md:grid-cols-3">
            <select value={tipo} onChange={(e) => update("tipo", e.target.value)}
              aria-label="Filtrar por tipo de imóvel"
              className="rounded-xl bg-pearl/70 border border-border px-4 py-3 text-sm">
              <option value="">Todos os tipos</option>
              <option>Apartamento</option><option>Cobertura</option><option>Casa</option>
              <option>Lançamento</option>
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
        )}

        {aiResults ? (
          aiResults.properties.length === 0 ? (
            <p className="text-center py-20 text-muted-foreground font-display text-2xl">
              Nenhum imóvel bate com essa descrição. Tente outros termos.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiResults.properties.map((p: any) => <PropertyCard key={p.id} p={p} />)}
            </div>
          )
        ) : isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />)}
          </div>
        ) : empty ? (
          <p className="text-center py-20 text-muted-foreground font-display text-2xl">
            Nenhum imóvel encontrado com esses critérios.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLaunches.map((l: any) => <LaunchCard key={`l-${l.id}`} l={l} />)}
            {filteredProps.map((p: any) => <PropertyCard key={p.id} p={p} />)}
          </div>
        )}
      </section>
    </>
  );
}

function LaunchCard({ l }: { l: any }) {
  return (
    <Link to={`/lancamentos/${l.slug}`} className="group block luxe-card overflow-hidden transition-all duration-700">
      <div className="relative aspect-[4/3] overflow-hidden bg-champagne">
        {l.cover_url && (
          <img src={l.cover_url} alt={l.name} loading="lazy"
            className="h-full w-full object-cover transition-transform [transition-duration:1400ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110" />
        )}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-rose-burnt text-pearl px-3 py-1 rounded-full text-[10px] font-editorial uppercase tracking-[0.2em] inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Lançamento
          </span>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {l.location && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" strokeWidth={1.5} />
            <span className="font-editorial uppercase tracking-[0.2em]">{l.location}</span>
          </div>
        )}
        <h3 className="font-display text-2xl text-graphite leading-tight">{l.name}</h3>
        {l.delivery_date && (
          <p className="font-editorial text-xs uppercase tracking-[0.24em] text-rose-burnt">Entrega {l.delivery_date}</p>
        )}
        {l.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{l.description}</p>
        )}
      </div>
    </Link>
  );
}
