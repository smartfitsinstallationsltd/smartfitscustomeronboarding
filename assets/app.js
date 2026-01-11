/****************************************************
 * CONFIG
 ****************************************************/

// ✅ Your Google Apps Script Web App URL (the /exec endpoint)
const GAS_WEB_APP_URL = window.GAS_WEB_APP_URL || ""; 
// If you prefer hard-code:
// const GAS_WEB_APP_URL = "https://script.google.com/macros/s/XXXX/exec";

/****************************************************
 * PUBLIC FORM
 ****************************************************/
const form = document.getElementById('deploymentForm');
const statusEl = document.getElementById('status');
const submitBtn = document.getElementById('submitBtn');
const clearBtn = document.getElementById('clearBtn');

const acceptPolicy = document.getElementById('acceptPolicy');
const acceptPolicyValue = document.getElementById('acceptPolicyValue');

const policyModal = document.getElementById('policyModal');
const openPolicyBtn = document.getElementById('openPolicyBtn');
const closePolicyBtn = document.getElementById('closePolicyBtn');

function setStatus(msg, type){
  if(!statusEl) return;
  statusEl.textContent = msg || '';
  statusEl.classList.remove('ok','err');
  if(type) statusEl.classList.add(type);
}

function openModal(backdropEl, focusEl){
  backdropEl?.classList.add('open');
  backdropEl?.setAttribute('aria-hidden','false');
  focusEl?.focus();
}
function closeModal(backdropEl, focusBackEl){
  backdropEl?.classList.remove('open');
  backdropEl?.setAttribute('aria-hidden','true');
  focusBackEl?.focus();
}

/* Policy modal */
openPolicyBtn?.addEventListener('click', () => openModal(policyModal, closePolicyBtn));
closePolicyBtn?.addEventListener('click', () => closeModal(policyModal, openPolicyBtn));
policyModal?.addEventListener('click', (e) => { if(e.target === policyModal) closeModal(policyModal, openPolicyBtn); });

document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape'){
    if(policyModal?.classList.contains('open')) closeModal(policyModal, openPolicyBtn);
    if(adminModal?.classList.contains('open')) closeModal(adminModal, openAdminBtn);
    if(personModal?.classList.contains('open')) closeModal(personModal, null);
    if(logModal?.classList.contains('open')) closeModal(logModal, null);
  }
});

function validateRequired(){
  const requiredIds = [
    'fullCompanyName','vatNumber','companyRegNumber','invoiceAddress',
    'accountsContactName','accountsContactNumber','accountsEmail',
    'mainContactName','mainContactNumber','mainContactEmail'
  ];

  for(const id of requiredIds){
    const el = document.getElementById(id);
    if(!el || !String(el.value || '').trim()){
      el?.focus();
      return false;
    }
  }

  if(!acceptPolicy?.checked){
    acceptPolicy?.focus();
    return false;
  }
  return true;
}

acceptPolicy?.addEventListener('change', () => {
  acceptPolicyValue.value = acceptPolicy.checked ? 'Yes' : 'No';
});

clearBtn?.addEventListener('click', () => {
  form.reset();
  acceptPolicyValue.value = 'No';
  setStatus('');
});

form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  acceptPolicyValue.value = acceptPolicy.checked ? 'Yes' : 'No';

  if(!validateRequired()){
    setStatus('Please complete all required fields (marked with *), and accept the Cancellation Policy.', 'err');
    return;
  }

  setStatus('Submitting…');
  submitBtn.disabled = true;

  const data = Object.fromEntries(new FormData(form).entries());
  data.action = "submitForm";

  try{
    if(!GAS_WEB_APP_URL) throw new Error("GAS_WEB_APP_URL is not set.");

    const res = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(data)
    });

    const out = await res.json().catch(() => ({}));
    if(!res.ok || !out.ok) throw new Error(out.error || `Request failed (${res.status})`);

    // ✅ new success message
    setStatus('Submitted successfully. Thank you for the business.', 'ok');
    submitBtn.disabled = false;
    form.reset();
    acceptPolicyValue.value = 'No';

  }catch(err){
    setStatus('Error: ' + (err?.message || err), 'err');
    submitBtn.disabled = false;
  }
});

/****************************************************
 * TEAM MEMBER MODAL (click on person)
 ****************************************************/
const personModal = document.getElementById('personModal');
const closePersonBtn = document.getElementById('closePersonBtn');
const personBody = document.getElementById('personBody');

/**
 * Only Tara + Charlie have phone numbers.
 * Everyone else: firstname@smartfits.co.uk
 */
