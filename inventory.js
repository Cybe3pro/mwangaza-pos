// ==========================================================
// SimplePOS
// Inventory Controller
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {

    initializeInventory();

});


// ==========================================================
// INITIALIZE
// ==========================================================

function initializeInventory() {

    initializeTheme();

    initializeClock();

    initializeInventoryData();

    initializeSearch();

    initializeFilter();

    initializeStockModal();

    renderInventory();

    initializeIcons();

}


// ==========================================================
// PRODUCT STORAGE
// ==========================================================

function getProducts() {

    const storedProducts =
        localStorage.getItem("products");

    if (!storedProducts) {

        return [];

    }

    try {

        return JSON.parse(storedProducts);

    } catch (error) {

        console.error(
            "Unable to read products:",
            error
        );

        return [];

    }

}


// ==========================================================
// SAVE PRODUCTS
// ==========================================================

function saveProducts(products) {

    localStorage.setItem(
        "products",
        JSON.stringify(products)
    );

}


// ==========================================================
// INITIAL PRODUCT DATA
// ==========================================================

function initializeInventoryData() {

    const products =
        getProducts();


    /*
     * If products already exist,
     * do not overwrite them.
     */

    if (products.length > 0) {

        return;

    }


    /*
     * These are only starter products.
     * They can later be removed once
     * your Products page creates them.
     */

    const defaultProducts = [

        {
            id: Date.now() + 1,
            name: "Sugar 1kg",
            category: "food",
            price: 150,
            stock: 20,
            lowStockThreshold: 5
        },

        {
            id: Date.now() + 2,
            name: "Milk 500ml",
            category: "dairy",
            price: 65,
            stock: 15,
            lowStockThreshold: 5
        },

        {
            id: Date.now() + 3,
            name: "Salt 500g",
            category: "food",
            price: 50,
            stock: 10,
            lowStockThreshold: 5
        },

        {
            id: Date.now() + 4,
            name: "Bread",
            category: "food",
            price: 70,
            stock: 12,
            lowStockThreshold: 5
        },

        {
            id: Date.now() + 5,
            name: "Cooking Oil 1L",
            category: "food",
            price: 280,
            stock: 8,
            lowStockThreshold: 3
        },

        {
            id: Date.now() + 6,
            name: "Bathing Soap",
            category: "household",
            price: 120,
            stock: 9,
            lowStockThreshold: 3
        }

    ];


    saveProducts(defaultProducts);

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


    const products =
        getProducts();


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

            const matchesSearch =
                product.name
                    .toLowerCase()
                    .includes(searchTerm);


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

    } else {

        emptyState.classList.add("hidden");

    }


    filteredProducts.forEach(product => {

        const row =
            document.createElement("tr");


        row.className =
            "hover:bg-gray-50 dark:hover:bg-slate-800/50 transition";


        const status =
            getStockStatus(product);


        const statusHTML =
            getStatusHTML(status);


        row.innerHTML = `

            <td class="px-6 py-4">

                <div>

                    <p class="font-semibold">
                        ${escapeHTML(product.name)}
                    </p>

                    <p class="text-xs text-gray-500">
                        ID: ${product.id}
                    </p>

                </div>

            </td>


            <td class="px-6 py-4">

                <span class="capitalize">
                    ${escapeHTML(product.category)}
                </span>

            </td>


            <td class="px-6 py-4 font-medium">

                KSh ${Number(product.price).toLocaleString()}

            </td>


            <td class="px-6 py-4">

                <div class="flex items-center gap-3">

                    <span class="font-bold">
                        ${product.stock}
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
                        data-id="${product.id}"
                        title="Adjust stock">

                        <i data-lucide="plus-minus" class="w-4 h-4"></i>

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
        Number(product.stock);


    const threshold =
        Number(product.lowStockThreshold ?? 5);


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

    const products =
        getProducts();


    const totalProducts =
        products.length;


    const totalUnits =
        products.reduce(
            (total, product) =>
                total + Number(product.stock || 0),
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


    document.getElementById(
        "totalProducts"
    ).textContent =
        totalProducts;


    document.getElementById(
        "totalUnits"
    ).textContent =
        totalUnits;


    document.getElementById(
        "lowStockProducts"
    ).textContent =
        lowStock;


    document.getElementById(
        "outOfStockProducts"
    ).textContent =
        outOfStock;

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

let selectedProductId = null;


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


    closeButton.addEventListener(
        "click",
        closeStockModal
    );


    cancelButton.addEventListener(
        "click",
        closeStockModal
    );


    action.addEventListener(
        "change",
        updateNewStockPreview
    );


    quantity.addEventListener(
        "input",
        updateNewStockPreview
    );


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

    const products =
        getProducts();


    const product =
        products.find(
            item =>
                String(item.id) === String(productId)
        );


    if (!product) {

        alert("Product not found.");

        return;

    }


    selectedProductId =
        product.id;


    document.getElementById(
        "stockProductName"
    ).textContent =
        product.name;


    document.getElementById(
        "currentStockDisplay"
    ).textContent =
        product.stock;


    document.getElementById(
        "stockQuantity"
    ).value = "";


    document.getElementById(
        "stockAction"
    ).value = "add";


    document.getElementById(
        "newStockDisplay"
    ).textContent =
        product.stock;


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


    const products =
        getProducts();


    const product =
        products.find(
            item =>
                String(item.id) === String(selectedProductId)
        );


    if (!product) {

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
        ) || 0;


    let newStock =
        Number(product.stock);


    if (action === "add") {

        newStock =
            Number(product.stock) + quantity;

    }


    if (action === "remove") {

        newStock =
            Number(product.stock) - quantity;

    }


    if (action === "set") {

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

function handleStockAdjustment(event) {

    event.preventDefault();


    if (selectedProductId === null) {

        return;

    }


    const products =
        getProducts();


    const product =
        products.find(
            item =>
                String(item.id) === String(selectedProductId)
        );


    if (!product) {

        alert("Product not found.");

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


    if (Number.isNaN(quantity) || quantity < 0) {

        alert("Please enter a valid quantity.");

        return;

    }


    const oldStock =
        Number(product.stock);


    let newStock;


    if (action === "add") {

        newStock =
            oldStock + quantity;

    }


    else if (action === "remove") {

        if (quantity > oldStock) {

            alert(
                "You cannot remove more stock than is available."
            );

            return;

        }

        newStock =
            oldStock - quantity;

    }


    else {

        newStock =
            quantity;

    }


    product.stock =
        newStock;


    product.updatedAt =
        new Date().toISOString();


    saveProducts(products);


    saveInventoryMovement({

        productId: product.id,

        productName: product.name,

        action: action,

        quantity: quantity,

        oldStock: oldStock,

        newStock: newStock,

        date: new Date().toISOString()

    });


    closeStockModal();

    renderInventory();


}


// ==========================================================
// INVENTORY MOVEMENT HISTORY
// ==========================================================

function saveInventoryMovement(movement) {

    const stored =
        localStorage.getItem(
            "inventoryMovements"
        );


    let movements = [];


    if (stored) {

        try {

            movements =
                JSON.parse(stored);

        } catch {

            movements = [];

        }

    }


    movements.unshift(movement);


    /*
     * Keep the latest 100 movements.
     */

    movements =
        movements.slice(0, 100);


    localStorage.setItem(
        "inventoryMovements",
        JSON.stringify(movements)
    );

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
        localStorage.getItem(
            "theme"
        );


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