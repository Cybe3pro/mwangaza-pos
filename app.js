// ==========================================
// SimplePOS - Modern Login Controller
// Version 1.0 Enterprise
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    initializeIcons();
    initializeClock();
    initializeGreeting();
    initializePasswordToggle();
    initializeLogin();
    initializeForgotPassword();
});

// ==========================================
// 1. Lucide Icons Initialization
// ==========================================

function initializeIcons() {
    if (typeof lucide === "undefined") {
        console.error("Lucide icon library failed to load.");
        return;
    }
    lucide.createIcons();
}

// ==========================================
// 2. Dynamic Live Clock
// ==========================================

function initializeClock() {
    const dateElement = document.getElementById("currentDate");
    const timeElement = document.getElementById("currentTime");

    if (!dateElement || !timeElement) return;

    function updateClock() {
        const now = new Date();
        
        // Format: Friday, August 28, 2026
        dateElement.textContent = now.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
            year: "numeric"
        });

        // Format: 07:25:41 PM
        timeElement.textContent = now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    }

    updateClock();
    setInterval(updateClock, 1000);
}

// ==========================================
// 3. Dynamic Time-based Greeting
// ==========================================

function initializeGreeting() {
    const greetingElement = document.getElementById("greeting");
    if (!greetingElement) return;

    function updateGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) {
            greetingElement.textContent = "🌅 Good Morning";
        } else if (hour < 18) {
            greetingElement.textContent = "☀️ Good Afternoon";
        } else {
            greetingElement.textContent = "🌙 Good Evening";
        }
    }

    updateGreeting();
    setInterval(updateGreeting, 60000);
}

// ==========================================
// 4. Password Eye Toggle
// ==========================================

function initializePasswordToggle() {
    const passwordInput = document.getElementById("password");
    const toggleButton = document.getElementById("togglePassword");
    const passwordIcon = document.getElementById("passwordIcon");

    if (!passwordInput || !toggleButton || !passwordIcon) return;

    toggleButton.addEventListener("click", () => {
        const isHidden = passwordInput.type === "password";
        passwordInput.type = isHidden ? "text" : "password";
        
        passwordIcon.setAttribute("data-lucide", isHidden ? "eye-off" : "eye");
        toggleButton.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
        
        lucide.createIcons();
    });
}

// ==========================================
// 5. Login Submission & Handlers
// ==========================================

function initializeLogin() {
    const form = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const loginButton = document.getElementById("loginBtn");
    const buttonContent = document.getElementById("loginBtnContent");

    if (!form || !usernameInput || !passwordInput || !loginButton) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        clearValidation();

        const isValid = validateLogin(usernameInput, passwordInput);
        if (!isValid) return;

        // Set Loading State
        setLoginLoading(loginButton, buttonContent, true);

        // Simulate API call authentication delay
        await wait(1200);

        // Persist local session state
        sessionStorage.setItem("simplePOS_loggedIn", "true");
        sessionStorage.setItem("simplePOS_user", usernameInput.value.trim());

        // Redirect to main store portal
        window.location.href = "dashboard.html";
    });
}

// ==========================================
// 6. Form Validation Engine
// ==========================================

function validateLogin(usernameInput, passwordInput) {
    const usernameError = document.getElementById("usernameError");
    const passwordError = document.getElementById("passwordError");
    let isValid = true;

    // Validate Username
    if (!usernameInput.value.trim()) {
        showFieldError(usernameInput, usernameError, "Username is required.");
        isValid = false;
    }

    // Validate Password
    if (!passwordInput.value.trim()) {
        showFieldError(passwordInput, passwordError, "Password is required.");
        isValid = false;
    } else if (passwordInput.value.length < 4) {
        showFieldError(passwordInput, passwordError, "Password must be at least 4 characters.");
        isValid = false;
    }

    return isValid;
}

function showFieldError(inputElement, errorElement, message) {
    if (inputElement) {
        inputElement.classList.add("border-red-500", "focus:ring-red-500");
    }
    if (errorElement) {
        errorElement.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 inline"></i> ${message}`;
        errorElement.classList.remove("hidden");
        lucide.createIcons();
    }
}

function clearValidation() {
    const inputs = document.querySelectorAll("#username, #password");
    const errors = document.querySelectorAll("#usernameError, #passwordError");
    const messageBox = document.getElementById("loginMessage");

    inputs.forEach(input => {
        input.classList.remove("border-red-500", "focus:ring-red-500");
    });

    errors.forEach(error => {
        error.textContent = "";
        error.classList.add("hidden");
    });

    if (messageBox) {
        messageBox.classList.add("hidden");
    }
}

