import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Instagram, Loader2 } from "lucide-react";
import SharePostButtons, { canvasToFile } from "./SharePostButtons";

type Property = {
  title: string;
  price: number | null;
  bedrooms?: number | null;
  suites?: number | null;
  parking?: number | null;
  area_m2?: number | null;
  neighborhood_name?: string | null;
  property_type?: string | null;
  purpose?: string | null;
  cover_url: string | null;
  code?: string | null;
};

const BRL = (v: number | null) =>
  v == null ? "Consulte" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  try {
    const res = await fetch(url, { mode: "cors", cache: "no-cache" });
    if (!res.ok) throw new Error("fetch");
    const blob = await res.blob();
    const u = URL.createObjectURL(blob);
    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { resolve(img); URL.revokeObjectURL(u); };
      img.onerror = () => { resolve(null); URL.revokeObjectURL(u); };
      img.src = u;
    });
  } catch {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }
}

export default function InstagramCardDialog({
  property,
  onClose,
}: {
  property: Property | null;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!property) return;
    setReady(false);
    let cancelled = false;

    const run = async () => {
      // Wait up to ~500ms for the canvas to be mounted by the Radix portal
      for (let i = 0; i < 30 && !canvasRef.current; i++) {
        await new Promise((r) => requestAnimationFrame(r));
      }
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;

      const W = 1080, H = 1350;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      ctx.textBaseline = "alphabetic";

      const img = property.cover_url ? await loadImage(property.cover_url) : null;
      if (cancelled) return;

      // Background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#FBF6F2");
      grad.addColorStop(1, "#F1E4DC");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Photo top 66%
      const photoH = Math.round(H * 0.66);
      ctx.fillStyle = "#D8C6BD";
      ctx.fillRect(0, 0, W, photoH);
      if (img) {
        const r = Math.max(W / img.width, photoH / img.height);
        const iw = img.width * r, ih = img.height * r;
        ctx.drawImage(img, (W - iw) / 2, (photoH - ih) / 2, iw, ih);
      }
      // Dark bottom gradient on photo
      const ph = ctx.createLinearGradient(0, photoH - 240, 0, photoH);
      ph.addColorStop(0, "rgba(0,0,0,0)");
      ph.addColorStop(1, "rgba(0,0,0,0.62)");
      ctx.fillStyle = ph;
      ctx.fillRect(0, photoH - 240, W, 240);

      // Badge top-left
      ctx.fillStyle = "#F5EDE7";
      const badgeText = (property.purpose || "venda").toUpperCase();
      ctx.font = "700 24px 'Helvetica Neue', Arial, sans-serif";
      const bw = ctx.measureText(badgeText).width + 44;
      roundRectPath(ctx, 40, 40, bw, 50, 25);
      ctx.fill();
      ctx.fillStyle = "#2A1F1C";
      ctx.fillText(badgeText, 62, 72);

      // Neighborhood
      if (property.neighborhood_name) {
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.font = "600 28px 'Helvetica Neue', Arial, sans-serif";
        ctx.fillText(property.neighborhood_name.toUpperCase(), 50, photoH - 120);
      }
      // Title on photo
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "600 56px Georgia, 'Cormorant Garamond', serif";
      wrapText(ctx, property.title, 50, photoH - 50, W - 100, 60, 2);

      // Bottom area
      const by = photoH + 50;
      ctx.fillStyle = "#A0463A";
      ctx.font = "700 76px Georgia, 'Cormorant Garamond', serif";
      ctx.fillText(BRL(property.price), 50, by + 70);

      const specs: string[] = [];
      if (property.bedrooms) specs.push(`${property.bedrooms} dorm.`);
      if (property.suites) specs.push(`${property.suites} suíte${property.suites > 1 ? "s" : ""}`);
      if (property.parking) specs.push(`${property.parking} vaga${property.parking > 1 ? "s" : ""}`);
      if (property.area_m2) specs.push(`${property.area_m2} m²`);
      ctx.fillStyle = "#2A1F1C";
      ctx.font = "500 30px 'Helvetica Neue', Arial, sans-serif";
      ctx.fillText(specs.join("  ·  "), 50, by + 130);

      // Footer
      ctx.fillStyle = "#2A1F1C";
      ctx.fillRect(0, H - 120, W, 120);
      ctx.fillStyle = "#F5EDE7";
      ctx.font = "600 34px Georgia, 'Cormorant Garamond', serif";
      ctx.fillText("Pérola Patriani", 50, H - 68);
      ctx.font = "500 20px 'Helvetica Neue', Arial, sans-serif";
      ctx.fillStyle = "#C9B8B0";
      ctx.fillText("Consultoria Imobiliária  ·  @perolapatriani.imoveis", 50, H - 34);
      if (property.code) {
        ctx.textAlign = "right";
        ctx.font = "600 22px 'Helvetica Neue', Arial, sans-serif";
        ctx.fillStyle = "#F5EDE7";
        ctx.fillText(`Cód. ${property.code}`, W - 50, H - 50);
        ctx.textAlign = "left";
      }

      setReady(true);
    };

    run();
    return () => { cancelled = true; };
  }, [property]);

  const slug = (property?.code || property?.title || "imovel").toString().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const filename = `instagram-${slug}.png`;

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy(true);
    const finish = () => setBusy(false);
    try {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = filename;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          return finish();
        }
        try {
          const dataUrl = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = dataUrl; a.download = filename;
          document.body.appendChild(a); a.click(); a.remove();
        } catch {
          alert("Não foi possível baixar.");
        }
        finish();
      }, "image/png");
    } catch {
      finish();
    }
  };

  const caption = property
    ? `${property.title}\n${property.neighborhood_name || ""}\n${BRL(property.price)}\n\nFale com a Pérola — link na bio\n\n#imoveis #${(property.neighborhood_name || "itanhaem").toLowerCase().replace(/\s+/g, "")} #baixadasantista #perolapatriani${property.code ? ` #cod${property.code}` : ""}`
    : "";

  const getFiles = async () => {
    const f = await canvasToFile(canvasRef.current, filename);
    return f ? [f] : [];
  };

  return (
    <Dialog open={!!property} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Instagram className="h-5 w-5 text-rose-burnt" /> Card para Instagram
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden border border-border bg-champagne/30 max-h-[55vh] flex items-center justify-center">
            <canvas ref={canvasRef} className="max-w-full max-h-[55vh] h-auto" />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">1080×1350 · feed Instagram</p>
          <button
            onClick={download}
            disabled={!ready || busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-graphite px-6 py-3 text-xs uppercase tracking-[0.22em] text-pearl disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Baixar PNG
          </button>
          <SharePostButtons caption={caption} getFiles={getFiles} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = (text || "").split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines) {
    while (lines[maxLines - 1] && ctx.measureText(lines[maxLines - 1] + "…").width > maxWidth) {
      lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1);
    }
    if (words.join(" ").length > lines.join(" ").length) lines[maxLines - 1] += "…";
  }
  const startY = y - (lines.length - 1) * lineHeight;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
