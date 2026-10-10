// ============================================================
// SimplePOS
// Receipt Controller
//
// DATA SOURCE:
// Flask API → SQLite database
//
// ENDPOINT:
// GET /api/sales/<id>
// ============================================================

const API_BASE_URL =
    "http://127.0.0.1:5000/api";

document.addEventListener(
    "DOMContentLoaded",
    () => {
        initializeReceipt();
    }
);


// ============================================================
// INITIALIZE RECEIPT
// ============================================================

async function initializeReceipt() {

    initializeTheme();

    const saleId =
        getSaleIdFromUrl();

    if (!saleId) {
        showReceiptError(
            "No sale was specified."
        );
        return;
    }

    await loadReceipt(
        saleId
    );

    refreshIcons();
}


// ============================================================
// GET SALE ID FROM URL
// ============================================================

function getSaleIdFromUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("id");
}


// ============================================================
// LOAD RECEIPT FROM DATABASE
// ============================================================

async function loadReceipt(
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

        console.log(
            "RECEIPT LOADED:",
            data.sale
        );

        renderReceipt(
            data.sale
        );

    } catch (error) {

        console.error(
            "RECEIPT LOAD ERROR:",
            error
        );

        showReceiptError(
            "Unable to load this receipt. " +
            "Make sure the backend is running."
        );
    }
}


// ============================================================
// RENDER RECEIPT
// ============================================================

