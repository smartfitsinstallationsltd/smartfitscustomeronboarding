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
  // Use position fixed lock (prevents "frozen without visible modal" bugs)
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

  // Remove fixed lock styles
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";

  // Restore scroll
  window.scrollTo(0, scrollYBeforeLock);
}

function openModal(backdropEl) {
  if (!backdropEl) return;

  // Actually show the modal FIRST
  backdropEl.classList.add("isOpen");
  backdropEl.setAttribute("aria-hidden", "false");

  // Then lock scroll (next frame = avoids "freeze, no modal")
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
  $$(".modalBackdrop.isOpen").forEach((b) => closeModal(b));
  openModalCount = 0;
  unlockBodyScroll();
}

/** Close modal when clicking backdrop (outside panel) */
function bindBackdropClose(backdropEl, closeBtnEl) {
  if (!backdropEl) return;

  backdropEl.addEventListener("mousedown", (e) => {
    // only close if user clicked the backdrop, not inside the modal panel
    if (e.target === backdropEl) closeModal(backdropEl);
  });

  if (closeBtnEl) {
    closeBtnEl.addEventListener("click", () => closeModal(backdropEl));
  }
}

/** Escape key closes top-most open modal */
function bindEscapeKey() {
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const openBackdrops = $$(".modalBackdrop.isOpen");
    if (!openBackdrops.length) return;
    closeModal(openBackdrops[openBackdrops.length - 1]);
  });
}

/** -------------------------
 *  API helpers (GAS expects JSON)
 * ------------------------- */
async function postToGAS(payload) {
  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" }, // ✅ required for your doPost JSON.parse
    body: JSON.stringify(payload),
  });

  const text = await res.text();

  // GAS may return JSON; if not, show helpful error
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    throw new Error(`Server did not return JSON: ${text.slice(0, 140)}...`);
  }

  if (!json.ok) {
    throw new Error(json.error || "Request failed.");
  }
  return json;
}

/** -------------------------
 *  Team data (popup content)
 * ------------------------- */
const TEAM = {
  tara: {
    name: "Tara Hassall",
    role: "Managing Director",
    email: "tara@smartfits.co.uk",
    phone: "01283 533330",
    img: "./images/tara_hassall.png",
  },
  charlie: {
    name: "Charlie Inger",
    role: "Sales & Business Development Manager",
    email: "charlie@smartfits.co.uk",
    phone: "07385 099620",
    img: "./images/charlie_inger.png",
  },
  emma: {
    name: "Emma Sumner",
    role: "Customer Success Team Leader",
    email: "emma@smartfits.co.uk",
    phone: "01283 533330",
    img: "./images/emma_sumner.png",
  },
  kelly: {
    name: "Kelly Mullen",
    role: "Customer Success Team Member",
    email: "support@smartfits.co.uk",
    phone: "01283 533330",
    img: "./images/kelly_mullen.png",
  },
  aleks: {
    name: "Aleks Fossick",
    role: "Customer Success Team Member",
    email: "support@smartfits.co.uk",
    phone: "01283 533330",
    img: "./images/aleks_fossick.png",
  },
  roz: {
    name: "Roz Hardwick",
    role: "Operations Lead",
    email: "support@smartfits.co.uk",
    phone: "01283 533330",
    img: "./images/roz_hardwick.png",
  },
  ellie: {
    name: "Ellie Topliss",
    role: "Project Coordinator",
    email: "support@smartfits.co.uk",
    phone: "01283 533330",
    img: "./images/ellie_topliss.png",
  },
  sophie: {
    name: "Sophie Turner",
    role: "Project Coordinator",
    email: "support@smartfits.co.uk",
    phone: "01283 533330",
    img: "./images/sophie_turner.png",
  },
  amanda: {
    name: "Amanda Clarke",
    role: "Field Operations Team Member",
    email: "support@smartfits.co.uk",
    phone: "01283 533330",
    img: "./images/amanda_clarke.png",
  },
  rosie: {
    name: "Rosie Smart",
    role: "Field Operations Team Member",
    email: "support@smartfits.co.uk",
    phone: "01283 533330",
    img: "./images/rosie_smart.png",
  },
  bridie: {
    name: "Bridie Southam",
    role: "Field Operations Team Member",
    email: "support@smartfits.co.uk",
    phone: "01283 533330",
    img: "./images/bridie_southam.png",
  },
  kasia: {
    name: "Kasia Dzielak",
    role: "Field Operations Team Member",
    email: "support@smartfits.co.uk",
    phone: "01283 533330",
    img: "./images/kasia_dzielak.png",
  },
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
    <img class="personModalImg" src="${escHtml(data.img)}" alt="${escHtml(
      data.name
    )}">
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
 *  Policy modal (detail modal)
 * ------------------------- */
