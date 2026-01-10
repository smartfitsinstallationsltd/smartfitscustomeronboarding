export async function onRequest(context) {
  const { request, env, params } = context;

  // In Pages Functions, [...route] becomes params.route as an array
  const route = Array.isArray(params?.route) ? params.route.join("/") : String(params?.route || "");

  return handleApiRequest({ request, env, route });
}

/* ---------------- Core Handler ---------------- */

async function handleApiRequest({ request, env, route }) {
  // CORS / preflight
  if (request.method === "OPTIONS") return corsPreflight(env);

  // POST only
  if (request.method !== "POST") {
    return json({ ok: false, error: "Method Not Allowed" }, 405, env);
  }

  const body = await safeJson(request);
  // We only expect JSON bodies
  if (!body) return json({ ok: false, error: "Invalid JSON" }, 400, env);

  // Route switch
  switch (route) {
    case "admin-login":
      return adminLogin(body, env);

    case "whoami":
      return whoami(body, env);

    case "submit":
      return proxyToGAS("submit", body, env);

    case "files":
      return proxyToGAS("files", body, env);

    case "delete-file":
      return proxyToGAS("delete-file", body, env);

    case "logs":
      // Enforce logs permission at the edge too
      return logs(body, env);

    default:
      return json({ ok: false, error: "Not Found" }, 404, env);
  }
}

/* ---------------- Auth (token) ----------------
   Token format: base64url(payload).base64url(hmacSha256(payload))
   Payload: { email, name, canViewLogs, exp }
*/

async function adminLogin(body, env) {
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password) {
    return json({ ok: false, error: "Email and password are required." }, 400, env);
  }

  // Option A (recommended): proxy login to your Google Apps Script backend,
  // which validates password + returns admin profile.
  // Set GAS_API_URL in Cloudflare env vars.
  if (env.GAS_API_URL) {
    const res = await proxyToGASRaw("admin-login", { email, password }, env);
    if (!res.ok) return json({ ok: false, error: res.error || "Login failed" }, 401, env);

    const admin = res.admin;
    if (!admin?.email) return json({ ok: false, error: "Invalid admin response" }, 500, env);

    const token = await mintToken(
      {
        email: admin.email,
        name: admin.name || admin.email,
        canViewLogs: !!admin.canViewLogs,
      },
      env
    );

    return json({ ok: true, token, admin: { ...admin, canViewLogs: !!admin.canViewLogs } }, 200, env);
  }

  // Option B: local allowlist (no GAS) — set ADMIN_ALLOWLIST_JSON + ADMIN_PASSWORDS_JSON + TOKEN_SECRET
  // ADMIN_ALLOWLIST_JSON example:
  // [{"email":"tara@smartfits.co.uk","name":"Tara Hassall","canViewLogs":true},{"email":"charlie@smartfits.co.uk","name":"Charlie Inger","canViewLogs":false}]
  // ADMIN_PASSWORDS_JSON example:
  // {"tara@smartfits.co.uk":"SomeStrongPassword","charlie@smartfits.co.uk":"AnotherStrongPassword"}
  const allow = parseJson(env.ADMIN_ALLOWLIST_JSON, []);
  const pwMap = parseJson(env.ADMIN_PASSWORDS_JSON, {});

  const admin = allow.find((a) => String(a.email || "").toLowerCase() === email);
  if (!admin) return json({ ok: false, error: "Invalid credentials" }, 401, env);

  const expected = pwMap[email];
  if (!expected || expected !== password) {
    return json({ ok: false, error: "Invalid credentials" }, 401, env);
  }

  const token = await mintToken(
    { email, name: admin.name || email, canViewLogs: !!admin.canViewLogs },
    env
  );

  return json({ ok: true, token, admin: { email, name: admin.name || email, canViewLogs: !!admin.canViewLogs } }, 200, env);
}

