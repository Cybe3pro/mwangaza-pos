// ============================================================
// SimplePOS
// Dashboard Controller
//
// DATA SOURCES
// ------------------------------------------------------------
// Products: Flask API -> /api/products
// Sales: Flask API -> /api/sales
//
// Backend:
// http://127.0.0.1:5000
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    initializeDashboard();
});

// ============================================================
// API CONFIGURATION
// ============================================================

const API_BASE_URL = "http://127.0.0.1:5000/api";

// ============================================================
// INITIALIZE DASHBOARD
// ============================================================

function initializeDashboard() {
    initializeClock();
    initializeTheme();
    refreshDashboard();

    // Refresh periodically in case another page changes data.
    setInterval(refreshDashboard, 5000);
}

// ============================================================
// REFRESH EVERYTHING
// ============================================================

async function refreshDashboard() {
    try {
        const [products, salesHistory] = await Promise.all([
            getProducts(),
            getSalesHistory()
        ]);

        updateStatistics(products, salesHistory);
        renderRecentSales(salesHistory);
        renderLowStock(products);

        refreshIcons();

    } catch (error) {
        console.error(
            "SimplePOS Dashboard: Could not refresh dashboard.",
            error
        );
    }
}

// ============================================================
// GET PRODUCTS FROM FLASK API
// ============================================================

async function getProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);

        if (!response.ok) {
            throw new Error(
                `Products API returned HTTP ${response.status}`
            );
        }

        const products = await response.json();

        if (!Array.isArray(products)) {
            console.warn(
                "SimplePOS Dashboard: Products API did not return an array."
            );

            return [];
        }

        return products;

    } catch (error) {
        console.error(
            "SimplePOS Dashboard: Could not load products.",
            error
        );

        return [];
    }
}

// ============================================================
// GET SALES HISTORY FROM FLASK API
// ============================================================

