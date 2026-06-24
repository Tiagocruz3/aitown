// Central library of every image generated at the Design Image Studio,
// persisted to localStorage. Capped + quota-aware (images are large data URLs).

export interface SavedImage {
  id: string;
  url: string; // data URL of the generated image
  prompt: string;
  model: string;
  provider: string; // the agent that made it
  createdAt: number;
}

const KEY = "agentvillage.imagelibrary.v1";
const MAX = 40; // hard cap on stored images

export function getImages(): SavedImage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as SavedImage[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// Write, dropping the oldest entries if we run out of storage quota.
function writeImages(list: SavedImage[]) {
  if (typeof window === "undefined") return;
  let items = list.slice(0, MAX);
  for (;;) {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
      return;
    } catch {
      if (items.length <= 1) {
        try {
          localStorage.removeItem(KEY);
        } catch {
          /* ignore */
        }
        return;
      }
      // drop the oldest (list is newest-first) and retry
      items = items.slice(0, items.length - 1);
    }
  }
}

export function addImage(img: Omit<SavedImage, "id">): SavedImage {
  const entry: SavedImage = { id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...img };
  writeImages([entry, ...getImages()]);
  return entry;
}

export function deleteImage(id: string) {
  writeImages(getImages().filter((i) => i.id !== id));
}

export function clearImages() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
