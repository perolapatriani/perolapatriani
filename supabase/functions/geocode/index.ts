import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_maps';
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing connector credentials' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const queries: string[] = Array.isArray(body?.queries) ? body.queries.slice(0, 50) : [];
    if (queries.length === 0) {
      return new Response(JSON.stringify({ error: 'queries[] required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: Record<string, { lat: number; lng: number } | null> = {};

    for (const q of queries) {
      if (typeof q !== 'string' || q.length === 0 || q.length > 300) {
        results[q] = null;
        continue;
      }
      const url = `${GATEWAY_URL}/maps/api/geocode/json?address=${encodeURIComponent(q)}&region=br`;
      try {
        const r = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': GOOGLE_MAPS_API_KEY,
          },
        });
        const data = await r.json();
        const loc = data?.results?.[0]?.geometry?.location;
        results[q] = loc ? { lat: loc.lat, lng: loc.lng } : null;
      } catch {
        results[q] = null;
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