const PEOPLE = {
  tara:   { name:"Tara Hassall",   role:"Managing Director", email:"tara@smartfits.co.uk", phone:"07894 880559", img:"./images/tara_hassall.png" },
  charlie:{ name:"Charlie Inger", role:"Sales & Business Development Manager", email:"charlie@smartfits.co.uk", phone:"07385 099620", img:"./images/charlie_inger.png" },

  emma:   { name:"Emma Sumner",   role:"Customer Success Team Leader", email:"emma@smartfits.co.uk", img:"./images/emma_sumner.png" },
  kelly:  { name:"Kelly Mullen",  role:"Customer Success Team Member", email:"kelly@smartfits.co.uk", img:"./images/kelly_mullen.png" },
  aleks:  { name:"Aleks Fossick", role:"Customer Success Team Member", email:"aleks@smartfits.co.uk", img:"./images/aleks_fossick.png" },

  roz:    { name:"Roz Hardwick",  role:"Operations Lead", email:"roz@smartfits.co.uk", img:"./images/roz_hardwick.png" },
  ellie:  { name:"Ellie Topliss", role:"Project Coordinator", email:"ellie@smartfits.co.uk", img:"./images/ellie_topliss.png" },
  sophie: { name:"Sophie Turner", role:"Project Coordinator", email:"sophie@smartfits.co.uk", img:"./images/sophie_turner.png" },
  amanda: { name:"Amanda Clarke", role:"Field Operations Team Member", email:"amanda@smartfits.co.uk", img:"./images/amanda_clarke.png" },
  rosie:  { name:"Rosie Smart",   role:"Field Operations Team Member", email:"rosie@smartfits.co.uk", img:"./images/rosie_smart.png" },
  bridie: { name:"Bridie Southam",role:"Field Operations Team Member", email:"bridie@smartfits.co.uk", img:"./images/bridie_southam.png" },
  kasia:  { name:"Kasia Dzielak", role:"Field Operations Team Member", email:"kasia@smartfits.co.uk", img:"./images/kasia_dzielak.png" }
};

function renderPersonModal(p){
  const safePhone = p.phone ? `
    <div class="row">Phone: <a href="tel:${p.phone.replace(/\s+/g,'')}">${p.phone}</a></div>
  ` : '';

  personBody.innerHTML = `
    <div class="personCard">
      <img src="${p.img}" alt="${p.name}">
      <div>
        <div class="pName">${p.name}</div>
        <div class="pRole">${p.role || ''}</div>
      </div>
    </div>

    <div class="personDetails">
      <div class="label">Contact details</div>
      <div class="row">Email: <a href="mailto:${p.email}">${p.email}</a></div>
      ${safePhone}
    </div>

    <div class="miniSupport">
      <div class="title">Want general support?</div>
      <div class="row">Support Phone Number: <a href="tel:01283533330">01283 533330</a></div>
      <div class="row">Support Email Address: <a href="mailto:support@smartfits.co.uk">support@smartfits.co.uk</a></div>
    </div>
  `;
}

document.querySelectorAll('.personBtn').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.getAttribute('data-person');
    const p = PEOPLE[key];
    if(!p) return;
    renderPersonModal(p);
    openModal(personModal, closePersonBtn);
  });
});

closePersonBtn?.addEventListener('click', () => closeModal(personModal, null));
personModal?.addEventListener('click', (e) => { if(e.target === personModal) closeModal(personModal, null); });

/****************************************************
 * ADMIN MODAL + DASHBOARD (HIDE UNTIL LOGIN)
 ****************************************************/
const adminModal = document.getElementById('adminModal');
const openAdminBtn = document.getElementById('openAdminBtn');
const closeAdminBtn = document.getElementById('closeAdminBtn');
const logoutBtn = document.getElementById('logoutBtn');
const dashLogoutBtn = document.getElementById('dashLogoutBtn');

const adminLoginForm = document.getElementById('adminLoginForm');
const adminEmail = document.getElementById('adminEmail');
const adminPassword = document.getElementById('adminPassword');
const adminStatus = document.getElementById('adminStatus');
const adminClearBtn = document.getElementById('adminClearBtn');

const adminSignInView = document.getElementById('adminSignInView');
const adminDashView = document.getElementById('adminDashView');
const adminWho = document.getElementById('adminWho');

const logsCard = document.getElementById('logsCard');

