import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Instagram, Loader2, Music2 } from "lucide-react";

type Post = {
  title: string;
  excerpt?: string | null;
  cover_url?: string | null;
  content?: string | null;
};

type Social = {
  ig_caption?: string;
  tiktok_hook?: string;
  tiktok_body?: string;
  tiktok_cta?: string;
};

function parseSocial(content?: string | null): Social {
  if (!content) return {};
  const m = content.match(/<!--social\s*([\s\S]*?)-->/);
  if (!m) return {};
  try { return JSON.parse(m[1]); } catch { return {}; }
}

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  try {
    const res = await fetch(url, { mode: "cors", cache: "no-cache" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { resolve(img); URL.revokeObjectURL(objUrl); };
      img.onerror = () => { resolve(null); URL.revokeObjectURL(objUrl); };
      img.src = objUrl;
    });
  } catch { return null; }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, maxLines = 99) {
  const words = (text || "").split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line); line = w;
      if (lines.length === maxLines) break;
    } else line = test;
  }
  if (line && lines.length < maxLines) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh));
  return lines.length * lh;
}

function brandFooter(ctx: CanvasRenderingContext2D, W: number, H: number, tag = "@perolapatriani.imoveis") {
  ctx.fillStyle = "#3a2a26";
  ctx.fillRect(0, H - 130, W, 130);
  ctx.fillStyle = "#f4e2dc";
  ctx.font = "600 36px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText("Pérola Patriani", 50, H - 75);
  ctx.font = "400 22px Inter, sans-serif";
  ctx.fillStyle = "#d8c2bb";
  ctx.fillText(`Consultoria Imobiliária  ·  ${tag}`, 50, H - 38);
}

function bgGradient(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#f7e7e1");
  g.addColorStop(1, "#e8eef5");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = "#d6c5be";
  ctx.fillRect(x, y, w, h);
  if (img) {
    const r = Math.max(w / img.width, h / img.height);
    const iw = img.width * r, ih = img.height * r;
    ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  }
}

