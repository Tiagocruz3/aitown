import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Your App" },
      { name: "description", content: "Replace with a one-sentence description." },
    ],
  }),
  component: Index,
});

// Replace this placeholder. Routes are server-rendered — keep render SSR-safe
// (no window/document at module top level or during render). See ./README.md.
function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <img
        data-higgsfield-blank-page-placeholder="REMOVE_THIS"
        src="https://cdn.gpteng.co/blank-app-v1.svg"
        alt="Your app will live here!"
      />
    </div>
  );
}
