// ============================================================
// SimplePOS
// SETTINGS CONTROLLER
//
// DATA SOURCES
// ------------------------------------------------------------
// SQLite Database:
// - Shop profile
// - POS preferences
// - Receipt settings
// - Products
// - Sales
// - Backup / Restore
//
// localStorage:
// - Theme preference only
// ============================================================


// ============================================================
// CONFIGURATION
// ============================================================

const API_BASE_URL = "http://127.0.0.1:5000/api";


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    initializeSettings();
});


// ============================================================
// INITIALIZE SETTINGS
// ============================================================

async function initializeSettings() {

    // --------------------------------------------------------
    // ELEMENTS
    // --------------------------------------------------------

    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");

    const appearanceToggle =
        document.getElementById("appearanceToggle");

    const appearanceToggleDot =
        document.getElementById("appearanceToggleDot");

    const appearanceIcon =
        document.getElementById("appearanceIcon");

    const systemThemeToggle =
        document.getElementById("systemThemeToggle");

    const systemThemeToggleDot =
        document.getElementById("systemThemeToggleDot");

    const shopName =
        document.getElementById("shopName");

    const shopPhone =
        document.getElementById("shopPhone");

    const shopEmail =
        document.getElementById("shopEmail");

    const shopLocation =
        document.getElementById("shopLocation");

    const currency =
        document.getElementById("currency");

    const defaultPayment =
        document.getElementById("defaultPayment");

    const lowStockThreshold =
        document.getElementById("lowStockThreshold");

    const receiptFooter =
        document.getElementById("receiptFooter");

    const showPhoneOnReceipt =
        document.getElementById("showPhoneOnReceipt");

    const showLocationOnReceipt =
        document.getElementById("showLocationOnReceipt");

    const sidebarShopName =
        document.getElementById("sidebarShopName");

    const saveShopProfile =
        document.getElementById("saveShopProfile");

    const savePOSPreferences =
        document.getElementById("savePOSPreferences");

    const saveReceiptSettings =
        document.getElementById("saveReceiptSettings");

    const exportDataButton =
        document.getElementById("exportData");

    const importDataButton =
        document.getElementById("importData");

    const importFile =
        document.getElementById("importFile");

    const clearAllData =
        document.getElementById("clearAllData");

    const toast =
        document.getElementById("toast");

    const toastMessage =
        document.getElementById("toastMessage");


    // ========================================================
    // DEFAULT SETTINGS
    // ========================================================

    const defaultSettings = {

        shopName: "Mwangaza Mini Mart",

        shopPhone: "",

        shopEmail: "",

        shopLocation: "",

        currency: "KSh",

        defaultPayment: "Cash",

        lowStockThreshold: 5,

        receiptFooter:
            "Thank you for shopping with us!",

        showPhoneOnReceipt: true,

        showLocationOnReceipt: true

    };


    // ========================================================
    // CURRENT SETTINGS
    // ========================================================

    let settings = {
        ...defaultSettings
    };


    // ========================================================
    // LOAD SETTINGS FROM DATABASE
    // ========================================================

    async function loadSettings() {

        try {

            const response =
                await fetch(`${API_BASE_URL}/settings`);


            if (!response.ok) {

                throw new Error(
                    `Server returned ${response.status}`
                );

            }


            const data =
                await response.json();


            if (
                data.status !== "success" ||
                !data.settings
            ) {

                throw new Error(
                    data.message ||
                    "Unable to load settings."
                );

            }


            settings = {
                ...defaultSettings,
                ...data.settings
            };


            loadForm();


        } catch (error) {

            console.error(
                "SimplePOS: Unable to load settings.",
                error
            );


            showToast(
                "Unable to load settings from the database.",
                "error"
            );


            // ------------------------------------------------
            // Temporary compatibility fallback
            // ------------------------------------------------
            //
            // If the backend is unavailable, we can still
            // display previously stored browser settings.
            //
            // These are NOT saved back automatically.
            // ------------------------------------------------

            try {

                const stored =
                    localStorage.getItem("settings");


                if (stored) {

                    const parsed =
                        JSON.parse(stored);


                    if (
                        parsed &&
                        typeof parsed === "object"
                    ) {

                        settings = {
                            ...defaultSettings,
                            ...parsed
                        };

                    }

                }

            } catch (fallbackError) {

                console.error(
                    "SimplePOS: Browser fallback failed.",
                    fallbackError
                );

            }


            loadForm();
        }
    }


    // ========================================================
    // SAVE SETTINGS TO DATABASE
    // ========================================================

    async function saveSettingsToDatabase(
        updatedSettings
    ) {

        try {

            const response =
                await fetch(`${API_BASE_URL}/settings`, {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify(
                        updatedSettings
                    )

                });


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    `Server returned ${response.status}`
                );

            }


            if (
                data.status !== "success" ||
                !data.settings
            ) {

                throw new Error(
                    data.message ||
                    "Unable to save settings."
                );

            }


            settings = {
                ...defaultSettings,
                ...data.settings
            };


            return true;


        } catch (error) {

            console.error(
                "SimplePOS: Unable to save settings.",
                error
            );


            return false;
        }
    }


    // ========================================================
    // LOAD FORM
    // ========================================================

    function loadForm() {

        if (shopName) {

            shopName.value =
                settings.shopName || "";

        }


        if (shopPhone) {

            shopPhone.value =
                settings.shopPhone || "";

        }


        if (shopEmail) {

            shopEmail.value =
                settings.shopEmail || "";

        }


        if (shopLocation) {

            shopLocation.value =
                settings.shopLocation || "";

        }


        if (currency) {

            currency.value =
                settings.currency || "KSh";

        }


        if (defaultPayment) {

            defaultPayment.value =
                settings.defaultPayment || "Cash";

        }


        if (lowStockThreshold) {

            lowStockThreshold.value =
                Number(
                    settings.lowStockThreshold
                ) || 5;

        }


        if (receiptFooter) {

            receiptFooter.value =
                settings.receiptFooter || "";

        }


        if (showPhoneOnReceipt) {

            showPhoneOnReceipt.checked =
                settings.showPhoneOnReceipt !== false;

        }


        if (showLocationOnReceipt) {

            showLocationOnReceipt.checked =
                settings.showLocationOnReceipt !== false;

        }


        updateSidebarName();
    }


    // ========================================================
    // UPDATE SIDEBAR SHOP NAME
    // ========================================================

    function updateSidebarName() {

        if (!sidebarShopName) {
            return;
        }


        sidebarShopName.textContent =
            settings.shopName ||
            "Mwangaza Mini Mart";
    }


    // ========================================================
    // SAVE SHOP PROFILE
    // ========================================================

    if (saveShopProfile) {

        saveShopProfile.addEventListener(
            "click",
            async () => {

                const name =
                    shopName
                        ? shopName.value.trim()
                        : "";


                if (!name) {

                    showToast(
                        "Please enter your shop name.",
                        "error"
                    );


                    if (shopName) {
                        shopName.focus();
                    }


                    return;
                }


                const updatedSettings = {

                    ...settings,

                    shopName: name,

                    shopPhone:
                        shopPhone
                            ? shopPhone.value.trim()
                            : "",

                    shopEmail:
                        shopEmail
                            ? shopEmail.value.trim()
                            : "",

                    shopLocation:
                        shopLocation
                            ? shopLocation.value.trim()
                            : ""

                };


                const saved =
                    await saveSettingsToDatabase(
                        updatedSettings
                    );


                if (!saved) {

                    showToast(
                        "Unable to save your shop profile.",
                        "error"
                    );

                    return;
                }


                updateSidebarName();


                showToast(
                    "Shop profile saved successfully."
                );

            }
        );

    }


    // ========================================================
    // SAVE POS PREFERENCES
    // ========================================================

    if (savePOSPreferences) {

        savePOSPreferences.addEventListener(
            "click",
            async () => {

                const selectedCurrency =
                    currency
                        ? currency.value
                        : "KSh";


                const selectedPayment =
                    defaultPayment
                        ? defaultPayment.value
                        : "Cash";


                let threshold =
                    lowStockThreshold
                        ? Number(
                            lowStockThreshold.value
                        )
                        : 5;


                if (
                    !Number.isFinite(threshold) ||
                    threshold < 0
                ) {

                    showToast(
                        "Low-stock threshold must be zero or greater.",
                        "error"
                    );

                    return;
                }


                threshold =
                    Math.floor(threshold);


                const updatedSettings = {

                    ...settings,

                    currency:
                        selectedCurrency,

                    defaultPayment:
                        selectedPayment,

                    lowStockThreshold:
                        threshold,

                    receiptFooter:
                        receiptFooter
                            ? receiptFooter.value.trim()
                            : ""

                };


                const saved =
                    await saveSettingsToDatabase(
                        updatedSettings
                    );


                if (!saved) {

                    showToast(
                        "Unable to save POS preferences.",
                        "error"
                    );

                    return;
                }


                showToast(
                    "POS preferences saved."
                );

            }
        );

    }


    // ========================================================
    // SAVE RECEIPT SETTINGS
    // ========================================================

    if (saveReceiptSettings) {

        saveReceiptSettings.addEventListener(
            "click",
            async () => {

                const updatedSettings = {

                    ...settings,

                    showPhoneOnReceipt:
                        showPhoneOnReceipt
                            ? showPhoneOnReceipt.checked
                            : true,

                    showLocationOnReceipt:
                        showLocationOnReceipt
                            ? showLocationOnReceipt.checked
                            : true

                };


                const saved =
                    await saveSettingsToDatabase(
                        updatedSettings
                    );


                if (!saved) {

                    showToast(
                        "Unable to save receipt settings.",
                        "error"
                    );

                    return;
                }


                showToast(
                    "Receipt settings saved."
                );

            }
        );

    }


    // ========================================================
    // THEME
    // ========================================================

    initializeTheme();


    function initializeTheme() {

        const savedTheme =
            localStorage.getItem("theme");


        if (savedTheme === "dark") {

            applyDarkTheme();

        } else if (savedTheme === "light") {

            applyLightTheme();

        } else {

            applySystemTheme();

        }


        updateThemeControls();


        // ----------------------------------------------------
        // HEADER THEME BUTTON
        // ----------------------------------------------------

        if (themeToggle) {

            themeToggle.addEventListener(
                "click",
                () => {

                    const isDark =
                        document.documentElement
                            .classList
                            .contains("dark");


                    if (isDark) {

                        applyLightTheme();

                    } else {

                        applyDarkTheme();

                    }


                    updateThemeControls();

                }
            );

        }


        // ----------------------------------------------------
        // APPEARANCE TOGGLE
        // ----------------------------------------------------

        if (appearanceToggle) {

            appearanceToggle.addEventListener(
                "click",
                () => {

                    const isDark =
                        document.documentElement
                            .classList
                            .contains("dark");


                    if (isDark) {

                        applyLightTheme();

                    } else {

                        applyDarkTheme();

                    }


                    updateThemeControls();

                }
            );

        }


        // ----------------------------------------------------
        // SYSTEM THEME
        // ----------------------------------------------------

        if (systemThemeToggle) {

            systemThemeToggle.addEventListener(
                "click",
                () => {

                    applySystemTheme();

                    updateThemeControls();

                    showToast(
                        "System theme enabled."
                    );

                }
            );

        }

    }


    // ========================================================
    // APPLY DARK THEME
    // ========================================================

    function applyDarkTheme() {

        document.documentElement
            .classList
            .add("dark");


        localStorage.setItem(
            "theme",
            "dark"
        );
    }


    // ========================================================
    // APPLY LIGHT THEME
    // ========================================================

    function applyLightTheme() {

        document.documentElement
            .classList
            .remove("dark");


        localStorage.setItem(
            "theme",
            "light"
        );
    }


    // ========================================================
    // APPLY SYSTEM THEME
    // ========================================================

    function applySystemTheme() {

        localStorage.removeItem("theme");


        const prefersDark =
            window.matchMedia &&
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;


        if (prefersDark) {

            document.documentElement
                .classList
                .add("dark");

        } else {

            document.documentElement
                .classList
                .remove("dark");

        }

    }


    // ========================================================
    // UPDATE THEME CONTROLS
    // ========================================================

    function updateThemeControls() {

        const isDark =
            document.documentElement
                .classList
                .contains("dark");


        const savedTheme =
            localStorage.getItem("theme");


        // ----------------------------------------------------
        // HEADER ICON
        // ----------------------------------------------------

        if (themeIcon) {

            themeIcon.setAttribute(
                "data-lucide",
                isDark
                    ? "sun"
                    : "moon"
            );

        }


        // ----------------------------------------------------
        // APPEARANCE ICON
        // ----------------------------------------------------

        if (appearanceIcon) {

            appearanceIcon.setAttribute(
                "data-lucide",
                isDark
                    ? "sun"
                    : "moon"
            );

        }


        // ----------------------------------------------------
        // DARK MODE SWITCH
        // ----------------------------------------------------

        if (appearanceToggle) {

            appearanceToggle.setAttribute(
                "aria-checked",
                String(isDark)
            );


            if (isDark) {

                appearanceToggle.classList.remove(
                    "bg-slate-300",
                    "dark:bg-slate-700"
                );

                appearanceToggle.classList.add(
                    "bg-green-600"
                );


                if (appearanceToggleDot) {

                    appearanceToggleDot.style.transform =
                        "translateX(20px)";

                }

            } else {

                appearanceToggle.classList.remove(
                    "bg-green-600"
                );

                appearanceToggle.classList.add(
                    "bg-slate-300"
                );


                if (appearanceToggleDot) {

                    appearanceToggleDot.style.transform =
                        "translateX(0)";

                }

            }

        }


        // ----------------------------------------------------
        // SYSTEM SWITCH
        // ----------------------------------------------------

        const systemTheme =
            savedTheme === null;


        if (systemThemeToggle) {

            systemThemeToggle.setAttribute(
                "aria-checked",
                String(systemTheme)
            );


            if (systemTheme) {

                systemThemeToggle.classList.remove(
                    "bg-slate-300",
                    "dark:bg-slate-700"
                );

                systemThemeToggle.classList.add(
                    "bg-green-600"
                );


                if (systemThemeToggleDot) {

                    systemThemeToggleDot.style.transform =
                        "translateX(20px)";

                }

            } else {

                systemThemeToggle.classList.remove(
                    "bg-green-600"
                );

                systemThemeToggle.classList.add(
                    "bg-slate-300"
                );


                if (systemThemeToggleDot) {

                    systemThemeToggleDot.style.transform =
                        "translateX(0)";

                }

            }

        }


        refreshIcons();
    }


    // ========================================================
    // EXPORT / DATABASE BACKUP
    // ========================================================

    if (exportDataButton) {

        exportDataButton.addEventListener(
            "click",
            async () => {

                try {

                    showToast(
                        "Preparing database backup..."
                    );


                    const response =
                        await fetch(
                            `${API_BASE_URL}/settings/backup`
                        );


                    if (!response.ok) {

                        throw new Error(
                            `Server returned ${response.status}`
                        );

                    }


                    const blob =
                        await response.blob();


                    const url =
                        URL.createObjectURL(blob);


                    const link =
                        document.createElement("a");


                    const date =
                        new Date()
                            .toISOString()
                            .slice(0, 10);


                    link.href = url;

                    link.download =
                        `mwangaza-pos-backup-${date}.json`;


                    document.body.appendChild(link);

                    link.click();

                    link.remove();


                    URL.revokeObjectURL(url);


                    showToast(
                        "POS database backup exported successfully."
                    );


                } catch (error) {

                    console.error(
                        "SimplePOS: Backup failed.",
                        error
                    );


                    showToast(
                        "Unable to export POS database.",
                        "error"
                    );

                }

            }
        );

    }


    // ========================================================
    // IMPORT / DATABASE RESTORE
    // ========================================================

    if (importDataButton && importFile) {

        importDataButton.addEventListener(
            "click",
            () => {

                importFile.click();

            }
        );


        importFile.addEventListener(
            "change",
            () => {

                const file =
                    importFile.files &&
                    importFile.files[0];


                if (!file) {
                    return;
                }


                const confirmed =
                    confirm(
                        "WARNING!\n\n" +
                        "Restoring a backup will replace the current " +
                        "products, sales history and settings in the " +
                        "POS database.\n\n" +
                        "Continue?"
                    );


                if (!confirmed) {

                    importFile.value = "";

                    return;
                }


                const reader =
                    new FileReader();


                reader.onload =
                    async event => {

                        try {

                            const backup =
                                JSON.parse(
                                    event.target.result
                                );


                            if (
                                !backup ||
                                typeof backup !== "object"
                            ) {

                                throw new Error(
                                    "Invalid backup."
                                );

                            }


                            if (
                                !Array.isArray(
                                    backup.products
                                )
                            ) {

                                throw new Error(
                                    "Backup does not contain products."
                                );

                            }


                            if (
                                !Array.isArray(
                                    backup.sales
                                )
                            ) {

                                throw new Error(
                                    "Backup does not contain sales."
                                );

                            }


                            if (
                                !Array.isArray(
                                    backup.saleItems
                                )
                            ) {

                                throw new Error(
                                    "Backup does not contain sale items."
                                );

                            }


                            showToast(
                                "Restoring database backup..."
                            );


                            const response =
                                await fetch(
                                    `${API_BASE_URL}/settings/restore`,
                                    {
                                        method: "POST",

                                        headers: {
                                            "Content-Type":
                                                "application/json"
                                        },

                                        body:
                                            JSON.stringify(
                                                backup
                                            )
                                    }
                                );


                            const result =
                                await response.json();


                            if (!response.ok) {

                                throw new Error(
                                    result.message ||
                                    "Restore failed."
                                );

                            }


                            showToast(
                                "Backup restored successfully. Reloading..."
                            );


                            setTimeout(
                                () => {

                                    window.location.reload();

                                },
                                1200
                            );


                        } catch (error) {

                            console.error(
                                "SimplePOS: Restore failed.",
                                error
                            );


                            showToast(
                                error.message ||
                                "Invalid or corrupted backup file.",
                                "error"
                            );

                        }

                    };


                reader.onerror =
                    () => {

                        showToast(
                            "Unable to read the backup file.",
                            "error"
                        );

                    };


                reader.readAsText(file);


                importFile.value = "";

            }
        );

    }


    // ========================================================
    // CLEAR ALL DATA
    // ========================================================

    if (clearAllData) {

        clearAllData.addEventListener(
            "click",
            async () => {

                const firstConfirmation =
                    confirm(
                        "WARNING!\n\n" +
                        "This will permanently delete all products " +
                        "and sales history from the POS database.\n\n" +
                        "Your settings will be reset to their defaults.\n\n" +
                        "Do you want to continue?"
                    );


                if (!firstConfirmation) {
                    return;
                }


                const secondConfirmation =
                    prompt(
                        'Type "DELETE" to permanently clear all POS data.'
                    );


                if (
                    secondConfirmation !==
                    "DELETE"
                ) {

                    showToast(
                        "Data deletion cancelled."
                    );

                    return;
                }


                try {

                    showToast(
                        "Clearing POS database..."
                    );


                    const response =
                        await fetch(
                            `${API_BASE_URL}/settings/clear`,
                            {
                                method: "DELETE"
                            }
                        );


                    const result =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            result.message ||
                            "Unable to clear POS data."
                        );

                    }


                    // ------------------------------------------------
                    // Theme is browser preference, so leave it alone.
                    // ------------------------------------------------

                    showToast(
                        "All POS data has been cleared."
                    );


                    setTimeout(
                        () => {

                            window.location.href =
                                "index.html";

                        },
                        1500
                    );


                } catch (error) {

                    console.error(
                        "SimplePOS: Unable to clear data.",
                        error
                    );


                    showToast(
                        error.message ||
                        "Unable to clear POS database.",
                        "error"
                    );

                }

            }
        );

    }


    // ========================================================
    // TOAST
    // ========================================================

    let toastTimer = null;


    function showToast(
        message,
        type = "success"
    ) {

        if (
            !toast ||
            !toastMessage
        ) {

            return;
        }


        toastMessage.textContent =
            message;


        const toastIcon =
            document.getElementById(
                "toastIcon"
            );


        if (toastIcon) {

            toastIcon.innerHTML = "";


            const icon =
                document.createElement("i");


            icon.setAttribute(
                "data-lucide",
                type === "error"
                    ? "alert-circle"
                    : "check-circle-2"
            );


            icon.className =
                "w-4 h-4";


            toastIcon.appendChild(icon);


            toastIcon.classList.remove(
                "text-green-400",
                "text-red-400"
            );


            toastIcon.classList.add(
                type === "error"
                    ? "text-red-400"
                    : "text-green-400"
            );

        }


        toast.classList.remove("hidden");

        toast.classList.add("toast");


        refreshIcons();


        if (toastTimer) {

            clearTimeout(toastTimer);

        }


        toastTimer =
            setTimeout(
                () => {

                    toast.classList.add(
                        "hidden"
                    );

                },
                3000
            );
    }


    // ========================================================
    // LUCIDE
    // ========================================================

    function refreshIcons() {

        if (
            typeof lucide !==
            "undefined"
        ) {

            lucide.createIcons();

        }

    }


    // ========================================================
    // INITIAL LOAD
    // ========================================================

    loadForm();

    refreshIcons();

    await loadSettings();

}