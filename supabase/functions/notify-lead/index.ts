import { corsHeaders, esc, cap } from "../_shared/auth.ts";

const OWNER_EMAIL = "perolapatriani@gmail.com";
const MAIL_GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_MAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!GOOGLE_MAIL_API_KEY) throw new Error("GOOGLE_MAIL_API_KEY is not configured");

    const raw = await req.json();
    // Strict validation + length caps to limit abuse if endpoint is hit directly.
    const name = cap(raw?.name, 120).trim();
    const phone = cap(raw?.phone, 40).trim();
    const email = cap(raw?.email, 200).trim();
    const message = cap(raw?.message, 2000).trim();
    const source = cap(raw?.source, 60).trim();

    if (!name || !message) {
      return new Response(JSON.stringify({ error: "name e message são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subject = `Novo lead (${source || "site"}): ${name}`;
    // All interpolated user values pass through esc() — prevents HTML/phishing injection.
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#2d2d2d;font-size:22px">Novo lead recebido 📩</h2>
        <div style="background:#f8f8f6;border-radius:12px;padding:20px;margin:20px 0">
          <p style="margin:0 0 8px;font-size:14px"><strong>Nome:</strong> ${esc(name)}</p>
          ${phone ? `<p style="margin:0 0 8px;font-size:14px"><strong>Telefone:</strong> ${esc(phone)}</p>` : ""}
          ${email ? `<p style="margin:0 0 8px;font-size:14px"><strong>E-mail:</strong> ${esc(email)}</p>` : ""}
          <p style="margin:0 0 8px;font-size:14px"><strong>Origem:</strong> ${esc(source || "site")}</p>
          <p style="margin:12px 0 0;font-size:14px"><strong>Mensagem:</strong><br/>${esc(message).replace(/\n/g, "<br/>")}</p>
        </div>
        <p style="color:#999;font-size:12px">Pérola Patriani · Captação de leads</p>
      </div>
    `;

    const rawEmail = [
      `To: ${OWNER_EMAIL}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'Content-Type: text/html; charset="UTF-8"',
      '',
      html,
    ].join('\r\n');

    const encoded = btoa(unescape(encodeURIComponent(rawEmail)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const res = await fetch(`${MAIL_GATEWAY}/users/me/messages/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encoded }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Gmail send failed [${res.status}]: ${t}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("notify-lead error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
