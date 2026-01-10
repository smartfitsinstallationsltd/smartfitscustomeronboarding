// ========= Helpers =========
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

async function apiPost(path, payload) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { ok: false, error: text }; }

  if (!res.ok || json?.ok === false) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json;
}

function openModal(modalEl) {
  modalEl.classList.add("open");
  modalEl.setAttribute("aria-hidden", "false");
}
function closeModal(modalEl) {
  modalEl.classList.remove("open");
  modalEl.setAttribute("aria-hidden", "true");
}

function fmtDateTime(isoLike) {
  try {
    const d = new Date(isoLike);
    if (isNaN(d.getTime())) return String(isoLike || "");
    return d.toLocaleString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return String(isoLike || "");
  }
}

// ========= Tabs =========
const tabButtons = $$(".tabBtn");
const tabSections = $$(".tabSection");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const target = btn.dataset.tab;
    tabSections.forEach((s) => s.classList.toggle("hidden", s.dataset.tab !== target));
  });
});

// ========= Form submit message tweak =========
const deploymentForm = $("#deploymentForm");
const statusEl = $("#status");

deploymentForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!statusEl) return;

  try {
    statusEl.textContent = "Submitting…";
    statusEl.classList.remove("error");

    const fd = new FormData(deploymentForm);
    const payload = Object.fromEntries(fd.entries());
    payload.acceptPolicyValue = $("#acceptPolicy")?.checked ? "Yes" : "No";

    await apiPost("/api/submit", payload);

    statusEl.textContent = "Submitted successfully. Thank you for the business.";
  } catch (err) {
    statusEl.textContent = err.message || "Submission failed.";
    statusEl.classList.add("error");
  }
});

// ========= Person profile modal =========
const profileModal = $("#profileModal");
const profileCloseBtn = $("#closeProfileBtn");
const profileTitle = $("#profileTitle");
const profileRole = $("#profileRole");
const profileEmail = $("#profileEmail");
const profilePhone = $("#profilePhone");

profileCloseBtn?.addEventListener("click", () => closeModal(profileModal));

function showProfile({ name, role, email, phone }) {
  profileTitle.textContent = name || "";
  profileRole.textContent = role || "";

  // Contact details
  if (email) {
    profileEmail.innerHTML = `Email: <a class="contactLink" href="mailto:${email}">${email}</a>`;
    profileEmail.style.display = "block";
  } else {
    profileEmail.style.display = "none";
  }

  if (phone) {
    const tel = phone.replace(/\s+/g, "");
    profilePhone.innerHTML = `Phone: <a class="contactLink" href="tel:${tel}">${phone}</a>`;
    profilePhone.style.display = "block";
  } else {
    profilePhone.style.display = "none";
  }

  openModal(profileModal);
}

$$(".person[data-email]").forEach((card) => {
  card.addEventListener("click", () => {
    showProfile({
      name: card.dataset.name,
      role: card.dataset.role,
      email: card.dataset.email,
      phone: card.dataset.phone || "",
    });
  });

  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      card.click();
    }
  });
});

// ========= Admin =========
const adminOpenBtn = $("#openAdminBtn");
const adminModal = $("#adminModal");
const adminCloseBtn = $("#closeAdminBtn");

const adminStatus = $("#adminStatus");
const signInPanel = $("#adminSignInPanel");
const dashboardPanel = $("#adminDashboardPanel");
const signedInText = $("#signedInText");
const logoutBtn = $("#logoutBtn");

const adminEmail = $("#adminEmail");
const adminPassword = $("#adminPassword");
const adminLoginBtn = $("#adminLoginBtn");
const adminClearBtn = $("#adminClearBtn");

// files
const filesQuery = $("#filesQuery");
const filesFrom = $("#filesFrom");
const filesTo = $("#filesTo");
const filesSearchBtn = $("#filesSearchBtn");
const filesToggleDates = $("#filesToggleDates");
const filesDateArea = $("#filesDateArea");
const filesTableBody = $("#filesTableBody");

// logs
const logsPanel = $("#logsPanel");
const logsFrom = $("#logsFrom");
const logsTo = $("#logsTo");
const logsEmail = $("#logsEmail");
const logsType = $("#logsType");
const logsLoadBtn = $("#logsLoadBtn");
const logsTableBody = $("#logsTableBody");

