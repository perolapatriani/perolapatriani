import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Compass, HandHeart, ShieldCheck, Sparkles } from "lucide-react";

const PILLARS = [
  {
    icon: Compass,
    title: "Curadoria estratégica",
    desc: "Seleção criteriosa de imóveis alinhados ao seu perfil e objetivos.",
  },
  {
    icon: HandHeart,
    title: "Atendimento humano",
    desc: "Escuta atenta e relação próxima em cada etapa da jornada.",
  },
  {
    icon: ShieldCheck,
    title: "Transparência total",
    desc: "Clareza em documentos, valores e decisões — sem surpresas.",
  },
  {
    icon: Sparkles,
    title: "Visão de patrimônio",
    desc: "Análise consultiva pensando no seu investimento a longo prazo.",
  },
];

export default function WhyPerola() {
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <section className="section-spacing bg-gradient-pearl" ref={ref}>
      <div className="container-editorial">
        <div className="grid lg:grid-cols-12 gap-14 items-center">
          <div className="lg:col-span-5 space-y-6">
            <p className="eyebrow">Por que escolher Pérola</p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-graphite text-balance">
              Inteligência imobiliária com <em className="text-rose-burnt">alma</em> consultiva
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Mais que vender ou comprar, é assessorar com método. Cada cliente recebe um trabalho de curadoria, análise de mercado e acompanhamento próximo — do primeiro contato à entrega das chaves.
            </p>
            <ul className="space-y-3 pt-2">
              {[
                "Atendimento personalizado e humanizado",
                "Curadoria estratégica de imóveis",
                "Transparência total em cada etapa",
                "Visão consultiva de patrimônio e investimento",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-graphite">
                  <span className="mt-2 h-1 w-6 bg-rose-burnt rounded-full flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-px bg-border rounded-3xl overflow-hidden shadow-soft">
            {PILLARS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-pearl p-8 md:p-10 space-y-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-champagne text-rose-burnt">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <h3 className="font-display text-2xl text-graphite">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
