import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Instagram, MessageCircle, MapPin, Mail } from "lucide-react";
import logo from "@/assets/logo-perola.jpg";
import { wa, INSTAGRAM_URL, TIKTOK_URL, YOUTUBE_URL } from "@/lib/whatsapp";
import { WaLink } from "@/components/WaLink";

const TikTokIcon = forwardRef<SVGSVGElement, { className?: string }>(({ className }, ref) => (
  <svg ref={ref} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
));
TikTokIcon.displayName = "TikTokIcon";

const YouTubeIcon = forwardRef<SVGSVGElement, { className?: string }>(({ className }, ref) => (
  <svg ref={ref} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.5C5.12 20 12 20 12 20s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.83Z" />
    <path d="m9.75 15.02 5.5-3.27-5.5-3.27Z" />
  </svg>
));
YouTubeIcon.displayName = "YouTubeIcon";

export default function Footer() {
  return (
    <footer className="relative mt-20 bg-graphite text-pearl/90">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blush/30 to-transparent" />

      <div className="container-editorial pt-20 pb-10">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-4">
              <img src={logo} alt="" className="h-12 w-12 rounded-full object-cover ring-1 ring-blush/40" />
              <div>
                <div className="font-display text-2xl text-pearl">Pérola Patriani</div>
                <div className="font-editorial text-[11px] uppercase tracking-[0.32em] text-pearl/60">
                  Consultoria Imobiliária
                </div>
              </div>
            </div>
            <p className="font-display text-xl text-pearl/85 leading-relaxed max-w-md">
              Estratégia, transparência e elegância em cada negociação. Consultoria imobiliária no litoral paulista.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="grid place-items-center h-10 w-10 rounded-full border border-pearl/20 hover:border-blush hover:bg-blush/10 transition-colors">
                <Instagram className="h-4 w-4" strokeWidth={1.5} />
              </a>
              <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" aria-label="TikTok"
                className="grid place-items-center h-10 w-10 rounded-full border border-pearl/20 hover:border-blush hover:bg-blush/10 transition-colors">
                <TikTokIcon className="h-4 w-4" />
              </a>
              <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                className="grid place-items-center h-10 w-10 rounded-full border border-pearl/20 hover:border-blush hover:bg-blush/10 transition-colors">
                <YouTubeIcon className="h-4 w-4" />
              </a>
              <WaLink href={wa.general()} source="footer" intent="general" label="WhatsApp icon" aria-label="WhatsApp"
                className="grid place-items-center h-10 w-10 rounded-full border border-pearl/20 hover:border-blush hover:bg-blush/10 transition-colors">
                <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
              </WaLink>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-editorial text-xs uppercase tracking-[0.3em] text-blush">Navegação</h4>
            <ul className="space-y-2.5 text-sm text-pearl/70">
              {[
                ["Início", "/"],
                ["Imóveis", "/imoveis"],
                ["Lançamentos", "/lancamentos"],
                ["Bairros", "/bairros"],
                ["Sobre", "/sobre"],
                ["Blog", "/blog"],
                ["Contato", "/contato"],
              ].map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="story-link hover:text-blush transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <h4 className="font-editorial text-xs uppercase tracking-[0.3em] text-blush">Contato</h4>
            <ul className="space-y-3 text-sm text-pearl/75">
              <li className="flex items-start gap-3">
                <MessageCircle className="h-4 w-4 mt-0.5 text-blush" strokeWidth={1.5} />
                <WaLink href={wa.general()} source="footer_phone" intent="general" label="Phone (13) 99129-6030" className="story-link">
                  (13) 99129-6030
                </WaLink>
              </li>
              <li className="flex items-start gap-3">
                <Instagram className="h-4 w-4 mt-0.5 text-blush" strokeWidth={1.5} />
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="story-link">
                  @perolapatriani.imoveis
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-blush" strokeWidth={1.5} />
                <span>Litoral Paulista · Atendimento sob agendamento</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-0.5 text-blush" strokeWidth={1.5} />
                <span>CRECI 234421</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-pearl/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-pearl/50">
          <p>© {new Date().getFullYear()} Pérola Patriani Consultoria Imobiliária. Todos os direitos reservados.</p>
          <p className="font-editorial uppercase tracking-[0.3em]">Estratégia & elegância imobiliária</p>
        </div>
      </div>
    </footer>
  );
}
