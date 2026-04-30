import { forwardRef, type AnchorHTMLAttributes, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { trackWaClick, type WaSource, type WaIntent } from "@/lib/whatsapp";

interface WaLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  source: WaSource;
  intent: WaIntent;
  label?: string;
  code?: string | null;
  value?: number;
  /** Após abrir o WhatsApp em nova aba, redireciona a aba atual para /obrigado. */
  redirectToThanks?: boolean;
}

/**
 * Link padronizado para o WhatsApp: abre em nova aba, segue boas práticas de
 * segurança e dispara o evento de conversão `whatsapp_click` em GA4/GTM/Meta.
 */
export const WaLink = forwardRef<HTMLAnchorElement, WaLinkProps>(
  ({ href, source, intent, label, code, value, redirectToThanks, onClick, children, ...rest }, ref) => {
    const navigate = useNavigate();
    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
      trackWaClick({ source, intent, label, code, value });
      onClick?.(e);
      if (redirectToThanks && !e.defaultPrevented) {
        // Deixa o navegador abrir o WhatsApp em nova aba e leva o usuário ao "obrigado".
        setTimeout(() => {
          navigate(`/obrigado?from=${source}&intent=${intent}`);
        }, 150);
      }
    };
    return (
      <a
        ref={ref}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        data-analytics="whatsapp_click"
        data-wa-source={source}
        data-wa-intent={intent}
        onClick={handleClick}
        {...rest}
      >
        {children}
      </a>
    );
  }
);
WaLink.displayName = "WaLink";
