/* Thunderply — Dashboard (backend-powered)
   - On load: GET all applications from your backend
   - Renders stacked cards; clicking a card opens application.html
   - Accept/Reject still remove from the current list (TODO: wire backend endpoints if desired)
*/

const LOAD_APPLICATIONS_URL = "http://localhost:8328/api/v1/jobs/load_application"; // GET

// ----- State & DOM -----
let appsCache = []; // current in-memory list

const appsSection = document.getElementById("appsSection");
const statusEl = document.getElementById("status");
const listEl = document.getElementById("appsList");
const emptyStateEl = document.getElementById("emptyState");

// ----- Helpers -----
function setBusy(b, msg = "") {
  appsSection.setAttribute("aria-busy", String(b));
  statusEl.textContent = msg;
}

function fmtDate(iso) {
  try {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    // YYYY-MM-DD
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return "—";
  }
}

function relevanceBar(score) {
  // score may come as 0..1, 0..10, or already percentage-like
  const n = Number(score) || 0;
  const pct = n <= 1 ? Math.round(n * 100) : (n <= 10 ? Math.round(n * 10) : Math.round(n));
  return `
    <div style="width:100%;height:8px;border-radius:999px;background:#1a1e2a;border:1px solid rgba(231,236,245,0.08);overflow:hidden;">
      <div style="height:100%;width:${Math.max(0, Math.min(100, pct))}%;background:linear-gradient(90deg,#7c5cff,#30e1ff);"></div>
    </div>
  `;
}

// Drill into { id, job, cover_letter, applied_at } safely
function pickFields(app) {
  const j = app.job || {};
  const info = j.job_information || {};
  return {
    id: app.id,
    title: info.title || j.title || "Untitled Role",
    company: j.company_name || info.company || "Unknown Company",
    location: info.location || j.location || "—",
    description: info.description || j.description || "",
    apply_url: j.apply_url || "#",
    score: j.relevance_score ?? j.score ?? 0,
    applied_at: app.applied_at || null
  };
}

// Open application details page
function openApplicationDetails(app) {
  const key = "thunderply-application-" + app.id;
  sessionStorage.setItem(key, JSON.stringify(app));
  window.location.href = "application.html?key=" + encodeURIComponent(key);
}

// Remove from in-memory cache (visual only for now)
function removeApplicationInView(id) {
  appsCache = appsCache.filter(a => a.id !== id);
}

// Build one card
function appCard(app) {
  const view = pickFields(app);
  const card = document.createElement("article");
  card.className = "card";
  card.style.cursor = "pointer";
  card.setAttribute("tabindex", "0");
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", "View application for " + view.title + " at " + view.company);

  const scorePct = (Number(view.score) || 0) * (view.score <= 1 ? 100 : (view.score <= 10 ? 10 : 1));

  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
      <div>
        <h3 style="margin:0 0 4px 0;">${view.title}</h3>
        <div class="muted" style="display:flex;gap:8px;flex-wrap:wrap;">
          <span>${view.company}</span>
          <span aria-hidden="true">•</span>
          <span>${view.location}</span>
          <span aria-hidden="true">•</span>
          <span>Applied: ${fmtDate(view.applied_at)}</span>
        </div>
      </div>

      <!-- Optional status pill space (if you add statuses later) -->
      <span class="badge" style="border-style:solid;border-color:rgba(231,236,245,0.25);">Saved</span>
    </div>

    <div style="margin:12px 0 6px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <small class="muted">Relevance</small>
        <small class="muted">${Math.round(scorePct)}%</small>
      </div>
      ${relevanceBar(view.score)}
    </div>

    <p class="muted" style="margin-top:10px;max-width:80ch;">
      ${(view.description || "No description.").slice(0, 220)}${(view.description || "").length > 220 ? "…" : ""}
    </p>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">
      <span style="flex:1;"></span>
      <button class="cta" data-action="accept">Accepted</button>
      <button class="ghost" data-action="reject" style="border-color:#ff5c7a;color:#ff5c7a;">Rejected</button>
    </div>
  `;

  // Click to open details (ignore inner buttons)
  const open = () => openApplicationDetails(app);
  card.addEventListener("click", (e) => {
    if (e.target.closest("button,[data-action],a")) return;
    open();
  });
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  });

  // Accept / Reject (visual removal; TODO wire backend endpoints if you like)
  card.querySelector('[data-action="accept"]').addEventListener("click", (e) => {
    e.stopPropagation();
    setBusy(true, "Updating…");
    try {
      removeApplicationInView(view.id);
      render();
      statusEl.textContent = "Marked as accepted and removed: " + view.title + " @ " + view.company;
    } finally {
      setBusy(false);
    }
  });
  card.querySelector('[data-action="reject"]').addEventListener("click", (e) => {
    e.stopPropagation();
    setBusy(true, "Updating…");
    try {
      removeApplicationInView(view.id);
      render();
      statusEl.textContent = "Marked as rejected and removed: " + view.title + " @ " + view.company;
    } finally {
      setBusy(false);
    }
  });

  return card;
}

// Render list
function render() {
  listEl.innerHTML = "";
  emptyStateEl.style.display = appsCache.length ? "none" : "block";
  appsCache.forEach(app => listEl.appendChild(appCard(app)));
  statusEl.textContent = appsCache.length ? `${appsCache.length} application(s)` : "No applications.";
}

// Load from backend
async function loadApplications() {
  setBusy(true, "Loading applications…");
  try {
    const res = await fetch(LOAD_APPLICATIONS_URL, { method: "GET" });
    if (!res.ok) throw new Error(`Load failed (${res.status})`);
    const data = await res.json();
    appsCache = Array.isArray(data) ? data : [];
    render();
  } catch (err) {
    console.error(err);
    appsCache = [];
    render();
    statusEl.textContent = "Could not load applications.";
  } finally {
    setBusy(false);
  }
}

// Boot
document.addEventListener("DOMContentLoaded", loadApplications);
