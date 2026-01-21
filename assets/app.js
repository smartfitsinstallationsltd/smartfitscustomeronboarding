/* =========================================================
   SmartFits Customer Onboarding — app.js (FULL FILE)
   ========================================================= */

/** 🔧 Your Google Apps Script Web App URL (ends with /exec) */
const GAS_URL =
  "https://script.google.com/macros/s/AKfycbxJ48d-Ykqvmvdwbhv4eJG_aJDySvl_rVtbjSNu-TrsrNylmdPm2NqYO5a97BY4tR-Ycg/exec";

/** -------------------------
 *  DOM helpers
 * ------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function byId(id) {
  return document.getElementById(id);
}

function setText(el, text) {
  if (!el) return;
  el.textContent = text ?? "";
}

function setHtml(el, html) {
  if (!el) return;
  el.innerHTML = html ?? "";
}

function escHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeVal(id) {
  const el = byId(id);
  return el ? String(el.value || "").trim() : "";
}

/** -------------------------
 *  Modal manager (prevents freeze)
 * ------------------------- */
let scrollYBeforeLock = 0;
let openModalCount = 0;

function lockBodyScroll() {
  if (document.body.classList.contains("modalOpen")) return;

  scrollYBeforeLock = window.scrollY || document.documentElement.scrollTop || 0;

  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollYBeforeLock}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";

  document.body.classList.add("modalOpen");
}

function unlockBodyScroll() {
  if (!document.body.classList.contains("modalOpen")) return;

  document.body.classList.remove("modalOpen");

  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";

  window.scrollTo(0, scrollYBeforeLock);
}

function openModal(backdropEl) {
  if (!backdropEl) return;

  backdropEl.classList.add("isOpen");
  backdropEl.setAttribute("aria-hidden", "false");

  requestAnimationFrame(() => {
    openModalCount++;
    lockBodyScroll();
  });
}

function closeModal(backdropEl) {
  if (!backdropEl) return;

  backdropEl.classList.remove("isOpen");
  backdropEl.setAttribute("aria-hidden", "true");

  openModalCount = Math.max(0, openModalCount - 1);
  if (openModalCount === 0) unlockBodyScroll();
}

function closeAllModals() {
  $$(".modalBackdrop.isOpen").forEach((b) => {
    b.classList.remove("isOpen");
    b.setAttribute("aria-hidden", "true");
  });
  openModalCount = 0;
  unlockBodyScroll();
}

function bindBackdropClose(backdropEl, closeBtnEl) {
  if (!backdropEl) return;

  backdropEl.addEventListener("mousedown", (e) => {
    if (e.target === backdropEl) closeModal(backdropEl);
  });

  if (closeBtnEl) closeBtnEl.addEventListener("click", () => closeModal(backdropEl));
}

function bindEscapeKey() {
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const openBackdrops = $$(".modalBackdrop.isOpen");
    if (!openBackdrops.length) return;
    closeModal(openBackdrops[openBackdrops.length - 1]);
  });
}

/** -------------------------
 *  GAS API helper (CORS-safe)
 *  IMPORTANT: Content-Type text/plain avoids preflight
 * ------------------------- */