function showPolicyPopup() {
  const detailModal = $("#detailModal");
  const detailBody = $("#detailBody");
  const detailTitle = $("#detailTitle");
  const tpl = $("#policyTemplate");

  if (!detailModal || !detailBody || !tpl) return;

  setText(detailTitle, "Cancellation Policy");
  const node = tpl.content.cloneNode(true);
  detailBody.innerHTML = "";
  detailBody.appendChild(node);

  // Make it wider if you want (optional):
  const panel = $("#detailModalPanel");
  if (panel) panel.classList.add("wide"); // CSS uses .modal.wide
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
    data.acceptPolicyValue =
      (acceptPolicy && acceptPolicy.checked) || data.acceptPolicyValue === "Yes"
        ? "Yes"
        : "No";

    try {
      await postToGAS({ action: "submitForm", ...data });
      setText(
        status,
        "✅ Submitted successfully. Thank you — we’ll be in touch shortly."
      );
      form.reset();
      if (acceptPolicyValue) acceptPolicyValue.value = "No";
    } catch (err) {
      setText(status, `❌ ${err.message}`);
    }
  });
}

/** -------------------------
 *  Admin dashboard (login + actions)
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
    if (isAuthed && adminInfo) {
      signedInAs.textContent = `Signed in as: ${adminInfo.name} (${adminInfo.email})`;
    } else {
      signedInAs.textContent = "";
    }
  }

  if (logsCard) {
    if (isAuthed && adminInfo && adminInfo.canViewLogs) {
      logsCard.style.display = "block";
    } else {
      logsCard.style.display = "none";
    }
  }
}

function bindAdmin() {
  const adminModal = $("#adminModal");
  const openAdminBtn = $("#openAdminBtn");
  const closeAdminBtn = $("#closeAdminBtn");
  const logoutBtn = $("#adminLogoutBtn");

  const loginForm = $("#adminLoginForm");
  const adminStatus = $("#adminStatus");
  const adminClearBtn = $("#adminClearBtn");

  const searchFilesBtn = $("#searchFilesBtn");
  const fileNameQuery = $("#fileNameQuery");
  const dateFrom = $("#dateFrom");
  const dateTo = $("#dateTo");
  const filesStatus = $("#filesStatus");
  const filesTbody = $("#filesTbody");
  const toggleDateFilterBtn = $("#toggleDateFilterBtn");
  const dateFilterWrap = $("#dateFilterWrap");

  const sendWelcomeBtn = $("#sendWelcomeBtn");
  const welcomeTo = $("#welcomeTo");
  const welcomeCustomer = $("#welcomeCustomer");
  const welcomeCompany = $("#welcomeCompany");
  const welcomeStatus = $("#welcomeStatus");

  const loadLogsBtn = $("#loadLogsBtn");
  const logsTbody = $("#logsTbody");
  const logsStatus = $("#logsStatus");
  const logFrom = $("#logFrom");
  const logTo = $("#logTo");
  const logEmailContains = $("#logEmailContains");
  const logActionType = $("#logActionType");

  if (!adminModal) return;

  // Bind backdrop close
  bindBackdropClose(adminModal, closeAdminBtn);

  // Open admin modal
  if (openAdminBtn) {
    openAdminBtn.addEventListener("click", () => {
      try {
        // ensure it actually opens
        openModal(adminModal);
        setAdminView(!!adminToken);
        setText(adminStatus, "");
      } catch (err) {
        // if something goes wrong, never leave the page frozen
        unlockBodyScroll();
        console.error(err);
      }
    });
  }

  // Login clear
  if (adminClearBtn && loginForm) {
    adminClearBtn.addEventListener("click", () => {
      loginForm.reset();
      setText(adminStatus, "");
    });
  }

  // Login submit
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

        // Log action (optional)
        await postToGAS({
          action: "logAction",
          token: adminToken,
          actionType: "LOGIN",
          details: { message: "Admin logged in" },
        });
      } catch (err) {
        setText(adminStatus, `❌ ${err.message}`);
      }
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        if (adminToken) {
          await postToGAS({
            action: "logAction",
            token: adminToken,
            actionType: "LOGOUT",
            details: { message: "Admin logged out" },
          });
        }
      } catch (_) {}

      adminToken = null;
      adminInfo = null;
      setAdminView(false);

      // Close admin modal AND restore scroll
      closeModal(adminModal);
      closeAllModals();
    });
  }

  // Toggle date filter
  if (toggleDateFilterBtn && dateFilterWrap) {
    toggleDateFilterBtn.addEventListener("click", () => {
      const open = dateFilterWrap.style.display !== "none";
      dateFilterWrap.style.display = open ? "none" : "block";
    });
  }

  // Search files
  if (searchFilesBtn) {
    searchFilesBtn.addEventListener("click", async () => {
      if (!adminToken) return setText(filesStatus, "❌ Please sign in first.");

      setText(filesStatus, "Searching...");
      if (filesTbody) filesTbody.innerHTML = `<tr><td colspan="3">Loading...</td></tr>`;

      try {
        const query = fileNameQuery?.value?.trim() || "";
        const fromDate = dateFrom?.value || "";
        const toDate = dateTo?.value || "";

        const json = await postToGAS({
          action: "listFiles",
          token: adminToken,
          query,
          fromDate,
          toDate,
        });

        const files = json.files || [];
        setText(filesStatus, files.length ? `✅ Found ${files.length} file(s).` : "No results.");

        if (filesTbody) {
          if (!files.length) {
            filesTbody.innerHTML = `<tr><td colspan="3" class="muted">No matching files.</td></tr>`;
          } else {
            filesTbody.innerHTML = files
              .map(
                (f) => `
                <tr>
                  <td><a href="${escHtml(f.url)}" target="_blank" rel="noopener">${escHtml(
                  f.name
                )}</a></td>
                  <td>${escHtml(f.created)}</td>
                  <td>
                    <button class="chipBtn" data-del="${escHtml(f.id)}" type="button">Delete</button>
                  </td>
                </tr>
              `
              )
              .join("");

            // Bind delete buttons
            $$("[data-del]", filesTbody).forEach((btn) => {
              btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-del");
                if (!id) return;
                if (!confirm("Delete this file?")) return;

                try {
                  await postToGAS({ action: "deleteFile", token: adminToken, fileId: id });
                  await postToGAS({
                    action: "logAction",
                    token: adminToken,
                    actionType: "DELETE_FILE",
                    details: { fileId: id },
                  });
                  btn.closest("tr")?.remove();
                } catch (err) {
                  alert(err.message);
                }
              });
            });
          }
        }
      } catch (err) {
        setText(filesStatus, `❌ ${err.message}`);
        if (filesTbody) filesTbody.innerHTML = `<tr><td colspan="3">Error.</td></tr>`;
      }
    });
  }

  // Welcome email (logged only; sending email itself requires you to add a GAS handler if you want it to actually email)
  if (sendWelcomeBtn) {
    sendWelcomeBtn.addEventListener("click", async () => {
      if (!adminToken) return setText(welcomeStatus, "❌ Please sign in first.");

      const to = welcomeTo?.value?.trim() || "";
      const customer = welcomeCustomer?.value?.trim() || "";
      const company = welcomeCompany?.value?.trim() || "";

      if (!to || !customer || !company) {
        return setText(welcomeStatus, "❌ Please fill: recipient email, customer name, and company name.");
      }

      setText(welcomeStatus, "Sending...");

      try {
        // If you want GAS to actually SEND the email, you need to add a new action in Code.gs (I can do that next).
        // For now, we still log it in the system.
        await postToGAS({
          action: "logAction",
          token: adminToken,
          actionType: "WELCOME_EMAIL",
          details: { to, customer, company },
        });

        setText(welcomeStatus, "✅ Logged welcome email action.");
      } catch (err) {
        setText(welcomeStatus, `❌ ${err.message}`);
      }
    });
  }

  // Load logs (only if canViewLogs)
  if (loadLogsBtn) {
    loadLogsBtn.addEventListener("click", async () => {
      if (!adminToken) return setText(logsStatus, "❌ Please sign in first.");
      if (!adminInfo?.canViewLogs) return setText(logsStatus, "❌ Not authorised to view logs.");

      setText(logsStatus, "Loading logs...");
      if (logsTbody) logsTbody.innerHTML = `<tr><td colspan="4">Loading...</td></tr>`;

      try {
        const fromDate = logFrom?.value || "";
        const toDate = logTo?.value || "";
        const adminEmail = logEmailContains?.value?.trim() || "";
        const actionType =
          (logActionType?.value || "ALL").toUpperCase() === "ALL"
            ? ""
            : (logActionType?.value || "").toUpperCase();

        const json = await postToGAS({
          action: "listLogs",
          token: adminToken,
          fromDate,
          toDate,
          adminEmail,
          actionType,
        });

        const logs = json.logs || [];
        setText(logsStatus, logs.length ? `✅ ${logs.length} log(s).` : "No logs found.");

        if (logsTbody) {
          if (!logs.length) {
            logsTbody.innerHTML = `<tr><td colspan="4" class="muted">No logs.</td></tr>`;
          } else {
            logsTbody.innerHTML = logs
              .map(
                (l) => `
              <tr>
                <td>${escHtml(l.timestamp)}</td>
                <td>${escHtml(l.adminName)}<br><span style="opacity:.7">${escHtml(
                  l.adminEmail
                )}</span></td>
                <td>${escHtml(l.actionType)}</td>
                <td style="max-width:520px; white-space:pre-wrap;">${escHtml(l.details)}</td>
              </tr>
            `
              )
              .join("");
          }
        }
      } catch (err) {
        setText(logsStatus, `❌ ${err.message}`);
        if (logsTbody) logsTbody.innerHTML = `<tr><td colspan="4">Error.</td></tr>`;
      }
    });
  }
}

/** -------------------------
 *  Wire up buttons + modals
 * ------------------------- */
function bindModalsAndButtons() {
  // Policy buttons
  const openPolicyBtn = $("#openPolicyBtn");
  const openPolicyBtn2 = $("#openPolicyBtn2");
  if (openPolicyBtn) openPolicyBtn.addEventListener("click", showPolicyPopup);
  if (openPolicyBtn2) openPolicyBtn2.addEventListener("click", showPolicyPopup);

  // Detail modal close
  const detailModal = $("#detailModal");
  bindBackdropClose(detailModal, $("#closeDetailBtn"));

  // Person modal close
  const personModal = $("#personModal");
  bindBackdropClose(personModal, $("#closePersonBtn"));

  // Person buttons
  $$(".personBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-person");
      if (!key) return;
      try {
        showPerson(key);
      } catch (err) {
        // never freeze if something goes wrong
        console.error(err);
        closeAllModals();
      }
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
