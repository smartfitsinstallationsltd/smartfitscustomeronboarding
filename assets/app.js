/***********************
 * CONFIG
 ***********************/
const API_BASE = "/api"; // your Cloudflare Pages Functions base (you already have this working)

/***********************
 * Helpers
 ***********************/
function $(id){ return document.getElementById(id); }

function setStatus(el, msg, type){
  if(!el) return;
  el.textContent = msg || "";
  el.classList.remove("ok","err");
  if(type) el.classList.add(type);
}

function openModal(backdrop){
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden","false");
}
function closeModal(backdrop){
  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden","true");
}

/***********************
 * Employee directory (click cards)
 ***********************/
const PEOPLE = {
  tara:   { name:"Tara Hassall",   role:"Managing Director", email:"tara@smartfits.co.uk",   phone:"07894 880559" },
  charlie:{ name:"Charlie Inger", role:"Sales & Business Development Manager", email:"charlie@smartfits.co.uk", phone:"07385 099620" },
  emma:   { name:"Emma Sumner",   role:"Customer Success Team Leader", email:"emma@smartfits.co.uk" },
  kelly:  { name:"Kelly Mullen",  role:"Customer Success Team Member", email:"kelly@smartfits.co.uk" },
  aleks:  { name:"Aleks Fossick", role:"Customer Success Team Member", email:"aleks@smartfits.co.uk" },
  roz:    { name:"Roz Hardwick",  role:"Operations Lead", email:"roz@smartfits.co.uk" },
  ellie:  { name:"Ellie Topliss", role:"Project Coordinator", email:"ellie@smartfits.co.uk" },
  sophie: { name:"Sophie Turner", role:"Project Coordinator", email:"sophie@smartfits.co.uk" },
  amanda: { name:"Amanda Clarke", role:"Field Operations Team Member", email:"amanda@smartfits.co.uk" },
  rosie:  { name:"Rosie Smart",   role:"Field Operations Team Member", email:"rosie@smartfits.co.uk" },
  bridie: { name:"Bridie Southam",role:"Field Operations Team Member", email:"bridie@smartfits.co.uk" },
  kasia:  { name:"Kasia Dzielak", role:"Field Operations Team Member", email:"kasia@smartfits.co.uk" },
};