/* Files UI */
const fileQuery = document.getElementById('fileQuery');
const fileSearchBtn = document.getElementById('fileSearchBtn');
const filesTbody = document.getElementById('filesTbody');
const filesStatus = document.getElementById('filesStatus');
const toggleDateBtn = document.getElementById('toggleDateBtn');
const dateRow = document.getElementById('dateRow');
const fromDate = document.getElementById('fromDate');
const toDate = document.getElementById('toDate');
const applyDateBtn = document.getElementById('applyDateBtn');
const clearDateBtn = document.getElementById('clearDateBtn');

/* Logs UI */
const refreshLogsBtn = document.getElementById('refreshLogsBtn');
const logsTbody = document.getElementById('logsTbody');
const logsStatus = document.getElementById('logsStatus');

/* Log details modal */
const logModal = document.getElementById('logModal');
const closeLogBtn = document.getElementById('closeLogBtn');
const logBody = document.getElementById('logBody');

function setAdminStatus(msg, type){
  if(!adminStatus) return;
  adminStatus.textContent = msg || '';
  adminStatus.classList.remove('ok','err');
  if(type) adminStatus.classList.add(type);
}

function setFilesStatus(msg, type){
  if(!filesStatus) return;
  filesStatus.textContent = msg || '';
  filesStatus.classList.remove('ok','err');
  if(type) filesStatus.classList.add(type);
}

function setLogsStatus(msg, type){
  if(!logsStatus) return;
  logsStatus.textContent = msg || '';
  logsStatus.classList.remove('ok','err');
  if(type) logsStatus.classList.add(type);
}

function getToken(){ return localStorage.getItem('sf_admin_token') || ''; }
function setToken(t){ localStorage.setItem('sf_admin_token', t); }
function clearToken(){ localStorage.removeItem('sf_admin_token'); }

function setAdminUiState({ authed, admin }){
  if(authed){
    adminSignInView.hidden = true;
    adminDashView.hidden = false;

    openAdminBtn.hidden = true;
    logoutBtn.hidden = false;

    dashLogoutBtn?.removeAttribute('hidden');
    adminWho.textContent = `${admin?.name || ''} • ${admin?.email || ''}`;

    // ✅ show logs only if allowed
    if(admin?.canViewLogs){
      logsCard.hidden = false;
    }else{
      logsCard.hidden = true;
    }
  }else{
    adminSignInView.hidden = false;
    adminDashView.hidden = true;

    openAdminBtn.hidden = false;
    logoutBtn.hidden = true;

    logsCard.hidden = true;
  }
}

async function apiCall(payload){
  if(!GAS_WEB_APP_URL) throw new Error("GAS_WEB_APP_URL is not set.");
  const res = await fetch(GAS_WEB_APP_URL, {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify(payload)
  });
  const out = await res.json().catch(() => ({}));
  if(!res.ok || !out.ok) throw new Error(out.error || `Request failed (${res.status})`);
  return out;
}

/* Open admin modal */
openAdminBtn?.addEventListener('click', () => {
  // Always show sign-in first when opening
  setAdminUiState({ authed:false });
  adminLoginForm?.reset();
  setAdminStatus('');
  openModal(adminModal, closeAdminBtn);
});

closeAdminBtn?.addEventListener('click', () => closeModal(adminModal, openAdminBtn));
adminModal?.addEventListener('click', (e) => { if(e.target === adminModal) closeModal(adminModal, openAdminBtn); });

adminClearBtn?.addEventListener('click', () => {
  adminLoginForm?.reset();
  setAdminStatus('');
});

/* Login */
adminLoginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  setAdminStatus('Signing in…');
  const email = String(adminEmail?.value || '').trim();
  const password = String(adminPassword?.value || '');

  try{
    const out = await apiCall({ action:'adminLogin', email, password });
    setToken(out.token);

    setAdminStatus('Signed in.', 'ok');
    setAdminUiState({ authed:true, admin: out.admin });

    // load initial files (and logs if allowed)
    await loadFiles();
    if(out.admin?.canViewLogs) await loadLogs();

  }catch(err){
    setAdminStatus('Error: ' + (err?.message || err), 'err');
  }
});

/* Logout buttons */
function doLogout(){
  clearToken();
  setAdminUiState({ authed:false });
  closeModal(adminModal, openAdminBtn);
}
logoutBtn?.addEventListener('click', doLogout);
dashLogoutBtn?.addEventListener('click', doLogout);

/* Optional: if token exists, keep top logout visible? (No — user asked to see nothing until clicked.)
   So we only check token after admin modal opens and user signs in. */

/****************************************************
 * FILES: search by name, optional date toggle
 ****************************************************/
