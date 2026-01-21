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
    signedInAs.textContent =
      isAuthed && adminInfo ? `Signed in as: ${adminInfo.name} (${adminInfo.email})` : "";
  }

  if (logsCard) {
    logsCard.style.display = isAuthed && adminInfo?.canViewLogs ? "block" : "none";
  }
}

function safeVal(id) {
  const el = document.getElementById(id);
  return el ? String(el.value || "").trim() : "";
}

/* ---- Admin: Search files (Drive folder via GAS) ---- */
function renderFiles(files) {
  const tbody = document.getElementById("filesTbody");
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
  const statusEl = document.getElementById("filesStatus");

  if (!adminToken) {
    if (statusEl) statusEl.textContent = "You must be signed in to search files.";
    return;
  }

  const query = safeVal("fileNameQuery");
  const dateWrap = document.getElementById("dateFilterWrap");
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

/* ---- Admin: Date filter toggle ---- */
function bindDateToggle() {
  const btn = document.getElementById("toggleDateFilterBtn");
  const wrap = document.getElementById("dateFilterWrap");
  if (!btn || !wrap) return;

  btn.addEventListener("click", () => {
    const isOpen = wrap.style.display !== "none";
    wrap.style.display = isOpen ? "none" : "block";
    btn.textContent = isOpen ? "Search by date too?" : "Hide date filter";
  });
}

/* ---- Admin: Welcome email (mailto) ---- */
function buildWelcomeEmailBody(customerName, companyName) {
  const nameLine = customerName ? `Hi ${customerName},` : "Hi (name),";
  const companyLine = companyName
    ? `We're really please to welcome ${companyName} to join SmartFits in making the roads a safer place.`
    : `We're really please to welcome (company name) to join SmartFits in making the roads a safer place.`;

  const onboardingUrl = "https://smartfitscustomeronboarding.pages.dev/";

  return `${nameLine}

Welcome to SmartFits Installations LTD.

${companyLine} Please review all necessary information and the onboarding process here. (when pressed here it links them to ${onboardingUrl})

If you need anything at all, please feel free to contact us at:

Support Phone Number - 01283 533330
Support Email Address - support@smartfits.co.uk
SmartFits Website: www.smartfits.co.uk

SmartFits Installations LTD
4 Eastgate Business Centre, Eastern Avenue, Stretton, Burton on Trent, DE13 0AT

Accepting an appointment or delivery of goods, constitutes that the terms and conditions (Terms & Conditions (smartfits.co.uk)) have been read and accepted.  

Smartfits Installations Limited Registered Office: 4 Eastgate Business Centre, Eastern Avenue, Stretton, Burton on Trent, DE13 0AT

Registered in England & Wales.
The information contained in this e-mail, and any files transmitted with it, is confidential to the intended recipient(s). The dissemination, distribution, copying or disclosure of this message or its contents is prohibited unless authorised by the sender. If you receive this message in error, please immediately notify the sender and delete the message from your system. Unless expressly stated within the body of this communication, the content should not be understood to create any contractual commitments.
Although we have taken steps to ensure that this e-mail and attachments are free from any virus, we accept no responsibility for any virus they may contain. We advise you to scan all incoming messages and attachments on receipt. Please note that this e-mail has been created in the knowledge that Internet e-mail is not a completely secure communication medium. We advise that you do not communicate with us in this way if you do not accept these risks

All I.T. Issues with the Customer Onboarding Site should be directed to Finley Hassall (finley@smartfits.co.uk).
`;
}

function openMailto(to, subject, body) {
  // Replace the "(when pressed here...)" text with a real clickable URL line for mail clients:
  const finalBody = body.replace(
    /\(when pressed here it links them to https:\/\/smartfitscustomeronboarding\.pages\.dev\/\)/g,
    `\n${"https://smartfitscustomeronboarding.pages.dev/"}\n`
  );

  const url =
    `mailto:${encodeURIComponent(to || "")}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(finalBody)}`;

  window.location.href = url;
}

function bindWelcomeEmail() {
  const btn = document.getElementById("sendWelcomeBtn");
  const statusEl = document.getElementById("welcomeStatus");
  if (!btn) return;

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

/* ---- Admin: bind dashboard buttons (only once) ---- */
function bindAdminDashboardButtons() {
  // search
  const searchBtn = document.getElementById("searchFilesBtn");
  if (searchBtn) searchBtn.addEventListener("click", handleSearchFiles);

  // enter key on filename triggers search
  const q = document.getElementById("fileNameQuery");
  if (q) {
    q.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearchFiles();
      }
    });
  }

  // date toggle + welcome email
  bindDateToggle();
  bindWelcomeEmail();
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

        // ✅ make sure admin dashboard buttons are wired after login
        bindAdminDashboardButtons();
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
      closeAllModals(); // back to normal page
    });
  }

  // Also bind dashboard buttons even before login (safe; handlers check adminToken)
  bindAdminDashboardButtons();
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