function renderReceipt(
    sale
) {

    const receiptNumber =
        document.getElementById(
            "receiptNumber"
        );

    const receiptDate =
        document.getElementById(
            "receiptDate"
        );

    const receiptItems =
        document.getElementById(
            "receiptItems"
        );

    const receiptSubtotal =
        document.getElementById(
            "receiptSubtotal"
        );

    const receiptTotal =
        document.getElementById(
            "receiptTotal"
        );

    const paymentMethod =
        document.getElementById(
            "paymentMethod"
        );

    const paymentIcon =
        document.getElementById(
            "paymentIcon"
        );


    // --------------------------------------------------------
    // RECEIPT NUMBER
    // --------------------------------------------------------

    if (receiptNumber) {

        receiptNumber.textContent =
            sale.receiptNumber ||
            "N/A";
    }


    // --------------------------------------------------------
    // DATE
    // --------------------------------------------------------

    if (receiptDate) {

        const date =
            parseSaleDate(
                sale.date
            );

        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {

            receiptDate.textContent =
                date.toLocaleString(
                    "en-KE",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

        } else {

            receiptDate.textContent =
                sale.date ||
                "N/A";
        }
    }


    // --------------------------------------------------------
    // PAYMENT METHOD
    // --------------------------------------------------------

    if (paymentMethod) {

        paymentMethod.textContent =
            sale.paymentMethod ||
            "Unknown";
    }

    if (paymentIcon) {

        const method =
            String(
                sale.paymentMethod ||
                ""
            ).toLowerCase();

        let icon =
            "credit-card";

        if (
            method === "cash"
        ) {

            icon = "banknote";

        } else if (
            method === "m-pesa"
            ||
            method === "mpesa"
        ) {

            icon = "smartphone";
        }

        paymentIcon.setAttribute(
            "data-lucide",
            icon
        );
    }


    // --------------------------------------------------------
    // ITEMS
    // --------------------------------------------------------

    if (receiptItems) {

        receiptItems.innerHTML = "";

        if (
            !Array.isArray(
                sale.items
            )
            ||
            sale.items.length === 0
        ) {

            receiptItems.innerHTML = `
                <div
                    class="text-center
                           py-6
                           text-gray-400
                           dark:text-gray-500">
                    No items found.
                </div>
            `;

        } else {

            sale.items.forEach(
                item => {

                    const quantity =
                        Number(
                            item.quantity
                        ) || 0;

                    const unitPrice =
                        Number(
                            item.unitPrice
                        ) || 0;

                    const itemTotal =
                        Number(
                            item.total
                        ) ||
                        (
                            quantity *
                            unitPrice
                        );

                    const row =
                        document.createElement(
                            "div"
                        );

                    row.className =
                        "flex " +
                        "items-start " +
                        "justify-between " +
                        "gap-4 " +
                        "py-3 " +
                        "border-b " +
                        "border-gray-100 " +
                        "dark:border-slate-800";

                    row.innerHTML = `

                        <div class="min-w-0">

                            <p
                                class="font-medium
                                       text-gray-900
                                       dark:text-white">

                                ${escapeHtml(
                                    item.name ||
                                    "Unknown Product"
                                )}

                            </p>

                            <p
                                class="text-sm
                                       text-gray-500
                                       dark:text-gray-400
                                       mt-1">

                                ${quantity}
                                ×
                                ${formatCurrency(
                                    unitPrice
                                )}

                            </p>

                        </div>

                        <p
                            class="font-semibold
                                   text-gray-900
                                   dark:text-white
                                   whitespace-nowrap">

                            ${formatCurrency(
                                itemTotal
                            )}

                        </p>

                    `;

                    receiptItems.appendChild(
                        row
                    );
                }
            );
        }
    }


    // --------------------------------------------------------
    // SUBTOTAL
    // --------------------------------------------------------

    if (receiptSubtotal) {

        receiptSubtotal.textContent =
            formatCurrency(
                sale.subtotal
            );
    }


    // --------------------------------------------------------
    // TAX
    // --------------------------------------------------------

    renderTax(
        sale.tax
    );


    // --------------------------------------------------------
    // TOTAL
    // --------------------------------------------------------

    if (receiptTotal) {

        receiptTotal.textContent =
            formatCurrency(
                sale.total
            );
    }


    refreshIcons();
}


// ============================================================
// TAX ROW
// ============================================================

function renderTax(
    tax
) {

    const existingTaxRow =
        document.getElementById(
            "receiptTaxRow"
        );

    if (existingTaxRow) {

        existingTaxRow.remove();
    }


    const subtotalElement =
        document.getElementById(
            "receiptSubtotal"
        );

    if (!subtotalElement) {
        return;
    }


    const subtotalRow =
        subtotalElement.closest(
            "div"
        );

    if (!subtotalRow) {
        return;
    }


    const taxAmount =
        Number(
            tax
        ) || 0;


    const taxRow =
        document.createElement(
            "div"
        );

    taxRow.id =
        "receiptTaxRow";

    taxRow.className =
        "flex " +
        "items-center " +
        "justify-between " +
        "text-sm " +
        "text-gray-600 " +
        "dark:text-gray-400 " +
        "mt-2";

    taxRow.innerHTML = `

        <span>
            VAT (16%)
        </span>

        <span>
            ${formatCurrency(
                taxAmount
            )}
        </span>

    `;


    subtotalRow.parentNode.insertBefore(
        taxRow,
        subtotalRow.nextSibling
    );
}


// ============================================================
// RECEIPT ERROR
// ============================================================

function showReceiptError(
    message
) {

    const receipt =
        document.getElementById(
            "receipt"
        );

    if (!receipt) {
        alert(message);
        return;
    }


    receipt.innerHTML = `

        <div
            class="flex
                   flex-col
                   items-center
                   justify-center
                   py-16
                   text-center">

            <div
                class="w-16
                       h-16
                       rounded-2xl
                       bg-red-100
                       dark:bg-red-900/30
                       text-red-500
                       flex
                       items-center
                       justify-center">

                <i
                    data-lucide="file-warning"
                    class="w-8 h-8">
                </i>

            </div>

            <h2
                class="text-xl
                       font-heading
                       font-bold
                       mt-5">

                Receipt Unavailable

            </h2>

            <p
                class="text-sm
                       text-gray-500
                       dark:text-gray-400
                       mt-2
                       max-w-md">

                ${escapeHtml(
                    message
                )}

            </p>

            <button
                type="button"
                onclick="window.location.href='sales.html'"
                class="mt-5
                       px-5
                       py-2.5
                       bg-green-600
                       hover:bg-green-700
                       text-white
                       rounded-xl
                       font-medium">

                Back to Sales

            </button>

        </div>

    `;

    refreshIcons();
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

        document.documentElement
            .classList
            .add("dark");

    } else if (
        savedTheme === "light"
    ) {

        document.documentElement
            .classList
            .remove("dark");
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
}


// ============================================================
// DATE PARSER
// ============================================================

function parseSaleDate(dateValue) {

    if (!dateValue) {
        return new Date(NaN);
    }

    const normalized =
        String(dateValue)
            .replace(" ", "T");

    // SQLite CURRENT_TIMESTAMP is UTC.
    // Explicitly mark it as UTC so JavaScript
    // converts it to the user's local timezone.
    return new Date(
        `${normalized}Z`
    );
}


// ============================================================
// CURRENCY FORMAT
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
// ICONS
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
// HTML SAFETY
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