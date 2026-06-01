const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAIL = "perolapatriani@gmail.com";
const MAIL_GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_MAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!GOOGLE_MAIL_API_KEY) throw new Error("GOOGLE_MAIL_API_KEY is not configured");

    const { name, phone, email, message, source } = await req.json();
    if (!name || !message) {
      return new Response(JSON.stringify({ error: "name e message são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subject = `Novo lead (${source || "site"}): ${name}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#2d2d2d;font-size:22px">Novo lead recebido 📩</h2>
        <div style="background:#f8f8f6;border-radius:12px;padding:20px;margin:20px 0">
          <p style="margin:0 0 8px;font-size:14px"><strong>Nome:</strong> ${name}</p>
          ${phone ? `<p style="margin:0 0 8px;font-size:14px"><strong>Telefone:</strong> ${phone}</p>` : ""}
          ${email ? `<p style="margin:0 0 8px;font-size:14px"><strong>E-mail:</strong> ${email}</p>` : ""}
          <p style="margin:0 0 8px;font-size:14px"><strong>Origem:</strong> ${source || "site"}</p>
          <p style="margin:12px 0 0;font-size:14px"><strong>Mensagem:</strong><br/>${String(message).replace(/\n/g, "<br/>")}</p>
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
