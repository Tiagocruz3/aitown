import { useEffect, useRef, useCallback } from "react";
import {
  TILE_W,
  TILE_H,
  GRID,
  gridToIso,
  isoToScreen,
  screenToGrid,
  loadImage,
  isReady,
  type Camera,
} from "../game/iso";
import { PROVIDERS, ROAD, type ProviderId } from "../game/data";

export interface PlacedBuilding {
  id: string;
  provider: ProviderId;
  col: number;
  row: number;
}

export interface LiveAgent {
  id: string; // same id as the owning building
  provider: ProviderId;
  name: string;
  art: string;
  homeCol: number;
  homeRow: number;
  col: number;
  row: number;
  target: { col: number; row: number };
  state: "idle" | "walk" | "work";
  speed: number;
  wait: number;
}

export type RoadTool = "road" | "erase-road";

interface Props {
  buildings: PlacedBuilding[];
  agents: React.MutableRefObject<LiveAgent[]>;
  roads: React.MutableRefObject<Set<string>>;
  placing: ProviderId | null;
  roadTool: RoadTool | null;
  onPlace: (col: number, row: number) => void;
  onPaintRoad: (col: number, row: number, erase: boolean) => void;
  onPickBuilding: (b: PlacedBuilding) => void;
  onPickAgent: (id: string) => void;
  onContextBuilding: (b: PlacedBuilding, sx: number, sy: number) => void;
}

