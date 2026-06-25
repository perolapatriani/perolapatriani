import { Instagram, Music2, Youtube, Copy, Check, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  caption?: string;
  /** PNG blobs/canvases to also attach via Web Share API when supported (mobile) */
  getFiles?: () => Promise<File[]>;
};

const LINKS = {
  instagram: { href: "https://www.instagram.com/", label: "Instagram", Icon: Instagram, className: "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white" },
  tiktok:    { href: "https://www.tiktok.com/upload?lang=pt-BR", label: "TikTok", Icon: Music2, className: "bg-graphite text-pearl" },
  youtube:   { href: "https://studio.youtube.com/", label: "YouTube", Icon: Youtube, className: "bg-[#FF0000] text-white" },
};

export default function SharePostButtons({ caption, getFiles }: Props) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const canNativeShare = typeof navigator !== "undefined" && !!(navigator as any).canShare;

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

  const nativeShare = async () => {
    if (!getFiles) return;
    setSharing(true);
    try {
      const files = await getFiles();
      const data: any = { files, text: caption || "" };
      if ((navigator as any).canShare?.(data)) {
        await (navigator as any).share(data);
      } else {
        toast.error("Compartilhamento nativo indisponível");
      }
    } catch {
      // user cancel
    } finally {
      setSharing(false);
    }
  };

  // Open in the TOP window (escape preview iframe) and copy caption in background
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (caption) {
      navigator.clipboard?.writeText(caption).then(
        () => toast.success("Legenda copiada — cole no app"),
        () => {},
      );
    }
    try {
      const top = window.top || window;
      top.open(href, "_blank", "noopener,noreferrer");
    } catch {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="space-y-3">
      {caption && (
        <button
          type="button"
          onClick={copyCaption}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-border bg-pearl px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-graphite hover:bg-champagne/40"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar legenda"}
        </button>
      )}

      {canNativeShare && getFiles && (
        <button
          type="button"
          onClick={nativeShare}
          disabled={sharing}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-rose-burnt px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] text-pearl disabled:opacity-50"
        >
          <Share2 className="h-3.5 w-3.5" />
          {sharing ? "Abrindo…" : "Compartilhar (celular)"}
        </button>
      )}

      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(LINKS) as Array<keyof typeof LINKS>).map((k) => {
          const { href, label, Icon, className } = LINKS[k];
          return (
            <a
              key={k}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleLinkClick}
              className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[10px] uppercase tracking-[0.18em] ${className}`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </a>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
        Baixe o PNG, clique no botão da rede e cole a legenda (já copiada) no app.
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
