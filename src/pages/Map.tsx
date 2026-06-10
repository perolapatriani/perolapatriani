import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import { useProperties } from "@/hooks/useContent";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Eraser, PencilRuler, Check } from "lucide-react";

const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
const TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

declare global {
  interface Window {
    google: any;
    __initPerolaMap?: () => void;
  }
}

let mapsPromise: Promise<void> | null = null;
function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.maps?.geometry) return Promise.resolve();
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise<void>((resolve, reject) => {
    if (!BROWSER_KEY) {
      reject(new Error("Chave do Google Maps ausente"));
      return;
    }
    window.__initPerolaMap = () => resolve();
    const s = document.createElement("script");
    const params = new URLSearchParams({
      key: BROWSER_KEY,
      libraries: "geometry",
      loading: "async",
      callback: "__initPerolaMap",
      v: "weekly",
    });
    if (TRACKING_ID) params.set("channel", TRACKING_ID);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Falha ao carregar Google Maps"));
    document.head.appendChild(s);
  });
  return mapsPromise;
}

const fmtPrice = (v: number | null) =>
  v ? `R$ ${Number(v).toLocaleString("pt-BR")}` : "Sob consulta";

const CACHE_KEY = "perola_geocache_v1";
type LatLng = { lat: number; lng: number };
function loadCache(): Record<string, LatLng> {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch { return {}; }
}
function saveCache(c: Record<string, LatLng>) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch {}
}

function geocodeOne(geocoder: any, query: string): Promise<LatLng | null> {
  return new Promise((resolve) => {
    geocoder.geocode({ address: query, region: "br" }, (results: any[], status: string) => {
      if (status === "OK" && results?.[0]) {
        const loc = results[0].geometry.location;
        resolve({ lat: loc.lat(), lng: loc.lng() });
      } else resolve(null);
    });
  });
}

