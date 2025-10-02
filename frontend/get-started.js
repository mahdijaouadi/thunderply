/* Thunderply — Get Started page logic (vanilla JS)
   - Click "Search Jobs" to call your backend (API_URL below).
   - Backend should return an array of jobs with fields:
       job_information (object or string),
       apply_url (string),
       relevance_score (number 0..1),
       cover_letter (string)
   - We render stacked cards. Clicking a card opens job.html with full details.
*/

// TODO: Put your API endpoint here (e.g., '/api/search')
const API_URL = "http://localhost:8328/api/v1/jobs/launch_search_jobs"; // keep empty for now as requested

// Simple dev fallback when API_URL is empty or unreachable
function mockJobs() {
  return [
    {
      id: "mock-1",
      job_information:{
      title:"Internship AI Innovation (m/w/d)",
      job_title_raw:"Internship AI Innovation (m/w/d)",
      description:"<h2>Overview</h2>\n<p><strong>About Bruker Corporation – Leader of the Post-Genomic Era</strong></p>\n<p>\\xa0</p>\n<p>Bruker is enabling scientists and engineers to make breakthrough post-genomic discoveries and develop new applications that improve the quality of human life. Bruker’s high performance scientific instruments and high value analytical and diagnostic solutions enable scientists to explore life and materials at molecular, cellular, and microscopic levels. In close cooperation with our customers, Bruker is enabling innovation, improved productivity, and customer success in post-genomic life science molecular and cell biology research, in applied and biopharma applications, in microscopy and nanoanalysis, as well as in industrial and cleantech research, and next-gen semiconductor metrology in support of AI. Bruker offers differentiated, high-value life science and diagnostics systems and solutions in preclinical imaging, clinical phenomics research, proteomics and multiomics, spatial and single-cell biology, functional structural and condensate biology, as well as in clinical microbiology and molecular diagnostics.\\xa0</p>\n<p>\\xa0</p>\n<p>For more information, please visit www.bruker.com</p>\n<p>\\xa0</p>\n<p>Bruker BioSpin, as part of the Bruker Group, is a high-tech international company and the world-leading manufacturer of comprehensive solutions in Nuclear Magnetic Resonance (NMR), Electron Paramagnetic Resonance (EPR) and Preclinical Magnetic Resonance Imaging (MRI).</p>\n<p>\\xa0</p>\n<p>We are looking for <strong>Intership AI Innovation (m/f/d)</strong> at our location in Fällanden.</p>\n<p>\\xa0</p>\n<p>This role sits at the intersection of magnetic resonance and AI, exploring how emerging algorithms and language technologies can enhance scientific workflows and user experience. Working across R&D and Market Management, you’ll turn promising concepts into small, testable prototypes and develop rigorous tests and methodologies to objectively evaluate their quality. This is a unique opportunity to apply AI expertise in a scientific setting, gain hands-on experience with cutting-edge technologies, and contribute to innovation in analytical instrumentation</p>\n<p>\\xa0</p>\n<h2>Responsibilities</h2>\n<ul>\n <li>Development of AI approaches for NMR-related workflows</li>\n <li>Delivery of PoCs prototypes</li>\n <li>Development of test methodologies for benchmarking and decision making</li>\n <li>Evaluation of multiple AI technologies</li>\n <li>Communication of results to scientists and business partners</li>\n</ul>\n<h2>Qualifications</h2>\n<ul>\n <li>Bachelor or Master degree in Computer Science, Data Science, Chemistry, Physics, Engineering or related field</li>\n <li>No prior experience required</li>\n <li>Python (scientific setting, advanced)</li>\n <li>AI knowledge and know-how</li>\n <li>Any exposure to NMR or analytical chemistry is a plus</li>\n <li>Curiosity and willingness to learn, be proactive</li>\n</ul>\n<p><strong>What You Can Expect</strong></p>\n<ul>\n <li>A forward-thinking and diverse company with modern workplaces and workshops</li>\n <li>An exciting challenge in a technically leading, internationally active company with diverse development opportunities</li>\n <li>5 weeks of vacation and additional days off</li>\n <li>Flexible working hours with a 40.5-hour workweek and the option for 2 days of home office</li>\n <li>Free parking garage and coverage of the SBB Half-Fare travelcard</li>\n <li>Support for well-being and health through various initiatives (e.g., Employee Assistance Program by Lyra, in-house fitness studio, massage and physiotherapy services)</li>\n <li>Attractive social benefits and insurance coverage</li>\n <li>Excellent staff restaurant with freshly prepared and healthy meals daily</li>\n <li>Workplace located in a recreational area (Greifensee)</li>\n</ul>",
      viewedByUsers:[
         "KD2pigu5oeNc7y2iIZAwhzUM5Vp1"
      ]
      },
      apply_url: "https://example.com/apply/backend-engineer",
      relevance_score: 0.92,
      cover_letter:
        "Dear Hiring Manager,\n\nI’m excited about the Backend Engineer role at Nimbus Labs..."
    },
    {
      id: "mock-2",
      job_information: {
        title: "Data Analyst",
        company: "Skytrail",
        location: "Paris, FR (Hybrid)",
        employment_type: "Full-time",
        salary: "€45k–€60k",
        description: "Own dashboards, build SQL models, and translate business questions into insights."
      },
      apply_url: "https://example.com/apply/data-analyst",
      relevance_score: 0.86,
      cover_letter:
        "Hello Skytrail Team,\n\nI’ve worked extensively with SQL, Python, and BI tools..."
    },
    {
      id: "mock-3",
      job_information: {
        title: "Frontend Developer",
        company: "Voltify",
        location: "Berlin, DE",
        employment_type: "Contract",
        salary: "€400–€500/day",
        description: "Ship accessible UI in modern JS, integrate design systems, and improve performance."
      },
      apply_url: "https://example.com/apply/frontend-developer",
      relevance_score: 0.81,
      cover_letter:
        "Dear Voltify,\n\nAs a UI-focused engineer, I care about performance and DX..."
    }
  ];
}

