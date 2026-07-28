export interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

export interface KakaoMap {
  setCenter: (latlng: KakaoLatLng) => void;
  panTo: (latlng: KakaoLatLng) => void;
  setLevel: (level: number, options?: { animate: boolean }) => void;
  getLevel: () => number;
}

export interface KakaoMapOptions {
  center: KakaoLatLng;
  level: number;
}

export interface KakaoMarker {
  setMap: (map: KakaoMap | null) => void;
  getPosition: () => KakaoLatLng;
}

export interface KakaoMarkerImage {
  // marker image
}

export interface KakaoSize {
  // size
}

export interface KakaoPoint {
  // point
}

export interface KakaoMarkerOptions {
  map: KakaoMap;
  position: KakaoLatLng;
  title?: string;
  clickable?: boolean;
  image?: KakaoMarkerImage;
}

export interface KakaoCustomOverlay {
  setMap: (map: KakaoMap | null) => void;
  setPosition: (latlng: KakaoLatLng) => void;
}

export interface ActiveMarkerInfo {
  marker: KakaoMarker;
  overlay: KakaoCustomOverlay | null;
}

export interface KakaoCustomOverlayOptions {
  content: string | HTMLElement;
  position: KakaoLatLng;
  clickable?: boolean;
  xAnchor?: number;
  yAnchor?: number;
}

export interface KakaoInfoWindow {
  open: (map: KakaoMap, marker: KakaoMarker) => void;
  close: () => void;
}

export interface KakaoInfoWindowOptions {
  content: string;
  removable?: boolean;
}

export interface KakaoEvent {
  addListener: (target: unknown, eventName: string, handler: () => void) => void;
}

export interface KakaoMapsNamespace {
  load: (callback: () => void) => void;
  Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Marker: new (options: KakaoMarkerOptions) => KakaoMarker;
  MarkerImage: new (src: string, size: KakaoSize, options?: { offset?: KakaoPoint }) => KakaoMarkerImage;
  Size: new (w: number, h: number) => KakaoSize;
  Point: new (x: number, y: number) => KakaoPoint;
  InfoWindow: new (options: KakaoInfoWindowOptions) => KakaoInfoWindow;
  CustomOverlay: new (options: KakaoCustomOverlayOptions) => KakaoCustomOverlay;
  event: KakaoEvent;
}

declare global {
  interface Window {
    kakao: {
      maps: KakaoMapsNamespace;
    };
  }
}
