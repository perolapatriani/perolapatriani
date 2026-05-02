import { Home, Key, Building2, TrendingUp, Calculator, Compass } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const SERVICES = [
  { icon: Home, title: "Compra consultiva", desc: "Encontre o imóvel certo com método e curadoria estratégica." },
  { icon: TrendingUp, title: "Venda inteligente", desc: "Posicionamento premium e negociação para o melhor valor." },
  { icon: Key, title: "Locação selecionada", desc: "Inquilinos qualificados e gestão atenta para seu patrimônio." },
  { icon: Compass, title: "Investimento imobiliário", desc: "Análise de oportunidades com retorno e valorização real." },
  { icon: Calculator, title: "Avaliação de imóveis", desc: "Precificação técnica baseada em dados e contexto de mercado." },
  { icon: Building2, title: "Captação estratégica", desc: "Gestão exclusiva de portfólio para proprietários selecionados." },
];

export default function Services() {
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <section className="section-spacing" ref={ref}>
      <div className="container-editorial">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <p className="eyebrow">O que fazemos</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-graphite text-balance">
            Consultoria <em className="text-rose-burnt">360°</em> para cada decisão imobiliária
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-3xl overflow-hidden">
          {SERVICES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group bg-card p-10 transition-colors duration-700 hover:bg-champagne">
              <div className="grid place-items-center h-14 w-14 rounded-full border border-blush/40 mb-6 transition-all duration-700 group-hover:bg-rose-burnt group-hover:border-rose-burnt group-hover:text-pearl">
                <Icon className="h-5 w-5" strokeWidth={1.25} />
              </div>
              <h3 className="font-display text-2xl text-graphite mb-3">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
