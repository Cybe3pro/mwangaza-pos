// ==========================================================
// SimplePOS
// Inventory Controller
// ==========================================================

const API_BASE_URL = "http://127.0.0.1:5000/api";

let products = [];
let selectedProductId = null;


// ==========================================================
// INITIALIZE
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {

    initializeInventory();

});


// ==========================================================
// INITIALIZE INVENTORY
// ==========================================================

function initializeInventory() {

    initializeTheme();

    initializeClock();

    initializeSearch();

    initializeFilter();

    initializeStockModal();

    loadProducts();

}


// ==========================================================
// LOAD PRODUCTS FROM BACKEND
// ==========================================================

async function loadProducts() {

    const table =
        document.getElementById("inventoryTable");

    const emptyState =
        document.getElementById("emptyInventory");

    try {

        if (table) {

            table.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center">
                        <div class="flex flex-col items-center gap-3">

                            <div class="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>

                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                Loading inventory...
                            </p>

                        </div>
                    </td>
                </tr>
            `;

        }

        const response =
            await fetch(`${API_BASE_URL}/products`);

        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }

        const data =
            await response.json();

        /*
         * The current Flask endpoint returns
         * an array directly.
         */

        if (Array.isArray(data)) {

            products = data;

        }

        else if (Array.isArray(data.products)) {

            products = data.products;

        }

        else {

            products = [];

        }

        renderInventory();

    }

    catch (error) {

        console.error(
            "INVENTORY LOAD ERROR:",
            error
        );

        products = [];

        if (table) {

            table.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center">

                        <div class="flex flex-col items-center">

                            <div class="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center">

                                <i data-lucide="wifi-off" class="w-7 h-7"></i>

                            </div>

                            <h3 class="font-semibold text-lg mt-4">
                                Unable to load inventory
                            </h3>

                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Make sure the Mwangaza backend is running.
                            </p>

                            <button
                                type="button"
                                onclick="loadProducts()"
                                class="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium">

                                Try Again

                            </button>

                        </div>

                    </td>
                </tr>
            `;

        }

        if (emptyState) {

            emptyState.classList.add("hidden");

        }

        initializeIcons();

    }

}


// ==========================================================
// RENDER INVENTORY
// ==========================================================

