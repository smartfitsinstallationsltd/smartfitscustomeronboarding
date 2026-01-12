/* SmartFits Customer Onboarding - Frontend Logic
   - Fixes: click handlers not binding, left alignment issues, admin modal routing
   - Keeps: original design style
*/

(() => {
  "use strict";

  // ====== CONFIG ======
  const GAS_URL = "https://script.google.com/macros/s/AKfycbxJ48d-Ykqvmvdwbhv4eJG_aJDySvl_rVtbjSNu-TrsrNylmdPm2NqYO5a97BY4tR-Ycg/exec";

  // If your GAS expects different action names, change these to match.
  const ACTIONS = {
    LOGIN: "adminLogin",
    LOGOUT: "adminLogout",
    SEARCH_FILES: "searchFiles",
    DELETE_FILE: "deleteFile",
    VIEW_FILE: "viewFile",
    LOAD_LOGS: "loadLogs",
    SUBMIT_FORM: "submitForm"
  };

  // ====== TEAM DIRECTORY ======
  const SUPPORT = { phone: "01283 533330", email: "support@smartfits.co.uk" };

  const PEOPLE = {
    tara: {
      name: "Tara Hassall",
      role: "Managing Director",
      email: "tara@smartfits.co.uk",
      phone: "07894 880559",
      img: "./images/tara_hassall.png"
    },
    charlie: {
      name: "Charlie Inger",
      role: "Sales & Business Development Manager",
      email: "charlie@smartfits.co.uk",
      phone: "07385 099620",
      img: "./images/charlie_inger.png"
    },
    emma: {
      name: "Emma Sumner",
      role: "Customer Success Team Leader",
      email: "emma@smartfits.co.uk",
      img: "./images/emma_sumner.png"
    },
    kelly: {
      name: "Kelly Mullen",
      role: "Customer Success Team Member",
      email: "kelly@smartfits.co.uk",
      img: "./images/kelly_mullen.png"
    },
    aleks: {
      name: "Aleks Fossick",
      role: "Customer Success Team Member",
      email: "aleks@smartfits.co.uk",
      img: "./images/aleks_fossick.png"
    },
    roz: {
      name: "Roz Hardwick",
      role: "Operations Lead",
      email: "roz@smartfits.co.uk",
      img: "./images/roz_hardwick.png"
    },
    ellie: {
      name: "Ellie Topliss",
      role: "Project Coordinator",
      email: "ellie@smartfits.co.uk",
      img: "./images/ellie_topliss.png"
    },
    sophie: {
      name: "Sophie Turner",
      role: "Project Coordinator",
      email: "sophie@smartfits.co.uk",
      img: "./images/sophie_turner.png"
    },
    amanda: {
      name: "Amanda Clarke",
      role: "Field Operations Team Member",
      email: "amanda@smartfits.co.uk",
      img: "./images/amanda_clarke.png"
    },
    rosie: {
      name: "Rosie Smart",
      role: "Field Operations Team Member",
      email: "rosie@smartfits.co.uk",
      img: "./images/rosie_smart.png"
    },
    bridie: {
      name: "Bridie Southam",
      role: "Field Operations Team Member",
      email: "bridie@smartfits.co.uk",
      img: "./images/bridie_southam.png"
    },
    kasia: {
      name: "Kasia Dzielak",
      role: "Field Operations Team Member",
      email: "kasia@smartfits.co.uk",
      img: "./images/kasia_dzielak.png"
    }
  };

  // ====== HELPERS ======
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function show(el) { el.classList.add("show"); }
  function hide(el) { el.classList.remove("show"); }

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

  function formatGmt(ts) {
    try {
      const d = new Date(ts);
      return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/London"
      }).format(d) + " GMT";
    } catch {
      return String(ts ?? "");
    }
  }

  // ====== API ======
  async function apiCall(params) {
    // POST as form-encoded is the most GAS-friendly
    const body = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => body.append(k, v ?? ""));

    const res = await fetch(GAS_URL, {
      method: "POST",
      body
    });

    const text = await res.text();
    // GAS sometimes returns text/plain JSON
    let data;
    try { data = JSON.parse(text); }
    catch { data = { ok: false, error: "Invalid response from server", raw: text }; }

    if (!data || data.ok === false) {
      const msg = data?.error || data?.message || "Request failed.";
      throw new Error(msg);
    }
    return data;
  }

  // ====== MODALS ======
  function openAdminModal() {
    const adminModal = $("#adminModal");
    if (!adminModal) return;

    // Always start at login view on open, unless already logged in
    if (!state.admin.authed) {
      $("#adminLoginView").style.display = "";
      $("#adminDashView").style.display = "none";
      setStatus($("#adminStatus"), "", "");
    }
    show(adminModal);
  }

  function closeAdminModal() {
    const adminModal = $("#adminModal");
    if (!adminModal) return;
    hide(adminModal);
  }

  function openPersonModal(personKey) {
    const p = PEOPLE[personKey];
    if (!p) return;

    const personModal = $("#personModal");
    const body = $("#personBody");
    const title = $("#personTitle");
    if (!personModal || !body || !title) return;

    title.textContent = "Team Member";

    // Modern, clean, matches site — no blue links
    body.innerHTML = `
      <div class="personModalGrid">
        <img class="personModalPhoto" src="${escapeHtml(p.img)}" alt="${escapeHtml(p.name)}"/>
        <div>
          <h3 class="personModalName">${escapeHtml(p.name)}</h3>
          <p class="personModalRole">${escapeHtml(p.role)}</p>

          <div class="personContactBox">
            <div class="muted" style="font-weight:700; letter-spacing:.2px;">Contact details</div>

            <div class="personContactRow">
              <div class="personKey">Email:</div>
              <div class="personVal">${escapeHtml(p.email)}</div>
            </div>

            ${p.phone ? `
              <div class="personContactRow">
                <div class="personKey">Phone:</div>
                <div class="personVal">${escapeHtml(p.phone)}</div>
              </div>` : ``}
          </div>

          <div class="personContactBox" style="margin-top:12px;">
            <div class="muted" style="font-weight:700; letter-spacing:.2px;">Want general support?</div>

            <div class="personContactRow">
              <div class="personKey">Support Phone:</div>
              <div class="personVal">${escapeHtml(SUPPORT.phone)}</div>
            </div>

            <div class="personContactRow">
              <div class="personKey">Support Email:</div>
              <div class="personVal">${escapeHtml(SUPPORT.email)}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    show(personModal);
  }

  function closePersonModal() {
    const personModal = $("#personModal");
    if (!personModal) return;
    hide(personModal);
  }

  function openDetailModal(titleText, html) {
    const modal = $("#detailModal");
    if (!modal) return;
    $("#detailTitle").textContent = titleText || "Details";
    $("#detailBody").innerHTML = html || "";
    show(modal);
  }

  function closeDetailModal() {
    const modal = $("#detailModal");
    if (!modal) return;
    hide(modal);
  }

  // ====== STATE ======
  const state = {
    admin: {
      authed: false,
      email: "",
      token: "", // if your GAS uses tokens
      canViewLogs: false
    }
  };

  // ====== ADMIN: LOGIN / LOGOUT ======
  async function adminLogin(email, password) {
    setStatus($("#adminStatus"), "Signing in...", "");
    const data = await apiCall({
      action: ACTIONS.LOGIN,
      email,
      password
    });

    // Expecting something like:
    // { ok:true, adminEmail:"...", token:"...", permissions:{ viewLogs:true } }
    state.admin.authed = true;
    state.admin.email = data.adminEmail || email;
    state.admin.token = data.token || "";
    state.admin.canViewLogs = !!(data.permissions?.viewLogs);

    $("#adminSignedInAs").textContent = `Signed in as ${state.admin.email}`;

    // hide login, show dashboard
    $("#adminLoginView").style.display = "none";
    $("#adminDashView").style.display = "";
    setStatus($("#adminStatus"), "", "");

    // show/hide logs card
    const logsCard = $("#logsCard");
    if (logsCard) logsCard.style.display = state.admin.canViewLogs ? "" : "none";
  }

  async function adminLogout() {
    try {
      // optional server logout
      await apiCall({
        action: ACTIONS.LOGOUT,
        token: state.admin.token,
        email: state.admin.email
      });
    } catch {
      // even if server fails, clear client state
    }

    state.admin.authed = false;
    state.admin.email = "";
    state.admin.token = "";
    state.admin.canViewLogs = false;

    $("#adminLoginView").style.display = "";
    $("#adminDashView").style.display = "none";
    setStatus($("#filesStatus"), "", "");
    setStatus($("#logsStatus"), "", "");

    // reset tables
    $("#filesTbody").innerHTML = `<tr><td colspan="3" class="muted">No results yet.</td></tr>`;
    $("#logsTbody").innerHTML = `<tr><td colspan="4" class="muted">No logs loaded.</td></tr>`;
  }

  // ====== ADMIN: FILE SEARCH ======
  function renderFiles(files) {
    const tbody = $("#filesTbody");
    if (!tbody) return;

    if (!files || !files.length) {
      tbody.innerHTML = `<tr><td colspan="3" class="muted">No matching files found.</td></tr>`;
      return;
    }

    tbody.innerHTML = files.map(f => {
      const name = escapeHtml(f.fileName || f.name || "");
      const created = escapeHtml(formatGmt(f.created || f.createdAt || f.time || ""));
      const fileId = escapeHtml(f.fileId || f.id || "");
      const viewUrl = escapeHtml(f.viewUrl || f.url || "");

      return `
        <tr>
          <td>${name}</td>
          <td>${created}</td>
          <td>
            ${viewUrl ? `<button class="adminLink" data-act="viewFile" data-url="${viewUrl}" data-id="${fileId}">View</button>` : ``}
            <button class="adminDanger" data-act="deleteFile" data-id="${fileId}" data-name="${name}">Delete</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  async function searchFiles() {
    if (!state.admin.authed) return;

    setStatus($("#filesStatus"), "Searching...", "");

    const q = $("#fileNameQuery")?.value?.trim() || "";
    const from = $("#dateFrom")?.value || "";
    const to = $("#dateTo")?.value || "";

    const data = await apiCall({
      action: ACTIONS.SEARCH_FILES,
      token: state.admin.token,
      email: state.admin.email,
      query: q,
      dateFrom: from,
      dateTo: to
    });

    // Expecting: { ok:true, files:[...] }
    renderFiles(data.files || []);
    setStatus($("#filesStatus"), `Found ${(data.files || []).length} file(s).`, "ok");
  }

  async function deleteFile(fileId, fileName) {
    if (!state.admin.authed) return;

    const sure = confirm(`Delete this file?\n\n${fileName || fileId}`);
    if (!sure) return;

    setStatus($("#filesStatus"), "Deleting...", "");

    await apiCall({
      action: ACTIONS.DELETE_FILE,
      token: state.admin.token,
      email: state.admin.email,
      fileId
    });

    setStatus($("#filesStatus"), "Deleted.", "ok");
    await searchFiles();
  }

  // ====== ADMIN: LOGS ======
  function actionLabel(action) {
    switch (action) {
      case "LOGIN": return "Logged in";
      case "LOGOUT": return "Logged out";
      case "DELETE_FILE": return "Deleted file";
      case "VIEW_FILE": return "Viewed file";
      case "SEARCH_FILES": return "Searched files";
      default: return action || "Action";
    }
  }

  function renderLogs(logs) {
    const tbody = $("#logsTbody");
    if (!tbody) return;

    if (!logs || !logs.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="muted">No logs found for that filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map((l, idx) => {
      const ts = formatGmt(l.timestamp || l.time || l.created || "");
      const admin = escapeHtml(l.adminEmail || l.admin || "");
      const action = escapeHtml(l.action || l.type || "");
      const detailsObj = l.details || l.meta || {};
      const summary =
        l.summary ||
        (action === "DELETE_FILE" ? `Deleted: ${detailsObj.fileName || ""}` :
        action === "VIEW_FILE" ? `Viewed: ${detailsObj.fileName || ""}` :
        action === "SEARCH_FILES" ? `Query: ${detailsObj.query || ""}` :
        "");

      const safeSummary = escapeHtml(summary || "Click to view details");

      // click row -> details modal
      return `
        <tr data-act="openLogDetail" data-idx="${idx}">
          <td>${escapeHtml(ts)}</td>
          <td>${admin}</td>
          <td>${escapeHtml(actionLabel(action))}</td>
          <td>${safeSummary}</td>
        </tr>
      `;
    }).join("");

    // stash last logs for detail modal
    state.admin.lastLogs = logs;
  }

  async function loadLogs() {
    if (!state.admin.authed || !state.admin.canViewLogs) return;

    setStatus($("#logsStatus"), "Loading logs...", "");

    const from = $("#logFrom")?.value || "";
    const to = $("#logTo")?.value || "";
    const emailContains = $("#logEmailContains")?.value?.trim() || "";
    const actionType = $("#logActionType")?.value || "ALL";

    const data = await apiCall({
      action: ACTIONS.LOAD_LOGS,
      token: state.admin.token,
      email: state.admin.email,
      dateFrom: from,
      dateTo: to,
      emailContains,
      actionType
    });

    renderLogs(data.logs || []);
    setStatus($("#logsStatus"), `Loaded ${(data.logs || []).length} log(s).`, "ok");
  }

  function openLogDetail(idx) {
    const logs = state.admin.lastLogs || [];
    const l = logs[idx];
    if (!l) return;

    const ts = formatGmt(l.timestamp || l.time || l.created || "");
    const admin = escapeHtml(l.adminEmail || l.admin || "");
    const action = escapeHtml(l.action || l.type || "");
    const details = l.details || l.meta || {};

    const html = `
      <div class="personContactBox">
        <div class="personContactRow"><div class="personKey">User:</div><div class="personVal">${admin}</div></div>
        <div class="personContactRow"><div class="personKey">Action:</div><div class="personVal">${escapeHtml(actionLabel(action))}</div></div>
        <div class="personContactRow"><div class="personKey">Timestamp:</div><div class="personVal">${escapeHtml(ts)}</div></div>
      </div>

      <div class="personContactBox" style="margin-top:12px;">
        <div class="muted" style="font-weight:700;">More details</div>
        <pre style="margin:10px 0 0; white-space:pre-wrap; color:rgba(232,238,252,.92); font-size:12px;">
${escapeHtml(JSON.stringify(details, null, 2))}
        </pre>
      </div>
    `;

    openDetailModal("Log Details", html);
  }

  // ====== FORM SUBMIT ======
  async function submitDeploymentForm(formEl) {
    const statusEl = $("#status");
    setStatus(statusEl, "Submitting...", "");

    const fd = new FormData(formEl);
    const accept = $("#acceptPolicy");
    $("#acceptPolicyValue").value = accept && accept.checked ? "Yes" : "No";

    const payload = {};
    fd.forEach((v, k) => payload[k] = String(v ?? ""));

    try {
      // If your form submission is already wired to a different backend,
      // you can replace this with your existing call.
      await apiCall({
        action: ACTIONS.SUBMIT_FORM,
        ...payload
      });

      // ✅ requested message (no file name revealed)
      setStatus(statusEl, "Submitted successfully. Thank you for the business.", "ok");
      formEl.reset();
      $("#acceptPolicyValue").value = "No";
    } catch (e) {
      setStatus(statusEl, `Submit failed. ${e.message || ""}`.trim(), "err");
    }
  }

  // ====== INIT / BIND ======
  function bind() {
    // Admin modal open/close
    $("#openAdminBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      openAdminModal();
    });
    $("#closeAdminBtn")?.addEventListener("click", closeAdminModal);

    // Person modal close
    $("#closePersonBtn")?.addEventListener("click", closePersonModal);

    // Detail modal close
    $("#closeDetailBtn")?.addEventListener("click", closeDetailModal);

    // Click outside modal to close
    $$(".modalBackdrop").forEach(backdrop => {
      backdrop.addEventListener("click", (ev) => {
        if (ev.target === backdrop) hide(backdrop);
      });
    });

    // Team cards: event delegation (fixes “nothing happens” even if DOM changes)
    document.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".personBtn");
      if (btn) {
        ev.preventDefault();
        const key = btn.getAttribute("data-person");
        openPersonModal(key);
        return;
      }

      const actBtn = ev.target.closest("[data-act]");
      if (!actBtn) return;

      const act = actBtn.getAttribute("data-act");

      if (act === "viewFile") {
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

    // Admin login form
    $("#adminLoginForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("#adminEmail")?.value?.trim() || "";
      const pass = $("#adminPassword")?.value || "";

      try {
        await adminLogin(email, pass);
      } catch (err) {
        setStatus($("#adminStatus"), `Login failed. ${err.message || "Please check your details."}`, "err");
      }
    });

    $("#adminClearBtn")?.addEventListener("click", () => {
      $("#adminEmail").value = "";
      $("#adminPassword").value = "";
      setStatus($("#adminStatus"), "", "");
    });

    $("#adminLogoutBtn")?.addEventListener("click", async () => {
      await adminLogout();
    });

    // Toggle date filter
    $("#toggleDateFilterBtn")?.addEventListener("click", () => {
      const wrap = $("#dateFilterWrap");
      if (!wrap) return;
      const isOpen = wrap.style.display !== "none";
      wrap.style.display = isOpen ? "none" : "";
      $("#toggleDateFilterBtn").textContent = isOpen ? "Search by date too?" : "Hide date filter";
    });

    $("#searchFilesBtn")?.addEventListener("click", async () => {
      try { await searchFiles(); }
      catch (err) { setStatus($("#filesStatus"), `Search failed. ${err.message || ""}`.trim(), "err"); }
    });

    $("#loadLogsBtn")?.addEventListener("click", async () => {
      try { await loadLogs(); }
      catch (err) { setStatus($("#logsStatus"), `Load failed. ${err.message || ""}`.trim(), "err"); }
    });

    // Policy button scroll
    $("#openPolicyBtn")?.addEventListener("click", () => {
      const el = $("#policyBottom");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // Form submit
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
