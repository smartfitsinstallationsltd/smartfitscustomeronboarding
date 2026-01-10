// /assets/app.js

const $ = (id) => document.getElementById(id);

const team = [
  { name: "Tara Hassall", role: "Managing Director", email: "tara@smartfits.co.uk", phone: "", img: "/images/tara_hassall.png" },
  { name: "Charlie Inger", role: "Sales & Business Development Manager", email: "charlie@smartfits.co.uk", phone: "", img: "/images/charlie_inger.png" },
  { name: "Emma Sumner", role: "Customer Success Team Leader", email: "emma@smartfits.co.uk", phone: "", img: "/images/emma_sumner.png" },
  { name: "Kelly Mullen", role: "Customer Success Team Member", email: "kelly_mullen@smartfits.co.uk", phone: "", img: "/images/kelly_mullen.png" },
  { name: "Aleks Fossick", role: "Customer Success Team Member", email: "aleks_fossick@smartfits.co.uk", phone: "", img: "/images/aleks_fossick.png" },
  { name: "Roz Hardwick", role: "Operations Lead", email: "roz@smartfits.co.uk", phone: "", img: "/images/roz_hardwick.png" },
  { name: "Ellie Topliss", role: "Project Coordinator", email: "ellie_topliss.png@smartfits.co.uk", phone: "", img: "/images/ellie.png" },
  { name: "Sophie Turner", role: "Project Coordinator", email: "sophie@smartfits.co.uk", phone: "", img: "/images/sophie_turner.png" },
  { name: "Amanda Clarke", role: "Field Operations Team Member", email: "amanda@smartfits.co.uk", phone: "", img: "/images/amanda_clarke.png" },
  { name: "Rosie Smart", role: "Field Operations Team Member", email: "rosie@smartfits.co.uk", phone: "", img: "/images/rosie_smart.png" },
];

function renderTeam() {
  const grid = $("teamGrid");
  if (!grid) return;

  grid.innerHTML = "";
  team.forEach((p) => {
    const card = document.createElement("div");
    card.className = "person";
    card.innerHTML = `
      <img class="avatar" src="${p.img}" alt="${escapeHtml(p.name)}">
      <div class="person__text">
        <div class="person__name">${escapeHtml(p.name)}</div>
        <div class="person__role">${escapeHtml(p.role)}</div>
      </div>
    `;
    card.addEventListener("click", () => showProfile(p));
    grid.appendChild(card);
  });
}

function showProfile(p) {
  const modal = $("profileModal");
  if (!modal) return;

  $("profileName").textContent = p.name;
  $("profileRole").textContent = p.role;
  $("profileImg").src = p.img;
  $("profileImg").alt = p.name;

  $("profileEmail").textContent = `Email: ${p.email || "N/A"}`;
  $("profilePhone").textContent = `Phone: ${p.phone || "N/A"}`;

  modal.setAttribute("aria-hidden", "false");
}

function hideProfile() {
  const modal = $("profileModal");
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// FORM SUBMISSION -> Cloudflare function -> Google Apps Script
async function submitForm(e) {
  e.preventDefault();

  const form = e.currentTarget;
  const status = $("formStatus");
  const btn = $("submitBtn");

  const formData = new FormData(form);
  const payload = {};
  formData.forEach((v, k) => (payload[k] = String(v || "").trim()));

  // quick required check (radio)
  if (!payload.acceptPolicyValue) {
    status.textContent = "Please confirm the cancellation policy.";
    return;
  }

  btn.disabled = true;
  status.textContent = "Submitting…";

  try {
    const res = await fetch("/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submitForm", ...payload }),
    });

    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Submission failed.");

    status.textContent = "Submitted successfully. Thank you for the business.";
    form.reset();
  } catch (err) {
    status.textContent = `Error: ${err.message || err}`;
  } finally {
    btn.disabled = false;
  }
}

function init() {
  renderTeam();

  const closeBtn = $("closeProfileBtn");
  if (closeBtn) closeBtn.addEventListener("click", hideProfile);

  const modal = $("profileModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) hideProfile();
    });
  }

  const form = $("onboardingForm");
  if (form) form.addEventListener("submit", submitForm);

  // Admin button exists but admin modal is handled by your admin page
  const openAdmin = $("openAdminBtn");
  if (openAdmin) {
    openAdmin.addEventListener("click", () => {
      // If you want to open /admin/ in a new tab:
      window.location.href = "/admin/";
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
