import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, MessageCircle } from "lucide-react";
import logo from "@/assets/logo-perola.jpg";
import { wa } from "@/lib/whatsapp";
import { WaLink } from "@/components/WaLink";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/imoveis", label: "Imóveis" },
  { to: "/mapa", label: "Mapa" },
  { to: "/lancamentos", label: "Lançamentos" },
  { to: "/bairros", label: "Bairros" },
  { to: "/sobre", label: "Sobre" },
  { to: "/blog", label: "Blog" },
  { to: "/contato", label: "Contato" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
        scrolled || open
          ? "glass-strong shadow-soft py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="w-full px-6 md:px-10 lg:px-14 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-5 group shrink-0" aria-label="Pérola Patriani — Início">
          <img
            src={logo}
            alt="Pérola Patriani Consultoria Imobiliária"
            className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-blush/30 transition-transform duration-700 group-hover:scale-105"
          />
          <div className="hidden sm:flex flex-col leading-[1.15]">
            <span className="font-display text-xl text-graphite tracking-wide">Pérola Patriani</span>
            <span className="font-editorial text-[11px] uppercase tracking-[0.28em] text-muted-foreground mt-0.5">
              Consultoria Imobiliária
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-9">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "story-link text-sm tracking-wide transition-colors",
                  isActive ? "text-graphite font-medium" : "text-muted-foreground hover:text-graphite"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <WaLink
            href={wa.general()}
            source="header"
            intent="general"
            label="Fale comigo"
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-graphite px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-pearl transition-all duration-500 hover:bg-rose-burnt hover:shadow-elegant"
          >
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
            Fale comigo
          </WaLink>

          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden rounded-full p-2 text-graphite hover:bg-champagne transition-colors"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-[max-height,opacity] duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
          open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="container-editorial flex flex-col gap-1 pt-6 pb-8">
          {NAV.map((item, i) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              style={{ animationDelay: `${i * 60}ms` }}
              className={({ isActive }) =>
                cn(
                  "animate-fade-in py-3 border-b border-border/50 font-display text-2xl transition-colors",
                  isActive ? "text-rose-burnt" : "text-graphite hover:text-rose-burnt"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <WaLink
            href={wa.general()}
            source="header_mobile"
            intent="general"
            label="Fale comigo no WhatsApp"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-graphite px-6 py-3.5 text-xs uppercase tracking-[0.2em] text-pearl"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
            Fale comigo no WhatsApp
          </WaLink>
        </nav>
      </div>
    </header>
  );
}
