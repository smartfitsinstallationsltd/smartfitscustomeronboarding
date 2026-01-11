// assets/app.js

// ---------------------------
// CONFIG (adjust if your API paths differ)
// ---------------------------
const API_LOGIN = "/api/login";
const API_LOGOUT = "/api/logout";
const API_LIST_FILES = "/api/files/list";
const API_DELETE_FILE = "/api/files/delete";
const API_LOGS = "/api/logs/list";

// ---------------------------
// TEAM DATA (emails + phone numbers per your rules)
// ---------------------------
const TEAM = {
  tara: {
    fullName: "Tara Hassall",
    role: "Managing Director",
    email: "tara@smartfits.co.uk",
    phone: "07894 880559",
    image: "./images/tara_hassall.png",
  },
  charlie: {
    fullName: "Charlie Inger",
    role: "Sales & Business Development Manager",
    email: "charlie@smartfits.co.uk",
    phone: "07385 099620",
    image: "./images/charlie_inger.png",
  },
  emma: {
    fullName: "Emma Sumner",
    role: "Customer Success Team Leader",
    email: "emma@smartfits.co.uk",
    image: "./images/emma_sumner.png",
  },
  kelly: {
    fullName: "Kelly Mullen",
    role: "Customer Success Team Member",
    email: "kelly@smartfits.co.uk",
    image: "./images/kelly_mullen.png",
  },
  aleks: {
    fullName: "Aleks Fossick",
    role: "Customer Success Team Member",
    email: "aleks@smartfits.co.uk",
    image: "./images/aleks_fossick.png",
  },
  roz: {
    fullName: "Roz Hardwick",
    role: "Operations Lead",
    email: "roz@smartfits.co.uk",
    image: "./images/roz_hardwick.png",
  },
  ellie: {
    fullName: "Ellie Topliss",
    role: "Project Coordinator",
    email: "ellie@smartfits.co.uk",
    image: "./images/ellie_topliss.png",
  },
  sophie: {
    fullName: "Sophie Turner",
    role: "Project Coordinator",
    email: "sophie@smartfits.co.uk",
    image: "./images/sophie_turner.png",
  },
  amanda: {
    fullName: "Amanda Clarke",
    role: "Field Operations Team Member",
    email: "amanda@smartfits.co.uk",
    image: "./images/amanda_clarke.png",
  },
  rosie: {
    fullName: "Rosie Smart",
    role: "Field Operations Team Member",
    email: "rosie@smartfits.co.uk",
    image: "./images/rosie_smart.png",
  },
  bridie: {
    fullName: "Bridie Southam",
    role: "Field Operations Team Member",
    email: "bridie@smartfits.co.uk",
    image: "./images/bridie_southam.png",
  },
  kasia: {
    fullName: "Kasia Dzielak",
    role: "Field Operations Team Member",
    email: "kasia@smartfits.co.uk",
    image: "./images/kasia_dzielak.png",
  },
};

// ---------------------------
// HELPERS
// ---------------------------
function $(id) { return document.getElementById(id); }

function openModal(backdropId) {
  const el = $(backdropId);
  if (!el) return;
  el.classList.add("open");
  el.setAttribute("aria-hidden", "false");
}

function closeModal(backdropId) {
  const el = $(backdropId);
  if (!el) return;
  el.classList.remove("open");
  el.setAttribute("aria-hidden", "true");
}

function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

function setHTML(id, html) {
  const el = $(id);
  if (el) el.innerHTML = html;
}

function formatUkDateTime(iso) {
  try {
    const d = new Date(iso);
    // UK style date + time
    return d.toLocaleString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/London",
      timeZoneName: "short",
    });
  } catch {
    return iso;
  }
}

async function apiPost(url, payload) {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });
  let data = null;
  const text = await resp.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = { ok: false, raw: text }; }
  if (!resp.ok) {
    return { ok: false, status: resp.status, data };
  }
  return data ?? { ok: true };
}

// ---------------------------
// ADMIN STATE
// ---------------------------
const state = {
  admin: null, // { email, name, canViewLogs }
};

