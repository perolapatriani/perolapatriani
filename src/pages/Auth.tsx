import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Seo from "@/components/Seo";
import logo from "@/assets/logo-perola.jpg";

// Only accept same-origin relative paths as post-login redirect targets.
function sanitizeNext(raw: string | null): string {
  if (!raw) return "/admin";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/admin";
  return raw;
}

export default function Auth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = sanitizeNext(params.get("next"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate(next, { replace: true });
    });
  }, [navigate, next]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate(next, { replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao processar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Acesso · Pérola Patriani" path="/auth" />
      <section className="min-h-[80vh] grid place-items-center px-6">
        <div className="w-full max-w-md glass-strong rounded-3xl p-10 shadow-elegant">
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="" className="h-14 w-14 rounded-full object-cover ring-1 ring-blush/30" />
            <h1 className="font-display text-3xl text-graphite mt-4">Painel administrativo</h1>
            <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-2">
              Entrar
            </p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <input name="email" type="email" required placeholder="E-mail"
              className="w-full rounded-xl bg-pearl/80 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-burnt/40" />
            <input name="password" type="password" required minLength={8} placeholder="Senha"
              className="w-full rounded-xl bg-pearl/80 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-burnt/40" />
            <button disabled={loading} className="w-full rounded-full bg-graphite py-3.5 text-xs uppercase tracking-[0.22em] text-pearl hover:bg-rose-burnt transition-colors disabled:opacity-50">
              {loading ? "Aguarde…" : "Entrar"}
            </button>
          </form>
          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Acesso restrito. Novas contas são criadas apenas por um administrador.
          </p>
        </div>
      </section>
    </>
  );
}
