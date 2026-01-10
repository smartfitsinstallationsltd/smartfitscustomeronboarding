// ============================
// CONFIG (SET THIS)
// ============================
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxJ48d-Ykqvmvdwbhv4eJG_aJDySvl_rVtbjSNu-TrsrNylmdPm2NqYO5a97BY4tR-Ycg/exec";

// ============================
// Helpers
// ============================
const $ = (id) => document.getElementById(id);

function openModal(id){ $(id).classList.add("show"); $(id).setAttribute("aria-hidden","false"); }
function closeModal(id){ $(id).classList.remove("show"); $(id).setAttribute("aria-hidden","true"); }

function fmtNiceDate(isoOrString){
  const d = new Date(isoOrString);
  if (Number.isNaN(d.getTime())) return String(isoOrString || "");
  // e.g. 10 January 2026 at 10:41 AM GMT
  const opts = { day:"numeric", month:"long", year:"numeric" };
  const datePart = d.toLocaleDateString("en-GB", opts);
  const timePart = d.toLocaleTimeString("en-GB", { hour:"numeric", minute:"2-digit", hour12:true });
  return `${datePart} at ${timePart} GMT`;
}

async function api(action, payload = {}, token = null){
  const res = await fetch("/api/" + action, {
    method: "POST",
    headers: { "Content-Type":"application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.ok === false) {
    const msg = json.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return json;
}

// ============================
// Policy checkbox
// ============================
const acceptPolicy = $("acceptPolicy");
const acceptPolicyValue = $("acceptPolicyValue");

if (acceptPolicy) {
  acceptPolicy.addEventListener("change", () => {
    acceptPolicyValue.value = acceptPolicy.checked ? "Yes" : "No";
  });
}

// ============================
// Policy modal
// ============================
$("openPolicyBtn")?.addEventListener("click", () => openModal("policyModal"));

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-close]");
  if (!btn) return;
  closeModal(btn.getAttribute("data-close"));
});

// ============================
// Person modal
// ============================
document.querySelectorAll(".person").forEach((btn) => {
  btn.addEventListener("click", () => {
    const data = JSON.parse(btn.getAttribute("data-person") || "{}");
    $("personTitle").textContent = data.name || "Team Member";
    $("personImg").src = data.img || "";
    $("personImg").alt = data.name || "";
    $("personName").textContent = data.name || "";
    $("personRole").textContent = data.role || "";

    const email = data.email || "";
    const phone = data.phone || "";

    $("personEmailLine").textContent = email ? `Email: ${email}` : "Email: —";
    $("personPhoneLine").textContent = phone ? `Phone: ${phone}` : "Phone: —";

    const emailBtn = $("personEmailBtn");
    emailBtn.classList.toggle("hidden", !email);
    emailBtn.href = email ? `mailto:${email}` : "#";

    const callBtn = $("personCallBtn");
    callBtn.classList.toggle("hidden", !phone);
    callBtn.href = phone ? `tel:${phone.replace(/\s+/g,"")}` : "#";

    openModal("personModal");
  });
});

// ============================
// Form submit
// ============================
$("clearBtn")?.addEventListener("click", () => {
  $("deploymentForm").reset();
  acceptPolicyValue.value = "No";
  $("status").textContent = "";
});

$("deploymentForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = $("status");
  status.textContent = "Submitting…";

  try{
    const form = e.target;
    const data = Object.fromEntries(new FormData(form).entries());

    if (!data.acceptPolicyValue || data.acceptPolicyValue !== "Yes") {
      throw new Error("Please accept the Cancellation Policy to continue.");
    }

    await api("submit", { action:"submitForm", ...data, appsScriptUrl: APPS_SCRIPT_URL });

    status.textContent = "Submitted successfully. Thank you for the business.";
    form.reset();
    acceptPolicyValue.value = "No";
  }catch(err){
    status.textContent = `Error: ${err.message}`;
  }
});

// ============================
// Admin modal state + auth
// ============================
let adminToken = localStorage.getItem("sf_admin_token") || "";
let adminInfo = null;

function setAdminUI(signedIn){
  $("adminSignedOutView").classList.toggle("hidden", signedIn);
  $("adminSignedInView").classList.toggle("hidden", !signedIn);
}

