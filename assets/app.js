(() => {
  "use strict";

  // ====== CONFIG ======
  const GAS_URL =
    "https://script.google.com/macros/s/AKfycbxJ48d-Ykqvmvdwbhv4eJG_aJDySvl_rVtbjSNu-TrsrNylmdPm2NqYO5a97BY4tR-Ycg/exec";

  const ACTIONS = {
    SUBMIT_FORM: "submitForm",
    LOGIN: "adminLogin",
    WHOAMI: "whoami",
    LIST_FILES: "listFiles",
    DELETE_FILE: "deleteFile",
    LIST_LOGS: "listLogs",
    LOG_ACTION: "logAction",
    SEND_WELCOME: "sendWelcomeEmail"
  };

  const SUPPORT = { phone: "01283 533330", email: "support@smartfits.co.uk" };

  const PEOPLE = {
    tara: { name: "Tara Hassall", role: "Managing Director", email: "tara@smartfits.co.uk", phone: "07894 880559", img: "./images/tara_hassall.png" },
    charlie: { name: "Charlie Inger", role: "Sales & Business Development Manager", email: "charlie@smartfits.co.uk", phone: "07385 099620", img: "./images/charlie_inger.png" },
    emma: { name: "Emma Sumner", role: "Customer Success Team Leader", email: "emma@smartfits.co.uk", img: "./images/emma_sumner.png" },
    kelly: { name: "Kelly Mullen", role: "Customer Success Team Member", email: "kelly@smartfits.co.uk", img: "./images/kelly_mullen.png" },
    aleks: { name: "Aleks Fossick", role: "Customer Success Team Member", email: "aleks@smartfits.co.uk", img: "./images/aleks_fossick.png" },
    roz: { name: "Roz Hardwick", role: "Operations Lead", email: "roz@smartfits.co.uk", img: "./images/roz_hardwick.png" },
    ellie: { name: "Ellie Topliss", role: "Project Coordinator", email: "ellie@smartfits.co.uk", img: "./images/ellie_topliss.png" },
    sophie: { name: "Sophie Turner", role: "Project Coordinator", email: "sophie@smartfits.co.uk", img: "./images/sophie_turner.png" },
    amanda: { name: "Amanda Clarke", role: "Field Operations Team Member", email: "amanda@smartfits.co.uk", img: "./images/amanda_clarke.png" },
    rosie: { name: "Rosie Smart", role: "Field Operations Team Member", email: "rosie@smartfits.co.uk", img: "./images/rosie_smart.png" },
    bridie: { name: "Bridie Southam", role: "Field Operations Team Member", email: "bridie@smartfits.co.uk", img: "./images/bridie_southam.png" },
    kasia: { name: "Kasia Dzielak", role: "Field Operations Team Member", email: "kasia@smartfits.co.uk", img: "./images/kasia_dzielak.png" }
  };

  // ====== HELPERS ======
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function show(el) { el.classList.add("show"); el.setAttribute("aria-hidden", "false"); }
  function hide(el) { el.classList.remove("show"); el.setAttribute("aria-hidden", "true"); }

  function setStatus(el, msg, type) {
    if (!el) return;
    el.textContent = msg || "";
    el.classList.remove("ok", "err");
    if (type === "ok") el.classList.add("ok");
    if (type === "err") el.classList.add("err");
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ====== STATE ======
  const state = {
    admin: {
      authed: false,
      token: "",
      admin: null,
      lastLogs: []
    }
  };

  // ====== API CALL ======
  async function apiCall(payloadObj) {
    const body = JSON.stringify(payloadObj || {});
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch { throw new Error("Server did not return valid JSON."); }

    if (!data || data.ok !== true) throw new Error(data?.error || "Request failed.");
    return data;
  }

  // ====== MODALS ======
  function openAdminModal() {
    const adminModal = $("#adminModal");
    if (!adminModal) return;

    if (!state.admin.authed) {
      $("#adminLoginView").style.display = "";
      $("#adminDashView").style.display = "none";
      setStatus($("#adminStatus"), "", "");
    } else {
      $("#adminLoginView").style.display = "none";
      $("#adminDashView").style.display = "";

      $("#adminSignedInAs").textContent = `Signed in as ${state.admin.admin?.email || ""}`;
      const logsCard = $("#logsCard");
      if (logsCard) logsCard.style.display = state.admin.admin?.canViewLogs ? "" : "none";
    }

    show(adminModal);
  }

  function closeAdminModal() {
    const adminModal = $("#adminModal");
    if (adminModal) hide(adminModal);
  }

  function openPersonModal(personKey) {
    const p = PEOPLE[personKey];
    if (!p) return;

    const modal = $("#personModal");
    const body = $("#personBody");
    const title = $("#personTitle");
    if (!modal || !body || !title) return;

    title.textContent = "Team Member";

    body.innerHTML = `
      <div class="personModalGrid">
        <img class="personModalPhoto" src="${escapeHtml(p.img)}" alt="${escapeHtml(p.name)}"/>
        <div>
          <div class="personModalName">${escapeHtml(p.name)}</div>
          <div class="personModalRole">${escapeHtml(p.role)}</div>

          <div class="personContactBox">
            <div class="muted" style="font-weight:800; letter-spacing:.18px;">Contact details</div>

            <div class="personContactRow">
              <div class="personKey">Email</div>
              <div class="personVal">${escapeHtml(p.email)}</div>
            </div>

            ${p.phone ? `
            <div class="personContactRow">
              <div class="personKey">Phone</div>
              <div class="personVal">${escapeHtml(p.phone)}</div>
            </div>` : ``}
          </div>

          <div class="personContactBox" style="margin-top:12px;">
            <div class="muted" style="font-weight:800; letter-spacing:.18px;">Want general support?</div>

            <div class="personContactRow">
              <div class="personKey">Support Phone</div>
              <div class="personVal">${escapeHtml(SUPPORT.phone)}</div>
            </div>

            <div class="personContactRow">
              <div class="personKey">Support Email</div>
              <div class="personVal">${escapeHtml(SUPPORT.email)}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    show(modal);
  }

  function closePersonModal() { const modal = $("#personModal"); if (modal) hide(modal); }

  function openDetailModal(titleText, html) {
    const modal = $("#detailModal");
    if (!modal) return;
    $("#detailTitle").textContent = titleText || "Details";
    $("#detailBody").innerHTML = html || "";
    show(modal);
  }

  function closeDetailModal() { const modal = $("#detailModal"); if (modal) hide(modal); }

  function openPolicyModal() {
    const tpl = $("#policyTemplate");
    if (!tpl) return;
    openDetailModal("Cancellation Policy", tpl.innerHTML);
  }

  // ====== ADMIN AUTH ======
  async function adminLogin(email, password) {
    setStatus($("#adminStatus"), "Signing in...", "");

    const data = await apiCall({ action: ACTIONS.LOGIN, email, password });

    state.admin.authed = true;
    state.admin.token = data.token || "";
    state.admin.admin = data.admin || null;

    $("#adminSignedInAs").textContent = `Signed in as ${state.admin.admin?.email || email}`;

    $("#adminLoginView").style.display = "none";
    $("#adminDashView").style.display = "";

    const logsCard = $("#logsCard");
    if (logsCard) logsCard.style.display = state.admin.admin?.canViewLogs ? "" : "none";

    setStatus($("#adminStatus"), "", "");
  }

  async function adminLogout() {
    // GAS has no explicit logout endpoint; clear client session
    try {
      if (state.admin.authed && state.admin.token) {
        await apiCall({
          action: ACTIONS.LOG_ACTION,
          token: state.admin.token,
          actionType: "LOGOUT",
          details: { message: "Admin logged out (client-side)" }
        });
      }
    } catch {}

    state.admin.authed = false;
    state.admin.token = "";
    state.admin.admin = null;
    state.admin.lastLogs = [];

    // Reset dashboard UI
    $("#adminLoginView").style.display = "";
    $("#adminDashView").style.display = "none";

    setStatus($("#filesStatus"), "", "");
    setStatus($("#logsStatus"), "", "");
    setStatus($("#welcomeStatus"), "", "");

    const ft = $("#filesTbody");
    if (ft) ft.innerHTML = `<tr><td colspan="3" class="muted">No results yet.</td></tr>`;
    const lt = $("#logsTbody");
    if (lt) lt.innerHTML = `<tr><td colspan="4" class="muted">No logs loaded.</td></tr>`;

    // Close admin modal + go back to top/home
    closeAdminModal();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ====== ADMIN FILES ======
  function renderFiles(files) {
    const tbody = $("#filesTbody");
    if (!tbody) return;

    if (!files || !files.length) {
      tbody.innerHTML = `<tr><td colspan="3" class="muted">No matching files found.</td></tr>`;
      return;
    }

    tbody.innerHTML = files.map(f => {
      const id = escapeHtml(f.id || "");
      const name = escapeHtml(f.name || "");
      const created = escapeHtml(f.created || "");
      const url = escapeHtml(f.url || "");
      return `
        <tr>
          <td>${name}</td>
          <td>${created}</td>
          <td>
            ${url ? `<button class="adminLink" data-act="openUrl" data-url="${url}">View</button>` : ``}
            <button class="adminDanger" data-act="deleteFile" data-id="${id}" data-name="${name}">Delete</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  async function listFiles() {
    if (!state.admin.authed) return;

    setStatus($("#filesStatus"), "Searching...", "");

    const query = $("#fileNameQuery")?.value?.trim() || "";
    const fromDate = $("#dateFrom")?.value || "";
    const toDate = $("#dateTo")?.value || "";

    const data = await apiCall({
      action: ACTIONS.LIST_FILES,
      token: state.admin.token,
      query,
      fromDate,
      toDate
    });

    renderFiles(data.files || []);
    setStatus($("#filesStatus"), `Found ${(data.files || []).length} file(s).`, "ok");
  }

  async function deleteFile(fileId, fileName) {
    if (!state.admin.authed) return;
    if (!confirm(`Delete this file?\n\n${fileName || fileId}`)) return;

    setStatus($("#filesStatus"), "Deleting...", "");

    await apiCall({ action: ACTIONS.DELETE_FILE, token: state.admin.token, fileId });
    setStatus($("#filesStatus"), "File deleted.", "ok");
    await listFiles();
  }

  // ====== ADMIN LOGS ======
  function renderLogs(logs) {
    const tbody = $("#logsTbody");
    if (!tbody) return;

    if (!logs || !logs.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="muted">No logs found.</td></tr>`;
      return;
    }

    state.admin.lastLogs = logs;

    tbody.innerHTML = logs.map((l, idx) => {
      const ts = escapeHtml(l.timestamp || "");
      const adminEmail = escapeHtml(l.adminEmail || "");
      const actionType = escapeHtml(l.actionType || "");
      const details = escapeHtml(l.details || "");
      const summary = details.length > 80 ? details.slice(0, 80) + "…" : details;

      return `
        <tr data-act="openLogDetail" data-idx="${idx}">
          <td>${ts}</td>
          <td>${adminEmail}</td>
          <td>${actionType}</td>
          <td>${summary || "<span class='muted'>Click to view</span>"}</td>
        </tr>
      `;
    }).join("");
  }

  async function listLogs() {
    if (!state.admin.authed) return;
    if (!state.admin.admin?.canViewLogs) return;

    setStatus($("#logsStatus"), "Loading logs...", "");

    const fromDate = $("#logFrom")?.value || "";
    const toDate = $("#logTo")?.value || "";
    const adminEmail = $("#logEmailContains")?.value?.trim() || "";
    const actionType = $("#logActionType")?.value || "ALL";

    const payload = { action: ACTIONS.LIST_LOGS, token: state.admin.token, fromDate, toDate };
    if (adminEmail) payload.adminEmail = adminEmail;
    if (actionType && actionType !== "ALL") payload.actionType = actionType;

    const data = await apiCall(payload);

    renderLogs(data.logs || []);
    setStatus($("#logsStatus"), `Loaded ${(data.logs || []).length} log(s).`, "ok");
  }

  function openLogDetail(idx) {
    const l = (state.admin.lastLogs || [])[idx];
    if (!l) return;

    const html = `
      <div class="doc">
        <p class="muted" style="margin:0 0 8px;">Log details</p>
        <div style="display:grid; gap:10px;">
          <div><b>Timestamp:</b> ${escapeHtml(l.timestamp || "")}</div>
          <div><b>Admin:</b> ${escapeHtml(l.adminEmail || "")}</div>
          <div><b>Action:</b> ${escapeHtml(l.actionType || "")}</div>
          <div style="margin-top:8px;"><b>Details:</b></div>
          <pre style="white-space:pre-wrap; margin:0; color:rgba(235,242,255,.88);">${escapeHtml(l.details || "")}</pre>
        </div>
      </div>
    `;
    openDetailModal("Log Details", html);
  }

  // ====== WELCOME EMAIL ======
  async function sendWelcomeEmail() {
    if (!state.admin.authed) return;

    const to = $("#welcomeTo")?.value?.trim() || "";
    const customerName = $("#welcomeCustomer")?.value?.trim() || "";
    const companyName = $("#welcomeCompany")?.value?.trim() || "";

    if (!to || !customerName || !companyName) {
      setStatus($("#welcomeStatus"), "Please enter recipient email, customer name, and company name.", "err");
      return;
    }

    setStatus($("#welcomeStatus"), "Sending...", "");

    try {
      const data = await apiCall({
        action: ACTIONS.SEND_WELCOME,
        token: state.admin.token,
        to,
        customerName,
        companyName
      });

      setStatus($("#welcomeStatus"), data.message || "Welcome email sent.", "ok");
      $("#welcomeTo").value = "";
      $("#welcomeCustomer").value = "";
      $("#welcomeCompany").value = "";
    } catch (e) {
      setStatus($("#welcomeStatus"), `Send failed. ${e.message || ""}`.trim(), "err");
    }
  }

  // ====== FORM SUBMIT ======
  async function submitDeploymentForm(formEl) {
    const statusEl = $("#status");
    setStatus(statusEl, "Submitting...", "");

    $("#acceptPolicyValue").value = $("#acceptPolicy")?.checked ? "Yes" : "No";

    const fd = new FormData(formEl);
    const payload = { action: ACTIONS.SUBMIT_FORM };
    fd.forEach((v, k) => payload[k] = String(v ?? ""));

    try {
      await apiCall(payload);
      setStatus(statusEl, "Submitted successfully. Thank you for the business.", "ok");
      formEl.reset();
      $("#acceptPolicyValue").value = "No";
    } catch (e) {
      setStatus(statusEl, `Submit failed. ${e.message || ""}`.trim(), "err");
    }
  }

  // ====== INIT ======
  function bind() {
    // Admin open/close
    $("#openAdminBtn")?.addEventListener("click", (e) => { e.preventDefault(); openAdminModal(); });
    $("#closeAdminBtn")?.addEventListener("click", closeAdminModal);

    // Person modal close
    $("#closePersonBtn")?.addEventListener("click", closePersonModal);

    // Detail modal close
    $("#closeDetailBtn")?.addEventListener("click", closeDetailModal);

    // Click outside closes
    $$(".modalBackdrop").forEach(backdrop => {
      backdrop.addEventListener("click", (ev) => {
        if (ev.target === backdrop) hide(backdrop);
      });
    });

    // Delegated clicks (person cards + admin table + logs)
    document.addEventListener("click", (ev) => {
      const personBtn = ev.target.closest(".personBtn");
      if (personBtn) {
        ev.preventDefault();
        const key = personBtn.getAttribute("data-person");
        openPersonModal(key);
        return;
      }

      const actBtn = ev.target.closest("[data-act]");
      if (!actBtn) return;

      const act = actBtn.getAttribute("data-act");

      if (act === "openUrl") {
        const url = actBtn.getAttribute("data-url");
        if (url) window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
      if (act === "deleteFile") {
        const id = actBtn.getAttribute("data-id");
        const name = actBtn.getAttribute("data-name");
        if (id) deleteFile(id, name);
        return;
      }
      if (act === "openLogDetail") {
        const idx = Number(actBtn.getAttribute("data-idx"));
        openLogDetail(idx);
        return;
      }
    });

    // Admin login
    $("#adminLoginForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("#adminEmail")?.value?.trim().toLowerCase() || "";
      const pass = $("#adminPassword")?.value || "";

      try {
        await adminLogin(email, pass);
      } catch (err) {
        setStatus($("#adminStatus"), `Login failed. ${err.message || "Invalid email or password."}`, "err");
      }
    });

    $("#adminClearBtn")?.addEventListener("click", () => {
      $("#adminEmail").value = "";
      $("#adminPassword").value = "";
      setStatus($("#adminStatus"), "", "");
    });

    $("#adminLogoutBtn")?.addEventListener("click", adminLogout);

    // Search toggle date filter
    $("#toggleDateFilterBtn")?.addEventListener("click", () => {
      const wrap = $("#dateFilterWrap");
      if (!wrap) return;
      const isOpen = wrap.style.display !== "none";
      wrap.style.display = isOpen ? "none" : "";
      $("#toggleDateFilterBtn").textContent = isOpen ? "Search by date too?" : "Hide date filter";
    });

    // Search files
    $("#searchFilesBtn")?.addEventListener("click", async () => {
      try { await listFiles(); }
      catch (err) { setStatus($("#filesStatus"), `Search failed. ${err.message || ""}`.trim(), "err"); }
    });

    // Logs load
    $("#loadLogsBtn")?.addEventListener("click", async () => {
      try { await listLogs(); }
      catch (err) { setStatus($("#logsStatus"), `Load failed. ${err.message || ""}`.trim(), "err"); }
    });

    // Welcome email
    $("#sendWelcomeBtn")?.addEventListener("click", sendWelcomeEmail);

    // Policy popup
    $("#openPolicyBtn")?.addEventListener("click", () => openPolicyModal());

    // Form submit + clear
    const form = $("#deploymentForm");
    if (form) {
      $("#clearBtn")?.addEventListener("click", () => {
        form.reset();
        $("#acceptPolicyValue").value = "No";
        setStatus($("#status"), "", "");
      });

      $("#acceptPolicy")?.addEventListener("change", () => {
        $("#acceptPolicyValue").value = $("#acceptPolicy").checked ? "Yes" : "No";
      });

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        submitDeploymentForm(form);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", bind);
})();
