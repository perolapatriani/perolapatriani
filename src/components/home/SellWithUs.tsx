import { Link } from "react-router-dom";
import { ArrowRight, Home, MessageCircle } from "lucide-react";
import { wa } from "@/lib/whatsapp";
import { WaLink } from "@/components/WaLink";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function SellWithUs() {
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <section className="section-spacing" ref={ref}>
      <div className="container-editorial">
        <div className="grid lg:grid-cols-2 gap-10 items-center glass-strong rounded-[2.5rem] p-10 md:p-16 shadow-soft">
          <div>
            <p className="eyebrow mb-4">Avaliação gratuita</p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-graphite leading-[1.05] text-balance">
              Descubra <em className="text-rose-burnt">quanto vale</em> o seu imóvel
            </h2>
            <p className="mt-6 text-muted-foreground max-w-lg">
              Análise de valor de mercado gratuita e sem compromisso, baseada em dados reais de vendas recentes no litoral paulista — feita pessoalmente pela Pérola.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-graphite">
              {["Análise de valor em até 24h", "Comparativo com imóveis similares vendidos", "Sem compromisso de venda", "Relatório personalizado por WhatsApp"].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-burnt shrink-0" />
                  {t}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/vender"
                className="group inline-flex items-center gap-3 rounded-full bg-graphite px-8 py-4 text-xs uppercase tracking-[0.22em] text-pearl shadow-elegant transition-all duration-500 hover:bg-rose-burnt"
              >
                <Home className="h-4 w-4" strokeWidth={1.5} /> Quero saber quanto vale
                <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" strokeWidth={1.5} />
              </Link>
              <WaLink
                href={wa.general()}
                source="other"
                intent="general"
                label="Avaliar pelo WhatsApp"
                className="inline-flex items-center gap-2 rounded-full border border-graphite/20 px-7 py-4 text-xs uppercase tracking-[0.22em] text-graphite hover:bg-champagne transition-colors"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={1.5} /> Avaliar pelo WhatsApp
              </WaLink>
            </div>
          </div>

          <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-gradient-to-br from-blush/30 via-champagne to-serenity/30 shadow-elegant">
            <div className="absolute inset-0 bg-noise opacity-30" />
            <div className="absolute inset-0 grid place-items-center text-center p-10">
              <div>
                <p className="font-display text-3xl md:text-4xl text-graphite italic leading-tight">
                  "Saber o valor real<br/>é o primeiro passo<br/>para decidir."
                </p>
                <p className="mt-6 font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt">
                  Pérola Patriani
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
