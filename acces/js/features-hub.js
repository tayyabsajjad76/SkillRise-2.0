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
    checkOnboarding();
 
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
  if (id === "analytics") autoLoadAnalytics();
  if (id === "gamification") autoLoadGamification();
  if (id === "quiz") autoLoadQuiz();
  if (id === "roadmap") autoLoadRoadmap();
  if (id === "planner") autoLoadPlanner();
  if (id === "resources") autoLoadResources();
  if (id === "courses") autoLoadCourses();
  if (id === "projects") autoLoadProjects();
  if (id === "interview") autoLoadInterview();
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
let currentQuizTopic = "General";
 
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
  // Save when last question answered
  if (answered && qIndex === total - 1) {
    saveQuizResult(currentQuizTopic, pct);
  }
}
 
// ── AI QUIZ GENERATOR ──
async function autoLoadQuiz() {
  const quizOptions = document.getElementById("quizOptions");
  if (quizOptions?.dataset.generated === "1") { loadQuizStats(); return; }
  const data = await fetchUserProfile();
  const profile = data?.profile;
  if (!profile?.field) { initQuiz(); return; }
  const topicEl = document.getElementById("quizTopic");
  if (topicEl && !topicEl.value.trim()) topicEl.value = profile.field;
  const desc = document.getElementById("quizDesc");
  if (desc) desc.textContent = `AI-generated quiz based on your ${profile.field} learning path.`;
  loadQuizStats();
  initQuiz();
  await generateAIQuiz();
  if (quizOptions) quizOptions.dataset.generated = "1";
}
 
function loadQuizStatsFromProfile(profile) {
  const history = Array.isArray(profile?.quizHistory) ? profile.quizHistory : [];
  const countEl = document.getElementById("statCount");
  const avgEl   = document.getElementById("statAvg");
  const lastEl  = document.getElementById("statLastQuiz");
  const pastEl  = document.getElementById("pastQuizzesList");
  if (countEl) countEl.textContent = history.length;
  if (history.length > 0) {
    const avg = Math.round(history.reduce((s,q) => s+q.pct, 0) / history.length);
    if (avgEl) avgEl.textContent = avg + "%";
    if (lastEl) lastEl.textContent = history[history.length-1].pct + "%";
    if (pastEl) {
      const recent = history.slice(-5).reverse();
      pastEl.innerHTML = recent.map(q => {
        const cls = q.pct>=80 ? "val-accent" : q.pct>=60 ? "val-warn" : "val-danger";
        return `<div class="past-quiz-row"><span>${q.topic}</span><span class="${cls}">${q.pct}%</span></div>`;
      }).join("");
    }
  }
}
 
async function loadQuizStats() {
  const data = await fetchUserProfile();
  loadQuizStatsFromProfile(data?.profile);
}
 
