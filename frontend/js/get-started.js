/* Thunderply — Get Started page logic (vanilla JS)
   New workflow:
   - On page load: fetch latest results from MongoDB (LATEST_RESULTS_URL) and render.
   - On "Search Jobs": call launch endpoint (LAUNCH_SEARCH_URL), then load latest results again.
   - Extra: "Refresh" button to manually reload Mongo latest results.
   - Fallback to mock data if endpoints are empty or fail.
*/

// --- Configure your endpoints here ---
const LAUNCH_SEARCH_URL = "http://localhost:8328/api/v1/jobs/launch_search_jobs"; // POST to trigger a new search
const LATEST_RESULTS_URL = "http://localhost:8328/api/v1/jobs/latest_results";    // GET to fetch last saved results (Mongo)
const CLEAR_RESULTS_URL= "http://localhost:8328/api/v1/jobs/clear_latest_results" // POST
const USE_MOCK = !LAUNCH_SEARCH_URL || !LATEST_RESULTS_URL;

// --- DOM elements ---
const searchBtn  = document.getElementById("searchBtn");
const refreshBtn = document.getElementById("refreshBtn");
const clearBtn   = document.getElementById("clearBtn");
const resultsEl  = document.getElementById("results");
const statusEl   = document.getElementById("status");
const sectionEl  = document.getElementById("resultsSection");

// --- Helpers ---
async function setBusy(isBusy, message = "") {
  sectionEl.setAttribute("aria-busy", String(isBusy));
  statusEl.textContent = message;
}

