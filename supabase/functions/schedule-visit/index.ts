import { corsHeaders } from "@supabase/supabase-js/cors";
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
    const { propertyTitle, propertyCode, date, time, visitorName, visitorPhone, visitorEmail } = body;

    if (!propertyTitle || !date || !time || !visitorName || !visitorPhone) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: propertyTitle, date, time, visitorName, visitorPhone" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build event start/end (1 hour visit)
    const startDateTime = `${date}T${time}:00`;
    const startDate = new Date(startDateTime);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const event = {
      summary: `🏠 Visita: ${propertyTitle}${propertyCode ? ` (${propertyCode})` : ""}`,
      description: [
        `Visita agendada ao imóvel: ${propertyTitle}`,
        propertyCode ? `Código: ${propertyCode}` : "",
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

    // Also save as lead
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("contact_leads").insert({
      name: visitorName,
      phone: visitorPhone,
      email: visitorEmail || "",
      message: `Visita agendada: ${propertyTitle} em ${date} às ${time}`,
      source: "agendamento_visita",
    });

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