async function generateAIQuiz() {
  const topicEl = document.getElementById("quizTopic");
  const data    = await fetchUserProfile();
  const profile = data?.profile;
  const topic   = topicEl?.value.trim() || profile?.field || "General Knowledge";
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
    const resp = await res.json();
    let parsed;
    try {
      const clean = resp.reply.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      const match = resp.reply.match(/\[[\s\S]*\]/);
      if (match) parsed = JSON.parse(match[0]);
    }
    if (parsed && Array.isArray(parsed) && parsed.length > 0) {
      aiQuestions = parsed;
      qIndex = 0; score = 0; answered = false;
      currentQuizTopic = topic;
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
 
async function saveQuizResult(topic, pct) {
  const profileData = await fetchUserProfile();
  const profile = profileData?.profile || {};
  const history = Array.isArray(profile.quizHistory) ? profile.quizHistory : [];
  history.push({ topic, pct, date: new Date().toISOString() });
  if (history.length > 20) history.shift();
  profile.quizHistory = history;
  await saveUserProfile(profile);
  loadQuizStatsFromProfile(profile);
  addXP(XP_PER_QUIZ, "quiz");
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
 
// ── XP SYSTEM ──
const XP_PER_QUIZ      = 50;
const XP_PER_ROADMAP   = 100;
const XP_PER_COURSE    = 150;
 
const LEVEL_THRESHOLDS = [0,1000,2000,3500,5000,7000,9500,12500,16000,20000,25000];
const LEVEL_NAMES      = ["Newcomer","Curious Learner","Rising Star","Skill Builder","Achiever","Expert","Pro","Master","Legend","Elite","Grandmaster"];
 
function calcXP(profile) {
  const quizHistory    = Array.isArray(profile?.quizHistory)    ? profile.quizHistory    : [];
  const courseProgress = typeof profile?.courseProgress === "object" && profile.courseProgress ? profile.courseProgress : {};
  const completedRoadmap = Array.isArray(profile?.completedSkills) ? profile.completedSkills : [];
  const quizXP   = quizHistory.length * XP_PER_QUIZ;
  const roadXP   = completedRoadmap.length * XP_PER_ROADMAP;
  const courseXP = Object.values(courseProgress).filter(v => v >= 100).length * XP_PER_COURSE;
  return quizXP + roadXP + courseXP;
}
 
function calcLevel(xp) {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }
  return Math.min(level, LEVEL_THRESHOLDS.length);
}
 
function addXP(amount, reason) {
  // XP is calculated dynamically from actions — no separate store needed
  // But we fire a visual notification
  const pill = document.querySelector(".ready-pill");
  if (pill) {
    const note = document.createElement("span");
    note.textContent = "+" + amount + " XP";
    note.style.cssText = "margin-left:8px;color:#f0a500;font-weight:700;font-size:0.8rem;";
    pill.appendChild(note);
    setTimeout(() => note.remove(), 2000);
  }
}
 
// ── ANALYTICS ──
async function autoLoadAnalytics() {
  const data    = await fetchUserProfile();
  const profile = data?.profile || {};
  // sync course progress cache
  if (profile.courseProgress) _courseProgressCache = profile.courseProgress;
  buildRealChart(profile);
  buildSkillMastery(profile);
  buildAnalyticsStats(profile);
}
 
function buildRealChart(profile) {
  const bars       = document.getElementById("chartBars");
  const labels     = document.getElementById("chartLabels");
  const countBadge = document.getElementById("aQuizCount");
  if (!bars) return;
  bars.innerHTML = "";
  if (labels) labels.innerHTML = "";
 
  const history = Array.isArray(profile?.quizHistory) ? profile.quizHistory : [];
  if (history.length === 0) {
    bars.innerHTML = `<div style="color:#8892b0;font-size:0.85rem;padding:20px 0;">No quiz data yet. Take a quiz first!</div>`;
    if (countBadge) countBadge.textContent = "0 quizzes";
    return;
  }
 
  const recent = history.slice(-6);
  const max    = Math.max(...recent.map(q => q.pct), 1);
  const colors = ["#1a56ff","#1a56ff","#00e5a0","#00e5a0","#a855f7","#a855f7"];
 
  recent.forEach((q, i) => {
    const w = document.createElement("div");
    w.className = "bar-wrap";
    w.innerHTML = `<div class="bar-val">${q.pct}%</div><div class="bar" style="height:${Math.round((q.pct/max)*120)}px;background:${colors[i%colors.length]};opacity:.85;border-radius:4px 4px 0 0;"></div>`;
    bars.appendChild(w);
    if (labels) {
      const l = document.createElement("span");
      l.className = "chart-label";
      l.textContent = q.topic.length > 6 ? q.topic.slice(0,6)+"…" : q.topic;
      labels.appendChild(l);
    }
  });
 
  if (countBadge) countBadge.textContent = history.length + " quizzes";
}
 
function buildSkillMastery(profile) {
  const list = document.getElementById("skillMasteryList");
  if (!list) return;
 
  const courseProgress   = typeof profile?.courseProgress === "object" && profile.courseProgress ? profile.courseProgress : {};
  const completedSkills  = Array.isArray(profile?.completedSkills) ? profile.completedSkills : [];
  const quizHistory      = Array.isArray(profile?.quizHistory) ? profile.quizHistory : [];
 
  const skillMap = {};
  completedSkills.forEach(s => { skillMap[s] = Math.max(skillMap[s] || 0, 100); });
  Object.entries(courseProgress).forEach(([title, pct]) => { skillMap[title] = Math.max(skillMap[title] || 0, pct); });
  quizHistory.forEach(q => {
    if (!skillMap[q.topic]) skillMap[q.topic] = Math.min(q.pct, 80);
    else skillMap[q.topic] = Math.max(skillMap[q.topic], Math.min(q.pct, 80));
  });
 
  if (Object.keys(skillMap).length === 0) {
    list.innerHTML = `<div style="color:#8892b0;font-size:0.85rem;">Complete roadmap steps or quizzes to see skill mastery.</div>`;
    return;
  }
  list.innerHTML = Object.entries(skillMap).map(([skill, pct]) => {
    const fillClass = pct>=90 ? "prog-fill--solid-accent" : pct>=60 ? "prog-fill--primary" : pct>=40 ? "prog-fill--solid-warn" : "prog-fill--solid-danger";
    const valClass  = pct>=90 ? "skill-mastery-val--accent" : pct>=60 ? "skill-mastery-val--blue" : pct>=40 ? "skill-mastery-val--warn" : "skill-mastery-val--danger";
    return `<div class="prog-wrap"><div class="prog-row"><span>${skill}</span><span class="${valClass}">${pct}%</span></div><div class="prog-track"><div class="prog-fill ${fillClass}" style="width:${pct}%"></div></div></div>`;
  }).join("");
}
 
function buildAnalyticsStats(profile) {
  const history        = Array.isArray(profile?.quizHistory) ? profile.quizHistory : [];
  const courseProgress = typeof profile?.courseProgress === "object" && profile.courseProgress ? profile.courseProgress : {};
  const completed      = Array.isArray(profile?.completedSkills) ? profile.completedSkills : [];
 
  const avgEl    = document.getElementById("aQuizAvg");
  const subEl    = document.getElementById("aQuizSub");
  const skillEl  = document.getElementById("aSkillScore");
  const courseEl = document.getElementById("aCoursesDone");
  const readEl   = document.getElementById("aReadiness");
 
  if (avgEl) {
    if (history.length > 0) {
      const avg = Math.round(history.reduce((s,q)=>s+q.pct,0)/history.length);
      avgEl.textContent = avg + "%";
      if (subEl) subEl.textContent = history.length + " quizzes taken";
    } else { avgEl.textContent = "—"; if (subEl) subEl.textContent = "No quizzes yet"; }
  }
 
  if (skillEl) {
    const allScores = [...completed.map(()=>100), ...Object.values(courseProgress)];
    skillEl.textContent = allScores.length > 0 ? Math.round(allScores.reduce((a,b)=>a+b,0)/allScores.length) + "%" : "0%";
  }
 
  if (courseEl) {
    courseEl.textContent = Object.values(courseProgress).filter(v=>v>=100).length;
  }
 
  if (readEl) {
    const quizAvg  = history.length > 0 ? history.reduce((s,q)=>s+q.pct,0)/history.length : 0;
    const roadPct  = Math.min(completed.length * 14, 100);
    const cPct     = Object.values(courseProgress).filter(v=>v>=100).length * 20;
    const readiness = Math.min(Math.round(quizAvg*0.3 + roadPct*0.4 + cPct*0.3), 100);
    readEl.textContent = readiness + "%";
    const pill = document.querySelector(".ready-pill");
    if (pill) pill.innerHTML = `<div class="pulse"></div>${readiness}% Job Ready`;
  }
}
 
// ── GAMIFICATION ──
function getBadgeChecks(profile) {
  const quizHistory    = Array.isArray(profile?.quizHistory)    ? profile.quizHistory    : [];
  const completedSkills= Array.isArray(profile?.completedSkills)? profile.completedSkills: [];
  const courseProgress = typeof profile?.courseProgress==="object"&&profile.courseProgress ? profile.courseProgress : {};
  const quizAvg        = quizHistory.length>0 ? quizHistory.reduce((s,q)=>s+q.pct,0)/quizHistory.length : 0;
  const roadPct        = Math.min(completedSkills.length*14,100);
  const cDone          = Object.values(courseProgress).filter(v=>v>=100).length;
  const readiness      = Math.min(Math.round(quizAvg*0.3 + roadPct*0.4 + cDone*20*0.3), 100);
 
  return [
    { emoji:"🧠", name:"Quiz Starter",    desc:"Complete your first quiz",      earned: quizHistory.length >= 1 },
    { emoji:"⭐", name:"Quiz Master",     desc:"Score 90%+ on any quiz",        earned: quizHistory.some(q=>q.pct>=90) },
    { emoji:"🗺️", name:"First Step",      desc:"Complete first roadmap step",   earned: completedSkills.length >= 1 },
    { emoji:"🏃", name:"Halfway There",   desc:"Complete 3+ roadmap steps",     earned: completedSkills.length >= 3 },
    { emoji:"🎓", name:"Course Complete", desc:"Finish your first course",      earned: cDone >= 1 },
    { emoji:"🚀", name:"Career Ready",    desc:"Reach 50%+ job readiness",      earned: readiness >= 50 },
  ];
}
 
async function autoLoadGamification() {
  const data    = await fetchUserProfile();
  const profile = data?.profile || {};
  if (profile.courseProgress) _courseProgressCache = profile.courseProgress;
 
  const xp    = calcXP(profile);
  const level = calcLevel(xp);
  const name  = LEVEL_NAMES[Math.min(level-1, LEVEL_NAMES.length-1)];
 
  const nextThresh = LEVEL_THRESHOLDS[Math.min(level, LEVEL_THRESHOLDS.length-1)];
  const currThresh = LEVEL_THRESHOLDS[level-1];
  const xpInLevel  = xp - currThresh;
  const xpNeeded   = nextThresh - currThresh;
  const pct        = Math.min(Math.round((xpInLevel/xpNeeded)*100), 100);
 
  const levelBadge  = document.getElementById("levelBadge");
  const levelNumber = document.getElementById("levelNumber");
  const levelLabel  = document.getElementById("levelLabel");
  const xpLabel     = document.getElementById("xpLabel");
  const xpBar       = document.getElementById("xpBar");
  const totalXpEl   = document.getElementById("totalXpLabel");
  const yourXpEl    = document.getElementById("yourXpLabel");
 
  if (levelBadge)  levelBadge.textContent  = `Level ${level} ⭐`;
  if (levelNumber) levelNumber.textContent = `⭐ ${level}`;
  if (levelLabel)  levelLabel.textContent  = name;
  if (xpLabel)     xpLabel.textContent     = `${xpInLevel.toLocaleString()} / ${xpNeeded.toLocaleString()}`;
  if (xpBar)       xpBar.style.width       = pct + "%";
  if (totalXpEl)   totalXpEl.textContent   = xp.toLocaleString();
  if (yourXpEl)    yourXpEl.textContent    = `${xp.toLocaleString()} XP · #12`;
 
  const sbLevel = document.querySelector(".u-lvl");
  if (sbLevel) sbLevel.textContent = `⭐ Level ${level} — ${name}`;
 
  const badges     = getBadgeChecks(profile);
  const earnedCount = badges.filter(b=>b.earned).length;
  const badgeGrid  = document.getElementById("badgeGrid");
  const badgeCount = document.getElementById("badgeCount");
  if (badgeCount) badgeCount.textContent = `${earnedCount} / ${badges.length}`;
  if (badgeGrid) {
    badgeGrid.innerHTML = badges.map(b => `
      <div class="badge-card${b.earned ? "" : " locked"}">
        <div class="badge-emoji">${b.emoji}</div>
        <div class="badge-name">${b.name}</div>
        <div class="badge-desc">${b.desc}</div>
      </div>`).join("");
  }
}
 
// ── CHART (legacy fallback) ──
function buildChart() {
  autoLoadAnalytics();
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
// ── AI ROADMAP ──
function renderSkillBadges(existingSkills, completedSkills) {
  const container = document.getElementById("skillBadgesContainer");
  if (!container) return;
  const prior   = (existingSkills || "").split(/[,،\n]+/).map(s => s.trim()).filter(Boolean);
  const done    = Array.isArray(completedSkills) ? completedSkills : [];
  const all     = [...new Set([...prior, ...done])];
  if (all.length === 0) {
    container.innerHTML = `<span style="color:#8892b0;font-size:0.85rem;">Complete roadmap steps to earn badges</span>`;
    return;
  }
  container.innerHTML = all.map(s =>
    done.includes(s)
      ? `<span class="badge badge-green">🏆 ${s} ✓</span>`
      : `<span class="badge badge-green">${s} ✓</span>`
  ).join(" ");
}
 
async function markStepComplete(stepTitle, btnEl) {
  btnEl.disabled = true;
  btnEl.textContent = "✅ Done!";
  btnEl.style.cssText += ";background:rgba(0,229,160,0.15);color:#00e5a0;border-color:rgba(0,229,160,0.4);";
 
  const rmStep = btnEl.closest(".rm-step");
  if (rmStep) {
    const dot = rmStep.querySelector(".rm-dot");
    if (dot) { dot.className = "rm-dot done"; dot.innerHTML = `<i class="fa-solid fa-check"></i>`; }
    const badge = rmStep.querySelector(".rm-meta .badge");
    if (badge) { badge.className = "badge badge-green"; badge.textContent = "Completed ✓"; }
  }
 
  const data = await fetchUserProfile();
  const profile = data?.profile || {};
  const completed = Array.isArray(profile.completedSkills) ? profile.completedSkills : [];
  if (!completed.includes(stepTitle)) {
    completed.push(stepTitle);
    profile.completedSkills = completed;
    await saveUserProfile(profile);
    addXP(XP_PER_ROADMAP, "roadmap step");
  }
 
  renderSkillBadges(profile.existingSkills || "", completed);
 
  const totalSteps = document.querySelectorAll("#aiRoadmapSteps .rm-step").length;
  const pct = totalSteps > 0 ? Math.round((completed.length / totalSteps) * 100) : 0;
  const roadmapBadge = document.querySelector(".nav-item[data-page='roadmap'] .nav-badge");
  if (roadmapBadge) roadmapBadge.textContent = pct + "%";
}
 
function renderRoadmapCards(text, stepsContainer, countBadge, completedSkills) {
  const done = Array.isArray(completedSkills) ? completedSkills : [];
  const blocks = text.split(/\n(?=(?:#{1,3}\s*)?(?:Milestone|Step)\s*\d+)/im).filter(b => b.trim());
  const list = blocks.length >= 2 ? blocks : text.split(/\n\n+/).filter(b => b.trim());
 
  stepsContainer.innerHTML = "";
  list.forEach((block, i) => {
    const lines = block.trim().split("\n").filter(l => l.trim());
    const titleRaw = lines[0]
      .replace(/^#{1,3}\s*/, "")
      .replace(/^(?:Milestone|Step)\s*\d+[:\-–]?\s*/i, "")
      .replace(/^\d+\.\s*\*?\*?/, "")
      .replace(/\*\*/g, "").trim();
    const desc = lines.slice(1).map(l => l.replace(/^\*+\s*/, "• ").replace(/\*\*/g, "")).join("\n").trim();
 
    const isDone = done.includes(titleRaw);
    const dotClass   = isDone ? "rm-dot done" : i === 0 ? "rm-dot active" : "rm-dot locked";
    const dotContent = isDone ? `<i class="fa-solid fa-check"></i>` : i === 0 ? `<i class="fa-solid fa-play"></i>` : `<i class="fa-solid fa-lock"></i>`;
    const connector  = i < list.length - 1 ? `<div class="rm-connector${isDone ? " done" : ""}"></div>` : "";
    const statusBadge = isDone
      ? `<span class="badge badge-green">Completed ✓</span>`
      : i === 0 ? `<span class="badge badge-blue">Start Here</span>`
      : `<span class="badge badge-orange">Step ${i + 1}</span>`;
    const completeBtn = isDone ? "" : `<button onclick="markStepComplete('${titleRaw.replace(/'/g, "\\'")}', this)"
      style="margin-top:8px;background:transparent;border:1px solid rgba(255,255,255,0.15);border-radius:20px;padding:5px 14px;color:#8892b0;font-size:0.78rem;cursor:pointer;">
      Mark Complete
    </button>`;
 
    const card = document.createElement("div");
    card.className = "rm-step";
    card.innerHTML = `
      <div class="rm-line"><div class="${dotClass}">${dotContent}</div>${connector}</div>
      <div class="rm-body">
        <h4>${titleRaw || "Step " + (i + 1)}</h4>
        <p style="white-space:pre-line;font-size:0.82rem;color:#8892b0;">${desc}</p>
        <div class="rm-meta">${statusBadge}${completeBtn}</div>
      </div>`;
    stepsContainer.appendChild(card);
  });
 
  if (countBadge) countBadge.textContent = list.length + " Steps";
}
 
async function autoLoadRoadmap() {
  const stepsContainer = document.getElementById("aiRoadmapSteps");
  const countBadge     = document.getElementById("roadmapStepCount");
  const fieldEl        = document.getElementById("roadmapField");
  const btn            = document.getElementById("generateRoadmapBtn");
  if (!stepsContainer || !fieldEl) return;
 
  if (stepsContainer.dataset.generated === "1") return;
 
  const data    = await fetchUserProfile();
  const profile = data?.profile;
  const completed = Array.isArray(profile?.completedSkills) ? profile.completedSkills : [];
 
  renderSkillBadges(profile?.existingSkills || "", completed);
 
  if (!profile || !profile.field) {
    stepsContainer.innerHTML = `<div style="color:#8892b0;font-size:0.9rem;padding:20px 0;">Fill in your profile first to auto-generate roadmap.</div>`;
    if (countBadge) countBadge.textContent = "—";
    return;
  }
 
  fieldEl.value = profile.field;
  const desc = document.getElementById("roadmapDesc");
  if (desc) desc.textContent = `AI-built for ${profile.field} · Goal: ${profile.goal || "Career growth"}`;
 
  if (btn) { btn.textContent = "⏳ Generating..."; btn.disabled = true; }
  stepsContainer.innerHTML = `<div style="color:#8892b0;font-size:0.9rem;padding:20px 0;">⏳ Building your personalized roadmap...</div>`;
 
  try {
    const prompt = `Generate a detailed, personalized learning roadmap for a student with these details:
- Field: ${profile.field}
- Current Level: ${profile.level || "Beginner"}
- Study Hours Per Day: ${profile.hours || 2} hours
- Career Goal: ${profile.goal || "Get a job"}
- Already Knows: ${profile.existingSkills || "Nothing yet"}
 
Return EXACTLY 6 to 8 milestones. Format each milestone like this:
 
Milestone 1: [Topic Name]
What to learn:
• point 1
• point 2
• point 3
Free Resource: [YouTube channel or website name]
Time: [e.g. 1 week]
 
Milestone 2: ...
 
No intro text. Just the milestones.`;
 
    const res  = await fetch(`${API}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt }),
    });
    const resp = await res.json();
    renderRoadmapCards(resp.reply, stepsContainer, countBadge, completed);
    stepsContainer.dataset.generated = "1";
  } catch (err) {
    stepsContainer.innerHTML = `<div style="color:#ff6b6b;">❌ Could not generate roadmap. Please try again.</div>`;
  }
  if (btn) { btn.textContent = "🔄 Regenerate Roadmap"; btn.disabled = false; }
}
 
async function generateRoadmap() {
  const btn            = document.getElementById("generateRoadmapBtn");
  const stepsContainer = document.getElementById("aiRoadmapSteps");
  const countBadge     = document.getElementById("roadmapStepCount");
  const fieldEl        = document.getElementById("roadmapField");
  if (!btn || !stepsContainer) return;
 
  const field = fieldEl?.value.trim();
  if (!field) { alert("Please enter a field first!"); return; }
 
  stepsContainer.dataset.generated = "0";
  btn.textContent = "⏳ Generating..."; btn.disabled = true;
  stepsContainer.innerHTML = `<div style="color:#8892b0;font-size:0.9rem;padding:20px 0;">⏳ Building your roadmap...</div>`;
 
  const profileData = await fetchUserProfile();
  const profile     = profileData?.profile;
  const completed   = Array.isArray(profile?.completedSkills) ? profile.completedSkills : [];
 
  const prompt = `Generate a detailed, personalized learning roadmap for a student with these details:
- Field: ${field}
- Current Level: ${profile?.level || "Beginner"}
- Study Hours Per Day: ${profile?.hours || 2} hours
- Career Goal: ${profile?.goal || "Get a job"}
- Already Knows: ${profile?.existingSkills || "Nothing yet"}
 
Return EXACTLY 6 to 8 milestones. Format each milestone like this:
 
Milestone 1: [Topic Name]
What to learn:
• point 1
• point 2
• point 3
Free Resource: [YouTube channel or website name]
Time: [e.g. 1 week]
 
Milestone 2: ...
 
No intro text. Just the milestones.`;
 
  try {
    const res  = await fetch(`${API}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt }),
    });
    const data = await res.json();
    renderRoadmapCards(data.reply, stepsContainer, countBadge, completed);
    stepsContainer.dataset.generated = "1";
  } catch (err) {
    stepsContainer.innerHTML = `<div style="color:#ff6b6b;">❌ Could not generate roadmap. Please try again.</div>`;
  }
  btn.textContent = "🔄 Regenerate Roadmap"; btn.disabled = false;
}
 
// ── DAILY PLANNER ──
function renderTaskList(tasks) {
  const taskList = document.getElementById("taskList");
  const badge    = document.getElementById("taskBadge");
  if (!taskList) return;
 
  taskList.innerHTML = "";
  tasks.forEach((task, i) => {
    const div = document.createElement("div");
    div.className = "task-item";
    div.innerHTML = `
      <div class="task-check"></div>
      <div class="task-inner">
        <div class="task-text">${task.text}</div>
        <div class="task-type">${task.type}</div>
      </div>`;
    div.addEventListener("click", () => {
      div.classList.toggle("done");
      div.querySelector(".task-check").innerHTML = div.classList.contains("done") ? '<i class="fa-solid fa-check"></i>' : "";
      const done  = taskList.querySelectorAll(".task-item.done").length;
      const total = taskList.querySelectorAll(".task-item").length;
      if (badge) badge.textContent = done + " / " + total + " Done";
    });
    taskList.appendChild(div);
  });
 
  const total = tasks.length;
  if (badge) badge.textContent = "0 / " + total + " Done";
}
 
function renderWeeklyPlan(days) {
  const weeklyPlan = document.getElementById("weeklyPlan");
  if (!weeklyPlan) return;
  weeklyPlan.innerHTML = "";
  days.forEach(d => {
    const div = document.createElement("div");
    div.className = "task-item";
    div.innerHTML = `
      <div class="task-check"></div>
      <div class="task-inner">
        <div class="task-text">${d.day} — ${d.topic}</div>
        ${d.note ? `<div class="task-type">${d.note}</div>` : ""}
      </div>`;
    div.addEventListener("click", () => {
      div.classList.toggle("done");
      div.querySelector(".task-check").innerHTML = div.classList.contains("done") ? '<i class="fa-solid fa-check"></i>' : "";
    });
    weeklyPlan.appendChild(div);
  });
}
 
async function autoLoadPlanner() {
  const taskList = document.getElementById("taskList");
  if (!taskList) return;
  if (taskList.dataset.generated === "1") return;
 
  const data    = await fetchUserProfile();
  const profile = data?.profile;
  if (!profile || !profile.field) {
    taskList.innerHTML = `<div style="color:#8892b0;font-size:0.9rem;padding:20px 0;">Fill in your profile first to generate a plan.</div>`;
    return;
  }
 
  const desc = document.getElementById("plannerDesc");
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  if (desc) desc.textContent = `AI-generated tasks for ${today} · ${profile.field}`;
 
  await generateDailyPlan();
}
 
async function generateDailyPlan() {
  const taskList  = document.getElementById("taskList");
  const btn       = document.getElementById("generatePlannerBtn");
  const statusEl  = document.getElementById("plannerStatus");
  const tipEl     = document.getElementById("aiTipText");
  if (!taskList) return;
 
  const data    = await fetchUserProfile();
  const profile = data?.profile;
  if (!profile || !profile.field) {
    alert("Complete your profile onboarding first!");
    return;
  }
 
  if (btn) { btn.textContent = "⏳ Generating..."; btn.disabled = true; }
  if (statusEl) statusEl.textContent = "";
  taskList.innerHTML = `<div style="color:#8892b0;font-size:0.9rem;padding:20px 0;">⏳ AI is building your plan...</div>`;
 
  const completed = Array.isArray(profile.completedSkills) ? profile.completedSkills.join(", ") : "none yet";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
 
  try {
    const res = await fetch(`${API}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `You are a study planner AI. Generate a daily + weekly learning plan for this student:
- Field: ${profile.field}
- Level: ${profile.level || "Beginner"}
- Study Hours/Day: ${profile.hours || 2} hours
- Career Goal: ${profile.goal || "Get a job"}
- Already Knows: ${profile.existingSkills || "nothing"}
- Completed Roadmap Steps: ${completed}
- Today is: ${today}
 
Return ONLY valid JSON, no markdown, no backticks, no extra text:
{
  "tasks": [
    {"text": "task description", "type": "emoji Type · duration"},
    {"text": "task description", "type": "emoji Type · duration"}
  ],
  "week": [
    {"day": "Mon", "topic": "topic name", "note": "optional note"},
    {"day": "Tue", "topic": "topic name", "note": ""},
    {"day": "Wed", "topic": "topic name", "note": ""},
    {"day": "Thu", "topic": "topic name", "note": ""},
    {"day": "Fri", "topic": "topic name", "note": "📝 Weekly Quiz"}
  ],
  "tip": "one personalized AI tip based on their level and field"
}
 
tasks should be 4-5 items, realistic for ${profile.hours || 2} hours/day, based on what they haven't learned yet.` })
    });
 
    const resp = await res.json();
    let parsed;
    try {
      const clean = resp.reply.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      const match = resp.reply.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }
 
    if (parsed?.tasks) {
      renderTaskList(parsed.tasks);
      taskList.dataset.generated = "1";
    }
    if (parsed?.week) renderWeeklyPlan(parsed.week);
    if (parsed?.tip && tipEl) tipEl.textContent = parsed.tip;
    if (statusEl) {
      const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      statusEl.textContent = `Generated at ${now}`;
    }
 
  } catch (err) {
    taskList.innerHTML = `<div style="color:#ff6b6b;">❌ Could not generate plan. Please try again.</div>`;
  }
 
  if (btn) { btn.textContent = "🔄 Regenerate Plan"; btn.disabled = false; }
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
 
    const comm = commMatch ? parseInt(commMatch[1]) : null;
    const tech = techMatch ? parseInt(techMatch[1]) : null;
    const conf = confMatch ? parseInt(confMatch[1]) : null;
 
    if (comm !== null) document.getElementById("scoreComm").textContent = comm + "/10";
    if (tech !== null) document.getElementById("scoreTech").textContent = tech + "/10";
    if (conf !== null) document.getElementById("scoreConf").textContent = conf + "/10";
 
    if (fb) { fb.style.display = "block"; fb.textContent = feedMatch ? feedMatch[1].trim() : reply; }
    if (fbtxt) fbtxt.textContent = feedMatch ? feedMatch[1].trim() : reply;
 
    // Save session to MongoDB
    if (comm !== null || tech !== null || conf !== null) {
      const topicEl = document.getElementById("interviewTopic");
      const topic   = topicEl?.value.trim() || "General";
      saveInterviewSession({ comm, tech, conf, topic, date: new Date().toISOString() });
    }
 
  } catch (err) {
    if (fb) { fb.style.display = "block"; fb.textContent = "❌ Could not get feedback. Please try again."; }
  }
  if (btn) { btn.textContent = "Submit Answer"; btn.disabled = false; }
}
 
async function saveInterviewSession(session) {
  const profileData = await fetchUserProfile();
  const profile = profileData?.profile || {};
  const history = Array.isArray(profile.interviewHistory) ? profile.interviewHistory : [];
  history.push(session);
  if (history.length > 50) history.shift();
  profile.interviewHistory = history;
  await saveUserProfile(profile);
  renderInterviewStats(history);
}
 
async function autoLoadInterview() {
  const data = await fetchUserProfile();
  const profile = data?.profile;
  if (!profile) return;
  const history = Array.isArray(profile.interviewHistory) ? profile.interviewHistory : [];
  renderInterviewStats(history);
 
  // Auto-fill topic from user's field
  const topicEl = document.getElementById("interviewTopic");
  if (topicEl && !topicEl.value.trim() && profile.field) topicEl.value = profile.field;
}
 
function renderInterviewStats(history) {
  const sessEl   = document.getElementById("sessionsCompleted");
  const barEl    = document.getElementById("sessionsBar");
  const techEl   = document.getElementById("avgTech");
  const commEl   = document.getElementById("avgComm");
  const trendEl  = document.getElementById("confTrend");
  const TARGET   = 8;
 
  const count = history.length;
  if (sessEl) sessEl.textContent = `${count} / ${TARGET}`;
  if (barEl)  barEl.style.width  = Math.min(Math.round((count / TARGET) * 100), 100) + "%";
 
  // Also update topbar subtitle dynamically
  const topbarSub = document.getElementById("topbarSub");
  if (topbarSub && topbarSub.textContent.includes("Session")) {
    topbarSub.textContent = `Practice interview sessions — Session ${count}/${TARGET}`;
  }
 
  if (count === 0) {
    if (techEl)  techEl.textContent  = "—";
    if (commEl)  commEl.textContent  = "—";
    if (trendEl) trendEl.textContent = "—";
    return;
  }
 
  const validTech = history.filter(s => s.tech !== null).map(s => s.tech);
  const validComm = history.filter(s => s.comm !== null).map(s => s.comm);
  const validConf = history.filter(s => s.conf !== null).map(s => s.conf);
 
  if (techEl && validTech.length > 0) {
    const avg = (validTech.reduce((a,b)=>a+b,0)/validTech.length).toFixed(1);
    techEl.textContent = avg + "/10";
  }
  if (commEl && validComm.length > 0) {
    const avg = (validComm.reduce((a,b)=>a+b,0)/validComm.length).toFixed(1);
    commEl.textContent = avg + "/10";
  }
 
  // Confidence trend: compare avg of last 3 vs first 3
  if (trendEl && validConf.length >= 2) {
    const first = validConf.slice(0, Math.ceil(validConf.length / 2));
    const last  = validConf.slice(Math.floor(validConf.length / 2));
    const firstAvg = first.reduce((a,b)=>a+b,0) / first.length;
    const lastAvg  = last.reduce((a,b)=>a+b,0)  / last.length;
    const diff = lastAvg - firstAvg;
    if (diff > 0.5)       { trendEl.textContent = "↑ Improving";  trendEl.className = "val-accent"; }
    else if (diff < -0.5) { trendEl.textContent = "↓ Declining";  trendEl.className = "val-danger"; }
    else                  { trendEl.textContent = "→ Stable";      trendEl.className = "val-blue";  }
  } else if (trendEl && validConf.length === 1) {
    trendEl.textContent = "→ 1 session";
    trendEl.className   = "val-blue";
  }
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
 
 
 
 
 
// ── PROJECTS ──
let _currentProject = null;
 
function showProjectRequirements() {
  const req  = document.getElementById("projectRequirements");
  const hint = document.getElementById("projectHint");
  if (req) { req.style.display = req.style.display === "none" ? "block" : "none"; if (hint) hint.style.display = "none"; }
}
 
async function getProjectHint() {
  const hint = document.getElementById("projectHint");
  const req  = document.getElementById("projectRequirements");
  if (!hint) return;
  hint.style.display = "block"; hint.textContent = "⏳ Getting AI hint...";
  if (req) req.style.display = "none";
  try {
    const projectTitle = _currentProject?.title || "your current project";
    const projectDesc  = _currentProject?.description || "";
    const res  = await fetch(`${API}/api/chat`, { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ message:`Give me a helpful, concise hint for this project: "${projectTitle}". Description: "${projectDesc}". Keep it practical and actionable.` }) });
    const data = await res.json();
    hint.textContent = "💡 " + data.reply;
  } catch { hint.textContent = "❌ Could not get hint. Please try again."; }
}
 
async function autoLoadProjects() {
  const data    = await fetchUserProfile();
  const profile = data?.profile;
  if (!profile) return;
  renderCompletedProjects(profile.completedProjects || []);
  if (profile.currentProject) { _currentProject = profile.currentProject; renderCurrentProject(profile.currentProject); }
  else { await generateNewProject(); }
}
 
function renderCurrentProject(proj) {
  _currentProject = proj;
  const titleEl = document.getElementById("currentProjectTitle");
  const descEl  = document.getElementById("currentProjectDesc");
  const tagEl   = document.getElementById("currentProjectTag");
  const badgeEl = document.getElementById("currentProjectBadge");
  const pctEl   = document.getElementById("currentProjectPct");
  const barEl   = document.getElementById("currentProjectBar");
  const reqText = document.getElementById("projectRequirementsText");
  const reqBox  = document.getElementById("projectRequirements");
  if (titleEl) titleEl.textContent = proj.title || "Project";
  if (descEl)  descEl.textContent  = proj.description || "";
  if (tagEl)   tagEl.textContent   = "CURRENT PROJECT — DUE IN 7 DAYS";
  if (badgeEl) badgeEl.textContent = "In Progress — 0%";
  if (pctEl)   pctEl.textContent   = "0%";
  if (barEl)   barEl.style.width   = "0%";
  if (reqText && proj.requirements) {
    reqText.innerHTML = Array.isArray(proj.requirements)
      ? proj.requirements.map((r,i) => `${i+1}. ${r}`).join("<br>")
      : proj.requirements;
  }
  if (reqBox) reqBox.style.display = "none";
}
 
function renderCompletedProjects(projects) {
  const list    = document.getElementById("completedProjectsList");
  const countEl = document.getElementById("completedProjectsCount");
  if (!list) return;
  if (!projects || projects.length === 0) {
    list.innerHTML = `<div style="color:#8892b0;font-size:0.85rem;padding:20px 0;">No completed projects yet. Submit your first project to get started!</div>`;
    if (countEl) countEl.textContent = "0 Done";
    return;
  }
  if (countEl) countEl.textContent = projects.length + " Done";
  list.innerHTML = projects.map((p,i) => `
    <div class="project-card">
      <div class="proj-header">
        <div>
          <div class="proj-title">${p.title || "Project"}</div>
          <div class="proj-meta">
            <span class="badge badge-green">Completed</span>
            <span class="proj-meta-time">Week ${i+1}</span>
            ${p.repoUrl ? `<a href="${p.repoUrl}" target="_blank" style="color:#00e5a0;font-size:0.78rem;margin-left:6px;"><i class="fa-brands fa-github"></i> Repo</a>` : ""}
          </div>
        </div>
        <div class="proj-score">${p.score || "—"}/100</div>
      </div>
      <div class="proj-desc">${p.description || ""}</div>
    </div>`).join("");
}
 
async function generateNewProject() {
  const btn     = document.getElementById("generateNewProjectBtn");
  const titleEl = document.getElementById("currentProjectTitle");
  if (btn) { btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generating...`; }
  if (titleEl) titleEl.textContent = "⏳ Generating your project...";
  try {
    const data    = await fetchUserProfile();
    const profile = data?.profile;
    if (!profile) { if (titleEl) titleEl.textContent = "Complete your profile first!"; return; }
    const completed = (profile.completedProjects || []).map(p => p.title).join(", ") || "none";
    const res = await fetch(`${API}/api/chat`, { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ message:`Generate a practical coding project for a student:
- Field: ${profile.field || "Software Development"}
- Level: ${profile.level || "Beginner"}
- Career Goal: ${profile.goal || "Get a job"}
- Existing Skills: ${profile.existingSkills || "Basic programming"}
- Already completed: ${completed}
Return ONLY valid JSON, no markdown, no backticks:
{"title":"project title","description":"2 sentence description","requirements":["req 1","req 2","req 3","req 4","req 5"]}
Make it different from completed projects. Achievable in 1-2 weeks.` }) });
    const resp = await res.json();
    let parsed;
    try { parsed = JSON.parse(resp.reply.replace(/```json|```/g,"").trim()); }
    catch { const m = resp.reply.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); }
    if (parsed?.title) {
      const pd = await fetchUserProfile();
      const prof = pd?.profile || {};
      prof.currentProject = parsed;
      await saveUserProfile(prof);
      renderCurrentProject(parsed);
    } else { if (titleEl) titleEl.textContent = "❌ Could not generate. Try again."; }
  } catch { if (titleEl) titleEl.textContent = "❌ Error generating project. Try again."; }
  if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i>New Project`; }
}
 
// ── COURSE SUGGESTIONS ──
const COURSE_EMOJIS = ["⚛️","🔐","🐍","🏗️","🐳","📊","🤖","🌐","📱","🔧"];
const COURSE_COLORS = ["react","purple","cyan","blue","accent","warn"];
 
// course progress cached in memory per session
let _courseProgressCache = null;
 
function getCourseProgress() {
  return _courseProgressCache || {};
}
async function saveCourseProgress(data) {
  _courseProgressCache = data;
  const profileData = await fetchUserProfile();
  const profile = profileData?.profile || {};
  profile.courseProgress = data;
  await saveUserProfile(profile);
}
 
function renderCourseCards(courses) {
  const grid = document.getElementById("courseCardsGrid");
  if (!grid) return;
  const progress = getCourseProgress();
  grid.innerHTML = "";
 
  courses.forEach((c, i) => {
    const pct   = progress[c.title] || 0;
    const emoji = COURSE_EMOJIS[i % COURSE_EMOJIS.length];
    const color = COURSE_COLORS[i % COURSE_COLORS.length];
    const isDone = pct >= 100;
    const badgeHtml = i === 0
      ? `<span class="badge badge-blue">Top Pick</span>`
      : isDone
      ? `<span class="badge badge-green">Completed ✓</span>`
      : `<span class="badge badge-orange">${c.tag || "Recommended"}</span>`;
 
    const card = document.createElement("div");
    card.className = "course-card";
    card.innerHTML = `
      <div class="course-thumb course-thumb--${color}">${emoji}</div>
      <div class="course-body">
        <div class="course-badge-row">${badgeHtml}</div>
        <div class="course-title">${c.title}</div>
        <div class="course-meta">${c.meta}</div>
        <div class="prog-wrap">
          <div class="prog-row"><span>Progress</span><span id="cpct-${i}">${pct}%</span></div>
          <div class="prog-track"><div class="prog-fill prog-fill--primary" id="cbar-${i}" style="width:${pct}%"></div></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" onclick="window.open('${c.url}','_blank');markCourseViewed('${c.title.replace(/'/g,"\\'")}',${i})">
            ${isDone ? "Review" : pct > 0 ? "Continue" : "Start Course"}
          </button>
          ${!isDone ? `<button class="btn btn-outline btn-sm" onclick="markCourseDone('${c.title.replace(/'/g,"\\'")}',${i})">Mark Done</button>` : ""}
        </div>
      </div>`;
    grid.appendChild(card);
  });
 
  renderCoursesProgress(courses);
}
 
async function markCourseViewed(title, idx) {
  const progress = getCourseProgress();
  if (!progress[title]) progress[title] = 25;
  else if (progress[title] < 75) progress[title] += 25;
  await saveCourseProgress(progress);
  const pct = progress[title];
  const pctEl = document.getElementById("cpct-" + idx);
  const barEl = document.getElementById("cbar-" + idx);
  if (pctEl) pctEl.textContent = pct + "%";
  if (barEl) barEl.style.width = pct + "%";
  updateCourseDoneCount();
}
 
async function markCourseDone(title, idx) {
  const progress = getCourseProgress();
  progress[title] = 100;
  await saveCourseProgress(progress);
  const pctEl = document.getElementById("cpct-" + idx);
  const barEl = document.getElementById("cbar-" + idx);
  if (pctEl) pctEl.textContent = "100%";
  if (barEl) barEl.style.width = "100%";
  updateCourseDoneCount();
  addXP(XP_PER_COURSE, "course");
}
 
function updateCourseDoneCount() {
  const progress = getCourseProgress();
  const done = Object.values(progress).filter(v => v >= 100).length;
  const total = Object.keys(progress).length;
  const el = document.getElementById("coursesDoneCount");
  if (el) el.textContent = done + " / " + total + " Done";
}
 
function renderCoursesProgress(courses) {
  const grid = document.getElementById("coursesProgressGrid");
  if (!grid) return;
  const progress = getCourseProgress();
  grid.innerHTML = "";
  courses.forEach(c => {
    const pct = progress[c.title] || 0;
    const fillClass = pct >= 100 ? "prog-fill--solid-accent" : "prog-fill--primary";
    const label = pct >= 100 ? `<span class="skill-mastery-val--accent">✓ Done</span>` : `<span>${pct}%</span>`;
    const div = document.createElement("div");
    div.className = "prog-wrap";
    div.innerHTML = `<div class="prog-row"><span>${c.title}</span>${label}</div><div class="prog-track"><div class="prog-fill ${fillClass}" style="width:${pct}%"></div></div>`;
    grid.appendChild(div);
  });
  updateCourseDoneCount();
}
 
async function autoLoadCourses() {
  const grid = document.getElementById("courseCardsGrid");
  if (!grid) return;
  // Always sync course progress from MongoDB
  const data = await fetchUserProfile();
  if (data?.profile?.courseProgress) _courseProgressCache = data.profile.courseProgress;
  if (grid.dataset.generated === "1") { renderCoursesProgress(JSON.parse(localStorage.getItem("sr_courses_list")||"[]")); return; }
  await generateCourses();
}
 
async function generateCourses() {
  const grid    = document.getElementById("courseCardsGrid");
  const btn     = document.getElementById("generateCoursesBtn");
  const descEl  = document.getElementById("coursesDesc");
  const statusEl = document.getElementById("coursesStatus");
  if (!grid) return;
 
  const data    = await fetchUserProfile();
  const profile = data?.profile;
  if (!profile?.field) { alert("Complete your profile first!"); return; }
 
  if (btn) { btn.textContent = "⏳ Loading..."; btn.disabled = true; }
  grid.innerHTML = `<div style="color:#8892b0;font-size:0.9rem;padding:20px 0;">⏳ Finding best courses for you...</div>`;
  grid.dataset.generated = "0";
 
  const completed = Array.isArray(profile.completedSkills) ? profile.completedSkills.join(", ") : "none";
 
  try {
    const res = await fetch(`${API}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `You are a course recommender AI. Suggest courses for this student:
- Field: ${profile.field}
- Level: ${profile.level || "Beginner"}
- Career Goal: ${profile.goal || "Get a job"}
- Already Knows: ${profile.existingSkills || "nothing"}
- Completed Topics: ${completed}
 
Return ONLY valid JSON array, no markdown, no backticks, no extra text:
[
  {"title": "Course Name", "meta": "Fills gap: topic · Est. X weeks", "tag": "Top Pick", "url": "https://...real url..."},
  {"title": "Course Name", "meta": "Fills gap: topic · Est. X weeks", "tag": "Recommended", "url": "https://..."},
  {"title": "Course Name", "meta": "Fills gap: topic · Est. X weeks", "tag": "Skill Builder", "url": "https://..."}
]
Use REAL course URLs from Udemy, Coursera, freeCodeCamp, YouTube, or similar. Exactly 3 courses.` })
    });
 
    const resp = await res.json();
    let parsed;
    try {
      const clean = resp.reply.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      const match = resp.reply.match(/\[[\s\S]*\]/);
      if (match) parsed = JSON.parse(match[0]);
    }
 
    if (parsed && Array.isArray(parsed) && parsed.length > 0) {
      // Store courses list for progress tracking
      localStorage.setItem("sr_courses_list", JSON.stringify(parsed));
      renderCourseCards(parsed);
      grid.dataset.generated = "1";
      if (descEl) descEl.textContent = `Based on your ${profile.field} path and career goal: ${profile.goal || "Get a job"}`;
      if (statusEl) statusEl.textContent = "Updated just now";
    } else {
      grid.innerHTML = `<div style="color:#ff6b6b;">❌ Could not load courses. Please try again.</div>`;
    }
  } catch (err) {
    grid.innerHTML = `<div style="color:#ff6b6b;">❌ Could not load courses. Please try again.</div>`;
  }
  if (btn) { btn.textContent = "🔄 Refresh Suggestions"; btn.disabled = false; }
}
 