function setLogsVisibility(){
  const can = !!(adminInfo && adminInfo.canViewLogs);
  $("logsCard").classList.toggle("hidden", !can);
}

$("openAdminBtn")?.addEventListener("click", async () => {
  openModal("adminModal");
  await tryRestoreSession();
});

async function tryRestoreSession(){
  if (!adminToken) {
    adminInfo = null;
    setAdminUI(false);
    return;
  }
  try{
    const r = await api("whoami", { action:"whoami", appsScriptUrl: APPS_SCRIPT_URL }, adminToken);
    adminInfo = r.admin;
    $("adminSignedInAs").textContent = `Signed in as ${adminInfo.name} (${adminInfo.email})`;
    setAdminUI(true);
    setLogsVisibility();
  }catch{
    adminToken = "";
    localStorage.removeItem("sf_admin_token");
    adminInfo = null;
    setAdminUI(false);
  }
}

// login
$("adminClearBtn")?.addEventListener("click", () => {
  $("adminEmail").value = "";
  $("adminPassword").value = "";
  $("adminLoginStatus").textContent = "";
});

$("adminLoginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  $("adminLoginStatus").textContent = "Signing in…";
  try{
    const email = $("adminEmail").value.trim();
    const password = $("adminPassword").value;

    const r = await api("admin-login", { action:"adminLogin", email, password, appsScriptUrl: APPS_SCRIPT_URL });
    adminToken = r.token;
    localStorage.setItem("sf_admin_token", adminToken);
    adminInfo = r.admin;

    $("adminSignedInAs").textContent = `Signed in as ${adminInfo.name} (${adminInfo.email})`;
    setAdminUI(true);
    setLogsVisibility();
    $("adminLoginStatus").textContent = "";
  }catch(err){
    $("adminLoginStatus").textContent = `Login failed: ${err.message}`;
  }
});

$("adminLogoutBtn")?.addEventListener("click", () => {
  adminToken = "";
  adminInfo = null;
  localStorage.removeItem("sf_admin_token");
  setAdminUI(false);
});

// ============================
// Files search (name-only + toggle date)
// ============================
let dateEnabled = false;

function updateSearchMode(){
  $("dateFilters").classList.toggle("hidden", !dateEnabled);
  $("searchOnlyActions").classList.toggle("hidden", dateEnabled);
  $("toggleDateBtn").textContent = dateEnabled ? "Hide date search" : "Search by date too";
}

$("toggleDateBtn")?.addEventListener("click", () => {
  dateEnabled = !dateEnabled;
  updateSearchMode();
});

updateSearchMode();

