/* =========================================================
   SmartFits Customer Onboarding — app.js (FULL FILE)
   ========================================================= */

/** 🔧 Your Google Apps Script Web App URL (ends with /exec) */
const GAS_URL =
  "https://script.google.com/macros/s/AKfycbxJ48d-Ykqvmvdwbhv4eJG_aJDySvl_rVtbjSNu-TrsrNylmdPm2NqYO5a97BY4tR-Ycg/exec";

/** -------------------------
 *  Helpers
 * ------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function setText(el, text) {
  if (el) el.textContent = text ?? "";
}

function setHtml(el, html) {
  if (el) el.innerHTML = html ?? "";
}

function escHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
 *
 *  IMPORTANT:
 *  Use Content-Type: text/plain to avoid OPTIONS preflight.
 *  Your Apps Script still receives JSON string in e.postData.contents,
 *  so JSON.parse(raw) works exactly the same.
 * ------------------------- */
async function postToGAS(payload) {
  const res = await fetch(GAS_URL, {
    method: "POST",
    // ✅ SIMPLE REQUEST, avoids preflight:
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
  tara: { name: "Tara Hassall", role: "Managing Director", email: "tara@smartfits.co.uk", phone: "01283 533330", img: "./images/tara_hassall.png" },
  charlie: { name: "Charlie Inger", role: "Sales & Business Development Manager", email: "charlie@smartfits.co.uk", phone: "07385 099620", img: "./images/charlie_inger.png" },
  emma: { name: "Emma Sumner", role: "Customer Success Team Leader", email: "emma@smartfits.co.uk", phone: "01283 533330", img: "./images/emma_sumner.png" },
  kelly: { name: "Kelly Mullen", role: "Customer Success Team Member", email: "support@smartfits.co.uk", phone: "01283 533330", img: "./images/kelly_mullen.png" },
  aleks: { name: "Aleks Fossick", role: "Customer Success Team Member", email: "support@smartfits.co.uk", phone: "01283 533330", img: "./images/aleks_fossick.png" },

  roz: { name: "Roz Hardwick", role: "Operations Lead", email: "support@smartfits.co.uk", phone: "01283 533330", img: "./images/roz_hardwick.png" },
  ellie: { name: "Ellie Topliss", role: "Project Coordinator", email: "support@smartfits.co.uk", phone: "01283 533330", img: "./images/ellie_topliss.png" },
  sophie: { name: "Sophie Turner", role: "Project Coordinator", email: "support@smartfits.co.uk", phone: "01283 533330", img: "./images/sophie_turner.png" },
  amanda: { name: "Amanda Clarke", role: "Field Operations Team Member", email: "support@smartfits.co.uk", phone: "01283 533330", img: "./images/amanda_clarke.png" },
  rosie: { name: "Rosie Smart", role: "Field Operations Team Member", email: "support@smartfits.co.uk", phone: "01283 533330", img: "./images/rosie_smart.png" },
  bridie: { name: "Bridie Southam", role: "Field Operations Team Member", email: "support@smartfits.co.uk", phone: "01283 533330", img: "./images/bridie_southam.png" },
  kasia: { name: "Kasia Dzielak", role: "Field Operations Team Member", email: "support@smartfits.co.uk", phone: "01283 533330", img: "./images/kasia_dzielak.png" },
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
 *  Policy popup (detail modal)
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

/** -------------------------
 *  Admin dashboard
 * ------------------------- */
let adminToken = null;
let adminInfo = null;

function setAdminView(isAuthed) {
  const loginView = $("#adminLoginView");
  const dashView = $("#adminDashView");
  const signedInAs = $("#adminSignedInAs");
  const logsCard = $("#logsCard");

  if (loginView) loginView.style.display = isAuthed ? "none" : "block";
  if (dashView) dashView.style.display = isAuthed ? "block" : "none";

  if (signedInAs) {
    signedInAs.textContent = isAuthed && adminInfo
      ? `Signed in as: ${adminInfo.name} (${adminInfo.email})`
      : "";
  }

  if (logsCard) {
    logsCard.style.display = isAuthed && adminInfo?.canViewLogs ? "block" : "none";
  }
}

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
        adminToken = json.token;
        adminInfo = json.admin;
        setText(adminStatus, "✅ Signed in.");
        setAdminView(true);
      } catch (err) {
        setText(adminStatus, `❌ ${err.message}`);
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      adminToken = null;
      adminInfo = null;
      setAdminView(false);
      closeModal(adminModal);
      closeAllModals();
    });
  }
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

/* =========================================================
   ADMIN DASHBOARD — FIX BUTTONS (Search / Date Toggle / Welcome Email)
   ========================================================= */

const API_ENDPOINT = "/api"; // <-- keep as /api if your Pages Function proxies to Apps Script

function $(id){ return document.getElementById(id); }

function safeVal(id){
  const el = $(id);
  return el ? String(el.value || "").trim() : "";
}

function setText(id, txt){
  const el = $(id);
  if (el) el.textContent = txt;
}