function setAdminUIAuthed(admin) {
  state.admin = admin;

  // Switch views
  $("adminSigninOnly")?.classList.add("hide");
  $("adminAuthed")?.classList.remove("hide");

  const who = admin?.name ? `${admin.name} (${admin.email})` : admin?.email || "Signed in";
  setText("adminSignedInText", `Signed in as ${who}`);

  // Logs visibility by permission
  const canViewLogs = !!admin?.canViewLogs;
  const logsSection = $("logsSection");
  if (logsSection) {
    if (canViewLogs) logsSection.classList.remove("hide");
    else logsSection.classList.add("hide");
  }
}

function setAdminUISignedOut() {
  state.admin = null;

  $("adminSigninOnly")?.classList.remove("hide");
  $("adminAuthed")?.classList.add("hide");

  setText("adminStatus", "");
  setText("adminSignedInText", "");
  setText("logsStatus", "");
  setText("welcomeStatus", "");

  // Clear tables
  setHTML("filesTableBody", `<div class="muted">Search to view files.</div>`);
  setHTML("logsList", `<div class="muted">Load logs to view activity.</div>`);
}

// ---------------------------
// PERSON MODAL RENDER
// ---------------------------
function renderPersonModal(personKey) {
  const p = TEAM[personKey];
  if (!p) return;

  setText("personTitle", "Team Member");

  const phoneLine = p.phone
    ? `<div class="contactLine"><div class="contactLabel">Phone:</div><div class="contactValue">${escapeHtml(p.phone)}</div></div>`
    : "";

  const html = `
    <div class="personModalGrid">
      <div>
        <img class="personHeroImg" src="${p.image}" alt="${escapeHtml(p.fullName)}" />
      </div>

      <div>
        <h3 class="personModalName">${escapeHtml(p.fullName)}</h3>
        <div class="personModalRole">${escapeHtml(p.role)}</div>

        <div class="sectionTitle">Contact details</div>
        <div class="contactCard">
          <div class="contactLine">
            <div class="contactLabel">Email:</div>
            <div class="contactValue"><a href="mailto:${escapeAttr(p.email)}">${escapeHtml(p.email)}</a></div>
          </div>
          ${phoneLine}
        </div>

        <div class="supportMini">
          <p class="supportMiniTitle">Want general support?</p>
          <div class="contactLine" style="margin-top:8px;">
            <div class="contactLabel">Phone:</div>
            <div class="contactValue">01283 533330</div>
          </div>
          <div class="contactLine">
            <div class="contactLabel">Email:</div>
            <div class="contactValue"><a href="mailto:support@smartfits.co.uk">support@smartfits.co.uk</a></div>
          </div>
        </div>
      </div>
    </div>
  `;

  setHTML("personBody", html);
  openModal("personModal");
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeAttr(str){ return escapeHtml(str).replaceAll('"', "&quot;"); }

// ---------------------------
// ADMIN FEATURES (files, logs, welcome EML)
// ---------------------------
function renderFiles(files) {
  const wrap = $("filesTableBody");
  if (!wrap) return;

  if (!files || files.length === 0) {
    wrap.innerHTML = `<div class="muted">No files found.</div>`;
    return;
  }

  wrap.innerHTML = files.map(f => {
    const created = f.created ? formatUkDateTime(f.created) : "";
    const name = f.fileName || f.name || "Unnamed file";
    const id = f.fileId || f.id || "";

    return `
      <div class="fileRow">
        <div title="${escapeAttr(name)}">${escapeHtml(name)}</div>
        <div class="muted">${escapeHtml(created)}</div>
        <div class="fileActions">
          <button class="smallBtn" type="button" data-action="view" data-id="${escapeAttr(id)}">View</button>
          <button class="smallBtn" type="button" data-action="delete" data-id="${escapeAttr(id)}">Delete</button>
        </div>
      </div>
    `;
  }).join("");

  // Actions
  wrap.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");
      if (!id) return;

      if (action === "view") {
        // If your API returns a viewUrl, you can use that instead.
        // For now we call an endpoint that returns a signed/download URL.
        const res = await apiPost("/api/files/view", { id });
        if (res?.ok && res.url) window.open(res.url, "_blank");
        else alert("Unable to open file. Check API /api/files/view.");
      }

      if (action === "delete") {
        const ok = confirm("Delete this file?");
        if (!ok) return;
        const res = await apiPost(API_DELETE_FILE, { id });
        if (!res?.ok) {
          alert("Delete failed.");
          return;
        }
        // Refresh list
        $("searchFilesBtn")?.click();
      }
    });
  });
}

