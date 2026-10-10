// ============================================================
// MWANGAZA POS
// Authentication & Current User Controller
// ============================================================

const AUTH_STORAGE_KEY = "mwangazaUser";

// ============================================================
// GET CURRENT LOGGED-IN USER
// ============================================================

function getCurrentUser() {

    // Check sessionStorage first.
    const sessionUser =
        sessionStorage.getItem(AUTH_STORAGE_KEY);

    if (sessionUser) {

        try {
            return JSON.parse(sessionUser);
        } catch (error) {

            console.error(
                "Invalid user data in sessionStorage.",
                error
            );

            sessionStorage.removeItem(
                AUTH_STORAGE_KEY
            );
        }
    }

    // Check localStorage if sessionStorage
    // does not contain the user.
    const rememberedUser =
        localStorage.getItem(AUTH_STORAGE_KEY);

    if (rememberedUser) {

        try {
            return JSON.parse(rememberedUser);
        } catch (error) {

            console.error(
                "Invalid user data in localStorage.",
                error
            );

            localStorage.removeItem(
                AUTH_STORAGE_KEY
            );
        }
    }

    return null;
}

// ============================================================
// CHECK WHETHER USER IS LOGGED IN
// ============================================================

function isLoggedIn() {

    return getCurrentUser() !== null;
}

// ============================================================
// REQUIRE LOGIN
// ============================================================

function requireLogin() {

    const user = getCurrentUser();

    if (!user) {

        window.location.href = "index.html";

        return null;
    }

    return user;
}

// ============================================================
// GET USER ROLE
// ============================================================

function getCurrentUserRole() {

    const user = getCurrentUser();

    if (!user) {
        return null;
    }

    return user.role
        ? user.role.toUpperCase()
        : null;
}

// ============================================================
// ROLE CHECK
// ============================================================

function userHasRole(role) {

    const currentRole =
        getCurrentUserRole();

    if (!currentRole) {
        return false;
    }

    return currentRole ===
        role.toUpperCase();
}

// ============================================================
// MANAGER / ADMIN CHECK
// ============================================================

function canAuthorize() {

    const role =
        getCurrentUserRole();

    return (
        role === "MANAGER" ||
        role === "ADMIN"
    );
}

// ============================================================
// LOGOUT
// ============================================================

function logoutUser() {

    sessionStorage.removeItem(
        AUTH_STORAGE_KEY
    );

    localStorage.removeItem(
        AUTH_STORAGE_KEY
    );

    window.location.href =
        "index.html";
}

// ============================================================
// DISPLAY CURRENT USER
// ============================================================

function displayCurrentUser(
    nameElementId,
    roleElementId
) {

    const user =
        getCurrentUser();

    if (!user) {
        return;
    }

    const nameElement =
        document.getElementById(
            nameElementId
        );

    const roleElement =
        document.getElementById(
            roleElementId
        );

    if (nameElement) {

        nameElement.textContent =
            user.full_name ||
            user.username;
    }

    if (roleElement) {

        roleElement.textContent =
            user.role || "CASHIER";
    }
}