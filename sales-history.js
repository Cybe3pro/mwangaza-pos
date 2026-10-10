// ============================================================
// SimplePOS
// Sales History & Analytics Controller
//
// DATA SOURCE:
// Flask API → SQLite database
//
// ENDPOINT:
// GET /api/sales
// ============================================================


const API_BASE_URL =
    "http://127.0.0.1:5000/api";


// ============================================================
// STATE
// ============================================================

let allSales = [];

let weeklyChart = null;


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeSalesHistory();

    }
);


function initializeSalesHistory() {

    initializeTheme();

    initializeSearch();

    loadSales();

    refreshIcons();

}


// ============================================================
// LOAD SALES FROM BACKEND
// ============================================================

async function loadSales() {

    const table =
        document.getElementById(
            "salesHistory"
        );

    const emptyState =
        document.getElementById(
            "emptyHistory"
        );


    try {

        // ----------------------------------------------------
        // Loading state
        // ----------------------------------------------------

        if (table) {

            table.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        class="px-6 py-12
                               text-center">

                        <div
                            class="flex
                                   flex-col
                                   items-center
                                   gap-3">

                            <div
                                class="w-10 h-10
                                       border-4
                                       border-green-200
                                       border-t-green-600
                                       rounded-full
                                       animate-spin">
                            </div>

                            <p
                                class="text-sm
                                       text-gray-500
                                       dark:text-gray-400">

                                Loading sales history...

                            </p>

                        </div>

                    </td>

                </tr>

            `;

        }


        // ----------------------------------------------------
        // Request sales
        // ----------------------------------------------------

        const response =
            await fetch(
                `${API_BASE_URL}/sales`
            );


        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }


        const data =
            await response.json();


        // ----------------------------------------------------
        // Validate response
        // ----------------------------------------------------

        if (
            data.status !== "success"
            || !Array.isArray(data.sales)
        ) {

            throw new Error(
                data.message ||
                "Invalid sales data received."
            );

        }


        // ----------------------------------------------------
        // Store sales
        // ----------------------------------------------------

        allSales =
            data.sales;


        console.log(
            "SALES HISTORY LOADED:",
            allSales
        );


        // ----------------------------------------------------
        // Render everything
        // ----------------------------------------------------

        renderAll();


    } catch (error) {

        console.error(
            "SALES HISTORY LOAD ERROR:",
            error
        );


        allSales = [];


        if (table) {

            table.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        class="px-6 py-12
                               text-center">

                        <div
                            class="flex
                                   flex-col
                                   items-center">

                            <div
                                class="w-14 h-14
                                       rounded-2xl
                                       bg-red-100
                                       dark:bg-red-900/30
                                       text-red-500
                                       flex
                                       items-center
                                       justify-center">

                                <i
                                    data-lucide="wifi-off"
                                    class="w-7 h-7">
                                </i>

                            </div>


                            <h3
                                class="font-semibold
                                       text-lg
                                       mt-4">

                                Unable to load sales

                            </h3>


                            <p
                                class="text-sm
                                       text-gray-500
                                       dark:text-gray-400
                                       mt-1">

                                Make sure the Mwangaza
                                backend is running.

                            </p>


                            <button
                                type="button"
                                id="retrySales"
                                class="mt-4
                                       px-4 py-2
                                       bg-green-600
                                       hover:bg-green-700
                                       text-white
                                       rounded-xl
                                       font-medium">

                                Try Again

                            </button>

                        </div>

                    </td>

                </tr>

            `;


            const retryButton =
                document.getElementById(
                    "retrySales"
                );


            if (retryButton) {

                retryButton.addEventListener(
                    "click",
                    loadSales
                );

            }

        }


        if (emptyState) {

            emptyState.classList.add(
                "hidden"
            );

        }


        refreshIcons();

    }

}


// ============================================================
// RENDER EVERYTHING
// ============================================================

function renderAll() {

    renderSummary();

    renderWeeklyChart();

    renderInsights();

    renderPaymentBreakdown();

    renderSalesTable(
        allSales
    );

}


// ============================================================
// SUMMARY
// ============================================================