export default function MapPage() {
  const { data: all = [], isLoading } = useProperties();
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polygonRef = useRef<any>(null);
  const draftMarkersRef = useRef<any[]>([]);
  const mapClickListenerRef = useRef<any>(null);
  const infoRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [draftCount, setDraftCount] = useState(0);
  const [hasPolygon, setHasPolygon] = useState(false);
  const [visibleIds, setVisibleIds] = useState<string[] | null>(null);
  const [coords, setCoords] = useState<Record<string, LatLng>>({});
  const [geocoding, setGeocoding] = useState(false);

  // Properties with effective coordinates (explicit lat/lng OR geocoded by neighborhood)
  const located = useMemo(() => {
    return all
      .map((p: any) => {
        if (p.latitude != null && p.longitude != null) {
          return { ...p, _pos: { lat: Number(p.latitude), lng: Number(p.longitude) } };
        }
        const pos = coords[p.id];
        return pos ? { ...p, _pos: pos } : null;
      })
      .filter(Boolean) as any[];
  }, [all, coords]);

  // Init map
  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled || !mapDivRef.current) return;
        const g = window.google;
        mapRef.current = new g.maps.Map(mapDivRef.current, {
          center: { lat: -23.964, lng: -46.328 },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          clickableIcons: false,
          styles: [{ featureType: "poi", stylers: [{ visibility: "simplified" }] }],
        });
        infoRef.current = new g.maps.InfoWindow();
        setReady(true);
      })
      .catch((e) => setErr(e.message));
    return () => { cancelled = true; };
  }, []);

  // Geocode missing properties by neighborhood
  useEffect(() => {
    if (!ready || all.length === 0) return;
    const g = window.google;
    const geocoder = new g.maps.Geocoder();
    const cache = loadCache();
    const next: Record<string, LatLng> = {};
    const missing: any[] = [];
    all.forEach((p: any) => {
      if (p.latitude != null && p.longitude != null) return;
      const key = (p.neighborhood_name || "").trim().toLowerCase();
      if (!key) return;
      if (cache[key]) {
        next[p.id] = cache[key];
      } else {
        missing.push(p);
      }
    });
    if (Object.keys(next).length) setCoords((c) => ({ ...c, ...next }));
    if (missing.length === 0) return;

    let cancelled = false;
    setGeocoding(true);
    (async () => {
      const updated: Record<string, LatLng> = {};
      const seen = new Set<string>();
      for (const p of missing) {
        if (cancelled) return;
        const key = p.neighborhood_name.trim().toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const query = `${p.neighborhood_name}, Santos, SP, Brasil`;
        const pos = await geocodeOne(geocoder, query);
        if (pos) {
          cache[key] = pos;
          missing.filter((mp) => (mp.neighborhood_name || "").trim().toLowerCase() === key)
            .forEach((mp) => { updated[mp.id] = pos; });
        }
        await new Promise((r) => setTimeout(r, 120));
      }
      if (cancelled) return;
      saveCache(cache);
      setCoords((c) => ({ ...c, ...updated }));
      setGeocoding(false);
    })();
    return () => { cancelled = true; };
  }, [ready, all]);

  // Build markers when located properties change
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const g = window.google;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (located.length === 0) return;
    const bounds = new g.maps.LatLngBounds();
    located.forEach((p: any) => {
      const marker = new g.maps.Marker({
        position: p._pos,
        map: mapRef.current,
        title: p.title,
      });
      (marker as any).__id = p.id;
      marker.addListener("click", () => {
        const ppm = p.price && p.area_m2 ? Math.round(Number(p.price) / Number(p.area_m2)) : null;
        const html = `
          <div style="font-family: inherit; max-width: 240px;">
            ${p.cover_url ? `<img src="${p.cover_url}" alt="" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px"/>` : ""}
            <div style="font-weight:600;color:#2b2b2b;margin-bottom:4px">${p.title ?? ""}</div>
            <div style="font-size:12px;color:#777;margin-bottom:6px">${p.neighborhood_name ?? ""}</div>
            <div style="font-size:13px;color:#b85842;font-weight:600">${fmtPrice(p.price)}</div>
            ${p.area_m2 ? `<div style="font-size:12px;color:#555">${p.area_m2} m²${ppm ? ` · R$ ${ppm.toLocaleString("pt-BR")}/m²` : ""}</div>` : ""}
            <a href="/imoveis/${p.slug}" style="display:inline-block;margin-top:8px;font-size:12px;color:#b85842;text-decoration:underline">Ver detalhes →</a>
          </div>`;
        infoRef.current.setContent(html);
        infoRef.current.open({ anchor: marker, map: mapRef.current });
      });
      markersRef.current.push(marker);
      bounds.extend(p._pos);
    });
    if (!polygonRef.current) mapRef.current.fitBounds(bounds, 60);
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, located]);

  function applyFilter() {
    const g = window.google;
    if (!g) return;
    const poly = polygonRef.current;
    if (!poly) {
      markersRef.current.forEach((m) => m.setMap(mapRef.current));
      setVisibleIds(null);
      return;
    }
    const ids: string[] = [];
    markersRef.current.forEach((m) => {
      const inside = g.maps.geometry.poly.containsLocation(m.getPosition(), poly);
      m.setMap(inside ? mapRef.current : null);
      if (inside) ids.push((m as any).__id);
    });
    setVisibleIds(ids);
  }

  const stopDrawing = () => {
    if (mapClickListenerRef.current) {
      window.google.maps.event.removeListener(mapClickListenerRef.current);
      mapClickListenerRef.current = null;
    }
    draftMarkersRef.current.forEach((m) => m.setMap(null));
    draftMarkersRef.current = [];
    setDraftCount(0);
    setDrawing(false);
  };

  const startDrawing = () => {
    if (!mapRef.current) return;
    const g = window.google;
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
      setHasPolygon(false);
    }
    stopDrawing();
    setDrawing(true);
    mapClickListenerRef.current = mapRef.current.addListener("click", (e: any) => {
      const marker = new g.maps.Marker({
        position: e.latLng,
        map: mapRef.current,
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: "#b85842",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 1.5,
        },
        zIndex: 999,
      });
      draftMarkersRef.current.push(marker);
      setDraftCount(draftMarkersRef.current.length);
    });
  };

  const finishDrawing = () => {
    const g = window.google;
    if (draftMarkersRef.current.length < 3) return;
    const path = draftMarkersRef.current.map((m) => m.getPosition());
    const poly = new g.maps.Polygon({
      paths: path,
      strokeColor: "#b85842",
      strokeWeight: 2,
      fillColor: "#b85842",
      fillOpacity: 0.12,
      editable: true,
      map: mapRef.current,
    });
    polygonRef.current = poly;
    ["set_at", "insert_at", "remove_at"].forEach((evt) => {
      g.maps.event.addListener(poly.getPath(), evt, applyFilter);
    });
    stopDrawing();
    setHasPolygon(true);
    applyFilter();
  };

  const clearPolygon = () => {
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    stopDrawing();
    setHasPolygon(false);
    applyFilter();
  };

  const visibleProps = useMemo(() => {
    if (!visibleIds) return located;
    const set = new Set(visibleIds);
    return located.filter((p: any) => set.has(p.id));
  }, [located, visibleIds]);

  const withoutNeighborhood = all.length - located.length - (geocoding ? 0 : 0);

  return (
    <>
      <Seo
        title="Mapa de imóveis · Pérola Patriani"
        description="Explore imóveis no mapa e desenhe uma área para filtrar resultados por região."
        path="/mapa"
      />
      <section className="container-editorial py-16">
        <p className="eyebrow mb-4">MAPA INTERATIVO</p>
        <h1 className="font-display text-5xl md:text-6xl text-graphite mb-4 text-balance">
          Encontre por <em className="text-rose-burnt">localização</em>
        </h1>
        <p className="text-muted-foreground max-w-2xl mb-8">
          Os imóveis são posicionados automaticamente pelo bairro. Desenhe uma área no mapa para filtrar por região.
        </p>

        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={startDrawing}
            disabled={!ready}
            className="inline-flex items-center gap-2 rounded-full bg-graphite px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-pearl transition hover:bg-rose-burnt disabled:opacity-50"
          >
            <PencilRuler className="h-3.5 w-3.5" />
            {drawing ? `Adicionando pontos (${draftCount})` : hasPolygon ? "Redesenhar área" : "Desenhar área"}
          </button>
          {drawing && (
            <button
              onClick={finishDrawing}
              disabled={draftCount < 3}
              className="inline-flex items-center gap-2 rounded-full bg-rose-burnt px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-pearl transition hover:opacity-90 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              Concluir
            </button>
          )}
          {(hasPolygon || drawing) && (
            <button
              onClick={clearPolygon}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-pearl px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-graphite transition hover:bg-champagne"
            >
              <Eraser className="h-3.5 w-3.5" />
              {drawing ? "Cancelar" : "Limpar filtro"}
            </button>
          )}
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-rose-burnt" />
            {visibleProps.length} de {located.length} imóvel(is) {hasPolygon ? "na área" : "no mapa"}
            {geocoding && " · localizando…"}
          </div>
        </div>
        {drawing && (
          <p className="text-xs text-muted-foreground -mt-2 mb-4">
            Toque no mapa para adicionar vértices (mínimo 3) e clique em <strong>Concluir</strong>.
          </p>
        )}

        {err ? (
          <div className="luxe-card p-8 text-center text-muted-foreground">
            Não foi possível carregar o mapa: {err}
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
            <div className="relative">
              <div
                ref={mapDivRef}
                className="w-full h-[560px] rounded-2xl overflow-hidden border border-border shadow-soft bg-champagne/40"
              />
              {!ready && (
                <div className="absolute inset-0 grid place-items-center">
                  <Skeleton className="w-full h-full rounded-2xl" />
                </div>
              )}
            </div>

            <aside className="space-y-3 max-h-[560px] overflow-auto pr-1">
              {isLoading ? (
                [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)
              ) : located.length === 0 ? (
                <div className="luxe-card p-6 text-sm text-muted-foreground">
                  {geocoding
                    ? "Localizando imóveis pelo bairro…"
                    : "Nenhum imóvel com bairro cadastrado. Informe o campo Bairro nos imóveis pelo painel admin para vê-los no mapa."}
                </div>
              ) : visibleProps.length === 0 ? (
                <div className="luxe-card p-6 text-sm text-muted-foreground">
                  Nenhum imóvel dentro da área desenhada.
                </div>
              ) : (
                visibleProps.map((p: any) => {
                  const ppm = p.price && p.area_m2 ? Math.round(Number(p.price) / Number(p.area_m2)) : null;
                  return (
                    <Link
                      key={p.id}
                      to={`/imoveis/${p.slug}`}
                      className="luxe-card p-3 flex gap-3 items-center hover:shadow-elegant transition"
                    >
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-champagne flex-shrink-0">
                        {p.cover_url && (
                          <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-base text-graphite truncate">{p.title}</h3>
                        <p className="text-xs text-muted-foreground truncate">{p.neighborhood_name}</p>
                        <p className="text-sm text-rose-burnt font-medium mt-0.5">{fmtPrice(p.price)}</p>
                        {p.area_m2 && (
                          <p className="text-[11px] text-muted-foreground">
                            {p.area_m2} m²{ppm ? ` · R$ ${ppm.toLocaleString("pt-BR")}/m²` : ""}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </aside>
          </div>
        )}
      </section>
    </>
  );
}
