import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { whatsappLink, trackWaClick } from "@/lib/whatsapp";

type Msg = { role: "user" | "assistant"; content: string };

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Olá! Sou a **Pérola** ✨\n\nMe conte rapidamente o que você procura (tipo de imóvel, bairro, faixa de valor) e eu respondo direto no seu **WhatsApp** — assim já começamos um atendimento personalizado.",
};

export default function PerolaChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      { role: "user", content: text },
      { role: "assistant", content: "Perfeito! Te levei pro WhatsApp com essa mensagem. Em instantes respondo por lá 💬" },
    ]);
    setInput("");
    trackWaClick({ source: "float", intent: "general", label: "perola_chat", value: 10 });
    const url = whatsappLink(`Olá Pérola! Vim pelo site:\n\n${text}`);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-6 z-40 group inline-flex items-center gap-2 rounded-full bg-graphite text-pearl pl-3 pr-5 py-3 shadow-elegant hover:bg-rose-burnt transition-all"
          aria-label="Abrir chat da Pérola"
        >
          <span className="grid place-items-center h-8 w-8 rounded-full bg-rose-burnt/30">
            <Sparkles className="h-4 w-4" strokeWidth={1.5} />
          </span>
          <span className="text-xs uppercase tracking-[0.2em]">Fale com a Pérola</span>
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
              <p className="font-display text-lg leading-tight">Pérola Patriani</p>
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-70">Resposta no WhatsApp</p>
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
                  <div className="prose prose-sm max-w-none prose-a:text-rose-burnt prose-strong:text-graphite">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
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
              placeholder="Escreva o que você procura…"
              className="flex-1 resize-none rounded-2xl border border-border bg-pearl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-burnt/30 max-h-32"
            />
            <button
              onClick={send}
              disabled={!input.trim()}
              className="grid place-items-center h-10 w-10 rounded-full bg-graphite text-pearl hover:bg-rose-burnt disabled:opacity-40 transition shrink-0"
              aria-label="Enviar para WhatsApp"
              title="Enviar para WhatsApp"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground text-center inline-flex items-center gap-1 justify-center w-full">
            <MessageCircle className="h-3 w-3" /> Sua mensagem segue direto para o WhatsApp da Pérola.
          </p>
        </div>
      </div>
    </>
  );
}