async function postToGAS(payload) {
  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Server did not return JSON: ${text.slice(0, 160)}...`);
  }

  if (!json.ok) throw new Error(json.error || "Request failed.");
  return json;
}

/** -------------------------
 *  Team data
 * ------------------------- */
const TEAM = {
  tara: { name: "Tara Hassall", role: "Managing Director", email: "tara@smartfits.co.uk", phone: "07894 880559", img: "./images/tara_hassall.png" },
  charlie: { name: "Charlie Inger", role: "Sales & Business Development Manager", email: "charlie@smartfits.co.uk", phone: "07385 099620", img: "./images/charlie_inger.png" },

  emma: { name: "Emma Sumner", role: "Customer Success Team Leader", email: "emma@smartfits.co.uk", phone: "Not Available - If you wish to call Emma, Call General Support at 01283 533330, and request Emma.", img: "./images/emma_sumner.png" },
  kelly: { name: "Kelly Mullen", role: "Customer Success Team Member", email: "kelly@smartfits.co.uk", phone: "", img: "./images/kelly_mullen.png" },
  aleks: { name: "Aleks Fossick", role: "Customer Success Team Member", email: "aleks@smartfits.co.uk", phone: "", img: "./images/aleks_fossick.png" },

  roz: { name: "Roz Hardwick", role: "Operations Lead", email: "roz@smartfits.co.uk", phone: "", img: "./images/roz_hardwick.png" },
  ellie: { name: "Ellie Topliss", role: "Project Coordinator", email: "ellie@smartfits.co.uk", phone: "", img: "./images/ellie_topliss.png" },
  sophie: { name: "Sophie Turner", role: "Project Coordinator", email: "sophie@smartfits.co.uk", phone: "", img: "./images/sophie_turner.png" },
  amanda: { name: "Amanda Clarke", role: "Field Operations Team Member", email: "amanda@smartfits.co.uk", phone: "", img: "./images/amanda_clarke.png" },
  rosie: { name: "Rosie Smart", role: "Field Operations Team Member", email: "rosie@smartfits.co.uk", phone: "", img: "./images/rosie_smart.png" },
  bridie: { name: "Bridie Southam", role: "Field Operations Team Member", email: "bridie@smartfits.co.uk", phone: "", img: "./images/bridie_southam.png" },
  kasia: { name: "Kasia Dzielak", role: "Field Operations Team Member", email: "kasia@smartfits.co.uk", phone: "", img: "./images/kasia_dzielak.png" },
};

/** -------------------------
 *  Person modal
 * ------------------------- */
function showPerson(personKey) {
  const data = TEAM[personKey];
  if (!data) return;

  const personModal = $("#personModal");
  const body = $("#personBody");
  if (!personModal || !body) return;

  setHtml(
    body,
    `
      <img class="personModalImg" src="${escHtml(data.img)}" alt="${escHtml(data.name)}">
      <div class="personMeta">
        <h3>${escHtml(data.name)}</h3>
        <p class="role">${escHtml(data.role)}</p>

        <div class="metaBlock">
          <div class="metaLine"><span class="metaLabel">Email:</span>
            <a href="mailto:${escHtml(data.email)}">${escHtml(data.email)}</a>
          </div>
          <div class="metaLine"><span class="metaLabel">Phone:</span>
            <span class="metaValue">${escHtml(data.phone)}</span>
          </div>
        </div>

        <div class="metaBlock">
          <div class="metaLine"><span class="metaLabel">Support:</span>
            <span class="metaValue">01283 533330</span>
          </div>
          <div class="metaLine"><span class="metaLabel">Email:</span>
            <a href="mailto:support@smartfits.co.uk">support@smartfits.co.uk</a>
          </div>
        </div>
      </div>
    `
  );

  openModal(personModal);
}

/** -------------------------
 *  Policy popup
 * ------------------------- */
function showPolicyPopup() {
  const detailModal = $("#detailModal");
  const detailBody = $("#detailBody");
  const detailTitle = $("#detailTitle");
  const tpl = $("#policyTemplate");
  const panel = $("#detailModalPanel");

  if (!detailModal || !detailBody || !tpl) return;

  setText(detailTitle, "Cancellation Policy");
  detailBody.innerHTML = "";
  detailBody.appendChild(tpl.content.cloneNode(true));

  if (panel) panel.classList.add("wide");
  openModal(detailModal);
}

/** -------------------------
 *  Form handling
 * ------------------------- */
function bindForm() {
  const form = $("#deploymentForm");
  const status = $("#status");
  const clearBtn = $("#clearBtn");
  const acceptPolicy = $("#acceptPolicy");
  const acceptPolicyValue = $("#acceptPolicyValue");

  if (!form) return;

  if (acceptPolicy && acceptPolicyValue) {
    acceptPolicy.addEventListener("change", () => {
      acceptPolicyValue.value = acceptPolicy.checked ? "Yes" : "No";
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      form.reset();
      if (acceptPolicyValue) acceptPolicyValue.value = "No";
      setText(status, "");
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setText(status, "Submitting...");

    const data = Object.fromEntries(new FormData(form).entries());
    data.acceptPolicyValue = acceptPolicy?.checked ? "Yes" : "No";

    try {
      await postToGAS({ action: "submitForm", ...data });
      setText(status, "✅ Submitted successfully. Thank you — we’ll be in touch shortly.");
      form.reset();
      if (acceptPolicyValue) acceptPolicyValue.value = "No";
    } catch (err) {
      setText(status, `❌ ${err.message}`);
    }
  });
}

/** =========================================================
 *  ADMIN AUTH (persisted)
 *  ========================================================= */
const LS_TOKEN = "sf_admin_token";
const LS_ADMIN = "sf_admin_info";

let adminToken = "";
let adminInfo = null;

function saveAdminSession(token, info) {
  adminToken = token || "";
  adminInfo = info || null;
  if (adminToken) localStorage.setItem(LS_TOKEN, adminToken);
  else localStorage.removeItem(LS_TOKEN);

  if (adminInfo) localStorage.setItem(LS_ADMIN, JSON.stringify(adminInfo));
  else localStorage.removeItem(LS_ADMIN);
}

function loadAdminSession() {
  adminToken = localStorage.getItem(LS_TOKEN) || "";
  try {
    adminInfo = JSON.parse(localStorage.getItem(LS_ADMIN) || "null");
  } catch {
    adminInfo = null;
  }
}

function clearAdminSession() {
  saveAdminSession("", null);
}

/** -------------------------
 *  Admin view toggles
 * ------------------------- */
function setAdminView(isAuthed) {
  const loginView = $("#adminLoginView");
  const dashView = $("#adminDashView");
  const signedInAs = $("#adminSignedInAs");
  const logsCard = $("#logsCard");

  if (loginView) loginView.style.display = isAuthed ? "none" : "block";
  if (dashView) dashView.style.display = isAuthed ? "block" : "none";

  if (signedInAs) {
    signedInAs.textContent =
      isAuthed && adminInfo ? `Signed in as: ${adminInfo.name} (${adminInfo.email})` : "";
  }

  if (logsCard) {
    // show only if canViewLogs OR if property is missing (failsafe)
    const allowed = !!(adminInfo?.canViewLogs ?? true);
    logsCard.style.display = isAuthed && allowed ? "block" : "none";
  }
}

/** =========================================================
 *  ADMIN — Search files
 *  ========================================================= */
function renderFiles(files) {
  const tbody = byId("filesTbody");
  if (!tbody) return;

  if (!files || !files.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="muted">No results found.</td></tr>`;
    return;
  }

  tbody.innerHTML = files
    .map((f) => {
      const name = escHtml(f.name || "");
      const created = escHtml(f.created || "");
      const url = f.url || "#";
      return `
        <tr>
          <td><a href="${url}" target="_blank" rel="noopener noreferrer">${name}</a></td>
          <td>${created}</td>
          <td><a href="${url}" target="_blank" rel="noopener noreferrer">Open</a></td>
        </tr>
      `;
    })
    .join("");
}

