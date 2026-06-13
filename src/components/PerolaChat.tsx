import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Olá! Sou a **Pérola IA** ✨\n\nPosso te ajudar a explorar imóveis, bairros e lançamentos no litoral paulista. O que você procura?",
};

export default function PerolaChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setStreaming(true);
    // adiciona placeholder do assistant
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/perola-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
        },
        body: JSON.stringify({ messages: next.filter((m) => m.role !== "assistant" || m.content) }),
      });

      if (!res.ok || !res.body) {
        let err = "Não consegui responder agora.";
        try { const j = await res.json(); if (j.error) err = j.error; } catch {}
        setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: err }; return c; });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const l = line.trim();
          if (!l.startsWith("data:")) continue;
          const data = l.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              acc += delta;
              setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: acc }; return c; });
            }
          } catch { /* ignora chunks parciais */ }
        }
      }
    } catch (e) {
      console.error("chat error", e);
      setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: "Tive um problema de conexão. Tente novamente." }; return c; });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <>
      {/* Botão flutuante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-6 z-40 group inline-flex items-center gap-2 rounded-full bg-graphite text-pearl pl-3 pr-5 py-3 shadow-elegant hover:bg-rose-burnt transition-all"
          aria-label="Abrir Pérola IA"
        >
          <span className="grid place-items-center h-8 w-8 rounded-full bg-rose-burnt/30">
            <Sparkles className="h-4 w-4" strokeWidth={1.5} />
          </span>
          <span className="text-xs uppercase tracking-[0.2em]">Pérola IA</span>
        </button>
      )}

      {/* Janela do chat */}
      <div
        className={cn(
          "fixed z-50 bottom-6 right-6 w-[calc(100vw-3rem)] sm:w-[400px] h-[min(620px,calc(100vh-3rem))] bg-pearl rounded-3xl shadow-elegant border border-border flex-col overflow-hidden transition-all origin-bottom-right",
          open ? "flex opacity-100 scale-100" : "hidden opacity-0 scale-95"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-graphite text-pearl">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center h-9 w-9 rounded-full bg-rose-burnt/30">
              <Sparkles className="h-4 w-4" strokeWidth={1.5} />
            </span>
            <div>
              <p className="font-display text-lg leading-tight">Pérola IA</p>
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-70">Assistente virtual</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-pearl/10 rounded-full" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mensagens */}
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
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => (
                            <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="text-rose-burnt underline">{children}</a>
                          ),
                        }}
                      >{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Composer */}
        <div className="border-t border-border p-3 bg-pearl">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder="Pergunte sobre imóveis, bairros…"
              className="flex-1 resize-none rounded-2xl border border-border bg-pearl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-burnt/30 max-h-32"
              disabled={streaming}
            />
            <button
              onClick={send}
              disabled={streaming || !input.trim()}
              className="grid place-items-center h-10 w-10 rounded-full bg-graphite text-pearl hover:bg-rose-burnt disabled:opacity-40 transition shrink-0"
              aria-label="Enviar"
            >
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground text-center">Pérola IA pode errar — confirme detalhes com a Pérola.</p>
        </div>
      </div>
    </>
  );
}
