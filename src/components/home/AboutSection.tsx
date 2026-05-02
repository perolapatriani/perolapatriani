import portrait from "@/assets/perola-portrait.jpg";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { wa } from "@/lib/whatsapp";
import { WaLink } from "@/components/WaLink";

export default function AboutSection() {
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <section className="section-spacing" ref={ref}>
      <div className="container-editorial">
        <div className="grid lg:grid-cols-12 gap-14 items-center">
          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-elegant">
              <img src={portrait} alt="Pérola Patriani, consultora imobiliária" loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden md:block glass-strong rounded-2xl p-5 max-w-[200px]">
              <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt">Pérola Patriani</p>
              <p className="font-display text-lg text-graphite mt-1 leading-tight">Consultora Imobiliária</p>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <p className="eyebrow">Sobre Pérola</p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-graphite text-balance">
              Estratégia, sensibilidade e <em className="text-rose-burnt">elegância</em> em cada negociação
            </h2>
            <p className="text-graphite/80 leading-relaxed text-lg font-display italic">
              "Acredito que toda decisão imobiliária merece ser conduzida com método, presença e transparência. Meu papel é traduzir desejo em estratégia."
            </p>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Pérola Patriani é referência em consultoria imobiliária boutique no litoral paulista. Une visão estratégica de mercado a um atendimento próximo, humano e detalhista — exatamente o que clientes exigentes buscam.
              </p>
              <p>
                Especializada em imóveis de médio e alto padrão, lançamentos selecionados e investimento imobiliário inteligente, sua atuação é guiada por dados, sensibilidade estética e comprometimento absoluto com cada cliente.
              </p>
            </div>
            <WaLink
              href={wa.general()}
              source="about"
              intent="general"
              label="Conheça meu trabalho"
              className="inline-flex items-center gap-2 mt-4 story-link text-sm uppercase tracking-[0.22em] text-graphite"
            >
              Conheça meu trabalho →
            </WaLink>
          </div>
        </div>
      </div>
    </section>
  );
}
