// ============================================================
// SimplePOS
// Reports Controller
//
// DATA SOURCES
// ------------------------------------------------------------
// Products:
// Flask API → GET /api/products
//
// Sales:
// Flask API → GET /api/sales
//
// Database:
// SQLite
//
// This page uses the same backend data as:
// - sales.js
// - products.js
// - inventory.js
// - sales-history.js
// - dashboard.js
// ============================================================


document.addEventListener("DOMContentLoaded", () => {
    initializeReports();
});


// ============================================================
// API CONFIGURATION
// ============================================================

const API_BASE_URL =
    "http://127.0.0.1:5000/api";


// ============================================================
// INITIALIZE REPORTS
// ============================================================

function initializeReports() {

    // ========================================================
    // ELEMENTS
    // ========================================================

    const periodSelector =
        document.getElementById("reportPeriod");

    const totalSalesElement =
        document.getElementById("reportTotalSales");

    const transactionsElement =
        document.getElementById("reportTransactions");

    const productsSoldElement =
        document.getElementById("reportProductsSold");

    const averageSaleElement =
        document.getElementById("reportAverageSale");

    const salesTrendCanvas =
        document.getElementById("salesTrendChart");

    const paymentCanvas =
        document.getElementById("paymentChart");

    const paymentSummary =
        document.getElementById("paymentSummary");

    const bestSellingProducts =
        document.getElementById("bestSellingProducts");

    const inventoryProducts =
        document.getElementById("reportInventoryProducts");

    const lowStockElement =
        document.getElementById("reportLowStock");

    const outOfStockElement =
        document.getElementById("reportOutOfStock");

    const currentDate =
        document.getElementById("currentDate");

    const currentTime =
        document.getElementById("currentTime");

    const themeToggle =
        document.getElementById("themeToggle");

    const themeIcon =
        document.getElementById("themeIcon");

    const exportCSVButton =
        document.getElementById("exportCSV");

    const exportPDFButton =
        document.getElementById("exportPDF");


    // ========================================================
    // STATE
    // ========================================================

    let salesChart = null;

    let paymentChart = null;

    let currentPeriod =
        periodSelector
            ? periodSelector.value || "week"
            : "week";


    let currentSales = [];

    let currentProducts = [];


    // ========================================================
    // INITIALIZATION
    // ========================================================

    initializeClock();

    initializeTheme();

    initializePeriodSelector();

    initializeAutoRefresh();

    initializeExportButtons();

    loadReports();


    // ========================================================
    // LOAD REPORTS
    // ========================================================

    async function loadReports() {

        try {

            const [
                sales,
                products
            ] = await Promise.all([
                fetchSales(),
                fetchProducts()
            ]);


            currentSales =
                sales;

            currentProducts =
                products;


            const filteredSales =
                filterSalesByPeriod(
                    currentSales,
                    currentPeriod
                );


            updateSummaryCards(
                filteredSales
            );


            updateSalesTrendChart(
                filteredSales
            );


            updatePaymentChart(
                filteredSales
            );


            updateBestSellingProducts(
                filteredSales
            );


            updateInventorySnapshot(
                currentProducts
            );


            refreshIcons();


        } catch (error) {

            console.error(
                "SimplePOS Reports: Failed to load report data.",
                error
            );


            showReportError();

        }

    }


    // ========================================================
    // FETCH SALES
    // ========================================================

    async function fetchSales() {

        const response =
            await fetch(
                `${API_BASE_URL}/sales`
            );


        if (!response.ok) {

            throw new Error(
                `Sales API returned HTTP ${response.status}`
            );

        }


        const result =
            await response.json();


        if (
            !result ||
            result.status !== "success" ||
            !Array.isArray(result.sales)
        ) {

            throw new Error(
                "Invalid sales API response."
            );

        }


        return result.sales;

    }


    // ========================================================
    // FETCH PRODUCTS
    // ========================================================

    async function fetchProducts() {

        const response =
            await fetch(
                `${API_BASE_URL}/products`
            );


        if (!response.ok) {

            throw new Error(
                `Products API returned HTTP ${response.status}`
            );

        }


        const result =
            await response.json();


        if (!Array.isArray(result)) {

            throw new Error(
                "Invalid products API response."
            );

        }


        return result.map(
            product => ({

                id:
                    product.ID,

                name:
                    product.NAME,

                category:
                    product.CATEGORY,

                price:
                    Number(
                        product.PRICE
                    ) || 0,

                stock:
                    Number(
                        product.STOCK
                    ) || 0,

                lowStockThreshold:
                    Number(
                        product.LOW_STOCK_THRESHOLD
                    ) || 5,

                createdAt:
                    product.CREATED_AT,

                updatedAt:
                    product.UPDATED_AT

            })
        );

    }


    // ========================================================
    // SHOW REPORT ERROR
    // ========================================================

    function showReportError() {

        if (totalSalesElement) {

            totalSalesElement.textContent =
                "KSh 0";

        }


        if (transactionsElement) {

            transactionsElement.textContent =
                "0";

        }


        if (productsSoldElement) {

            productsSoldElement.textContent =
                "0";

        }


        if (averageSaleElement) {

            averageSaleElement.textContent =
                "KSh 0";

        }


        if (paymentSummary) {

            paymentSummary.innerHTML = `

                <div
                    class="
                        text-center
                        text-sm
                        text-red-500
                        dark:text-red-400
                        py-4
                    "
                >

                    Unable to load report data.
                    Please make sure the
                    Mwangaza POS backend is running.

                </div>

            `;

        }


        if (bestSellingProducts) {

            bestSellingProducts.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        class="
                            px-6
                            py-10
                            text-center
                            text-red-500
                            dark:text-red-400
                        "
                    >

                        Unable to load report data.

                    </td>

                </tr>

            `;

        }

    }


    // ========================================================
    // FILTER SALES BY PERIOD
    // ========================================================

    function filterSalesByPeriod(
        sales,
        period
    ) {

        if (period === "all") {

            return [...sales];

        }


        const now =
            new Date();

        const start =
            new Date(now);


        // ----------------------------------------------------
        // TODAY
        // ----------------------------------------------------

        if (period === "today") {

            start.setHours(
                0,
                0,
                0,
                0
            );

        }


        // ----------------------------------------------------
        // THIS WEEK
        // ----------------------------------------------------

        else if (period === "week") {

            const day =
                start.getDay();

            const difference =
                day === 0
                    ? 6
                    : day - 1;


            start.setDate(
                start.getDate() -
                difference
            );


            start.setHours(
                0,
                0,
                0,
                0
            );

        }


        // ----------------------------------------------------
        // THIS MONTH
        // ----------------------------------------------------

        else if (period === "month") {

            start.setDate(1);

            start.setHours(
                0,
                0,
                0,
                0
            );

        }


        return sales.filter(
            sale => {

                const saleDate =
                    parseSaleDate(
                        sale.date
                    );


                return (
                    !isNaN(
                        saleDate.getTime()
                    ) &&
                    saleDate >= start &&
                    saleDate <= now
                );

            }
        );

    }


    // ========================================================
    // SUMMARY CARDS
    // ========================================================

    function updateSummaryCards(
        sales
    ) {

        const totalSales =
            sales.reduce(
                (
                    total,
                    sale
                ) => {

                    return (
                        total +
                        getSaleTotal(
                            sale
                        )
                    );

                },
                0
            );


        const transactions =
            sales.length;


        const productsSold =
            sales.reduce(
                (
                    total,
                    sale
                ) => {

                    if (
                        !Array.isArray(
                            sale.items
                        )
                    ) {

                        return total;

                    }


                    return (
                        total +
                        sale.items.reduce(
                            (
                                itemTotal,
                                item
                            ) => {

                                return (
                                    itemTotal +
                                    (
                                        Number(
                                            item.quantity
                                        ) || 0
                                    )
                                );

                            },
                            0
                        )
                    );

                },
                0
            );


        const averageSale =
            transactions > 0
                ? totalSales /
                  transactions
                : 0;


        if (totalSalesElement) {

            totalSalesElement.textContent =
                formatCurrency(
                    totalSales
                );

        }


        if (transactionsElement) {

            transactionsElement.textContent =
                transactions.toLocaleString();

        }


        if (productsSoldElement) {

            productsSoldElement.textContent =
                productsSold.toLocaleString();

        }


        if (averageSaleElement) {

            averageSaleElement.textContent =
                formatCurrency(
                    averageSale
                );

        }

    }


    // ========================================================
    // SALES TREND CHART
    // ========================================================

    function updateSalesTrendChart(
        sales
    ) {

        if (!salesTrendCanvas) {
            return;
        }


        if (
            typeof Chart ===
            "undefined"
        ) {

            console.warn(
                "SimplePOS Reports: Chart.js is not loaded."
            );

            return;

        }


        const chartData =
            buildSalesTrendData(
                sales,
                currentPeriod
            );


        const ctx =
            salesTrendCanvas.getContext(
                "2d"
            );


        if (salesChart) {

            salesChart.destroy();

        }


        salesChart =
            new Chart(
                ctx,
                {

                    type:
                        "line",

                    data: {

                        labels:
                            chartData.labels,

                        datasets: [

                            {

                                label:
                                    "Sales",

                                data:
                                    chartData.values,

                                borderColor:
                                    "#16A34A",

                                backgroundColor:
                                    "rgba(22, 163, 74, 0.12)",

                                borderWidth:
                                    3,

                                tension:
                                    0.35,

                                fill:
                                    true,

                                pointRadius:
                                    4,

                                pointHoverRadius:
                                    6

                            }

                        ]

                    },


                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        interaction: {

                            intersect:
                                false,

                            mode:
                                "index"

                        },


                        plugins: {

                            legend: {

                                display:
                                    false

                            },


                            tooltip: {

                                callbacks: {

                                    label:
                                        function(context) {

                                            return (
                                                "Sales: " +
                                                formatCurrency(
                                                    context.raw
                                                )
                                            );

                                        }

                                }

                            }

                        },


                        scales: {

                            y: {

                                beginAtZero:
                                    true,

                                ticks: {

                                    callback:
                                        function(value) {

                                            return (
                                                "KSh " +
                                                Number(
                                                    value
                                                ).toLocaleString()
                                            );

                                        }

                                }

                            },

                            x: {

                                grid: {

                                    display:
                                        false

                                }

                            }

                        }

                    }

                }
            );

    }


    // ========================================================
    // BUILD SALES TREND DATA
    // ========================================================

    function buildSalesTrendData(
        sales,
        period
    ) {

        const labels = [];

        const values = [];


        // ----------------------------------------------------
        // TODAY
        // ----------------------------------------------------

        if (period === "today") {

            for (
                let hour = 0;
                hour < 24;
                hour++
            ) {

                labels.push(
                    `${String(hour).padStart(2, "0")}:00`
                );

                values.push(0);

            }


            sales.forEach(
                sale => {

                    const date =
                        parseSaleDate(
                            sale.date
                        );


                    if (
                        isNaN(
                            date.getTime()
                        )
                    ) {

                        return;

                    }


                    const hour =
                        date.getHours();


                    if (
                        hour >= 0 &&
                        hour < 24
                    ) {

                        values[hour] +=
                            getSaleTotal(
                                sale
                            );

                    }

                }
            );


            return {
                labels,
                values
            };

        }


        // ----------------------------------------------------
        // WEEK
        // ----------------------------------------------------

        if (period === "week") {

            const dayNames = [
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
                "Sun"
            ];


            dayNames.forEach(
                day => {

                    labels.push(day);
                    values.push(0);

                }
            );


            sales.forEach(
                sale => {

                    const date =
                        parseSaleDate(
                            sale.date
                        );


                    if (
                        isNaN(
                            date.getTime()
                        )
                    ) {

                        return;

                    }


                    let day =
                        date.getDay();


                    day =
                        day === 0
                            ? 6
                            : day - 1;


                    values[day] +=
                        getSaleTotal(
                            sale
                        );

                }
            );


            return {
                labels,
                values
            };

        }


        // ----------------------------------------------------
        // MONTH
        // ----------------------------------------------------

        if (period === "month") {

            const now =
                new Date();


            const year =
                now.getFullYear();


            const month =
                now.getMonth();


            const daysInMonth =
                new Date(
                    year,
                    month + 1,
                    0
                ).getDate();


            for (
                let day = 1;
                day <= daysInMonth;
                day++
            ) {

                labels.push(
                    String(day)
                );

                values.push(0);

            }


            sales.forEach(
                sale => {

                    const date =
                        parseSaleDate(
                            sale.date
                        );


                    if (
                        isNaN(
                            date.getTime()
                        )
                    ) {

                        return;

                    }


                    const day =
                        date.getDate();


                    if (
                        day >= 1 &&
                        day <= daysInMonth
                    ) {

                        values[day - 1] +=
                            getSaleTotal(
                                sale
                            );

                    }

                }
            );


            return {
                labels,
                values
            };

        }


        // ----------------------------------------------------
        // ALL TIME
        // ----------------------------------------------------

        const grouped = {};


        sales.forEach(
            sale => {

                const date =
                    parseSaleDate(
                        sale.date
                    );


                if (
                    isNaN(
                        date.getTime()
                    )
                ) {

                    return;

                }


                const key =
                    `${date.getFullYear()}-${String(
                        date.getMonth() + 1
                    ).padStart(2, "0")}`;


                if (!grouped[key]) {

                    grouped[key] =
                        0;

                }


                grouped[key] +=
                    getSaleTotal(
                        sale
                    );

            }
        );


        const sortedKeys =
            Object.keys(
                grouped
            ).sort();


        sortedKeys.forEach(
            key => {

                const [
                    year,
                    month
                ] =
                    key.split("-");


                const date =
                    new Date(
                        Number(year),
                        Number(month) - 1,
                        1
                    );


                labels.push(
                    date.toLocaleDateString(
                        "en-KE",
                        {
                            month:
                                "short",

                            year:
                                "numeric"
                        }
                    )
                );


                values.push(
                    grouped[key]
                );

            }
        );


        if (labels.length === 0) {

            labels.push(
                "No Sales"
            );

            values.push(0);

        }


        return {
            labels,
            values
        };

    }


    // ========================================================
    // PAYMENT METHODS CHART
    // ========================================================

    function updatePaymentChart(
        sales
    ) {

        if (!paymentCanvas) {
            return;
        }


        if (
            typeof Chart ===
            "undefined"
        ) {

            console.warn(
                "SimplePOS Reports: Chart.js is not loaded."
            );

            return;

        }


        const paymentTotals = {};


        sales.forEach(
            sale => {

                const method =
                    String(
                        sale.paymentMethod ||
                        "Cash"
                    );


                if (
                    !paymentTotals[method]
                ) {

                    paymentTotals[method] =
                        0;

                }


                paymentTotals[method] +=
                    getSaleTotal(
                        sale
                    );

            }
        );


        let labels =
            Object.keys(
                paymentTotals
            );


        let values =
            Object.values(
                paymentTotals
            );


        if (labels.length === 0) {

            labels = [
                "No Sales"
            ];

            values = [
                1
            ];

        }


        const ctx =
            paymentCanvas.getContext(
                "2d"
            );


        if (paymentChart) {

            paymentChart.destroy();

        }


        paymentChart =
            new Chart(
                ctx,
                {

                    type:
                        "doughnut",

                    data: {

                        labels:
                            labels,

                        datasets: [

                            {

                                data:
                                    values,

                                backgroundColor: [
                                    "#16A34A",
                                    "#2563EB",
                                    "#9333EA",
                                    "#EA580C",
                                    "#DC2626",
                                    "#0891B2"
                                ],

                                borderWidth:
                                    0

                            }

                        ]

                    },


                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        cutout:
                            "68%",

                        plugins: {

                            legend: {

                                position:
                                    "bottom"

                            },


                            tooltip: {

                                callbacks: {

                                    label:
                                        function(context) {

                                            if (
                                                labels[0] ===
                                                "No Sales"
                                            ) {

                                                return "No sales";

                                            }


                                            return (
                                                context.label +
                                                ": " +
                                                formatCurrency(
                                                    context.raw
                                                )
                                            );

                                        }

                                }

                            }

                        }

                    }

                }
            );


        updatePaymentSummary(
            paymentTotals
        );

    }


    // ========================================================
    // PAYMENT SUMMARY
    // ========================================================

    function updatePaymentSummary(
        paymentTotals
    ) {

        if (!paymentSummary) {
            return;
        }


        paymentSummary.innerHTML =
            "";


        const methods =
            Object.entries(
                paymentTotals
            );


        if (methods.length === 0) {

            paymentSummary.innerHTML = `

                <div
                    class="
                        text-center
                        text-sm
                        text-gray-400
                        py-4
                    "
                >

                    No payments recorded
                    for this period.

                </div>

            `;

            return;

        }


        const total =
            methods.reduce(
                (
                    sum,
                    [, amount]
                ) => {

                    return sum + amount;

                },
                0
            );


        methods
            .sort(
                (
                    [, a],
                    [, b]
                ) =>
                    b - a
            )
            .forEach(
                (
                    [method, amount]
                ) => {

                    const percentage =
                        total > 0
                            ? (
                                amount /
                                total
                            ) * 100
                            : 0;


                    const row =
                        document.createElement(
                            "div"
                        );


                    row.className =
                        "flex items-center justify-between gap-3";


                    row.innerHTML = `

                        <div class="min-w-0">

                            <p
                                class="
                                    font-medium
                                    truncate
                                "
                            >

                                ${escapeHtml(
                                    method
                                )}

                            </p>


                            <div
                                class="
                                    mt-1
                                    h-1.5
                                    rounded-full
                                    bg-gray-100
                                    dark:bg-slate-800
                                    overflow-hidden
                                "
                            >

                                <div
                                    class="
                                        h-full
                                        bg-green-500
                                        rounded-full
                                    "
                                    style="
                                        width: ${percentage}%;
                                    "
                                >
                                </div>

                            </div>

                        </div>


                        <div
                            class="
                                text-right
                                shrink-0
                            "
                        >

                            <p
                                class="
                                    font-semibold
                                    text-sm
                                "
                            >

                                ${formatCurrency(
                                    amount
                                )}

                            </p>


                            <p
                                class="
                                    text-xs
                                    text-gray-500
                                    dark:text-gray-400
                                "
                            >

                                ${percentage.toFixed(1)}%

                            </p>

                        </div>

                    `;


                    paymentSummary.appendChild(
                        row
                    );

                }
            );

    }


    // ========================================================
    // BEST SELLING PRODUCTS
    // ========================================================

    function updateBestSellingProducts(
        sales
    ) {

        if (!bestSellingProducts) {
            return;
        }


        bestSellingProducts.innerHTML =
            "";


        const productStats =
            buildProductStatistics(
                sales
            );


        if (productStats.length === 0) {

            bestSellingProducts.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        class="
                            px-6
                            py-10
                            text-center
                            text-gray-400
                        "
                    >

                        No product sales recorded
                        for this period.

                    </td>

                </tr>

            `;

            return;

        }


        const highestRevenue =
            productStats[0].revenue;


        productStats.forEach(
            (
                product,
                index
            ) => {

                const performance =
                    highestRevenue > 0
                        ? (
                            product.revenue /
                            highestRevenue
                        ) * 100
                        : 0;


                const row =
                    document.createElement(
                        "tr"
                    );


                row.className =
                    "hover:bg-gray-50 " +
                    "dark:hover:bg-slate-800/50";


                row.innerHTML = `

                    <td
                        class="
                            px-6
                            py-4
                            font-semibold
                        "
                    >

                        #${index + 1}

                    </td>


                    <td
                        class="
                            px-6
                            py-4
                        "
                    >

                        <div
                            class="
                                flex
                                items-center
                                gap-3
                            "
                        >

                            <div
                                class="
                                    w-9
                                    h-9
                                    rounded-lg
                                    bg-green-50
                                    dark:bg-green-900/20
                                    text-green-600
                                    flex
                                    items-center
                                    justify-center
                                "
                            >

                                <i
                                    data-lucide="package"
                                    class="w-4"
                                >
                                </i>

                            </div>


                            <span
                                class="
                                    font-medium
                                    truncate
                                    max-w-[180px]
                                "
                            >

                                ${escapeHtml(
                                    product.name
                                )}

                            </span>

                        </div>

                    </td>


                    <td
                        class="
                            px-6
                            py-4
                            text-sm
                        "
                    >

                        ${product.quantity.toLocaleString()}

                    </td>


                    <td
                        class="
                            px-6
                            py-4
                            font-semibold
                        "
                    >

                        ${formatCurrency(
                            product.revenue
                        )}

                    </td>


                    <td
                        class="
                            px-6
                            py-4
                        "
                    >

                        <div
                            class="
                                flex
                                items-center
                                gap-3
                                justify-end
                            "
                        >

                            <div
                                class="
                                    w-24
                                    h-2
                                    rounded-full
                                    bg-gray-100
                                    dark:bg-slate-800
                                    overflow-hidden
                                "
                            >

                                <div
                                    class="
                                        h-full
                                        bg-green-500
                                        rounded-full
                                    "
                                    style="
                                        width: ${performance}%;
                                    "
                                >
                                </div>

                            </div>


                            <span
                                class="
                                    text-xs
                                    text-gray-500
                                    dark:text-gray-400
                                    w-10
                                    text-right
                                "
                            >

                                ${Math.round(
                                    performance
                                )}%

                            </span>

                        </div>

                    </td>

                `;


                bestSellingProducts.appendChild(
                    row
                );

            }
        );


        refreshIcons();

    }


    // ========================================================
    // INVENTORY SNAPSHOT
    // ========================================================

    function updateInventorySnapshot(
        products
    ) {

        if (inventoryProducts) {

            inventoryProducts.textContent =
                products.length.toLocaleString();

        }


        let lowStockCount =
            0;

        let outOfStockCount =
            0;


        products.forEach(
            product => {

                const stock =
                    Number(
                        product.stock
                    ) || 0;


                const threshold =
                    Number(
                        product.lowStockThreshold
                    ) || 5;


                if (stock <= 0) {

                    outOfStockCount++;

                } else if (
                    stock <= threshold
                ) {

                    lowStockCount++;

                }

            }
        );


        if (lowStockElement) {

            lowStockElement.textContent =
                lowStockCount.toLocaleString();

        }


        if (outOfStockElement) {

            outOfStockElement.textContent =
                outOfStockCount.toLocaleString();

        }

    }


    // ========================================================
    // PERIOD SELECTOR
    // ========================================================

    function initializePeriodSelector() {

        if (!periodSelector) {
            return;
        }


        periodSelector.addEventListener(
            "change",
            () => {

                currentPeriod =
                    periodSelector.value ||
                    "week";


                renderCurrentReport();

            }
        );

    }


    // ========================================================
    // RENDER CURRENT REPORT
    // ========================================================

    function renderCurrentReport() {

        const filteredSales =
            filterSalesByPeriod(
                currentSales,
                currentPeriod
            );


        updateSummaryCards(
            filteredSales
        );


        updateSalesTrendChart(
            filteredSales
        );


        updatePaymentChart(
            filteredSales
        );


        updateBestSellingProducts(
            filteredSales
        );


        updateInventorySnapshot(
            currentProducts
        );


        refreshIcons();

    }


    // ========================================================
    // AUTOMATIC REFRESH
    // ========================================================

    function initializeAutoRefresh() {

        setInterval(
            () => {

                loadReports();

            },
            10000
        );

    }


    // ========================================================
    // CLOCK
    // ========================================================

    function initializeClock() {

        function updateClock() {

            const now =
                new Date();


            if (currentDate) {

                currentDate.textContent =
                    now.toLocaleDateString(
                        "en-KE",
                        {
                            weekday:
                                "long",

                            year:
                                "numeric",

                            month:
                                "long",

                            day:
                                "numeric"

                        }
                    );

            }


            if (currentTime) {

                currentTime.textContent =
                    now.toLocaleTimeString(
                        "en-KE",
                        {
                            hour:
                                "2-digit",

                            minute:
                                "2-digit",

                            second:
                                "2-digit"

                        }
                    );

            }

        }


        updateClock();


        setInterval(
            updateClock,
            1000
        );

    }


    // ========================================================
    // THEME
    // ========================================================

    function initializeTheme() {

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

        } else {

            if (
                window.matchMedia &&
                window.matchMedia(
                    "(prefers-color-scheme: dark)"
                ).matches
            ) {

                document.documentElement.classList.add(
                    "dark"
                );

            }

        }


        updateThemeIcon();


        if (themeToggle) {

            themeToggle.addEventListener(
                "click",
                () => {

                    const isDark =
                        document.documentElement
                            .classList
                            .contains(
                                "dark"
                            );


                    if (isDark) {

                        document.documentElement
                            .classList
                            .remove(
                                "dark"
                            );


                        localStorage.setItem(
                            "theme",
                            "light"
                        );

                    } else {

                        document.documentElement
                            .classList
                            .add(
                                "dark"
                            );


                        localStorage.setItem(
                            "theme",
                            "dark"
                        );

                    }


                    updateThemeIcon();

                }
            );

        }

    }


    // ========================================================
    // UPDATE THEME ICON
    // ========================================================

    function updateThemeIcon() {

        if (!themeIcon) {
            return;
        }


        const isDark =
            document.documentElement
                .classList
                .contains(
                    "dark"
                );


        themeIcon.setAttribute(
            "data-lucide",
            isDark
                ? "sun"
                : "moon"
        );


        refreshIcons();

    }


    // ========================================================
    // SALE DATE PARSER
    // ========================================================

    function parseSaleDate(
        dateValue
    ) {

        if (!dateValue) {

            return new Date(NaN);

        }


        const stringValue =
            String(
                dateValue
            );


        // ----------------------------------------------------
        // SQLite format:
        // YYYY-MM-DD HH:MM:SS
        // ----------------------------------------------------

        const normalized =
            stringValue.replace(
                " ",
                "T"
            );


        // ----------------------------------------------------
        // If the backend timestamp has no timezone,
        // treat it as UTC.
        // ----------------------------------------------------

        if (
            !/[zZ]|[+-]\d{2}:?\d{2}$/.test(
                normalized
            )
        ) {

            return new Date(
                `${normalized}Z`
            );

        }


        return new Date(
            normalized
        );

    }


    // ========================================================
    // SALE TOTAL
    // ========================================================

    function getSaleTotal(
        sale
    ) {

        const total =
            Number(
                sale.total
            );


        if (
            Number.isFinite(
                total
            )
        ) {

            return total;

        }


        if (
            Array.isArray(
                sale.items
            )
        ) {

            return sale.items.reduce(
                (
                    sum,
                    item
                ) => {

                    const price =
                        Number(
                            item.unitPrice
                        ) || 0;


                    const quantity =
                        Number(
                            item.quantity
                        ) || 0;


                    return (
                        sum +
                        price *
                        quantity
                    );

                },
                0
            );

        }


        return 0;

    }


    // ========================================================
    // BUILD PRODUCT STATISTICS
    // ========================================================

    function buildProductStatistics(
        sales
    ) {

        const productStats = {};


        sales.forEach(
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

                        const id =
                            String(
                                item.productId ??
                                item.name ??
                                "unknown"
                            );


                        if (
                            !productStats[id]
                        ) {

                            productStats[id] = {

                                id:
                                    item.productId,

                                name:
                                    item.name ||
                                    "Unknown Product",

                                quantity:
                                    0,

                                revenue:
                                    0

                            };

                        }


                        const quantity =
                            Number(
                                item.quantity
                            ) || 0;


                        const itemTotal =
                            Number(
                                item.total
                            );


                        const unitPrice =
                            Number(
                                item.unitPrice
                            ) || 0;


                        const revenue =
                            Number.isFinite(
                                itemTotal
                            )
                                ? itemTotal
                                : unitPrice *
                                  quantity;


                        productStats[id].quantity +=
                            quantity;


                        productStats[id].revenue +=
                            revenue;

                    }
                );

            }
        );


        return Object.values(
            productStats
        )
        .sort(
            (
                a,
                b
            ) =>
                b.revenue -
                a.revenue
        );

    }


    // ========================================================
    // CURRENCY FORMATTER
    // ========================================================

    function formatCurrency(
        value
    ) {

        const amount =
            Number(value) || 0;


        return (
            "KSh " +
            amount.toLocaleString(
                "en-KE",
                {
                    minimumFractionDigits:
                        0,

                    maximumFractionDigits:
                        2
                }
            )
        );

    }


    // ========================================================
    // ESCAPE HTML
    // ========================================================

    function escapeHtml(
        value
    ) {

        return String(value)
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


    // ========================================================
    // REFRESH LUCIDE ICONS
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
    // EXPORT BUTTONS
    // ========================================================

    function initializeExportButtons() {

        if (exportCSVButton) {

            exportCSVButton.addEventListener(
                "click",
                exportCSV
            );

        }


        if (exportPDFButton) {

            exportPDFButton.addEventListener(
                "click",
                exportPDF
            );

        }

    }


    // ========================================================
    // EXPORT CSV
    // ========================================================

    async function exportCSV() {

        try {

            const sales =
                filterSalesByPeriod(
                    currentSales,
                    currentPeriod
                );


            const products =
                currentProducts;


            if (sales.length === 0) {

                alert(
                    "There are no sales records available for the selected period."
                );

                return;

            }


            const rows = [];


            rows.push([
                "SimplePOS Sales Report"
            ]);

            rows.push([
                "Shop",
                "Mwangaza Mini Mart"
            ]);

            rows.push([
                "Period",
                getPeriodLabel(
                    currentPeriod
                )
            ]);

            rows.push([
                "Generated",
                new Date().toLocaleString(
                    "en-KE"
                )
            ]);

            rows.push([]);


            // ------------------------------------------------
            // SUMMARY
            // ------------------------------------------------

            const totalSales =
                sales.reduce(
                    (
                        sum,
                        sale
                    ) =>
                        sum +
                        getSaleTotal(
                            sale
                        ),
                    0
                );


            const transactions =
                sales.length;


            const productsSold =
                sales.reduce(
                    (
                        sum,
                        sale
                    ) => {

                        if (
                            !Array.isArray(
                                sale.items
                            )
                        ) {

                            return sum;

                        }


                        return (
                            sum +
                            sale.items.reduce(
                                (
                                    itemSum,
                                    item
                                ) =>
                                    itemSum +
                                    (
                                        Number(
                                            item.quantity
                                        ) || 0
                                    ),
                                0
                            )
                        );

                    },
                    0
                );


            const averageSale =
                transactions > 0
                    ? totalSales /
                      transactions
                    : 0;


            rows.push([
                "SUMMARY"
            ]);

            rows.push([
                "Total Sales",
                totalSales
            ]);

            rows.push([
                "Transactions",
                transactions
            ]);

            rows.push([
                "Products Sold",
                productsSold
            ]);

            rows.push([
                "Average Sale",
                averageSale
            ]);

            rows.push([]);


            // ------------------------------------------------
            // SALES
            // ------------------------------------------------

            rows.push([
                "SALES TRANSACTIONS"
            ]);

            rows.push([
                "Date",
                "Payment Method",
                "Items",
                "Total"
            ]);


            sales.forEach(
                sale => {

                    const itemCount =
                        Array.isArray(
                            sale.items
                        )
                            ? sale.items.reduce(
                                (
                                    sum,
                                    item
                                ) =>
                                    sum +
                                    (
                                        Number(
                                            item.quantity
                                        ) || 0
                                    ),
                                0
                            )
                            : 0;


                    rows.push([
                        formatExportDate(
                            sale.date
                        ),

                        sale.paymentMethod ||
                        "Cash",

                        itemCount,

                        getSaleTotal(
                            sale
                        )

                    ]);

                }
            );


            rows.push([]);


            // ------------------------------------------------
            // BEST SELLING PRODUCTS
            // ------------------------------------------------

            const productStats =
                buildProductStatistics(
                    sales
                );


            rows.push([
                "BEST-SELLING PRODUCTS"
            ]);

            rows.push([
                "Rank",
                "Product",
                "Units Sold",
                "Revenue"
            ]);


            productStats.forEach(
                (
                    product,
                    index
                ) => {

                    rows.push([
                        index + 1,
                        product.name,
                        product.quantity,
                        product.revenue
                    ]);

                }
            );


            rows.push([]);


            // ------------------------------------------------
            // INVENTORY
            // ------------------------------------------------

            let lowStock = 0;

            let outOfStock = 0;


            products.forEach(
                product => {

                    const stock =
                        Number(
                            product.stock
                        ) || 0;


                    const threshold =
                        Number(
                            product.lowStockThreshold
                        ) || 5;


                    if (stock <= 0) {

                        outOfStock++;

                    } else if (
                        stock <= threshold
                    ) {

                        lowStock++;

                    }

                }
            );


            rows.push([
                "INVENTORY SNAPSHOT"
            ]);

            rows.push([
                "Total Products",
                products.length
            ]);

            rows.push([
                "Low Stock",
                lowStock
            ]);

            rows.push([
                "Out of Stock",
                outOfStock
            ]);


            // ------------------------------------------------
            // CREATE CSV
            // ------------------------------------------------

            const csv =
                rows
                    .map(
                        row =>
                            row
                                .map(
                                    value =>
                                        csvEscape(
                                            value
                                        )
                                )
                                .join(",")
                    )
                    .join("\n");


            const blob =
                new Blob(
                    [csv],
                    {
                        type:
                            "text/csv;charset=utf-8;"
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


            link.href =
                url;


            link.download =
                `SimplePOS_Report_${getFileDate()}.csv`;


            document.body.appendChild(
                link
            );


            link.click();


            document.body.removeChild(
                link
            );


            URL.revokeObjectURL(
                url
            );

        } catch (error) {

            console.error(
                "CSV EXPORT ERROR:",
                error
            );


            alert(
                "Unable to export the CSV report."
            );

        }

    }


    // ========================================================
    // EXPORT PDF
    // ========================================================

    function exportPDF() {

        if (
            typeof window.jspdf ===
            "undefined"
        ) {

            alert(
                "PDF export library could not be loaded. Please check your internet connection and reload the page."
            );

            return;

        }


        const {
            jsPDF
        } =
            window.jspdf;


        if (
            typeof jsPDF !==
            "function"
        ) {

            alert(
                "PDF export is unavailable."
            );

            return;

        }


        const sales =
            filterSalesByPeriod(
                currentSales,
                currentPeriod
            );


        const products =
            currentProducts;


        if (sales.length === 0) {

            alert(
                "There are no sales records available for the selected period."
            );

            return;

        }


        const doc =
            new jsPDF();


        const totalSales =
            sales.reduce(
                (
                    sum,
                    sale
                ) =>
                    sum +
                    getSaleTotal(
                        sale
                    ),
                0
            );


        const transactions =
            sales.length;


        const productsSold =
            sales.reduce(
                (
                    sum,
                    sale
                ) => {

                    if (
                        !Array.isArray(
                            sale.items
                        )
                    ) {

                        return sum;

                    }


                    return (
                        sum +
                        sale.items.reduce(
                            (
                                itemSum,
                                item
                            ) =>
                                itemSum +
                                (
                                    Number(
                                        item.quantity
                                    ) || 0
                                ),
                            0
                        )
                    );

                },
                0
            );


        const averageSale =
            transactions > 0
                ? totalSales /
                  transactions
                : 0;


        // ----------------------------------------------------
        // HEADER
        // ----------------------------------------------------

        doc.setFontSize(20);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.text(
            "SimplePOS",
            14,
            18
        );


        doc.setFontSize(11);

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.text(
            "Mwangaza Mini Mart",
            14,
            25
        );


        doc.setFontSize(16);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.text(
            "Sales Report",
            14,
            38
        );


        doc.setFontSize(10);

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.text(
            `Period: ${getPeriodLabel(
                currentPeriod
            )}`,
            14,
            46
        );


        doc.text(
            `Generated: ${new Date().toLocaleString(
                "en-KE"
            )}`,
            14,
            52
        );


        // ----------------------------------------------------
        // SUMMARY
        // ----------------------------------------------------

        if (
            typeof doc.autoTable !==
            "function"
        ) {

            alert(
                "PDF table plugin could not be loaded. Please check your jsPDF AutoTable library."
            );

            return;

        }


        doc.autoTable({

            startY:
                60,

            head: [
                [
                    "Total Sales",
                    "Transactions",
                    "Products Sold",
                    "Average Sale"
                ]
            ],

            body: [
                [
                    formatCurrency(
                        totalSales
                    ),

                    transactions,

                    productsSold,

                    formatCurrency(
                        averageSale
                    )
                ]
            ],

            theme:
                "grid",

            headStyles: {

                fillColor:
                    [22, 163, 74],

                textColor:
                    255,

                fontStyle:
                    "bold"

            }

        });


        // ----------------------------------------------------
        // PAYMENT METHODS
        // ----------------------------------------------------

        const paymentTotals = {};


        sales.forEach(
            sale => {

                const method =
                    sale.paymentMethod ||
                    "Cash";


                paymentTotals[method] =
                    (
                        paymentTotals[method] ||
                        0
                    ) +
                    getSaleTotal(
                        sale
                    );

            }
        );


        const paymentRows =
            Object.entries(
                paymentTotals
            ).map(
                (
                    [method, amount]
                ) => {

                    const percentage =
                        totalSales > 0
                            ? (
                                amount /
                                totalSales
                            ) * 100
                            : 0;


                    return [
                        method,
                        formatCurrency(
                            amount
                        ),
                        `${percentage.toFixed(
                            1
                        )}%`
                    ];

                }
            );


        let nextY =
            doc.lastAutoTable
                ? doc.lastAutoTable.finalY + 10
                : 70;


        doc.setFontSize(13);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.text(
            "Payment Methods",
            14,
            nextY
        );


        doc.autoTable({

            startY:
                nextY + 5,

            head: [
                [
                    "Payment Method",
                    "Amount",
                    "Percentage"
                ]
            ],

            body:
                paymentRows,

            theme:
                "striped",

            headStyles: {

                fillColor:
                    [22, 163, 74]

            }

        });


        // ----------------------------------------------------
        // BEST SELLING PRODUCTS
        // ----------------------------------------------------

        const productStats =
            buildProductStatistics(
                sales
            );


        nextY =
            doc.lastAutoTable
                ? doc.lastAutoTable.finalY + 10
                : nextY + 40;


        doc.setFontSize(13);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.text(
            "Best-Selling Products",
            14,
            nextY
        );


        doc.autoTable({

            startY:
                nextY + 5,

            head: [
                [
                    "Rank",
                    "Product",
                    "Units Sold",
                    "Revenue"
                ]
            ],

            body:
                productStats.map(
                    (
                        product,
                        index
                    ) => [

                        index + 1,

                        product.name,

                        product.quantity,

                        formatCurrency(
                            product.revenue
                        )

                    ]
                ),

            theme:
                "striped",

            headStyles: {

                fillColor:
                    [22, 163, 74]

            }

        });


        // ----------------------------------------------------
        // INVENTORY
        // ----------------------------------------------------

        let lowStock = 0;

        let outOfStock = 0;


        products.forEach(
            product => {

                const stock =
                    Number(
                        product.stock
                    ) || 0;


                const threshold =
                    Number(
                        product.lowStockThreshold
                    ) || 5;


                if (stock <= 0) {

                    outOfStock++;

                } else if (
                    stock <= threshold
                ) {

                    lowStock++;

                }

            }
        );


        nextY =
            doc.lastAutoTable
                ? doc.lastAutoTable.finalY + 10
                : nextY + 40;


        doc.setFontSize(13);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.text(
            "Inventory Snapshot",
            14,
            nextY
        );


        doc.autoTable({

            startY:
                nextY + 5,

            head: [
                [
                    "Total Products",
                    "Low Stock",
                    "Out of Stock"
                ]
            ],

            body: [
                [
                    products.length,
                    lowStock,
                    outOfStock
                ]
            ],

            theme:
                "grid",

            headStyles: {

                fillColor:
                    [22, 163, 74]

            }

        });


        // ----------------------------------------------------
        // FOOTER
        // ----------------------------------------------------

        const pageCount =
            doc.internal.getNumberOfPages();


        for (
            let page = 1;
            page <= pageCount;
            page++
        ) {

            doc.setPage(page);

            doc.setFontSize(8);

            doc.setFont(
                "helvetica",
                "normal"
            );

            doc.text(
                `SimplePOS • Mwangaza Mini Mart • Page ${page} of ${pageCount}`,
                14,
                290
            );

        }


        // ----------------------------------------------------
        // SAVE
        // ----------------------------------------------------

        doc.save(
            `SimplePOS_Report_${getFileDate()}.pdf`
        );

    }


    // ========================================================
    // CSV ESCAPE
    // ========================================================

    function csvEscape(
        value
    ) {

        const stringValue =
            String(
                value ?? ""
            );


        if (
            stringValue.includes(",") ||
            stringValue.includes('"') ||
            stringValue.includes("\n")
        ) {

            return (
                '"' +
                stringValue.replace(
                    /"/g,
                    '""'
                ) +
                '"'
            );

        }


        return stringValue;

    }


    // ========================================================
    // PERIOD LABEL
    // ========================================================

    function getPeriodLabel(
        period
    ) {

        const labels = {

            today:
                "Today",

            week:
                "This Week",

            month:
                "This Month",

            all:
                "All Time"

        };


        return (
            labels[period] ||
            "This Week"
        );

    }


    // ========================================================
    // EXPORT DATE
    // ========================================================

    function getFileDate() {

        const now =
            new Date();


        return (
            now.getFullYear() +
            "-" +
            String(
                now.getMonth() + 1
            ).padStart(2, "0") +
            "-" +
            String(
                now.getDate()
            ).padStart(2, "0") +
            "_" +
            String(
                now.getHours()
            ).padStart(2, "0") +
            "-" +
            String(
                now.getMinutes()
            ).padStart(2, "0")
        );

    }


    // ========================================================
    // EXPORT DATE FORMAT
    // ========================================================

    function formatExportDate(
        dateValue
    ) {

        const date =
            parseSaleDate(
                dateValue
            );


        if (
            isNaN(
                date.getTime()
            )
        ) {

            return String(
                dateValue || ""
            );

        }


        return date.toLocaleString(
            "en-KE",
            {
                dateStyle:
                    "short",

                timeStyle:
                    "short"
            }
        );

    }

}