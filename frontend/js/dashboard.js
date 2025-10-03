/* Thunderply — Dashboard (vanilla JS)
   - Shows applications as stacked cards
   - Click card to open application.html with full details
   - Clicking "Accepted" or "Rejected" removes the app from the dashboard list
   - Uses localStorage for mock persistence until your backend API is wired
*/

const STORAGE_KEY = "thunderply-apps"; // local mock store

// ----- Mock data (edit freely) -----
function mockApplications() {
  return [
    {
      id: "app-1001",
      job_title: "Backend Engineer",
      company: "Nimbus Labs",
      location: "Remote (EU)",
      applied_date: "2025-09-20",
      status: "Pending",
      stage: "CV Submitted",
      relevance_score: 0.92,
      apply_url: "https://example.com/apply/backend",
      notes: "Referred by Alice. Emphasize distributed systems + Python/Go.",
      description:
        "Build scalable services (Python/Go), design APIs, optimize pipelines, collaborate with data teams."
    },
    {
      id: "app-1002",
      job_title: "Data Analyst",
      company: "Skytrail",
      location: "Paris, FR (Hybrid)",
      applied_date: "2025-09-21",
      status: "Pending",
      stage: "Screening",
      relevance_score: 0.86,
      apply_url: "https://example.com/apply/analyst",
      notes: "Ask about sponsorship timeline.",
      description:
        "Own dashboards, build SQL models, transform business questions into data insights."
    },
    {
      id: "app-1003",
      job_title: "Frontend Developer",
      company: "Voltify",
      location: "Berlin, DE",
      applied_date: "2025-09-24",
      status: "Pending",
      stage: "Recruiter Call",
      relevance_score: 0.81,
      apply_url: "https://example.com/apply/frontend=",
      notes: "Focus on performance metrics and accessibility examples.",
      description:
        "Ship accessible UI, integrate design systems, optimize for performance and developer experience."
    }
  ];
}

// ----- DOM refs -----
const appsSection = document.getElementById("appsSection");
const statusEl = document.getElementById("status");
const listEl = document.getElementById("appsList");
const emptyStateEl = document.getElementById("emptyState");
const seedBtn = document.getElementById("seedBtn");
const clearAllBtn = document.getElementById("clearAllBtn");

// ----- Storage helpers -----
function loadApps() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveApps(apps) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

// Reset with mock data
function seedMock() {
  const data = mockApplications();
  saveApps(data);
  render();
}

// Clear all
function clearAll() {
  saveApps([]);
  render();
}

// ----- Rendering -----
function setBusy(b) {
  appsSection.setAttribute("aria-busy", String(b));
  statusEl.textContent = b ? "Updating…" : "";
}

function relevanceBar(score) {
  const pct = Math.round((Number(score) || 0) * 100);
  return `
    <div style="width:100%;height:8px;border-radius:999px;background:#1a1e2a;border:1px solid rgba(231,236,245,0.08);overflow:hidden;">
      <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#7c5cff,#30e1ff);"></div>
    </div>
  `;
}

// Open application details page
function openApplicationDetails(app) {
  const key = "thunderply-application-" + app.id;
  sessionStorage.setItem(key, JSON.stringify(app));
  window.location.href = "application.html?key=" + encodeURIComponent(key);
}

// Remove application locally (used for accepted/rejected)
function removeApplication(id) {
  const apps = loadApps().filter(a => a.id !== id);
  saveApps(apps);
  return apps.length;
}

function appCard(app) {
  const card = document.createElement("article");
  card.className = "card";
  card.style.cursor = "pointer";
  card.setAttribute("tabindex", "0");
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", "View application for " + app.job_title + " at " + app.company);

  const scorePct = (Number(app.relevance_score) || 0) * 100;

  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
      <div>
        <h3 style="margin:0 0 4px 0;">${app.job_title}</h3>
        <div class="muted" style="display:flex;gap:8px;flex-wrap:wrap;">
          <span>${app.company}</span>
          <span aria-hidden="true">•</span>
          <span>${app.location}</span>
          <span aria-hidden="true">•</span>
          <span>Applied: ${app.applied_date}</span>
          ${app.stage ? "<span aria-hidden='true'>•</span><span>${app.stage}</span>" : ""}
        </div>
      </div>

      <!-- Small status pill -->
      <span class="badge" style="border-style:solid;border-color:rgba(231,236,245,0.25);">${app.status || "Pending"}</span>
    </div>

    <div style="margin:12px 0 6px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <small class="muted">Relevance</small>
        <small class="muted">${scorePct.toFixed(0)}%</small>
      </div>
      ${relevanceBar(app.relevance_score)}
    </div>

    <p class="muted" style="margin-top:10px;max-width:80ch;">
      ${(app.description || "No description.").slice(0, 220)}${(app.description || "").length > 220 ? "…" : ""}
    </p>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">
      <span style="flex:1;"></span>
      <button class="cta" data-action="accept">Accepted</button>
      <button class="ghost" data-action="reject" style="border-color:#ff5c7a;color:#ff5c7a;">Rejected</button>
    </div>
  `;

  // Click card to view (avoid when clicking on inner buttons/links)
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

  
  card.querySelector('[data-action="accept"]').addEventListener("click", async (e) => {
    e.stopPropagation();
    setBusy(true);
    try {
      // TODO: call your backend API (e.g., POST /applications/:id/accept)
      // await fetch(/api/applications/${app.id}/accept, { method: "POST" });

      removeApplication(app.id);
      render();
      statusEl.textContent = "Marked as accepted and removed: " + app.job_title + " @ " + app.company;
    } catch (err) {
      console.error(err);
      statusEl.textContent = "Could not mark as accepted. Please try again.";
    } finally {
      setBusy(false);
    }
  });
  card.querySelector('[data-action="reject"]').addEventListener("click", async (e) => {
    e.stopPropagation();
    setBusy(true);
    try {
      // TODO: call your backend API (e.g., POST /applications/:id/reject)
      // await fetch(/api/applications/${app.id}/reject, { method: "POST" });

      removeApplication(app.id);
      render();
      statusEl.textContent = "Marked as rejected and removed: " + app.job_title + " @ " + app.company;
    } catch (err) {
      console.error(err);
      statusEl.textContent = "Could not mark as rejected. Please try again.";
    } finally {
      setBusy(false);
    }
  });

  return card;
}

function render() {
  const apps = loadApps();
  listEl.innerHTML = "";
  emptyStateEl.style.display = apps.length ? "none" : "block";
  apps.forEach(app => listEl.appendChild(appCard(app)));
  statusEl.textContent = apps.length ? apps.length + " application(s)" : "No applications.";
}

// ----- Wire up -----
seedBtn.addEventListener("click", () => {
  seedMock();
  statusEl.textContent = "Mock data loaded.";
});
clearAllBtn.addEventListener("click", () => {
  clearAll();
  statusEl.textContent = "All applications cleared.";
});

// Initial load (if no data, show empty; click "Load mock data" to preview)
render();