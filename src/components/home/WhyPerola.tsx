import { useEffect, useRef, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const STATS = [
  { value: 480, suffix: "+", label: "Imóveis atendidos" },
  { value: 320, suffix: "+", label: "Clientes assessorados" },
  { value: 210, suffix: "+", label: "Vendas concluídas" },
  { value: 98, suffix: "%", label: "Satisfação dos clientes" },
];

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const [n, setN] = useState(0);
  const elRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const start = performance.now();
        const dur = 1800;
        const step = (t: number) => {
          const p = Math.min((t - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setN(Math.round(value * eased));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.disconnect();
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);

  return <span ref={elRef}>{n}{suffix}</span>;
}

export default function WhyPerola() {
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <section className="section-spacing bg-gradient-pearl" ref={ref}>
      <div className="container-editorial scroll-reveal">
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

          <div className="lg:col-span-7 grid grid-cols-2 gap-px bg-border rounded-3xl overflow-hidden shadow-soft">
            {STATS.map((s) => (
              <div key={s.label} className="bg-pearl p-10 text-center">
                <div className="font-display text-5xl md:text-6xl text-rose-burnt">
                  <CountUp value={s.value} suffix={s.suffix} />
                </div>
                <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-3">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