function renderLogs(logs) {
  const list = $("logsList");
  if (!list) return;

  if (!logs || logs.length === 0) {
    list.innerHTML = `<div class="muted">No logs found for that filter.</div>`;
    return;
  }

  // Plain English titles
  function actionLabel(a) {
    if (a === "LOGIN") return "Admin signed in";
    if (a === "DELETE_FILE") return "Deleted file";
    if (a === "SUBMIT_FORM") return "Form submitted";
    return "Activity";
  }

  list.innerHTML = logs.map((l, idx) => {
    const ts = l.timestamp || l.created || l.time || "";
    const when = ts ? formatUkDateTime(ts) : "";
    const email = l.adminEmail || l.email || "";
    const action = l.action || l.type || "";

    const details = l.details || {};
    const fileName = details.fileName || l.fileName || "";
    const message = details.message || "";

    return `
      <div class="logItem" data-log="${idx}">
        <div class="logTop">
          <div>
            <div class="logTitle">${escapeHtml(actionLabel(action))}</div>
            <div class="logMeta">${escapeHtml(when)}</div>
          </div>
          <div class="logMeta">${escapeHtml(email)}</div>
        </div>

        <div class="logDetails">
          <div class="kv">
            <div class="k">User</div><div class="v">${escapeHtml(email)}</div>
            <div class="k">Action</div><div class="v">${escapeHtml(actionLabel(action))}</div>
            ${fileName ? `<div class="k">File Name</div><div class="v">${escapeHtml(fileName)}</div>` : ""}
            ${message ? `<div class="k">Details</div><div class="v">${escapeHtml(message)}</div>` : ""}
            ${ts ? `<div class="k">Timestamp</div><div class="v">${escapeHtml(when)}</div>` : ""}
          </div>
        </div>
      </div>
    `;
  }).join("");

  list.querySelectorAll(".logItem").forEach(item => {
    item.addEventListener("click", () => item.classList.toggle("open"));
  });
}

