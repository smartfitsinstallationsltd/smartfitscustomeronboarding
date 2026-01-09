export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    // 🔧 PUT YOUR APPS SCRIPT WEB APP URL HERE (deployed as Web App, anyone with link)
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxJ48d-Ykqvmvdwbhv4eJG_aJDySvl_rVtbjSNu-TrsrNylmdPm2NqYO5a97BY4tR-Ycg/exec";

    const resp = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    // Apps Script returns JSON string
    return new Response(text, {
      status: resp.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message || err) }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}

export async function onRequestGet() {
  return new Response(JSON.stringify({ ok: true, message: "SmartFits API online (POST only)." }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
