document.addEventListener("DOMContentLoaded", function () {
    const resetPasswordForm = document.getElementById("resetPasswordForm");
    const statusMessage = document.getElementById("statusMessage");
    const sendOtpBtn = document.getElementById("sendOtpBtn");
    const btnText = sendOtpBtn.querySelector(".btn-text");
    const btnLoading = sendOtpBtn.querySelector(".btn-loading");

    resetPasswordForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const email = document.getElementById("email").value.trim();

        // UI Feedback
        sendOtpBtn.disabled = true;
        btnText.classList.add("hidden");
        btnLoading.classList.remove("hidden");
        statusMessage.classList.add("hidden");

        try {
            // Mock success for now since user said backend later
            setTimeout(() => {
                statusMessage.textContent = "An OTP has been sent to your email address";
                statusMessage.className = "success-message";
                statusMessage.classList.remove("hidden");

                sendOtpBtn.disabled = false;
                btnText.classList.remove("hidden");
                btnLoading.classList.add("hidden");
            }, 1500);

        } catch (error) {
            statusMessage.textContent = "Something went wrong. Please try again.";
            statusMessage.className = "error-message";
            statusMessage.classList.remove("hidden");

            sendOtpBtn.disabled = false;
            btnText.classList.remove("hidden");
            btnLoading.classList.add("hidden");
        }
    });
});
