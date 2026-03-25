class SignupSystem {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const signupForm = document.getElementById("signupForm");
        if (signupForm) {
            signupForm.addEventListener("submit", this.handleSignup.bind(this));
        }

        const togglePassword = document.getElementById("togglePassword");
        if (togglePassword) {
            togglePassword.addEventListener(
                "click",
                this.togglePasswordVisibility.bind(this, "password"),
            );
        }

        const toggleConfirmPassword = document.getElementById(
            "toggleConfirmPassword",
        );
        if (toggleConfirmPassword) {
            toggleConfirmPassword.addEventListener(
                "click",
                this.togglePasswordVisibility.bind(this, "confirmPassword"),
            );
        }
    }

    async handleSignup(e) {
        e.preventDefault();

        const firstName = document.getElementById("firstName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();
        const email = document.getElementById("email").value.trim();
        const department = document.getElementById("department").value;
        const password = document.getElementById("password").value;
        const confirmPassword =
            document.getElementById("confirmPassword").value;
        const agreeTerms = document.getElementById("agreeTerms").checked;
        const signupBtn = document.getElementById("signupBtn");
        const errorMessage = document.getElementById("errorMessage");
        const successMessage = document.getElementById("successMessage");

        errorMessage.classList.add("hidden");
        successMessage.classList.add("hidden");

        // Validation
        if (!firstName || !lastName) {
            this.showError(errorMessage, "Please enter your full name");
            return;
        }

        if (!email.includes("@babcock.edu.ng")) {
            this.showError(
                errorMessage,
                "Please use a valid Babcock University email address",
            );
            return;
        }

        if (!department) {
            this.showError(errorMessage, "Please select a department");
            return;
        }

        if (password.length < 8) {
            this.showError(
                errorMessage,
                "Password must be at least 8 characters long",
            );
            return;
        }

        if (password !== confirmPassword) {
            this.showError(errorMessage, "Passwords do not match");
            return;
        }

        if (!agreeTerms) {
            this.showError(
                errorMessage,
                "Please agree to the Terms & Conditions",
            );
            return;
        }

        // Show loading state
        signupBtn.disabled = true;
        signupBtn.querySelector(".btn-text").style.display = "none";
        signupBtn.querySelector(".btn-loading").classList.remove("hidden");

        try {
            const response = await fetch(`${window.API_BASE_URL}/api/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    department,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Signup failed");
            }

            // Show success message
            successMessage.textContent =
                "Account created successfully! Redirecting to login...";
            successMessage.classList.remove("hidden");

            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = "Login.html";
            }, 2000);
        } catch (error) {
            this.showError(errorMessage, error.message);
        } finally {
            signupBtn.disabled = false;
            signupBtn.querySelector(".btn-text").style.display = "block";
            signupBtn.querySelector(".btn-loading").classList.add("hidden");
        }
    }

    togglePasswordVisibility(fieldId, e) {
        e.preventDefault();
        const passwordInput = document.getElementById(fieldId);
        const toggleIcon = e.target;

        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            toggleIcon.textContent = "🙈";
        } else {
            passwordInput.type = "password";
            toggleIcon.textContent = "👁";
        }
    }

    showError(element, message) {
        element.textContent = message;
        element.classList.remove("hidden");
        element.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    hashPassword(password) {
        // Simple hash (in production, use proper cryptography)
        return btoa(password);
    }

    showNotification(message, type = "info") {
        const notification = document.createElement("div");
        notification.textContent = message;

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

        const colors = {
            info: "#3b82f6",
            success: "#10b981",
            warning: "#f59e0b",
            error: "#ef4444",
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = "translateX(0)";
        }, 100);

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

document.addEventListener("DOMContentLoaded", () => {
    window.signupSystem = new SignupSystem();
});