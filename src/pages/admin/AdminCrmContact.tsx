import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Phone, Mail, MessageCircle, Sparkles, Plus, Flame, Thermometer, ThermometerSnowflake } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const STATUSES = [
  { value: "novo", label: "Novo" },
  { value: "em_contato", label: "Em contato" },
  { value: "qualificado", label: "Qualificado" },
  { value: "visitando", label: "Visitando" },
  { value: "proposta", label: "Proposta" },
  { value: "fechado", label: "Fechado" },
  { value: "perdido", label: "Perdido" },
];

const EVENT_LABEL: Record<string, string> = {
  form_contato: "Formulário de contato",
  form_avaliacao: "Pedido de avaliação",
  form_match: "Quiz Match IA",
  status_change: "Mudança de status",
  note: "Nota interna",
  ai_qualify: "Qualificação IA",
};

function Score({ s }: { s: string | null }) {
  if (!s) return null;
  const m: Record<string, { cls: string; Icon: typeof Flame; label: string }> = {
    quente: { cls: "bg-rose-100 text-rose-800", Icon: Flame, label: "Quente" },
    morno: { cls: "bg-amber-100 text-amber-800", Icon: Thermometer, label: "Morno" },
    frio: { cls: "bg-sky-100 text-sky-800", Icon: ThermometerSnowflake, label: "Frio" },
  };
  const it = m[s] ?? { cls: "bg-muted", Icon: Thermometer, label: s };
  const { Icon } = it;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 ${it.cls}`}>
      <Icon className="h-3 w-3" /> {it.label}
    </span>
  );
}

export default function AdminCrmContact() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [qualifying, setQualifying] = useState(false);

  const { data: contact, isLoading } = useQuery({
    queryKey: ["crm_contact", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_contacts" as any).select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["crm_events", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_events" as any)
        .select("*").eq("contact_id", id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!id,
  });

  const updateContact = useMutation({
    mutationFn: async (patch: any) => {
      const { error } = await supabase.from("crm_contacts" as any).update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm_contact", id] }),
  });

  const addEvent = useMutation({
    mutationFn: async (ev: { type: string; title: string; payload?: any }) => {
      const { error } = await supabase.from("crm_events" as any).insert({
        contact_id: id, type: ev.type, title: ev.title, payload: ev.payload ?? {},
      });
      if (error) throw error;
      await supabase.from("crm_contacts" as any).update({ last_interaction_at: new Date().toISOString() }).eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm_events", id] });
      qc.invalidateQueries({ queryKey: ["crm_contact", id] });
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Carregando…</p>;
  if (!contact) return <p className="text-muted-foreground">Contato não encontrado.</p>;

  const changeStatus = async (s: string) => {
    await updateContact.mutateAsync({ status: s });
    await addEvent.mutateAsync({ type: "status_change", title: `Status → ${STATUSES.find((x) => x.value === s)?.label ?? s}`, payload: { status: s } });
    toast({ title: "Status atualizado" });
  };

  const saveNote = async () => {
    if (!note.trim()) return;
    await addEvent.mutateAsync({ type: "note", title: "Nota interna", payload: { text: note.trim() } });
    setNote("");
    toast({ title: "Nota adicionada" });
  };

  const qualify = async () => {
    // Find latest contact_lead for this person and qualify it
    const phoneN = (contact.phone_normalized ?? "").trim();
    const emailN = (contact.email_normalized ?? "").trim();
    setQualifying(true);
    try {
      let lead: any = null;
      if (phoneN) {
        const { data } = await supabase.from("contact_leads").select("id,phone,email,created_at").order("created_at", { ascending: false });
        lead = (data ?? []).find((l: any) => (l.phone ?? "").replace(/\D/g, "") === phoneN);
        if (!lead && emailN) lead = (data ?? []).find((l: any) => (l.email ?? "").toLowerCase().trim() === emailN);
      }
      if (!lead) {
        toast({ title: "Sem mensagem original para qualificar", description: "Adicione uma nota com o contexto antes." });
        return;
      }
      const { data, error } = await supabase.functions.invoke("qualify-lead", { body: { id: lead.id } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      // Pull updated score from contact_leads and copy to crm_contact
      const { data: refreshed } = await supabase.from("contact_leads").select("ai_score,ai_summary,ai_suggested_reply").eq("id", lead.id).maybeSingle();
      if (refreshed) {
        await updateContact.mutateAsync({
          ai_score: refreshed.ai_score, ai_summary: refreshed.ai_summary,
          ai_suggested_reply: refreshed.ai_suggested_reply, ai_qualified_at: new Date().toISOString(),
        });
        await addEvent.mutateAsync({ type: "ai_qualify", title: `IA: ${refreshed.ai_score ?? "analisado"}`, payload: refreshed });
      }
      toast({ title: "Qualificado pela IA ✨" });
    } catch (e: any) {
      toast({ title: "Falha", description: e.message, variant: "destructive" });
    } finally {
      setQualifying(false);
    }
  };

  const wa = contact.phone_normalized ? `https://wa.me/${contact.phone_normalized}` : null;

  return (
    <div className="space-y-6">
      <Link to="/admin/crm" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-graphite">
        <ArrowLeft className="h-4 w-4" /> Voltar ao CRM
      </Link>

      <div className="glass-strong rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-3xl text-graphite">{contact.name || "(sem nome)"}</h1>
              <Score s={contact.ai_score} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Criado em {new Date(contact.created_at).toLocaleString("pt-BR")} · Origem: {contact.source_first ?? "—"}
            </p>
          </div>
          <select
            value={contact.status}
            onChange={(e) => changeStatus(e.target.value)}
            className="text-sm rounded-full px-3 py-2 border border-border bg-pearl/70"
          >
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          {contact.raw_phone && (
            <a href={`tel:${contact.raw_phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:bg-champagne">
              <Phone className="h-3.5 w-3.5 text-rose-burnt" /> {contact.raw_phone}
            </a>
          )}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          )}
          {contact.raw_email && (
            <a href={`mailto:${contact.raw_email}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:bg-champagne">
              <Mail className="h-3.5 w-3.5 text-rose-burnt" /> {contact.raw_email}
            </a>
          )}
          <button onClick={qualify} disabled={qualifying} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rose-burnt/40 text-rose-burnt hover:bg-rose-burnt/10 disabled:opacity-50">
            <Sparkles className="h-3.5 w-3.5" /> {qualifying ? "Analisando…" : "Qualificar com IA"}
          </button>
        </div>

        {contact.ai_summary && (
          <div className="rounded-xl bg-blush/30 border border-rose-burnt/20 p-4">
            <p className="text-[10px] uppercase tracking-widest text-rose-burnt mb-1">Análise IA</p>
            <p className="text-sm text-graphite leading-relaxed">{contact.ai_summary}</p>
            {contact.ai_suggested_reply && (
              <div className="mt-3 bg-pearl/70 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Resposta sugerida</p>
                <p className="text-sm text-graphite whitespace-pre-wrap">{contact.ai_suggested_reply}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="glass-strong rounded-2xl p-6 space-y-3">
        <p className="font-editorial text-[10px] uppercase tracking-[0.2em] text-rose-burnt">Adicionar nota</p>
        <div className="flex gap-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Escreva uma observação sobre este contato…"
            className="flex-1 rounded-xl border border-border bg-pearl/70 px-3 py-2 text-sm"
          />
          <button onClick={saveNote} className="inline-flex items-center gap-1.5 self-start px-4 py-2 rounded-full bg-graphite text-pearl text-xs uppercase tracking-[0.2em]">
            <Plus className="h-3.5 w-3.5" /> Salvar
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-2xl text-graphite">Linha do tempo</h2>
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sem eventos ainda.</p>
        ) : (
          <ol className="relative border-l border-border ml-3">
            {events.map((ev: any) => (
              <li key={ev.id} className="mb-6 ml-6">
                <span className="absolute -left-2 mt-1.5 h-3 w-3 rounded-full bg-rose-burnt ring-4 ring-pearl" />
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-display text-base text-graphite">
                    {ev.title || EVENT_LABEL[ev.type] || ev.type}
                  </p>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{EVENT_LABEL[ev.type] ?? ev.type}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{new Date(ev.created_at).toLocaleString("pt-BR")}</p>
                {ev.payload && Object.keys(ev.payload).length > 0 && (
                  <pre className="text-xs bg-champagne/30 rounded-lg p-3 whitespace-pre-wrap break-words text-graphite">
                    {ev.payload.text ?? ev.payload.message ?? JSON.stringify(ev.payload, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
