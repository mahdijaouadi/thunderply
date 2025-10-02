/* Thunderply — Job Details page
   - Reads ?key=... from URL (sessionStorage key)
   - Renders full job details: info, relevance score, cover letter, and apply link
*/

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }
  
  function relevanceBar(score) {
    const pct = Math.round((Number(score) || 0) * 10);
    return `
      <div style="width:100%;height:8px;border-radius:999px;background:#1a1e2a;border:1px solid rgba(231,236,245,0.08);overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#7c5cff,#30e1ff);"></div>
      </div>
    `;
  }
  
  (function init() {
    const key = getQueryParam("key");
    const empty = document.getElementById("emptyState");
    const card = document.getElementById("jobContainer");
  
    if (!key) {
      empty.textContent = "Missing job reference. Return to results and try again.";
      return;
    }
  
    let job;
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) throw new Error("No job found in sessionStorage");
      job = JSON.parse(raw);
    } catch (e) {
      console.error(e);
      empty.textContent = "Could not load job details. Return to results and try again.";
      return;
    }
  
    const info = job.job_information || {};
    const title = info.title || "Untitled Role";
    const company = job.company_name || "Unknown Company";
    const desc = info.description || "No description provided.";
    const applyUrl = job.apply_url || "#";
    const score = job.score ?? 0;
    const cover = job.cover_letter || "No suggested cover letter was returned.";
  
    card.innerHTML = `
      <header style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
        <div>
          <h1 style="margin:0 0 6px 0;">${title}</h1>
          <div class="muted" style="display:flex;gap:8px;flex-wrap:wrap;">
            <span>${company}</span>
          </div>
        </div>
        <a class="cta" href="${applyUrl}" target="_blank" rel="noopener noreferrer">Apply</a>
      </header>
  
      <section style="margin:16px 0 10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <strong>Relevance</strong>
          <span class="muted">${(score * 10).toFixed(0)}%</span>
        </div>
        ${relevanceBar(score)}
      </section>
  
      <section style="margin:18px 0;">
        <h2 style="margin:0 0 6px;">About the role</h2>
        <p class="muted" style="margin:0;white-space:pre-wrap;">${desc}</p>
      </section>
  
      <section style="margin:18px 0;">
        <h2 style="margin:0 0 6px;">Suggested cover letter</h2>
        <pre style="
          background:#0e1017;border:1px solid rgba(231,236,245,0.08);
          border-radius:12px;padding:12px;overflow:auto;white-space:pre-wrap;
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          color:#e7ecf5;">${cover}</pre>
      </section>
  
      <section style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap;">
        <a class="ghost" href="get-started.html">Back to results</a>
        <a class="cta" href="${applyUrl}" target="_blank" rel="noopener noreferrer">Apply Now</a>
      </section>
    `;
  
    empty.style.display = "none";
    card.style.display = "block";
  })();