// welcome email
const welcomeCompany = $("#welcomeCompany");
const welcomeContact = $("#welcomeContact");
const welcomeEmail = $("#welcomeEmail");
const welcomeOpenBtn = $("#welcomeOpenBtn");
const welcomeStatus = $("#welcomeStatus");

// log details modal
const logDetailsModal = $("#logDetailsModal");
const closeLogDetailsBtn = $("#closeLogDetailsBtn");
const logDetailsBox = $("#logDetailsBox");

closeLogDetailsBtn?.addEventListener("click", () => closeModal(logDetailsModal));

function setAdminStatus(msg, isError = false) {
  adminStatus.textContent = msg || "";
  adminStatus.classList.toggle("error", !!isError);
}

function getToken() {
  return localStorage.getItem("sf_admin_token") || "";
}
function setToken(t) {
  if (t) localStorage.setItem("sf_admin_token", t);
  else localStorage.removeItem("sf_admin_token");
}
function setAdminInfo(a) {
  if (a) localStorage.setItem("sf_admin_info", JSON.stringify(a));
  else localStorage.removeItem("sf_admin_info");
}
function getAdminInfo() {
  try { return JSON.parse(localStorage.getItem("sf_admin_info") || "null"); }
  catch { return null; }
}

function setSignedOutUI() {
  signInPanel.style.display = "block";
  dashboardPanel.style.display = "none";
  logoutBtn.style.display = "none";
  signedInText.textContent = "";
  setAdminStatus("");
}

function setSignedInUI(admin) {
  signInPanel.style.display = "none";
  dashboardPanel.style.display = "block";
  logoutBtn.style.display = "inline-flex";
  signedInText.textContent = `Signed in as ${admin?.name || ""} (${admin?.email || ""})`;
  setAdminStatus("");

  const canViewLogs = !!admin?.canViewLogs;
  logsPanel.style.display = canViewLogs ? "block" : "none";
}

async function initAdminSession() {
  const token = getToken()
  if (!token) return setSignedOutUI();

  try {
    const data = await apiPost("/api/whoami", { token });
    setAdminInfo(data.admin);
    setSignedInUI(data.admin);
  } catch {
    setToken("");
    setAdminInfo(null);
    setSignedOutUI();
  }
}

// Open/close modal
adminOpenBtn?.addEventListener("click", () => {
  openModal(adminModal);
  initAdminSession();
});
adminCloseBtn?.addEventListener("click", () => closeModal(adminModal));

// Clear
adminClearBtn?.addEventListener("click", () => {
  adminEmail.value = "";
  adminPassword.value = "";
  setAdminStatus("");
});

// Login
adminLoginBtn?.addEventListener("click", async () => {
  try {
    setAdminStatus("Signing in…");
    const email = (adminEmail.value || "").trim();
    const password = adminPassword.value || "";
    if (!email || !password) {
      setAdminStatus("Please enter email and password.", true);
      return;
    }

    const data = await apiPost("/api/admin-login", { email, password });
    setToken(data.token);
    setAdminInfo(data.admin);
    setSignedInUI(data.admin);
    setAdminStatus("Signed in.");
  } catch (e) {
    setAdminStatus(e.message || "Login failed.", true);
  }
});

// Logout
logoutBtn?.addEventListener("click", () => {
  setToken("");
  setAdminInfo(null);
  setSignedOutUI();
});

// ========= Files: toggle date search =========
let datesEnabled = false;
function setDateUI() {
  filesDateArea.classList.toggle("hidden", !datesEnabled);
  filesToggleDates.textContent = datesEnabled ? "Hide date search" : "Search by date too?";
}
filesToggleDates?.addEventListener("click", () => {
  datesEnabled = !datesEnabled;
  setDateUI();
});
setDateUI();

function tokenGuard() {
  const token = getToken();
  if (!token) throw new Error("Please sign in to use the admin dashboard.");
  return token;
}

