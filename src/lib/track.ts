import { supabase } from "@/integrations/supabase/client";

function getSessionId(): string {
  try {
    let sid = localStorage.getItem("pp_sid");
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem("pp_sid", sid);
    }
    return sid;
  } catch {
    return "anon";
  }
}

type TrackOpts = {
  property_id?: string | null;
  payload?: Record<string, unknown>;
};

export async function track(type: string, opts: TrackOpts = {}) {
  try {
    await supabase.from("site_events").insert([{
      type,
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      session_id: getSessionId(),
      property_id: opts.property_id ?? undefined,
      payload: (opts.payload ?? {}) as never,
    }]);
  } catch {
    // silencioso — telemetria não pode quebrar o site
  }
}
