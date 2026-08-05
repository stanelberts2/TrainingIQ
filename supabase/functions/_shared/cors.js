function normalizeOrigin(value) {
  if (!value) return "";
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

const allowedOrigins = new Set([
  normalizeOrigin(Deno.env.get("APP_URL")),
  "https://stanelberts2.github.io",
  "http://127.0.0.1:5174",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
].filter(Boolean));

export function getCorsHeaders(req = null) {
  const requestOrigin = req?.headers?.get("Origin") || "";
  const fallbackOrigin = normalizeOrigin(Deno.env.get("APP_URL")) || "http://127.0.0.1:5174";
  const allowedOrigin = allowedOrigins.has(requestOrigin) ? requestOrigin : fallbackOrigin;

  return {
    ...corsHeaders,
    "Access-Control-Allow-Origin": allowedOrigin,
    Vary: "Origin",
  };
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": normalizeOrigin(Deno.env.get("APP_URL")) || "http://127.0.0.1:5174",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  Vary: "Origin",
};

export function jsonResponse(body, status = 200, req = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(req),
      "Content-Type": "application/json",
    },
  });
}

export function errorResponse(message, status = 400, req = null) {
  return jsonResponse({ error: message }, status, req);
}