async function whoami(body, env) {
  const token = String(body.token || "");

  const verified = await verifyToken(token, env);
  if (!verified.ok) return json({ ok: false, error: "Unauthorised" }, 401, env);

  return json(
    {
      ok: true,
      admin: {
        email: verified.payload.email,
        name: verified.payload.name,
        canViewLogs: !!verified.payload.canViewLogs,
      },
    },
    200,
    env
  );
}

async function logs(body, env) {
  const token = String(body.token || "");
  const verified = await verifyToken(token, env);
  if (!verified.ok) return json({ ok: false, error: "Unauthorised" }, 401, env);

  if (!verified.payload.canViewLogs) {
    // This is how Charlie "won't even see it" — frontend hides it,
    // and backend blocks it too.
    return json({ ok: false, error: "Forbidden" }, 403, env);
  }

  // If using GAS, proxy it
  if (env.GAS_API_URL) return proxyToGAS("logs", body, env);

  // Otherwise, you’d need KV/D1 etc. We’ll return empty to keep safe.
  return json({ ok: true, logs: [] }, 200, env);
}

/* ---------------- Proxy to Google Apps Script ----------------
   You can keep all storage logic there (Drive, Sheets, logs).
   Cloudflare just forwards and applies auth.
*/

async function proxyToGAS(action, body, env) {
  const res = await proxyToGASRaw(action, body, env);
  if (!res.ok) return json({ ok: false, error: res.error || "Request failed" }, res.status || 400, env);
  return json(res, 200, env);
}

async function proxyToGASRaw(action, body, env) {
  if (!env.GAS_API_URL) {
    return { ok: false, status: 500, error: "GAS_API_URL is not set in environment variables." };
  }

  try {
    const upstream = await fetch(env.GAS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: false, error: text || `Upstream error (${upstream.status})` };
    }

    if (!upstream.ok) {
      return { ok: false, status: upstream.status, error: data?.error || `Upstream error (${upstream.status})` };
    }

    return data;
  } catch (err) {
    return { ok: false, status: 500, error: err?.message || "Proxy error" };
  }
}

/* ---------------- Token helpers ---------------- */

async function mintToken({ email, name, canViewLogs }, env) {
  const secret = env.TOKEN_SECRET;
  if (!secret) throw new Error("TOKEN_SECRET is not set");

  const payload = {
    email,
    name,
    canViewLogs: !!canViewLogs,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };

  const payloadStr = JSON.stringify(payload);
  const payloadB64 = b64urlEncode(new TextEncoder().encode(payloadStr));
  const sigB64 = await hmacB64Url(payloadStr, secret);

  return `${payloadB64}.${sigB64}`;
}

async function verifyToken(token, env) {
  try {
    const secret = env.TOKEN_SECRET;
    if (!secret) return { ok: false };

    const [payloadB64, sigB64] = String(token || "").split(".");
    if (!payloadB64 || !sigB64) return { ok: false };

    const payloadStr = new TextDecoder().decode(b64urlDecode(payloadB64));
    const expectedSig = await hmacB64Url(payloadStr, secret);

    if (!timingSafeEqual(sigB64, expectedSig)) return { ok: false };

    const payload = JSON.parse(payloadStr);
    if (!payload?.exp || Date.now() > payload.exp) return { ok: false };

    return { ok: true, payload };
  } catch {
    return { ok: false };
  }
}

async function hmacB64Url(message, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return b64urlEncode(new Uint8Array(sig));
}

/* ---------------- Small utilities ---------------- */

async function safeJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function parseJson(str, fallback) {
  try {
    if (!str) return fallback;
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function timingSafeEqual(a, b) {
  const aa = String(a || "");
  const bb = String(b || "");
  if (aa.length !== bb.length) return false;
  let out = 0;
  for (let i = 0; i < aa.length; i++) out |= aa.charCodeAt(i) ^ bb.charCodeAt(i);
  return out === 0;
}

function b64urlEncode(bytes) {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlDecode(str) {
  const pad = "=".repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/* ---------------- Response helpers ---------------- */

function corsPreflight(env) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(env),
  });
}

function corsHeaders(env) {
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
