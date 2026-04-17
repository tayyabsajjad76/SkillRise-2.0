"use strict";

const Auth = (() => {
  // ── HELPERS ──
  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem("sr_users") || "[]");
    } catch {
      return [];
    }
  }
  function saveUsers(arr) {
    localStorage.setItem("sr_users", JSON.stringify(arr));
  }
  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("sr_current_user") || "null");
    } catch {
      return null;
    }
  }
  function setCurrentUser(user) {
    localStorage.setItem("sr_current_user", JSON.stringify(user));
  }
  function clearCurrentUser() {
    localStorage.removeItem("sr_current_user");
  }
  function getInitials(name) {
    return name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  // ── OPEN / CLOSE MODAL ──
  function open(tab) {
    const overlay = document.getElementById("authOverlay");
    if (!overlay) return;
    overlay.classList.add("show");
    switchTab(tab || "login");
    document.body.style.overflow = "hidden";
  }

  function close() {
    const overlay = document.getElementById("authOverlay");
    if (!overlay) return;
    overlay.classList.remove("show");
    document.body.style.overflow = "";
    clearErrors();
    resetForms();
  }

  function switchTab(tab) {
    document
      .querySelectorAll(".auth-tab")
      .forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    document
      .querySelectorAll(".auth-panel")
      .forEach((p) => p.classList.toggle("active", p.id === "panel-" + tab));
  }

  function clearErrors() {
    document.querySelectorAll(".auth-error-msg").forEach((el) => {
      el.classList.remove("show");
      el.textContent = "";
    });
    document
      .querySelectorAll(".auth-field input")
      .forEach((el) => el.classList.remove("error"));
  }

  function resetForms() {
    document
      .querySelectorAll("#authOverlay form, #authOverlay .auth-form")
      .forEach((f) => {
        if (f.tagName === "FORM") f.reset();
      });
    [
      "su-name",
      "su-email",
      "su-password",
      "su-confirm",
      "li-email",
      "li-password",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  }

  function showError(fieldId, msg) {
    const field = document.getElementById(fieldId);
    if (field) field.classList.add("error");
    const errEl = document.getElementById(fieldId + "-err");
    if (errEl) {
      errEl.textContent = msg;
      errEl.classList.add("show");
    }
  }

  // ── SIGN UP ──
  async function signup() {
    clearErrors();
    const name = document.getElementById("su-name")?.value.trim();
    const email = document
      .getElementById("su-email")
      ?.value.trim()
      .toLowerCase();
    const password = document.getElementById("su-password")?.value;
    const confirm = document.getElementById("su-confirm")?.value;

    if (password !== confirm) {
      showError("su-confirm", "Passwords do not match");
      return;
    }

    try {
      const res = await fetch("https://skillrise-api.onrender.com/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        showError(data.field, data.message);
        return;
      }

      localStorage.setItem("sr_token", data.token);
      setCurrentUser(data.user);
      showSuccessAndProceed("signup", data.user.name);
    } catch (err) {
      showError("su-name", "❌ Cannot reach server. Make sure it is running.");
    }
  }

  // ── LOGIN ──
  async function login() {
    clearErrors();
    const email = document
      .getElementById("li-email")
      ?.value.trim()
      .toLowerCase();
    const password = document.getElementById("li-password")?.value;

    if (!email) {
      showError("li-email", "Enter your email");
      return;
    }
    if (!password) {
      showError("li-password", "Enter your password");
      return;
    }

    try {
      const res = await fetch("https://skillrise-api.onrender.com/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        showError(data.field, data.message);
        return;
      }

      localStorage.setItem("sr_token", data.token);
      setCurrentUser(data.user);
      showSuccessAndProceed("login", data.user.name);
    } catch (err) {
      showError("li-email", "❌ Cannot reach server. Make sure it is running.");
    }
  }

  // ── SUCCESS HANDLER ──
  function showSuccessAndProceed(type, name) {

    const target = window._authRedirect || null;

    const panel = document.getElementById(
      "panel-" + (type === "signup" ? "signup" : "login"),
    );
    if (panel) {
      panel.innerHTML = `
        <div class="auth-success">
          <div class="auth-success-icon">${type === "signup" ? "🎉" : "✅"}</div>
          <h3>${type === "signup" ? "Welcome to Skill Rise!" : "Welcome back!"}</h3>
          <p>${type === "signup" ? `Account created for <strong>${name}</strong>. Redirecting...` : `Logged in as <strong>${name}</strong>. Redirecting...`}</p>
        </div>`;
    }

    setTimeout(() => {
      close();
      if (target) {
        window.location.href = target;
      } else {
        // Update UI in-page
        updateUIForUser();
      }
      window._authRedirect = null;
    }, 1200);
  }

  function updateUIForUser() {
    const user = getCurrentUser();
    if (!user) return;

    const navBtns = document.querySelectorAll(
      ".btn-primary-custom[data-auth-btn]",
    );
    navBtns.forEach((btn) => {
      btn.innerHTML = `<span class="profile-initials-btn">${user.initials}</span>`;
      btn.dataset.action = "profile";
    });

    // Update any welcome text
    document.querySelectorAll("[data-user-name]").forEach((el) => {
      el.textContent = user.name;
    });


    if (!document.getElementById("profileDropdown")) {
      const el = document.createElement("div");
      el.id = "profileDropdown";
      el.innerHTML = `
        <div class="profile-card">
          <div class="profile-card-header">
            <div class="profile-avatar">${user.initials}</div>
            <div class="profile-info">
              <div class="profile-name">${user.name}</div>
              <div class="profile-email">${user.email}</div>
            </div>
          </div>
          <div class="profile-card-divider"></div>
          <a href="features-hub.html" class="profile-card-item">
            <i class="fa-solid fa-gauge"></i> Dashboard
          </a>
          <div class="profile-card-divider"></div>
          <button class="profile-card-item profile-logout" id="profileLogoutBtn">
            <i class="fa-solid fa-right-from-bracket"></i> Logout
          </button>
        </div>`;
      document.body.appendChild(el);

      document
        .getElementById("profileLogoutBtn")
        .addEventListener("click", () => {
          logout();
        });

      // Close on outside click
      document.addEventListener("click", (e) => {
        const dropdown = document.getElementById("profileDropdown");
        const btn = document.querySelector(
          ".btn-primary-custom[data-auth-btn]",
        );
        if (dropdown && !dropdown.contains(e.target) && e.target !== btn) {
          dropdown.classList.remove("show");
        }
      });
    }

    // Wire profile button to toggle dropdown
    navBtns.forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        const dropdown = document.getElementById("profileDropdown");
        const rect = btn.getBoundingClientRect();
        dropdown.style.top = rect.bottom + window.scrollY + 8 + "px";
        dropdown.style.right = "16px";
        dropdown.classList.toggle("show");
      };
    });
  }

  // ── LOGOUT ──
  function logout() {
    clearCurrentUser();
    window.location.reload();
  }

  //wire up modal HTML ──
  function init() {
    // Inject the modal HTML if not already present
    if (!document.getElementById("authOverlay")) {
      const div = document.createElement("div");
      div.innerHTML = getModalHTML();
      document.body.appendChild(div.firstElementChild);
    }

    //  close
    document.getElementById("authOverlay").addEventListener("click", (e) => {
      if (e.target === document.getElementById("authOverlay")) close();
    });
    document.getElementById("authCloseBtn").addEventListener("click", close);

    // tabs
    document.querySelectorAll(".auth-tab").forEach((tab) => {
      tab.addEventListener("click", () => switchTab(tab.dataset.tab));
    });

    //signup btn
    document.getElementById("authSignupBtn").addEventListener("click", signup);
    document.getElementById("authLoginBtn").addEventListener("click", login);

    // Enter key
    ["su-name", "su-email", "su-password", "su-confirm"].forEach((id) => {
      document.getElementById(id)?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") signup();
      });
    });
    ["li-email", "li-password"].forEach((id) => {
      document.getElementById(id)?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") login();
      });
    });

    // Password toggle
    document.querySelectorAll(".pwd-toggle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const inp = document.getElementById(btn.dataset.target);
        if (!inp) return;
        inp.type = inp.type === "password" ? "text" : "password";
        const icon = btn.querySelector("i");
        if (icon)
          icon.className =
            inp.type === "password"
              ? "fa-solid fa-eye"
              : "fa-solid fa-eye-slash";
      });
    });

    document.querySelectorAll("[data-auth-btn]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const action = btn.dataset.action || "signup";
        if (action === "logout") {
          logout();
          return;
        }
        if (action === "profile") {
          return;
        }
        open(action);
      });
    });


    document.querySelectorAll("[data-auth-start]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const user = getCurrentUser();
        if (user) {
          window.location.href = btn.dataset.href || "features-hub.html";
        } else {
          window._authRedirect = btn.dataset.href || "features-hub.html";
          open("signup");
        }
      });
    });

    document.querySelectorAll("[data-auth-dashboard]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const user = getCurrentUser();
        if (user) {
          window.open(link.href || "features-hub.html", "_blank");
        } else {
          window._authRedirect =
            link.getAttribute("href") || "features-hub.html";
          open("login");
        }
      });
    });

    const user = getCurrentUser();
    if (user) updateUIForUser();
  }

  // ── MODAL HTML ──
  function getModalHTML() {
    return `
<div id="authOverlay">
  <div class="auth-modal" role="dialog" aria-modal="true" aria-label="Authentication">
    <button class="auth-close" id="authCloseBtn" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>



    <div class="auth-tabs">
      <button class="auth-tab active" data-tab="login">Login</button>
      <button class="auth-tab" data-tab="signup">Sign Up</button>
    </div>

    <!-- LOGIN PANEL -->
    <div class="auth-panel active" id="panel-login">
      <div class="auth-heading">Welcome back 👋</div>
      <div class="auth-sub">Sign in to continue your learning journey</div>

      <div class="auth-field">
        <label>Email Address</label>
        <div class="auth-field-wrap">
          <i class="fa-solid fa-envelope"></i>
          <input type="email" id="li-email" placeholder="you@example.com" autocomplete="email" />
        </div>
        <div class="auth-error-msg" id="li-email-err"></div>
      </div>
      <div class="auth-field">
        <label>Password</label>
        <div class="auth-field-wrap">
          <i class="fa-solid fa-lock"></i>
          <input type="password" id="li-password" placeholder="••••••••" autocomplete="current-password" />
          <button class="pwd-toggle" data-target="li-password" type="button"><i class="fa-solid fa-eye"></i></button>
        </div>
        <div class="auth-error-msg" id="li-password-err"></div>
      </div>

      <button class="auth-btn" id="authLoginBtn">
        <i class="fa-solid fa-right-to-bracket"></i> Sign In
      </button>

      <div class="auth-divider"><span>or continue with</span></div>
      <div class="auth-social">
        <button class="auth-social-btn" onclick="alert('Google login coming soon!')"><i class="fa-brands fa-google"></i> Google</button>
        <button class="auth-social-btn" onclick="alert('GitHub login coming soon!')"><i class="fa-brands fa-github"></i> GitHub</button>
      </div>
      <div class="auth-terms">Don't have an account? <a href="#" onclick="Auth.openTab('signup'); return false;">Sign up free →</a></div>
    </div>

    <!-- SIGNUP PANEL -->
    <div class="auth-panel" id="panel-signup">
      <div class="auth-heading">Create your account ✨</div>
      <div class="auth-sub">Join thousands of students on Skill Rise 2.0</div>

      <div class="auth-field">
        <label>Full Name</label>
        <div class="auth-field-wrap">
          <i class="fa-solid fa-user"></i>
          <input type="text" id="su-name" placeholder="Your full name" autocomplete="name" />
        </div>
        <div class="auth-error-msg" id="su-name-err"></div>
      </div>
      <div class="auth-field">
        <label>Email Address</label>
        <div class="auth-field-wrap">
          <i class="fa-solid fa-envelope"></i>
          <input type="email" id="su-email" placeholder="you@example.com" autocomplete="email" />
        </div>
        <div class="auth-error-msg" id="su-email-err"></div>
      </div>
      <div class="auth-field">
        <label>Password</label>
        <div class="auth-field-wrap">
          <i class="fa-solid fa-lock"></i>
          <input type="password" id="su-password" placeholder="Min 6 characters" autocomplete="new-password" />
          <button class="pwd-toggle" data-target="su-password" type="button"><i class="fa-solid fa-eye"></i></button>
        </div>
        <div class="auth-error-msg" id="su-password-err"></div>
      </div>
      <div class="auth-field">
        <label>Confirm Password</label>
        <div class="auth-field-wrap">
          <i class="fa-solid fa-lock"></i>
          <input type="password" id="su-confirm" placeholder="Repeat password" autocomplete="new-password" />
          <button class="pwd-toggle" data-target="su-confirm" type="button"><i class="fa-solid fa-eye"></i></button>
        </div>
        <div class="auth-error-msg" id="su-confirm-err"></div>
      </div>

      <button class="auth-btn" id="authSignupBtn">
        <i class="fa-solid fa-user-plus"></i> Create Account
      </button>

      <div class="auth-terms">By signing up, you agree to our <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a></div>
      <div class="auth-terms" style="margin-top:10px">Already have an account? <a href="#" onclick="Auth.openTab('login'); return false;">Sign in →</a></div>
    </div>
  </div>
</div>`;
  }

 
  return {
    init,
    open,
    close,
    logout,
    getCurrentUser,
    updateUIForUser,
    openTab: switchTab,
  };
})();


document.addEventListener("DOMContentLoaded", () => Auth.init());