function downloadEml(filename, subject, bodyText, toEmail) {
  // Simple EML generator (opens in Outlook/Mail when downloaded)
  // Note: formatting stays basic here; can be upgraded to HTML MIME if you want.
  const eml =
`To: ${toEmail}
Subject: ${subject}
X-Unsent: 1
Content-Type: text/plain; charset="utf-8"

${bodyText}
`;

  const blob = new Blob([eml], { type: "message/rfc822" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith(".eml") ? filename : `${filename}.eml`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

// ---------------------------
// INIT
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Person click handlers
  document.querySelectorAll(".personBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-person");
      if (key) renderPersonModal(key);
    });
  });

  // Person modal close
  $("closePersonBtn")?.addEventListener("click", () => closeModal("personModal"));
  $("personModal")?.addEventListener("click", (e) => {
    if (e.target === $("personModal")) closeModal("personModal");
  });

  // Admin modal open/close
  $("openAdminBtn")?.addEventListener("click", () => openModal("adminModal"));
  $("closeAdminBtn")?.addEventListener("click", () => closeModal("adminModal"));
  $("adminModal")?.addEventListener("click", (e) => {
    if (e.target === $("adminModal")) closeModal("adminModal");
  });

  // Start signed out UI
  setAdminUISignedOut();

  // Toggle date search
  $("toggleDateSearchBtn")?.addEventListener("click", () => {
    $("dateSearchRow")?.classList.toggle("hide");
  });

  // Admin clear
  $("adminClearBtn")?.addEventListener("click", () => {
    if ($("adminEmail")) $("adminEmail").value = "";
    if ($("adminPassword")) $("adminPassword").value = "";
    setText("adminStatus", "");
  });

  // Admin login
  $("adminLoginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setText("adminStatus", "Signing in...");

    const email = $("adminEmail")?.value?.trim() || "";
    const password = $("adminPassword")?.value || "";
    if (!email || !password) {
      setText("adminStatus", "Please enter your email and password.");
      return;
    }

    const res = await apiPost(API_LOGIN, { email, password });

    // Expected response:
    // { ok:true, user:{ email, name, canViewLogs:true/false } }
    if (!res || res.ok !== true) {
      setText("adminStatus", "Login failed. Please check your details.");
      return;
    }

    const user = res.user || res.admin || { email };
    setText("adminStatus", "");
    setAdminUIAuthed({
      email: user.email || email,
      name: user.name || user.fullName || "",
      canViewLogs: !!user.canViewLogs,
    });
  });

  // Logout
  $("logoutBtn")?.addEventListener("click", async () => {
    try { await apiPost(API_LOGOUT, {}); } catch {}
    setAdminUISignedOut();
  });

  // Search files
  $("searchFilesBtn")?.addEventListener("click", async () => {
    setHTML("filesTableBody", `<div class="muted">Searching...</div>`);

    const name = $("fileSearchName")?.value?.trim() || "";
    const dateEnabled = !$("dateSearchRow")?.classList.contains("hide");
    const from = dateEnabled ? ($("fileFromDate")?.value || "") : "";
    const to = dateEnabled ? ($("fileToDate")?.value || "") : "";

    const res = await apiPost(API_LIST_FILES, { name, from, to });
    if (!res || res.ok !== true) {
      setHTML("filesTableBody", `<div class="muted">Search failed.</div>`);
      return;
    }

    renderFiles(res.files || []);
  });

  // Download EML
  $("downloadEmlBtn")?.addEventListener("click", () => {
    const company = $("welcomeCompany")?.value?.trim();
    const contact = $("welcomeContact")?.value?.trim();
    const email = $("welcomeEmail")?.value?.trim();

    if (!company || !email) {
      setText("welcomeStatus", "Company name and customer email are required.");
      return;
    }

    const subject = `Welcome to SmartFits – Customer Onboarding`;
    const body =
`Hi ${contact || "there"},

Thank you for choosing SmartFits Installations Ltd.

To help us set your account up correctly and plan your deployment efficiently, please complete the Customer Onboarding Form at:
${window.location.origin}

If you have any questions, please contact our support team:
Support Phone: 01283 533330
Support Email: support@smartfits.co.uk

Thanks again for the business,
SmartFits Installations Ltd
`;

    downloadEml(`${company}_SmartFits_Welcome`, subject, body, email);
    setText("welcomeStatus", "EML downloaded. Open it in Outlook and press Send.");
  });

  // Load logs (only if visible)
  $("loadLogsBtn")?.addEventListener("click", async () => {
    if ($("logsSection")?.classList.contains("hide")) return;

    setText("logsStatus", "Loading...");
    const from = $("logsFrom")?.value || "";
    const to = $("logsTo")?.value || "";
    const adminContains = $("logsAdminContains")?.value?.trim() || "";
    const action = $("logsActionType")?.value || "ALL";

    const res = await apiPost(API_LOGS, { from, to, adminContains, action });
    if (!res || res.ok !== true) {
      setText("logsStatus", "Unable to load logs.");
      return;
    }
    setText("logsStatus", "");
    renderLogs(res.logs || []);
  });

  // Cancellation policy popup button (scroll to policy section)
  $("openPolicyBtn")?.addEventListener("click", () => {
    $("policyBottom")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Form accept policy hidden input
  $("acceptPolicy")?.addEventListener("change", () => {
    const v = $("acceptPolicy")?.checked ? "Yes" : "No";
    if ($("acceptPolicyValue")) $("acceptPolicyValue").value = v;
  });

  // Form clear
  $("clearBtn")?.addEventListener("click", () => {
    $("deploymentForm")?.reset();
    if ($("acceptPolicyValue")) $("acceptPolicyValue").value = "No";
    setText("status", "");
  });

  // Form submit (keep your existing API submission path if different)
  $("deploymentForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setText("status", "Submitting...");

    const form = e.target;
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    // Important: adjust endpoint to your real submit handler.
    const res = await apiPost("/api/forms/submit", payload);

    if (!res || res.ok !== true) {
      setText("status", "Submission failed. Please try again.");
      return;
    }

    // Requested message
    setText("status", "Submitted successfully. Thank you for the business.");
    form.reset();
    if ($("acceptPolicyValue")) $("acceptPolicyValue").value = "No";
  });
});
