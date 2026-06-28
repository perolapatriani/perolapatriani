import { MessageCircle } from "lucide-react";
import { wa } from "@/lib/whatsapp";
import { WaLink } from "@/components/WaLink";

export default function WhatsAppFloat() {
  return (
    <WaLink
      href={wa.general()}
      source="float"
      intent="general"
      label="Floating button"
      aria-label="Conversar no WhatsApp"
      className="fixed bottom-5 right-5 z-50 group"
    >
      <span className="absolute inset-0 rounded-full bg-blush/40 animate-ping" aria-hidden />
      <span className="relative grid place-items-center h-11 w-11 rounded-full bg-graphite text-pearl shadow-elegant transition-all duration-500 group-hover:bg-rose-burnt group-hover:scale-105">
        <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
      </span>
    </WaLink>
  );
}
