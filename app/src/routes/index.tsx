import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Game } from "../components/Game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgentVillage OS — Your AI company as a living town" },
      {
        name: "description",
        content:
          "AgentVillage OS: a next-gen AI operating system visualized as a living isometric town. Build, hire AI agents, and run a digital company.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  // The game is fully client-side (canvas, window, localStorage). Render a
  // lightweight loading shell on the server / first paint, then mount the game.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center bg-[#8fd3ff] text-center">
        <div className="text-5xl">🏙️</div>
        <h1 className="mt-3 text-2xl font-extrabold text-[#11131c]">AgentVillage OS</h1>
        <p className="mt-1 text-sm text-[#11131c]/70">Loading your village…</p>
      </div>
    );
  }

  return <Game />;
}
