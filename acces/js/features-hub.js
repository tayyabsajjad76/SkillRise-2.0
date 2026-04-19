"use strict";

// ── LOAD DASHBOARD SECTIONS ──
const dashboardSections = [
  "dashboard/home.html",
  "dashboard/roadmap.html",
  "dashboard/planner.html",
  "dashboard/quiz.html",
  "dashboard/courses.html",
  "dashboard/resources.html",
  "dashboard/interview.html",
  "dashboard/projects.html",
  "dashboard/resume.html",
  "dashboard/analytics.html",
  "dashboard/gamification.html",
  "dashboard/chat.html",
];

async function loadDashboard() {
  const content = document.getElementById("dashboardContent");
  for (const url of dashboardSections) {
    const res  = await fetch(url);
    const html = await res.text();
    const div  = document.createElement("div");
    div.innerHTML = html;
    content.appendChild(div);
  }
  initDashboard();
}

function initDashboard() {
  try {
    var user = JSON.parse(localStorage.getItem("sr_current_user") || "null");
    if (!user) { window.location.href = "index.html"; return; }

    var sbAvatar   = document.getElementById("sbAvatar");
    var sbUserName = document.getElementById("sbUserName");
    if (sbAvatar)   sbAvatar.textContent   = user.initials || user.name.charAt(0).toUpperCase();
    if (sbUserName) sbUserName.textContent = user.name;

    var topbarUserName = document.getElementById("topbarUserName");
    if (topbarUserName) topbarUserName.textContent = user.name.split(" ")[0];

    var heroUserName = document.getElementById("heroUserName");
    if (heroUserName) heroUserName.textContent = user.name.split(" ")[0];

    var chatArea = document.getElementById("chatArea");
    if (chatArea) {
      var firstMsg = chatArea.querySelector(".msg.ai");
      if (firstMsg)
        firstMsg.textContent = "👋 Hey " + user.name.split(" ")[0] + "! You're on a 14-day streak — incredible! What would you like to work on today?";
    }

    var youRow = document.querySelector(".leaderboard-row--you");
    if (youRow) {
      youRow.querySelector("span:first-child").innerHTML = "⭐ <strong>You (" + user.name.split(" ")[0] + ")</strong>";
    }

    var logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        if (confirm("Logout from Dashboard?")) { window.location.href = "index.html"; }
      });
    }

    // ── WIRE CHAT BUTTONS AFTER SECTIONS LOAD ──
    var sendBtn = document.getElementById("chatSendBtn");
    var chatInp = document.getElementById("chatInput");
    if (sendBtn) sendBtn.addEventListener("click", sendMsg);
    if (chatInp) chatInp.addEventListener("keydown", function(e) {
      if (e.key === "Enter") sendMsg();
    });
    document.querySelectorAll(".quick-btn[data-prompt]").forEach(function(btn) {
      btn.addEventListener("click", function() {
        document.getElementById("chatInput").value = btn.dataset.prompt;
        sendMsg();
      });
    });

  } catch (e) {
    window.location.href = "index.html";
  }
}

loadDashboard();

// ── PAGE INFO ──
const pageInfo = {
  home:         { t: "Dashboard Home",        s: "Welcome back 👋" },
  roadmap:      { t: "Learning Roadmap",       s: "Your personalized AI learning path" },
  planner:      { t: "Daily & Weekly Planner", s: "AI-generated tasks for today" },
  quiz:         { t: "Quiz System",            s: "Weekly knowledge check — JavaScript" },
  courses:      { t: "Course Suggestions",     s: "AI-recommended next courses" },
  resources:    { t: "Resource Assistant",     s: "Curated learning materials" },
  interview:    { t: "AI Mock Interview",      s: "Practice interview sessions — Session 6/8" },
  projects:     { t: "Projects",               s: "Real-world project workshop" },
  resume:       { t: "AI Resume Builder",      s: "Build your professional CV" },
  analytics:    { t: "Analytics",              s: "Your learning insights & progress" },
  gamification: { t: "Badges & Levels",        s: "Your achievements & leaderboard" },
  chat:         { t: "AI Mentor Chat",         s: "Your 24/7 AI companion" },
};

// ── NAVIGATION ──
function goto(id) {
  document.querySelectorAll(".section-page").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));

  const page = document.getElementById("page-" + id);
  if (page) page.classList.add("active");

  const navItem = document.querySelector(`.nav-item[data-page="${id}"]`);
  if (navItem) navItem.classList.add("active");

  const info = pageInfo[id] || { t: id, s: "" };
  document.getElementById("topbarTitle").textContent = info.t;
  document.getElementById("topbarSub").textContent   = info.s;

  if (window.innerWidth < 768) document.getElementById("sidebar").classList.remove("open");
  if (id === "analytics" && !document.getElementById("chartBars").children.length) buildChart();
  if (id === "quiz") initQuiz();
}

