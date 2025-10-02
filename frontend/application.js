/* Thunderply — Application Details
   - Reads ?key=... from URL (sessionStorage key set by dashboard)
   - Renders job/application info + quick actions
*/

function getParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }
  
  function relevanceBar(score) {
    const pct = Math.round((Number(score) || 0) * 100);
    return `
      <div style="width:100%;height:8px;border-radius:999px;background:#1a1e2a;border:1px solid rgba(231,236,245,0.08);overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#7c5cff,#30e1ff);"></div>
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
  
    const scorePct = (Number(app.relevance_score) || 0) * 100;
  
    card.innerHTML = `
      <header style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
        <div>
          <h1 style="margin:0 0 6px 0;">${app.job_title}</h1>
          <div class="muted" style="display:flex;gap:8px;flex-wrap:wrap;">
            <span>${app.company}</span>
            <span aria-hidden="true">•</span>
            <span>${app.location}</span>
            <span aria-hidden="true">•</span>
            <span>Applied: ${app.applied_date || "—"}</span>
            ${app.stage ? "<span aria-hidden='true'>•</span><span>${app.stage}</span>" : ""}
            ${app.status ? "<span aria-hidden='true'>•</span><span>${app.status}</span>" : ""}
          </div>
        </div>
        <a class="cta" href="${app.apply_url || "#"}" target="_blank" rel="noopener noreferrer">Apply</a>
      </header>
  
      <section style="margin:16px 0 10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <strong>Relevance</strong>
          <span class="muted">${scorePct.toFixed(0)}%</span>
        </div>
        ${relevanceBar(app.relevance_score)}
      </section>
  
      <section style="margin:18px 0;">
        <h2 style="margin:0 0 6px;">Role summary</h2>
        <p class="muted" style="margin:0;white-space:pre-wrap;">${app.description || "No description provided."}</p>
      </section>
  
      <section style="margin:18px 0;">
        <h2 style="margin:0 0 6px;">Notes</h2>
        <pre style="
          background:#0e1017;border:1px solid rgba(231,236,245,0.08);
          border-radius:12px;padding:12px;overflow:auto;white-space:pre-wrap;
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          color:#e7ecf5;">${app.notes || "—"}</pre>
      </section>
  
      <section style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap;">
        <a class="ghost" href="dashboard.html">Back to dashboard</a>
        <a class="cta" href="${app.apply_url || "#"}" target="_blank" rel="noopener noreferrer">Apply Now</a>
      </section>
    `;
  
    empty.style.display = "none";
    card.style.display = "block";
  })();