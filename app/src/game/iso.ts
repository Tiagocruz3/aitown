// Isometric engine helpers — pure math + an image cache. SSR-safe (no DOM at
// module top level; the Image cache lazily no-ops on the server).

export const TILE_W = 128; // full diamond width in px (at zoom 1)
export const TILE_H = 64; // full diamond height in px (at zoom 1)
export const GRID = 16; // grid is GRID x GRID tiles

export interface Camera {
  x: number; // screen-space pan offset
  y: number;
  zoom: number;
}

// Grid cell (col,row) -> isometric screen point (before camera/zoom applied).
export function gridToIso(col: number, row: number) {
  return {
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  };
}

// Apply camera + zoom to an iso point.
export function isoToScreen(isoX: number, isoY: number, cam: Camera, cw: number, ch: number) {
  return {
    x: isoX * cam.zoom + cam.x + cw / 2,
    y: isoY * cam.zoom + cam.y + ch / 2,
  };
}

// Convert a screen click back to the grid cell under it.
export function screenToGrid(sx: number, sy: number, cam: Camera, cw: number, ch: number) {
  const ix = (sx - cam.x - cw / 2) / cam.zoom;
  const iy = (sy - cam.y - ch / 2) / cam.zoom;
  const col = (ix / (TILE_W / 2) + iy / (TILE_H / 2)) / 2;
  const row = (iy / (TILE_H / 2) - ix / (TILE_W / 2)) / 2;
  return { col: Math.floor(col), row: Math.floor(row) };
}

// --- Image cache (client only) ---
const cache = new Map<string, HTMLImageElement>();
const ready = new Set<string>();

export function loadImage(src: string, onReady?: () => void): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  let img = cache.get(src);
  if (img) return ready.has(src) ? img : null;
  img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    ready.add(src);
    onReady?.();
  };
  img.src = src;
  cache.set(src, img);
  return null;
}

export function isReady(src: string) {
  return ready.has(src);
}
