import { useState, useEffect } from "react";
import { CalendarDays, Clock, User, Phone, Mail, Loader2, CheckCircle2, Timer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const VISITOR_STORAGE_KEY = "perola_visitor_info";

interface VisitorInfo {
  name: string;
  phone: string;
  email: string;
}

function loadVisitorInfo(): VisitorInfo {
  try {
    const raw = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { name: "", phone: "", email: "" };
}

function saveVisitorInfo(info: VisitorInfo) {
  try {
    localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(info));
  } catch {}
}

interface ScheduleVisitDialogProps {
  propertyTitle: string;
  propertyCode?: string | null;
  trigger?: React.ReactNode;
}

const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1h30" },
];

export default function ScheduleVisitDialog({ propertyTitle, propertyCode, trigger }: ScheduleVisitDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    date: "",
    time: "10:00",
    duration: 60,
  });

  // Load saved visitor info on mount
  useEffect(() => {
    const saved = loadVisitorInfo();
    setForm((prev) => ({
      ...prev,
      name: saved.name || prev.name,
      phone: saved.phone || prev.phone,
      email: saved.email || prev.email,
    }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "duration" ? Number(value) : value }));
  };

  const timeSlots = Array.from({ length: 19 }, (_, i) => {
    const hour = 8 + Math.floor(i / 2);
    const min = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${min}`;
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.date || !form.time) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    // Save visitor info for future use
    saveVisitorInfo({ name: form.name, phone: form.phone, email: form.email });

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("schedule-visit", {
        body: {
          propertyTitle,
          propertyCode,
          date: form.date,
          time: form.time,
          duration: form.duration,
          visitorName: form.name,
          visitorPhone: form.phone,
          visitorEmail: form.email,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro ao agendar");

      setSuccess(true);
      toast({ title: "Visita agendada com sucesso! ✅" });
    } catch (err: any) {
      console.error("Schedule error:", err);
      toast({ title: "Erro ao agendar visita", description: "Tente novamente ou entre em contato pelo WhatsApp.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      setSuccess(false);
      const saved = loadVisitorInfo();
      setForm({ name: saved.name, phone: saved.phone, email: saved.email, date: "", time: "10:00", duration: 60 });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="w-full flex items-center justify-center gap-3 rounded-full border-2 border-graphite py-4 text-xs uppercase tracking-[0.22em] text-graphite hover:bg-graphite hover:text-pearl transition-colors">
            <CalendarDays className="h-4 w-4" strokeWidth={1.5} />
            Agendar visita
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-graphite">
            Agendar visita
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">{propertyTitle}</p>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" strokeWidth={1.5} />
            <h3 className="font-display text-xl text-graphite">Visita agendada!</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Sua visita foi registrada na agenda. Entraremos em contato para confirmar.
            </p>
            <Button onClick={() => handleOpenChange(false)} className="mt-4 rounded-full bg-graphite hover:bg-rose-burnt">
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-editorial uppercase tracking-[0.2em] text-graphite">
                <User className="h-3.5 w-3.5" strokeWidth={1.5} /> Nome *
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Seu nome completo"
                className="w-full rounded-xl bg-pearl/70 border border-border px-4 py-3 text-sm text-graphite focus:outline-none focus:ring-2 focus:ring-rose-burnt/40 transition"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-editorial uppercase tracking-[0.2em] text-graphite">
                <Phone className="h-3.5 w-3.5" strokeWidth={1.5} /> Telefone *
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                type="tel"
                placeholder="(XX) XXXXX-XXXX"
                className="w-full rounded-xl bg-pearl/70 border border-border px-4 py-3 text-sm text-graphite focus:outline-none focus:ring-2 focus:ring-rose-burnt/40 transition"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-editorial uppercase tracking-[0.2em] text-graphite">
                <Mail className="h-3.5 w-3.5" strokeWidth={1.5} /> E-mail
              </label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                placeholder="seu@email.com"
                className="w-full rounded-xl bg-pearl/70 border border-border px-4 py-3 text-sm text-graphite focus:outline-none focus:ring-2 focus:ring-rose-burnt/40 transition"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-editorial uppercase tracking-[0.2em] text-graphite">
                  <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.5} /> Data *
                </label>
                <input
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  type="date"
                  min={minDate}
                  className="w-full rounded-xl bg-pearl/70 border border-border px-4 py-3 text-sm text-graphite focus:outline-none focus:ring-2 focus:ring-rose-burnt/40 transition"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-editorial uppercase tracking-[0.2em] text-graphite">
                  <Clock className="h-3.5 w-3.5" strokeWidth={1.5} /> Horário *
                </label>
                <select
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl bg-pearl/70 border border-border px-4 py-3 text-sm text-graphite focus:outline-none focus:ring-2 focus:ring-rose-burnt/40 transition"
                >
                  {timeSlots.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-editorial uppercase tracking-[0.2em] text-graphite">
                  <Timer className="h-3.5 w-3.5" strokeWidth={1.5} /> Duração *
                </label>
                <select
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl bg-pearl/70 border border-border px-4 py-3 text-sm text-graphite focus:outline-none focus:ring-2 focus:ring-rose-burnt/40 transition"
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-full bg-graphite py-4 text-xs uppercase tracking-[0.22em] text-pearl hover:bg-rose-burnt transition-colors disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CalendarDays className="h-4 w-4" strokeWidth={1.5} />
                  Confirmar agendamento
                </>
              )}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