function renderInventory() {

    const table =
        document.getElementById("inventoryTable");

    const emptyState =
        document.getElementById("emptyInventory");

    if (!table) {

        return;

    }

    const searchInput =
        document.getElementById("inventorySearch");

    const filter =
        document.getElementById("stockFilter");


    const searchTerm =
        searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";


    const filterValue =
        filter
            ? filter.value
            : "all";


    const filteredProducts =
        products.filter(product => {

            const name =
                String(product.NAME ?? product.name ?? "")
                    .toLowerCase();

            const category =
                String(product.CATEGORY ?? product.category ?? "")
                    .toLowerCase();

            const id =
                String(product.ID ?? product.id ?? "")
                    .toLowerCase();


            const matchesSearch =
                name.includes(searchTerm) ||
                category.includes(searchTerm) ||
                id.includes(searchTerm);


            const status =
                getStockStatus(product);


            const matchesFilter =
                filterValue === "all" ||
                filterValue === status;


            return matchesSearch && matchesFilter;

        });


    table.innerHTML = "";


    if (filteredProducts.length === 0) {

        emptyState.classList.remove("hidden");

    }

    else {

        emptyState.classList.add("hidden");

    }


    filteredProducts.forEach(product => {

        const productId =
            product.ID ?? product.id;

        const name =
            product.NAME ?? product.name;

        const category =
            product.CATEGORY ?? product.category;

        const price =
            Number(product.PRICE ?? product.price ?? 0);

        const stock =
            Number(product.STOCK ?? product.stock ?? 0);

        const threshold =
            Number(
                product.LOW_STOCK_THRESHOLD ??
                product.lowStockThreshold ??
                5
            );


        const normalizedProduct = {

            ID: productId,
            NAME: name,
            CATEGORY: category,
            PRICE: price,
            STOCK: stock,
            LOW_STOCK_THRESHOLD: threshold

        };


        const row =
            document.createElement("tr");


        row.className =
            "hover:bg-gray-50 dark:hover:bg-slate-800/50 transition";


        const status =
            getStockStatus(normalizedProduct);


        const statusHTML =
            getStatusHTML(status);


        row.innerHTML = `

            <td class="px-6 py-4">

                <div>

                    <p class="font-semibold">
                        ${escapeHTML(name)}
                    </p>

                    <p class="text-xs text-gray-500">
                        ID: ${escapeHTML(productId)}
                    </p>

                </div>

            </td>


            <td class="px-6 py-4">

                <span class="capitalize">
                    ${escapeHTML(category)}
                </span>

            </td>


            <td class="px-6 py-4 font-medium">

                KSh ${price.toLocaleString("en-KE")}

            </td>


            <td class="px-6 py-4">

                <div class="flex items-center gap-3">

                    <span class="font-bold">
                        ${stock}
                    </span>

                    <span class="text-xs text-gray-500">
                        units
                    </span>

                </div>

            </td>


            <td class="px-6 py-4">

                ${statusHTML}

            </td>


            <td class="px-6 py-4">

                <div class="flex justify-end gap-2">

                    <button
                        type="button"
                        class="adjust-stock p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40 transition"
                        data-id="${productId}"
                        title="Adjust stock">

                        <i
                            data-lucide="plus-minus"
                            class="w-4 h-4">
                        </i>

                    </button>

                </div>

            </td>

        `;


        table.appendChild(row);

    });


    updateStatistics();

    attachAdjustmentButtons();

    initializeIcons();

}


// ==========================================================
// STOCK STATUS
// ==========================================================

function getStockStatus(product) {

    const stock =
        Number(
            product.STOCK ??
            product.stock ??
            0
        );


    const threshold =
        Number(
            product.LOW_STOCK_THRESHOLD ??
            product.lowStockThreshold ??
            5
        );


    if (stock <= 0) {

        return "out";

    }


    if (stock <= threshold) {

        return "low";

    }


    return "in";

}


// ==========================================================
// STATUS HTML
// ==========================================================

function getStatusHTML(status) {

    if (status === "out") {

        return `
            <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">

                <span class="w-2 h-2 rounded-full bg-red-500"></span>

                Out of Stock

            </span>
        `;

    }


    if (status === "low") {

        return `
            <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">

                <span class="w-2 h-2 rounded-full bg-orange-500"></span>

                Low Stock

            </span>
        `;

    }


    return `
        <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">

            <span class="w-2 h-2 rounded-full bg-green-500"></span>

            In Stock

        </span>
    `;

}


// ==========================================================
// STATISTICS
// ==========================================================

function updateStatistics() {

    const totalProducts =
        products.length;


    const totalUnits =
        products.reduce(
            (total, product) => {

                return total +
                    Number(
                        product.STOCK ??
                        product.stock ??
                        0
                    );

            },
            0
        );


    const lowStock =
        products.filter(
            product =>
                getStockStatus(product) === "low"
        ).length;


    const outOfStock =
        products.filter(
            product =>
                getStockStatus(product) === "out"
        ).length;


    const totalProductsElement =
        document.getElementById("totalProducts");

    const totalUnitsElement =
        document.getElementById("totalUnits");

    const lowStockElement =
        document.getElementById("lowStockProducts");

    const outOfStockElement =
        document.getElementById("outOfStockProducts");


    if (totalProductsElement) {

        totalProductsElement.textContent =
            totalProducts;

    }


    if (totalUnitsElement) {

        totalUnitsElement.textContent =
            totalUnits;

    }


    if (lowStockElement) {

        lowStockElement.textContent =
            lowStock;

    }


    if (outOfStockElement) {

        outOfStockElement.textContent =
            outOfStock;

    }

}


