"use strict";

const API = "https://skillrise-api.onrender.com";
// ── PROFILE HELPERS ──
function getCurrentUserEmail() {
  try {
    const u = JSON.parse(localStorage.getItem("sr_current_user") || "null");
    return u ? u.email : null;
  } catch { return null; }
}

async function fetchUserProfile() {
  const email = getCurrentUserEmail();
  if (!email) return null;
  try {
    const res = await fetch(`${API}/api/getProfile?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    return data;
  } catch { return null; }
}

async function saveUserProfile(profile) {
  const email = getCurrentUserEmail();
  if (!email) return;
  await fetch(`${API}/api/saveProfile`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, profile })
  });
}

async function saveUserStats(stats) {
  const email = getCurrentUserEmail();
  if (!email) return;
  await fetch(`${API}/api/saveStats`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, stats })
  });
}

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
    const user = JSON.parse(localStorage.getItem("sr_current_user") || "null");
    if (!user) { window.location.href = "index.html"; return; }

    const sbAvatar   = document.getElementById("sbAvatar");
    const sbUserName = document.getElementById("sbUserName");
    if (sbAvatar)   sbAvatar.textContent   = user.initials || user.name.charAt(0).toUpperCase();
    if (sbUserName) sbUserName.textContent = user.name;

    const topbarUserName = document.getElementById("topbarUserName");
    if (topbarUserName) topbarUserName.textContent = user.name.split(" ")[0];

    const heroUserName = document.getElementById("heroUserName");
    if (heroUserName) heroUserName.textContent = user.name.split(" ")[0];

    const chatArea = document.getElementById("chatArea");
    if (chatArea) {
      const firstMsg = chatArea.querySelector(".msg.ai");
      if (firstMsg)
        firstMsg.textContent = "👋 Hey " + user.name.split(" ")[0] + "! You're on a 14-day streak — incredible! What would you like to work on today?";
    }

    const youRow = document.querySelector(".leaderboard-row--you");
    if (youRow) {
      youRow.querySelector("span:first-child").innerHTML = "⭐ <strong>You (" + user.name.split(" ")[0] + ")</strong>";
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        if (confirm("Logout from Dashboard?")) { window.location.href = "index.html"; }
      });
    }

    // ── INIT QUIZ ──
    initQuiz();

    // ── WIRE NEXT BUTTON ──
    const nextBtn = document.getElementById("nextBtn");
    if (nextBtn) nextBtn.addEventListener("click", () => {
      if (qIndex < questions.length - 1) { qIndex++; renderQ(); }
    });

    // ── WIRE RESUME BUTTONS ──
    const resumeUpdateBtn  = document.getElementById("resumeUpdateBtn");
    const resumePreviewBtn = document.getElementById("resumePreviewBtn");
    if (resumeUpdateBtn)  resumeUpdateBtn.addEventListener("click", updateResume);
    if (resumePreviewBtn) resumePreviewBtn.addEventListener("click", updateResume);

    // ── WIRE TASK LIST ──
    const taskList = document.getElementById("taskList");
    if (taskList) taskList.addEventListener("click", (e) => {
      const item = e.target.closest(".task-item");
      if (!item) return;
      item.classList.toggle("done");
      item.querySelector(".task-check").innerHTML = item.classList.contains("done") ? '<i class="fa-solid fa-check"></i>' : "";
      const done  = document.querySelectorAll("#taskList .task-item.done").length;
      const total = document.querySelectorAll("#taskList .task-item").length;
      const badge = document.getElementById("taskBadge");
      if (badge) badge.textContent = done + " / " + total + " Done";
    });

    // ── WIRE CHAT BUTTONS ──
    const sendBtn = document.getElementById("chatSendBtn");
    const chatInp = document.getElementById("chatInput");
    if (sendBtn) sendBtn.addEventListener("click", sendMsg);
    if (chatInp) chatInp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMsg();
    });
    document.querySelectorAll(".quick-btn[data-prompt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.getElementById("chatInput").value = btn.dataset.prompt;
        sendMsg();
      });
    });

    // ── WIRE PROGRESS BARS ──
    document.querySelectorAll(".prog-fill[data-w]").forEach((el) => {
      el.style.width = el.getAttribute("data-w") + "%";
    });

    // ── WIRE QUIZ TOPIC ENTER KEY ──
    const quizTopicInp = document.getElementById("quizTopic");
    if (quizTopicInp) quizTopicInp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") generateAIQuiz();
    });

    // ── WIRE ROADMAP FIELD ENTER KEY ──
    const roadmapFieldInp = document.getElementById("roadmapField");
    if (roadmapFieldInp) roadmapFieldInp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") generateRoadmap();
    });

    // ── WIRE INTERVIEW TOPIC ENTER KEY ──
    const interviewTopicInp = document.getElementById("interviewTopic");
    if (interviewTopicInp) interviewTopicInp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") getNewInterviewQuestion();
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

// ── QUIZ (default static questions) ──
const questions = [
  { q: "What does the `async` keyword do to a function?", opts: ["Makes it run faster", "Returns a Promise automatically", "Blocks other code", "Makes it synchronous"], ans: 1, exp: "The `async` keyword wraps the function's return value in a Promise automatically." },
  { q: "What does `await` do inside an async function?", opts: ["Delays code by 1 second", "Catches errors", "Pauses until the Promise resolves", "Runs code in background"], ans: 2, exp: "`await` pauses the async function until the awaited Promise resolves or rejects." },
  { q: "Which correctly handles a Promise error?", opts: [".error()", "try/catch or .catch()", "Promise.reject()", "async.error()"], ans: 1, exp: "Use .catch() chained to a Promise, or try/catch inside an async function." },
  { q: "What does `Promise.all()` do?", opts: ["Runs promises one by one", "Cancels all promises", "Waits for ALL promises to resolve", "Returns first resolved promise"], ans: 2, exp: "Promise.all() resolves when ALL promises in the array resolve." },
  { q: "What happens if you `await` a non-Promise value?", opts: ["Throws an error", "The value is returned as-is", "Converts to undefined", "Code stops"], ans: 1, exp: "Awaiting a non-Promise simply returns the value — treated as already resolved." },
];

let aiQuestions = null;
let qIndex = 0, score = 0, answered = false;

function initQuiz() { qIndex = 0; score = 0; answered = false; aiQuestions = null; renderQ(); }

function getCurrentQuestions() { return aiQuestions || questions; }

function renderQ() {
  const q = getCurrentQuestions();
  if (!q || !q[qIndex]) return;
  answered = false;
  document.getElementById("qNum").textContent = qIndex + 1;
  document.getElementById("quizQuestion").textContent = q[qIndex].q;
  const fb = document.getElementById("quizFeedback");
  fb.style.display = "none"; fb.removeAttribute("style");
  document.getElementById("nextBtn").style.display = "none";
  const opts = document.getElementById("quizOptions");
  opts.innerHTML = "";
  ["A", "B", "C", "D"].forEach((label, i) => {
    const d = document.createElement("div");
    d.className = "quiz-option";
    d.textContent = label + ". " + q[qIndex].opts[i];
    d.addEventListener("click", () => pick(i, d));
    opts.appendChild(d);
  });
  updScore();
}

function pick(i, el) {
  if (answered) return;
  answered = true;
  const q = getCurrentQuestions();
  document.querySelectorAll(".quiz-option").forEach((o, j) => {
    if (j === q[qIndex].ans) o.classList.add("correct");
    else if (j === i && i !== q[qIndex].ans) o.classList.add("wrong");
  });
  if (i === q[qIndex].ans) score++;
  const fb = document.getElementById("quizFeedback");
  const ok = i === q[qIndex].ans;
  fb.style.cssText = `display:block;margin-top:14px;padding:12px 16px;border-radius:12px;font-size:.84rem;line-height:1.6;background:${ok ? "rgba(0,229,160,.08)" : "rgba(255,77,109,.08)"};border:1px solid ${ok ? "rgba(0,229,160,.2)" : "rgba(255,77,109,.2)"};color:${ok ? "var(--accent)" : "var(--danger)"};`;
  fb.textContent = (ok ? "✅ Correct! " : "❌ Wrong. ") + q[qIndex].exp;
  if (qIndex < q.length - 1) document.getElementById("nextBtn").style.display = "flex";
  updScore();
}

function updScore() {
  const total = getCurrentQuestions().length;
  document.getElementById("quizScore").textContent = "Score: " + score + " / " + total;
  const pct = Math.round((score / total) * 100);
  document.getElementById("quizPct").textContent = pct + "%";
  document.getElementById("quizBar").style.width  = pct + "%";
}

// ── AI QUIZ GENERATOR ──
async function generateAIQuiz() {
  const topicEl = document.getElementById("quizTopic");
  const topic   = topicEl?.value.trim() || "JavaScript";
  const btn     = document.getElementById("generateQuizBtn");
  const badge   = document.getElementById("quizTopicBadge");

  if (btn) { btn.textContent = "⏳ Generating..."; btn.disabled = true; }

  try {
    const res  = await fetch(`${API}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `Generate exactly 5 multiple choice quiz questions about "${topic}". 
Return ONLY valid JSON array, no extra text, no markdown, no backticks. Format:
[{"q":"question text","opts":["A","B","C","D"],"ans":0,"exp":"explanation"}]
ans is the index (0-3) of correct answer.` }),
    });
    const data = await res.json();
    let parsed;
    try {
      const clean = data.reply.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      const match = data.reply.match(/\[[\s\S]*\]/);
      if (match) parsed = JSON.parse(match[0]);
    }
    if (parsed && Array.isArray(parsed) && parsed.length > 0) {
      aiQuestions = parsed;
      qIndex = 0; score = 0; answered = false;
      if (badge) badge.textContent = topic;
      renderQ();
    } else {
      alert("Could not parse quiz. Try again!");
    }
  } catch (err) {
    alert("❌ Could not generate quiz. Please try again.");
  }
  if (btn) { btn.textContent = "🤖 Generate New Quiz"; btn.disabled = false; }
}

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
    const res  = await fetch(`${API}/api/chat`, {
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
    const res  = await fetch(`${API}/api/chat`, {
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

// ── AI ROADMAP (any field) ──
async function generateRoadmap() {
  const btn    = document.getElementById("generateRoadmapBtn");
  const output = document.getElementById("aiRoadmapOutput");
  const fieldEl= document.getElementById("roadmapField");
  if (!btn || !output) return;

  const field = fieldEl?.value.trim() || "Full Stack Web Development";
  if (!field) { alert("Please enter a field first!"); return; }

  btn.textContent = "⏳ Generating..."; btn.disabled = true;
  try {
    const res  = await fetch(`${API}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `Generate a detailed learning roadmap for a student who wants to become a ${field} professional. Include milestones, topics to learn, resources, and estimated time for each step. Format it clearly with numbered steps.` }),
    });
    const data = await res.json();
    output.style.display = "block"; output.textContent = data.reply;
  } catch (err) {
    output.style.display = "block"; output.textContent = "❌ Could not generate roadmap. Please try again.";
  }
  btn.textContent = "🤖 Generate AI Roadmap"; btn.disabled = false;
}

// ── AI INTERVIEW ──
async function getNewInterviewQuestion() {
  const topicEl = document.getElementById("interviewTopic");
  const topic   = topicEl?.value.trim() || "Full Stack Development";
  const qEl     = document.getElementById("interviewQuestion");
  const fb      = document.getElementById("interviewFeedback");
  const ansEl   = document.getElementById("interviewAnswer");

  if (qEl) qEl.innerHTML = "💬 <strong>Q:</strong> ⏳ Getting question...";
  if (fb)  { fb.style.display = "none"; fb.textContent = ""; }
  if (ansEl) ansEl.value = "";

  // Reset scores
  ["scoreComm", "scoreTech", "scoreConf"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "-";
  });

  try {
    const res  = await fetch(`${API}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `Generate ONE technical interview question about "${topic}". Return ONLY the question, nothing else. No numbering, no explanation.` }),
    });
    const data = await res.json();
    if (qEl) qEl.innerHTML = `💬 <strong>Q:</strong> ${data.reply}`;
  } catch (err) {
    if (qEl) qEl.innerHTML = "💬 <strong>Q:</strong> ❌ Could not get question. Try again.";
  }
}

async function submitInterviewAnswer() {
  const qEl    = document.getElementById("interviewQuestion");
  const ansEl  = document.getElementById("interviewAnswer");
  const fb     = document.getElementById("interviewFeedback");
  const fbtxt  = document.getElementById("aiFeedbackText");
  const btn    = document.getElementById("submitInterviewBtn");

  if (!ansEl?.value.trim()) { alert("Please type your answer first!"); return; }
  if (btn) { btn.textContent = "⏳ Analyzing..."; btn.disabled = true; }

  const question = qEl?.textContent || "";
  const answer   = ansEl.value;

  try {
    const res  = await fetch(`${API}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `You are a technical interviewer. The question was: "${question}"\n\nThe candidate answered: "${answer}"\n\nProvide feedback in this exact format:\nCOMMUNICATION: X/10\nTECHNICAL: X/10\nCONFIDENCE: X/10\nFEEDBACK: [detailed feedback with strengths and improvements]` }),
    });
    const data = await res.json();
    const reply = data.reply;

    // Parse scores
    const commMatch = reply.match(/COMMUNICATION:\s*(\d+)/i);
    const techMatch = reply.match(/TECHNICAL:\s*(\d+)/i);
    const confMatch = reply.match(/CONFIDENCE:\s*(\d+)/i);
    const feedMatch = reply.match(/FEEDBACK:\s*([\s\S]+)/i);

    if (commMatch) document.getElementById("scoreComm").textContent = commMatch[1] + "/10";
    if (techMatch) document.getElementById("scoreTech").textContent = techMatch[1] + "/10";
    if (confMatch) document.getElementById("scoreConf").textContent = confMatch[1] + "/10";

    if (fb) { fb.style.display = "block"; fb.textContent = feedMatch ? feedMatch[1].trim() : reply; }
    if (fbtxt) fbtxt.textContent = feedMatch ? feedMatch[1].trim() : reply;

  } catch (err) {
    if (fb) { fb.style.display = "block"; fb.textContent = "❌ Could not get feedback. Please try again."; }
  }
  if (btn) { btn.textContent = "Submit Answer"; btn.disabled = false; }
}

// ── PROJECT FUNCTIONS ──
function showProjectRequirements() {
  const req = document.getElementById("projectRequirements");
  const hint = document.getElementById("projectHint");
  if (req) {
    req.style.display = req.style.display === "none" ? "block" : "none";
    if (hint) hint.style.display = "none";
  }
}

async function getProjectHint() {
  const hint = document.getElementById("projectHint");
  const req  = document.getElementById("projectRequirements");
  if (!hint) return;
  hint.style.display = "block";
  hint.textContent   = "⏳ Getting AI hint...";
  if (req) req.style.display = "none";
  try {
    const res  = await fetch(`${API}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Give me a helpful hint for building a REST API with Node.js and Express with JWT authentication and MongoDB. Keep it concise and practical." }),
    });
    const data = await res.json();
    hint.textContent = "💡 " + data.reply;
  } catch (err) {
    hint.textContent = "❌ Could not get hint. Please try again.";
  }
}





