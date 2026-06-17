import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Instagram, Loader2, Music2 } from "lucide-react";
import SharePostButtons, { canvasToFile } from "./SharePostButtons";

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

// Wrap text within maxW, returns array of lines (clamped to maxLines, with ellipsis)
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines = 99): string[] {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else line = test;
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && words.length) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(last + "…").width > maxW && last.length > 1) last = last.slice(0, -1);
    lines[maxLines - 1] = last + "…";
  }
  return lines;
}

function drawLines(ctx: CanvasRenderingContext2D, lines: string[], x: number, y: number, lh: number) {
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh));
  return lines.length * lh;
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

// Palette — high contrast, warm editorial
const COLOR = {
  cream: "#F5EDE7",
  paper: "#FBF6F2",
  ink: "#2A1F1C",
  rose: "#A0463A",
  muted: "#6B5A55",
  divider: "#D8C6BD",
};

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = COLOR.divider;
  ctx.fillRect(x, y, w, h);
  if (img) {
    const r = Math.max(w / img.width, h / img.height);
    const iw = img.width * r, ih = img.height * r;
    ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  }
}

function brandFooter(ctx: CanvasRenderingContext2D, W: number, H: number) {
  // thin top rule
  ctx.fillStyle = COLOR.ink;
  ctx.fillRect(0, H - 110, W, 110);
  ctx.fillStyle = COLOR.cream;
  ctx.font = "600 34px Georgia, 'Cormorant Garamond', serif";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Pérola Patriani", 60, H - 62);
  ctx.font = "500 20px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillStyle = "#C9B8B0";
  ctx.fillText("Consultoria Imobiliária  ·  @perolapatriani.imoveis", 60, H - 32);
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
    let cancelled = false;

    (async () => {
      const img = post.cover_url ? await loadImage(post.cover_url) : null;
      if (cancelled) return;

      // ============== INSTAGRAM 1080×1350 ==============
      if (igRef.current) {
        const W = 1080, H = 1350;
        const c = igRef.current; c.width = W; c.height = H;
        const ctx = c.getContext("2d")!;
        ctx.textBaseline = "alphabetic";

        // Paper background
        ctx.fillStyle = COLOR.paper;
        ctx.fillRect(0, 0, W, H);

        // Top photo block (clean, no overlay)
        const photoH = 720;
        drawCover(ctx, img, 0, 0, W, photoH);

        // Badge over photo, top-left
        ctx.fillStyle = COLOR.cream;
        const badge = "BLOG  ·  INSIGHT";
        ctx.font = "700 22px 'Helvetica Neue', Arial, sans-serif";
        const bw = ctx.measureText(badge).width + 40;
        roundRectPath(ctx, 40, 40, bw, 46, 23); ctx.fill();
        ctx.fillStyle = COLOR.ink;
        ctx.fillText(badge, 60, 70);

        // Content block on cream paper
        const padX = 70;
        const startY = photoH + 80;

        // Title (serif, dark, max 4 lines)
        ctx.fillStyle = COLOR.ink;
        ctx.font = "600 60px Georgia, 'Cormorant Garamond', serif";
        const titleLines = wrapLines(ctx, post.title, W - padX * 2, 4);
        const titleH = drawLines(ctx, titleLines, padX, startY, 68);

        // Divider
        const divY = startY + titleH + 30;
        ctx.fillStyle = COLOR.rose;
        ctx.fillRect(padX, divY, 80, 4);

        // Excerpt (sans, muted)
        ctx.fillStyle = COLOR.muted;
        ctx.font = "400 28px 'Helvetica Neue', Arial, sans-serif";
        const exLines = wrapLines(ctx, post.excerpt || "", W - padX * 2, 4);
        drawLines(ctx, exLines, padX, divY + 50, 40);

        brandFooter(ctx, W, H);
      }

      // ============== TIKTOK 1080×1920 (3 slides) ==============
      const drawTikTok = (canvas: HTMLCanvasElement, kind: "hook" | "body" | "cta") => {
        const W = 1080, H = 1920;
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext("2d")!;
        ctx.textBaseline = "alphabetic";

        // SAFE AREA: TikTok overlays UI on the right (~120px) and bottom (~340px)
        const SAFE_X = 80;
        const SAFE_TOP = 200;       // status bar / top UI
        const SAFE_BOTTOM = 420;    // caption + buttons
        const safeRight = W - SAFE_X - 140; // avoid right action bar
        const textW = safeRight - SAFE_X;

        // Background
        ctx.fillStyle = COLOR.paper;
        ctx.fillRect(0, 0, W, H);

        // Photo top (smaller so text below stays in safe area)
        const photoH = 900;
        drawCover(ctx, img, 0, 0, W, photoH);

        // Subtle bottom-fade on photo so badge contrast is fine
        const grad = ctx.createLinearGradient(0, photoH - 200, 0, photoH);
        grad.addColorStop(0, "rgba(42,31,28,0)");
        grad.addColorStop(1, "rgba(42,31,28,0.55)");
        ctx.fillStyle = grad; ctx.fillRect(0, photoH - 200, W, 200);

        // Slide badge (inside safe top)
        ctx.fillStyle = COLOR.cream;
        const n = kind === "hook" ? "1 / 3" : kind === "body" ? "2 / 3" : "3 / 3";
        ctx.font = "700 26px 'Helvetica Neue', Arial, sans-serif";
        const bw = ctx.measureText(n).width + 40;
        roundRectPath(ctx, SAFE_X, SAFE_TOP, bw, 52, 26); ctx.fill();
        ctx.fillStyle = COLOR.ink;
        ctx.fillText(n, SAFE_X + 20, SAFE_TOP + 34);

        // Overline on photo
        ctx.fillStyle = COLOR.cream;
        ctx.font = "600 26px 'Helvetica Neue', Arial, sans-serif";
        ctx.fillText("PÉROLA PATRIANI  ·  BLOG", SAFE_X, photoH - 80);

        // Headline on photo bottom
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "700 48px Georgia, 'Cormorant Garamond', serif";
        const head = kind === "hook"
          ? (social.tiktok_hook || post.title)
          : post.title;
        const headLines = wrapLines(ctx, head, textW, 2);
        // place at bottom of photo
        const headStartY = photoH - 30 - (headLines.length - 1) * 56;
        drawLines(ctx, headLines, SAFE_X, headStartY, 56);

        // ====== Body area BELOW photo, within safe-bottom margin ======
        const bodyTop = photoH + 70;
        const bodyBottom = H - SAFE_BOTTOM - 40; // keep clear of TikTok caption area
        const bodyH = bodyBottom - bodyTop;

        ctx.fillStyle = COLOR.ink;

        if (kind === "hook") {
          ctx.font = "700 38px 'Helvetica Neue', Arial, sans-serif";
          ctx.fillStyle = COLOR.rose;
          ctx.fillText("Arraste para o lado →", SAFE_X, bodyTop + 20);

          ctx.fillStyle = COLOR.muted;
          ctx.font = "400 32px 'Helvetica Neue', Arial, sans-serif";
          const lines = wrapLines(ctx, post.excerpt || "", textW, 5);
          drawLines(ctx, lines, SAFE_X, bodyTop + 90, 44);
        } else if (kind === "body") {
          ctx.fillStyle = COLOR.ink;
          ctx.font = "500 36px Georgia, 'Cormorant Garamond', serif";
          const text = social.tiktok_body || post.excerpt || "";
          // dynamic max lines based on safe area
          const maxLines = Math.max(3, Math.floor((bodyH - 40) / 52));
          const lines = wrapLines(ctx, text, textW, maxLines);
          drawLines(ctx, lines, SAFE_X, bodyTop + 20, 52);
        } else {
          ctx.fillStyle = COLOR.rose;
          ctx.font = "700 56px Georgia, 'Cormorant Garamond', serif";
          const ctaLines = wrapLines(ctx, social.tiktok_cta || "Fale com a Pérola", textW, 3);
          drawLines(ctx, ctaLines, SAFE_X, bodyTop + 30, 70);

          ctx.fillStyle = COLOR.muted;
          ctx.font = "500 30px 'Helvetica Neue', Arial, sans-serif";
          ctx.fillText("Link na bio  ·  perolapatriani.com.br", SAFE_X, bodyTop + 30 + ctaLines.length * 70 + 50);
        }

        brandFooter(ctx, W, H);
      };

      if (tk1.current) drawTikTok(tk1.current, "hook");
      if (tk2.current) drawTikTok(tk2.current, "body");
      if (tk3.current) drawTikTok(tk3.current, "cta");

      if (!cancelled) setReady(true);
    })();

    return () => { cancelled = true; };
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

  const getFiles = async () => {
    if (tab === "ig") {
      const f = await canvasToFile(igRef.current, `instagram-${slug}.png`);
      return f ? [f] : [];
    }
    const f1 = await canvasToFile(tk1.current, `tiktok-${slug}-1.png`);
    const f2 = await canvasToFile(tk2.current, `tiktok-${slug}-2.png`);
    const f3 = await canvasToFile(tk3.current, `tiktok-${slug}-3.png`);
    return [f1, f2, f3].filter(Boolean) as File[];
  };

  const caption = tab === "ig"
    ? (social.ig_caption || `${post?.title}\n\n${post?.excerpt || ""}\n\n#imoveis #itanhaem #baixadasantista #perolapatriani`)
    : `${social.tiktok_hook || post?.title}\n\n${social.tiktok_body || post?.excerpt || ""}\n\n${social.tiktok_cta || ""}\n\n#imoveis #itanhaem #fyp`;

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

        <div className="space-y-4 max-h-[55vh] overflow-y-auto">
          <div className={tab === "ig" ? "block" : "hidden"}>
            <div className="rounded-2xl overflow-hidden border border-border bg-champagne/30 flex items-center justify-center p-3">
              <canvas ref={igRef} className="max-w-full max-h-[50vh] h-auto" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">1080×1350 · feed Instagram</p>
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

        <div className="space-y-3 pt-2">
          <button
            onClick={downloadAll}
            disabled={!ready || busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-graphite px-6 py-3 text-xs uppercase tracking-[0.22em] text-pearl disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {tab === "ig" ? "Baixar PNG do Instagram" : "Baixar 3 slides do TikTok"}
          </button>
          <SharePostButtons caption={caption} getFiles={getFiles} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
