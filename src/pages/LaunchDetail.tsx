import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Seo from "@/components/Seo";
import { useLaunch } from "@/hooks/useContent";
import { wa } from "@/lib/whatsapp";
import { WaLink } from "@/components/WaLink";

export default function LaunchDetail() {
  const { slug } = useParams();
  const { data: l, isLoading } = useLaunch(slug);
  if (isLoading) return <div className="container-editorial py-20 text-center">Carregando…</div>;
  if (!l) return <div className="container-editorial py-20 text-center">Lançamento não encontrado.</div>;

  return (
    <>
      <Seo title={`${l.name} · Pérola Patriani`} description={l.description ?? undefined} image={l.cover_url ?? undefined} path={`/lancamentos/${l.slug}`} />
      <section className="container-editorial py-12">
        <Link to="/lancamentos" className="inline-flex items-center gap-2 text-sm text-muted-foreground story-link mb-8">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="aspect-[16/9] rounded-3xl overflow-hidden mb-10">
          {l.cover_url && <img src={l.cover_url} alt={l.name} className="h-full w-full object-cover" />}
        </div>
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <p className="font-editorial text-xs uppercase tracking-[0.3em] text-rose-burnt">{l.location} · {l.delivery_date}</p>
            <h1 className="font-display text-5xl text-graphite">{l.name}</h1>
            <p className="text-graphite/80 leading-relaxed text-lg">{l.description}</p>
            <ul className="grid sm:grid-cols-2 gap-3 pt-4">
              {(l.highlights ?? []).map((h: string) => (
                <li key={h} className="flex items-start gap-3"><span className="mt-2 h-1 w-6 bg-rose-burnt rounded-full" />{h}</li>
              ))}
            </ul>
          </div>
          <aside>
            <div className="glass-strong rounded-3xl p-8 space-y-5 sticky top-28">
              <h3 className="font-display text-2xl text-graphite">Quero conhecer este lançamento</h3>
              <WaLink href={wa.launch(l.name)} source="launch_detail" intent="launch" label={l.name} value={15}
                className="block text-center rounded-full bg-graphite py-4 text-xs uppercase tracking-[0.22em] text-pearl hover:bg-rose-burnt transition-colors">
                Falar com Pérola
              </WaLink>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