async function handleSearchFiles() {
  const statusEl = byId("filesStatus");

  if (!adminToken) {
    if (statusEl) statusEl.textContent = "You must be signed in to search files.";
    return;
  }

  const query = safeVal("fileNameQuery");
  const dateWrap = byId("dateFilterWrap");
  const useDates = dateWrap && dateWrap.style.display !== "none";

  const fromDate = useDates ? safeVal("dateFrom") : "";
  const toDate = useDates ? safeVal("dateTo") : "";

  try {
    if (statusEl) statusEl.textContent = "Searching…";

    const json = await postToGAS({
      action: "listFiles",
      token: adminToken,
      query,
      fromDate: fromDate || null,
      toDate: toDate || null,
    });

    const files = json.files || [];
    renderFiles(files);
    if (statusEl) statusEl.textContent = files.length ? `Found ${files.length} file(s).` : "No results found.";
  } catch (err) {
    renderFiles([]);
    if (statusEl) statusEl.textContent = `❌ ${err.message}`;
  }
}

function bindDateToggle() {
  const btn = byId("toggleDateFilterBtn");
  const wrap = byId("dateFilterWrap");
  if (!btn || !wrap) return;

  // default hidden (in case HTML didn’t set it)
  if (!wrap.style.display) wrap.style.display = "none";

  if (btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";

  btn.addEventListener("click", () => {
    const isOpen = wrap.style.display !== "none";
    wrap.style.display = isOpen ? "none" : "block";
    btn.textContent = isOpen ? "Search by date too?" : "Hide date filter";
  });
}

function bindSearch() {
  const btn = byId("searchFilesBtn");
  if (btn && btn.dataset.bound !== "1") {
    btn.dataset.bound = "1";
    btn.addEventListener("click", handleSearchFiles);
  }

  const q = byId("fileNameQuery");
  if (q && q.dataset.bound !== "1") {
    q.dataset.bound = "1";
    q.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearchFiles();
      }
    });
  }
}

