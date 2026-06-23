import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Languages, Megaphone, ImageIcon, Copy, Loader2, X } from "lucide-react";

type Property = {
  title: string; description: string | null; property_type: string; purpose: string;
  price: number | null; bedrooms: number; suites: number; parking: number;
  area_m2: number | null; neighborhood_name: string | null; photos: string[]; code: string | null;
};

type Tab = "translate" | "social" | "alts" | null;

export default function PropertyAiTools({ editing }: { editing: Property }) {
  const [tab, setTab] = useState<Tab>(null);
  const [loading, setLoading] = useState(false);
  const [translate, setTranslate] = useState<any>(null);
  const [social, setSocial] = useState<any>(null);
  const [alts, setAlts] = useState<string[] | null>(null);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado");
  };

  const runTranslate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("translate-property", {
        body: { title: editing.title, description: editing.description ?? "" },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setTranslate((data as any).data);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };

  const runSocial = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-social-content", {
        body: { property: editing },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setSocial((data as any).data);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };

  const runAlts = async () => {
    if (!editing.photos?.length) { toast.error("Adicione fotos primeiro"); return; }
    setLoading(true);
    try {
      const ctx = `${editing.property_type} em ${editing.neighborhood_name ?? "—"} — ${editing.bedrooms} dorm, ${editing.area_m2 ?? "?"} m²`;
      const { data, error } = await supabase.functions.invoke("generate-alt-text", {
        body: { urls: editing.photos.slice(0, 12), context: ctx },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setAlts((data as any).alts ?? []);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };

  const open = (t: Tab, runner: () => Promise<void>) => {
    setTab(t);
    runner();
  };

  return (
    <div className="luxe-card p-5 space-y-4 border border-rose-burnt/20 bg-blush/20">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="grid place-items-center h-9 w-9 rounded-full bg-rose-burnt/15 text-rose-burnt"><Sparkles className="h-4 w-4" /></span>
          <div>
            <p className="font-display text-lg text-graphite leading-tight">Marketing IA</p>
            <p className="text-xs text-muted-foreground">Tradução, redes sociais e alt text — tudo grátis com Gemini.</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <PillBtn onClick={() => open("translate", runTranslate)} icon={<Languages className="h-3.5 w-3.5" />}>Traduzir EN / ES</PillBtn>
          <PillBtn onClick={() => open("social", runSocial)} icon={<Megaphone className="h-3.5 w-3.5" />}>Carrossel + TikTok</PillBtn>
          <PillBtn onClick={() => open("alts", runAlts)} icon={<ImageIcon className="h-3.5 w-3.5" />}>Alt text das fotos</PillBtn>
        </div>
      </div>

      {tab && (
        <div className="luxe-card p-4 bg-pearl/70 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-base text-graphite">
              {tab === "translate" && "Tradução EN / ES"}
              {tab === "social" && "Conteúdo para redes"}
              {tab === "alts" && "Alt text das fotos"}
            </h4>
            <button onClick={() => { setTab(null); setTranslate(null); setSocial(null); setAlts(null); }} className="p-1 rounded-full hover:bg-champagne"><X className="h-4 w-4" /></button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Gerando com IA…</div>
          )}

          {tab === "translate" && translate && (
            <div className="grid md:grid-cols-2 gap-4">
              {(["en", "es"] as const).map((lng) => (
                <div key={lng} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.2em] text-rose-burnt font-semibold">{lng === "en" ? "Inglês" : "Espanhol"}</p>
                    <button onClick={() => copy(`${translate[lng].title}\n\n${translate[lng].description}`)} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-graphite"><Copy className="h-3 w-3" /> Copiar</button>
                  </div>
                  <p className="font-medium text-graphite text-sm">{translate[lng].title}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{translate[lng].description}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "social" && social && (
            <div className="space-y-5">
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-rose-burnt font-semibold">Carrossel Instagram</p>
                  <button onClick={() => copy(`${social.instagram_carousel.caption}\n\n${social.instagram_carousel.hashtags.join(" ")}`)} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-graphite"><Copy className="h-3 w-3" /> Copiar legenda</button>
                </div>
                <ol className="space-y-2">
                  {social.instagram_carousel.slides.map((s: any, i: number) => (
                    <li key={i} className="text-sm border-l-2 border-rose-burnt/40 pl-3">
                      <span className="text-xs text-muted-foreground">Slide {i + 1}</span>
                      <p className="font-medium text-graphite">{s.title}</p>
                      <p className="text-muted-foreground">{s.subtitle}</p>
                    </li>
                  ))}
                </ol>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed pt-2">{social.instagram_carousel.caption}</p>
                <p className="text-xs text-rose-burnt">{social.instagram_carousel.hashtags.join(" ")}</p>
              </section>

              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-rose-burnt font-semibold">Roteiro TikTok / Reels</p>
                  <button onClick={() => copy(JSON.stringify(social.tiktok_script, null, 2))} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-graphite"><Copy className="h-3 w-3" /> Copiar tudo</button>
                </div>
                <p className="text-sm"><span className="font-medium">Hook: </span>{social.tiktok_script.hook}</p>
                <ol className="space-y-2">
                  {social.tiktok_script.scenes.map((s: any, i: number) => (
                    <li key={i} className="text-sm border-l-2 border-rose-burnt/40 pl-3">
                      <span className="text-xs text-muted-foreground">Cena {i + 1}</span>
                      <p><span className="font-medium">Visual:</span> {s.visual}</p>
                      <p><span className="font-medium">Voz:</span> {s.voiceover}</p>
                      {s.onscreen_text && <p><span className="font-medium">Tela:</span> {s.onscreen_text}</p>}
                    </li>
                  ))}
                </ol>
                <p className="text-sm"><span className="font-medium">CTA:</span> {social.tiktok_script.cta}</p>
                <p className="text-sm"><span className="font-medium">Áudio sugerido:</span> {social.tiktok_script.suggested_audio}</p>
              </section>
            </div>
          )}

          {tab === "alts" && alts && (
            <div className="grid sm:grid-cols-2 gap-3">
              {editing.photos.slice(0, alts.length).map((u, i) => (
                <div key={i} className="flex gap-3 items-start text-sm">
                  <img src={u} alt="" className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-muted-foreground">{alts[i]}</p>
                    <button onClick={() => copy(alts[i])} className="text-xs flex items-center gap-1 text-rose-burnt mt-1 hover:underline"><Copy className="h-3 w-3" /> Copiar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PillBtn({ onClick, icon, children }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs rounded-full bg-pearl border border-rose-burnt/30 text-graphite px-3 py-1.5 hover:bg-rose-burnt hover:text-pearl transition"
    >
      {icon} {children}
    </button>
  );
}
