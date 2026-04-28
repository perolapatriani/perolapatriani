// WhatsApp helper — gera links com mensagem contextual
export const WHATSAPP_NUMBER = "5513991296030";
export const INSTAGRAM_URL = "https://instagram.com/perolapatriani.imoveis";
export const TIKTOK_URL = "https://tiktok.com/@pérolapatriani";
export const YOUTUBE_URL = "https://www.youtube.com/@P%C3%A9rolaPatriani";

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
