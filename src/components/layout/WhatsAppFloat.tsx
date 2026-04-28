import { MessageCircle } from "lucide-react";
import { wa } from "@/lib/whatsapp";

export default function WhatsAppFloat() {
  return (
    <a
      href={wa.general()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Conversar no WhatsApp"
      className="fixed bottom-6 right-6 z-50 group"
    >
      <span className="absolute inset-0 rounded-full bg-blush/40 animate-ping" aria-hidden />
      <span className="relative grid place-items-center h-14 w-14 rounded-full bg-graphite text-pearl shadow-elegant transition-all duration-500 group-hover:bg-rose-burnt group-hover:scale-105">
        <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
      </span>
      <span className="absolute right-full top-1/2 -translate-y-1/2 mr-3 whitespace-nowrap rounded-full glass-strong px-4 py-2 text-xs font-editorial uppercase tracking-[0.2em] text-graphite opacity-0 -translate-x-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-0 pointer-events-none">
        Falar com Pérola
      </span>
    </a>
  );
}