function renderSummary() {

    const todaySalesElement =
        document.getElementById(
            "todaySales"
        );

    const weekSalesElement =
        document.getElementById(
            "weekSales"
        );

    const transactionsElement =
        document.getElementById(
            "totalTransactions"
        );

    const itemsElement =
        document.getElementById(
            "totalItemsSold"
        );


    const today =
        getTodaySales();


    const week =
        getWeekSales();


    const totalItems =
        allSales.reduce(
            (
                total,
                sale
            ) => {

                return (
                    total +
                    getSaleItemCount(sale)
                );

            },
            0
        );


    if (todaySalesElement) {

        todaySalesElement.textContent =
            formatCurrency(today);

    }


    if (weekSalesElement) {

        weekSalesElement.textContent =
            formatCurrency(week);

    }


    if (transactionsElement) {

        transactionsElement.textContent =
            allSales.length.toLocaleString();

    }


    if (itemsElement) {

        itemsElement.textContent =
            totalItems.toLocaleString();

    }

}


// ============================================================
// TODAY'S SALES
// ============================================================

function getTodaySales() {

    const now =
        new Date();


    return allSales.reduce(
        (
            total,
            sale
        ) => {

            const date =
                parseSaleDate(
                    sale.date
                );


            if (
                isSameDay(
                    date,
                    now
                )
            ) {

                return (
                    total +
                    getSaleTotal(sale)
                );

            }


            return total;

        },
        0
    );

}


// ============================================================
// THIS WEEK'S SALES
// ============================================================

function getWeekSales() {

    const weekStart =
        getStartOfWeek(
            new Date()
        );


    return allSales.reduce(
        (
            total,
            sale
        ) => {

            const date =
                parseSaleDate(
                    sale.date
                );


            if (
                date >= weekStart
            ) {

                return (
                    total +
                    getSaleTotal(sale)
                );

            }


            return total;

        },
        0
    );

}


// ============================================================
// WEEKLY GRAPH
// ============================================================

function renderWeeklyChart() {

    const canvas =
        document.getElementById(
            "weeklySalesChart"
        );


    if (!canvas) {

        return;

    }


    const ctx =
        canvas.getContext(
            "2d"
        );


    const weekStart =
        getStartOfWeek(
            new Date()
        );


    const labels = [

        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"

    ];


    const dailySales = [

        0,
        0,
        0,
        0,
        0,
        0,
        0

    ];


    allSales.forEach(
        sale => {

            const date =
                parseSaleDate(
                    sale.date
                );


            if (
                date < weekStart
            ) {

                return;

            }


            const dayIndex =
                Math.floor(
                    (
                        date -
                        weekStart
                    ) /
                    (
                        1000 *
                        60 *
                        60 *
                        24
                    )
                );


            if (
                dayIndex >= 0 &&
                dayIndex < 7
            ) {

                dailySales[dayIndex] +=
                    getSaleTotal(sale);

            }

        }
    );


    if (weeklyChart) {

        weeklyChart.destroy();

    }


    weeklyChart =
        new Chart(
            ctx,
            {

                type: "bar",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                "Sales (KSh)",

                            data:
                                dailySales,

                            borderWidth: 0,

                            borderRadius: 8,

                            backgroundColor:
                                "#16A34A"

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {

                            display: false

                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function(
                                        context
                                    ) {

                                        return (
                                            " KSh " +
                                            Number(
                                                context.raw
                                            ).toLocaleString(
                                                "en-KE"
                                            )
                                        );

                                    }

                            }

                        }

                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {

                                callback:
                                    function(
                                        value
                                    ) {

                                        return (
                                            "KSh " +
                                            Number(
                                                value
                                            ).toLocaleString(
                                                "en-KE"
                                            )
                                        );

                                    }

                            }

                        }

                    }

                }

            }
        );

}


// ============================================================
// SALES INSIGHTS
// ============================================================

