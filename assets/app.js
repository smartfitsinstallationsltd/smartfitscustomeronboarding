// TEAM DATA
const people = {
  tara: {name:"Tara Hassall", role:"Managing Director", email:"tara@smartfits.co.uk", phone:"07894 880559", img:"./images/tara_hassall.png"},
  charlie: {name:"Charlie Inger", role:"Sales & Business Development Manager", email:"charlie@smartfits.co.uk", phone:"07385 099620", img:"./images/charlie_inger.png"},
  emma: {name:"Emma Sumner", role:"Customer Success Team Leader", email:"emma@smartfits.co.uk", img:"./images/emma_sumner.png"},
  kelly: {name:"Kelly Mullen", role:"Customer Success Team Member", email:"kelly@smartfits.co.uk", img:"./images/kelly_mullen.png"},
  aleks: {name:"Aleks Fossick", role:"Customer Success Team Member", email:"aleks@smartfits.co.uk", img:"./images/aleks_fossick.png"},
  roz: {name:"Roz Hardwick", role:"Operations Lead", email:"roz@smartfits.co.uk", img:"./images/roz_hardwick.png"},
  ellie:{name:"Ellie Topliss", role:"Project Coordinator", email:"ellie@smartfits.co.uk", img:"./images/ellie_topliss.png"},
  sophie:{name:"Sophie Turner", role:"Project Coordinator", email:"sophie@smartfits.co.uk", img:"./images/sophie_turner.png"},
  amanda:{name:"Amanda Clarke", role:"Field Operations Team Member", email:"amanda@smartfits.co.uk", img:"./images/amanda_clarke.png"},
  rosie:{name:"Rosie Smart", role:"Field Operations Team Member", email:"rosie@smartfits.co.uk", img:"./images/rosie_smart.png"},
  bridie:{name:"Bridie Southam", role:"Field Operations Team Member", email:"bridie@smartfits.co.uk", img:"./images/bridie_southam.png"},
  kasia:{name:"Kasia Dzielak", role:"Field Operations Team Member", email:"kasia@smartfits.co.uk", img:"./images/kasia_dzielak.png"},
};

// TEAM POPUP
document.querySelectorAll(".personCard").forEach(card=>{
  card.onclick = ()=>{
    const key = card.dataset.person;
    const p = people[key];

    let html = `
      <img src="${p.img}" style="width:120px;border-radius:12px;">
      <h2>${p.name}</h2>
      <p>${p.role}</p>
      <p>Email: ${p.email}</p>
    `;
    if(p.phone) html += `<p>Phone: ${p.phone}</p>`;

    html += `
      <hr>
      <h3>Want general support?</h3>
      <p>Support Phone: 01283 533330</p>
      <p>Support Email: support@smartfits.co.uk</p>
    `;

    document.getElementById("personContent").innerHTML = html;
    document.getElementById("personModal").style.display="flex";
  }
});
document.getElementById("closePersonBtn").onclick=()=>{
  document.getElementById("personModal").style.display="none";
};

// ADMIN MODAL
document.getElementById("openAdminBtn").onclick=()=>{
  document.getElementById("adminModal").style.display="flex";
};
document.getElementById("closeAdminBtn").onclick=()=>{
  document.getElementById("adminModal").style.display="none";
};

// Fake login for now (connect to GAS later)
document.getElementById("adminLoginBtn").onclick=()=>{
  const email = document.getElementById("adminEmail").value;
  const pass = document.getElementById("adminPassword").value;

  if(email.includes("@smartfits.co.uk") && pass.length>3){
    document.getElementById("adminLoginArea").style.display="none";
    document.getElementById("adminDashboard").style.display="block";
  } else {
    document.getElementById("adminStatus").innerText="Login failed";
  }
};

document.getElementById("logoutBtn").onclick=()=>{
  document.getElementById("adminDashboard").style.display="none";
  document.getElementById("adminLoginArea").style.display="block";
};
