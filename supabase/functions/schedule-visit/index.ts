const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const GOOGLE_CALENDAR_API_KEY = Deno.env.get("GOOGLE_CALENDAR_API_KEY");
    if (!GOOGLE_CALENDAR_API_KEY) throw new Error("GOOGLE_CALENDAR_API_KEY is not configured");

    const body = await req.json();
    const { propertyTitle, propertyCode, date, time, duration, visitorName, visitorPhone, visitorEmail } = body;

    if (!propertyTitle || !date || !time || !visitorName || !visitorPhone) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: propertyTitle, date, time, visitorName, visitorPhone" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const durationMinutes = duration && [30, 60, 90].includes(Number(duration)) ? Number(duration) : 60;

    // Build event start/end
    const startDateTime = `${date}T${time}:00`;
    const startDate = new Date(startDateTime);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    const durationLabel = durationMinutes >= 60
      ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 ? durationMinutes % 60 + 'min' : ''}`
      : `${durationMinutes}min`;

    const event = {
      summary: `🏠 Visita: ${propertyTitle}${propertyCode ? ` (${propertyCode})` : ""}`,
      description: [
        `Visita agendada ao imóvel: ${propertyTitle}`,
        propertyCode ? `Código: ${propertyCode}` : "",
        `Duração: ${durationLabel}`,
        `\nVisitante: ${visitorName}`,
        `Telefone: ${visitorPhone}`,
        visitorEmail ? `E-mail: ${visitorEmail}` : "",
      ].filter(Boolean).join("\n"),
      start: {
        dateTime: startDate.toISOString(),
        timeZone: "America/Sao_Paulo",
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: "America/Sao_Paulo",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 60 },
          { method: "popup", minutes: 15 },
        ],
      },
    };

    const response = await fetch(`${GATEWAY_URL}/calendars/primary/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_CALENDAR_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Google Calendar API failed [${response.status}]: ${JSON.stringify(data)}`);
    }

    // Save as lead
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("contact_leads").insert({
      name: visitorName,
      phone: visitorPhone,
      email: visitorEmail || "",
      message: `Visita agendada: ${propertyTitle} em ${date} às ${time} (${durationLabel})`,
      source: "agendamento_visita",
    });

    // Send confirmation email if visitor provided email
    if (visitorEmail) {
      const formattedDate = new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric"
      });

      const emailHtml = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#2d2d2d;font-size:22px">Sua visita foi agendada! ✅</h2>
          <p style="color:#555;font-size:14px;line-height:1.6">
            Olá <strong>${visitorName}</strong>, sua visita ao imóvel foi confirmada na agenda.
          </p>
          <div style="background:#f8f8f6;border-radius:12px;padding:20px;margin:20px 0">
            <p style="margin:0 0 8px;color:#2d2d2d;font-size:14px"><strong>🏠 Imóvel:</strong> ${propertyTitle}</p>
            <p style="margin:0 0 8px;color:#2d2d2d;font-size:14px"><strong>📅 Data:</strong> ${formattedDate}</p>
            <p style="margin:0 0 8px;color:#2d2d2d;font-size:14px"><strong>🕐 Horário:</strong> ${time}</p>
            <p style="margin:0;color:#2d2d2d;font-size:14px"><strong>⏱ Duração:</strong> ${durationLabel}</p>
          </div>
          ${data.htmlLink ? `<p style="margin:20px 0"><a href="${data.htmlLink}" style="background:#2d2d2d;color:#fff;text-decoration:none;padding:12px 24px;border-radius:30px;font-size:13px;display:inline-block">Ver no Google Calendar</a></p>` : ""}
          <p style="color:#555;font-size:14px;line-height:1.6">
            Entraremos em contato para confirmar os detalhes. Caso precise reagendar, entre em contato pelo WhatsApp.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
          <p style="color:#999;font-size:12px">Pérola Patriani · Consultoria Imobiliária</p>
        </div>
      `;

      // Send email via Google Mail if available, otherwise just log
      try {
        const GOOGLE_MAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
        if (GOOGLE_MAIL_API_KEY) {
          const MAIL_GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
          const rawEmail = [
            `To: ${visitorEmail}`,
            `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(`Visita agendada: ${propertyTitle}`)))}?=`,
            'Content-Type: text/html; charset="UTF-8"',
            '',
            emailHtml,
          ].join('\r\n');

          const encoded = btoa(unescape(encodeURIComponent(rawEmail)))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

          await fetch(`${MAIL_GATEWAY}/users/me/messages/send`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ raw: encoded }),
          });
        }
      } catch (emailErr) {
        console.error("Email send failed (non-blocking):", emailErr);
      }
    }

    // Notify owner about the new scheduling
    try {
      const OWNER_EMAIL = "perolapatriani@gmail.com";
      const formattedDate = new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric"
      });
      const ownerSubject = `Nova visita agendada: ${propertyTitle}`;
      const ownerHtml = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#2d2d2d;font-size:22px">Nova visita agendada 📅</h2>
          <div style="background:#f8f8f6;border-radius:12px;padding:20px;margin:20px 0">
            <p style="margin:0 0 8px;font-size:14px"><strong>Imóvel:</strong> ${propertyTitle}${propertyCode ? ` (${propertyCode})` : ""}</p>
            <p style="margin:0 0 8px;font-size:14px"><strong>Data:</strong> ${formattedDate}</p>
            <p style="margin:0 0 8px;font-size:14px"><strong>Horário:</strong> ${time} (${durationLabel})</p>
            <p style="margin:12px 0 0;font-size:14px"><strong>Visitante:</strong> ${visitorName}</p>
            <p style="margin:0 0 8px;font-size:14px"><strong>Telefone:</strong> ${visitorPhone}</p>
            ${visitorEmail ? `<p style="margin:0 0 8px;font-size:14px"><strong>E-mail:</strong> ${visitorEmail}</p>` : ""}
          </div>
          ${data.htmlLink ? `<p><a href="${data.htmlLink}">Abrir no Google Calendar</a></p>` : ""}
        </div>
      `;
      const rawOwner = [
        `To: ${OWNER_EMAIL}`,
        `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(ownerSubject)))}?=`,
        'Content-Type: text/html; charset="UTF-8"',
        '',
        ownerHtml,
      ].join('\r\n');
      const encodedOwner = btoa(unescape(encodeURIComponent(rawOwner)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const GOOGLE_MAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
      if (GOOGLE_MAIL_API_KEY) {
        await fetch(`https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me/messages/send`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw: encodedOwner }),
        });
      }
    } catch (err) {
      console.error("Owner notification failed (non-blocking):", err);
    }

    return new Response(
      JSON.stringify({ success: true, eventId: data.id, eventLink: data.htmlLink }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error scheduling visit:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