// Elements
const searchBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearBtn");
const resultsEl = document.getElementById("results");
const statusEl = document.getElementById("status");
const sectionEl = document.getElementById("resultsSection");

// Helpers
function setBusy(isBusy) {
  sectionEl.setAttribute("aria-busy", String(isBusy));
  statusEl.textContent = isBusy ? "Searching jobs..." : "";
}

function clearResults() {
  resultsEl.innerHTML = "";
  statusEl.textContent = "";
}

function relevanceBar(score) {
  const pct = Math.round((Number(score) || 0) * 10);
  // Simple bar using a gradient background; no extra CSS needed
  return `
    <div style="width:100%;height:8px;border-radius:999px;background:#1a1e2a;border:1px solid rgba(231,236,245,0.08);overflow:hidden;">
      <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#7c5cff,#30e1ff);"></div>
    </div>
  `;
}

// Renders one job card
function renderJobCard(job, idx) {
  console.log(job);
  console.log(job.job_information);
  console.log("here");
  const info = job.job_information || {};
  const title = info.title || "Untitled Role";
  const company = job.company_name || "Unknown Company";
  const score = job.score ?? 0;
  const applyUrl = job.apply_url || "#";

  // Generate a stable id (prefer backend id if provided)
  const id = job.id || "job-" + idx + "-" + Date.now();

  const card = document.createElement("article");
  card.className = "card";
  card.style.cursor = "pointer";
  card.setAttribute("tabindex", "0"); // keyboard focusable
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", "View details for " + title + " at " + company);

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
        <small class="muted">${(score * 10).toFixed(0)}%</small>
      </div>
      ${relevanceBar(score)}
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">
      <button class="btn-primary" data-role="view" data-id="${id}">View Details</button>
      <a class="ghost" href="${applyUrl}" target="_blank" rel="noopener noreferrer">Apply</a>
    </div>
  `;

  // Click whole card = view details (also keep the explicit button)
  const openDetails = () => openJobDetails(id, job);
  card.addEventListener("click", (e) => {
    // Avoid triggering when clicking on "Apply" link
    if (e.target.closest("a")) return;
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
function openJobDetails(id, jobData) {
  try {
    const key = "thunderply-job-" + id;
    sessionStorage.setItem(key, JSON.stringify(jobData));
    // Pass the key in the URL so job.html can load it
    window.location.href = "job.html?key=" + encodeURIComponent(key);
  } catch (err) {
    alert("Unable to open details (storage error).");
    console.error(err);
  }
}

// Fetch jobs from backend (or mock)
async function searchJobs() {
  clearResults();
  setBusy(true);

  try {
    let data = [];
    if (!API_URL) {
      // Dev preview without backend
      await new Promise(r => setTimeout(r, 600)); // tiny delay to mimic network
      data = mockJobs();
    } else {
      const res = await fetch(API_URL, {
        method: "POST", // or "GET" depending on your backend
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Put your query params here (skills, location, etc.)
          // e.g., skills: ["javascript","node"], location: "remote"
        })
      });
      if (!res.ok) throw new Error("API error " + res.status);
      data = await res.json();
    }

    if (!Array.isArray(data) || data.length === 0) {
      statusEl.textContent = "No jobs found.";
      return;
    }

    // Normalize keys for safer access
    data.forEach((job, idx) => renderJobCard(job, idx));
    statusEl.textContent = data.length + " job(s) found.";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Something went wrong. Please try again.";
  } finally {
    setBusy(false);
  }
}

// Wire up buttons
searchBtn.addEventListener("click", searchJobs);
clearBtn.addEventListener("click", clearResults);