function renderInsights() {

    const bestDayElement =
        document.getElementById(
            "bestSalesDay"
        );

    const averageElement =
        document.getElementById(
            "averageTransaction"
        );

    const bestProductElement =
        document.getElementById(
            "bestProduct"
        );

    const revenueElement =
        document.getElementById(
            "allTimeRevenue"
        );


    const revenue =
        allSales.reduce(
            (
                total,
                sale
            ) => {

                return (
                    total +
                    getSaleTotal(sale)
                );

            },
            0
        );


    const average =
        allSales.length > 0
            ? revenue / allSales.length
            : 0;


    const bestDay =
        getBestSalesDay();


    const bestProduct =
        getBestProduct();


    if (bestDayElement) {

        bestDayElement.textContent =
            bestDay
                ? `${bestDay.name} — ${formatCurrency(bestDay.amount)}`
                : "No data";

    }


    if (averageElement) {

        averageElement.textContent =
            formatCurrency(
                average
            );

    }


    if (bestProductElement) {

        bestProductElement.textContent =
            bestProduct
                ? `${bestProduct.name} — ${bestProduct.quantity} sold`
                : "No data";

    }


    if (revenueElement) {

        revenueElement.textContent =
            formatCurrency(
                revenue
            );

    }

}


// ============================================================
// BEST SALES DAY
// ============================================================

function getBestSalesDay() {

    if (
        allSales.length === 0
    ) {

        return null;

    }


    const days = {};


    allSales.forEach(
        sale => {

            const date =
                parseSaleDate(
                    sale.date
                );


            const key =
                date.toLocaleDateString(
                    "en-KE",
                    {
                        weekday: "long"
                    }
                );


            if (!days[key]) {

                days[key] = 0;

            }


            days[key] +=
                getSaleTotal(sale);

        }
    );


    let bestName = null;

    let bestAmount = 0;


    Object.entries(days)
        .forEach(
            (
                [
                    name,
                    amount
                ]
            ) => {

                if (
                    amount >
                    bestAmount
                ) {

                    bestName =
                        name;

                    bestAmount =
                        amount;

                }

            }
        );


    return {

        name:
            bestName,

        amount:
            bestAmount

    };

}


// ============================================================
// BEST PRODUCT
// ============================================================

function getBestProduct() {

    const products = {};


    allSales.forEach(
        sale => {

            if (
                !Array.isArray(
                    sale.items
                )
            ) {

                return;

            }


            sale.items.forEach(
                item => {

                    const name =
                        item.name ||
                        "Unknown Product";


                    if (!products[name]) {

                        products[name] = 0;

                    }


                    products[name] +=
                        Number(
                            item.quantity
                        ) || 0;

                }
            );

        }
    );


    let bestName = null;

    let bestQuantity = 0;


    Object.entries(products)
        .forEach(
            (
                [
                    name,
                    quantity
                ]
            ) => {

                if (
                    quantity >
                    bestQuantity
                ) {

                    bestName =
                        name;

                    bestQuantity =
                        quantity;

                }

            }
        );


    if (!bestName) {

        return null;

    }


    return {

        name:
            bestName,

        quantity:
            bestQuantity

    };

}


// ============================================================
// PAYMENT BREAKDOWN
// ============================================================

function renderPaymentBreakdown() {

    const container =
        document.getElementById(
            "paymentBreakdown"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    const payments = {};


    allSales.forEach(
        sale => {

            const method =
                sale.paymentMethod ||
                "Unknown";


            if (!payments[method]) {

                payments[method] = {

                    total: 0,

                    transactions: 0

                };

            }


            payments[method].total +=
                getSaleTotal(sale);


            payments[method].transactions++;

        }
    );


    const entries =
        Object.entries(
            payments
        );


    if (
        entries.length === 0
    ) {

        container.innerHTML = `

            <div
                class="col-span-full
                       text-center
                       py-8
                       text-gray-400">

                No payment data yet.

            </div>

        `;

        return;

    }


    entries.forEach(
        (
            [
                method,
                data
            ]
        ) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "border " +
                "border-gray-200 " +
                "dark:border-slate-800 " +
                "rounded-xl " +
                "p-4";


            card.innerHTML = `

                <div
                    class="flex
                           items-center
                           justify-between">

                    <div>

                        <p
                            class="font-semibold">

                            ${escapeHtml(
                                method
                            )}

                        </p>

                        <p
                            class="text-xs
                                   text-gray-500
                                   dark:text-gray-400
                                   mt-1">

                            ${data.transactions}

                            ${
                                data.transactions === 1
                                    ? "transaction"
                                    : "transactions"
                            }

                        </p>

                    </div>

                    <i
                        data-lucide="credit-card"
                        class="text-green-600">
                    </i>

                </div>

                <p
                    class="text-xl
                           font-heading
                           font-bold
                           mt-3">

                    ${formatCurrency(
                        data.total
                    )}

                </p>

            `;


            container.appendChild(
                card
            );

        }
    );


    refreshIcons();

}


