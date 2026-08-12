"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function ClickMap({
  value,
  onChange,
  height = 320,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (v: { lat: number; lng: number }) => void;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { scrollWheelZoom: true }).setView([19.076, 72.8777], 12);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => {
      onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    mapRef.current = map;
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      markerRef.current = L.marker([value.lat, value.lng]).addTo(map);
    } else {
      markerRef.current.setLatLng([value.lat, value.lng]);
    }
    map.setView([value.lat, value.lng], Math.max(map.getZoom(), 15));
  }, [value]);

  return (
    <div>
      <div ref={ref} style={{ height, width: "100%", borderRadius: "0.75rem", zIndex: 0 }} aria-label="Pick parking location on map" />
      <p className="mt-1.5 text-xs text-slate-500">
        {value ? `📍 Pinned: ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : "Click on the map to pin the exact parking location."}
      </p>
    </div>
  );
}
