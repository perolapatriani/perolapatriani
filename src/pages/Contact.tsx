import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { MessageCircle, Instagram, MapPin } from "lucide-react";
import Seo from "@/components/Seo";
import { wa, whatsappLink, trackWaClick, INSTAGRAM_URL } from "@/lib/whatsapp";
import { WaLink } from "@/components/WaLink";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100),
  phone: z.string().trim().min(8, "Informe um telefone válido").max(20),
  message: z.string().trim().min(5, "Conte um pouco sobre sua busca").max(800),
});

export default function Contact() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = { name: String(fd.get("name") ?? ""), phone: String(fd.get("phone") ?? ""), message: String(fd.get("message") ?? "") };
    const r = schema.safeParse(data);
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => { errs[String(i.path[0])] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    const msg = `Olá Pérola! Sou ${r.data.name} (${r.data.phone}).\n\n${r.data.message}`;
    trackWaClick({ source: "contact_form", intent: "contact_form", label: r.data.name, value: 10 });
    window.open(whatsappLink(msg), "_blank", "noopener,noreferrer");
    navigate("/obrigado?from=contact_form&intent=contact_form");
  };

  return (
    <>
      <Seo title="Contato · Pérola Patriani" path="/contato" />
      <section className="container-editorial py-16">
        <p className="eyebrow mb-4">Vamos conversar</p>
        <h1 className="font-display text-5xl md:text-6xl text-graphite mb-4 text-balance">
          Sua próxima decisão começa <em className="text-rose-burnt">aqui</em>
        </h1>
        <p className="text-muted-foreground max-w-xl mb-12">
          Conte um pouco sobre o que você busca e Pérola entrará em contato pessoalmente.
        </p>

        <div className="grid lg:grid-cols-12 gap-12">
          <form onSubmit={onSubmit} className="lg:col-span-7 space-y-5">
            <div>
              <label className="font-editorial text-[10px] uppercase tracking-[0.3em] text-graphite block mb-2">Nome</label>
              <input name="name" maxLength={100} className="w-full rounded-xl bg-pearl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-burnt/40" />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="font-editorial text-[10px] uppercase tracking-[0.3em] text-graphite block mb-2">Telefone / WhatsApp</label>
              <input name="phone" maxLength={20} className="w-full rounded-xl bg-pearl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-burnt/40" />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="font-editorial text-[10px] uppercase tracking-[0.3em] text-graphite block mb-2">Mensagem</label>
              <textarea name="message" rows={5} maxLength={800} className="w-full rounded-xl bg-pearl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-burnt/40" />
              {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
            </div>
            <button type="submit" className="rounded-full bg-graphite px-8 py-4 text-xs uppercase tracking-[0.22em] text-pearl hover:bg-rose-burnt transition-colors">
              Enviar pelo WhatsApp
            </button>
          </form>

          <aside className="lg:col-span-5 space-y-5">
            <div className="glass-strong rounded-3xl p-8 space-y-5">
              <h3 className="font-display text-2xl text-graphite">Atendimento direto</h3>
              <WaLink href={wa.general()} source="contact_page" intent="general" label="Phone (13) 99129-6030" className="flex items-center gap-3 text-graphite story-link"><MessageCircle className="h-4 w-4 text-rose-burnt" strokeWidth={1.5} /> (13) 99129-6030</WaLink>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-graphite story-link"><Instagram className="h-4 w-4 text-rose-burnt" strokeWidth={1.5} /> @perolapatriani.imoveis</a>
              <p className="flex items-start gap-3 text-graphite"><MapPin className="h-4 w-4 mt-0.5 text-rose-burnt" strokeWidth={1.5} /> Litoral Paulista — Atendimento sob agendamento</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
