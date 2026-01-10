const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization",
  "access-control-max-age": "86400",
};

const ROUTE_TO_ACTION = {
  submit: "submitForm",
  "admin-login": "adminLogin",
  whoami: "whoami",
  files: "listFiles",
  "delete-file": "deleteFile",
  logs: "listLogs",
  "send-welcome": "sendWelcomeEmail",
};

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS_HEADERS },
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet({ params }) {
  return jsonResponse({ ok: true, route: params.path || "" });
}

export async function onRequestPost({ request, params, env }) {
  try {
    const gasUrl = env.GAS_WEBAPP_URL;
    if (!gasUrl) {
      return jsonResponse(
        { ok: false, error: "Missing GAS_WEBAPP_URL env var in Cloudflare Pages." },
        500
      );
    }

    const route = (params.path || "").toString(); // e.g. "admin-login"
    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    // Ensure action is set for Code.gs
    if (!body.action && ROUTE_TO_ACTION[route]) {
      body.action = ROUTE_TO_ACTION[route];
    }

    const resp = await fetch(gasUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await resp.text();

    return new Response(text, {
      status: resp.status,
      headers: {
        "content-type": resp.headers.get("content-type") || "application/json; charset=utf-8",
        ...CORS_HEADERS,
      },
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err?.message || err) }, 500);
  }
}