// ==========================================
// 7. Loading State Handler
// ==========================================

function setLoginLoading(button, content, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.classList.add("opacity-80", "cursor-not-allowed");
        content.innerHTML = `
            <i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>
            Authenticating Shift...
        `;
    } else {
        button.disabled = false;
        button.classList.remove("opacity-80", "cursor-not-allowed");
        content.innerHTML = `
            Open Store <i data-lucide="arrow-right" class="w-4 h-4"></i>
        `;
    }
    lucide.createIcons();
}

// ==========================================
// 8. Recovery & Messaging Systems
// ==========================================

function initializeForgotPassword() {
    const forgotPasswordBtn = document.getElementById("forgotPassword");
    if (!forgotPasswordBtn) return;

    forgotPasswordBtn.addEventListener("click", (event) => {
        event.preventDefault();
        showMessage("Contact system manager to request password reset credentials.", "info");
    });
}

function showMessage(message, type = "info") {
    const messageBox = document.getElementById("loginMessage");
    if (!messageBox) return;

    messageBox.classList.remove("hidden", "bg-emerald-500/10", "text-emerald-400", "border-emerald-500/20", "bg-red-500/10", "text-red-400", "border-red-500/20");

    if (type === "error") {
        messageBox.classList.add("bg-red-500/10", "text-red-400", "border", "border-red-500/20");
    } else {
        messageBox.classList.add("bg-emerald-500/10", "text-emerald-400", "border", "border-emerald-500/20");
    }

    messageBox.textContent = message;
}

// Helper promise timeout
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

document.addEventListener("DOMContentLoaded", () => {
    initializeClock();
    initializeGreeting();
    initializeThemeToggle();
    initializePasswordToggle();
});

// 1. Dynamic Live Clock
function initializeClock() {
    const timeElement = document.getElementById("currentTime");
    if (!timeElement) return;

    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        timeElement.textContent = `${hours}:${minutes}:${seconds}`;
    }

    updateClock();
    setInterval(updateClock, 1000);
}

// 2. Dynamic Greeting (Morning / Afternoon / Evening)
function initializeGreeting() {
    const greetingElement = document.getElementById("greetingText");
    if (!greetingElement) return;

    function updateGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) {
            greetingElement.textContent = "🌅 Good Morning,";
        } else if (hour < 18) {
            greetingElement.textContent = "☀️ Good Afternoon,";
        } else {
            greetingElement.textContent = "🌙 Good Evening,";
        }
    }

    updateGreeting();
    setInterval(updateGreeting, 60000); // Check every minute
}

// 3. Interactive Theme Toggle Switch
function initializeThemeToggle() {
    const toggleBtn = document.getElementById("themeToggle");
    const toggleHandle = document.getElementById("themeToggleHandle");
    const themeLabel = document.getElementById("themeLabel");
    const themeIcon = document.getElementById("themeIcon");

    if (!toggleBtn) return;

    toggleBtn.addEventListener("click", () => {
        const isVibrant = toggleBtn.dataset.theme === "vibrant";

        if (isVibrant) {
            // Switch to Dark / Classic Mode
            toggleBtn.dataset.theme = "dark";
            toggleBtn.classList.remove("bg-emerald-500", "justify-end");
            toggleBtn.classList.add("bg-slate-700", "justify-start");
            if (themeLabel) themeLabel.textContent = "Dark";
            if (themeIcon) themeIcon.textContent = "🌙";
            document.body.classList.add("dark-mode-active");
        } else {
            // Switch to Vibrant Mode
            toggleBtn.dataset.theme = "vibrant";
            toggleBtn.classList.remove("bg-slate-700", "justify-start");
            toggleBtn.classList.add("bg-emerald-500", "justify-end");
            if (themeLabel) themeLabel.textContent = "Vibrant";
            if (themeIcon) themeIcon.textContent = "☀️";
            document.body.classList.remove("dark-mode-active");
        }
    });
}

// 4. Password Toggle
function initializePasswordToggle() {
    const toggleBtn = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("passwordInput");
    
    if (!toggleBtn || !passwordInput) return;

    toggleBtn.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";
        passwordInput.type = isPassword ? "text" : "password";
    });
}