async function clearResults() {
  const res = await fetch(CLEAR_RESULTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  resultsEl.innerHTML = "";
  statusEl.textContent = "";
}

// Normalize relevance score to a percentage (supports 0..1 or 0..10 or already-percent)
async function toPercent(score) {
  const n = Number(score) || 0;
  if (n <= 1)   return Math.round(n * 100);  // 0..1
  if (n <= 10)  return Math.round(n * 10);   // 0..10
  if (n <= 100) return Math.round(n);        // already a %
  return 100;
}

async function relevanceBar(score) {
  const pct = toPercent(score);
  return `
    <div style="width:100%;height:8px;border-radius:999px;background:#1a1e2a;border:1px solid rgba(231,236,245,0.08);overflow:hidden;">
      <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#7c5cff,#30e1ff);"></div>
    </div>
  `;
}

// Renders one job card
async function renderJobCard(job, idx) {
  const info    = job.job_information || {};
  const title   = info.title || job.title || "Untitled Role";
  const company = info.company || job.company_name || job.company || "Unknown Company";
  const applyUrl = job.apply_url || info.apply_url || "#";
  const score    = job.relevance_score ?? job.score ?? 0;

  // Generate a stable id (prefer backend id if provided)
  const id = job.id || info.id || `job-${idx}-${Date.now()}`;

  const card = document.createElement("article");
  card.className = "card";
  card.style.cursor = "pointer";
  card.setAttribute("tabindex", "0"); // keyboard focusable
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `View details for ${title} at ${company}`);

  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
      <div>
        <h3 style="margin:0 0 4px 0;">${title}</h3>
        <div class="muted" style="display:flex;gap:8px;flex-wrap:wrap;">
          <span>${company}</span>
        </div>
      </div>

      <a class="ghost" href="${applyUrl}" target="_blank" rel="noopener noreferrer" title="Apply (opens new tab)">Apply</a>
    </div>

    <div style="margin:12px 0 6px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <small class="muted">Relevance score</small>
        <small class="muted">${toPercent(score)}%</small>
      </div>
      ${relevanceBar(score)}
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">
      <button class="btn-primary" data-role="view" data-id="${id}">View Details</button>
      <a class="ghost" href="${applyUrl}" target="_blank" rel="noopener noreferrer">Apply</a>
    </div>
  `;

  // Open details (card click or button)
  const openDetails = () => openJobDetails(id, job);
  card.addEventListener("click", (e) => {
    if (e.target.closest("a,button")) return;
    openDetails();
  });
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDetails();
    }
  });
  card.querySelector('[data-role="view"]').addEventListener("click", (e) => {
    e.stopPropagation();
    openDetails();
  });

  resultsEl.appendChild(card);
}

// Save to sessionStorage and route to job.html
async function openJobDetails(id, jobData) {
  try {
    const key = `thunderply-job-${id}`;
    sessionStorage.setItem(key, JSON.stringify(jobData));
    window.location.href = `job.html?key=${encodeURIComponent(key)}`;
  } catch (err) {
    alert("Unable to open details (storage error).");
    console.error(err);
  }
}

// --- Data loaders ---
// Load latest results from MongoDB
async function loadLatestResults({announce = true} = {}) {
  // clearResults();
  await setBusy(true, announce ? "Loading your latest results…" : "");

  try {
    let data = [];

    if (USE_MOCK) {
      // Fallback preview without backend
      await new Promise(r => setTimeout(r, 400));
      data = mockJobs();
    } else {
      const res = await fetch(LATEST_RESULTS_URL, { method: "GET" });
      if (!res.ok) throw new Error(`Latest-results API error ${res.status}`);
      data = await res.json();
    }

    if (!Array.isArray(data) || data.length === 0) {
      statusEl.textContent = "No recent results yet.";
      return;
    }

    data.forEach((job, idx) => renderJobCard(job, idx));
    statusEl.textContent = `${data.length} job(s) loaded from your latest results.`;
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Could not load latest results.";
  } finally {
    await setBusy(false);
  }
}

// Trigger a fresh search on the backend, then reload from Mongo
async function runSearchAndReload() {
  await setBusy(true, "Searching jobs…");

  try {
    if (USE_MOCK) {
      // Simulate a launch search call
      await new Promise(r => setTimeout(r, 600));
    } else {
      const res = await fetch(LAUNCH_SEARCH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error(`Launch-search API error ${res.status}`);
      // Optionally: await res.json(); // if your API returns metadata
    }

    // Immediately reload from Mongo (you can add polling if your search is async/queued)
    statusEl.textContent = "Refreshing results…";
    await loadLatestResults({announce: false});
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Search failed. Please try again.";
  } finally {
    await setBusy(false);
  }
}

// --- Mock data (same shape you’re using) ---
async function mockJobs() {
  return [
    {
      id: "mock-1",
      job_information: {
        title: "Internship AI Innovation (m/w/d)",
        job_title_raw: "Internship AI Innovation (m/w/d)",
        description: "Exploring algorithms and language tech to enhance scientific workflows."
      },
      company_name: "Bruker BioSpin",
      apply_url: "https://example.com/apply/ai-intern",
      score: 9.2, // 0..10 supported
      relevance_score: undefined,
      cover_letter: "Dear Hiring Manager, …"
    },
    {
      id: "mock-2",
      job_information: {
        title: "Data Analyst",
        company: "Skytrail",
        location: "Paris, FR (Hybrid)",
        employment_type: "Full-time",
        salary: "€45k–€60k",
        description: "Build SQL models, BI dashboards, and generate insights."
      },
      apply_url: "https://example.com/apply/data-analyst",
      score: 8.6
    },
    {
      id: "mock-3",
      job_information: {
        title: "Frontend Developer",
        company: "Voltify",
        location: "Berlin, DE",
        employment_type: "Contract",
        salary: "€400–€500/day",
        description: "Ship accessible UI in modern JS and optimize performance."
      },
      apply_url: "https://example.com/apply/frontend-developer",
      score: 8.1
    }
  ];
}

// --- Wire up ---
document.addEventListener("DOMContentLoaded", async () => {
  await loadLatestResults();
});

searchBtn.addEventListener("click", async () => await runSearchAndReload);
refreshBtn.addEventListener("click", async () => await loadLatestResults({announce: true}));
clearBtn.addEventListener("click", async () =>  await clearResults);
