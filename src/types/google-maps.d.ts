// Minimal ambient types for the subset of the Google Maps JS API used by
// LiveMap. When the @types/google.maps package is installed, prefer it and
// delete this file.
declare namespace google.maps {
  class Map {
    constructor(el: HTMLElement, opts?: MapOptions);
    setCenter(pos: LatLngLiteral): void;
    panTo(pos: LatLngLiteral): void;
    getZoom(): number;
  }
  class Marker {
    constructor(opts?: MarkerOptions);
    setMap(map: Map | null): void;
    addListener(event: string, handler: () => void): void;
  }
  class Size {
    constructor(width: number, height: number);
  }
  class Point {
    constructor(x: number, y: number);
  }
  interface LatLngLiteral {
    lat: number;
    lng: number;
  }
  interface MapOptions {
    center?: LatLngLiteral;
    zoom?: number;
    mapTypeControl?: boolean;
    fullscreenControl?: boolean;
    zoomControl?: boolean;
  }
  interface MarkerOptions {
    position?: LatLngLiteral;
    map?: Map;
    title?: string;
    icon?: MarkerIcon;
  }
  interface MarkerIcon {
    url: string;
    scaledSize?: Size;
    anchor?: Point;
  }
}

interface Window {
  google?: { maps: typeof google.maps };
}