async function getSalesHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/sales`);

        if (!response.ok) {
            throw new Error(
                `Sales API returned HTTP ${response.status}`
            );
        }

        const result = await response.json();

        if (
            !result ||
            result.status !== "success" ||
            !Array.isArray(result.sales)
        ) {
            console.warn(
                "SimplePOS Dashboard: Invalid sales API response."
            );

            return [];
        }

        return result.sales;

    } catch (error) {
        console.error(
            "SimplePOS Dashboard: Could not load sales history.",
            error
        );

        return [];
    }
}

// ============================================================
// UPDATE STATISTICS
// ============================================================

function updateStatistics(products, salesHistory) {

    // --------------------------------------------------------
    // TODAY'S SALES
    // --------------------------------------------------------

    const todaySales = getTodaySales(salesHistory);

    const todayTotal = todaySales.reduce((total, sale) => {
        return total + getSaleTotal(sale);
    }, 0);

    const transactionCount = todaySales.length;

    // --------------------------------------------------------
    // PRODUCTS
    // --------------------------------------------------------

    const totalStock = products.reduce((total, product) => {
        return total + getStock(product);
    }, 0);

    const differentProducts = products.length;

    // --------------------------------------------------------
    // LOW STOCK
    // --------------------------------------------------------

    const lowStockProducts = getLowStockProducts(products);

    // --------------------------------------------------------
    // UPDATE DOM
    // --------------------------------------------------------

    const todaySalesElement =
        document.getElementById("todaySales");

    const todayTransactionsElement =
        document.getElementById("todayTransactions");

    const productsInStockElement =
        document.getElementById("productsInStock");

    const differentProductsElement =
        document.getElementById("differentProducts");

    const lowStockCountElement =
        document.getElementById("lowStockCount");

    if (todaySalesElement) {
        todaySalesElement.textContent =
            formatCurrency(todayTotal);
    }

    if (todayTransactionsElement) {
        todayTransactionsElement.textContent =
            transactionCount;
    }

    if (productsInStockElement) {
        productsInStockElement.textContent =
            totalStock.toLocaleString();
    }

    if (differentProductsElement) {
        differentProductsElement.textContent =
            `${differentProducts} ${
                differentProducts === 1
                    ? "different product"
                    : "different products"
            }`;
    }

    if (lowStockCountElement) {
        lowStockCountElement.textContent =
            lowStockProducts.length;
    }

    updateSalesMessage(transactionCount);
    updateTransactionMessage(transactionCount);
    updateLowStockMessage(lowStockProducts.length);
}

// ============================================================
// GET TODAY'S SALES
// ============================================================

function getTodaySales(salesHistory) {

    const now = new Date();

    return salesHistory.filter(sale => {

        if (!sale || !sale.date) {
            return false;
        }

        const saleDate = parseSaleDate(sale.date);

        if (Number.isNaN(saleDate.getTime())) {
            return false;
        }

        return (
            saleDate.getFullYear() === now.getFullYear() &&
            saleDate.getMonth() === now.getMonth() &&
            saleDate.getDate() === now.getDate()
        );
    });
}

// ============================================================
// PARSE SALE DATE
//
// SQLite stores CURRENT_TIMESTAMP in UTC:
//
// YYYY-MM-DD HH:MM:SS
//
// We explicitly tell JavaScript that this value is UTC,
// allowing the browser to convert it to local Kenyan time.
// ============================================================

function parseSaleDate(dateValue) {

    if (!dateValue) {
        return new Date(NaN);
    }

    const normalized =
        String(dateValue).replace(" ", "T");

    return new Date(`${normalized}Z`);
}

// ============================================================
// GET SALE TOTAL
// ============================================================

function getSaleTotal(sale) {

    if (!sale) {
        return 0;
    }

    // Backend already calculates the final total.
    const storedTotal = Number(sale.total);

    if (Number.isFinite(storedTotal)) {
        return storedTotal;
    }

    // Fallback calculation.
    if (Array.isArray(sale.items)) {

        return sale.items.reduce((total, item) => {

            const price =
                Number(item.unitPrice) || 0;

            const quantity =
                Number(item.quantity) || 0;

            return total + (price * quantity);

        }, 0);
    }

    return 0;
}

// ============================================================
// GET PRODUCT STOCK
// ============================================================

function getStock(product) {

    if (!product) {
        return 0;
    }

    // Flask product API returns STOCK.
    const stock = Number(product.STOCK);

    if (!Number.isFinite(stock)) {
        return 0;
    }

    return Math.max(0, stock);
}

// ============================================================
// GET LOW STOCK PRODUCTS
// ============================================================

function getLowStockProducts(products) {

    return products.filter(product => {

        const stock = getStock(product);

        // Flask API returns LOW_STOCK_THRESHOLD.
        const threshold =
            Number(product.LOW_STOCK_THRESHOLD);

        const validThreshold =
            Number.isFinite(threshold)
                ? Math.max(0, threshold)
                : 5;

        return (
            stock > 0 &&
            stock <= validThreshold
        );
    });
}

// ============================================================
// RECENT SALES
// ============================================================

function renderRecentSales(salesHistory) {

    const table =
        document.getElementById("recentSalesTable");

    const emptyState =
        document.getElementById("recentSalesEmpty");

    if (!table) {
        return;
    }

    table.innerHTML = "";

    // --------------------------------------------------------
    // SORT NEWEST FIRST
    // --------------------------------------------------------

    const recentSales = [...salesHistory]
        .sort((a, b) => {

            const dateA =
                parseSaleDate(a.date).getTime() || 0;

            const dateB =
                parseSaleDate(b.date).getTime() || 0;

            return dateB - dateA;
        })
        .slice(0, 5);

    // --------------------------------------------------------
    // EMPTY STATE
    // --------------------------------------------------------

    if (recentSales.length === 0) {

        if (emptyState) {
            emptyState.classList.remove("hidden");
        }

        refreshIcons();

        return;
    }

    if (emptyState) {
        emptyState.classList.add("hidden");
    }

    // --------------------------------------------------------
    // RENDER SALES
    // --------------------------------------------------------

    recentSales.forEach(sale => {

        const row =
            document.createElement("tr");

        row.className =
            "border-b border-gray-100 dark:border-slate-800 " +
            "hover:bg-slate-50/50 dark:hover:bg-slate-800/40 " +
            "transition";

        const receiptNumber =
            sale.receiptNumber ||
            sale.id ||
            "N/A";

        const paymentMethod =
            sale.paymentMethod ||
            "Cash";

        const timeFormatted =
            formatTime(sale.date);

        const totalFormatted =
            formatCurrency(getSaleTotal(sale));

        row.innerHTML = `
            <td class="px-5 py-4 font-bold text-slate-900 dark:text-white">
                ${escapeHTML(receiptNumber)}
            </td>

            <td class="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs">
                ${timeFormatted}
            </td>

            <td class="px-5 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    ${escapeHTML(paymentMethod)}
                </span>
            </td>

            <td class="px-5 py-4 text-right font-extrabold text-slate-900 dark:text-white">
                ${totalFormatted}
            </td>
        `;

        table.appendChild(row);
    });
}

// ============================================================
// LOW STOCK LIST
// ============================================================

function renderLowStock(products) {

    const container =
        document.getElementById("lowStockList");

    const emptyState =
        document.getElementById("lowStockEmpty");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const lowStockProducts =
        getLowStockProducts(products).slice(0, 5);

    // --------------------------------------------------------
    // EMPTY STATE
    // --------------------------------------------------------

    if (lowStockProducts.length === 0) {

        if (emptyState) {
            emptyState.classList.remove("hidden");
        }

        refreshIcons();

        return;
    }

    if (emptyState) {
        emptyState.classList.add("hidden");
    }

    // --------------------------------------------------------
    // RENDER LOW STOCK PRODUCTS
    // --------------------------------------------------------

    lowStockProducts.forEach(product => {

        const item =
            document.createElement("div");

        item.className =
            "flex items-center justify-between p-3 rounded-2xl " +
            "bg-amber-500/5 border border-amber-500/20";

        const name =
            product.NAME || "Unnamed product";

        const stock =
            getStock(product);

        item.innerHTML = `
            <div class="flex items-center gap-3">

                <div class="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
                    !
                </div>

                <div>
                    <h4 class="font-bold text-xs text-slate-900 dark:text-white">
                        ${escapeHTML(name)}
                    </h4>

                    <p class="text-[10px] text-slate-500 dark:text-slate-400">
                        Low stock alert
                    </p>
                </div>

            </div>

            <span class="text-xs font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                ${stock} left
            </span>
        `;

        container.appendChild(item);
    });
}

// ============================================================
// MESSAGES
// ============================================================

function updateSalesMessage(count) {

    const el =
        document.getElementById("salesComparison");

    if (!el) return;

    if (count === 0) {
        el.textContent = "No sales today";

    } else if (count === 1) {
        el.textContent = "1 sale recorded today";

    } else {
        el.textContent =
            `${count} sales recorded today`;
    }
}

// ============================================================

function updateTransactionMessage(count) {

    const el =
        document.getElementById("transactionMessage");

    if (!el) return;

    if (count === 0) {
        el.textContent = "No transactions today";

    } else if (count === 1) {
        el.textContent =
            "1 transaction completed";

    } else {
        el.textContent =
            `${count} transactions completed`;
    }
}

// ============================================================

function updateLowStockMessage(count) {

    const el =
        document.getElementById("lowStockMessage");

    if (!el) return;

    if (count === 0) {
        el.textContent =
            "Everything is well stocked";

    } else if (count === 1) {
        el.textContent =
            "1 product needs restocking";

    } else {
        el.textContent =
            `${count} products need restocking`;
    }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function formatCurrency(amount) {

    const value =
        Number(amount) || 0;

    return `KSh ${value.toLocaleString("en-KE")}`;
}

// ============================================================

function formatTime(dateString) {

    if (!dateString) {
        return "--:--";
    }

    const date =
        parseSaleDate(dateString);

    if (Number.isNaN(date.getTime())) {
        return "--:--";
    }

    return date.toLocaleTimeString("en-KE", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

// ============================================================
// CLOCK
// ============================================================

function initializeClock() {

    const dateEl =
        document.getElementById("currentDate");

    const timeEl =
        document.getElementById("currentTime");

    const greetingEl =
        document.getElementById("greetingText");

    function update() {

        const now =
            new Date();

        if (dateEl) {

            dateEl.textContent =
                now.toLocaleDateString("en-KE", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                });
        }

        if (timeEl) {

            timeEl.textContent =
                now.toLocaleTimeString("en-KE", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                });
        }

        if (greetingEl) {

            const hour =
                now.getHours();

            if (hour < 12) {

                greetingEl.textContent =
                    "🌅 Good Morning";

            } else if (hour < 18) {

                greetingEl.textContent =
                    "☀️ Good Afternoon";

            } else {

                greetingEl.textContent =
                    "🌙 Good Evening";
            }
        }
    }

    update();

    setInterval(update, 1000);
}

// ============================================================
// THEME
// ============================================================

function initializeTheme() {

    const button =
        document.getElementById("themeToggle");

    const icon =
        document.getElementById("themeIcon");

    if (!button) {
        return;
    }

    // --------------------------------------------------------
    // APPLY STORED PREFERENCE
    // --------------------------------------------------------

    const storedTheme =
        localStorage.getItem("theme");

    if (
        storedTheme === "dark" ||
        (
            !storedTheme &&
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
        )
    ) {

        document.documentElement.classList.add("dark");

        if (icon) {
            icon.setAttribute(
                "data-lucide",
                "sun"
            );
        }

    } else {

        document.documentElement.classList.remove("dark");

        if (icon) {
            icon.setAttribute(
                "data-lucide",
                "moon"
            );
        }
    }

    // --------------------------------------------------------
    // TOGGLE
    // --------------------------------------------------------

    button.addEventListener("click", () => {

        const isDark =
            document.documentElement.classList.toggle("dark");

        localStorage.setItem(
            "theme",
            isDark ? "dark" : "light"
        );

        if (icon) {

            icon.setAttribute(
                "data-lucide",
                isDark ? "sun" : "moon"
            );
        }

        refreshIcons();
    });
}

// ============================================================
// REFRESH ICONS
// ============================================================

function refreshIcons() {

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// ============================================================
// HTML ESCAPE
//
// Protects dashboard-generated text before inserting it
// into innerHTML.
// ============================================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}