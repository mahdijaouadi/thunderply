/* Thunderply — Job Details page
   Enhancements:
   - Editable cover letter (autosave to session for this job)
   - "Copy" cover letter to clipboard
   - "Download PDF" opens a print-ready view (use "Save as PDF")
*/

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function relevanceBar(score) {
  const pct = Math.round((Number(score) || 0) * 10); // score expected on 0..10 scale
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
  const company = job.company_name || info.company || "Unknown Company";
  const desc = info.description || "No description provided.";
  const applyUrl = job.apply_url || "#";
  const score = job.score ?? 0;

  // Suggested cover letter (allow per-job edited version)
  const jobId = job.id || info.id || "unknown";
  const coverStorageKey = `thunderply-cover-${jobId}`;
  const suggestedCover = job.cover_letter || "No suggested cover letter was returned.";
  const savedCover = sessionStorage.getItem(coverStorageKey);
  const cover = savedCover ?? suggestedCover;

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
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <h2 style="margin:0;">Suggested cover letter</h2>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="ghost" id="copyCoverBtn" title="Copy to clipboard">Copy</button>
          <button class="ghost" id="resetCoverBtn" title="Reset to suggested">Reset</button>
          <button class="btn-primary" id="downloadPdfBtn" title="Download as PDF">Download PDF</button>
        </div>
      </div>

      <!-- Editable cover letter -->
      <textarea id="coverText" rows="10" style="
        width:100%;
        margin-top:10px;
        background:#0e1017;
        border:1px solid rgba(231,236,245,0.08);
        border-radius:12px;
        padding:12px;
        overflow:auto;
        white-space:pre-wrap;
        color:#e7ecf5;
        resize:vertical;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      "></textarea>
      <small class="muted" style="display:block;margin-top:6px;">
        Tip: Edit freely. Changes are kept while this tab is open.
      </small>
    </section>

    <section style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap;">
      <a class="ghost" href="get-started.html">Back to results</a>
      <a class="cta" href="${applyUrl}" target="_blank" rel="noopener noreferrer">Apply Now</a>
    </section>
  `;

  // Wire up cover letter editing
  const ta = card.querySelector("#coverText");
  ta.value = cover;

  // Autosize on input
  const autosize = () => {
    ta.style.height = "auto";
    ta.style.height = (ta.scrollHeight + 2) + "px";
  };
  autosize();
  ta.addEventListener("input", () => {
    sessionStorage.setItem(coverStorageKey, ta.value);
    autosize();
  });

  // Copy to clipboard
  card.querySelector("#copyCoverBtn").addEventListener("click", async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(ta.value);
      } else {
        // Fallback
        ta.select();
        document.execCommand("copy");
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }
      toast("Cover letter copied.");
    } catch (e) {
      console.error(e);
      toast("Copy failed.");
    }
  });

  // Reset to suggested
  card.querySelector("#resetCoverBtn").addEventListener("click", () => {
    ta.value = suggestedCover;
    sessionStorage.setItem(coverStorageKey, ta.value);
    autosize();
    toast("Reset to suggested text.");
  });

  // Download PDF (print-friendly)
  card.querySelector("#downloadPdfBtn").addEventListener("click", () => {
    openPrintView({
      coverText: ta.value,
      title,
      company
    });
  });

  empty.style.display = "none";
  card.style.display = "block";
})();

/* ---- Utils ---- */

// Tiny toast (non-blocking feedback)
function toast(msg) {
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.cssText = `
    position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%);
    background: rgba(17,19,27,0.95); color: #e7ecf5; border: 1px solid rgba(231,236,245,0.12);
    border-radius: 10px; padding: 8px 12px; z-index: 9999; font-size: 14px;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

// Open a print-ready window; user can Save as PDF
function openPrintView({ coverText, title, company }) {
  const today = new Date().toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric"
  });

  // Escape HTML special chars, then convert newlines to <br>
  const esc = (s) => (s || "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#39;");
  const coverHTML = esc(coverText).replace(/\n/g, "<br>");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cover Letter — ${esc(company)} — ${esc(title)}</title>
  <style>
    @page { size: A4; margin: 22mm; }
    body { font: 12pt/1.5 -apple-system, system-ui, Segoe UI, Roboto, Arial, sans-serif; color: #111; }
    .letter { max-width: 720px; margin: 0 auto; }
    .hdr { display:flex; justify-content: space-between; align-items:flex-start; gap: 12px; margin-bottom: 18px; }
    .name { font-size: 18pt; font-weight: 700; }
    .muted { color: #555; }
    h1 { font-size: 14pt; margin: 0 0 8px; }
    .section { margin: 16px 0; }
    .sig { margin-top: 18px; }
    .rule { height: 1px; background: #ddd; border:0; margin: 12px 0 16px; }
  </style>
</head>
<body>
  <article class="letter">
    <div class="hdr">
      <div>
        <div class="name">Cover Letter</div>
        <div class="muted">${esc(title)} — ${esc(company)}</div>
      </div>
      <div class="muted">${today}</div>
    </div>
    <hr class="rule" />

    <div class="section">${coverHTML}</div>

    <div class="sig">
      <div class="muted">Sincerely,</div>
      <div>__________________________</div>
      <div>Your Name</div>
    </div>
  </article>

  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return alert("Pop-up blocked. Please allow pop-ups for this site.");
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
}