export function GameCanvas({
  buildings,
  agents,
  roads,
  placing,
  roadTool,
  onPlace,
  onPaintRoad,
  onPickBuilding,
  onPickAgent,
  onContextBuilding,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camRef = useRef<Camera>({ x: 0, y: -80, zoom: 0.85 });
  const hoverRef = useRef<{ col: number; row: number } | null>(null);
  const dragRef = useRef<{ on: boolean; lx: number; ly: number; moved: boolean }>({
    on: false,
    lx: 0,
    ly: 0,
    moved: false,
  });
  const placingRef = useRef(placing);
  const buildingsRef = useRef(buildings);
  placingRef.current = placing;
  buildingsRef.current = buildings;
  const cbRef = useRef({ onPlace, onPickBuilding, onPickAgent, onContextBuilding });
  cbRef.current = { onPlace, onPickBuilding, onPickAgent, onContextBuilding };

  const buildingAt = useCallback((col: number, row: number) => {
    return buildingsRef.current.find((b) => b.col === col && b.row === row);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    // preload all provider art
    Object.values(PROVIDERS).forEach((p) => {
      loadImage(p.buildingArt);
      loadImage(p.agentArt);
    });
    agents.current.forEach((a) => loadImage(a.art));

    function drawTile(
      col: number,
      row: number,
      cam: Camera,
      cw: number,
      ch: number,
      fill: string,
      stroke?: string,
    ) {
      const iso = gridToIso(col, row);
      const c = isoToScreen(iso.x, iso.y, cam, cw, ch);
      const hw = (TILE_W / 2) * cam.zoom;
      const hh = (TILE_H / 2) * cam.zoom;
      ctx!.beginPath();
      ctx!.moveTo(c.x, c.y - hh);
      ctx!.lineTo(c.x + hw, c.y);
      ctx!.lineTo(c.x, c.y + hh);
      ctx!.lineTo(c.x - hw, c.y);
      ctx!.closePath();
      ctx!.fillStyle = fill;
      ctx!.fill();
      if (stroke) {
        ctx!.strokeStyle = stroke;
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }
    }

    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!canvas) return;
      const cam = camRef.current;
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;

      const g = ctx!.createLinearGradient(0, 0, 0, ch);
      g.addColorStop(0, "#8fd3ff");
      g.addColorStop(0.55, "#bfe9c9");
      g.addColorStop(1, "#a7dcae");
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, cw, ch);

      for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
          const even = (r + c) % 2 === 0;
          drawTile(c, r, cam, cw, ch, even ? "#8ed16a" : "#83c861", "rgba(60,120,40,0.18)");
        }
      }

      const hov = hoverRef.current;
      if (hov && hov.col >= 0 && hov.row >= 0 && hov.col < GRID && hov.row < GRID) {
        const occupied = !!buildingAt(hov.col, hov.row);
        const ok = placingRef.current ? !occupied : true;
        drawTile(
          hov.col,
          hov.row,
          cam,
          cw,
          ch,
          placingRef.current
            ? ok
              ? "rgba(80,200,120,0.55)"
              : "rgba(230,80,80,0.55)"
            : "rgba(255,255,255,0.28)",
          "rgba(255,255,255,0.9)",
        );
      }

      type Draw = { depth: number; y: number; fn: () => void };
      const draws: Draw[] = [];

      for (const b of buildingsRef.current) {
        const def = PROVIDERS[b.provider];
        const iso = gridToIso(b.col, b.row);
        const s = isoToScreen(iso.x, iso.y, cam, cw, ch);
        const img = isReady(def.buildingArt) ? loadImage(def.buildingArt) : null;
        const w = TILE_W * 1.5 * cam.zoom;
        draws.push({
          depth: b.col + b.row,
          y: s.y,
          fn: () => {
            // brand glow pad under the building
            ctx!.save();
            ctx!.globalAlpha = 0.35;
            ctx!.fillStyle = def.color;
            ctx!.beginPath();
            ctx!.ellipse(s.x, s.y, w * 0.42, w * 0.2, 0, 0, Math.PI * 2);
            ctx!.fill();
            ctx!.restore();
            if (img) {
              const h = w * (img.height / img.width);
              ctx!.drawImage(img, s.x - w / 2, s.y - h + TILE_H * 0.5 * cam.zoom, w, h);
            } else {
              ctx!.fillStyle = def.color;
              ctx!.fillRect(s.x - w / 4, s.y - w * 0.6, w / 2, w * 0.6);
            }
          },
        });
      }

      for (const a of agents.current) {
        if (a.state === "work") {
          a.wait -= dt;
          if (a.wait <= 0) a.state = "idle";
        } else if (a.state === "idle") {
          a.wait -= dt;
          if (a.wait <= 0) {
            // wander near home so agents stay around their building
            a.target = {
              col: clamp(a.homeCol + (Math.random() * 6 - 3), 0, GRID - 1),
              row: clamp(a.homeRow + (Math.random() * 6 - 3), 0, GRID - 1),
            };
            a.state = "walk";
          }
        } else if (a.state === "walk") {
          const dc = a.target.col - a.col;
          const dr = a.target.row - a.row;
          const dist = Math.hypot(dc, dr);
          if (dist < 0.05) {
            a.state = "idle";
            a.wait = 1 + Math.random() * 3;
          } else {
            a.col += (dc / dist) * a.speed * dt;
            a.row += (dr / dist) * a.speed * dt;
          }
        }

        const iso = gridToIso(a.col, a.row);
        const s = isoToScreen(iso.x, iso.y, cam, cw, ch);
        const img = isReady(a.art) ? loadImage(a.art) : null;
        const prov = PROVIDERS[a.provider];
        const w = TILE_W * 0.62 * cam.zoom;
        const bob = a.state === "walk" ? Math.sin(now / 120) * 2 * cam.zoom : 0;
        draws.push({
          depth: a.col + a.row + 0.5,
          y: s.y,
          fn: () => {
            ctx!.fillStyle = "rgba(0,0,0,0.18)";
            ctx!.beginPath();
            ctx!.ellipse(s.x, s.y, w * 0.28, w * 0.12, 0, 0, Math.PI * 2);
            ctx!.fill();
            if (img) {
              const h = w * (img.height / img.width);
              ctx!.drawImage(img, s.x - w / 2, s.y - h + bob, w, h);
            } else {
              ctx!.fillStyle = "#fff";
              ctx!.beginPath();
              ctx!.arc(s.x, s.y - w * 0.5, w * 0.3, 0, Math.PI * 2);
              ctx!.fill();
            }
            const imgH = img ? w * (img.height / img.width) : w;
            // working indicator
            if (a.state === "work") {
              ctx!.font = `${Math.max(10, 14 * cam.zoom)}px ui-sans-serif, system-ui`;
              ctx!.textAlign = "center";
              ctx!.fillText("⚙️", s.x, s.y - imgH - 16 + bob);
            }
            // brand name tag
            ctx!.font = `600 ${Math.max(9, 12 * cam.zoom)}px ui-sans-serif, system-ui`;
            ctx!.textAlign = "center";
            const tag = a.name;
            const tw = ctx!.measureText(tag).width + 14;
            const ty = s.y - imgH - 4 + bob;
            ctx!.fillStyle = prov.color;
            roundRect(ctx!, s.x - tw / 2, ty - 15, tw, 17, 7);
            ctx!.fill();
            ctx!.fillStyle = prov.ink;
            ctx!.fillText(tag, s.x, ty - 3);
          },
        });
      }

      draws.sort((p, q) => p.depth - q.depth || p.y - q.y);
      draws.forEach((d) => d.fn());

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    function getPos(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function onDown(e: MouseEvent) {
      const p = getPos(e);
      dragRef.current = { on: true, lx: p.x, ly: p.y, moved: false };
    }
    function onMove(e: MouseEvent) {
      const p = getPos(e);
      const cam = camRef.current;
      hoverRef.current = screenToGrid(p.x, p.y, cam, canvas!.clientWidth, canvas!.clientHeight);
      if (dragRef.current.on) {
        const dx = p.x - dragRef.current.lx;
        const dy = p.y - dragRef.current.ly;
        if (Math.abs(dx) + Math.abs(dy) > 3) dragRef.current.moved = true;
        cam.x += dx;
        cam.y += dy;
        dragRef.current.lx = p.x;
        dragRef.current.ly = p.y;
      }
    }
    function onUp(e: MouseEvent) {
      const wasDrag = dragRef.current.moved;
      dragRef.current.on = false;
      if (wasDrag) return;
      const p = getPos(e);
      const cam = camRef.current;
      const cell = screenToGrid(p.x, p.y, cam, canvas!.clientWidth, canvas!.clientHeight);

      if (placingRef.current) {
        if (
          cell.col >= 0 &&
          cell.row >= 0 &&
          cell.col < GRID &&
          cell.row < GRID &&
          !buildingAt(cell.col, cell.row)
        ) {
          cbRef.current.onPlace(cell.col, cell.row);
        }
        return;
      }

      // agent click first (they sit on top)
      let pickedAgent: string | null = null;
      let bestD = 42;
      for (const a of agents.current) {
        const iso = gridToIso(a.col, a.row);
        const s = isoToScreen(iso.x, iso.y, cam, canvas!.clientWidth, canvas!.clientHeight);
        const d = Math.hypot(s.x - p.x, s.y - (p.y + 20));
        if (d < bestD) {
          bestD = d;
          pickedAgent = a.id;
        }
      }
      if (pickedAgent) {
        cbRef.current.onPickAgent(pickedAgent);
        return;
      }

      const b = buildingAt(cell.col, cell.row);
      if (b) cbRef.current.onPickBuilding(b);
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const cam = camRef.current;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      cam.zoom = Math.min(2.2, Math.max(0.4, cam.zoom * factor));
    }
    function onContext(e: MouseEvent) {
      e.preventDefault();
      const p = getPos(e);
      const cam = camRef.current;
      const cell = screenToGrid(p.x, p.y, cam, canvas!.clientWidth, canvas!.clientHeight);
      const b = buildingAt(cell.col, cell.row);
      if (b) cbRef.current.onContextBuilding(b, e.clientX, e.clientY);
    }

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", onContext);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContext);
    };
  }, [agents, buildingAt]);

  return <canvas ref={canvasRef} className="block h-full w-full cursor-grab active:cursor-grabbing" />;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
