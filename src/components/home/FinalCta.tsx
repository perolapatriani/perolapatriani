import { ArrowRight } from "lucide-react";
import { wa } from "@/lib/whatsapp";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function FinalCta() {
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <section className="section-spacing relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 bg-noise" />
      <div className="container-editorial relative z-10 scroll-reveal">
        <div className="glass-strong rounded-[2.5rem] p-10 md:p-20 text-center max-w-4xl mx-auto shadow-elegant">
          <p className="eyebrow mb-6">Próximo passo</p>
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-graphite leading-[1.05] text-balance">
            Seu imóvel ideal existe.
            <span className="block italic text-rose-burnt mt-2">Vamos encontrá-lo com estratégia.</span>
          </h2>
          <p className="mt-8 text-muted-foreground max-w-xl mx-auto">
            Agende uma conversa consultiva com Pérola e descubra o que torna a busca certa, leve e eficiente.
          </p>
          <a
            href={wa.schedule()}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 mt-10 rounded-full bg-graphite px-9 py-4 text-xs uppercase tracking-[0.24em] text-pearl shadow-elegant transition-all duration-700 hover:bg-rose-burnt"
          >
            Agendar atendimento
            <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </section>
  );
}