async function loadFiles(){
  const status = $("filesStatus");
  status.textContent = "Searching…";
  $("filesTbody").innerHTML = "";

  try{
    const query = $("fileQuery").value.trim();
    const fromDate = dateEnabled ? ($("fromDate").value || "") : "";
    const toDate = dateEnabled ? ($("toDate").value || "") : "";

    const r = await api("files", {
      action:"listFiles",
      query,
      fromDate,
      toDate,
      appsScriptUrl: APPS_SCRIPT_URL
    }, adminToken);

    const files = r.files || [];
    if (!files.length){
      $("filesTbody").innerHTML = `<tr><td colspan="3" class="muted">No results.</td></tr>`;
      status.textContent = "";
      return;
    }

    $("filesTbody").innerHTML = files.map(f => {
      const safeName = (f.name || "").replace(/</g,"&lt;").replace(/>/g,"&gt;");
      return `
        <tr>
          <td>${safeName}</td>
          <td class="nowrap">${f.created || ""}</td>
          <td class="nowrap">
            <div class="actionRow">
              <a class="actionLink" href="${f.url}" target="_blank" rel="noopener">View</a>
              <button class="pillDanger" type="button" data-del="${f.id}" data-name="${safeName}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    status.textContent = "";
  }catch(err){
    status.textContent = `Error: ${err.message}`;
    $("filesTbody").innerHTML = `<tr><td colspan="3" class="muted">Search failed.</td></tr>`;
  }
}

$("fileSearchBtn")?.addEventListener("click", loadFiles);
$("fileSearchBtn2")?.addEventListener("click", loadFiles);

$("filesTable")?.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-del]");
  if (!btn) return;
  const id = btn.getAttribute("data-del");
  const name = btn.getAttribute("data-name") || "this file";
  if (!confirm(`Delete ${name}?`)) return;

  $("filesStatus").textContent = "Deleting…";
  try{
    await api("delete-file", { action:"deleteFile", fileId:id, appsScriptUrl: APPS_SCRIPT_URL }, adminToken);
    await loadFiles();
  }catch(err){
    $("filesStatus").textContent = `Error: ${err.message}`;
  }
});

// ============================
// Logs (plain English + details modal)
// ============================
function summarizeLog(l){
  const t = (l.actionType || "").toUpperCase();
  if (t === "LOGIN") return "Admin signed in";
  if (t === "DELETE_FILE") return "Deleted file";
  if (t === "SEND_WELCOME_EMAIL") return "Prepared welcome email";
  return "Activity";
}

function buildLogDetails(l){
  let detailsObj = {};
  try{ detailsObj = l.details ? JSON.parse(l.details) : {}; }catch{ detailsObj = { raw: l.details }; }

  const lines = [];
  lines.push(`<div class="miniTitle">User</div><div>${(l.adminEmail || "")}</div>`);
  lines.push(`<div class="lineGap"></div>`);
  lines.push(`<div class="miniTitle">Action</div><div>${(l.actionType || "")}</div>`);
  lines.push(`<div class="lineGap"></div>`);
  lines.push(`<div class="miniTitle">Timestamp</div><div>${fmtNiceDate(l.timestamp)}</div>`);

  // nice extras
  if (detailsObj.fileName){
    lines.push(`<div class="lineGap"></div>`);
    lines.push(`<div class="miniTitle">File Name</div><div>${detailsObj.fileName}</div>`);
  }
  if (detailsObj.customerEmail){
    lines.push(`<div class="lineGap"></div>`);
    lines.push(`<div class="miniTitle">Customer Email</div><div>${detailsObj.customerEmail}</div>`);
  }
  if (!detailsObj.fileName && !detailsObj.customerEmail && l.details){
    lines.push(`<div class="lineGap"></div>`);
    lines.push(`<div class="miniTitle">Raw Details</div><pre style="white-space:pre-wrap;margin:0;color:#cbd5e1">${String(l.details)}</pre>`);
  }

  return `<div style="display:grid; gap:6px;">${lines.join("")}</div>`;
}

$("loadLogsBtn")?.addEventListener("click", async () => {
  const status = $("logsStatus");
  status.textContent = "Loading…";
  $("logsTbody").innerHTML = "";

  try{
    const r = await api("logs", {
      action:"listLogs",
      fromDate: $("logFrom").value || "",
      toDate: $("logTo").value || "",
      adminEmail: $("logEmailContains").value.trim(),
      actionType: $("logType").value || "",
      appsScriptUrl: APPS_SCRIPT_URL
    }, adminToken);

    const logs = r.logs || [];
    if (!logs.length){
      $("logsTbody").innerHTML = `<tr><td colspan="4" class="muted">No logs found.</td></tr>`;
      status.textContent = "";
      return;
    }

    $("logsTbody").innerHTML = logs.map((l, idx) => {
      const when = fmtNiceDate(l.timestamp);
      const admin = `${l.adminName || ""} (${l.adminEmail || ""})`;
      const action = l.actionType || "";
      const summary = summarizeLog(l);
      const payload = encodeURIComponent(JSON.stringify(l));
      return `
        <tr data-log="${payload}" style="cursor:pointer;">
          <td class="nowrap">${when}</td>
          <td>${admin}</td>
          <td class="nowrap">${action}</td>
          <td>${summary}</td>
        </tr>
      `;
    }).join("");

    status.textContent = "";
  }catch(err){
    status.textContent = `Error: ${err.message}`;
    $("logsTbody").innerHTML = `<tr><td colspan="4" class="muted">Could not load logs.</td></tr>`;
  }
});

$("logsTable")?.addEventListener("click", (e) => {
  const tr = e.target.closest("tr[data-log]");
  if (!tr) return;
  const l = JSON.parse(decodeURIComponent(tr.getAttribute("data-log")));
  $("logDetailBody").innerHTML = buildLogDetails(l);
  openModal("logDetailModal");
});

// ============================
// Welcome email (.eml + mailto fallback)
// ============================
function escapeHtml(s){
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function buildWelcomeEmailHtml(companyName, displayName){
  const url = "https://smartfitscustomeronboarding.pages.dev";
  const who = escapeHtml(displayName || companyName || "there");

  return `
<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020617;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#e5e7eb;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <div style="border:1px solid #1f2937;border-radius:16px;padding:22px;background:#020617;">
      <div style="margin-bottom:14px;">
        <span style="display:inline-block;padding:6px 10px;border:1px solid #1f2937;border-radius:999px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:99px;background:#ef4444;margin-right:8px;vertical-align:middle;"></span>
          <span style="font-weight:800;letter-spacing:.12em;font-size:12px;vertical-align:middle;">SMARTFITS</span>
        </span>
      </div>

      <h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;color:#f9fafb;">Welcome to SmartFits</h1>
      <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#e5e7eb;">Dear ${who},</p>

      <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#e5e7eb;">
        Welcome to <b>SmartFits Installations</b>. We’re delighted to have you on board and excited to begin supporting your fleet.
      </p>

      <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#e5e7eb;">
        To help you get started, we’ve prepared a dedicated Customer Onboarding Pack with everything you need to know about working with us.
      </p>

      <div style="margin:16px 0 18px;">
        <a href="${url}" style="display:inline-block;padding:10px 16px;border-radius:999px;background:#4b84ff;color:#061022;font-weight:800;text-decoration:none;font-size:14px;">
          View Customer Onboarding Pack
        </a>
      </div>

      <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#9ca3af;">Your Onboarding Pack includes:</p>
      <ul style="margin:0 0 14px 18px;padding:0;font-size:13px;line-height:1.6;color:#9ca3af;">
        <li>Key onboarding information</li>
        <li>How the installation and deployment process works</li>
        <li>Main contacts and how to reach our support team</li>
      </ul>

      <div style="margin-top:18px;padding-top:14px;border-top:1px solid #1f2937;">
        <p style="margin:0;font-size:12px;line-height:1.6;color:#9aa4b2;">
          SmartFits Installations Limited • 01283 533330 • support@smartfits.co.uk
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`.trim();
}

function buildEml({to, subject, html, text}){
  // Basic EML (works well with Outlook desktop + Apple Mail)
  const headers = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset="UTF-8"`,
  ].join("\r\n");

  return `${headers}\r\n\r\n${html || escapeHtml(text || "")}\r\n`;
}

function downloadFile(filename, content, mime){
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

$("downloadEmlBtn")?.addEventListener("click", async () => {
  const status = $("welcomeStatus");
  status.textContent = "";

  const company = $("welCompany").value.trim();
  const name = $("welName").value.trim();
  const email = $("welEmail").value.trim();

  if (!company) return status.textContent = "Please enter a company name.";
  if (!email) return status.textContent = "Please enter the customer email address.";

  const display = name || company;
  const subject = "Welcome to SmartFits – Your Customer Onboarding Pack";
  const html = buildWelcomeEmailHtml(company, display);

  // Download .eml (best for Outlook desktop)
  downloadFile(`SmartFits_Welcome_${company.replace(/\s+/g,"_")}.eml`, buildEml({
    to: email,
    subject,
    html
  }), "message/rfc822");

  status.textContent = "Downloaded .eml file. Open it and press Send.";
});

$("openMailtoBtn")?.addEventListener("click", () => {
  const company = $("welCompany").value.trim();
  const name = $("welName").value.trim();
  const email = $("welEmail").value.trim();
  const display = name || company || "there";

  if (!company || !email){
    $("welcomeStatus").textContent = "Enter company name + customer email first.";
    return;
  }

  const subject = encodeURIComponent("Welcome to SmartFits – Your Customer Onboarding Pack");
  const body = encodeURIComponent(
`Dear ${display},

Welcome to SmartFits Installations. We’re delighted to have you on board.

Please view your Customer Onboarding Pack here:
https://smartfitscustomeronboarding.pages.dev

If you have any questions, reply to this email or contact support@smartfits.co.uk.

Kind regards,
SmartFits Installations Ltd`
  );

  window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
});

// Close modals when clicking outside
document.querySelectorAll(".modalBackdrop").forEach((backdrop) => {
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal(backdrop.id);
  });
});

// Try restore session on load (only affects admin modal when opened)
tryRestoreSession();
