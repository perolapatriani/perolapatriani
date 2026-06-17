import { Instagram, Music2, Youtube, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  caption?: string;
  /** PNG blobs/canvases to also attach via Web Share API when supported */
  getFiles?: () => Promise<File[]>;
};

const OPEN = {
  instagram: "https://www.instagram.com/",
  tiktok: "https://www.tiktok.com/upload?lang=pt-BR",
  youtube: "https://studio.youtube.com/",
};

export default function SharePostButtons({ caption, getFiles }: Props) {
  const [copied, setCopied] = useState(false);

  const copyCaption = async () => {
    if (!caption) return;
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      toast.success("Legenda copiada");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const openWith = async (target: keyof typeof OPEN) => {
    if (caption) {
      try { await navigator.clipboard.writeText(caption); toast.success("Legenda copiada · cole no app"); } catch {}
    }
    // Try Web Share with files (mobile) → opens native picker including Instagram/TikTok
    if (getFiles && (navigator as any).canShare) {
      try {
        const files = await getFiles();
        const data: any = { files, text: caption || "" };
        if ((navigator as any).canShare(data)) {
          await (navigator as any).share(data);
          return;
        }
      } catch { /* fall through */ }
    }
    window.open(OPEN[target], "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-2">
      {caption && (
        <button
          onClick={copyCaption}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-border bg-pearl px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-graphite hover:bg-champagne/40"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar legenda"}
        </button>
      )}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => openWith("instagram")} className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-white">
          <Instagram className="h-3.5 w-3.5" /> Instagram
        </button>
        <button onClick={() => openWith("tiktok")} className="inline-flex items-center justify-center gap-1.5 rounded-full bg-graphite px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-pearl">
          <Music2 className="h-3.5 w-3.5" /> TikTok
        </button>
        <button onClick={() => openWith("youtube")} className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#FF0000] px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-white">
          <Youtube className="h-3.5 w-3.5" /> YouTube
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
        No celular abre o seletor nativo (Instagram/TikTok). No desktop abre a página de upload — baixe o PNG e cole a legenda.
      </p>
    </div>
  );
}

export async function canvasToFile(canvas: HTMLCanvasElement | null, name: string): Promise<File | null> {
  if (!canvas) return null;
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        resolve(new File([blob], name, { type: "image/png" }));
      }, "image/png");
    } catch { resolve(null); }
  });
}
