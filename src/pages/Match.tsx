import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { ArrowRight, Sparkles, MessageCircle, Loader2 } from "lucide-react";
import Seo from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import { useProperties, useNeighborhoods } from "@/hooks/useContent";
import PropertyCard from "@/components/PropertyCard";
import { wa, whatsappLink, trackWaClick } from "@/lib/whatsapp";
import { toast } from "@/hooks/use-toast";

type Answers = {
  goal: string; who: string; type: string; bedrooms: string;
  budget: string; vibe: string; neighborhood: string;
};

const STEPS: { key: keyof Answers; question: string; options: string[] }[] = [
  { key: "goal", question: "Qual o seu objetivo?", options: ["Moradia principal", "Segunda moradia / praia", "Investimento", "Locação para uso"] },
  { key: "who", question: "Para quem é o imóvel?", options: ["Solo", "Casal", "Família com filhos", "Aposentadoria"] },
  { key: "type", question: "Que tipo de imóvel combina mais?", options: ["Apartamento", "Cobertura", "Casa", "Indiferente"] },
  { key: "bedrooms", question: "Quantos dormitórios?", options: ["1", "2", "3", "4 ou mais"] },
  { key: "budget", question: "Faixa de investimento?", options: ["Até R$ 500 mil", "R$ 500 mil a 1M", "R$ 1M a 2M", "Acima de R$ 2M"] },
  { key: "vibe", question: "Qual a vibe ideal?", options: ["Pé na areia", "Centro / movimento", "Sossego e verde", "Vista panorâmica"] },
];

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(20),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
});

