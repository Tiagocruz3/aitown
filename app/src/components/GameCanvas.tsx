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
import { PROVIDERS, ROAD, TOWN_HALL, BUILDING_MODELS, type ProviderId } from "../game/data";
import { ensureModel, getModel } from "../game/model3d";

export type BuildingKind = "provider" | "town-hall";

export interface PlacedBuilding {
  id: string;
  kind: BuildingKind;
  provider: ProviderId; // meaningful when kind === "provider"
  col: number;
  row: number;
  rot?: number; // rotation frame index for 3D-model buildings (default 0)
}

// Art + accent color for any building (provider or town hall).
export function buildingArtOf(b: PlacedBuilding): string {
  return b.kind === "town-hall" ? TOWN_HALL.art : PROVIDERS[b.provider].buildingArt;
}
export function buildingColorOf(b: PlacedBuilding): string {
  return b.kind === "town-hall" ? TOWN_HALL.color : PROVIDERS[b.provider].color;
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
  placingActive: boolean;
  roadTool: RoadTool | null;
  movingId: string | null;
  selectedTile: { col: number; row: number } | null;
  onPlace: (col: number, row: number) => void;
  onPaintRoad: (col: number, row: number, erase: boolean) => void;
  onMoveTo: (id: string, col: number, row: number) => void;
  onPickBuilding: (b: PlacedBuilding) => void;
  onPickAgent: (id: string) => void;
  onPickTile: (cell: { col: number; row: number } | null) => void;
  onDeselect: () => void;
  onContextBuilding: (b: PlacedBuilding, sx: number, sy: number) => void;
}

