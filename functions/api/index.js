export async function onRequest(context) {
  const { request, env } = context;

  // /api (no extra path)
  return handleApiRequest({ request, env, route: "" });
}

/* ---------------- Core Handler ---------------- */

async function handleApiRequest({ request, env, route }) {
  // CORS / preflight
  if (request.method === "OPTIONS") return corsPreflight(env);

  // We only support POST for the API
  if (request.method !== "POST") {
    return json(
      { ok: false, error: "Method Not Allowed" },
      405,
      env
    );
  }

  // Basic health check
  if (!route) {
    return json(
      {
        ok: true,
        service: "smartfits-onboarding-api",
        hint: "Use /api/admin-login, /api/whoami, /api/submit, /api/files, /api/delete-file, /api/logs",
      },
      200,
      env
    );
  }

  return json({ ok: false, error: "Not Found" }, 404, env);
}

/* ---------------- Helpers ---------------- */

function corsPreflight(env) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(env),
  });
}

function corsHeaders(env) {
  // Lock this down if you want by setting ALLOWED_ORIGIN to your domain
  const origin = env.ALLOWED_ORIGIN || "*";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function json(obj, status = 200, env) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(env),
    },
  });
}
