(() => {
  "use strict";

  const GAS_URL =
    "https://script.google.com/macros/s/AKfycbxJ48d-Ykqvmvdwbhv4eJG_aJDySvl_rVtbjSNu-TrsrNylmdPm2NqYO5a97BY4tR-Ycg/exec";

  const ACTIONS = {
    SUBMIT_FORM: "submitForm",
    LOGIN: "adminLogin",
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

  const $ = (sel, root = document) => root.querySelector(sel);

  const state = {
    admin: { authed: false, token: "", admin: null, lastLogs: [] }
  };

  function show(el){
    if(!el) return;
    el.classList.add("show");
    el.setAttribute("aria-hidden","false");
    document.body.classList.add("modalOpen"); // ✅ lock background scroll
  }

  function hide(el){
    if(!el) return;
    el.classList.remove("show");
    el.setAttribute("aria-hidden","true");

    // ✅ if no other modals are open, re-enable scroll
    const anyOpen = !!document.querySelector(".modalBackdrop.show");
    if(!anyOpen) document.body.classList.remove("modalOpen");
  }

  function setStatus(el, msg, type){
    if(!el) return;
    el.textContent = msg || "";
    el.classList.remove("ok","err");
    if(type === "ok") el.classList.add("ok");
    if(type === "err") el.classList.add("err");
  }

  function escapeHtml(str){
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function apiCall(payloadObj){
    const body = JSON.stringify(payloadObj || {});
    const res = await fetch(GAS_URL, {
      method:"POST",
      headers:{ "Content-Type":"text/plain;charset=utf-8" },
      body
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch { throw new Error("Server did not return valid JSON."); }

    if(!data || data.ok !== true) throw new Error(data?.error || "Request failed.");
    return data;
  }

  // ---------- Modals ----------
  function openAdminModal(){
    const modal = $("#adminModal");
    if(!modal) return;

    if(!state.admin.authed){
      $("#adminLoginView").style.display = "";
      $("#adminDashView").style.display = "none";
      setStatus($("#adminStatus"), "", "");
    }else{
      $("#adminLoginView").style.display = "none";
      $("#adminDashView").style.display = "";
      $("#adminSignedInAs").textContent = `Signed in as ${state.admin.admin?.email || ""}`;
      const logsCard = $("#logsCard");
      if(logsCard) logsCard.style.display = state.admin.admin?.canViewLogs ? "" : "none";
    }

    show(modal);
  }

  function closeAdminModal(){ hide($("#adminModal")); }
  function closePersonModal(){ hide($("#personModal")); }
  function closeDetailModal(){
    // reset modal size back to normal after policy
    const panel = $("#detailModalPanel");
    if(panel){
      panel.classList.remove("modalWide");
      panel.classList.add("modalMedium");
    }
    hide($("#detailModal"));
  }

  function openDetailModal(titleText, html, opts = {}){
    $("#detailTitle").textContent = titleText || "Details";
    $("#detailBody").innerHTML = html || "";

    // ✅ make policy popup wider
    const panel = $("#detailModalPanel");
    if(panel){
      panel.classList.remove("modalWide","modalMedium");
      panel.classList.add(opts.wide ? "modalWide" : "modalMedium");
    }

    show($("#detailModal"));
  }

  function openPolicyModal(){
    const tpl = $("#policyTemplate");
    openDetailModal("Cancellation Policy", tpl ? tpl.innerHTML : "<div class='doc'>Policy not found.</div>", { wide:true });
  }

  function openPersonModal(key){
    const p = PEOPLE[key];
    if(!p) return;

    const body = $("#personBody");
    $("#personTitle").textContent = "Team Member";

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
              </div>
            ` : ``}
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

    show($("#personModal"));
  }

  // ---------- Admin ----------
  async function adminLogin(email, password){
    setStatus($("#adminStatus"), "Signing in...", "");

    const data = await apiCall({ action: ACTIONS.LOGIN, email, password });

    state.admin.authed = true;
    state.admin.token = data.token || "";
    state.admin.admin = data.admin || null;

    $("#adminLoginView").style.display = "none";
    $("#adminDashView").style.display = "";
    $("#adminSignedInAs").textContent = `Signed in as ${state.admin.admin?.email || email}`;

    const logsCard = $("#logsCard");
    if(logsCard) logsCard.style.display = state.admin.admin?.canViewLogs ? "" : "none";
    setStatus($("#adminStatus"), "", "");
  }

  async function adminLogout(){
    try{
      if(state.admin.authed && state.admin.token){
        await apiCall({
          action: ACTIONS.LOG_ACTION,
          token: state.admin.token,
          actionType: "LOGOUT",
          details: { message: "Admin logged out" }
        });
      }
    }catch{}

    state.admin.authed = false;
    state.admin.token = "";
    state.admin.admin = null;
    state.admin.lastLogs = [];

    $("#adminLoginView").style.display = "";
    $("#adminDashView").style.display = "none";

    closeAdminModal();
    window.scrollTo({ top:0, behavior:"smooth" });
  }

  function renderFiles(files){
    const tbody = $("#filesTbody");
    if(!tbody) return;

    if(!files || !files.length){
      tbody.innerHTML = `<tr><td colspan="3" class="muted">No matching files found.</td></tr>`;
      return;
    }

    tbody.innerHTML = files.map(f => `
      <tr>
        <td>${escapeHtml(f.name || "")}</td>
        <td>${escapeHtml(f.created || "")}</td>
        <td>
          ${f.url ? `<button class="adminLink" data-act="openUrl" data-url="${escapeHtml(f.url)}">View</button>` : ""}
          <button class="adminDanger" data-act="deleteFile" data-id="${escapeHtml(f.id)}" data-name="${escapeHtml(f.name)}">Delete</button>
        </td>
      </tr>
    `).join("");
  }

  async function listFiles(){
    setStatus($("#filesStatus"), "Searching...", "");

    const query = $("#fileNameQuery")?.value?.trim() || "";
    const fromDate = $("#dateFrom")?.value || "";
    const toDate = $("#dateTo")?.value || "";

    const data = await apiCall({
      action: ACTIONS.LIST_FILES,
      token: state.admin.token,
      query, fromDate, toDate
    });

    renderFiles(data.files || []);
    setStatus($("#filesStatus"), `Found ${(data.files || []).length} file(s).`, "ok");
  }

  async function deleteFile(fileId, fileName){
    if(!confirm(`Delete this file?\n\n${fileName || fileId}`)) return;
    setStatus($("#filesStatus"), "Deleting...", "");
    await apiCall({ action: ACTIONS.DELETE_FILE, token: state.admin.token, fileId });
    setStatus($("#filesStatus"), "File deleted.", "ok");
    await listFiles();
  }

  async function sendWelcomeEmail(){
    const to = $("#welcomeTo")?.value?.trim() || "";
    const customerName = $("#welcomeCustomer")?.value?.trim() || "";
    const companyName = $("#welcomeCompany")?.value?.trim() || "";

    if(!to || !customerName || !companyName){
      setStatus($("#welcomeStatus"), "Please enter recipient email, customer name, and company name.", "err");
      return;
    }

    setStatus($("#welcomeStatus"), "Sending...", "");
    const data = await apiCall({
      action: ACTIONS.SEND_WELCOME,
      token: state.admin.token,
      to, customerName, companyName
    });

    setStatus($("#welcomeStatus"), data.message || "Welcome email sent.", "ok");
    $("#welcomeTo").value = "";
    $("#welcomeCustomer").value = "";
    $("#welcomeCompany").value = "";
  }

  // ---------- Form ----------
  async function submitDeploymentForm(formEl){
    setStatus($("#status"), "Submitting...", "");

    $("#acceptPolicyValue").value = $("#acceptPolicy")?.checked ? "Yes" : "No";

    const fd = new FormData(formEl);
    const payload = { action: ACTIONS.SUBMIT_FORM };
    fd.forEach((v,k)=> payload[k] = String(v ?? ""));

    await apiCall(payload);
    setStatus($("#status"), "Submitted successfully. Thank you for the business.", "ok");
    formEl.reset();
    $("#acceptPolicyValue").value = "No";
  }

  // ---------- Bind ----------
  function bind(){
    $("#openAdminBtn")?.addEventListener("click", (e)=>{ e.preventDefault(); openAdminModal(); });
    $("#closeAdminBtn")?.addEventListener("click", closeAdminModal);
    $("#adminLogoutBtn")?.addEventListener("click", adminLogout);

    $("#closePersonBtn")?.addEventListener("click", closePersonModal);
    $("#closeDetailBtn")?.addEventListener("click", closeDetailModal);

    // Click outside closes modal
    document.querySelectorAll(".modalBackdrop").forEach(backdrop => {
      backdrop.addEventListener("click", (ev) => { if(ev.target === backdrop) hide(backdrop); });
    });

    // ✅ Policy popup buttons (both places)
    $("#openPolicyBtn")?.addEventListener("click", (e)=>{ e.preventDefault(); openPolicyModal(); });
    $("#openPolicyBtn2")?.addEventListener("click", (e)=>{ e.preventDefault(); openPolicyModal(); });

    // Admin login
    $("#adminLoginForm")?.addEventListener("submit", async (e)=>{
      e.preventDefault();
      const email = ($("#adminEmail")?.value || "").trim().toLowerCase();
      const pass = $("#adminPassword")?.value || "";
      try{
        await adminLogin(email, pass);
      }catch(err){
        setStatus($("#adminStatus"), `Login failed. ${err.message || ""}`.trim(), "err");
      }
    });

    $("#adminClearBtn")?.addEventListener("click", ()=>{
      $("#adminEmail").value = "";
      $("#adminPassword").value = "";
      setStatus($("#adminStatus"), "", "");
    });

    $("#toggleDateFilterBtn")?.addEventListener("click", ()=>{
      const wrap = $("#dateFilterWrap");
      const open = wrap.style.display !== "none";
      wrap.style.display = open ? "none" : "";
      $("#toggleDateFilterBtn").textContent = open ? "Search by date too?" : "Hide date filter";
    });

    $("#searchFilesBtn")?.addEventListener("click", async ()=>{
      try{ await listFiles(); }catch(err){ setStatus($("#filesStatus"), `Search failed. ${err.message || ""}`.trim(), "err"); }
    });

    $("#sendWelcomeBtn")?.addEventListener("click", async ()=>{
      try{ await sendWelcomeEmail(); }catch(err){ setStatus($("#welcomeStatus"), `Send failed. ${err.message || ""}`.trim(), "err"); }
    });

    // Form
    const form = $("#deploymentForm");
    if(form){
      $("#clearBtn")?.addEventListener("click", ()=>{
        form.reset();
        $("#acceptPolicyValue").value = "No";
        setStatus($("#status"), "", "");
      });

      $("#acceptPolicy")?.addEventListener("change", ()=>{
        $("#acceptPolicyValue").value = $("#acceptPolicy").checked ? "Yes" : "No";
      });

      form.addEventListener("submit", async (e)=>{
        e.preventDefault();
        try{ await submitDeploymentForm(form); }
        catch(err){ setStatus($("#status"), `Submit failed. ${err.message || ""}`.trim(), "err"); }
      });
    }

    // Delegated clicks
    document.addEventListener("click", (ev)=>{
      const personBtn = ev.target.closest(".personBtn");
      if(personBtn){
        ev.preventDefault();
        openPersonModal(personBtn.getAttribute("data-person"));
        return;
      }

      const actBtn = ev.target.closest("[data-act]");
      if(!actBtn) return;

      const act = actBtn.getAttribute("data-act");
      if(act === "openUrl"){
        const url = actBtn.getAttribute("data-url");
        if(url) window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
      if(act === "deleteFile"){
        deleteFile(actBtn.getAttribute("data-id"), actBtn.getAttribute("data-name"));
        return;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", bind);
})();
