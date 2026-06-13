import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Home, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import Seo from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import { trackWaClick, whatsappLink, wa } from "@/lib/whatsapp";
import { WaLink } from "@/components/WaLink";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100),
  phone: z.string().trim().min(8, "Informe um telefone válido").max(20),
  email: z.string().trim().email("E-mail inválido").max(255).optional().or(z.literal("")),
  property_type: z.string().trim().min(1, "Selecione o tipo"),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  neighborhood: z.string().trim().min(2, "Informe o bairro").max(100),
  desired_price: z.string().trim().optional().or(z.literal("")),
  bedrooms: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().max(800).optional().or(z.literal("")),
});

export default function Vender() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries()) as Record<string, string>;
    const r = schema.safeParse(raw);
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => { errs[String(i.path[0])] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSending(true);

    try {
      await supabase.from("seller_leads").insert({
        name: r.data.name,
        phone: r.data.phone,
        email: r.data.email || null,
        property_type: r.data.property_type,
        address: r.data.address || null,
        neighborhood: r.data.neighborhood,
        desired_price: r.data.desired_price ? Number(r.data.desired_price.replace(/[^\d]/g, "")) || null : null,
        bedrooms: r.data.bedrooms ? Number(r.data.bedrooms) : null,
        notes: r.data.notes || null,
        source: "sell_form",
      });

      // notifica por e-mail (reusa edge function existente)
      supabase.functions.invoke("notify-lead", {
        body: {
          name: r.data.name,
          phone: r.data.phone,
          email: r.data.email || "",
          source: "captacao_imovel",
          message: `Tipo: ${r.data.property_type}\nBairro: ${r.data.neighborhood}\nEndereço: ${r.data.address || "—"}\nDormitórios: ${r.data.bedrooms || "—"}\nValor desejado: ${r.data.desired_price || "—"}\n\nObservações:\n${r.data.notes || "—"}`,
        },
      }).catch(() => {});

      const waMsg = `Olá Pérola! Quero cadastrar meu imóvel para venda.\n\nNome: ${r.data.name}\nTelefone: ${r.data.phone}\nTipo: ${r.data.property_type}\nBairro: ${r.data.neighborhood}${r.data.desired_price ? `\nValor desejado: ${r.data.desired_price}` : ""}${r.data.notes ? `\n\n${r.data.notes}` : ""}`;
      trackWaClick({ source: "other", intent: "contact_form", label: "captacao_imovel", value: 20 });
      window.open(whatsappLink(waMsg), "_blank", "noopener,noreferrer");

      toast({ title: "Cadastro recebido!", description: "A Pérola entrará em contato em breve." });
      navigate("/obrigado?from=sell_form&intent=captacao");
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao enviar", description: "Tente novamente ou fale direto no WhatsApp.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Seo
        title="Cadastre seu imóvel para venda · Pérola Patriani"
        description="Anuncie seu imóvel com a consultoria boutique de Pérola Patriani. Avaliação técnica, divulgação premium e acompanhamento completo."
        path="/vender"
      />
      <section className="container-editorial py-16">
        <p className="eyebrow mb-4">Para proprietários</p>
        <h1 className="font-display text-5xl md:text-6xl text-graphite mb-4 text-balance">
          Cadastre seu imóvel <em className="text-rose-burnt">para venda</em>
        </h1>
        <p className="text-muted-foreground max-w-2xl mb-10">
          Conte um pouco sobre o imóvel e a Pérola fará uma análise personalizada antes de entrar em contato com você.
        </p>

        <div className="grid lg:grid-cols-12 gap-12">
          <form onSubmit={onSubmit} className="lg:col-span-7 space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Nome" error={errors.name}>
                <input name="name" maxLength={100} className={inputCls} />
              </Field>
              <Field label="Telefone / WhatsApp" error={errors.phone}>
                <input name="phone" maxLength={20} className={inputCls} />
              </Field>
            </div>
            <Field label="E-mail (opcional)" error={errors.email}>
              <input name="email" type="email" maxLength={255} className={inputCls} />
            </Field>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Tipo de imóvel" error={errors.property_type}>
                <select name="property_type" className={inputCls} aria-label="Tipo de imóvel">
                  <option value="">Selecione</option>
                  <option>Apartamento</option>
                  <option>Cobertura</option>
                  <option>Casa</option>
                  <option>Casa de condomínio</option>
                  <option>Terreno</option>
                  <option>Comercial</option>
                </select>
              </Field>
              <Field label="Bairro" error={errors.neighborhood}>
                <input name="neighborhood" maxLength={100} className={inputCls} />
              </Field>
            </div>

            <Field label="Endereço (opcional)" error={errors.address}>
              <input name="address" maxLength={200} className={inputCls} placeholder="Rua, número, complemento" />
            </Field>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Dormitórios" error={errors.bedrooms}>
                <select name="bedrooms" className={inputCls} aria-label="Dormitórios">
                  <option value="">—</option>
                  <option>1</option><option>2</option><option>3</option><option>4</option><option>5</option>
                </select>
              </Field>
              <Field label="Valor desejado (R$)" error={errors.desired_price}>
                <input name="desired_price" inputMode="numeric" maxLength={15} className={inputCls} placeholder="Ex: 850000" />
              </Field>
            </div>

            <Field label="Observações" error={errors.notes}>
              <textarea name="notes" rows={4} maxLength={800} className={inputCls} placeholder="Diferenciais, urgência, situação atual…" />
            </Field>

            <button type="submit" disabled={sending} className="rounded-full bg-graphite px-8 py-4 text-xs uppercase tracking-[0.22em] text-pearl hover:bg-rose-burnt transition-colors disabled:opacity-50 inline-flex items-center gap-2">
              <Home className="h-4 w-4" strokeWidth={1.5} />
              {sending ? "Enviando…" : "Quero vender com a Pérola"}
            </button>
          </form>

          <aside className="lg:col-span-5 space-y-4">
            <div className="glass-strong rounded-3xl p-8 space-y-5">
              <h3 className="font-display text-2xl text-graphite">Por que vender comigo?</h3>
              {[
                { icon: ShieldCheck, t: "Avaliação técnica baseada em dados reais do mercado local" },
                { icon: Sparkles, t: "Divulgação premium com fotos profissionais e posicionamento estratégico" },
                { icon: MessageCircle, t: "Atendimento curado: só compradores qualificados visitam o imóvel" },
              ].map(({ icon: Icon, t }) => (
                <div key={t} className="flex items-start gap-3 text-sm text-graphite">
                  <span className="grid place-items-center h-9 w-9 rounded-full bg-blush/40 shrink-0 text-rose-burnt">
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                  <p className="leading-relaxed">{t}</p>
                </div>
              ))}
              <div className="pt-2">
                <WaLink
                  href={wa.general()}
                  source="other"
                  intent="general"
                  label="Vender via WhatsApp"
                  className="inline-flex items-center gap-2 rounded-full border border-graphite/20 px-5 py-3 text-xs uppercase tracking-[0.2em] text-graphite hover:bg-champagne transition"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Prefiro falar no WhatsApp
                </WaLink>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

const inputCls = "w-full rounded-xl bg-pearl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-burnt/40";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-editorial text-[10px] uppercase tracking-[0.3em] text-graphite block mb-2">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
