import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Instagram, Loader2 } from "lucide-react";

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
    const W = 1080;
    const H = 1350;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    const draw = (img?: HTMLImageElement) => {
      // background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#f7e7e1");
      grad.addColorStop(1, "#e8eef5");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // photo area (top 65%)
      const photoH = Math.round(H * 0.66);
      ctx.fillStyle = "#d6c5be";
      ctx.fillRect(0, 0, W, photoH);
      if (img) {
        const ratio = Math.max(W / img.width, photoH / img.height);
        const iw = img.width * ratio;
        const ih = img.height * ratio;
        ctx.drawImage(img, (W - iw) / 2, (photoH - ih) / 2, iw, ih);
      }
      // dark gradient bottom of photo
      const ph = ctx.createLinearGradient(0, photoH - 220, 0, photoH);
      ph.addColorStop(0, "rgba(0,0,0,0)");
      ph.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = ph;
      ctx.fillRect(0, photoH - 220, W, 220);

      // badge top-left
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      const badgeText = (property.purpose || "venda").toUpperCase();
      ctx.font = "600 26px Inter, system-ui, sans-serif";
      const bw = ctx.measureText(badgeText).width + 44;
      ctx.beginPath();
      ctx.roundRect(40, 40, bw, 54, 27);
      ctx.fill();
      ctx.fillStyle = "#3a2a26";
      ctx.fillText(badgeText, 62, 76);

      // neighborhood on photo
      if (property.neighborhood_name) {
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.font = "500 30px Inter, system-ui, sans-serif";
        ctx.fillText(property.neighborhood_name.toUpperCase(), 50, photoH - 110);
      }
      // title on photo
      ctx.fillStyle = "#fff";
      ctx.font = "600 52px 'Cormorant Garamond', Georgia, serif";
      wrapText(ctx, property.title, 50, photoH - 50, W - 100, 56, 2);

      // bottom content area
      const by = photoH + 50;
      // price
      ctx.fillStyle = "#7a3a3a";
      ctx.font = "700 72px 'Cormorant Garamond', Georgia, serif";
      ctx.fillText(BRL(property.price), 50, by + 60);

      // specs row
      const specs: string[] = [];
      if (property.bedrooms) specs.push(`${property.bedrooms} dorm.`);
      if (property.suites) specs.push(`${property.suites} suíte${property.suites > 1 ? "s" : ""}`);
      if (property.parking) specs.push(`${property.parking} vaga${property.parking > 1 ? "s" : ""}`);
      if (property.area_m2) specs.push(`${property.area_m2} m²`);
      ctx.fillStyle = "#3a2a26";
      ctx.font = "500 32px Inter, system-ui, sans-serif";
      ctx.fillText(specs.join("  ·  "), 50, by + 130);

      // brand footer
      ctx.fillStyle = "#3a2a26";
      ctx.fillRect(0, H - 130, W, 130);
      ctx.fillStyle = "#f4e2dc";
      ctx.font = "600 36px 'Cormorant Garamond', Georgia, serif";
      ctx.fillText("Pérola Patriani", 50, H - 75);
      ctx.font = "400 22px Inter, sans-serif";
      ctx.fillStyle = "#d8c2bb";
      ctx.fillText("Consultoria Imobiliária  ·  @perolapatriani.imoveis", 50, H - 38);
      if (property.code) {
        ctx.textAlign = "right";
        ctx.font = "500 24px Inter, sans-serif";
        ctx.fillStyle = "#f4e2dc";
        ctx.fillText(`Cód. ${property.code}`, W - 50, H - 55);
        ctx.textAlign = "left";
      }

      setReady(true);
    };

    if (property.cover_url) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => draw(img);
      img.onerror = () => draw();
      img.src = property.cover_url;
    } else {
      draw();
    }
  }, [property]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy(true);
    canvas.toBlob((blob) => {
      if (!blob) { setBusy(false); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `instagram-${(property?.code || property?.title || "imovel").toString().toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setBusy(false);
    }, "image/png");
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
          <div className="rounded-2xl overflow-hidden border border-border bg-champagne/30 max-h-[60vh] flex items-center justify-center">
            <canvas ref={canvasRef} className="max-w-full max-h-[60vh] h-auto" />
          </div>
          <p className="text-xs text-muted-foreground">
            Formato 1080×1350 (feed Instagram). Baixe e poste — pronto pra colar legenda e hashtags.
          </p>
          <button
            onClick={download}
            disabled={!ready || busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-graphite px-6 py-3 text-xs uppercase tracking-[0.22em] text-pearl disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Baixar PNG
          </button>
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
  const words = text.split(" ");
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
    // ellipsis last
    while (lines[maxLines - 1] && ctx.measureText(lines[maxLines - 1] + "…").width > maxWidth) {
      lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1);
    }
    if (words.join(" ").length > lines.join(" ").length) lines[maxLines - 1] += "…";
  }
  // draw bottom-up from y
  const startY = y - (lines.length - 1) * lineHeight;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}