document.querySelectorAll(".nav-item[data-page]").forEach((item) => {
  item.addEventListener("click", () => goto(item.dataset.page));
});
document.querySelectorAll("[data-goto]").forEach((el) => {
  el.addEventListener("click", () => goto(el.dataset.goto));
});
document.getElementById("menuBtn").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});
document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "index.html";
});
document.querySelectorAll(".prog-fill[data-w]").forEach((el) => {
  el.style.width = el.getAttribute("data-w") + "%";
});

// ── TASKS ──
document.getElementById("taskList").addEventListener("click", (e) => {
  const item = e.target.closest(".task-item");
  if (!item) return;
  item.classList.toggle("done");
  item.querySelector(".task-check").innerHTML = item.classList.contains("done") ? '<i class="fa-solid fa-check"></i>' : "";
  const done  = document.querySelectorAll("#taskList .task-item.done").length;
  const total = document.querySelectorAll("#taskList .task-item").length;
  const badge = document.getElementById("taskBadge");
  if (badge) badge.textContent = done + " / " + total + " Done";
});

// ── QUIZ ──
const questions = [
  { q: "What does the `async` keyword do to a function?", opts: ["Makes it run faster", "Returns a Promise automatically", "Blocks other code", "Makes it synchronous"], ans: 1, exp: "The `async` keyword wraps the function's return value in a Promise automatically." },
  { q: "What does `await` do inside an async function?", opts: ["Delays code by 1 second", "Catches errors", "Pauses until the Promise resolves", "Runs code in background"], ans: 2, exp: "`await` pauses the async function until the awaited Promise resolves or rejects." },
  { q: "Which correctly handles a Promise error?", opts: [".error()", "try/catch or .catch()", "Promise.reject()", "async.error()"], ans: 1, exp: "Use .catch() chained to a Promise, or try/catch inside an async function." },
  { q: "What does `Promise.all()` do?", opts: ["Runs promises one by one", "Cancels all promises", "Waits for ALL promises to resolve", "Returns first resolved promise"], ans: 2, exp: "Promise.all() resolves when ALL promises in the array resolve." },
  { q: "What happens if you `await` a non-Promise value?", opts: ["Throws an error", "The value is returned as-is", "Converts to undefined", "Code stops"], ans: 1, exp: "Awaiting a non-Promise simply returns the value — treated as already resolved." },
];

let qIndex = 0, score = 0, answered = false;

function initQuiz() { qIndex = 0; score = 0; answered = false; renderQ(); }

function renderQ() {
  answered = false;
  const q = questions[qIndex];
  document.getElementById("qNum").textContent = qIndex + 1;
  document.getElementById("quizQuestion").textContent = q.q;
  const fb = document.getElementById("quizFeedback");
  fb.style.display = "none"; fb.removeAttribute("style");
  document.getElementById("nextBtn").style.display = "none";
  const opts = document.getElementById("quizOptions");
  opts.innerHTML = "";
  ["A", "B", "C", "D"].forEach((label, i) => {
    const d = document.createElement("div");
    d.className = "quiz-option";
    d.textContent = label + ". " + q.opts[i];
    d.addEventListener("click", () => pick(i, d));
    opts.appendChild(d);
  });
  updScore();
}

function pick(i, el) {
  if (answered) return;
  answered = true;
  const q = questions[qIndex];
  document.querySelectorAll(".quiz-option").forEach((o, j) => {
    if (j === q.ans) o.classList.add("correct");
    else if (j === i && i !== q.ans) o.classList.add("wrong");
  });
  if (i === q.ans) score++;
  const fb = document.getElementById("quizFeedback");
  const ok = i === q.ans;
  fb.style.cssText = `display:block;margin-top:14px;padding:12px 16px;border-radius:12px;font-size:.84rem;line-height:1.6;background:${ok ? "rgba(0,229,160,.08)" : "rgba(255,77,109,.08)"};border:1px solid ${ok ? "rgba(0,229,160,.2)" : "rgba(255,77,109,.2)"};color:${ok ? "var(--accent)" : "var(--danger)"};`;
  fb.textContent = (ok ? "✅ Correct! " : "❌ Wrong. ") + q.exp;
  if (qIndex < questions.length - 1) document.getElementById("nextBtn").style.display = "flex";
  updScore();
}

function updScore() {
  document.getElementById("quizScore").textContent = "Score: " + score + " / " + questions.length;
  const pct = Math.round((score / questions.length) * 100);
  document.getElementById("quizPct").textContent = pct + "%";
  document.getElementById("quizBar").style.width  = pct + "%";
}

document.getElementById("nextBtn").addEventListener("click", () => {
  if (qIndex < questions.length - 1) { qIndex++; renderQ(); }
});

