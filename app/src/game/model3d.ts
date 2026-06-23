// Pre-render a GLB model into isometric "rotation frames" (2D sprites) using
// Three.js, so a real 3D model can live inside the existing 2D isometric canvas
// renderer. We render the model once at N yaw angles to offscreen canvases and
// the game then blits the right frame per building — no per-frame WebGL cost,
// and it depth-sorts with everything else like any other sprite.
//
// Client-only (guarded). Frames are cached per URL.

export const MODEL_FRAMES = 16; // yaw steps (22.5° each)
const FRAME_SIZE = 512; // px per rendered frame
const ISO_ELEVATION = Math.atan(0.5); // 2:1 dimetric, matches the 128x64 tiles
const ISO_AZIMUTH = Math.PI / 4;

interface ModelEntry {
  frames: HTMLCanvasElement[];
  ready: boolean;
  failed: boolean;
}

const cache = new Map<string, ModelEntry>();

export function getModelFrames(url: string): HTMLCanvasElement[] | null {
  const e = cache.get(url);
  return e && e.ready ? e.frames : null;
}

// Kick off rendering (idempotent). `onReady` fires once frames are available.
export function ensureModel(url: string, onReady?: () => void): void {
  if (typeof window === "undefined") return;
  if (cache.has(url)) {
    const e = cache.get(url)!;
    if (e.ready) onReady?.();
    return;
  }
  const entry: ModelEntry = { frames: [], ready: false, failed: false };
  cache.set(url, entry);
  renderFrames(url)
    .then((frames) => {
      entry.frames = frames;
      entry.ready = true;
      onReady?.();
    })
    .catch((err) => {
      entry.failed = true;
      // eslint-disable-next-line no-console
      console.error("[model3d] failed to render", url, err);
    });
}

async function renderFrames(url: string): Promise<HTMLCanvasElement[]> {
  const THREE = await import("three");
  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(FRAME_SIZE, FRAME_SIZE);
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(5, 9, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xcfe6ff, 0.55);
  fill.position.set(-6, 4, -4);
  scene.add(fill);

  const gltf = await new Promise<{ scene: import("three").Group }>((resolve, reject) =>
    new GLTFLoader().load(url, resolve, undefined, reject),
  );
  const model = gltf.scene;

  // Center on X/Z and sit the base at y=0, inside a pivot so yaw rotates around
  // the building's vertical axis.
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const height = box.max.y - box.min.y;
  model.position.set(-center.x, -box.min.y, -center.z);
  const pivot = new THREE.Group();
  pivot.add(model);
  scene.add(pivot);

  const r = sphere.radius * 1.12;
  const cam = new THREE.OrthographicCamera(-r, r, r, -r, 0.01, sphere.radius * 12);
  const d = sphere.radius * 6;
  cam.position.set(
    Math.cos(ISO_ELEVATION) * Math.sin(ISO_AZIMUTH) * d,
    Math.sin(ISO_ELEVATION) * d,
    Math.cos(ISO_ELEVATION) * Math.cos(ISO_AZIMUTH) * d,
  );
  cam.lookAt(0, height * 0.5, 0);

  const frames: HTMLCanvasElement[] = [];
  for (let i = 0; i < MODEL_FRAMES; i++) {
    pivot.rotation.y = (i / MODEL_FRAMES) * Math.PI * 2;
    renderer.render(scene, cam);
    const c = document.createElement("canvas");
    c.width = FRAME_SIZE;
    c.height = FRAME_SIZE;
    c.getContext("2d")!.drawImage(renderer.domElement, 0, 0);
    frames.push(c);
  }

  renderer.dispose();
  return frames;
}