// ==========================================================
// SEARCH
// ==========================================================

function initializeSearch() {

    const search =
        document.getElementById("inventorySearch");


    if (!search) {

        return;

    }


    search.addEventListener(
        "input",
        renderInventory
    );

}


// ==========================================================
// FILTER
// ==========================================================

function initializeFilter() {

    const filter =
        document.getElementById("stockFilter");


    if (!filter) {

        return;

    }


    filter.addEventListener(
        "change",
        renderInventory
    );

}


// ==========================================================
// STOCK MODAL
// ==========================================================

function initializeStockModal() {

    const modal =
        document.getElementById("stockModal");

    const closeButton =
        document.getElementById("closeStockModal");

    const cancelButton =
        document.getElementById("cancelStock");

    const form =
        document.getElementById("stockForm");

    const action =
        document.getElementById("stockAction");

    const quantity =
        document.getElementById("stockQuantity");


    if (!modal || !form) {

        return;

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeStockModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeStockModal
        );

    }


    if (action) {

        action.addEventListener(
            "change",
            updateNewStockPreview
        );

    }


    if (quantity) {

        quantity.addEventListener(
            "input",
            updateNewStockPreview
        );

    }


    form.addEventListener(
        "submit",
        handleStockAdjustment
    );


    modal.addEventListener(
        "click",
        event => {

            if (event.target === modal) {

                closeStockModal();

            }

        }
    );

}


// ==========================================================
// OPEN STOCK MODAL
// ==========================================================

function openStockModal(productId) {

    const product =
        products.find(
            item =>
                String(item.ID ?? item.id) ===
                String(productId)
        );


    if (!product) {

        alert("Product not found.");

        return;

    }


    selectedProductId =
        product.ID ?? product.id;


    const productName =
        product.NAME ?? product.name;


    const currentStock =
        Number(
            product.STOCK ??
            product.stock ??
            0
        );


    document.getElementById(
        "stockProductName"
    ).textContent =
        productName;


    document.getElementById(
        "currentStockDisplay"
    ).textContent =
        currentStock;


    document.getElementById(
        "stockQuantity"
    ).value = "";


    document.getElementById(
        "stockAction"
    ).value = "add";


    document.getElementById(
        "newStockDisplay"
    ).textContent =
        currentStock;


    document.getElementById(
        "stockModal"
    ).classList.remove("hidden");

}


// ==========================================================
// CLOSE MODAL
// ==========================================================

function closeStockModal() {

    const modal =
        document.getElementById("stockModal");


    if (modal) {

        modal.classList.add("hidden");

    }


    selectedProductId = null;

}


// ==========================================================
// NEW STOCK PREVIEW
// ==========================================================

function updateNewStockPreview() {

    if (selectedProductId === null) {

        return;

    }


    const product =
        products.find(
            item =>
                String(item.ID ?? item.id) ===
                String(selectedProductId)
        );


    if (!product) {

        return;

    }


    const currentStock =
        Number(
            product.STOCK ??
            product.stock ??
            0
        );


    const action =
        document.getElementById(
            "stockAction"
        ).value;


    const quantity =
        Number(
            document.getElementById(
                "stockQuantity"
            ).value
        ) || 0;


    let newStock =
        currentStock;


    if (action === "add") {

        newStock =
            currentStock + quantity;

    }


    else if (action === "remove") {

        newStock =
            currentStock - quantity;

    }


    else if (action === "set") {

        newStock =
            quantity;

    }


    if (newStock < 0) {

        newStock = 0;

    }


    document.getElementById(
        "newStockDisplay"
    ).textContent =
        newStock;

}


// ==========================================================
// SAVE STOCK ADJUSTMENT
// ==========================================================