export default function BlogCardDialog({ post, onClose }: { post: Post | null; onClose: () => void }) {
  const igRef = useRef<HTMLCanvasElement>(null);
  const tk1 = useRef<HTMLCanvasElement>(null);
  const tk2 = useRef<HTMLCanvasElement>(null);
  const tk3 = useRef<HTMLCanvasElement>(null);
  const [tab, setTab] = useState<"ig" | "tk">("ig");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const social = useMemo(() => parseSocial(post?.content), [post]);

  useEffect(() => {
    if (!post) return;
    setReady(false);
    (async () => {
      const img = post.cover_url ? await loadImage(post.cover_url) : null;

      // ---------- INSTAGRAM 1080x1350 ----------
      if (igRef.current) {
        const W = 1080, H = 1350;
        const c = igRef.current; c.width = W; c.height = H;
        const ctx = c.getContext("2d")!;
        bgGradient(ctx, W, H);
        const photoH = Math.round(H * 0.58);
        drawCover(ctx, img, 0, 0, W, photoH);
        const grad = ctx.createLinearGradient(0, photoH - 260, 0, photoH);
        grad.addColorStop(0, "rgba(0,0,0,0)"); grad.addColorStop(1, "rgba(0,0,0,0.6)");
        ctx.fillStyle = grad; ctx.fillRect(0, photoH - 260, W, 260);

        // badge
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        const badge = "BLOG · INSIGHT";
        ctx.font = "600 26px Inter, system-ui, sans-serif";
        const bw = ctx.measureText(badge).width + 44;
        ctx.beginPath(); ctx.roundRect(40, 40, bw, 54, 27); ctx.fill();
        ctx.fillStyle = "#3a2a26"; ctx.fillText(badge, 62, 76);

        // title on photo
        ctx.fillStyle = "#fff";
        ctx.font = "600 64px 'Cormorant Garamond', Georgia, serif";
        const titleH = wrap(ctx, post.title, 50, photoH - 200, W - 100, 70, 3);

        // body area
        ctx.fillStyle = "#3a2a26";
        ctx.font = "400 34px Inter, system-ui, sans-serif";
        wrap(ctx, post.excerpt || social.ig_caption?.split("\n")[0] || "", 60, photoH + 90, W - 120, 46, 6);

        brandFooter(ctx, W, H);
      }

      // ---------- TIKTOK CAROSSEL 1080x1920 (3 slides) ----------
      const drawTikTok = (canvas: HTMLCanvasElement, kind: "hook" | "body" | "cta") => {
        const W = 1080, H = 1920;
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext("2d")!;
        bgGradient(ctx, W, H);
        const photoH = Math.round(H * 0.55);
        drawCover(ctx, img, 0, 0, W, photoH);
        const ph = ctx.createLinearGradient(0, photoH - 320, 0, photoH);
        ph.addColorStop(0, "rgba(0,0,0,0)"); ph.addColorStop(1, "rgba(0,0,0,0.7)");
        ctx.fillStyle = ph; ctx.fillRect(0, photoH - 320, W, 320);

        // top badge: slide number
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        const n = kind === "hook" ? "1 / 3" : kind === "body" ? "2 / 3" : "3 / 3";
        ctx.font = "600 30px Inter, system-ui, sans-serif";
        const bw = ctx.measureText(n).width + 48;
        ctx.beginPath(); ctx.roundRect(60, 60, bw, 60, 30); ctx.fill();
        ctx.fillStyle = "#3a2a26"; ctx.fillText(n, 84, 102);

        // overline on photo
        ctx.fillStyle = "#fff";
        ctx.font = "500 32px Inter, sans-serif";
        ctx.fillText("PÉROLA PATRIANI · BLOG", 60, photoH - 240);

        // big text on photo (white)
        ctx.fillStyle = "#fff";
        if (kind === "hook") {
          ctx.font = "700 84px 'Cormorant Garamond', Georgia, serif";
          wrap(ctx, social.tiktok_hook || post.title, 60, photoH - 160, W - 120, 92, 3);
        } else {
          ctx.font = "600 60px 'Cormorant Garamond', Georgia, serif";
          wrap(ctx, post.title, 60, photoH - 100, W - 120, 66, 2);
        }

        // body area below photo
        const by = photoH + 100;
        ctx.fillStyle = "#3a2a26";
        if (kind === "hook") {
          ctx.font = "500 42px Inter, sans-serif";
          wrap(ctx, "Arrasta pro lado →", 60, by, W - 120, 52, 1);
          ctx.font = "400 36px Inter, sans-serif";
          ctx.fillStyle = "#7a3a3a";
          wrap(ctx, post.excerpt || "", 60, by + 90, W - 120, 50, 6);
        } else if (kind === "body") {
          ctx.font = "500 48px 'Cormorant Garamond', Georgia, serif";
          ctx.fillStyle = "#7a3a3a";
          wrap(ctx, social.tiktok_body || post.excerpt || "", 60, by, W - 120, 64, 9);
        } else {
          ctx.font = "700 72px 'Cormorant Garamond', Georgia, serif";
          ctx.fillStyle = "#7a3a3a";
          wrap(ctx, social.tiktok_cta || "Fale com a Pérola", 60, by, W - 120, 84, 3);
          ctx.font = "400 36px Inter, sans-serif";
          ctx.fillStyle = "#3a2a26";
          wrap(ctx, "Toque no link da bio · perolapatriani.com.br", 60, by + 280, W - 120, 50, 2);
        }

        brandFooter(ctx, W, H);
      };

      if (tk1.current) drawTikTok(tk1.current, "hook");
      if (tk2.current) drawTikTok(tk2.current, "body");
      if (tk3.current) drawTikTok(tk3.current, "cta");

      setReady(true);
    })();
  }, [post]);

  const downloadCanvas = (c: HTMLCanvasElement | null, name: string) => {
    if (!c) return;
    const finish = (url: string, revoke = false) => {
      const a = document.createElement("a");
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      if (revoke) setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    try {
      c.toBlob((blob) => {
        if (blob) return finish(URL.createObjectURL(blob), true);
        try { finish(c.toDataURL("image/png")); } catch { alert("Erro ao baixar."); }
      }, "image/png");
    } catch {
      try { finish(c.toDataURL("image/png")); } catch { alert("Erro ao baixar."); }
    }
  };

  const slug = (post?.title || "post").toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const downloadAll = async () => {
    setBusy(true);
    if (tab === "ig") {
      downloadCanvas(igRef.current, `instagram-${slug}.png`);
    } else {
      downloadCanvas(tk1.current, `tiktok-${slug}-1.png`);
      await new Promise(r => setTimeout(r, 400));
      downloadCanvas(tk2.current, `tiktok-${slug}-2.png`);
      await new Promise(r => setTimeout(r, 400));
      downloadCanvas(tk3.current, `tiktok-${slug}-3.png`);
    }
    setBusy(false);
  };

  return (
    <Dialog open={!!post} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Instagram className="h-5 w-5 text-rose-burnt" /> Cards do post · {post?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 border-b border-border">
          <button onClick={() => setTab("ig")} className={`px-4 py-2 text-xs uppercase tracking-[0.2em] ${tab === "ig" ? "border-b-2 border-rose-burnt text-graphite" : "text-muted-foreground"}`}>
            <Instagram className="inline h-3.5 w-3.5 mr-2" />Instagram (feed)
          </button>
          <button onClick={() => setTab("tk")} className={`px-4 py-2 text-xs uppercase tracking-[0.2em] ${tab === "tk" ? "border-b-2 border-rose-burnt text-graphite" : "text-muted-foreground"}`}>
            <Music2 className="inline h-3.5 w-3.5 mr-2" />TikTok (carrossel 3)
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className={tab === "ig" ? "block" : "hidden"}>
            <div className="rounded-2xl overflow-hidden border border-border bg-champagne/30 flex items-center justify-center p-3">
              <canvas ref={igRef} className="max-w-full max-h-[55vh] h-auto" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">1080×1350 · feed Instagram</p>
            {social.ig_caption && (
              <div className="mt-3 rounded-lg border border-border bg-pearl p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Legenda sugerida</p>
                <p className="text-sm whitespace-pre-wrap">{social.ig_caption}</p>
              </div>
            )}
          </div>

          <div className={tab === "tk" ? "grid grid-cols-3 gap-3" : "hidden"}>
            {[tk1, tk2, tk3].map((r, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-border bg-champagne/30 p-2">
                <canvas ref={r} className="w-full h-auto" />
                <p className="text-[10px] text-center text-muted-foreground mt-1">Slide {i + 1}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={downloadAll}
          disabled={!ready || busy}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-graphite px-6 py-3 text-xs uppercase tracking-[0.22em] text-pearl disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {tab === "ig" ? "Baixar PNG do Instagram" : "Baixar 3 slides do TikTok"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
