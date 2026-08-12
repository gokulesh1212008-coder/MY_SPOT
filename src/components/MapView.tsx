"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  price: number;
  currency: string;
}

const markerIcon = (primary: boolean) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width: ${primary ? 42 : 34}px; height: ${primary ? 42 : 34}px;
      display:flex; align-items:center; justify-content:center;
      border-radius: 9999px; font-size:16px; font-weight:700;
      background: ${primary ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "#ffffff"};
      color: ${primary ? "#fff" : "#4f46e5"};
      border: 2px solid ${primary ? "#fff" : "#c7d2fe"};
      box-shadow: 0 6px 16px rgba(79,70,229,.35);
    ">🅿️</div>`,
    iconSize: [primary ? 42 : 34, primary ? 42 : 34],
    iconAnchor: [primary ? 21 : 17, primary ? 21 : 17],
  });

export default function MapView({
  markers,
  center,
  selectedId,
  onSelect,
  height = 420,
}: {
  markers: MapMarker[];
  center: { lat: number; lng: number };
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([center.lat, center.lng], 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
  }, [center.lat, center.lng]);

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

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div ref={containerRef} style={{ height, width: "100%", zIndex: 0 }} aria-label="Parking map" />
    </div>
  );
}
