// /assets/app.js

// ✅ All API calls go through Cloudflare Pages Function
// POST /api -> forwards to Apps Script -> no CORS
const API = "/api";

/* ---------- Helpers ---------- */
function $(id){ return document.getElementById(id); }

function setStatus(el, msg, type){
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

async function apiPost(payload){
  const res = await fetch(API, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(payload),
  });
  const out = await res.json().catch(() => ({}));
  if(!res.ok || !out.ok) throw new Error(out.error || `Request failed (${res.status})`);
  return out;
}

function downloadBase64File(base64, filename, mime){
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: mime || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ---------- Cancellation policy (plain text) ---------- */
const POLICY_HTML = `
  <p style="margin-top:0;">
    At SmartFits we are committed to delivering high-quality service through efficient scheduling and resource planning.
    To ensure fairness to both our clients and our field engineers, the following policy applies regarding cancellations and incomplete work:
  </p>

  <h3 style="margin-top:14px;">Cancellation Notice</h3>
  <ul>
    <li><b>More Than One Business Days’ Notice:</b> Cancellations made with more than one full business day (24 hours) notice will not incur any charge.</li>
    <li><b>Within One Business Day (24 Hours):</b> Cancellations made within one full business day (24 hours) of the scheduled appointment will be charged at 100% of the originally quoted full price of the job.</li>
    <li>Business days are defined as Monday to Friday, excluding UK bank holidays. Weekends and bank holidays are not counted as working days for notice periods.</li>
  </ul>

  <h3 style="margin-top:14px;">If you wish to cancel an appointment:</h3>
  <ul>
    <li>Call us on <b>01283 533330</b>, or</li>
    <li>Email us at <a href="mailto:support@smartfits.co.uk" class="plainLink">support@smartfits.co.uk</a></li>
  </ul>

  <h3 style="margin-top:14px;">Incomplete Jobs Due to Client-Side Issues</h3>
  <p>
    If our engineer attends site and is unable to complete the scheduled work due to client-side issues
    (e.g., unavailable vehicles, missing equipment, denied access), it is treated as a late cancellation, and:
  </p>
  <ul>
    <li>The client will be charged 100% of the originally quoted full price.</li>
    <li>Return visits will charge only for additional time/work to complete remaining tasks.</li>
  </ul>

  <h3 style="margin-top:14px;">Billing Responsibility</h3>
  <p>
    This policy applies to the invoiced party regardless of vehicle or site owner, including third-party installations.
    Fees/communications will be directed to the established account holder.
  </p>
`;

/* ---------- Public form ---------- */
const form = $("deploymentForm");
const statusEl = $("status");
const submitBtn = $("submitBtn");
const clearBtn = $("clearBtn");

const acceptPolicy = $("acceptPolicy");
const acceptPolicyValue = $("acceptPolicyValue");

function validateRequired(){
  const requiredIds = [
    "fullCompanyName","vatNumber","companyRegNumber","invoiceAddress",
    "accountsContactName","accountsContactNumber","accountsEmail",
    "mainContactName","mainContactNumber","mainContactEmail"
  ];

  for(const id of requiredIds){
    const el = $(id);
    if(!el || !String(el.value || "").trim()){
      el?.focus();
      return false;
    }
  }

  if(!acceptPolicy.checked){
    acceptPolicy.focus();
    return false;
  }

  return true;
}

acceptPolicy?.addEventListener("change", () => {
  acceptPolicyValue.value = acceptPolicy.checked ? "Yes" : "No";
});

clearBtn?.addEventListener("click", () => {
  form.reset();
  acceptPolicyValue.value = "No";
  setStatus(statusEl, "");
});

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  acceptPolicyValue.value = acceptPolicy.checked ? "Yes" : "No";

  if(!validateRequired()){
    setStatus(statusEl, "Please complete all required fields (marked with *), and accept the Cancellation Policy.", "err");
    return;
  }

  setStatus(statusEl, "Submitting…");
  submitBtn.disabled = true;

  const data = Object.fromEntries(new FormData(form).entries());

  try{
    await apiPost({ action:"submitForm", ...data });
    setStatus(statusEl, "Submitted successfully.", "ok");
    form.reset();
    acceptPolicyValue.value = "No";
  }catch(err){
    setStatus(statusEl, "Error: " + (err?.message || err), "err");
  }finally{
    submitBtn.disabled = false;
  }
});

/* ---------- Policy modal ---------- */
const policyModal = $("policyModal");
const openPolicyBtn = $("openPolicyBtn");
const closePolicyBtn = $("closePolicyBtn");
const policyBody = $("policyBody");

policyBody.innerHTML = POLICY_HTML;

openPolicyBtn?.addEventListener("click", () => openModal(policyModal));
closePolicyBtn?.addEventListener("click", () => closeModal(policyModal));
policyModal?.addEventListener("click", (e) => { if(e.target === policyModal) closeModal(policyModal); });

