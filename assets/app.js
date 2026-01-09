// -----------------------------
// CONFIG: set this to your Apps Script Web App URL
// -----------------------------
// IMPORTANT: this is called from /api (Cloudflare Pages Function), so NO CORS.
const API = "/api";

// -----------------------------
// Helpers
// -----------------------------
const $ = (id) => document.getElementById(id);

function setStatus(el, msg, type) {
  if (!el) return;
  el.classList.remove("ok", "error");
  if (!msg) { el.textContent = ""; return; }
  el.textContent = msg;
  if (type) el.classList.add(type);
}

function openModal(backdropEl) {
  backdropEl.classList.add("open");
  backdropEl.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal(backdropEl) {
  backdropEl.classList.remove("open");
  backdropEl.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

async function apiPost(payload) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

// -----------------------------
// Policy modal (copy on-page policy content so it matches exactly)
// -----------------------------
function initPolicyModal() {
  const policyBody = $("policyBottom");
  const modalBody = $("policyModalBody");
  if (policyBody && modalBody) {
    modalBody.innerHTML = policyBody.innerHTML;
  }

  const policyModal = $("policyModal");
  $("openPolicyBtn")?.addEventListener("click", () => openModal(policyModal));
  $("closePolicyBtn")?.addEventListener("click", () => closeModal(policyModal));
  policyModal?.addEventListener("click", (e) => {
    if (e.target === policyModal) closeModal(policyModal);
  });
}

// -----------------------------
// Public form submission
// -----------------------------
function initPublicForm() {
  const form = $("deploymentForm");
  if (!form) return;

  const accept = $("acceptPolicy");
  const acceptVal = $("acceptPolicyValue");
  accept?.addEventListener("change", () => {
    acceptVal.value = accept.checked ? "Yes" : "No";
  });

  $("clearBtn")?.addEventListener("click", () => {
    form.reset();
    if (acceptVal) acceptVal.value = "No";
    setStatus($("status"), "");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus($("status"), "");

    const payload = Object.fromEntries(new FormData(form).entries());

    // Basic required checks
    const required = [
      "fullCompanyName", "vatNumber", "companyRegNumber",
      "invoiceAddress",
      "accountsContactName", "accountsContactNumber", "accountsEmail",
      "mainContactName", "mainContactNumber", "mainContactEmail",
      "acceptPolicyValue"
    ];

    for (const k of required) {
      if (!payload[k] || String(payload[k]).trim() === "") {
        setStatus($("status"), `Please complete: ${k}`, "error");
        return;
      }
    }
    if (payload.acceptPolicyValue !== "Yes") {
      setStatus($("status"), "Please accept the Cancellation Policy.", "error");
      return;
    }

    try {
      $("submitBtn").disabled = true;
      setStatus($("status"), "Submitting…");

      const r = await apiPost({ action: "submitForm", ...payload });
      setStatus($("status"), `Submitted successfully. PDF saved as: ${r.pdfName}`, "ok");
      form.reset();
      if (acceptVal) acceptVal.value = "No";
    } catch (err) {
      setStatus($("status"), err.message || "Failed to submit.", "error");
    } finally {
      $("submitBtn").disabled = false;
    }
  });
}

// -----------------------------
// Team member modal (click cards)
// -----------------------------
const PEOPLE = {
  tara:    { name:"Tara Hassall",    role:"Managing Director", email:"tara@smartfits.co.uk", phone:"07894880559", img:"./images/tara_hassall.png" },
  charlie: { name:"Charlie Inger",   role:"Sales & Business Development Manager", email:"charlie@smartfits.co.uk", phone:"07385099620", img:"./images/charlie_inger.png" },
  emma:    { name:"Emma Sumner",     role:"Customer Success Team Leader", email:"emma@smartfits.co.uk", img:"./images/emma_sumner.png" },
  kelly:   { name:"Kelly Mullen",    role:"Customer Success Team Member", email:"kelly@smartfits.co.uk", img:"./images/kelly_mullen.png" },
  aleks:   { name:"Aleks Fossick",   role:"Customer Success Team Member", email:"aleks@smartfits.co.uk", img:"./images/aleks_fossick.png" },
  roz:     { name:"Roz Hardwick",    role:"Operations Lead", email:"roz@smartfits.co.uk", img:"./images/roz_hardwick.png" },
  ellie:   { name:"Ellie Topliss",   role:"Project Coordinator", email:"ellie@smartfits.co.uk", img:"./images/ellie_topliss.png" },
  sophie:  { name:"Sophie Turner",   role:"Project Coordinator", email:"sophie@smartfits.co.uk", img:"./images/sophie_turner.png" },
  amanda:  { name:"Amanda Clarke",   role:"Field Operations Team Member", email:"amanda@smartfits.co.uk", img:"./images/amanda_clarke.png" },
  rosie:   { name:"Rosie Smart",     role:"Field Operations Team Member", email:"rosie@smartfits.co.uk", img:"./images/rosie_smart.png" },
  bridie:  { name:"Bridie Southam",  role:"Field Operations Team Member", email:"bridie@smartfits.co.uk", img:"./images/bridie_southam.png" },
  kasia:   { name:"Kasia Dzielak",   role:"Field Operations Team Member", email:"kasia@smartfits.co.uk", img:"./images/kasia_dzielak.png" },
};

function initPeopleModal() {
  const modal = $("personModal");
  if (!modal) return;

  document.querySelectorAll("[data-person]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-person");
      const p = PEOPLE[key];
      if (!p) return;

      $("personTitle").textContent = p.name;
      $("personImg").src = p.img || "";
      $("personImg").alt = p.name;
      $("personName").textContent = p.name;
      $("personRole").textContent = p.role || "";

      const emailLink = $("personEmail");
      emailLink.href = `mailto:${encodeURIComponent(p.email)}?subject=${encodeURIComponent("SmartFits – Customer Onboarding")}`;

      const phoneLink = $("personPhone");
      if (p.phone) {
        phoneLink.style.display = "inline-flex";
        phoneLink.href = `tel:${p.phone.replace(/\s+/g,"")}`;
      } else {
        phoneLink.style.display = "none";
      }

      openModal(modal);
    });
  });

  $("closePersonBtn")?.addEventListener("click", () => closeModal(modal));
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(modal); });
}