// ── AI RESUME HELPER ──
async function generateAIResume() {
  const btn    = document.getElementById("aiResumeBtn");
  const output = document.getElementById("aiResumeSuggestions");
  if (!btn || !output) return;
  const name     = document.getElementById("rv-name")?.value     || "";
  const role     = document.getElementById("rv-role")?.value     || "";
  const skills   = document.getElementById("rv-skills")?.value   || "";
  const edu      = document.getElementById("rv-edu")?.value      || "";
  const projects = document.getElementById("rv-projects")?.value || "";
  btn.textContent = "⏳ Analyzing..."; btn.disabled = true;
  try {
    const res  = await fetch("https://skillrise-api.onrender.com/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `Review this student resume and give improvement suggestions:\nName: ${name}\nRole: ${role}\nSkills: ${skills}\nEducation: ${edu}\nProjects: ${projects}\n\nGive specific tips to make it more professional and job-ready.` }),
    });
    const data = await res.json();
    output.style.display = "block"; output.textContent = data.reply;
  } catch (err) {
    output.style.display = "block"; output.textContent = "❌ Could not analyze resume. Please try again.";
  }
  btn.textContent = "🤖 AI Improve Resume"; btn.disabled = false;
}

// ── RESUME ──
function updateResume() {
  document.getElementById("p-name").textContent    = document.getElementById("rv-name").value;
  document.getElementById("p-role").textContent    = document.getElementById("rv-role").value;
  document.getElementById("p-contact").textContent = "📧 " + document.getElementById("rv-contact").value;
  document.getElementById("p-skills").textContent  = document.getElementById("rv-skills").value;
  document.getElementById("p-edu").textContent     = document.getElementById("rv-edu").value;
  const projs = document.getElementById("rv-projects").value.split("\n").filter((l) => l.trim());
  document.getElementById("p-projects").innerHTML  = projs.map((p) => {
    const pts = p.split("—");
    return `<div class="rv-item">• <strong>${pts[0].trim()}</strong>${pts[1] ? " — " + pts[1].trim() : ""}</div>`;
  }).join("");
}
document.getElementById("resumeUpdateBtn").addEventListener("click", updateResume);
document.getElementById("resumePreviewBtn").addEventListener("click", updateResume);

// ── CHART ──
function buildChart() {
  const scores = [62, 71, 68, 75, 82, 78];
  const colors = ["#1a56ff", "#1a56ff", "#00e5a0", "#00e5a0", "#a855f7", "#a855f7"];
  const bars   = document.getElementById("chartBars");
  if (!bars) return;
  const max = Math.max(...scores);
  scores.forEach((s, i) => {
    const w = document.createElement("div");
    w.className = "bar-wrap";
    w.innerHTML = `<div class="bar-val">${s}%</div><div class="bar" style="height:${Math.round((s / max) * 120)}px;background:${colors[i]};opacity:.85;"></div>`;
    bars.appendChild(w);
  });
}

// ── CHAT ──
function addMsg(text, who) {
  const area = document.getElementById("chatArea");
  const d    = document.createElement("div");
  d.className   = "msg " + who;
  d.textContent = text;
  area.appendChild(d);
  area.scrollTop = area.scrollHeight;
}

async function sendMsg() {
  const inp = document.getElementById("chatInput");
  if (!inp || !inp.value.trim()) return;
  const userMsg = inp.value;
  addMsg(userMsg, "user");
  inp.value = "";
  addMsg("⏳ Thinking...", "ai");
  try {
    const res  = await fetch("https://skillrise-api.onrender.com/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMsg }),
    });
    const data = await res.json();
    const area = document.getElementById("chatArea");
    const msgs = area.querySelectorAll(".msg.ai");
    msgs[msgs.length - 1].remove();
    addMsg(data.reply, "ai");
  } catch (err) {
    const area = document.getElementById("chatArea");
    const msgs = area.querySelectorAll(".msg.ai");
    msgs[msgs.length - 1].remove();
    addMsg("❌ Could not reach AI. Please try again.", "ai");
  }
}

// ── AI ROADMAP ──
async function generateRoadmap() {
  const btn    = document.getElementById("generateRoadmapBtn");
  const output = document.getElementById("aiRoadmapOutput");
  if (!btn || !output) return;
  btn.textContent = "⏳ Generating..."; btn.disabled = true;
  try {
    const res  = await fetch("https://skillrise-api.onrender.com/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Generate a detailed learning roadmap for a Full Stack Developer student. Include milestones, topics, and estimated time for each. Format it clearly with steps." }),
    });
    const data = await res.json();
    output.style.display = "block"; output.textContent = data.reply;
  } catch (err) {
    output.style.display = "block"; output.textContent = "❌ Could not generate roadmap. Please try again.";
  }
  btn.textContent = "🤖 Generate AI Roadmap"; btn.disabled = false;
}
