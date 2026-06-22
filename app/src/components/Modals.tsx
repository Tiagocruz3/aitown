import { useState } from "react";

/* ------------------------------------------------------------------ */
/* Shared UI bits used across the game (context menu, image, backdrop)  */
/* ------------------------------------------------------------------ */

export function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: { label: string; danger?: boolean; onClick: () => void }[];
  onClose: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <div className="fixed z-50 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#161823] py-1 shadow-2xl" style={{ left: x, top: y }}>
        {items.map((it) => (
          <button
            key={it.label}
            onClick={() => {
              it.onClick();
              onClose();
            }}
            className={`block w-full px-4 py-2 text-left text-sm hover:bg-white/10 ${it.danger ? "text-red-400" : "text-white/85"}`}
          >
            {it.label}
          </button>
        ))}
      </div>
    </>
  );
}

// Renders a cross-origin image as a normal <img>; falls back to a colored chip if it fails.
export function BrandImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return <div className={className} style={{ borderRadius: 12, background: "#ffffff14" }} aria-label={alt} />;
  }
  return <img src={src} alt={alt} className={className} onError={() => setOk(false)} />;
}

export function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose}>
      {children}
    </div>
  );
}
