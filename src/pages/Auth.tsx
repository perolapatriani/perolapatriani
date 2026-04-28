import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Seo from "@/components/Seo";
import logo from "@/assets/logo-perola.jpg";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/admin");
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        toast.success("Conta criada! Você pode entrar agora.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/admin");
      }
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
              {mode === "login" ? "Entrar" : "Criar conta"}
            </p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <input name="email" type="email" required placeholder="E-mail"
              className="w-full rounded-xl bg-pearl/80 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-burnt/40" />
            <input name="password" type="password" required minLength={8} placeholder="Senha (mín. 8 caracteres)"
              className="w-full rounded-xl bg-pearl/80 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-burnt/40" />
            <button disabled={loading} className="w-full rounded-full bg-graphite py-3.5 text-xs uppercase tracking-[0.22em] text-pearl hover:bg-rose-burnt transition-colors disabled:opacity-50">
              {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="mt-6 w-full text-xs text-muted-foreground story-link">
            {mode === "login" ? "Criar nova conta" : "Já tenho conta — entrar"}
          </button>
        </div>
      </section>
    </>
  );
}