// ============================================================
// SALES TABLE
// ============================================================

function renderSalesTable(
    sales
) {

    const table =
        document.getElementById(
            "salesHistory"
        );

    const emptyState =
        document.getElementById(
            "emptyHistory"
        );


    if (!table) {

        return;

    }


    table.innerHTML = "";


    if (
        !sales ||
        sales.length === 0
    ) {

        if (emptyState) {

            emptyState.classList.remove(
                "hidden"
            );

        }

        return;

    }


    if (emptyState) {

        emptyState.classList.add(
            "hidden"
        );

    }


    sales.forEach(
        sale => {

            const date =
                parseSaleDate(
                    sale.date
                );


            const row =
                document.createElement(
                    "tr"
                );


            row.className =
                "border-t " +
                "border-gray-100 " +
                "dark:border-slate-800 " +
                "hover:bg-gray-50 " +
                "dark:hover:bg-slate-800/50";


            const itemCount =
                getSaleItemCount(
                    sale
                );


            row.innerHTML = `

                <td
                    class="px-6 py-4">

                    <span
                        class="font-semibold
                               text-green-600">

                        #${escapeHtml(
                            sale.receiptNumber ||
                            "N/A"
                        )}

                    </span>

                </td>


                <td
                    class="px-6 py-4
                           text-sm">

                    ${date.toLocaleDateString(
                        "en-KE"
                    )}

                </td>


                <td
                    class="px-6 py-4
                           text-sm">

                    ${date.toLocaleTimeString(
                        "en-KE",
                        {
                            hour: "2-digit",
                            minute: "2-digit"
                        }
                    )}

                </td>


                <td
                    class="px-6 py-4
                           text-sm">

                    ${itemCount}

                </td>


                <td
                    class="px-6 py-4
                           font-semibold">

                    ${formatCurrency(
                        getSaleTotal(sale)
                    )}

                </td>


                <td
                    class="px-6 py-4">

                    <span
                        class="inline-flex
                               items-center
                               px-3 py-1
                               rounded-full
                               text-xs
                               font-medium
                               bg-green-50
                               text-green-700
                               dark:bg-green-900/20
                               dark:text-green-400">

                        ${escapeHtml(
                            sale.paymentMethod ||
                            "Unknown"
                        )}

                    </span>

                </td>


                <td
                    class="px-6 py-4">

                    <button
                        type="button"
                        class="view-receipt
                               text-green-600
                               hover:underline
                               text-sm
                               font-medium"
                        data-sale-id="${sale.id}">

                        View Receipt

                    </button>

                </td>

            `;


            table.appendChild(
                row
            );

        }
    );


    attachReceiptButtons();

    refreshIcons();

}


// ============================================================
// RECEIPT BUTTONS
// ============================================================

function attachReceiptButtons() {

    document
        .querySelectorAll(
            ".view-receipt"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const saleId =
                            button.dataset.saleId;


                        await openReceipt(
                            saleId
                        );

                    }
                );

            }
        );

}


// ============================================================
// OPEN RECEIPT
// ============================================================

