// Isometric engine helpers — pure math + an image cache. SSR-safe (no DOM at
// module top level; the Image cache lazily no-ops on the server).

export const TILE_W = 208; // full diamond width in px (at zoom 1)
export const TILE_H = 104; // full diamond height in px (at zoom 1) — kept 2:1
export const GRID = 16; // grid is GRID x GRID tiles

export interface Camera {
  x: number; // screen-space pan offset
  y: number;
  zoom: number;
  rot?: number; // current view yaw (radians); orbits around the grid centre
  rotTarget?: number; // eased-towards target yaw
}

const CENTER = (GRID - 1) / 2; // grid is rotated about its middle

// Grid cell (col,row) -> isometric point. `rot` orbits the ground plane around
// the grid centre BEFORE the iso projection (so it's a yaw orbit, not a flat
// image spin — buildings stay upright while the layout turns).
export function gridToIso(col: number, row: number, rot = 0) {
  let x = col - CENTER;
  let y = row - CENTER;
  if (rot) {
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;
    x = rx;
    y = ry;
  }
  return {
    x: (x - y) * (TILE_W / 2),
    y: (x + y) * (TILE_H / 2),
  };
}

// Apply camera + zoom to an iso point.
export function isoToScreen(isoX: number, isoY: number, cam: Camera, cw: number, ch: number) {
  return {
    x: isoX * cam.zoom + cam.x + cw / 2,
    y: isoY * cam.zoom + cam.y + ch / 2,
  };
}

// Convert a screen click back to the grid cell under it — the exact inverse of
// gridToIso (un-project, un-rotate, un-centre). Rounds to the nearest tile
// centre (flooring would snap to a corner and land half a tile off).
export function screenToGrid(sx: number, sy: number, cam: Camera, cw: number, ch: number) {
  const ix = (sx - cam.x - cw / 2) / cam.zoom;
  const iy = (sy - cam.y - ch / 2) / cam.zoom;
  let x = (ix / (TILE_W / 2) + iy / (TILE_H / 2)) / 2;
  let y = (iy / (TILE_H / 2) - ix / (TILE_W / 2)) / 2;
  const rot = cam.rot ?? 0;
  if (rot) {
    const cos = Math.cos(-rot);
    const sin = Math.sin(-rot);
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;
    x = rx;
    y = ry;
  }
  return { col: Math.round(x + CENTER), row: Math.round(y + CENTER) };
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