// -----------------------------
// Admin dashboard modal
// -----------------------------
let adminSession = {
  token: null,
  admin: null
};

let pendingDelete = null;

function renderAdminState() {
  const loginPanel = $("adminLoginPanel");
  const authedPanel = $("adminAuthedPanel");
  const hello = $("adminHello");
  const logsPanel = $("logsPanel");

  if (!adminSession.token) {
    loginPanel.style.display = "block";
    authedPanel.style.display = "none";
    setStatus($("filesStatus"), "");
    setStatus($("welStatus"), "");
    setStatus($("logsStatus"), "");
    return;
  }

  loginPanel.style.display = "none";
  authedPanel.style.display = "block";

  const a = adminSession.admin || {};
  hello.textContent = `Signed in as ${a.name || ""} (${a.email || ""})`;

  // Logs visibility restricted
  if (a.canViewLogs) {
    logsPanel.style.display = "block";
  } else {
    logsPanel.style.display = "none";
  }
}

async function adminLogin(email, password) {
  const r = await apiPost({ action: "adminLogin", email, password });
  adminSession.token = r.token;
  adminSession.admin = r.admin;
  renderAdminState();
}

async function listFiles() {
  setStatus($("filesStatus"), "");
  const q = $("fileQuery").value || "";
  const fromDate = $("fromDate").value || "";
  const toDate = $("toDate").value || "";

  const tbody = $("filesTbody");
  tbody.innerHTML = `<tr><td colspan="3" class="muted">Loading…</td></tr>`;

  try {
    const r = await apiPost({
      action: "listFiles",
      token: adminSession.token,
      query: q,
      fromDate,
      toDate
    });

    const files = r.files || [];
    if (!files.length) {
      tbody.innerHTML = `<tr><td colspan="3" class="muted">No files found.</td></tr>`;
      return;
    }

    tbody.innerHTML = files.map(f => {
      const safeName = escapeHtml(f.name);
      return `
        <tr>
          <td>${safeName}</td>
          <td>${escapeHtml(f.created)}</td>
          <td class="actionsCell">
            <div class="inlineBtns">
              <a class="smallBtn primary" href="${f.url}" target="_blank" rel="noopener">View</a>
              <button class="smallBtn danger" type="button" data-del="${f.id}" data-name="${safeName}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", () => {
        pendingDelete = {
          id: btn.getAttribute("data-del"),
          name: btn.getAttribute("data-name")
        };
        $("confirmText").textContent = `Are you sure you want to delete "${pendingDelete.name}"? This cannot be undone.`;
        setStatus($("confirmStatus"), "");
        openModal($("confirmModal"));
      });
    });

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="3" class="muted">Failed to load files.</td></tr>`;
    setStatus($("filesStatus"), err.message || "Failed to load files.", "error");
  }
}

async function deleteFile(fileId) {
  setStatus($("confirmStatus"), "");
  try {
    $("confirmDeleteBtn").disabled = true;
    await apiPost({ action: "deleteFile", token: adminSession.token, fileId });
    setStatus($("confirmStatus"), "Deleted.", "ok");
    await listFiles();
    setTimeout(() => closeModal($("confirmModal")), 600);
  } catch (err) {
    setStatus($("confirmStatus"), err.message || "Failed to delete.", "error");
  } finally {
    $("confirmDeleteBtn").disabled = false;
  }
}

function buildWelcomeEmail({ companyName, contactName, customerEmail }) {
  const subject = `Welcome to Smartfits – Your Customer Onboarding Pack`;
  const name = contactName || companyName;

  // Keep mailto body as plain text (reliable everywhere).
  const body =
`Dear ${name},

Welcome to SmartFits Installations. We’re delighted to have you on board and excited to begin supporting your fleet.

Please view your Customer Onboarding Pack here:
https://smartfitscustomeronboarding.pages.dev

The pack includes:
• Onboarding information
• How the process works
• Key contacts and support details

Kind regards,
SmartFits Support
support@smartfits.co.uk`;

  // Use mailto so it opens Outlook/Mail on desktop, web, or phone.
  const mailto =
    `mailto:${encodeURIComponent(customerEmail)}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;

  return { mailto, subject, body };
}

async function openWelcomeEmail() {
  setStatus($("welStatus"), "");
  const companyName = $("welCompany").value.trim();
  const contactName = $("welContact").value.trim();
  const customerEmail = $("welEmail").value.trim();

  if (!companyName) return setStatus($("welStatus"), "Company name is required.", "error");
  if (!customerEmail) return setStatus($("welStatus"), "Customer email is required.", "error");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customerEmail)) {
    return setStatus($("welStatus"), "Customer email is not valid.", "error");
  }

  try {
    // Log the intent (so you can audit who generated it)
    await apiPost({
      action: "logAction",
      token: adminSession.token,
      actionType: "SEND_WELCOME_EMAIL",
      details: { companyName, contactName, customerEmail }
    });

    const { mailto } = buildWelcomeEmail({ companyName, contactName, customerEmail });
    window.location.href = mailto;

    setStatus($("welStatus"), `Email opened for ${customerEmail}.`, "ok");
  } catch (err) {
    setStatus($("welStatus"), err.message || "Could not log action.", "error");
  }
}

async function loadLogs() {
  setStatus($("logsStatus"), "");
  const tbody = $("logsTbody");
  tbody.innerHTML = `<tr><td colspan="4" class="muted">Loading…</td></tr>`;

  try {
    const r = await apiPost({
      action: "listLogs",
      token: adminSession.token,
      fromDate: $("logFrom").value || "",
      toDate: $("logTo").value || "",
      adminEmail: $("logAdmin").value || "",
      actionType: $("logType").value || ""
    });

    const logs = r.logs || [];
    if (!logs.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="muted">No logs found.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(l => `
      <tr>
        <td>${escapeHtml(l.timestamp)}</td>
        <td>${escapeHtml(`${l.adminName} (${l.adminEmail})`)}</td>
        <td>${escapeHtml(l.actionType)}</td>
        <td style="max-width:520px;word-break:break-word">${escapeHtml(l.details || "")}</td>
      </tr>
    `).join("");

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="muted">Failed to load logs.</td></tr>`;
    setStatus($("logsStatus"), err.message || "Failed to load logs.", "error");
  }
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function initAdmin() {
  const adminModal = $("adminModal");
  $("adminOpenBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    openModal(adminModal);
    // Always show ONLY login until signed in
    renderAdminState();
  });
  $("adminCloseBtn")?.addEventListener("click", () => closeModal(adminModal));
  adminModal?.addEventListener("click", (e) => {
    if (e.target === adminModal) closeModal(adminModal);
  });

  $("adminClearBtn")?.addEventListener("click", () => {
    $("adminEmail").value = "";
    $("adminPassword").value = "";
    setStatus($("adminStatus"), "");
  });

  $("adminSignInBtn")?.addEventListener("click", async () => {
    setStatus($("adminStatus"), "");
    const email = $("adminEmail").value.trim();
    const password = $("adminPassword").value;
    if (!email || !password) return setStatus($("adminStatus"), "Email and password are required.", "error");

    try {
      $("adminSignInBtn").disabled = true;
      setStatus($("adminStatus"), "Signing in…");
      await adminLogin(email, password);
      setStatus($("adminStatus"), "", "");
    } catch (err) {
      setStatus($("adminStatus"), err.message || "Login failed.", "error");
    } finally {
      $("adminSignInBtn").disabled = false;
    }
  });

  $("adminLogoutBtn")?.addEventListener("click", () => {
    adminSession.token = null;
    adminSession.admin = null;
    setStatus($("adminStatus"), "");
    renderAdminState();
  });

  $("filesSearchBtn")?.addEventListener("click", () => listFiles());
  $("welOpenBtn")?.addEventListener("click", () => openWelcomeEmail());
  $("logsLoadBtn")?.addEventListener("click", () => loadLogs());

  // Delete confirm modal
  const confirmModal = $("confirmModal");
  $("confirmCloseBtn")?.addEventListener("click", () => closeModal(confirmModal));
  $("confirmCancelBtn")?.addEventListener("click", () => closeModal(confirmModal));
  confirmModal?.addEventListener("click", (e) => { if (e.target === confirmModal) closeModal(confirmModal); });

  $("confirmDeleteBtn")?.addEventListener("click", async () => {
    if (!pendingDelete?.id) return;
    await deleteFile(pendingDelete.id);
  });

  renderAdminState();
}

// -----------------------------
// Boot
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  initPolicyModal();
  initPublicForm();
  initPeopleModal();
  initAdmin();
});
