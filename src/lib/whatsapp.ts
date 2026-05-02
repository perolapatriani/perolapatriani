// WhatsApp helper — gera links com mensagem contextual e rastreia conversões
export const WHATSAPP_NUMBER = "5513991296030";
export const INSTAGRAM_URL = "https://instagram.com/perolapatriani.imoveis";
export const TIKTOK_URL = "https://www.tiktok.com/@perolapatriani";
export const YOUTUBE_URL = "https://www.youtube.com/@P%C3%A9rolaPatriani";

export type WaSource =
  | "header"
  | "header_mobile"
  | "hero"
  | "hero_search"
  | "float"
  | "footer"
  | "footer_phone"
  | "about"
  | "featured_properties"
  | "launches_section"
  | "final_cta"
  | "property_detail"
  | "launch_detail"
  | "neighborhood_detail"
  | "contact_page"
  | "contact_form"
  | "other";

export type WaIntent =
  | "general"
  | "schedule"
  | "search"
  | "property"
  | "launch"
  | "neighborhood"
  | "contact_form";

export interface WaTrackPayload {
  source: WaSource;
  intent: WaIntent;
  label?: string;
  code?: string | null;
  value?: number;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
  }
}

/** Dispara o evento de conversão para qualquer ferramenta de analytics presente. */
export function trackWaClick(payload: WaTrackPayload) {
  if (typeof window === "undefined") return;
  const data = {
    event: "whatsapp_click",
    conversion: true,
    wa_source: payload.source,
    wa_intent: payload.intent,
    wa_label: payload.label ?? null,
    wa_code: payload.code ?? null,
    value: payload.value ?? 1,
    currency: "BRL",
    timestamp: new Date().toISOString(),
  };

  try {
    // Google Tag Manager / GA4 dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);

    // GA4 direct (se gtag estiver carregado)
    window.gtag?.("event", "whatsapp_click", {
      event_category: "engagement",
      event_label: payload.source,
      wa_intent: payload.intent,
      wa_label: payload.label,
      wa_code: payload.code,
      value: payload.value ?? 1,
    });
    window.gtag?.("event", "conversion", {
      send_to: "whatsapp",
      event_label: payload.source,
      value: payload.value ?? 1,
      currency: "BRL",
    });

    // Meta Pixel
    window.fbq?.("trackCustom", "WhatsAppClick", data);
    window.fbq?.("track", "Contact", { source: payload.source });

    // Custom DOM event — útil para listeners internos / debug
    window.dispatchEvent(new CustomEvent("perola:wa_click", { detail: data }));

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info("[wa_click]", data);
    }
  } catch {
    /* noop — analytics nunca deve quebrar o clique */
  }
}

export function whatsappLink(message: string) {
  const text = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export const wa = {
  general: () =>
    whatsappLink("Olá Pérola! Vim pelo site e gostaria de conversar com você."),

  property: (code: string | null | undefined, title: string) =>
    whatsappLink(
      `Olá Pérola! Tenho interesse no imóvel${code ? ` ${code}` : ""} — ${title}. Pode me passar mais detalhes?`
    ),

  launch: (name: string) =>
    whatsappLink(
      `Olá Pérola! Quero conhecer o lançamento ${name}. Pode me enviar mais informações?`
    ),

  neighborhood: (name: string) =>
    whatsappLink(`Olá Pérola! Tenho interesse em imóveis no bairro ${name}.`),

  schedule: () =>
    whatsappLink(
      "Olá Pérola! Gostaria de agendar um atendimento consultivo com você."
    ),

  search: (filters: {
    type?: string;
    purpose?: string;
    neighborhood?: string;
    priceRange?: string;
    code?: string;
  }) => {
    const parts: string[] = ["Olá Pérola! Estou em busca de um imóvel:"];
    if (filters.code) parts.push(`Código: ${filters.code}`);
    if (filters.type) parts.push(`Tipo: ${filters.type}`);
    if (filters.purpose) parts.push(`Finalidade: ${filters.purpose}`);
    if (filters.neighborhood) parts.push(`Bairro: ${filters.neighborhood}`);
    if (filters.priceRange) parts.push(`Faixa de valor: ${filters.priceRange}`);
    return whatsappLink(parts.join("\n"));
  },
};

export function formatPrice(value?: number | null) {
  if (!value) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}
