import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Seo from "@/components/Seo";
import logo from "@/assets/logo-perola.jpg";

// Local typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthClient = { name?: string; redirect_uri?: string };
type AuthorizationDetails = {
  client?: OAuthClient;
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthResult<T> = { data: T | null; error: { message: string } | null };
type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult<AuthorizationDetails>>;
  approveAuthorization: (id: string) => Promise<OAuthResult<AuthorizationDetails>>;
  denyAuthorization: (id: string) => Promise<OAuthResult<AuthorizationDetails>>;
};
const oauth = (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;

// Only allow same-origin relative paths.
function safeNext(): string {
  return window.location.pathname + window.location.search;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Requisição de autorização inválida (authorization_id ausente).");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        window.location.href = "/auth?next=" + encodeURIComponent(safeNext());
        return;
      }
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("O servidor de autorização não retornou um redirect.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "aplicativo externo";

  return (
    <>
      <Seo title="Autorizar acesso · Pérola Patriani" path="/.lovable/oauth/consent" />
      <section className="min-h-[80vh] grid place-items-center px-6 py-16">
        <div className="w-full max-w-md glass-strong rounded-3xl p-10 shadow-elegant">
          <div className="flex flex-col items-center mb-6">
            <img src={logo} alt="" className="h-14 w-14 rounded-full object-cover ring-1 ring-blush/30" />
            <p className="font-editorial text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-4">
              Autorização de acesso
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {!details && !error && (
            <p className="text-center text-sm text-muted-foreground">Carregando…</p>
          )}

          {details && (
            <>
              <h1 className="font-display text-2xl text-graphite text-center leading-tight">
                Conectar <span className="italic text-rose-burnt">{clientName}</span> à sua conta
              </h1>
              <p className="mt-4 text-sm text-muted-foreground text-center">
                Isso permite que {clientName} use este app como você. As permissões e políticas do
                app continuam se aplicando normalmente.
              </p>

              {details.scope && (
                <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-muted-foreground text-center">
                  Escopos: {details.scope}
                </p>
              )}

              <div className="mt-8 flex flex-col gap-3">
                <button
                  disabled={busy}
                  onClick={() => decide(true)}
                  className="w-full rounded-full bg-graphite py-3.5 text-xs uppercase tracking-[0.22em] text-pearl hover:bg-rose-burnt transition-colors disabled:opacity-50"
                >
                  {busy ? "Aguarde…" : "Aprovar conexão"}
                </button>
                <button
                  disabled={busy}
                  onClick={() => decide(false)}
                  className="w-full rounded-full border border-border py-3.5 text-xs uppercase tracking-[0.22em] text-graphite hover:bg-champagne transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
