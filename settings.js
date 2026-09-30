// ============================================================
// SimplePOS
// SETTINGS CONTROLLER
//
// SETTINGS
// localStorage.settings
//
// THEME
// localStorage.theme
//
// PRODUCTS
// localStorage.products
//
// SALES HISTORY
// localStorage.salesHistory
//
// LAST RECEIPT
// localStorage.lastSale
// ============================================================


document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeSettings();

    }
);


// ============================================================
// INITIALIZE SETTINGS
// ============================================================

function initializeSettings() {

    // ========================================================
    // ELEMENTS
    // ========================================================

    const themeToggle =
        document.getElementById(
            "themeToggle"
        );

    const themeIcon =
        document.getElementById(
            "themeIcon"
        );

    const appearanceToggle =
        document.getElementById(
            "appearanceToggle"
        );

    const appearanceToggleDot =
        document.getElementById(
            "appearanceToggleDot"
        );

    const appearanceIcon =
        document.getElementById(
            "appearanceIcon"
        );

    const systemThemeToggle =
        document.getElementById(
            "systemThemeToggle"
        );

    const systemThemeToggleDot =
        document.getElementById(
            "systemThemeToggleDot"
        );


    const shopName =
        document.getElementById(
            "shopName"
        );

    const shopPhone =
        document.getElementById(
            "shopPhone"
        );

    const shopEmail =
        document.getElementById(
            "shopEmail"
        );

    const shopLocation =
        document.getElementById(
            "shopLocation"
        );


    const currency =
        document.getElementById(
            "currency"
        );

    const defaultPayment =
        document.getElementById(
            "defaultPayment"
        );

    const lowStockThreshold =
        document.getElementById(
            "lowStockThreshold"
        );

    const receiptFooter =
        document.getElementById(
            "receiptFooter"
        );


    const showPhoneOnReceipt =
        document.getElementById(
            "showPhoneOnReceipt"
        );

    const showLocationOnReceipt =
        document.getElementById(
            "showLocationOnReceipt"
        );


    const sidebarShopName =
        document.getElementById(
            "sidebarShopName"
        );


    const saveShopProfile =
        document.getElementById(
            "saveShopProfile"
        );

    const savePOSPreferences =
        document.getElementById(
            "savePOSPreferences"
        );

    const saveReceiptSettings =
        document.getElementById(
            "saveReceiptSettings"
        );


    const exportDataButton =
        document.getElementById(
            "exportData"
        );

    const importDataButton =
        document.getElementById(
            "importData"
        );

    const importFile =
        document.getElementById(
            "importFile"
        );

    const clearAllData =
        document.getElementById(
            "clearAllData"
        );


    const toast =
        document.getElementById(
            "toast"
        );

    const toastMessage =
        document.getElementById(
            "toastMessage"
        );


    // ========================================================
    // DEFAULT SETTINGS
    // ========================================================

    const defaultSettings = {

        shopName:
            "Mwangaza Mini Mart",

        shopPhone:
            "",

        shopEmail:
            "",

        shopLocation:
            "",

        currency:
            "KSh",

        defaultPayment:
            "Cash",

        lowStockThreshold:
            5,

        receiptFooter:
            "Thank you for shopping with us!",

        showPhoneOnReceipt:
            true,

        showLocationOnReceipt:
            true

    };


    // ========================================================
    // LOAD SETTINGS
    // ========================================================

    function getSettings() {

        try {

            const stored =
                localStorage.getItem(
                    "settings"
                );


            if (!stored) {

                return {
                    ...defaultSettings
                };

            }


            const parsed =
                JSON.parse(stored);


            if (
                !parsed ||
                typeof parsed !== "object"
            ) {

                return {
                    ...defaultSettings
                };

            }


            return {

                ...defaultSettings,
                ...parsed

            };

        } catch (error) {

            console.error(
                "SimplePOS: Unable to load settings.",
                error
            );


            return {
                ...defaultSettings
            };

        }

    }


    // ========================================================
    // SAVE SETTINGS
    // ========================================================

    function saveSettings(settings) {

        try {

            localStorage.setItem(
                "settings",
                JSON.stringify(settings)
            );

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
    // STATE
    // ========================================================

    let settings =
        getSettings();


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
            () => {

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


                settings.shopName =
                    name;


                settings.shopPhone =
                    shopPhone
                        ? shopPhone.value.trim()
                        : "";


                settings.shopEmail =
                    shopEmail
                        ? shopEmail.value.trim()
                        : "";


                settings.shopLocation =
                    shopLocation
                        ? shopLocation.value.trim()
                        : "";


                const saved =
                    saveSettings(
                        settings
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
            () => {

                settings.currency =
                    currency
                        ? currency.value
                        : "KSh";


                settings.defaultPayment =
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

                    threshold = 5;

                }


                settings.lowStockThreshold =
                    Math.floor(
                        threshold
                    );


                settings.receiptFooter =
                    receiptFooter
                        ? receiptFooter.value.trim()
                        : "";


                const saved =
                    saveSettings(
                        settings
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
            () => {

                settings.showPhoneOnReceipt =
                    showPhoneOnReceipt
                        ? showPhoneOnReceipt.checked
                        : true;


                settings.showLocationOnReceipt =
                    showLocationOnReceipt
                        ? showLocationOnReceipt.checked
                        : true;


                const saved =
                    saveSettings(
                        settings
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
            localStorage.getItem(
                "theme"
            );


        if (
            savedTheme === "dark"
        ) {

            applyDarkTheme();

        } else if (
            savedTheme === "light"
        ) {

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

        localStorage.removeItem(
            "theme"
        );


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
            localStorage.getItem(
                "theme"
            );


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
    // EXPORT DATA
    // ========================================================

    if (exportDataButton) {

        exportDataButton.addEventListener(
            "click",
            () => {

                const backup = {

                    exportedAt:
                        new Date().toISOString(),

                    application:
                        "SimplePOS",

                    version:
                        "1.0.0",

                    products:
                        getLocalStorageArray(
                            "products"
                        ),

                    salesHistory:
                        getLocalStorageArray(
                            "salesHistory"
                        ),

                    lastSale:
                        getLocalStorageObject(
                            "lastSale"
                        ),

                    settings:
                        getSettings()

                };


                try {

                    const data =
                        JSON.stringify(
                            backup,
                            null,
                            4
                        );


                    const blob =
                        new Blob(
                            [data],
                            {
                                type:
                                    "application/json"
                            }
                        );


                    const url =
                        URL.createObjectURL(
                            blob
                        );


                    const link =
                        document.createElement(
                            "a"
                        );


                    const date =
                        new Date()
                            .toISOString()
                            .slice(
                                0,
                                10
                            );


                    link.href =
                        url;


                    link.download =
                        `simplepos-backup-${date}.json`;


                    document.body.appendChild(
                        link
                    );


                    link.click();


                    link.remove();


                    URL.revokeObjectURL(
                        url
                    );


                    showToast(
                        "POS data exported successfully."
                    );

                } catch (error) {

                    console.error(
                        "SimplePOS: Export failed.",
                        error
                    );


                    showToast(
                        "Unable to export POS data.",
                        "error"
                    );

                }

            }
        );

    }


    // ========================================================
    // IMPORT DATA
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
                        "Importing a backup may replace your current products, sales history and settings.\n\nContinue?"
                    );


                if (!confirmed) {

                    importFile.value =
                        "";

                    return;

                }


                const reader =
                    new FileReader();


                reader.onload =
                    event => {

                        try {

                            const backup =
                                JSON.parse(
                                    event.target.result
                                );


                            if (
                                !backup ||
                                typeof backup !==
                                "object"
                            ) {

                                throw new Error(
                                    "Invalid backup."
                                );

                            }


                            // -------------------------------
                            // PRODUCTS
                            // -------------------------------

                            if (
                                Array.isArray(
                                    backup.products
                                )
                            ) {

                                localStorage.setItem(
                                    "products",
                                    JSON.stringify(
                                        backup.products
                                    )
                                );

                            }


                            // -------------------------------
                            // SALES HISTORY
                            // -------------------------------

                            if (
                                Array.isArray(
                                    backup.salesHistory
                                )
                            ) {

                                localStorage.setItem(
                                    "salesHistory",
                                    JSON.stringify(
                                        backup.salesHistory
                                    )
                                );

                            }


                            // -------------------------------
                            // LAST SALE
                            // -------------------------------

                            if (
                                backup.lastSale &&
                                typeof backup.lastSale ===
                                "object"
                            ) {

                                localStorage.setItem(
                                    "lastSale",
                                    JSON.stringify(
                                        backup.lastSale
                                    )
                                );

                            }


                            // -------------------------------
                            // SETTINGS
                            // -------------------------------

                            if (
                                backup.settings &&
                                typeof backup.settings ===
                                "object"
                            ) {

                                settings = {

                                    ...defaultSettings,
                                    ...backup.settings

                                };


                                saveSettings(
                                    settings
                                );

                            }


                            showToast(
                                "Backup imported successfully. Reloading..."
                            );


                            setTimeout(
                                () => {

                                    window.location.reload();

                                },
                                1200
                            );

                        } catch (error) {

                            console.error(
                                "SimplePOS: Import failed.",
                                error
                            );


                            showToast(
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


                reader.readAsText(
                    file
                );


                importFile.value =
                    "";

            }
        );

    }


    // ========================================================
    // CLEAR ALL DATA
    // ========================================================

    if (clearAllData) {

        clearAllData.addEventListener(
            "click",
            () => {

                const firstConfirmation =
                    confirm(
                        "WARNING!\n\nThis will permanently delete your products, sales history, last receipt and SimplePOS settings from this browser.\n\nDo you want to continue?"
                    );


                if (!firstConfirmation) {

                    return;

                }


                const secondConfirmation =
                    prompt(
                        'Type "DELETE" to permanently clear all SimplePOS data.'
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

                    localStorage.removeItem(
                        "products"
                    );

                    localStorage.removeItem(
                        "salesHistory"
                    );

                    localStorage.removeItem(
                        "lastSale"
                    );

                    localStorage.removeItem(
                        "settings"
                    );


                    showToast(
                        "All SimplePOS data has been cleared."
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
                        "Unable to clear application data.",
                        "error"
                    );

                }

            }
        );

    }


    // ========================================================
    // LOCAL STORAGE ARRAY
    // ========================================================

    function getLocalStorageArray(
        key
    ) {

        try {

            const value =
                localStorage.getItem(
                    key
                );


            if (!value) {

                return [];

            }


            const parsed =
                JSON.parse(
                    value
                );


            return Array.isArray(
                parsed
            )
                ? parsed
                : [];

        } catch (error) {

            return [];

        }

    }


    // ========================================================
    // LOCAL STORAGE OBJECT
    // ========================================================

    function getLocalStorageObject(
        key
    ) {

        try {

            const value =
                localStorage.getItem(
                    key
                );


            if (!value) {

                return null;

            }


            return JSON.parse(
                value
            );

        } catch (error) {

            return null;

        }

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
                document.createElement(
                    "i"
                );


            icon.setAttribute(
                "data-lucide",
                type === "error"
                    ? "alert-circle"
                    : "check-circle-2"
            );


            icon.className =
                "w-4 h-4";


            toastIcon.appendChild(
                icon
            );


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


        toast.classList.remove(
            "hidden"
        );

        toast.classList.add(
            "toast"
        );


        refreshIcons();


        if (toastTimer) {

            clearTimeout(
                toastTimer
            );

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

}