async function apiPost(payload){
  const res = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  // If your proxy returns non-JSON on error, this prevents "Unexpected token" issues.
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); }
  catch {
    throw new Error(text || `Request failed (${res.status})`);
  }

  if (!res.ok || data?.ok === false){
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

/* ---------- State (token + admin) ---------- */
function getToken(){
  return localStorage.getItem("sf_admin_token") || "";
}
function getAdmin(){
  try { return JSON.parse(localStorage.getItem("sf_admin_info") || "null"); }
  catch { return null; }
}

/* =========================================================
   1) Toggle date filter
   ========================================================= */
function bindDateToggle(){
  const btn = $("toggleDateFilterBtn");
  const wrap = $("dateFilterWrap");
  if (!btn || !wrap) return;

  btn.addEventListener("click", () => {
    const isOpen = wrap.style.display !== "none";
    wrap.style.display = isOpen ? "none" : "block";
    btn.textContent = isOpen ? "Search by date too?" : "Hide date filter";
  });
}

/* =========================================================
   2) Search files (Drive folder via your backend)
   ========================================================= */
function renderFiles(files){
  const tbody = $("filesTbody");
  if (!tbody) return;

  if (!files || !files.length){
    tbody.innerHTML = `<tr><td colspan="3" class="muted">No results found.</td></tr>`;
    return;
  }

  tbody.innerHTML = files.map(f => {
    const safeName = escapeHtml(f.name || "");
    const safeCreated = escapeHtml(f.created || "");
    const safeUrl = f.url || "#";
    return `
      <tr>
        <td><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeName}</a></td>
        <td>${safeCreated}</td>
        <td><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">Open</a></td>
      </tr>
    `;
  }).join("");
}

async function handleSearchFiles(){
  const token = getToken();
  if (!token){
    setText("filesStatus", "You must be signed in to search files.");
    return;
  }

  const query = safeVal("fileNameQuery");
  const dateWrap = $("dateFilterWrap");
  const useDates = dateWrap && dateWrap.style.display !== "none";

  const fromDate = useDates ? safeVal("dateFrom") : "";
  const toDate   = useDates ? safeVal("dateTo") : "";

  try{
    setText("filesStatus", "Searching…");

    // Calls Apps Script action: listFiles (your Code.gs supports this)
    const data = await apiPost({
      action: "listFiles",
      token,
      query,
      fromDate: fromDate || null,
      toDate: toDate || null
    });

    const files = data.files || data.result?.files || [];
    renderFiles(files);
    setText("filesStatus", files.length ? `Found ${files.length} file(s).` : "No results found.");
  }catch(err){
    setText("filesStatus", err.message || "Search failed.");
    renderFiles([]);
  }
}

function bindSearch(){
  const btn = $("searchFilesBtn");
  if (!btn) return;
  btn.addEventListener("click", handleSearchFiles);

  // Optional: Enter key in filename input triggers search
  const q = $("fileNameQuery");
  if (q){
    q.addEventListener("keydown", (e) => {
      if (e.key === "Enter"){
        e.preventDefault();
        handleSearchFiles();
      }
    });
  }
}

/* =========================================================
   3) Welcome email (mailto: opens user's Outlook/Apple Mail/etc)
   ========================================================= */
function buildWelcomeEmailBody(customerName, companyName){
  const nameLine = customerName ? `Hi ${customerName},` : "Hi,";
  const companyLine = companyName ? `We're really please to welcome ${companyName} to join SmartFits in making the roads a safer place.` :
                                    `We're really please to welcome your team to join SmartFits in making the roads a safer place.`;

  // NOTE: mailto bodies are plain text; include the URL directly
  const onboardingUrl = "https://smartfitscustomeronboarding.pages.dev/";

  const body =
`${nameLine}

Welcome to SmartFits Installations LTD.

${companyLine} Please review all necessary information and the onboarding process here:
${onboardingUrl}

If you need anything at all, please feel free to contact us at:

Support Phone Number - 01283 533330
Support Email Address - support@smartfits.co.uk
SmartFits Website: www.smartfits.co.uk

SMARTFITS INSTALLATIONS LTD
4 Eastgate Business Centre, Eastern Avenue, Stretton, Burton on Trent, DE13 0AT

Accepting an appointment or delivery of goods, constitutes that the terms and conditions have been read and accepted:
Terms & Conditions (smartfits.co.uk)

Smartfits Installations Limited Registered Office: 4 Eastgate Business Centre, Eastern Avenue, Stretton, Burton on Trent, DE13 0AT

Registered in England & Wales.
The information contained in this e-mail, and any files transmitted with it, is confidential to the intended recipient(s). The dissemination, distribution, copying or disclosure of this message or its contents is prohibited unless authorised by the sender. If you receive this message in error, please immediately notify the sender and delete the message from your system. Unless expressly stated within the body of this communication, the content should not be understood to create any contractual commitments.
Although we have taken steps to ensure that this e-mail and attachments are free from any virus, we accept no responsibility for any virus they may contain. We advise you to scan all incoming messages and attachments on receipt. Please note that this e-mail has been created in the knowledge that Internet e-mail is not a completely secure communication medium. We advise that you do not communicate with us in this way if you do not accept these risks.

All I.T. Issues with the Customer Onboarding Site should be directed to Finley Hassall (finley@smartfits.co.uk).
`;
  return body;
}

function openMailto(to, subject, body){
  const url =
    `mailto:${encodeURIComponent(to || "")}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;

  window.location.href = url;
}

function bindWelcomeEmail(){
  const btn = $("sendWelcomeBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const to = safeVal("welcomeTo");
    const customerName = safeVal("welcomeCustomer");
    const companyName = safeVal("welcomeCompany");

    if (!to){
      setText("welcomeStatus", "Please enter the customer email (recipient).");
      return;
    }

    const subject = "Welcome to SmartFits Installations LTD";
    const body = buildWelcomeEmailBody(customerName, companyName);

    // This opens the user's default email app (Outlook/Apple Mail/etc)
    openMailto(to, subject, body);

    // Optional UI feedback
    setText("welcomeStatus", "Opening email draft…");
  });
}

/* =========================================================
   Small helper
   ========================================================= */
function escapeHtml(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================================================
   INIT — call after DOM loads
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  bindDateToggle();
  bindSearch();
  bindWelcomeEmail();
});