async function openReceipt(
    saleId
) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/sales/${saleId}`
            );


        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            data.status !== "success"
            || !data.sale
        ) {

            throw new Error(
                data.message ||
                "Unable to load receipt."
            );

        }


        // ----------------------------------------------------
        // Temporary bridge to receipt.html
        // ----------------------------------------------------
        // We will remove this localStorage bridge when
        // receipt.js is migrated to the API.

        window.location.href =
    `receipt.html?id=${saleId}`;


    } catch (error) {

        console.error(
            "RECEIPT LOAD ERROR:",
            error
        );


        alert(
            error.message ||
            "Unable to load receipt."
        );

    }

}


// ============================================================
// SEARCH
// ============================================================

function initializeSearch() {

    const searchInput =
        document.getElementById(
            "salesSearch"
        );


    if (!searchInput) {

        return;

    }


    searchInput.addEventListener(
        "input",
        () => {

            const term =
                searchInput.value
                    .toLowerCase()
                    .trim();


            if (!term) {

                renderSalesTable(
                    allSales
                );

                return;

            }


            const filtered =
                allSales.filter(
                    sale => {

                        const receipt =
                            String(
                                sale.receiptNumber ||
                                ""
                            )
                            .toLowerCase();


                        const payment =
                            String(
                                sale.paymentMethod ||
                                ""
                            )
                            .toLowerCase();


                        return (
                            receipt.includes(term)
                            ||
                            payment.includes(term)
                        );

                    }
                );


            renderSalesTable(
                filtered
            );

        }
    );

}


// ============================================================
// THEME
// ============================================================

function initializeTheme() {

    const themeToggle =
        document.getElementById(
            "themeToggle"
        );


    const themeIcon =
        document.getElementById(
            "themeIcon"
        );


    const savedTheme =
        localStorage.getItem(
            "theme"
        );


    if (
        savedTheme === "dark"
    ) {

        document.documentElement.classList.add(
            "dark"
        );

    } else if (
        savedTheme === "light"
    ) {

        document.documentElement.classList.remove(
            "dark"
        );

    }


    updateThemeIcon();


    if (themeToggle) {

        themeToggle.addEventListener(
            "click",
            () => {

                const isDark =
                    document.documentElement
                        .classList
                        .contains("dark");


                if (isDark) {

                    document.documentElement
                        .classList
                        .remove("dark");

                    localStorage.setItem(
                        "theme",
                        "light"
                    );

                } else {

                    document.documentElement
                        .classList
                        .add("dark");

                    localStorage.setItem(
                        "theme",
                        "dark"
                    );

                }


                updateThemeIcon();

            }
        );

    }


    function updateThemeIcon() {

        if (!themeIcon) {

            return;

        }


        const isDark =
            document.documentElement
                .classList
                .contains("dark");


        themeIcon.setAttribute(
            "data-lucide",
            isDark
                ? "sun"
                : "moon"
        );


        refreshIcons();

    }

}


// ============================================================
// SALE TOTAL
// ============================================================

function getSaleTotal(
    sale
) {

    const total =
        Number(
            sale?.total
        );


    return Number.isFinite(
        total
    )
        ? total
        : 0;

}


// ============================================================
// ITEM COUNT
// ============================================================

function getSaleItemCount(
    sale
) {

    if (
        !Array.isArray(
            sale?.items
        )
    ) {

        return 0;

    }


    return sale.items.reduce(
        (
            total,
            item
        ) => {

            return (
                total +
                (
                    Number(
                        item.quantity
                    ) || 0
                )
            );

        },
        0
    );

}


// ============================================================
// PARSE DATABASE DATE
// ============================================================

function parseSaleDate(dateValue) {

    if (!dateValue) {
        return new Date(NaN);
    }

    const normalized =
        String(dateValue)
            .replace(" ", "T");

    // SQLite CURRENT_TIMESTAMP is stored in UTC.
    // "Z" explicitly tells JavaScript that the
    // timestamp is UTC, allowing it to convert
    // it to the user's local timezone.
    return new Date(
        `${normalized}Z`
    );
}


// ============================================================
// START OF WEEK
// ============================================================

function getStartOfWeek(
    date
) {

    const result =
        new Date(
            date
        );


    result.setHours(
        0,
        0,
        0,
        0
    );


    const day =
        result.getDay();


    const difference =
        day === 0
            ? -6
            : 1 - day;


    result.setDate(
        result.getDate() +
        difference
    );


    return result;

}


// ============================================================
// SAME DAY
// ============================================================

function isSameDay(
    date1,
    date2
) {

    return (
        date1.getFullYear() ===
        date2.getFullYear()

        &&

        date1.getMonth() ===
        date2.getMonth()

        &&

        date1.getDate() ===
        date2.getDate()
    );

}


// ============================================================
// FORMAT CURRENCY
// ============================================================

function formatCurrency(
    amount
) {

    return (
        "KSh " +
        Number(
            amount || 0
        ).toLocaleString(
            "en-KE",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        )
    );

}


// ============================================================
// LUCIDE
// ============================================================

function refreshIcons() {

    if (
        typeof lucide !==
        "undefined"
    ) {

        lucide.createIcons();

    }

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(
    value
) {

    return String(
        value
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}