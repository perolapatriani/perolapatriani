import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero-penthouse.jpg";
import { wa } from "@/lib/whatsapp";
import { useNeighborhoods } from "@/hooks/useContent";

export default function Hero() {
  const navigate = useNavigate();
  const { data: neighborhoods = [] } = useNeighborhoods();

  const [type, setType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [code, setCode] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      // se há código, abre o WhatsApp diretamente com o código
      window.open(wa.search({ code: code.trim() }), "_blank");
      return;
    }
    const params = new URLSearchParams();
    if (type) params.set("tipo", type);
    if (purpose) params.set("finalidade", purpose);
    if (neighborhood) params.set("bairro", neighborhood);
    if (priceRange) params.set("faixa", priceRange);
    navigate(`/imoveis?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[92vh] flex items-end overflow-hidden">
      <img
        src={heroImg}
        alt="Cobertura premium à beira-mar com vista para o oceano"
        className="absolute inset-0 h-full w-full object-cover scale-105 animate-[zoom-out_18s_ease-out_forwards]"
        fetchPriority="high"
      />
      {/* Scrim editorial: escurece a esquerda para dar contraste ao texto, deixa a direita arejada */}
      <div className="absolute inset-0 bg-gradient-to-r from-graphite/55 via-graphite/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-pearl/70" />
      <div className="absolute inset-0 gradient-rose-mist mix-blend-soft-light opacity-60" />

      <div className="container-editorial relative z-10 pb-20 pt-40">
        <div className="max-w-3xl space-y-8 animate-blur-in">
          <div className="inline-flex items-center gap-2 glass-strong rounded-full px-4 py-2 shadow-soft">
            <Sparkles className="h-3 w-3 text-rose-burnt" strokeWidth={1.5} />
            <span className="font-editorial text-[10px] uppercase tracking-[0.32em] text-graphite">
              Consultoria Boutique · Litoral Paulista
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-pearl text-balance drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)]">
            Seu próximo imóvel
            <span className="block italic text-blush">merece mais que uma busca.</span>
            <span className="block">Merece <em className="font-display not-italic text-rose-burnt">estratégia</em>.</span>
          </h1>

          <p className="font-body text-lg md:text-xl text-pearl/95 max-w-xl text-pretty leading-relaxed drop-shadow-[0_1px_12px_rgba(0,0,0,0.35)]">
            Consultoria imobiliária inteligente, personalizada e transparente para quem deseja comprar, vender ou investir com segurança no litoral paulista.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => navigate("/imoveis")}
              className="group inline-flex items-center gap-3 rounded-full bg-graphite px-7 py-3.5 text-xs uppercase tracking-[0.22em] text-pearl shadow-soft transition-all duration-700 hover:bg-rose-burnt hover:shadow-elegant"
            >
              Ver imóveis
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" strokeWidth={1.5} />
            </button>
            <a
              href={wa.general()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full glass-strong px-7 py-3.5 text-xs uppercase tracking-[0.22em] text-graphite hover:bg-pearl transition-colors shadow-soft"
            >
              Falar com Pérola
            </a>
          </div>
        </div>

        {/* Widget de busca */}
        <form
          onSubmit={handleSearch}
          className="mt-14 glass-strong rounded-3xl p-6 md:p-8 shadow-elegant max-w-5xl animate-fade-in-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-blush/30">
            <Search className="h-4 w-4 text-rose-burnt" strokeWidth={1.5} />
            <span className="font-editorial text-xs uppercase tracking-[0.3em] text-graphite">
              Encontre o seu imóvel ideal
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-xl bg-pearl/70 border border-border px-4 py-3 text-sm text-graphite focus:outline-none focus:ring-2 focus:ring-rose-burnt/40 transition"
            >
              <option value="">Tipo de imóvel</option>
              <option>Apartamento</option>
              <option>Cobertura</option>
              <option>Casa</option>
              <option>Casa em condomínio</option>
              <option>Terreno</option>
            </select>

            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="rounded-xl bg-pearl/70 border border-border px-4 py-3 text-sm text-graphite focus:outline-none focus:ring-2 focus:ring-rose-burnt/40 transition"
            >
              <option value="">Finalidade</option>
              <option>Compra</option>
              <option>Venda</option>
              <option>Locação</option>
              <option>Investimento</option>
            </select>

            <select
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="rounded-xl bg-pearl/70 border border-border px-4 py-3 text-sm text-graphite focus:outline-none focus:ring-2 focus:ring-rose-burnt/40 transition"
            >
              <option value="">Bairro</option>
              {neighborhoods.map((n) => (
                <option key={n.id} value={n.name}>{n.name}</option>
              ))}
            </select>

            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="rounded-xl bg-pearl/70 border border-border px-4 py-3 text-sm text-graphite focus:outline-none focus:ring-2 focus:ring-rose-burnt/40 transition"
            >
              <option value="">Faixa de valor</option>
              <option>Até R$ 800 mil</option>
              <option>R$ 800 mil – R$ 1,5 mi</option>
              <option>R$ 1,5 mi – R$ 3 mi</option>
              <option>Acima de R$ 3 mi</option>
            </select>

            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Código"
                maxLength={20}
                className="flex-1 min-w-0 rounded-xl bg-pearl/70 border border-border px-4 py-3 text-sm text-graphite focus:outline-none focus:ring-2 focus:ring-rose-burnt/40 transition"
              />
              <button
                type="submit"
                aria-label="Buscar"
                className="rounded-xl bg-graphite px-5 text-pearl hover:bg-rose-burnt transition-colors"
              >
                <Search className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