/* ---------- Person details modal ---------- */
const PERSONS = {
  tara:    { name:"Tara Hassall",    role:"Managing Director", email:"tara@smartfits.co.uk", phone:"07894 880559" },
  charlie: { name:"Charlie Inger",   role:"Sales & Business Development Manager", email:"charlie@smartfits.co.uk", phone:"07385 099620" },
  emma:    { name:"Emma Sumner",     role:"Customer Success Team Leader", email:"emma@smartfits.co.uk" },
  kelly:   { name:"Kelly Mullen",    role:"Customer Success Team Member", email:"kelly@smartfits.co.uk" },
  aleks:   { name:"Aleks Fossick",   role:"Customer Success Team Member", email:"aleks@smartfits.co.uk" },
  roz:     { name:"Roz Hardwick",    role:"Operations Lead", email:"roz@smartfits.co.uk" },
  ellie:   { name:"Ellie Topliss",   role:"Project Coordinator", email:"ellie@smartfits.co.uk" },
  sophie:  { name:"Sophie Turner",   role:"Project Coordinator", email:"sophie@smartfits.co.uk" },
  amanda:  { name:"Amanda Clarke",   role:"Field Operations Team Member", email:"amanda@smartfits.co.uk" },
  rosie:   { name:"Rosie Smart",     role:"Field Operations Team Member", email:"rosie@smartfits.co.uk" },
  bridie:  { name:"Bridie Southam",  role:"Field Operations Team Member", email:"bridie@smartfits.co.uk" },
  kasia:   { name:"Kasia Dzielak",   role:"Field Operations Team Member", email:"kasia@smartfits.co.uk" },
};

const personModal = $("personModal");
const personBody = $("personBody");
const closePersonBtn = $("closePersonBtn");

closePersonBtn?.addEventListener("click", () => closeModal(personModal));
personModal?.addEventListener("click", (e) => { if(e.target === personModal) closeModal(personModal); });

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-person]");
  if(!btn) return;
  const key = btn.getAttribute("data-person");
  const p = PERSONS[key];
  if(!p) return;

  const phoneRow = p.phone
    ? `<div style="margin-top:10px;"><b>Phone:</b> <a href="tel:${p.phone.replace(/\s+/g,"")}" class="plainLink">${p.phone}</a></div>`
    : "";

  personBody.innerHTML = `
    <div style="display:flex;gap:12px;align-items:flex-start;">
      <div style="flex:1;">
        <div style="font-weight:900;font-size:18px;margin-bottom:4px;">${p.name}</div>
        <div style="color:#94a3b8;margin-bottom:10px;">${p.role || ""}</div>
        <div><b>Email:</b> <a href="mailto:${p.email}" class="plainLink">${p.email}</a></div>
        ${phoneRow}
      </div>
    </div>
  `;

  openModal(personModal);
});

/* ---------- Admin modal + dashboard ---------- */
const adminModal = $("adminModal");
const openAdminBtn = $("openAdminBtn");
const closeAdminBtn = $("closeAdminBtn");

const adminEmail = $("adminEmail");
const adminPassword = $("adminPassword");
const adminLoginBtn = $("adminLoginBtn");
const adminClearBtn = $("adminClearBtn");
const adminStatus = $("adminStatus");

const adminDash = $("adminDash");
const dashWho = $("dashWho");
const signOutBtn = $("signOutBtn");

const filesTbody = $("filesTbody");
const fileQuery = $("fileQuery");
const fileFrom = $("fileFrom");
const fileTo = $("fileTo");
const fileSearchBtn = $("fileSearchBtn");

const logsPanel = $("logsPanel");
const logsTbody = $("logsTbody");
const logFrom = $("logFrom");
const logTo = $("logTo");
const logAdmin = $("logAdmin");
const logType = $("logType");
const logSearchBtn = $("logSearchBtn");

const welCompany = $("welCompany");
const welContact = $("welContact");
const welEmail = $("welEmail");
const welBtn = $("welBtn");
const welStatus = $("welStatus");

let sessionToken = localStorage.getItem("sf_admin_token") || "";
let sessionAdmin = null;

openAdminBtn?.addEventListener("click", () => {
  setStatus(adminStatus, "");
  adminDash.classList.add("hidden");   // ✅ always start hidden
  openModal(adminModal);
});


closeAdminBtn?.addEventListener("click", () => closeModal(adminModal));
adminModal?.addEventListener("click", (e) => { if(e.target === adminModal) closeModal(adminModal); });

adminClearBtn?.addEventListener("click", () => {
  adminEmail.value = "";
  adminPassword.value = "";
  setStatus(adminStatus, "");
});

adminLoginBtn?.addEventListener("click", async () => {
  setStatus(adminStatus, "Signing in…");
  try{
    const out = await apiPost({
      action:"adminLogin",
      email: String(adminEmail.value || "").trim(),
      password: String(adminPassword.value || ""),
    });
    sessionToken = out.token;
    sessionAdmin = out.admin;
    localStorage.setItem("sf_admin_token", sessionToken);

    setStatus(adminStatus, "Signed in.", "ok");
    showDashboard();
    await loadFiles();
    if(sessionAdmin.canViewLogs){
      logsPanel.classList.remove("hidden");
    }else{
      logsPanel.classList.add("hidden");
    }
  }catch(err){
    setStatus(adminStatus, "Login failed: " + (err?.message || err), "err");
  }
});

