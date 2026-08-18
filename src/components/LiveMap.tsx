"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface LiveMapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  price: number;
  currency: string;
}

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

// Google Maps requires a key. When one is configured we use it (live satellite +
// vector tiles, Places-ready); otherwise we fall back to keyless OSM tiles.
const useGoogleMaps = GOOGLE_KEY.length > 0;

function loadGoogleMaps(): Promise<typeof google.maps> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve(window.google.maps);
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&loading=async&callback=__myspotGmaps`;
    s.async = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    (window as unknown as Record<string, unknown>).__myspotGmaps = () => resolve(window.google.maps);
    document.head.appendChild(s);
  });
}

const markerIcon = (primary: boolean) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width: ${primary ? 42 : 34}px; height: ${primary ? 42 : 34}px;
      display:flex; align-items:center; justify-content:center;
      border-radius:9999px; font-size:16px; font-weight:700;
      background:${primary ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "#ffffff"};
      color:${primary ? "#fff" : "#4f46e5"};
      border:2px solid ${primary ? "#fff" : "#c7d2fe"};
      box-shadow:0 6px 16px rgba(79,70,229,.35);
    ">🅿️</div>`,
    iconSize: [primary ? 42 : 34, primary ? 42 : 34],
    iconAnchor: [primary ? 21 : 17, primary ? 21 : 17],
  });

const googlePinSvg = (primary: boolean) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="18" fill="${primary ? "#4f46e5" : "#ffffff"}" stroke="${primary ? "#ffffff" : "#c7d2fe"}" stroke-width="2"/>
      <text x="22" y="27" font-size="16" text-anchor="middle" dominant-baseline="middle">🅿️</text>
    </svg>`
  )}`;

export default function LiveMap({
  markers,
  center,
  selectedId,
  onSelect,
  onLocate,
  height = 440,
}: {
  markers: LiveMapMarker[];
  center: { lat: number; lng: number };
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onLocate?: (pos: { lat: number; lng: number }) => void;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const gmRef = useRef<google.maps.Map | null>(null);
  const gmMarkersRef = useRef<google.maps.Marker[]>([]);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const centerRef = useRef(center);
  centerRef.current = center;

  // Bootstrap the map (Google Maps if keyed, otherwise Leaflet/OSM).
  useEffect(() => {
    if (!containerRef.current) return;
    if (useGoogleMaps) {
      let cancelled = false;
      loadGoogleMaps()
        .then((gm) => {
          if (cancelled || !containerRef.current) return;
          const map = new gm.Map(containerRef.current, {
            center,
            zoom: 13,
            mapTypeControl: true,
            fullscreenControl: true,
            zoomControl: true,
          });
          gmRef.current = map;
        })
        .catch((e) => {
          console.error("Google Maps failed to load, using OSM fallback:", e);
          // fall through to Leaflet below
          if (!cancelled && containerRef.current) {
            initLeaflet();
          }
        });
      return () => {
        cancelled = true;
        gmRef.current = null;
      };
    }
    initLeaflet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initLeaflet() {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([centerRef.current.lat, centerRef.current.lng], 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
  }

  // Keep Google map centered when the parent moves it (e.g. geolocation / search).
  useEffect(() => {
    if (!useGoogleMaps || !gmRef.current) return;
    gmRef.current.panTo(centerRef.current);
  }, [center.lat, center.lng]);

  // Render markers (Leaflet path).
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    for (const m of markers) {
      const mk = L.marker([m.lat, m.lng], { icon: markerIcon(m.id === selectedId) })
        .addTo(layer)
        .bindPopup(
          `<div style="font-family:inherit;min-width:160px">
             <div style="font-weight:700;font-size:13px;margin-bottom:2px">${m.title}</div>
             <div style="font-size:12px;color:#475569">${m.currency === "INR" ? "₹" : ""}${m.price}/hr</div>
           </div>`
        );
      mk.on("click", () => onSelectRef.current?.(m.id));
      if (m.id === selectedId) {
        map.setView([m.lat, m.lng], Math.max(map.getZoom(), 15));
        mk.openPopup();
      }
    }
  }, [markers, selectedId]);

  // Render markers (Google Maps path).
  useEffect(() => {
    if (!useGoogleMaps || !gmRef.current) return;
    const gm = gmRef.current;
    for (const m of gmMarkersRef.current) m.setMap(null);
    gmMarkersRef.current = markers.map((m) => {
      const marker = new google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map: gm,
        title: `${m.title} — ${m.currency === "INR" ? "₹" : ""}${m.price}/hr`,
        icon: { url: googlePinSvg(m.id === selectedId), scaledSize: new google.maps.Size(44, 44), anchor: new google.maps.Point(22, 22) },
      });
      marker.addListener("click", () => onSelectRef.current?.(m.id));
      return marker;
    });
    if (selectedId) {
      const hit = markers.find((m) => m.id === selectedId);
      if (hit) gm.panTo({ lat: hit.lat, lng: hit.lng });
    }
  }, [markers, selectedId]);

  // Geolocation: live position chip + "use my location" control.
  function locate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocate?.({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => console.warn("Geolocation denied:", err.message),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div ref={containerRef} style={{ height, width: "100%", zIndex: 0 }} aria-label="Live parking map with available slots" />
      <button
        type="button"
        onClick={locate}
        className="absolute right-3 top-3 z-[1000] flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg ring-1 ring-slate-200 transition hover:bg-slate-50"
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-brand-600" />
        </span>
        Use my location
      </button>
    </div>
  );
}