export function GameCanvas({
  buildings,
  agents,
  roads,
  placingActive,
  roadTool,
  movingId,
  selectedTile,
  onPlace,
  onPaintRoad,
  onMoveTo,
  onPickBuilding,
  onPickAgent,
  onPickTile,
  onDeselect,
  onContextBuilding,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camRef = useRef<Camera>({ x: 0, y: 40, zoom: 0.85, rot: 0, rotTarget: 0 });

  // Orbit the view by 90° steps. In a 2:1 iso projection only quarter-turns
  // keep the grid a proper square diamond (45° would skew it), so we snap.
  function rotateView(dir: number) {
    const cam = camRef.current;
    const next = (cam.rotTarget ?? 0) + dir * (Math.PI / 2);
    cam.rotTarget = next;
    cam.rot = next;
  }
  const hoverRef = useRef<{ col: number; row: number } | null>(null);
  const dragRef = useRef<{ on: boolean; lx: number; ly: number; moved: boolean }>({
    on: false,
    lx: 0,
    ly: 0,
    moved: false,
  });
  const placingActiveRef = useRef(placingActive);
  const buildingsRef = useRef(buildings);
  const roadToolRef = useRef(roadTool);
  const movingRef = useRef(movingId);
  const selectedTileRef = useRef(selectedTile);
  placingActiveRef.current = placingActive;
  buildingsRef.current = buildings;
  roadToolRef.current = roadTool;
  movingRef.current = movingId;
  selectedTileRef.current = selectedTile;
  const cbRef = useRef({ onPlace, onPaintRoad, onMoveTo, onPickBuilding, onPickAgent, onPickTile, onDeselect, onContextBuilding });
  cbRef.current = { onPlace, onPaintRoad, onMoveTo, onPickBuilding, onPickAgent, onPickTile, onDeselect, onContextBuilding };

  const buildingAt = useCallback((col: number, row: number) => {
    return buildingsRef.current.find((b) => b.col === col && b.row === row);
  }, []);

  // Hit-test a screen point against the rendered building sprites (top-most first).
  // Buildings draw ~1.5 tiles wide and tall with an upward offset, so a plain
  // tile lookup misses the visible body — we test the actual sprite rectangle.
  const buildingAtScreen = useCallback(
    (px: number, py: number, cam: Camera, cw: number, ch: number) => {
      const list = buildingsRef.current;
      // iterate front-to-back (nearer = larger projected screen-Y, on top)
      const sorted = [...list].sort(
        (a, b) =>
          isoToScreen(gridToIso(b.col, b.row, cam.rot).x, gridToIso(b.col, b.row, cam.rot).y, cam, cw, ch).y -
          isoToScreen(gridToIso(a.col, a.row, cam.rot).x, gridToIso(a.col, a.row, cam.rot).y, cam, cw, ch).y,
      );
      for (const b of sorted) {
        const iso = gridToIso(b.col, b.row, cam.rot);
        const s = isoToScreen(iso.x, iso.y, cam, cw, ch);
        const art = buildingArtOf(b);
        const img = isReady(art) ? loadImage(art) : null;
        const w = TILE_W * 1.5 * cam.zoom;
        const h = img ? w * (img.height / img.width) : w;
        const baseY = s.y + TILE_H * 0.5 * cam.zoom;
        const top = baseY - h; // matches the render anchor
        const left = s.x - w / 2;
        // generous box, trimmed a touch on the sides to feel right
        if (px >= left + w * 0.12 && px <= left + w * 0.88 && py >= top + h * 0.05 && py <= baseY) {
          return b;
        }
      }
      return undefined;
    },
    [],
  );

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
    loadImage(TOWN_HALL.art);
    agents.current.forEach((a) => loadImage(a.art));
    // Pre-render any 3D building models into rotation frames (async, client-only).
    Object.values(BUILDING_MODELS).forEach((url) => url && ensureModel(url));

    function drawTile(
      col: number,
      row: number,
      cam: Camera,
      cw: number,
      ch: number,
      fill: string,
      stroke?: string,
    ) {
      // Project the tile's four ground corners so it rotates with the view.
      const rot = cam.rot ?? 0;
      const p = [
        gridToIso(col - 0.5, row - 0.5, rot),
        gridToIso(col + 0.5, row - 0.5, rot),
        gridToIso(col + 0.5, row + 0.5, rot),
        gridToIso(col - 0.5, row + 0.5, rot),
      ].map((q) => isoToScreen(q.x, q.y, cam, cw, ch));
      ctx!.beginPath();
      ctx!.moveTo(p[0].x, p[0].y);
      ctx!.lineTo(p[1].x, p[1].y);
      ctx!.lineTo(p[2].x, p[2].y);
      ctx!.lineTo(p[3].x, p[3].y);
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

      // ease the view yaw toward its target (smooth orbit)
      const rotTarget = cam.rotTarget ?? 0;
      cam.rot = (cam.rot ?? 0) + (rotTarget - (cam.rot ?? 0)) * Math.min(1, dt * 9);
      if (Math.abs(rotTarget - (cam.rot ?? 0)) < 0.0004) cam.rot = rotTarget;

      const g = ctx!.createLinearGradient(0, 0, 0, ch);
      g.addColorStop(0, "#8fd3ff");
      g.addColorStop(0.55, "#bfe9c9");
      g.addColorStop(1, "#a7dcae");
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, cw, ch);

      // The terrain: a flat base field (fills any sub-pixel seams), then per-
      // tile random green shades for organic texture — no borders, so it never
      // reads like a chess board. Individual squares still only highlight on
      // interaction. Outer corners rotate with the view.
      const corners = [
        gridToIso(-0.5, -0.5, cam.rot),
        gridToIso(GRID - 0.5, -0.5, cam.rot),
        gridToIso(GRID - 0.5, GRID - 0.5, cam.rot),
        gridToIso(-0.5, GRID - 0.5, cam.rot),
      ].map((p) => isoToScreen(p.x, p.y, cam, cw, ch));
      ctx!.beginPath();
      ctx!.moveTo(corners[0].x, corners[0].y);
      for (let i = 1; i < corners.length; i++) ctx!.lineTo(corners[i].x, corners[i].y);
      ctx!.closePath();
      ctx!.fillStyle = "#8ccf68";
      ctx!.fill();

      for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
          drawTile(c, r, cam, cw, ch, grassShade(c, r));
        }
      }

      // road layer — fill ALL road tiles as one path so adjacent tiles merge
      // seamlessly (internal shared edges aren't anti-aliased; no seams).
      const roadSet = roads.current;
      if (roadSet.size) {
        ctx!.beginPath();
        for (const key of roadSet) {
          const [cs, rs] = key.split(",");
          const c = Number(cs);
          const r = Number(rs);
          const q = [
            gridToIso(c - 0.5, r - 0.5, cam.rot),
            gridToIso(c + 0.5, r - 0.5, cam.rot),
            gridToIso(c + 0.5, r + 0.5, cam.rot),
            gridToIso(c - 0.5, r + 0.5, cam.rot),
          ].map((p) => isoToScreen(p.x, p.y, cam, cw, ch));
          ctx!.moveTo(q[0].x, q[0].y);
          ctx!.lineTo(q[1].x, q[1].y);
          ctx!.lineTo(q[2].x, q[2].y);
          ctx!.lineTo(q[3].x, q[3].y);
          ctx!.closePath();
        }
        ctx!.fillStyle = ROAD.fill;
        ctx!.fill();
      }

      // Tile highlight only appears when something is selected to build/place —
      // a provider/town-hall to drop, a building being moved, or a road tool.
      // In plain navigation the grid stays clean (no hover highlight).
      const hov = hoverRef.current;
      const rt = roadToolRef.current;
      const buildMode = placingActiveRef.current || !!movingRef.current || !!rt;
      if (buildMode && hov && hov.col >= 0 && hov.row >= 0 && hov.col < GRID && hov.row < GRID) {
        const occupied = !!buildingAt(hov.col, hov.row);
        let fill: string;
        if (placingActiveRef.current || movingRef.current) {
          fill = occupied ? "rgba(230,80,80,0.55)" : "rgba(80,200,120,0.55)";
        } else if (rt === "road") {
          fill = occupied ? "rgba(230,80,80,0.55)" : "rgba(120,160,255,0.6)";
        } else {
          fill = "rgba(255,140,60,0.55)"; // erase-road
        }
        drawTile(hov.col, hov.row, cam, cw, ch, fill, "rgba(255,255,255,0.9)");
      }

      // Highlight the active square — the selected building's tile, or the
      // empty tile the user clicked (which is also what opens the dock).
      const pc = selectedTileRef.current;
      if (!buildMode && pc && pc.col >= 0 && pc.row >= 0 && pc.col < GRID && pc.row < GRID) {
        drawTile(pc.col, pc.row, cam, cw, ch, "rgba(255,255,255,0.22)", "rgba(255,255,255,0.95)");
      }

      type Draw = { depth: number; y: number; fn: () => void };
      const draws: Draw[] = [];

      for (const b of buildingsRef.current) {
        const bColor = buildingColorOf(b);
        const bArt = buildingArtOf(b);
        const iso = gridToIso(b.col, b.row, cam.rot);
        const s = isoToScreen(iso.x, iso.y, cam, cw, ch);
        const img = isReady(bArt) ? loadImage(bArt) : null;
        // Rotatable 3D model (if this building has a GLB) — falls back to the
        // 2D sprite while the model is still rendering.
        const modelUrl = b.kind === "provider" ? BUILDING_MODELS[b.provider] : undefined;
        const model = modelUrl ? getModel(modelUrl) : null;
        const w = TILE_W * 1.5 * cam.zoom;
        const isMoving = movingRef.current === b.id;
        draws.push({
          depth: b.col + b.row,
          y: s.y,
          fn: () => {
            // 3D models are grounded at the tile CENTER (like agents); 2D
            // sprites sit toward the tile's front to look planted.
            const groundY = model ? s.y : s.y + TILE_H * 0.5 * cam.zoom;
            ctx!.save();
            ctx!.globalAlpha = 0.22;
            ctx!.fillStyle = "#10300f";
            ctx!.beginPath();
            ctx!.ellipse(s.x, groundY, TILE_W * 0.46 * cam.zoom, TILE_H * 0.42 * cam.zoom, 0, 0, Math.PI * 2);
            ctx!.fill();
            ctx!.restore();
            // moving highlight ring
            if (isMoving) {
              const pulse = 0.5 + 0.5 * Math.sin(now / 200);
              ctx!.save();
              ctx!.globalAlpha = 0.5 + 0.4 * pulse;
              ctx!.strokeStyle = "#ffffff";
              ctx!.lineWidth = 3 * cam.zoom;
              ctx!.setLineDash([8 * cam.zoom, 6 * cam.zoom]);
              ctx!.beginPath();
              ctx!.ellipse(s.x, s.y, w * 0.46, w * 0.23, 0, 0, Math.PI * 2);
              ctx!.stroke();
              ctx!.restore();
            }
            ctx!.save();
            if (isMoving) ctx!.globalAlpha = 0.65;
            if (model) {
              // Size the frame so the model's footprint ≈ one tile wide, and
              // anchor its projected base-center exactly on the tile center.
              // Offset the shown frame by the view yaw so the model turns with
              // the camera (looks truly 3D as you orbit).
              const n = model.frames.length;
              const camSteps = Math.round(((cam.rot ?? 0) / (Math.PI * 2)) * n);
              const frame = model.frames[((((b.rot ?? 0) - camSteps) % n) + n) % n];
              // footFrac is the model's circumscribed-circle width, so target a
              // bit over a tile to make the actual base ~fill the square.
              const ds = (TILE_W * MODEL_TILE_FILL * cam.zoom) / model.footFrac;
              ctx!.drawImage(frame, s.x - model.base.x * ds, groundY - model.base.y * ds, ds, ds);
            } else if (img) {
              const h = w * (img.height / img.width);
              ctx!.drawImage(img, s.x - w / 2, groundY - h, w, h);
            } else {
              ctx!.fillStyle = bColor;
              ctx!.fillRect(s.x - w / 4, s.y - w * 0.6, w / 2, w * 0.6);
            }
            ctx!.restore();
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

        const iso = gridToIso(a.col, a.row, cam.rot);
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

      // Painter's order by projected screen-Y so depth stays correct at any
      // view yaw (objects lower on screen are nearer the camera, drawn last).
      draws.sort((p, q) => p.y - q.y || p.depth - q.depth);
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
      const cam = camRef.current;
      // Road tool: paint on press and start drag-painting (don't pan).
      if (roadToolRef.current) {
        const cell = screenToGrid(p.x, p.y, cam, canvas!.clientWidth, canvas!.clientHeight);
        if (cell.col >= 0 && cell.row >= 0 && cell.col < GRID && cell.row < GRID) {
          cbRef.current.onPaintRoad(cell.col, cell.row, roadToolRef.current === "erase-road");
        }
        dragRef.current = { on: true, lx: p.x, ly: p.y, moved: true };
        return;
      }
      dragRef.current = { on: true, lx: p.x, ly: p.y, moved: false };
    }
    function onMove(e: MouseEvent) {
      const p = getPos(e);
      const cam = camRef.current;
      hoverRef.current = screenToGrid(p.x, p.y, cam, canvas!.clientWidth, canvas!.clientHeight);
      if (!dragRef.current.on) return;
      // Road tool: paint along the drag instead of panning.
      if (roadToolRef.current) {
        const cell = hoverRef.current;
        if (cell.col >= 0 && cell.row >= 0 && cell.col < GRID && cell.row < GRID) {
          cbRef.current.onPaintRoad(cell.col, cell.row, roadToolRef.current === "erase-road");
        }
        return;
      }
      const dx = p.x - dragRef.current.lx;
      const dy = p.y - dragRef.current.ly;
      if (Math.abs(dx) + Math.abs(dy) > 3) dragRef.current.moved = true;
      cam.x += dx;
      cam.y += dy;
      dragRef.current.lx = p.x;
      dragRef.current.ly = p.y;
    }
    function onUp(e: MouseEvent) {
      // `on` is only set by the canvas mousedown handler, so a press that began
      // on a UI overlay (the dock, panels, modals) never sets it. Ignore those
      // — otherwise clicking the dock would pick/deselect a map tile underneath,
      // deselecting the building and unmounting the button mid-click.
      const startedOnCanvas = dragRef.current.on;
      const wasDrag = dragRef.current.moved;
      const wasRoad = !!roadToolRef.current;
      dragRef.current.on = false;
      if (!startedOnCanvas) return;
      if (wasRoad) return; // road painting handled on down/move
      if (wasDrag) return;
      const p = getPos(e);
      const cam = camRef.current;
      const cell = screenToGrid(p.x, p.y, cam, canvas!.clientWidth, canvas!.clientHeight);
      const inGrid = cell.col >= 0 && cell.row >= 0 && cell.col < GRID && cell.row < GRID;

      // MOVE mode: relocate the building being moved to the clicked tile.
      // Only valid in-grid, unoccupied tiles — never off the terrain.
      if (movingRef.current) {
        cbRef.current.onPickTile(null);
        if (
          inGrid &&
          !buildingAt(cell.col, cell.row) &&
          !roads.current.has(`${cell.col},${cell.row}`)
        ) {
          cbRef.current.onMoveTo(movingRef.current, cell.col, cell.row);
        }
        return;
      }

      // PLACE mode: drop a new building — only on a real terrain tile.
      if (placingActiveRef.current) {
        cbRef.current.onPickTile(null);
        if (
          inGrid &&
          !buildingAt(cell.col, cell.row) &&
          !roads.current.has(`${cell.col},${cell.row}`)
        ) {
          cbRef.current.onPlace(cell.col, cell.row);
        }
        return;
      }

      // agent click first (they sit on top)
      let pickedAgent: string | null = null;
      let bestD = 42;
      for (const a of agents.current) {
        const iso = gridToIso(a.col, a.row, cam.rot);
        const s = isoToScreen(iso.x, iso.y, cam, canvas!.clientWidth, canvas!.clientHeight);
        const d = Math.hypot(s.x - p.x, s.y - (p.y + 20));
        if (d < bestD) {
          bestD = d;
          pickedAgent = a.id;
        }
      }
      if (pickedAgent) {
        cbRef.current.onPickTile(null);
        cbRef.current.onPickAgent(pickedAgent);
        return;
      }

      // building click — test the rendered sprite, not just the base tile
      const b =
        buildingAtScreen(p.x, p.y, cam, canvas!.clientWidth, canvas!.clientHeight) ??
        (inGrid ? buildingAt(cell.col, cell.row) : undefined);
      if (b) {
        cbRef.current.onPickTile(null);
        cbRef.current.onPickBuilding(b);
      } else {
        // Clicked empty ground — highlight that tile and open the dock there.
        cbRef.current.onPickTile(inGrid ? { col: cell.col, row: cell.row } : null);
        cbRef.current.onDeselect();
      }
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
      const inGrid = cell.col >= 0 && cell.row >= 0 && cell.col < GRID && cell.row < GRID;
      const b =
        buildingAtScreen(p.x, p.y, cam, canvas!.clientWidth, canvas!.clientHeight) ??
        (inGrid ? buildingAt(cell.col, cell.row) : undefined);
      if (b) cbRef.current.onContextBuilding(b, e.clientX, e.clientY);
    }

    // Q / E orbit the view (yaw only).
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const k = e.key.toLowerCase();
      if (k !== "q" && k !== "e") return;
      const cam = camRef.current;
      const next = (cam.rotTarget ?? 0) + (k === "q" ? -1 : 1) * (Math.PI / 2);
      cam.rotTarget = next;
      cam.rot = next;
    }

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("keydown", onKey);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", onContext);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContext);
    };
  }, [agents, buildingAt, buildingAtScreen, roads]);

  // Plain arrow pointer for navigation (no grab "hand"); a crosshair while
  // actively placing / moving a building or painting roads.
  const cursor = placingActive || movingId || roadTool ? "cursor-crosshair" : "cursor-default";
  return (
    <>
      <canvas ref={canvasRef} className={`block h-full w-full ${cursor}`} />
      {/* Orbit controls (yaw only) — also Q / E on the keyboard. */}
      <div className="pointer-events-none absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
        <button
          onClick={() => rotateView(-1)}
          title="Rotate left (Q)"
          className="pointer-events-auto grid h-11 w-11 place-items-center rounded-2xl border border-black/5 bg-[#F0F4E1]/95 text-xl shadow-md transition hover:-translate-y-0.5 hover:bg-[#F6F8E8]"
        >
          ⟲
        </button>
        <button
          onClick={() => rotateView(1)}
          title="Rotate right (E)"
          className="pointer-events-auto grid h-11 w-11 place-items-center rounded-2xl border border-black/5 bg-[#F0F4E1]/95 text-xl shadow-md transition hover:-translate-y-0.5 hover:bg-[#F6F8E8]"
        >
          ⟳
        </button>
      </div>
    </>
  );
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// How much of a tile a 3D building footprint should fill (1.0 ≈ one square).
// footFrac is the model's circumscribed circle, ~1.4× its base. Lowered to
// leave margin so buildings sit comfortably inside the (now larger) tiles.
const MODEL_TILE_FILL = 1.12;

// Organic grass: a small palette of close greens, picked deterministically per
// tile (so it's randomly scattered but stable across frames — no flicker).
const GRASS_SHADES = ["#8ed16a", "#86c863", "#94d572", "#82c45e", "#8bce66", "#90d06d"];
function grassShade(c: number, r: number): string {
  const h = Math.sin(c * 127.1 + r * 311.7) * 43758.5453;
  const f = h - Math.floor(h); // 0..1
  return GRASS_SHADES[Math.floor(f * GRASS_SHADES.length) % GRASS_SHADES.length];
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
