/* Thunderply — Job Details page (direct PDF download)
   - Editable cover letter (autosave to session for this job)
   - Copy to clipboard
   - Download a real PDF named "cover_letter.pdf" using pdf-lib (loaded on demand)
*/
const SAVE_APPLICATION_URL  = "http://localhost:8328/api/v1/jobs/save_application"; // POST

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function relevanceBar(score) {
  const pct = Math.round((Number(score) || 0) * 10); // score expected on 0..10
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
      <div class="letter-actions">
        <h2 style="margin:0;">Suggested cover letter</h2>
        <div class="letter-actions__buttons">
          <button class="ghost" id="copyCoverBtn" title="Copy to clipboard">Copy</button>
          <button class="ghost" id="resetCoverBtn" title="Reset to suggested">Reset</button>
          <button class="btn-primary" id="downloadPdfBtn" title="Download as PDF">Download PDF</button>
        </div>
      </div>

      <!-- Editable cover letter -->
      <textarea id="coverText" class="letter-editor" placeholder="Write or edit your cover letter here..."></textarea>
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

  // Autosize on input + good default height
  const autosize = () => {
    ta.style.height = "auto";
    ta.style.height = Math.max(ta.scrollHeight + 2, 320) + "px"; // never below 320px
  };
  autosize();
  ta.addEventListener("input", () => {
    sessionStorage.setItem(coverStorageKey, ta.value);
    autosize();
  });
  window.addEventListener("resize", autosize);

  // Copy to clipboard
  card.querySelector("#copyCoverBtn").addEventListener("click", async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(ta.value);
      } else {
        ta.select(); document.execCommand("copy");
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

  // Download PDF (real file named cover_letter.pdf)
  card.querySelector("#downloadPdfBtn").addEventListener("click", async () => {
    try {
      await buildAndDownloadPdf({
        coverText: ta.value,
        title,
        company,
        fileName: "cover_letter.pdf"
      });
      toast("Downloading cover_letter.pdf…");
    } catch (e) {
      console.error(e);
      toast("Download failed.");
    }
  });

  empty.style.display = "none";
  card.style.display = "block";
})();

/* -------- PDF generation (client-side) -------- */

// Load pdf-lib on demand (no frameworks)
async function ensurePdfLib() {
  if (window.PDFLib) return window.PDFLib;
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Failed to load pdf-lib"));
    document.head.appendChild(s);
  });
  return window.PDFLib;
}

async function buildAndDownloadPdf({ coverText, title, company, fileName = "cover_letter.pdf" }) {
  const { PDFDocument, StandardFonts, rgb } = await ensurePdfLib();

  const pdfDoc = await PDFDocument.create();
  const times = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // A4 page
  let page = pdfDoc.addPage([595.28, 841.89]);
  let { width, height } = page.getSize();
  const margin = 56; // ~0.78in
  let y = height - margin;

  // Header
  const headerSize = 18;
  page.drawText("Cover Letter", { x: margin, y, size: headerSize, font: timesBold, color: rgb(0, 0, 0) });
  y -= headerSize + 6;

  const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const subline = `${title} — ${company}`;
  const subSize = 12;
  page.drawText(subline, { x: margin, y, size: subSize, font: times, color: rgb(0.3, 0.3, 0.3) });
  const dateWidth = times.widthOfTextAtSize(today, subSize);
  page.drawText(today, { x: width - margin - dateWidth, y, size: subSize, font: times, color: rgb(0.3, 0.3, 0.3) });
  y -= 18;

  // Body
  const bodySize = 12;
  const lineGap = 14;
  const maxWidth = width - margin * 2;

  const paragraphs = (coverText || "").replace(/\r\n/g, "\n").split("\n");
  for (const para of paragraphs) {
    const lines = wrapText(para, times, bodySize, maxWidth);
    for (const line of lines) {
      if (y < margin + bodySize) {
        page = pdfDoc.addPage([595.28, 841.89]);
        ({ width, height } = page.getSize());
        y = height - margin;
      }
      page.drawText(line, { x: margin, y, size: bodySize, font: times, color: rgb(0, 0, 0) });
      y -= lineGap;
    }
    y -= lineGap * 0.5; // paragraph spacing
  }

  // Signature block
  if (y < margin + lineGap * 3) {
    page = pdfDoc.addPage([595.28, 841.89]);
    ({ width, height } = page.getSize());
    y = height - margin;
  }

  // Save + download with explicit filename
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName; // <-- exact file name
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Simple word-wrap for pdf-lib text
function wrapText(text, font, size, maxWidth) {
  if (!text) return [""];
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";

  for (const word of words) {
    const proposal = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(proposal, size) <= maxWidth) {
      line = proposal;
    } else {
      if (line) lines.push(line);
      // If the word itself is longer than the max width, hard-break it
      if (font.widthOfTextAtSize(word, size) > maxWidth) {
        let buf = "";
        for (const ch of word) {
          const test = buf + ch;
          if (font.widthOfTextAtSize(test, size) > maxWidth) {
            if (buf) lines.push(buf);
            buf = ch;
          } else {
            buf = test;
          }
        }
        if (buf) {
          line = buf; // start next line with remainder
        } else {
          line = "";
        }
      } else {
        line = word;
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

/* -------- UI helpers -------- */

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
