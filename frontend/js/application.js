/* Thunderply — Application Details (backend-powered)
   - Expects an item { id, job, cover_letter, applied_at } in sessionStorage
   - Renders job + application info
*/

function getParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function relevanceBar(score) {
  // score may be 0..1, 0..10, or already %
  const n = Number(score) || 0;
  const pct = n <= 1 ? Math.round(n * 100) : (n <= 10 ? Math.round(n * 10) : Math.round(n));
  return `
    <div style="width:100%;height:8px;border-radius:999px;background:#1a1e2a;border:1px solid rgba(231,236,245,0.08);overflow:hidden;">
      <div style="height:100%;width:${Math.max(0, Math.min(100, pct))}%;background:linear-gradient(90deg,#7c5cff,#30e1ff);"></div>
    </div>
  `;
}

(function init() {
  const key = getParam("key");
  const empty = document.getElementById("emptyState");
  const card = document.getElementById("appContainer");

  if (!key) {
    empty.textContent = "Missing application reference. Return to the dashboard and try again.";
    return;
  }

  let app;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) throw new Error("No application found in sessionStorage");
    app = JSON.parse(raw);
  } catch (e) {
    console.error(e);
    empty.textContent = "Could not load application details. Return to the dashboard and try again.";
    return;
  }

  // Map fields
  const j = app.job || {};
  const info = j.job_information || {};
  const title = info.title || j.title || "Untitled Role";
  const company = j.company_name || info.company || "Unknown Company";
  const location = info.location || j.location || "—";
  const desc = info.description || j.description || "No description provided.";
  const applyUrl = j.apply_url || "#";
  const score = j.relevance_score ?? j.score ?? 0;
  const cover = app.cover_letter || "—";

  const appliedDate = (() => {
    try {
      if (!app.applied_at) return "—";
      const d = new Date(app.applied_at);
      if (Number.isNaN(d.getTime())) return "—";
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    } catch {
      return "—";
    }
  })();

  card.innerHTML = `
    <header style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
      <div>
        <h1 style="margin:0 0 6px 0;">${title}</h1>
        <div class="muted" style="display:flex;gap:8px;flex-wrap:wrap;">
          <span>${company}</span>
          <span aria-hidden="true">•</span>
          <span>${location}</span>
          <span aria-hidden="true">•</span>
          <span>Applied: ${appliedDate}</span>
        </div>
      </div>
    </header>

    <section style="margin:16px 0 10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <strong>Relevance</strong>
        <span class="muted">${(Number(score) <= 1 ? Math.round(score * 100) : (Number(score) <= 10 ? Math.round(score * 10) : Math.round(score)))}%</span>
      </div>
      ${relevanceBar(score)}
    </section>

    <section style="margin:18px 0;">
      <h2 style="margin:0 0 6px;">Role summary</h2>
      <p class="muted" style="margin:0;white-space:pre-wrap;">${desc}</p>
    </section>

    <section style="margin:18px 0;">
      <h2 style="margin:0 0 6px;">Saved cover letter</h2>
      <pre style="
        background:#0e1017;border:1px solid rgba(231,236,245,0.08);
        border-radius:12px;padding:12px;overflow:auto;white-space:pre-wrap;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        color:#e7ecf5;">${cover}</pre>
    </section>

    <section style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap;">
      <a class="ghost" href="dashboard.html">Back to dashboard</a>
      <a class="cta" href="${applyUrl}" target="_blank" rel="noopener noreferrer">Apply Now</a>
    </section>
  `;

  empty.style.display = "none";
  card.style.display = "block";
})();
