import { createStart, createMiddleware } from "@tanstack/react-start";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    // TEMP DIAGNOSTIC: surface the real server-side error to the client
    // instead of swallowing it into the generic HTML error page.
    console.error(error);
    const msg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    return new Response(JSON.stringify({ __serverError: msg, stack: (error as Error)?.stack?.slice(0, 800) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
}));
