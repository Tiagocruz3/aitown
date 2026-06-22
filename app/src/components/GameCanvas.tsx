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
import { BUILDINGS, type BuildingKind } from "../game/data";

export interface PlacedBuilding {
  id: string;
  kind: BuildingKind;
  col: number;
  row: number;
}

export interface LiveAgent {
  id: string;
  role: string;
  name: string;
  art: string;
  // continuous position in grid space
  col: number;
  row: number;
  target: { col: number; row: number };
  state: "idle" | "walk" | "work";
  speed: number;
  wait: number;
}

interface Props {
  buildings: PlacedBuilding[];
  agents: React.MutableRefObject<LiveAgent[]>;
  placing: BuildingKind | null;
  onPlace: (col: number, row: number) => void;
  onPickBuilding: (b: PlacedBuilding) => void;
  onPickAgent: (id: string) => void;
  onContextBuilding: (b: PlacedBuilding, sx: number, sy: number) => void;
}

export function GameCanvas({
  buildings,
  agents,
  placing,
  onPlace,
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

  // hit-test: which building is at a grid cell
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

    // preload all art
    Object.values(BUILDINGS).forEach((b) => loadImage(b.art));
    agents.current.forEach((a) => loadImage(a.art));

    function drawTile(col: number, row: number, cam: Camera, cw: number, ch: number, fill: string, stroke?: string) {
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

      // sky gradient background
      const g = ctx!.createLinearGradient(0, 0, 0, ch);
      g.addColorStop(0, "#8fd3ff");
      g.addColorStop(0.55, "#bfe9c9");
      g.addColorStop(1, "#a7dcae");
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, cw, ch);

      // ground tiles (checker grass)
      for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
          const even = (r + c) % 2 === 0;
          drawTile(c, r, cam, cw, ch, even ? "#8ed16a" : "#83c861", "rgba(60,120,40,0.18)");
        }
      }

      // hover / placement highlight
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
          placingRef.current ? (ok ? "rgba(80,200,120,0.55)" : "rgba(230,80,80,0.55)") : "rgba(255,255,255,0.28)",
          "rgba(255,255,255,0.9)",
        );
      }

      // collect drawables (buildings + agents), sort by depth (col+row, then y)
      type Draw = { depth: number; y: number; fn: () => void };
      const draws: Draw[] = [];

      for (const b of buildingsRef.current) {
        const def = BUILDINGS[b.kind];
        const iso = gridToIso(b.col, b.row);
        const s = isoToScreen(iso.x, iso.y, cam, cw, ch);
        const img = isReady(def.art) ? loadImage(def.art) : null;
        const w = TILE_W * 1.5 * cam.zoom;
        draws.push({
          depth: b.col + b.row,
          y: s.y,
          fn: () => {
            if (img) {
              const h = w * (img.height / img.width);
              ctx!.drawImage(img, s.x - w / 2, s.y - h + TILE_H * 0.5 * cam.zoom, w, h);
            } else {
              // fallback block
              ctx!.fillStyle = def.color;
              ctx!.fillRect(s.x - w / 4, s.y - w * 0.6, w / 2, w * 0.6);
            }
          },
        });
      }

      // update + draw agents
      for (const a of agents.current) {
        if (a.state === "work") {
          a.wait -= dt;
          if (a.wait <= 0) {
            a.state = "idle";
          }
        } else if (a.state === "idle") {
          a.wait -= dt;
          if (a.wait <= 0) {
            // pick a new wander target on the grid
            a.target = {
              col: Math.floor(Math.random() * GRID),
              row: Math.floor(Math.random() * GRID),
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
        const w = TILE_W * 0.62 * cam.zoom;
        const bob = a.state === "walk" ? Math.sin(now / 120) * 2 * cam.zoom : 0;
        draws.push({
          depth: a.col + a.row + 0.5,
          y: s.y,
          fn: () => {
            // shadow
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
            // name tag
            ctx!.font = `${Math.max(9, 12 * cam.zoom)}px ui-sans-serif, system-ui`;
            ctx!.textAlign = "center";
            const tag = a.name;
            const tw = ctx!.measureText(tag).width + 12;
            const ty = s.y - w * (img ? (img.height / img.width) : 1) - 6 + bob;
            ctx!.fillStyle = "rgba(20,20,30,0.78)";
            roundRect(ctx!, s.x - tw / 2, ty - 14, tw, 16, 6);
            ctx!.fill();
            ctx!.fillStyle = "#fff";
            ctx!.fillText(tag, s.x, ty - 2);
          },
        });
      }

      draws.sort((p, q) => p.depth - q.depth || p.y - q.y);
      draws.forEach((d) => d.fn());

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    // --- input handlers ---
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

      // placing mode
      if (placingRef.current) {
        if (cell.col >= 0 && cell.row >= 0 && cell.col < GRID && cell.row < GRID && !buildingAt(cell.col, cell.row)) {
          cbRef.current.onPlace(cell.col, cell.row);
        }
        return;
      }

      // agent click? (check proximity in screen space)
      let pickedAgent: string | null = null;
      let bestD = 40;
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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