function renderPerson(person){
  const title = $("personTitle");
  const body = $("personBody");
  title.textContent = person.name;

  const mail = `<a href="mailto:${person.email}" class="plainLink">${person.email}</a>`;
  const tel = person.phone ? `<a href="tel:${person.phone.replace(/\s+/g,"")}" class="plainLink">${person.phone}</a>` : `<span class="muted">Not listed</span>`;

  body.innerHTML = `
    <div class="doc" style="margin:0;">
      <div style="display:flex;gap:12px;align-items:flex-start;">
        <div style="flex:1;">
          <div style="font-weight:800;font-size:16px;margin-bottom:2px;">${person.name}</div>
          <div style="color:rgba(148,163,184,.95);font-size:13px;margin-bottom:12px;">${person.role || ""}</div>
          <div style="display:grid;grid-template-columns:110px 1fr;gap:8px;font-size:13px;">
            <div class="muted">Email</div><div>${mail}</div>
            <div class="muted">Phone</div><div>${tel}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/***********************
 * Admin Modal logic
 ***********************/
const adminModal = $("adminModal");
const openAdminBtn = $("openAdminBtn");
const closeAdminBtn = $("closeAdminBtn");

const adminLoginOnly = $("adminLoginOnly");
const adminAuthedOnly = $("adminAuthedOnly");

const adminEmail = $("adminEmail");
const adminPassword = $("adminPassword");
const adminSignInBtn = $("adminSignInBtn");
const adminClearBtn = $("adminClearBtn");
const adminStatus = $("adminStatus");

const adminWho = $("adminWho");
const adminSignOutBtn = $("adminSignOutBtn");

const logsSection = $("logsSection");
const logsStatus = $("logsStatus");

let SESSION = {
  token: null,
  admin: null
};

function setAuthedUI(isAuthed){
  if(isAuthed){
    adminLoginOnly.classList.add("hidden");
    adminAuthedOnly.classList.remove("hidden");
  } else {
    adminAuthedOnly.classList.add("hidden");
    adminLoginOnly.classList.remove("hidden");
  }
}

function setLogsVisibility(){
  const can = !!SESSION?.admin?.canViewLogs;
  if(can) logsSection.classList.remove("hidden");
  else logsSection.classList.add("hidden");
}

openAdminBtn?.addEventListener("click", () => {
  openModal(adminModal);
  // always start with login-only UI until we know session
  setAuthedUI(!!SESSION.token);
  setLogsVisibility();
  setStatus(adminStatus, "");
});

closeAdminBtn?.addEventListener("click", () => closeModal(adminModal));
adminModal?.addEventListener("click", (e) => { if(e.target === adminModal) closeModal(adminModal); });

adminClearBtn?.addEventListener("click", () => {
  adminEmail.value = "";
  adminPassword.value = "";
  setStatus(adminStatus, "");
});

adminSignOutBtn?.addEventListener("click", () => {
  SESSION = { token:null, admin:null };
  localStorage.removeItem("sf_admin_token");
  localStorage.removeItem("sf_admin_admin");
  setAuthedUI(false);
  setLogsVisibility();
  setStatus(adminStatus, "Signed out.", "ok");
});

async function apiPost(path, payload){
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(payload || {})
  });
  const out = await res.json().catch(() => ({}));
  if(!res.ok || out.ok === false){
    const msg = out.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return out;
}

async function doAdminLogin(){
  setStatus(adminStatus, "Signing in…");
  adminSignInBtn.disabled = true;

  try{
    const email = String(adminEmail.value || "").trim();
    const password = String(adminPassword.value || "");

    if(!email || !password){
      throw new Error("Please enter your email and password.");
    }

    const out = await apiPost("/admin-login", { email, password });

    SESSION.token = out.token;
    SESSION.admin = out.admin;

    localStorage.setItem("sf_admin_token", SESSION.token);
    localStorage.setItem("sf_admin_admin", JSON.stringify(SESSION.admin));

    adminWho.textContent = `${SESSION.admin.name} (${SESSION.admin.email})`;
    setAuthedUI(true);
    setLogsVisibility();

    setStatus(adminStatus, "Signed in successfully.", "ok");

    // Load initial files list after login (optional)
    await loadFiles();

  }catch(err){
    setStatus(adminStatus, "Login failed: " + (err.message || err), "err");
  }finally{
    adminSignInBtn.disabled = false;
  }
}

adminSignInBtn?.addEventListener("click", doAdminLogin);
adminPassword?.addEventListener("keydown", (e) => {
  if(e.key === "Enter") doAdminLogin();
});

/***********************
 * Persist session
 ***********************/
(function restoreSession(){
  const t = localStorage.getItem("sf_admin_token");
  const a = localStorage.getItem("sf_admin_admin");
  if(t && a){
    try{
      SESSION.token = t;
      SESSION.admin = JSON.parse(a);
      adminWho.textContent = `${SESSION.admin.name} (${SESSION.admin.email})`;
    }catch{}
  }
  setAuthedUI(!!SESSION.token);
  setLogsVisibility();
})();

/***********************
 * Files: list/search/delete
 ***********************/
const fileQuery = $("fileQuery");
const fromDate = $("fromDate");
const toDate = $("toDate");
const fileSearchBtn = $("fileSearchBtn");
const filesBody = $("filesBody");

async function loadFiles(){
  if(!SESSION.token){
    // keep the table message clean until signed in
    filesBody.innerHTML = `
      <div class="trow">
        <div class="muted">Sign in to view files.</div><div></div><div></div>
      </div>
    `;
    return;
  }

  fileSearchBtn.disabled = true;

  try{
    const out = await apiPost("/files", {
      token: SESSION.token,
      query: String(fileQuery.value || "").trim(),
      fromDate: fromDate.value || "",
      toDate: toDate.value || ""
    });

    const files = out.files || [];
    if(!files.length){
      filesBody.innerHTML = `
        <div class="trow">
          <div class="muted">No files found.</div><div></div><div></div>
        </div>
      `;
      return;
    }

    filesBody.innerHTML = files.map(f => `
      <div class="trow">
        <div style="word-break:break-word;">${escapeHtml(f.name)}</div>
        <div>${escapeHtml(f.created)}</div>
        <div class="actionsInline">
          <button type="button" data-view="${escapeAttr(f.url)}">View</button>
          <button type="button" class="danger" data-del="${escapeAttr(f.id)}" data-name="${escapeAttr(f.name)}">Delete</button>
        </div>
      </div>
    `).join("");

  }catch(err){
    filesBody.innerHTML = `
      <div class="trow">
        <div class="muted">Error: ${escapeHtml(err.message || String(err))}</div><div></div><div></div>
      </div>
    `;
  }finally{
    fileSearchBtn.disabled = false;
  }
}

fileSearchBtn?.addEventListener("click", loadFiles);

filesBody?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if(!btn) return;

  if(btn.dataset.view){
    window.open(btn.dataset.view, "_blank", "noopener");
    return;
  }

  if(btn.dataset.del){
    const fileId = btn.dataset.del;
    const name = btn.dataset.name || "this file";
    const ok = confirm(`Are you sure you want to delete "${name}"?\n\nThis cannot be undone.`);
    if(!ok) return;

    try{
      await apiPost("/delete-file", { token: SESSION.token, fileId });
      await loadFiles();
    }catch(err){
      alert("Delete failed: " + (err.message || err));
    }
  }
});

/***********************
 * Logs (only if canViewLogs)
 ***********************/
const logFrom = $("logFrom");
const logTo = $("logTo");
const logAdmin = $("logAdmin");
const logType = $("logType");
const loadLogsBtn = $("loadLogsBtn");
const logsBody = $("logsBody");

async function loadLogs(){
  if(!SESSION.token) return;
  if(!SESSION?.admin?.canViewLogs) return;

  setStatus(logsStatus, "Loading logs…");
  loadLogsBtn.disabled = true;

  try{
    const out = await apiPost("/logs", {
      token: SESSION.token,
      fromDate: logFrom.value || "",
      toDate: logTo.value || "",
      adminEmail: String(logAdmin.value || "").trim(),
      actionType: String(logType.value || "").trim()
    });

    const logs = out.logs || [];
    if(!logs.length){
      logsBody.innerHTML = `<div class="trow"><div class="muted">No logs found.</div><div></div><div></div><div></div></div>`;
      setStatus(logsStatus, "");
      return;
    }

    logsBody.innerHTML = logs.map(l => `
      <div class="trow" style="grid-template-columns: .8fr .8fr .6fr 1.2fr;">
        <div>${escapeHtml(l.timestamp)}</div>
        <div>${escapeHtml(l.adminName)}<div class="muted" style="font-size:12px">${escapeHtml(l.adminEmail)}</div></div>
        <div>${escapeHtml(l.actionType)}</div>
        <div style="word-break:break-word;color:rgba(229,231,235,.85)">${escapeHtml(l.details || "")}</div>
      </div>
    `).join("");

    setStatus(logsStatus, "", "");
  }catch(err){
    setStatus(logsStatus, "Error: " + (err.message || err), "err");
  }finally{
    loadLogsBtn.disabled = false;
  }
}

loadLogsBtn?.addEventListener("click", loadLogs);

/***********************
 * Welcome email (mailto builder)
 ***********************/
const welCompany = $("welCompany");
const welContact = $("welContact");
const welEmail = $("welEmail");
const welSendBtn = $("welSendBtn");
const welStatus = $("welStatus");

function isValidEmail(s){
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s||"").trim());
}

welSendBtn?.addEventListener("click", async () => {
  setStatus(welStatus, "");

  if(!SESSION.token){
    setStatus(welStatus, "Please sign in first.", "err");
    return;
  }

  const companyName = String(welCompany.value || "").trim();
  const contactName = String(welContact.value || "").trim();
  const customerEmail = String(welEmail.value || "").trim();

  if(!companyName) return setStatus(welStatus, "Company name is required.", "err");
  if(!customerEmail || !isValidEmail(customerEmail)) return setStatus(welStatus, "Customer email is invalid.", "err");

  try{
    // Log the action server-side (no sending, just logging)
    await apiPost("/send-welcome", {
      token: SESSION.token,
      companyName,
      contactName,
      customerEmail
    });

    const displayName = contactName || companyName;
    const subject = encodeURIComponent("Welcome to Smartfits – Your Customer Onboarding Pack");

    const body = encodeURIComponent(
`Dear ${displayName},

Welcome to Smartfits Installations. We’re delighted to have you on board and excited to begin supporting your fleet.

Please view your Customer Onboarding Pack here:
https://smartfitscustomeronboarding.pages.dev

Your Onboarding Pack includes:
- Onboarding information
- How the process works
- Key contacts and support details

Kind regards,
Smartfits Installations Ltd
support@smartfits.co.uk`
    );

    // mailto opens their device default mail app (Outlook desktop/web/mobile will handle it)
    window.location.href = `mailto:${customerEmail}?subject=${subject}&body=${body}`;

    setStatus(welStatus, `Email opened for ${customerEmail}.`, "ok");
  }catch(err){
    setStatus(welStatus, "Error: " + (err.message || err), "err");
  }
});

/***********************
 * Employee modal wire-up
 ***********************/
const personModal = $("personModal");
const closePersonBtn = $("closePersonBtn");

document.addEventListener("click", (e) => {
  const card = e.target.closest(".person[data-person]");
  if(!card) return;

  const key = card.dataset.person;
  const person = PEOPLE[key];
  if(!person) return;

  renderPerson(person);
  openModal(personModal);
});

closePersonBtn?.addEventListener("click", () => closeModal(personModal));
personModal?.addEventListener("click", (e) => { if(e.target === personModal) closeModal(personModal); });

/***********************
 * Esc close for modals
 ***********************/
document.addEventListener("keydown", (e) => {
  if(e.key !== "Escape") return;
  if(adminModal.classList.contains("open")) closeModal(adminModal);
  if(personModal.classList.contains("open")) closeModal(personModal);
});

/***********************
 * Escaping
 ***********************/
function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function escapeAttr(str){ return escapeHtml(str); }