// ── ONBOARDING ──
async function checkOnboarding() {
  const data = await fetchUserProfile();
  if (!data || !data.profile) {
    showOnboarding();
  } else {
    applyProfileToUI(data.profile, data.stats);
  }
}

function showOnboarding() {
  const overlay = document.getElementById("onboardingOverlay");
  if (overlay) overlay.style.display = "flex";
}

async function submitOnboarding() {
  const field  = document.getElementById("ob-field")?.value.trim();
  const level  = document.getElementById("ob-level")?.value;
  const hours  = document.getElementById("ob-hours")?.value;
  const goal   = document.getElementById("ob-goal")?.value.trim();
  const skills = document.getElementById("ob-skills")?.value.trim();

  if (!field) { alert("Please enter what you want to learn!"); return; }
  if (!goal)  { alert("Please enter your career goal!"); return; }

  const btn = document.getElementById("obSubmitBtn");
  const loading = document.getElementById("obLoading");
  btn.disabled = true; btn.textContent = "⏳ Generating...";
  if (loading) loading.style.display = "block";

  const profile = { field, level, hours: parseInt(hours), goal, existingSkills: skills, createdAt: new Date().toISOString() };

  // Save profile to MongoDB
  await saveUserProfile(profile);

  // Init stats
  const stats = { streak: 1, quizAvg: 0, roadmapPct: 0, projectsDone: 0, readiness: 10, lastActive: new Date().toISOString() };
  await saveUserStats(stats);

  // AI generate plan
  try {
    const res = await fetch(`${API}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `A student wants to learn ${field}. Level: ${level}. Can study ${hours} hours/day. Career goal: ${goal}. Already knows: ${skills || "nothing yet"}.
Generate a motivating 2-sentence welcome message and their top 3 immediate action steps. Keep it short and encouraging.` })
    });
    const data = await res.json();
    localStorage.setItem("sr_ai_welcome", data.reply);
  } catch(e) {}

  // Close modal, apply to UI
  document.getElementById("onboardingOverlay").style.display = "none";
  applyProfileToUI(profile, stats);
  btn.disabled = false;
  if (loading) loading.style.display = "none";
}

function applyProfileToUI(profile, stats) {
  if (!profile) return;
  const s = stats || {};

  // Update topbar readiness pill
  const readiness = s.readiness || 10;
  const pill = document.querySelector(".ready-pill");
  if (pill) pill.innerHTML = `<div class="pulse"></div>${readiness}% Job Ready`;

  // Update streak in sidebar
  const streakVal = document.querySelector(".streak-val");
  if (streakVal) streakVal.textContent = (s.streak || 1) + " days";

  // Update home stats cards
  const statVals = document.querySelectorAll(".s-val");
  if (statVals[0]) statVals[0].textContent = readiness + "%";
  if (statVals[1]) statVals[1].textContent = (s.streak || 1) + " 🔥";
  if (statVals[2]) statVals[2].textContent = (s.quizAvg || 0) + "%";
  if (statVals[3]) statVals[3].textContent = (s.projectsDone || 0);

  // Update hero text
  const heroP = document.querySelector(".home-hero p");
  if (heroP) heroP.textContent = `Learning ${profile.field} · Goal: ${profile.goal}`;

  // Update roadmap card
  const roadmapCard = document.querySelector(".card:first-child p");
  if (roadmapCard) roadmapCard.textContent = `${profile.field} roadmap · ${s.roadmapPct || 0}% complete`;

  // Show AI welcome if exists
  const aiWelcome = localStorage.getItem("sr_ai_welcome");
  if (aiWelcome) {
    const heroGlow = document.querySelector(".home-hero-glow");
    if (heroGlow) {
      const tip = document.createElement("div");
      tip.style.cssText = "margin-top:12px;padding:12px 16px;background:rgba(0,229,160,0.08);border:1px solid rgba(0,229,160,0.2);border-radius:12px;font-size:0.84rem;color:#00e5a0;line-height:1.6;";
      tip.textContent = "🤖 " + aiWelcome;
      document.querySelector(".home-hero").appendChild(tip);
      localStorage.removeItem("sr_ai_welcome");
    }
  }

  // Update nav roadmap badge
  const roadmapBadge = document.querySelector(".nav-item[data-page='roadmap'] .nav-badge");
  if (roadmapBadge) roadmapBadge.textContent = (s.roadmapPct || 0) + "%";
}