async function handleStockAdjustment(event) {

    event.preventDefault();


    if (selectedProductId === null) {

        return;

    }


    const action =
        document.getElementById(
            "stockAction"
        ).value;


    const quantity =
        Number(
            document.getElementById(
                "stockQuantity"
            ).value
        );


    if (
        !Number.isInteger(quantity) ||
        quantity < 0
    ) {

        alert(
            "Please enter a valid whole number."
        );

        return;

    }


    const product =
        products.find(
            item =>
                String(item.ID ?? item.id) ===
                String(selectedProductId)
        );


    if (!product) {

        alert("Product not found.");

        return;

    }


    const currentStock =
        Number(
            product.STOCK ??
            product.stock ??
            0
        );


    if (
        action === "remove" &&
        quantity > currentStock
    ) {

        alert(
            "You cannot remove more stock than is available."
        );

        return;

    }


    const submitButton =
        event.target.querySelector(
            'button[type="submit"]'
        );


    const originalText =
        submitButton
            ? submitButton.textContent
            : "";


    try {

        if (submitButton) {

            submitButton.disabled = true;

            submitButton.textContent =
                "Saving...";

        }


        const response =
            await fetch(
                `${API_BASE_URL}/products/${selectedProductId}/stock`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        action: action,
                        quantity: quantity
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to adjust stock."
            );

        }


        console.log(
            "STOCK ADJUSTMENT:",
            data
        );


        closeStockModal();

        /*
         * Reload from SQLite instead of
         * modifying the local array manually.
         *
         * This guarantees that the UI
         * reflects the actual database.
         */

        await loadProducts();


    }

    catch (error) {

        console.error(
            "STOCK ADJUSTMENT ERROR:",
            error
        );

        alert(
            error.message ||
            "Unable to adjust stock."
        );

    }

    finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.textContent =
                originalText || "Save Adjustment";

        }

    }

}


// ==========================================================
// ATTACH ADJUSTMENT BUTTONS
// ==========================================================

function attachAdjustmentButtons() {

    document
        .querySelectorAll(".adjust-stock")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openStockModal(
                        button.dataset.id
                    );

                }
            );

        });

}


// ==========================================================
// THEME
// ==========================================================

function initializeTheme() {

    const toggle =
        document.getElementById(
            "themeToggle"
        );


    if (!toggle) {

        return;

    }


    const savedTheme =
        localStorage.getItem("theme");


    if (
        savedTheme === "dark" ||
        (
            !savedTheme &&
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
        )
    ) {

        document.documentElement.classList.add(
            "dark"
        );

    }


    updateThemeIcon();


    toggle.addEventListener(
        "click",
        () => {

            document.documentElement.classList.toggle(
                "dark"
            );


            const isDark =
                document.documentElement.classList.contains(
                    "dark"
                );


            localStorage.setItem(
                "theme",
                isDark
                    ? "dark"
                    : "light"
            );


            updateThemeIcon();

        }
    );

}


// ==========================================================
// THEME ICON
// ==========================================================

function updateThemeIcon() {

    const icon =
        document.getElementById(
            "themeIcon"
        );


    if (!icon) {

        return;

    }


    const isDark =
        document.documentElement.classList.contains(
            "dark"
        );


    icon.setAttribute(
        "data-lucide",
        isDark
            ? "sun"
            : "moon"
    );


    initializeIcons();

}


// ==========================================================
// CLOCK
// ==========================================================

function initializeClock() {

    const dateElement =
        document.getElementById(
            "currentDate"
        );

    const timeElement =
        document.getElementById(
            "currentTime"
        );


    function updateClock() {

        const now =
            new Date();


        if (dateElement) {

            dateElement.textContent =
                now.toLocaleDateString(
                    "en-KE",
                    {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    }
                );

        }


        if (timeElement) {

            timeElement.textContent =
                now.toLocaleTimeString(
                    "en-KE",
                    {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
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


// ==========================================================
// LUCIDE
// ==========================================================

function initializeIcons() {

    if (
        typeof lucide !== "undefined"
    ) {

        lucide.createIcons();

    }

}


// ==========================================================
// HTML ESCAPE
// ==========================================================

function escapeHTML(value) {

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