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

/* ------------------------------------------------------------------ */
/* In-game confirmation modal — replaces native confirm() popups.      */
/* Centered, game-styled, with a clear destructive action color.       */
/* ------------------------------------------------------------------ */

export interface ConfirmSpec {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger,
  onConfirm,
  onCancel,
}: ConfirmSpec & { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b0d14]/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-[min(400px,94vw)] animate-[popIn_.16s_ease-out] rounded-3xl border border-white/12 bg-[#0f1118] p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg"
            style={{ background: danger ? "#ef444422" : "#f59e0b22" }}
          >
            {danger ? "🗑️" : "⚠️"}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-white">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/60">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/10"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-xl px-5 py-2 text-sm font-bold text-white shadow ${
              danger ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
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