/** =========================================================
 *  ADMIN — Welcome Email (mailto)
 *  ========================================================= */
function buildWelcomeEmailBody(customerName, companyName) {
  const nameLine = customerName ? `Hi ${customerName},` : "Hi (name),";
  const companyLine = companyName
    ? `We're really pleased to welcome ${companyName} to join SmartFits in making the roads a safer place.`
    : `We're really pleased to welcome (company name) to join SmartFits in making the roads a safer place.`;

  const onboardingUrl = "https://smartfitscustomeronboarding.pages.dev/";

  // NOTE: email clients are plain text — we include the URL on its own line for easy clicking
  return `${nameLine}

Welcome to SmartFits Installations LTD.

${companyLine} Please review all necessary information and the onboarding process here:
${onboardingUrl}

If you need anything at all, please feel free to contact us at:

Support Phone Number - 01283 533330
Support Email Address - support@smartfits.co.uk
SmartFits Website: www.smartfits.co.uk

SMARTFITS INSTALLATIONS LTD
4 Eastgate Business Centre, Eastern Avenue, Stretton, Burton on Trent, DE13 0AT

Accepting an appointment or delivery of goods, constitutes that the terms and conditions (Terms & Conditions (smartfits.co.uk)) have been read and accepted.

Smartfits Installations Limited Registered Office: 4 Eastgate Business Centre, Eastern Avenue, Stretton, Burton on Trent, DE13 0AT

Registered in England & Wales.
The information contained in this e-mail, and any files transmitted with it, is confidential to the intended recipient(s). The dissemination, distribution, copying or disclosure of this message or its contents is prohibited unless authorised by the sender. If you receive this message in error, please immediately notify the sender and delete the message from your system. Unless expressly stated within the body of this communication, the content should not be understood to create any contractual commitments.
Although we have taken steps to ensure that this e-mail and attachments are free from any virus, we accept no responsibility for any virus they may contain. We advise you to scan all incoming messages and attachments on receipt. Please note that this e-mail has been created in the knowledge that Internet e-mail is not a completely secure communication medium. We advise that you do not communicate with us in this way if you do not accept these risks.

All I.T. Issues with the Customer Onboarding Site should be directed to Finley Hassall (finley@smartfits.co.uk).
`;
}

function openMailto(to, subject, body) {
  const url =
    `mailto:${encodeURIComponent(to || "")}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;

  window.location.href = url;
}

function bindWelcomeEmail() {
  const btn = byId("sendWelcomeBtn");
  const statusEl = byId("welcomeStatus");
  if (!btn) return;

  if (btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";

  btn.addEventListener("click", () => {
    const to = safeVal("welcomeTo");
    const customerName = safeVal("welcomeCustomer");
    const companyName = safeVal("welcomeCompany");

    if (!to) {
      if (statusEl) statusEl.textContent = "Please enter the customer email (recipient).";
      return;
    }

    const subject = "Welcome to SmartFits Installations LTD";
    const body = buildWelcomeEmailBody(customerName, companyName);

    openMailto(to, subject, body);
    if (statusEl) statusEl.textContent = "Opening email draft…";
  });
}

/** =========================================================
 *  ADMIN — Logs (FIXED)
 *  Expects IDs (if present):
 *    - loadLogsBtn
 *    - logsStatus
 *    - logsTbody
 * ========================================================= */
function renderLogs(rows) {
  const tbody = byId("logsTbody");
  if (!tbody) return;

  if (!rows || !rows.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="muted">No logs found.</td></tr>`;
    return;
  }

  // We try to support multiple return shapes
  // expected each log: { ts, level, action, message } but we fall back safely
  tbody.innerHTML = rows
    .map((r) => {
      const ts = escHtml(r.ts || r.time || r.created || "");
      const lvl = escHtml(r.level || r.type || "");
      const act = escHtml(r.action || r.event || "");
      const msg = escHtml(r.message || r.msg || r.detail || "");
      return `
        <tr>
          <td>${ts}</td>
          <td>${lvl}</td>
          <td>${act}</td>
          <td>${msg}</td>
        </tr>
      `;
    })
    .join("");
}

