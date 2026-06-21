// Shared auth + sanitization helpers for edge functions.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Require the caller to be an authenticated admin user.
 * Optionally allow an internal cron caller that knows the shared secret stored
 * in public.app_secrets (only readable by service_role).
 * Returns null on success, or a Response on failure.
 */
export async function requireAdmin(
  req: Request,
  opts: { cronSecretKey?: string } = {},
): Promise<Response | null> {
  // Internal cron path — match X-Cron-Secret against app_secrets row.
  if (opts.cronSecretKey) {
    const provided = req.headers.get("X-Cron-Secret") || "";
    if (provided) {
      const admin = createClient(SUPABASE_URL, SERVICE_KEY);
      const { data: row } = await admin
        .from("app_secrets")
        .select("value")
        .eq("key", opts.cronSecretKey)
        .maybeSingle();
      if (row?.value && provided === row.value) return null;
    }
  }

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }


  const supabase = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: claims, error } = await supabase.auth.getClaims(token);
  if (error || !claims?.claims?.sub) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify admin role via SECURITY DEFINER function.
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: isAdmin } = await admin.rpc("has_role", {
    _user_id: claims.claims.sub,
    _role: "admin",
  });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}

/** HTML-escape user-supplied content before embedding it into email HTML bodies. */
export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Cap a string to a max length (default 500). */
export function cap(value: unknown, max = 500): string {
  return String(value ?? "").slice(0, max);
}

/** Strip CR/LF/NUL — required before placing user data in raw email headers. */
export function sanitizeHeader(value: unknown, max = 200): string {
  return String(value ?? "").replace(/[\r\n\0]/g, " ").slice(0, max).trim();
}

/** Strict RFC-ish email format validation. */
export function isValidEmail(value: unknown): boolean {
  const s = String(value ?? "").trim();
  if (!s || s.length > 254) return false;
  return /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/.test(s) && !/[\r\n\0]/.test(s);
}
