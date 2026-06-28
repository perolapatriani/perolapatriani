import { useEffect, useRef, useState } from "react";
import { X, Send, Sparkles, Loader2, MessageCircle } from "lucide-react";
import { whatsappLink, trackWaClick } from "@/lib/whatsapp";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Olá! Sou a **Pérola IA** ✨\n\nMe conte o que você procura (tipo de imóvel, bairro, faixa de valor) e eu te ajudo aqui mesmo. Se preferir falar direto comigo, é só pedir o WhatsApp.",
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

export default function PerolaChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/perola-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
        },
        body: JSON.stringify({
          messages: next.filter((m) => m.content.trim()).map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const errJson = await res.json().catch(() => ({ error: "Erro inesperado" }));
        throw new Error(errJson.error || `Erro ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              acc += delta;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch {
            /* skip */
          }
        }
      }

      if (!acc.trim()) {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: "Hmm, não consegui responder agora. Quer falar direto comigo no WhatsApp? https://wa.me/5513991296030",
          };
          return copy;
        });
      }
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      console.error("PerolaChat error", e);
      toast.error(e?.message || "Erro ao falar com a Pérola IA");
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content:
            "Desculpe, tive um problema técnico agora. Você pode falar comigo direto pelo WhatsApp: https://wa.me/5513991296030",
        };
        return copy;
      });
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 group"
          aria-label="Falar com a Pérola"
        >
          <span className="absolute inset-0 rounded-full bg-blush/40 animate-ping" aria-hidden />
          <span className="relative grid place-items-center h-11 w-11 rounded-full bg-graphite text-pearl shadow-elegant transition-all duration-500 group-hover:bg-rose-burnt group-hover:scale-105">
            <Sparkles className="h-4 w-4" strokeWidth={1.5} />
          </span>
        </button>
      )}

      <div
        className={cn(
          "fixed z-50 bottom-6 right-6 w-[calc(100vw-3rem)] sm:w-[400px] h-[min(560px,calc(100vh-3rem))] bg-pearl rounded-3xl shadow-elegant border border-border flex-col overflow-hidden transition-all origin-bottom-right",
          open ? "flex opacity-100 scale-100" : "hidden opacity-0 scale-95"
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-graphite text-pearl">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center h-9 w-9 rounded-full bg-rose-burnt/30">
              <Sparkles className="h-4 w-4" strokeWidth={1.5} />
            </span>
            <div>
              <p className="font-display text-lg leading-tight">Pérola IA</p>
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-70">Assistente do site</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-pearl/10 rounded-full" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-gradient-to-b from-pearl to-champagne/40">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-graphite text-pearl rounded-br-sm"
                    : "bg-pearl border border-border text-graphite rounded-bl-sm shadow-soft"
                )}
              >
                {m.role === "assistant" ? (
                  m.content ? (
                    <div className="prose prose-sm max-w-none prose-a:text-rose-burnt prose-strong:text-graphite">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-rose-burnt" />
                  )
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border p-3 bg-pearl">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              disabled={loading}
              placeholder="Escreva o que você procura…"
              className="flex-1 resize-none rounded-2xl border border-border bg-pearl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-burnt/30 max-h-32 disabled:opacity-60"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="grid place-items-center h-10 w-10 rounded-full bg-graphite text-pearl hover:bg-rose-burnt disabled:opacity-40 transition shrink-0"
              aria-label="Enviar"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <button
            onClick={() => {
              const conv = messages
                .filter((m) => m.content.trim() && m !== WELCOME)
                .map((m) => (m.role === "user" ? `Eu: ${m.content}` : `Pérola IA: ${m.content}`))
                .join("\n\n");
              const msg = conv
                ? `Olá Pérola! Conversei com a Pérola IA no site e quero continuar com você:\n\n${conv}`
                : "Olá Pérola! Vim pelo site e gostaria de conversar com você.";
              trackWaClick({ source: "float", intent: "general", label: "Perola IA → WhatsApp" });
              window.open(whatsappLink(msg), "_blank", "noopener,noreferrer");
            }}
            className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] text-white py-2.5 text-xs uppercase tracking-[0.2em] hover:opacity-90 transition"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
            Continuar no WhatsApp
          </button>
          <p className="mt-2 text-[10px] text-muted-foreground text-center w-full">
            ✨ Respondido por IA — finalize a conversa direto com a Pérola no WhatsApp.
          </p>
        </div>
      </div>
    </>
  );
}