export default function Match() {
  const { data: allProps = [] } = useProperties();
  const { data: neighborhoods = [] } = useNeighborhoods();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [askContact, setAskContact] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ propertyIds: string[]; reasoning: string } | null>(null);

  const current = STEPS[step];
  const isContactStep = step === STEPS.length; // bairro vai inline no contato
  const total = STEPS.length + 1;

  const pick = (value: string) => {
    setAnswers((a) => ({ ...a, [current.key]: value }));
    if (step < STEPS.length - 1) setStep(step + 1);
    else { setStep(step + 1); setAskContact(true); }
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      email: String(fd.get("email") ?? ""),
    };
    const neighborhood = String(fd.get("neighborhood") ?? "");
    const parsed = contactSchema.safeParse(data);
    if (!parsed.success) {
      toast({ title: "Preencha nome e telefone válidos", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("perola-match", {
        body: { ...parsed.data, answers: { ...answers, neighborhood } },
      });
      if (error) throw error;
      setResult({ propertyIds: res.property_ids ?? [], reasoning: res.reasoning ?? "" });
      setAskContact(false);
    } catch (err) {
      console.error(err);
      toast({ title: "Não consegui calcular agora", description: "Tente em alguns instantes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const recommended = result ? result.propertyIds.map((id) => allProps.find((p: any) => p.id === id)).filter(Boolean) : [];

  return (
    <>
      <Seo
        title="Match de Perfil · Pérola IA"
        description="Descubra em 1 minuto os 3 imóveis do litoral paulista que mais combinam com o seu perfil."
        path="/match"
      />
      <section className="container-editorial py-16 max-w-4xl">
        <p className="eyebrow mb-4 inline-flex items-center gap-2"><Sparkles className="h-3 w-3" /> Pérola IA</p>
        <h1 className="font-display text-5xl md:text-6xl text-graphite mb-4 text-balance">
          Match de <em className="text-rose-burnt">perfil</em>
        </h1>
        <p className="text-muted-foreground max-w-2xl mb-10">
          Responda 6 perguntas rápidas e a Pérola IA escolhe 3 imóveis do catálogo que combinam com você.
        </p>

        {/* Progress */}
        {!result && (
          <div className="mb-10">
            <div className="h-1 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-rose-burnt transition-all duration-500" style={{ width: `${((step) / total) * 100}%` }} />
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-2">
              Etapa {Math.min(step + 1, total)} de {total}
            </p>
          </div>
        )}

        {/* Quiz */}
        {!askContact && !result && !isContactStep && (
          <div className="glass-strong rounded-3xl p-8 md:p-12">
            <h2 className="font-display text-3xl md:text-4xl text-graphite mb-8">{current.question}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {current.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => pick(opt)}
                  className="group text-left rounded-2xl border border-border bg-pearl/60 px-5 py-4 hover:border-rose-burnt hover:bg-champagne transition-all"
                >
                  <span className="text-graphite font-medium">{opt}</span>
                </button>
              ))}
            </div>
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="mt-6 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-rose-burnt">
                ← voltar
              </button>
            )}
          </div>
        )}

        {/* Contact form */}
        {askContact && !result && (
          <form onSubmit={submit} className="glass-strong rounded-3xl p-8 md:p-12 space-y-5">
            <h2 className="font-display text-3xl md:text-4xl text-graphite">Quase lá — para onde envio o resultado?</h2>
            <p className="text-sm text-muted-foreground">Vou usar seus dados para te enviar os 3 imóveis selecionados pela IA + iniciar um atendimento personalizado.</p>

            <div className="grid sm:grid-cols-2 gap-4">
              <input name="name" required maxLength={100} placeholder="Nome" className={inputCls} />
              <input name="phone" required maxLength={20} placeholder="WhatsApp" className={inputCls} />
            </div>
            <input name="email" type="email" maxLength={255} placeholder="E-mail (opcional)" className={inputCls} />
            <select name="neighborhood" className={inputCls} aria-label="Bairro de interesse">
              <option value="">Bairro de preferência (opcional)</option>
              {neighborhoods.map((n: any) => <option key={n.id}>{n.name}</option>)}
            </select>

            <button type="submit" disabled={loading} className="rounded-full bg-graphite px-8 py-4 text-xs uppercase tracking-[0.22em] text-pearl hover:bg-rose-burnt transition disabled:opacity-50 inline-flex items-center gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Calculando match…</> : <>Ver meus 3 imóveis <ArrowRight className="h-4 w-4" /></>}
            </button>
            <button type="button" onClick={() => { setAskContact(false); setStep(STEPS.length - 1); }} className="block text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-rose-burnt">
              ← voltar
            </button>
          </form>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-10">
            <div className="glass-strong rounded-3xl p-8 md:p-12">
              <p className="eyebrow mb-3 inline-flex items-center gap-2"><Sparkles className="h-3 w-3" /> Análise Pérola IA</p>
              <p className="font-display text-2xl md:text-3xl text-graphite italic leading-relaxed">"{result.reasoning}"</p>
            </div>

            {recommended.length > 0 ? (
              <>
                <h2 className="font-display text-3xl md:text-4xl text-graphite">Seus 3 imóveis</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommended.map((p: any) => <PropertyCard key={p.id} p={p} />)}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Não encontrei imóveis que combinem exatamente — fale direto com a Pérola para uma busca personalizada.</p>
            )}

            <div className="flex flex-wrap gap-3">
              <a
                href={whatsappLink(`Olá Pérola! Acabei de fazer o Match de Perfil no site e gostei dos imóveis sugeridos. Podemos conversar?`)}
                target="_blank" rel="noopener noreferrer"
                onClick={() => trackWaClick({ source: "other", intent: "contact_form", label: "match_result", value: 15 })}
                className="inline-flex items-center gap-2 rounded-full bg-graphite px-8 py-4 text-xs uppercase tracking-[0.22em] text-pearl hover:bg-rose-burnt transition"
              >
                <MessageCircle className="h-4 w-4" /> Falar com a Pérola
              </a>
              <Link to="/imoveis" className="inline-flex items-center gap-2 rounded-full border border-graphite/20 px-7 py-4 text-xs uppercase tracking-[0.22em] text-graphite hover:bg-champagne transition">
                Ver todo o portfólio
              </Link>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

const inputCls = "w-full rounded-xl bg-pearl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-burnt/40";
