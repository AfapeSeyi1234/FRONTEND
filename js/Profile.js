document.addEventListener("DOMContentLoaded", function () {
    const profileForm = document.getElementById("profile-form");
    const passwordForm = document.getElementById("password-form");
    const pfpInput = document.getElementById("pfp-upload");
    const pfpPreview = document.getElementById("profile-preview");
    const sidebarAvatar = document.getElementById("sidebar-avatar");
    const sidebarName = document.getElementById("sidebar-name");
    const sidebarDept = document.getElementById("sidebar-department");
    const logoutBtn = document.getElementById("logout-btn");
    const statusMessage = document.getElementById("statusMessage");
    const profileInlineStatus = document.getElementById("profileInlineStatus");
    const passwordInlineStatus = document.getElementById("passwordInlineStatus");

    // Fetch user data on load
    async function fetchProfile() {
        // Fast Load: Check for cached profile
        const cachedUser = localStorage.getItem('userProfile');
        if (cachedUser) {
            try {
                const user = JSON.parse(cachedUser);
                document.getElementById("fullname").value = `${user.first_name} ${user.last_name}`.trim();
                document.getElementById("email").value = user.email;
                document.getElementById("department").value = user.department;
                if (user.avatar) {
                    pfpPreview.src = user.avatar;
                    sidebarAvatar.src = user.avatar;
                }
                sidebarName.textContent = `${user.first_name} ${user.last_name}`;
                sidebarDept.textContent = user.department.replace(/-/g, ' ').toUpperCase();
            } catch (e) {
                console.error("Cache parse error", e);
            }
        }

        try {
            const response = await fetch("http://localhost:5000/api/profile", {
                credentials: "include"
            });
            if (!response.ok) throw new Error("Failed to fetch profile");

            const user = await response.json();

            // Update Cache
            localStorage.setItem('userProfile', JSON.stringify(user));

            // Set form values
            document.getElementById("fullname").value = `${user.first_name} ${user.last_name}`.trim();
            document.getElementById("email").value = user.email;
            document.getElementById("department").value = user.department;

            if (user.avatar) {
                pfpPreview.src = user.avatar;
                sidebarAvatar.src = user.avatar;
            }

            sidebarName.textContent = `${user.first_name} ${user.last_name}`;
            sidebarDept.textContent = user.department.replace(/-/g, ' ').toUpperCase();
        } catch (error) {
            console.error("Fetch error:", error);
            if (!cachedUser) window.location.href = "Login.html";
        }
    }

    fetchProfile();

    // Show status message
    function showStatus(message, isError = false, target = statusMessage) {
        target.textContent = message;
        if (target === statusMessage) {
            target.style.backgroundColor = isError ? "#ffecec" : "#e6f0ff";
            target.style.color = isError ? "#b91c1c" : "#00408c";
            target.style.borderColor = isError ? "#fca5a5" : "#cfe0ff";
        } else {
            target.className = `inline-status ${isError ? 'error' : 'success'}`;
        }

        target.classList.remove("hidden");
        setTimeout(() => {
            target.classList.add("hidden");
        }, 4000);
    }

    // Handle Personal Info Update
    profileForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const btn = this.querySelector('button[type="submit"]');
        const fullname = document.getElementById("fullname").value.trim();

        // Split name into first and last
        const nameParts = fullname.split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        if (!firstName) {
            showStatus("First name is required", true, profileInlineStatus);
            return;
        }

        btn.disabled = true;
        btn.textContent = "Saving...";

        const payload = {
            firstName: firstName,
            lastName: lastName,
            email: document.getElementById("email").value.trim(),
            department: document.getElementById("department").value
        };

        try {
            const response = await fetch("http://localhost:5000/api/profile/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Update failed");

            showStatus("Changes saved successfully!", false, profileInlineStatus);
            sidebarName.textContent = fullname;
            sidebarDept.textContent = payload.department.replace(/-/g, ' ').toUpperCase();

            // Update Cache
            const cachedUser = localStorage.getItem('userProfile');
            if (cachedUser) {
                const user = JSON.parse(cachedUser);
                user.first_name = firstName;
                user.last_name = lastName;
                user.department = payload.department;
                localStorage.setItem('userProfile', JSON.stringify(user));
            }
        } catch (error) {
            showStatus(error.message, true, profileInlineStatus);
        } finally {
            btn.disabled = false;
            btn.textContent = "Save Profile Changes";
        }
    });

    // Handle Password Update
    passwordForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const currentPassword = document.getElementById("current-password").value;
        const newPassword = document.getElementById("new-password").value;
        const confirmPassword = document.getElementById("confirm-password").value;

        if (newPassword !== confirmPassword) {
            showStatus("Passwords do not match", true, passwordInlineStatus);
            return;
        }

        if (newPassword.length < 8) {
            showStatus("Password too short (min 8 chars)", true, passwordInlineStatus);
            return;
        }

        const btn = this.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = "Updating...";

        try {
            const response = await fetch("http://localhost:5000/api/profile/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Password update failed");

            showStatus("Password updated successfully!", false, passwordInlineStatus);
            this.reset();
        } catch (error) {
            showStatus(error.message, true, passwordInlineStatus);
        } finally {
            btn.disabled = false;
            btn.textContent = "Update Password";
        }
    });

    // Handle Avatar Upload
    pfpInput.addEventListener("change", function () {
        const file = this.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showStatus("File too large (max 2MB)", true);
                return;
            }

            const reader = new FileReader();
            reader.onload = async function (e) {
                const base64Avatar = e.target.result;
                const originalSrc = pfpPreview.src;
                pfpPreview.src = base64Avatar;

                try {
                    const response = await fetch("http://localhost:5000/api/profile/upload-avatar", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ avatar: base64Avatar })
                    });

                    if (!response.ok) throw new Error("Upload failed");
                    sidebarAvatar.src = base64Avatar;
                    showStatus("Avatar updated successfully!");

                    // Update Cache
                    const cachedUser = localStorage.getItem('userProfile');
                    if (cachedUser) {
                        const user = JSON.parse(cachedUser);
                        user.avatar = base64Avatar;
                        localStorage.setItem('userProfile', JSON.stringify(user));
                    }
                } catch (error) {
                    pfpPreview.src = originalSrc;
                    showStatus(error.message, true);
                }
            };
            reader.readAsDataURL(file);
        }
    });

    // Remove Avatar
    document.getElementById("remove-photo").addEventListener("click", async function () {
        const defaultAvatar = "images/profile.svg";
        try {
            const response = await fetch("http://localhost:5000/api/profile/upload-avatar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ avatar: null })
            });

            if (!response.ok) throw new Error("Removal failed");
            pfpPreview.src = defaultAvatar;
            sidebarAvatar.src = defaultAvatar;
            showStatus("Avatar removed");

            // Update Cache
            const cachedUser = localStorage.getItem('userProfile');
            if (cachedUser) {
                const user = JSON.parse(cachedUser);
                user.avatar = null;
                localStorage.setItem('userProfile', JSON.stringify(user));
            }
        } catch (error) {
            showStatus(error.message, true);
        }
    });

    // Handle Logout Custom Modal
    const logoutModal = document.getElementById("logout-modal-overlay");
    const confirmLogoutBtn = document.getElementById("confirm-logout");
    const cancelLogoutBtn = document.getElementById("cancel-logout");

    logoutBtn.addEventListener("click", () => {
        logoutModal.classList.add("active");
    });

    cancelLogoutBtn.addEventListener("click", () => {
        logoutModal.classList.remove("active");
    });

    // Close on overlay click
    logoutModal.addEventListener("click", (e) => {
        if (e.target === logoutModal) logoutModal.classList.remove("active");
    });

    confirmLogoutBtn.addEventListener("click", async function () {
        const originalText = this.textContent;
        this.disabled = true;
        this.textContent = "Signing out...";

        try {
            await fetch("http://localhost:5000/api/logout", {
                method: "POST",
                credentials: "include"
            });
            localStorage.clear();
            window.location.href = "Login.html";
        } catch (error) {
            console.error("Logout failed:", error);
            window.location.href = "Login.html";
        }
    });
});