signOutBtn?.addEventListener("click", () => {
  sessionToken = "";
  sessionAdmin = null;
  localStorage.removeItem("sf_admin_token");
  adminDash.classList.add("hidden");
  setStatus(adminStatus, "Signed out.", "ok");
  filesTbody.innerHTML = `<tr><td colspan="3" class="muted">Sign in to view files.</td></tr>`;
  logsTbody.innerHTML = `<tr><td colspan="4" class="muted">Sign in to view logs.</td></tr>`;
});

async function bootSession(){
  const out = await apiPost({ action:"whoami", token: sessionToken });
  sessionAdmin = out.admin;
  showDashboard();
  await loadFiles();
  if(sessionAdmin.canViewLogs) logsPanel.classList.remove("hidden");
  else logsPanel.classList.add("hidden");
}

function showDashboard(){
  dashWho.textContent = `${sessionAdmin.name} (${sessionAdmin.email})`;
  adminDash.classList.remove("hidden");
}

fileSearchBtn?.addEventListener("click", loadFiles);

async function loadFiles(){
  if(!sessionToken) return;
  filesTbody.innerHTML = `<tr><td colspan="3" class="muted">Loading…</td></tr>`;

  const out = await apiPost({
    action:"listFiles",
    token: sessionToken,
    query: String(fileQuery.value || "").trim(),
    fromDate: fileFrom.value || "",
    toDate: fileTo.value || "",
  });

  if(!out.files || !out.files.length){
    filesTbody.innerHTML = `<tr><td colspan="3" class="muted">No files found.</td></tr>`;
    return;
  }

  filesTbody.innerHTML = out.files.map(f => `
    <tr>
      <td>${escapeHtml(f.name)}</td>
      <td>${escapeHtml(f.created)}</td>
      <td>
        <button type="button" class="mini" data-view="${f.url}">View</button>
        <button type="button" class="mini danger" data-del="${f.id}" data-name="${escapeHtml(f.name)}">Delete</button>
      </td>
    </tr>
  `).join("");
}

document.addEventListener("click", async (e) => {
  const v = e.target.closest("[data-view]");
  if(v){
    window.open(v.getAttribute("data-view"), "_blank", "noopener");
    return;
  }

  const d = e.target.closest("[data-del]");
  if(d){
    const id = d.getAttribute("data-del");
    const name = d.getAttribute("data-name") || "this file";
    const ok = confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`);
    if(!ok) return;

    try{
      await apiPost({ action:"deleteFile", token: sessionToken, fileId: id });
      await loadFiles();
    }catch(err){
      alert("Delete failed: " + (err?.message || err));
    }
  }
});

logSearchBtn?.addEventListener("click", async () => {
  if(!sessionToken) return;
  logsTbody.innerHTML = `<tr><td colspan="4" class="muted">Loading…</td></tr>`;

  try{
    const out = await apiPost({
      action:"listLogs",
      token: sessionToken,
      fromDate: logFrom.value || "",
      toDate: logTo.value || "",
      adminEmail: String(logAdmin.value || "").trim(),
      actionType: String(logType.value || "").trim(),
    });

    if(!out.logs || !out.logs.length){
      logsTbody.innerHTML = `<tr><td colspan="4" class="muted">No logs found.</td></tr>`;
      return;
    }

    logsTbody.innerHTML = out.logs.map(l => `
      <tr>
        <td>${escapeHtml(l.timestamp)}</td>
        <td>${escapeHtml(l.adminName)}<div class="muted">${escapeHtml(l.adminEmail)}</div></td>
        <td>${escapeHtml(l.actionType)}</td>
        <td style="white-space:pre-wrap;">${escapeHtml(l.details)}</td>
      </tr>
    `).join("");

  }catch(err){
    logsTbody.innerHTML = `<tr><td colspan="4" class="muted">Error: ${escapeHtml(err?.message || err)}</td></tr>`;
  }
});

welBtn?.addEventListener("click", async () => {
  if(!sessionToken) return setStatus(welStatus, "Please sign in first.", "err");

  const companyName = String(welCompany.value || "").trim();
  const contactName = String(welContact.value || "").trim();
  const customerEmail = String(welEmail.value || "").trim();

  if(!companyName) return setStatus(welStatus, "Company name is required.", "err");
  if(!customerEmail) return setStatus(welStatus, "Customer email is required.", "err");
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customerEmail)) return setStatus(welStatus, "Customer email is not valid.", "err");

  setStatus(welStatus, "Generating email…");

  try{
    const out = await apiPost({
      action:"buildWelcomeEmailEml",
      token: sessionToken,
      companyName,
      contactName,
      customerEmail
    });

    downloadBase64File(out.emlBase64, out.filename || "welcome-email.eml", "message/rfc822");
    setStatus(welStatus, `Email generated for ${customerEmail}.`, "ok");
  }catch(err){
    setStatus(welStatus, "Error: " + (err?.message || err), "err");
  }
});

function escapeHtml(str){
  return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