toggleDateBtn?.addEventListener('click', () => {
  const willShow = !!dateRow?.hidden;
  dateRow.hidden = !willShow;
  toggleDateBtn.setAttribute('aria-expanded', String(willShow));
});

applyDateBtn?.addEventListener('click', () => loadFiles());
clearDateBtn?.addEventListener('click', () => {
  fromDate.value = '';
  toDate.value = '';
  loadFiles();
});

fileSearchBtn?.addEventListener('click', () => loadFiles());

async function loadFiles(){
  const token = getToken();
  if(!token) return;

  setFilesStatus('Loading…');
  try{
    const query = String(fileQuery?.value || '').trim();

    // Only send from/to if the date section is opened and filled.
    const useDates = !dateRow.hidden && (fromDate.value || toDate.value);

    const out = await apiCall({
      action:'listFiles',
      token,
      query,
      fromDate: useDates ? fromDate.value : '',
      toDate: useDates ? toDate.value : ''
    });

    const files = out.files || [];
    if(!files.length){
      filesTbody.innerHTML = `<tr><td colspan="3" class="muted">No files found.</td></tr>`;
      setFilesStatus('');
      return;
    }

    filesTbody.innerHTML = files.map(f => {
      return `
        <tr>
          <td>${escapeHtml(f.name)}</td>
          <td>${escapeHtml(f.created)}</td>
          <td>
            <div class="actionsInline">
              <button type="button" class="actionBtn" data-act="view" data-url="${escapeHtmlAttr(f.url)}">View</button>
              <button type="button" class="actionBtn danger" data-act="delete" data-id="${escapeHtmlAttr(f.id)}" data-name="${escapeHtmlAttr(f.name)}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    setFilesStatus('', 'ok');

  }catch(err){
    setFilesStatus('Error: ' + (err?.message || err), 'err');
  }
}

filesTbody?.addEventListener('click', async (e) => {
  const btn = e.target?.closest?.('button');
  if(!btn) return;
  const act = btn.getAttribute('data-act');

  if(act === 'view'){
    const url = btn.getAttribute('data-url');
    if(url) window.open(url, '_blank', 'noopener');
    return;
  }

  if(act === 'delete'){
    const id = btn.getAttribute('data-id');
    const name = btn.getAttribute('data-name');

    const ok = confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`);
    if(!ok) return;

    try{
      setFilesStatus('Deleting…');
      await apiCall({ action:'deleteFile', token: getToken(), fileId: id });
      setFilesStatus('Deleted.', 'ok');
      await loadFiles();
      // refresh logs if allowed (won’t show for Charlie)
      if(!logsCard.hidden) await loadLogs();
    }catch(err){
      setFilesStatus('Error: ' + (err?.message || err), 'err');
    }
  }
});

/****************************************************
 * LOGS: plain English summary + click for details
 ****************************************************/
function prettyAction(type){
  if(type === 'LOGIN') return 'Signed in';
  if(type === 'DELETE_FILE') return 'Deleted file';
  if(type === 'SEND_WELCOME_EMAIL') return 'Opened welcome email draft';
  return type || 'Action';
}

function formatUk(ts){
  // input might already be formatted (yyyy-mm-dd hh:mm:ss). Keep safe.
  // If it parses, display as UK.
  const d = new Date(ts);
  if(!isNaN(d.getTime())){
    return d.toLocaleString('en-GB', { dateStyle:'long', timeStyle:'short', timeZone:'Europe/London' });
  }
  return ts;
}

async function loadLogs(){
  const token = getToken();
  if(!token || logsCard.hidden) return;

  setLogsStatus('Loading…');
  try{
    const out = await apiCall({ action:'listLogs', token });
    const logs = out.logs || [];

    if(!logs.length){
      logsTbody.innerHTML = `<tr><td colspan="4" class="muted">No logs found.</td></tr>`;
      setLogsStatus('');
      return;
    }

    logsTbody.innerHTML = logs.map((l, idx) => {
      const action = prettyAction(l.actionType);
      let summary = action;

      // Build a short summary
      try{
        const detailsObj = l.details ? JSON.parse(l.details) : null;
        if(l.actionType === 'DELETE_FILE' && detailsObj?.fileName){
          summary = `Deleted file: ${detailsObj.fileName}`;
        }
        if(l.actionType === 'SEND_WELCOME_EMAIL' && detailsObj?.customerEmail){
          summary = `Welcome email draft: ${detailsObj.customerEmail}`;
        }
      }catch{}

      return `
        <tr>
          <td>${escapeHtml(formatUk(l.timestamp))}</td>
          <td>${escapeHtml(l.adminEmail || '')}</td>
          <td>${escapeHtml(action)}</td>
          <td>
            <button type="button" class="actionBtn" data-act="log" data-log='${escapeHtmlAttr(JSON.stringify(l))}'>
              View details
            </button>
          </td>
        </tr>
      `;
    }).join('');

    setLogsStatus('');

  }catch(err){
    setLogsStatus('Error: ' + (err?.message || err), 'err');
  }
}