// ── RESOURCE ASSISTANT ──
async function autoLoadResources() {
  const videoList = document.getElementById("videoList");
  if (!videoList) return;
  if (videoList.dataset.generated === "1") return;
  await generateResources();
}
 
async function generateResources() {
  const videoList   = document.getElementById("videoList");
  const docsList    = document.getElementById("docsList");
  const btn         = document.getElementById("generateResourcesBtn");
  const statusEl    = document.getElementById("resourceStatus");
  const descEl      = document.getElementById("resourceDesc");
  if (!videoList) return;
 
  const data    = await fetchUserProfile();
  const profile = data?.profile;
  if (!profile?.field) { alert("Complete your profile first!"); return; }
 
  if (btn) { btn.textContent = "⏳ Loading..."; btn.disabled = true; }
  videoList.innerHTML = `<div style="color:#8892b0;font-size:0.9rem;padding:20px 0;">⏳ Finding best resources...</div>`;
  if (docsList) docsList.innerHTML = `<div style="color:#8892b0;font-size:0.9rem;padding:20px 0;">⏳ Loading...</div>`;
 
  const completed = Array.isArray(profile.completedSkills) ? profile.completedSkills.join(", ") : "none";
 
  try {
    const res = await fetch(`${API}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `You are a learning resource curator. Recommend resources for this student:
- Field: ${profile.field}
- Level: ${profile.level || "Beginner"}
- Career Goal: ${profile.goal || "Get a job"}
- Already Knows: ${profile.existingSkills || "nothing"}
- Completed: ${completed}
 
Return ONLY valid JSON, no markdown, no backticks:
{
  "videos": [
    {"title": "video title", "channel": "channel name", "duration": "e.g. 45m", "url": "https://youtube.com/..."},
    {"title": "...", "channel": "...", "duration": "...", "url": "..."},
    {"title": "...", "channel": "...", "duration": "...", "url": "..."}
  ],
  "docs": [
    {"title": "resource title", "site": "site name", "type": "e.g. Documentation", "url": "https://..."},
    {"title": "...", "site": "...", "type": "...", "url": "..."},
    {"title": "...", "site": "...", "type": "...", "url": "..."},
    {"title": "...", "site": "...", "type": "...", "url": "..."}
  ]
}
Use REAL existing URLs only. YouTube videos must be real.` })
    });
 
    const resp = await res.json();
    let parsed;
    try {
      const clean = resp.reply.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      const match = resp.reply.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }
 
    if (parsed?.videos) {
      videoList.innerHTML = parsed.videos.map(v => `
        <a href="${v.url}" target="_blank" style="text-decoration:none;">
          <div class="res-card">
            <div class="res-icon res-icon--yt"><i class="fa-brands fa-youtube"></i></div>
            <div><div class="res-title">${v.title}</div><div class="res-sub">${v.channel} · YouTube · ${v.duration}</div></div>
            <i class="fa-solid fa-arrow-up-right-from-square res-arrow"></i>
          </div>
        </a>`).join("");
      videoList.dataset.generated = "1";
    }
 
    if (parsed?.docs && docsList) {
      docsList.innerHTML = parsed.docs.map(d => `
        <a href="${d.url}" target="_blank" style="text-decoration:none;">
          <div class="res-card">
            <div class="res-icon res-icon--blue"><i class="fa-solid fa-file-lines"></i></div>
            <div><div class="res-title">${d.title}</div><div class="res-sub">${d.site} · ${d.type}</div></div>
            <i class="fa-solid fa-arrow-up-right-from-square res-arrow"></i>
          </div>
        </a>`).join("");
    }
 
    if (descEl) descEl.textContent = `AI-picked resources for ${profile.field} · ${profile.level || "Beginner"} level`;
    if (statusEl) statusEl.textContent = "Updated just now";
 
  } catch (err) {
    videoList.innerHTML = `<div style="color:#ff6b6b;">❌ Could not load resources. Please try again.</div>`;
  }
  if (btn) { btn.textContent = "🔄 Refresh Resources"; btn.disabled = false; }
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

  // ── COMPUTE REAL DATA ──
  const quizHistory     = Array.isArray(profile.quizHistory)     ? profile.quizHistory     : [];
  const completedSkills = Array.isArray(profile.completedSkills) ? profile.completedSkills : [];
  const courseProgress  = (typeof profile.courseProgress === "object" && profile.courseProgress) ? profile.courseProgress : {};
  const completedProjects = Array.isArray(profile.completedProjects) ? profile.completedProjects : [];

  const quizAvg    = quizHistory.length > 0 ? Math.round(quizHistory.reduce((a,b) => a+b.pct, 0) / quizHistory.length) : 0;
  const roadmapPct = Math.min(completedSkills.length * 14, 100);
  const cDone      = Object.values(courseProgress).filter(v => v >= 100).length;
  const readiness  = Math.min(Math.round(quizAvg*0.3 + roadmapPct*0.4 + cDone*20*0.3), 100) || s.readiness || 10;
  const streak     = s.streak || 1;

  // ── TOPBAR PILL ──
  const pill = document.querySelector(".ready-pill");
  if (pill) pill.innerHTML = `<div class="pulse"></div>${readiness}% Job Ready`;

  // ── SIDEBAR STREAK ──
  const streakVal = document.querySelector(".streak-val");
  if (streakVal) streakVal.textContent = streak + " days";

  // ── HERO ──
  const heroSubtext = document.getElementById("heroSubtext");
  if (heroSubtext) heroSubtext.textContent = `Learning ${profile.field} · Goal: ${profile.goal}`;

  // ── STAT CARDS ──
  const homeReadiness = document.getElementById("homeReadiness");
  const homeReadSub   = document.getElementById("homeReadinessSub");
  const homeStreak    = document.getElementById("homeStreak");
  const homeQuizAvg   = document.getElementById("homeQuizAvg");
  const homeQuizSub   = document.getElementById("homeQuizSub");
  const homeProjects  = document.getElementById("homeProjectsDone");
  const homeProjSub   = document.getElementById("homeProjectSub");

  if (homeReadiness) homeReadiness.textContent = readiness + "%";
  if (homeReadSub)   homeReadSub.textContent   = readiness >= 50 ? "↑ On track!" : "Keep going!";
  if (homeStreak)    homeStreak.textContent     = streak + " 🔥";
  if (homeQuizAvg)   homeQuizAvg.textContent    = quizHistory.length > 0 ? quizAvg + "%" : "—";
  if (homeQuizSub)   homeQuizSub.textContent    = quizHistory.length > 0 ? quizHistory.length + " quizzes taken" : "No quizzes yet";
  if (homeProjects)  homeProjects.textContent   = completedProjects.length;
  if (homeProjSub)   homeProjSub.textContent    = completedProjects.length > 0 ? "Next due in 7 days" : "Start your first project";

  // ── ROADMAP CARD ──
  const roadmapText = document.getElementById("homeRoadmapText");
  const roadmapBar  = document.getElementById("homeRoadmapBar");
  if (roadmapText) roadmapText.textContent = `${profile.field} roadmap · ${roadmapPct}% complete`;
  if (roadmapBar)  roadmapBar.style.width  = roadmapPct + "%";
  const roadmapBadge = document.querySelector(".nav-item[data-page='roadmap'] .nav-badge");
  if (roadmapBadge) roadmapBadge.textContent = roadmapPct + "%";

  // ── QUIZ CARD ──
  const quizText  = document.getElementById("homeQuizText");
  const quizBadge = document.getElementById("homeQuizBadge");
  if (quizHistory.length > 0) {
    const last = quizHistory[quizHistory.length - 1];
    if (quizText)  quizText.textContent  = `Last: ${last.topic} · ${last.pct}%`;
    if (quizBadge) { quizBadge.textContent = "Take new quiz"; quizBadge.className = "badge badge-blue"; }
  } else {
    if (quizText)  quizText.textContent  = `${profile.field} quiz · 5 questions`;
    if (quizBadge) { quizBadge.textContent = "Start quiz"; quizBadge.className = "badge badge-orange"; }
  }

  // ── PROJECT CARD ──
  const projText = document.getElementById("homeProjectText");
  const projBar  = document.getElementById("homeProjectBar");
  if (profile.currentProject) {
    if (projText) projText.textContent = profile.currentProject.title + " — In Progress";
    if (projBar)  projBar.style.width  = "15%";
  } else {
    if (projText) projText.textContent = "No active project — generate one!";
    if (projBar)  projBar.style.width  = "0%";
  }

  // ── AI WELCOME ──
  const aiWelcome = localStorage.getItem("sr_ai_welcome");
  if (aiWelcome) {
    const hero = document.querySelector(".home-hero");
    if (hero && !hero.querySelector(".ai-welcome-tip")) {
      const tip = document.createElement("div");
      tip.className = "ai-welcome-tip";
      tip.style.cssText = "margin-top:12px;padding:12px 16px;background:rgba(0,229,160,0.08);border:1px solid rgba(0,229,160,0.2);border-radius:12px;font-size:0.84rem;color:#00e5a0;line-height:1.6;";
      tip.textContent = "🤖 " + aiWelcome;
      hero.appendChild(tip);
      localStorage.removeItem("sr_ai_welcome");
    }
  }
}
// function applyProfileToUI(profile, stats) {
//   if (!profile) return;
//   const s = stats || {};
 
//   // Update topbar readiness pill
//   const readiness = s.readiness || 10;
//   const pill = document.querySelector(".ready-pill");
//   if (pill) pill.innerHTML = `<div class="pulse"></div>${readiness}% Job Ready`;
 
//   // Update streak in sidebar
//   const streakVal = document.querySelector(".streak-val");
//   if (streakVal) streakVal.textContent = (s.streak || 1) + " days";
 
//   // Update home stats cards
//   const statVals = document.querySelectorAll(".s-val");
//   if (statVals[0]) statVals[0].textContent = readiness + "%";
//   if (statVals[1]) statVals[1].textContent = (s.streak || 1) + " 🔥";
//   if (statVals[2]) statVals[2].textContent = (s.quizAvg || 0) + "%";
//   if (statVals[3]) statVals[3].textContent = (s.projectsDone || 0);
 
//   // Update hero text
//   const heroP = document.querySelector(".home-hero p");
//   if (heroP) heroP.textContent = `Learning ${profile.field} · Goal: ${profile.goal}`;
 
//   // Update roadmap card
//   const roadmapCard = document.querySelector(".card:first-child p");
//   if (roadmapCard) roadmapCard.textContent = `${profile.field} roadmap · ${s.roadmapPct || 0}% complete`;
 
//   // Show AI welcome if exists
//   const aiWelcome = localStorage.getItem("sr_ai_welcome");
//   if (aiWelcome) {
//     const heroGlow = document.querySelector(".home-hero-glow");
//     if (heroGlow) {
//       const tip = document.createElement("div");
//       tip.style.cssText = "margin-top:12px;padding:12px 16px;background:rgba(0,229,160,0.08);border:1px solid rgba(0,229,160,0.2);border-radius:12px;font-size:0.84rem;color:#00e5a0;line-height:1.6;";
//       tip.textContent = "🤖 " + aiWelcome;
//       document.querySelector(".home-hero").appendChild(tip);
//       localStorage.removeItem("sr_ai_welcome");
//     }
//   }
 
  // Update nav roadmap badge
  const roadmapBadge = document.querySelector(".nav-item[data-page='roadmap'] .nav-badge");
  if (roadmapBadge) roadmapBadge.textContent = (s.roadmapPct || 0) + "%";
}