filesSearchBtn?.addEventListener("click", async () => {
  try {
    const token = tokenGuard();
    filesTableBody.innerHTML = "";
    setAdminStatus("Searching files…");

    const query = (filesQuery.value || "").trim();
    const fromDate = datesEnabled ? (filesFrom.value || "").trim() : "";
    const toDate = datesEnabled ? (filesTo.value || "").trim() : "";

    const data = await apiPost("/api/files", { token, query, fromDate, toDate });
    const files = data.files || [];

    if (!files.length) {
      filesTableBody.innerHTML = `<tr><td colspan="3" class="smallMuted">No files found.</td></tr>`;
      setAdminStatus("No results.");
      return;
    }

    files.forEach((f) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${escapeHtml(f.name || "")}</td>
        <td>${escapeHtml(f.created || "")}</td>
        <td>
          <div class="actionsInline">
            <a class="linkBtn" href="${escapeAttr(f.url || "#")}" target="_blank" rel="noopener">View</a>
            <button class="linkBtn btnDanger" data-del="${escapeAttr(f.id)}">Delete</button>
          </div>
        </td>
      `;
      filesTableBody.appendChild(tr);
    });

    // delete handlers
    $$("button[data-del]", filesTableBody).forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-del");
        if (!id) return;
        if (!confirm("Are you sure you want to delete this file?")) return;

        try {
          setAdminStatus("Deleting file…");
          await apiPost("/api/delete-file", { token, fileId: id });
          setAdminStatus("File deleted.");
          filesSearchBtn.click(); // refresh list
        } catch (e) {
          setAdminStatus(e.message || "Delete failed.", true);
        }
      });
    });

    setAdminStatus("Files loaded.");
  } catch (e) {
    setAdminStatus(e.message || "Search failed.", true);
  }
});

// ========= Logs: plain English + details =========
function humanAction(actionType = "") {
  const t = String(actionType || "").toUpperCase();
  if (t === "LOGIN") return "Signed in";
  if (t === "DELETE_FILE") return "Deleted file";
  if (t === "SEND_WELCOME_EMAIL") return "Prepared welcome email";
  if (t === "SUBMIT_FORM") return "Onboarding form submitted";
  return t ? t.replace(/_/g, " ").toLowerCase().replace(/^\w/, c => c.toUpperCase()) : "Activity";
}

function parseDetails(details) {
  if (!details) return null;
  if (typeof details === "object") return details;
  try { return JSON.parse(details); } catch { return { raw: String(details) }; }
}

function renderDetailsModal(row) {
  const detailsObj = parseDetails(row.details);
  const lines = [];

  lines.push(`<div class="detailsBox">`);
  lines.push(`<div><strong>User:</strong> ${escapeHtml(row.adminEmail || "")}</div>`);
  lines.push(`<div><strong>Action:</strong> ${escapeHtml(humanAction(row.actionType))}</div>`);
  lines.push(`<div><strong>Timestamp:</strong> ${escapeHtml(fmtDateTime(row.timestamp))}</div>`);

  if (detailsObj?.fileName) lines.push(`<div><strong>File Name:</strong> ${escapeHtml(detailsObj.fileName)}</div>`);
  if (detailsObj?.companyName) lines.push(`<div><strong>Company:</strong> ${escapeHtml(detailsObj.companyName)}</div>`);
  if (detailsObj?.customerEmail) lines.push(`<div><strong>Customer Email:</strong> ${escapeHtml(detailsObj.customerEmail)}</div>`);

  // raw JSON (collapsed style)
  lines.push(`<div style="margin-top:10px; opacity:0.9;"><strong>More details:</strong></div>`);
  lines.push(`<pre style="margin:8px 0 0; white-space:pre-wrap; word-break:break-word; font-size:12px; color:rgba(229,231,235,0.78);">${escapeHtml(JSON.stringify(detailsObj, null, 2))}</pre>`);
  lines.push(`</div>`);

  logDetailsBox.innerHTML = lines.join("");
  openModal(logDetailsModal);
}

logsLoadBtn?.addEventListener("click", async () => {
  try {
    const token = tokenGuard();

    logsTableBody.innerHTML = "";
    setAdminStatus("Loading logs…");

    const admin = getAdminInfo();
    if (!admin?.canViewLogs) {
      setAdminStatus("You do not have permission to view logs.", true);
      return;
    }

    const data = await apiPost("/api/logs", {
      token,
      fromDate: (logsFrom.value || "").trim(),
      toDate: (logsTo.value || "").trim(),
      adminEmail: (logsEmail.value || "").trim(),
      actionType: (logsType.value || "All"),
    });

    const logs = data.logs || [];
    if (!logs.length) {
      logsTableBody.innerHTML = `<tr><td colspan="4" class="smallMuted">No logs found.</td></tr>`;
      setAdminStatus("No logs.");
      return;
    }

    logs.forEach((row) => {
      const tr = document.createElement("tr");
      const title = humanAction(row.actionType);
      const subtitle = `${row.adminEmail || ""} • ${fmtDateTime(row.timestamp)}`;

      tr.innerHTML = `
        <td>
          <div class="logRowSummary">
            <div class="logTitle">${escapeHtml(title)}</div>
            <div class="logSub">${escapeHtml(subtitle)}</div>
          </div>
        </td>
        <td>${escapeHtml(row.adminName || "")}</td>
        <td>${escapeHtml(row.adminEmail || "")}</td>
        <td><button class="linkBtn" data-log="1">View details</button></td>
      `;

      tr.querySelector('button[data-log="1"]').addEventListener("click", () => {
        renderDetailsModal(row);
      });

      logsTableBody.appendChild(tr);
    });

    setAdminStatus("Logs loaded.");
  } catch (e) {
    setAdminStatus(e.message || "Logs failed.", true);
  }
});

// ========= Welcome Email: generate .eml and open in Outlook =========
// (This does NOT send from Google. It creates a ready email file that user sends from their own mailbox.)
function buildWelcomeHtml(companyName, contactName) {
  const display = contactName || companyName || "there";
  const url = "https://smartfitscustomeronboarding.pages.dev";

  return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Welcome to SmartFits</title></head>
<body style="margin:0;padding:0;background:#020617;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#020617;padding:24px 0;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;border:1px solid #1f2937;border-radius:16px;background:#020617;color:#e5e7eb;padding:22px;">
        <tr><td style="padding-bottom:12px;">
          <div style="font-weight:800;letter-spacing:.12em;font-size:13px;color:#f9fafb;">
            <span style="display:inline-block;width:10px;height:10px;background:#ef4444;border-radius:999px;margin-right:8px;vertical-align:middle;"></span>
            SMARTFITS
          </div>
        </td></tr>
        <tr><td>
          <h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;color:#f9fafb;">Welcome to SmartFits</h1>
          <p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#e5e7eb;">Dear ${escapeHtml(display)},</p>
          <p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#e5e7eb;">
            Welcome to <strong>SmartFits Installations Ltd</strong>. We’re delighted to have you on board and look forward to supporting your fleet.
          </p>
          <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#e5e7eb;">
            Your Customer Onboarding Pack is ready here:
          </p>
          <p style="margin:0 0 18px;">
            <a href="${url}" style="display:inline-block;padding:10px 18px;border-radius:999px;background:#4b84ff;color:#020617;font-weight:800;text-decoration:none;">
              View Customer Onboarding Pack
            </a>
          </p>
          <p style="margin:0;font-size:12px;line-height:1.7;color:#94a3b8;">
            If you have any questions, please reply to this email or contact <a href="mailto:support@smartfits.co.uk" style="color:#cbd5e1;text-decoration:none;">support@smartfits.co.uk</a>.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function makeEml({ to, subject, html }) {
  // Keep headers simple. The sender will be the user’s mailbox once they send.
  return [
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset="UTF-8"`,
    ``,
    html,
  ].join("\r\n");
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime || "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

welcomeOpenBtn?.addEventListener("click", () => {
  try {
    const companyName = (welcomeCompany.value || "").trim();
    const contactName = (welcomeContact.value || "").trim();
    const to = (welcomeEmail.value || "").trim();

    if (!companyName) throw new Error("Please enter the Customer / Company Name.");
    if (!to) throw new Error("Please enter the Customer Email Address.");

    const subject = "Welcome to SmartFits – Your Customer Onboarding Pack";
    const html = buildWelcomeHtml(companyName, contactName);
    const eml = makeEml({ to, subject, html });

    const safeCompany = companyName.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_").slice(0, 60);
    const filename = `SmartFits_Welcome_${safeCompany || "Customer"}.eml`;

    downloadFile(filename, eml, "message/rfc822");
    welcomeStatus.textContent = "Downloaded .eml file — open it in Outlook and press Send.";
    welcomeStatus.classList.remove("error");
  } catch (e) {
    welcomeStatus.textContent = e.message || "Could not generate email.";
    welcomeStatus.classList.add("error");
  }
});

// ========= Utilities =========
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeAttr(s) {
  return escapeHtml(s).replaceAll("`", "");
}