refreshLogsBtn?.addEventListener('click', () => loadLogs());

logsTbody?.addEventListener('click', (e) => {
  const btn = e.target?.closest?.('button');
  if(!btn) return;
  if(btn.getAttribute('data-act') !== 'log') return;

  const raw = btn.getAttribute('data-log');
  if(!raw) return;

  let l;
  try{ l = JSON.parse(raw); }catch{ return; }

  let detailsObj = null;
  try{ detailsObj = l.details ? JSON.parse(l.details) : null; }catch{}

  const action = prettyAction(l.actionType);

  const fileName = detailsObj?.fileName ? `<div class="row">File Name: ${escapeHtml(detailsObj.fileName)}</div>` : '';
  const fileId = detailsObj?.fileId ? `<div class="row">File ID: ${escapeHtml(detailsObj.fileId)}</div>` : '';
  const customer = detailsObj?.customerEmail ? `<div class="row">Customer Email: ${escapeHtml(detailsObj.customerEmail)}</div>` : '';
  const company = detailsObj?.companyName ? `<div class="row">Company: ${escapeHtml(detailsObj.companyName)}</div>` : '';

  logBody.innerHTML = `
    <div class="doc">
      <div class="kicker" style="margin-bottom:8px;">Log Entry</div>
      <div class="row"><b>User</b> — ${escapeHtml(l.adminEmail || '')}</div>
      <div class="row"><b>Action</b> — ${escapeHtml(action)}</div>
      <div class="row"><b>Timestamp</b> — ${escapeHtml(formatUk(l.timestamp))}</div>
      <div style="height:10px;"></div>
      ${company}
      ${customer}
      ${fileName}
      ${fileId}
    </div>
  `;
  openModal(logModal, closeLogBtn);
});

closeLogBtn?.addEventListener('click', () => closeModal(logModal, null));
logModal?.addEventListener('click', (e) => { if(e.target === logModal) closeModal(logModal, null); });

/****************************************************
 * WELCOME EMAIL: open email draft on device (mailto)
 ****************************************************/
const welcomeForm = document.getElementById('welcomeForm');
const welcomeStatus = document.getElementById('welcomeStatus');

function setWelcomeStatus(msg, type){
  if(!welcomeStatus) return;
  welcomeStatus.textContent = msg || '';
  welcomeStatus.classList.remove('ok','err');
  if(type) welcomeStatus.classList.add(type);
}

welcomeForm?.addEventListener('submit', (e) => {
  e.preventDefault();

  const companyName = String(document.getElementById('welCompany')?.value || '').trim();
  const contactName = String(document.getElementById('welContact')?.value || '').trim();
  const customerEmail = String(document.getElementById('welEmail')?.value || '').trim();

  if(!companyName){
    setWelcomeStatus('Please enter a Company Name.', 'err');
    return;
  }
  if(!customerEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customerEmail)){
    setWelcomeStatus('Please enter a valid Customer Email Address.', 'err');
    return;
  }

  const displayName = contactName || companyName;
  const subject = `Welcome to Smartfits – Your Customer Onboarding Pack`;

  // Plain text (mailto is limited). This is the “best possible” without server-sent HTML.
  const body =
`Dear ${displayName},

Welcome to SmartFits Installations. We’re delighted to have you on board and excited to begin supporting your fleet.

Please view your Customer Onboarding Pack here:
https://smartfitscustomeronboarding.pages.dev

If you need support, please contact:
support@smartfits.co.uk
01283 533330

Kind regards,
SmartFits Installations Ltd`;

  const mailto = `mailto:${encodeURIComponent(customerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Opens the user’s default mail client (Outlook desktop/app/web depending on device)
  window.location.href = mailto;

  setWelcomeStatus(`Email draft opened for ${customerEmail}.`, 'ok');
});

/****************************************************
 * HELPERS
 ****************************************************/
function escapeHtml(str){
  return String(str ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}
function escapeHtmlAttr(str){
  // same as escapeHtml, but safe for attributes
  return escapeHtml(str).replaceAll('\n','&#10;').replaceAll('\r','&#13;');
}
