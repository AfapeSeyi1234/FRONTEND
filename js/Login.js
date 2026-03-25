// Login Page JavaScript
class LoginSystem {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Login form
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", this.handleLogin.bind(this));
    }

    // Password toggle
    const togglePassword = document.getElementById("togglePassword");
    if (togglePassword) {
      togglePassword.addEventListener(
        "click",
        this.togglePasswordVisibility.bind(this),
      );
    }

    // Sign Up button
    const signupBtn = document.getElementById("signupBtn");
    if (signupBtn) {
      signupBtn.addEventListener("click", this.handleSignUp.bind(this));
    }

    // Forgot Password button
    const forgotPasswordBtn =
      document.getElementById("forgotPasswordBtn");
    if (forgotPasswordBtn) {
      forgotPasswordBtn.addEventListener(
        "click",
        this.handleForgotPassword.bind(this),
      );
    }
  }

  async handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const loginBtn = document.getElementById("loginBtn");
    const errorMessage = document.getElementById("errorMessage");

    // Show loading state
    loginBtn.disabled = true;
    loginBtn.querySelector(".btn-text").style.display = "none";
    loginBtn.querySelector(".btn-loading").classList.remove("hidden");
    errorMessage.classList.add("hidden");

    try {
      // Add a timeout to the login attempt
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Login timed out. Is the backend server running?")), 8000)
      );

      await Promise.race([this.login(email, password), timeoutPromise]);

      // Redirect to dashboard on successful login
      window.location.href = "Dashboard.html";
    } catch (error) {
      console.error("Login error:", error);
      errorMessage.textContent = error.message;
      errorMessage.classList.remove("hidden");
    } finally {
      // Reset button state
      loginBtn.disabled = false;
      loginBtn.querySelector(".btn-text").style.display = "block";
      loginBtn.querySelector(".btn-loading").classList.add("hidden");
    }
  }

  login(email, password) {
    return fetch(`${window.API_BASE_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Login failed");
        }
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userName", `${data.user.first_name} ${data.user.last_name}`);
        localStorage.setItem("userProfile", JSON.stringify(data.user));
        return data;
      });
  }

  togglePasswordVisibility() {
    const passwordInput = document.getElementById("password");
    const toggleIcon = document.querySelector("#togglePassword");

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      toggleIcon.textContent = "🙈";
    } else {
      passwordInput.type = "password";
      toggleIcon.textContent = "👁";
    }
  }

  handleSignUp(e) {
    e.preventDefault();
    window.location.href = 'signup.html';
  }

  handleForgotPassword(e) {
    e.preventDefault();
    window.location.href = 'ResetPassword.html';
  }

  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Style the notification
    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "12px 24px",
      borderRadius: "8px",
      color: "white",
      fontWeight: "600",
      fontSize: "14px",
      zIndex: "1000",
      transform: "translateX(100%)",
      transition: "transform 0.3s ease",
    });

    // Set background color based on type
    const colors = {
      info: "#3b82f6",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    // Add to DOM
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Initialize the login system when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.loginSystem = new LoginSystem();
});

// Handle form auto-fill
document.addEventListener("DOMContentLoaded", () => {
  // Auto-fill demo credentials for easier testing
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  // Add click handler to demo credentials
  const demoCredentials = document.querySelector(".demo-credentials");
  if (demoCredentials) {
    demoCredentials.addEventListener("click", () => {
      emailInput.value = "admin@babcock.edu.ng";
      passwordInput.value = "admin123";
      emailInput.focus();
    });
  }
});

// Add some visual enhancements
document.addEventListener("DOMContentLoaded", () => {
  // Add floating animation to logo
  const logoCircle = document.querySelector(".logo-circle");
  if (logoCircle) {
    logoCircle.style.animation = "float 3s ease-in-out infinite";
  }

  // Add CSS for floating animation
  const style = document.createElement("style");
  style.textContent = `
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                
                .login-card {
                    animation: slideUp 0.6s ease-out;
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .form-group input:focus {
                    transform: scale(1.02);
                }
                
                .demo-credentials {
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .demo-credentials:hover {
                    background: rgba(255, 255, 255, 0.1);
                    transform: scale(1.02);
                }
            `;
  document.head.appendChild(style);
});