async function handleLoadLogs() {
  const statusEl = byId("logsStatus");

  if (!adminToken) {
    if (statusEl) statusEl.textContent = "You must be signed in to load logs.";
    return;
  }

  try {
    if (statusEl) statusEl.textContent = "Loading logs…";

    // Try common action names (so you don't get stuck if your Code.gs uses a slightly different one)
    const actionsToTry = ["getLogs", "loadLogs", "listLogs"];

    let json = null;
    let lastErr = null;

    for (const action of actionsToTry) {
      try {
        // eslint-disable-next-line no-await-in-loop
        json = await postToGAS({ action, token: adminToken });
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
      }
    }

    if (!json) throw lastErr || new Error("Failed to load logs.");

    const rows = json.logs || json.rows || json.items || [];
    renderLogs(rows);

    if (statusEl) statusEl.textContent = rows.length ? `Loaded ${rows.length} log(s).` : "No logs found.";
  } catch (err) {
    renderLogs([]);
    if (statusEl) statusEl.textContent = `❌ ${err.message}`;
  }
}

function bindLogs() {
  const btn = byId("loadLogsBtn");
  if (!btn) return;

  if (btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";

  btn.addEventListener("click", handleLoadLogs);
}

/** -------------------------
 *  Admin modal + login
 * ------------------------- */
function bindAdmin() {
  const adminModal = $("#adminModal");
  if (!adminModal) return;

  const openAdminBtn = $("#openAdminBtn");
  const closeAdminBtn = $("#closeAdminBtn");
  const logoutBtn = $("#adminLogoutBtn");

  const loginForm = $("#adminLoginForm");
  const adminStatus = $("#adminStatus");
  const adminClearBtn = $("#adminClearBtn");

  bindBackdropClose(adminModal, closeAdminBtn);

  // Restore session if any
  loadAdminSession();

  if (openAdminBtn) {
    openAdminBtn.addEventListener("click", () => {
      openModal(adminModal);
      setAdminView(!!adminToken);
      setText(adminStatus, "");
    });
  }

  if (adminClearBtn && loginForm) {
    adminClearBtn.addEventListener("click", () => {
      loginForm.reset();
      setText(adminStatus, "");
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      setText(adminStatus, "Signing in...");

      const email = $("#adminEmail")?.value?.trim() || "";
      const password = $("#adminPassword")?.value || "";

      try {
        const json = await postToGAS({ action: "adminLogin", email, password });

        saveAdminSession(json.token, json.admin);

        setText(adminStatus, "✅ Signed in.");
        setAdminView(true);
      } catch (err) {
        setText(adminStatus, `❌ ${err.message}`);
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearAdminSession();
      setAdminView(false);
      closeAllModals();
    });
  }

  // Bind admin dashboard buttons (safe even before login)
  bindSearch();
  bindDateToggle();
  bindWelcomeEmail();
  bindLogs();

  // If already logged in from storage, show proper view when modal opens
  setAdminView(!!adminToken);
}

/** -------------------------
 *  Bind buttons + modals
 * ------------------------- */
function bindModalsAndButtons() {
  // Policy buttons
  $("#openPolicyBtn")?.addEventListener("click", showPolicyPopup);
  $("#openPolicyBtn2")?.addEventListener("click", showPolicyPopup);

  // Detail modal close
  bindBackdropClose($("#detailModal"), $("#closeDetailBtn"));

  // Person modal close
  bindBackdropClose($("#personModal"), $("#closePersonBtn"));

  // Person buttons
  $$(".personBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-person");
      if (key) showPerson(key);
    });
  });
}

/** -------------------------
 *  Init
 * ------------------------- */
function init() {
  bindEscapeKey();
  bindForm();
  bindAdmin();
  bindModalsAndButtons();
}

document.addEventListener("DOMContentLoaded", () => {
  try {
    init();
  } catch (err) {
    console.error("Init failed:", err);
    closeAllModals();
  }
});


