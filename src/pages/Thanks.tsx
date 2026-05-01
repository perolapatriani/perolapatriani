import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { ArrowRight, Check, Clock, Instagram, MessageCircle, Sparkles } from "lucide-react";
import Seo from "@/components/Seo";
import { wa, INSTAGRAM_URL, trackWaClick, type WaSource } from "@/lib/whatsapp";
import { WaLink } from "@/components/WaLink";
import { useFeaturedProperties } from "@/hooks/useContent";
import PropertyCard from "@/components/PropertyCard";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

const STEPS = [
  {
    icon: Check,
    title: "Mensagem recebida",
    text: "Sua conversa foi aberta no WhatsApp da Pérola — basta enviar para iniciarmos.",
  },
  {
    icon: Clock,
    title: "Resposta em até 2h úteis",
    text: "Atendimento personalizado, sem robôs e sem repasse para terceiros.",
  },
  {
    icon: Sparkles,
    title: "Curadoria sob medida",
    text: "Você receberá uma seleção criteriosa de imóveis alinhada ao seu projeto de vida.",
  },
];

export default function Thanks() {
  const [params] = useSearchParams();
  const sourceParam = (params.get("from") as WaSource | null) ?? "other";
  const intent = params.get("intent") ?? "general";

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "whatsapp_thanks_view",
        wa_source: sourceParam,
        wa_intent: intent,
      });
      window.gtag?.("event", "whatsapp_thanks_view", {
        event_category: "engagement",
        event_label: sourceParam,
      });
      window.fbq?.("trackCustom", "WhatsAppThanksView", { source: sourceParam, intent });
    } catch {
      /* noop */
    }
  }, [sourceParam, intent]);

  return (
    <>
      <Seo title="Obrigada · Pérola Patriani" description="Sua conversa foi iniciada. Conheça os próximos passos do atendimento consultivo Pérola Patriani." path="/obrigado" />

      <section className="section-spacing relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-90" />
        <div className="absolute inset-0 bg-noise" />
        <div className="container-editorial relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <p className="eyebrow mb-6">Obrigada pelo contato</p>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-graphite leading-[1.05] text-balance">
              Sua conversa foi <em className="text-rose-burnt">iniciada</em>.
              <span className="block mt-2 text-graphite/80 text-3xl md:text-5xl">Pérola já foi notificada.</span>
            </h1>
            <p className="mt-8 text-muted-foreground text-lg max-w-xl mx-auto">
              Em poucos instantes você terá um atendimento próximo, consultivo e dedicado ao seu projeto no litoral paulista.
            </p>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="glass-strong rounded-3xl p-8 text-left shadow-elegant">
                <div className="flex items-center gap-3 mb-4">
                  <span className="grid place-items-center h-10 w-10 rounded-full bg-graphite text-pearl">
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                  <span className="font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt">
                    Passo {i + 1}
                  </span>
                </div>
                <h3 className="font-display text-2xl text-graphite mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <RecommendedCarousel intent={intent} source={sourceParam} />

          <div className="mt-16 max-w-3xl mx-auto glass-strong rounded-[2rem] p-10 text-center shadow-elegant">
            <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-rose-burnt mb-4">
              Enquanto isso
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-graphite mb-4">
              Continue explorando o universo Pérola
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Acompanhe nos bastidores, lançamentos exclusivos e bairros estratégicos do litoral.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/imoveis"
                className="inline-flex items-center gap-2 rounded-full bg-graphite px-7 py-3 text-xs uppercase tracking-[0.22em] text-pearl hover:bg-rose-burnt transition-colors"
              >
                Ver portfólio
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
              <Link
                to="/lancamentos"
                className="inline-flex items-center gap-2 rounded-full border border-graphite/20 bg-pearl px-7 py-3 text-xs uppercase tracking-[0.22em] text-graphite hover:bg-graphite hover:text-pearl transition-colors"
              >
                Lançamentos
              </Link>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-graphite/20 bg-pearl px-7 py-3 text-xs uppercase tracking-[0.22em] text-graphite hover:bg-graphite hover:text-pearl transition-colors"
              >
                <Instagram className="h-4 w-4" strokeWidth={1.5} /> Instagram
              </a>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-3">Não recebeu a janela do WhatsApp?</p>
            <WaLink
              href={wa.general()}
              source="other"
              intent="general"
              label="Thanks page retry"
              onClick={() => trackWaClick({ source: "other", intent: "general", label: "thanks_retry" })}
              className="inline-flex items-center gap-2 text-graphite story-link"
            >
              <MessageCircle className="h-4 w-4 text-rose-burnt" strokeWidth={1.5} /> Abrir conversa novamente
            </WaLink>
          </div>
        </div>
      </section>
    </>
  );
}
