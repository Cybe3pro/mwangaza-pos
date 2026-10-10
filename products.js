// ============================================================
// SimplePOS
// Products Controller
// ============================================================
// FRONTEND:
//     products.html
//          ↓
//     products.js
//
// BACKEND:
//     Flask API
//          ↓
//     SQLite
//
// SQLite is now the SINGLE SOURCE OF TRUTH for products.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    initializeProducts();
});


// ============================================================
// CONFIGURATION
// ============================================================

const API_BASE_URL = "http://127.0.0.1:5000/api";


// ============================================================
// INITIALIZE
// ============================================================

function initializeProducts() {

    // --------------------------------------------------------
    // DOM ELEMENTS
    // --------------------------------------------------------

    const productModal = document.getElementById("productModal");
    const addProductBtn = document.getElementById("addProductBtn");
    const closeModal = document.getElementById("closeModal");
    const cancelModal = document.getElementById("cancelModal");

    const productForm = document.getElementById("productForm");

    const productName = document.getElementById("productName");
    const productCategory = document.getElementById("productCategory");
    const productPrice = document.getElementById("productPrice");
    const productStock = document.getElementById("productStock");
    const lowStockThreshold = document.getElementById("lowStockThreshold");

    const modalTitle = document.getElementById("modalTitle");
    const saveProductBtn = document.getElementById("saveProductBtn");

    const productsTable = document.getElementById("productsTable");
    const emptyState = document.getElementById("emptyState");

    const productSearch = document.getElementById("productSearch");

    const totalProducts = document.getElementById("totalProducts");
    const lowStockProducts = document.getElementById("lowStockProducts");
    const outOfStockProducts = document.getElementById("outOfStockProducts");

    const currentDate = document.getElementById("currentDate");
    const currentTime = document.getElementById("currentTime");

    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");


    // --------------------------------------------------------
    // SAFETY CHECK
    // --------------------------------------------------------

    if (!productModal || !productForm || !productsTable) {

        console.error(
            "SimplePOS: Products page could not initialize."
        );

        return;
    }


    // ========================================================
    // STATE
    // ========================================================

    let products = [];

    let editingProductId = null;


    // ========================================================
    // LOAD PRODUCTS FROM FLASK
    // ========================================================

    async function loadProducts() {

        showLoadingState();

        try {

            const response = await fetch(
                `${API_BASE_URL}/products`
            );


            if (!response.ok) {

                throw new Error(
                    `Server returned HTTP ${response.status}`
                );

            }


            const data = await response.json();


            console.log(
                "SimplePOS: Products API response:",
                data
            );


            // ------------------------------------------------
            // HANDLE API RESPONSE
            // ------------------------------------------------

            if (Array.isArray(data)) {

                products = normalizeProducts(data);

            } else if (Array.isArray(data.products)) {

                products = normalizeProducts(data.products);

            } else {

                throw new Error(
                    "Invalid products data received from server."
                );

            }


            console.log(
                "SimplePOS: Products loaded:",
                products
            );


            renderProducts(
                productSearch
                    ? productSearch.value
                    : ""
            );

        } catch (error) {

            console.error(
                "SimplePOS: Could not load products:",
                error
            );


            products = [];


            showErrorState(
                "Unable to load products. Make sure the Flask backend is running."
            );

            updateStatistics();

        }

    }


    // ========================================================
    // NORMALIZE PRODUCT DATA
    // ========================================================
    // SQLite uses uppercase column names.
    // This converts them into the JavaScript format used
    // throughout the frontend.
    // ========================================================

    function normalizeProducts(productList) {

        return productList.map(product => {

            return {

                id:
                    product.ID ??
                    product.id,

                name:
                    String(
                        product.NAME ??
                        product.name ??
                        ""
                    ).trim(),

                category:
                    String(
                        product.CATEGORY ??
                        product.category ??
                        "other"
                    ).toLowerCase(),

                price:
                    Number(
                        product.PRICE ??
                        product.price ??
                        0
                    ),

                stock:
                    Number(
                        product.STOCK ??
                        product.stock ??
                        0
                    ),

                lowStockThreshold:
                    Number(
                        product.LOW_STOCK_THRESHOLD ??
                        product.lowStockThreshold ??
                        5
                    ),

                createdAt:
                    product.CREATED_AT ??
                    product.createdAt ??
                    null,

                updatedAt:
                    product.UPDATED_AT ??
                    product.updatedAt ??
                    null

            };

        });

    }


    // ========================================================
    // RENDER PRODUCTS
    // ========================================================

    function renderProducts(searchTerm = "") {

        productsTable.innerHTML = "";


        const search =
            String(searchTerm)
                .toLowerCase()
                .trim();


        const filteredProducts =
            products.filter(product => {

                return (

                    product.name
                        .toLowerCase()
                        .includes(search)

                    ||

                    product.category
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(product.id)
                        .toLowerCase()
                        .includes(search)

                );

            });


        // ----------------------------------------------------
        // EMPTY STATE
        // ----------------------------------------------------

        if (filteredProducts.length === 0) {

            emptyState.classList.remove("hidden");

        } else {

            emptyState.classList.add("hidden");

        }


        // ----------------------------------------------------
        // PRODUCT ROWS
        // ----------------------------------------------------

        filteredProducts.forEach(product => {

            const row =
                document.createElement("tr");


            row.className =
                "hover:bg-gray-50 dark:hover:bg-slate-800/50 transition";


            const status =
                getProductStatus(product);


            row.innerHTML = `

                <td class="px-6 py-4">

                    <div class="flex items-center gap-3">

                        <div
                            class="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">

                            <i
                                data-lucide="package"
                                class="w-5">
                            </i>

                        </div>

                        <div>

                            <p class="font-semibold">
                                ${escapeHTML(product.name)}
                            </p>

                            <p class="text-xs text-gray-500 dark:text-gray-400">
                                ID: ${escapeHTML(product.id)}
                            </p>

                        </div>

                    </div>

                </td>


                <td class="px-6 py-4">

                    <span class="capitalize">

                        ${escapeHTML(product.category)}

                    </span>

                </td>


                <td class="px-6 py-4 font-semibold">

                    KSh ${formatMoney(product.price)}

                </td>


                <td class="px-6 py-4">

                    <span class="font-semibold">

                        ${product.stock}

                    </span>

                    <span class="text-xs text-gray-500">
                        units
                    </span>

                </td>


                <td class="px-6 py-4">

                    ${getStatusBadge(status)}

                </td>


                <td class="px-6 py-4">

                    <div class="flex justify-end gap-2">

                        <button
                            type="button"
                            class="edit-product p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                            data-id="${product.id}"
                            title="Edit Product">

                            <i
                                data-lucide="pencil"
                                class="w-4">
                            </i>

                        </button>


                        <button
                            type="button"
                            class="delete-product p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                            data-id="${product.id}"
                            title="Delete Product">

                            <i
                                data-lucide="trash-2"
                                class="w-4">
                            </i>

                        </button>

                    </div>

                </td>

            `;


            productsTable.appendChild(row);

        });


        updateStatistics();

        initializeRowButtons();

        refreshIcons();

    }


    // ========================================================
    // PRODUCT STATUS
    // ========================================================

    function getProductStatus(product) {

        if (product.stock <= 0) {

            return "out";

        }


        if (
            product.stock <=
            product.lowStockThreshold
        ) {

            return "low";

        }


        return "good";

    }


    // ========================================================
    // STATUS BADGE
    // ========================================================

    function getStatusBadge(status) {

        if (status === "out") {

            return `
                <span
                    class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">

                    <span
                        class="w-1.5 h-1.5 rounded-full bg-red-500">
                    </span>

                    Out of Stock

                </span>
            `;

        }


        if (status === "low") {

            return `
                <span
                    class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">

                    <span
                        class="w-1.5 h-1.5 rounded-full bg-orange-500">
                    </span>

                    Low Stock

                </span>
            `;

        }


        return `
            <span
                class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">

                <span
                    class="w-1.5 h-1.5 rounded-full bg-green-500">
                </span>

                In Stock

            </span>
        `;

    }


    // ========================================================
    // STATISTICS
    // ========================================================

    function updateStatistics() {

        const total =
            products.length;


        const lowStock =
            products.filter(product =>

                product.stock > 0 &&

                product.stock <=
                product.lowStockThreshold

            ).length;


        const outOfStock =
            products.filter(product =>

                product.stock <= 0

            ).length;


        if (totalProducts) {

            totalProducts.textContent =
                total;

        }


        if (lowStockProducts) {

            lowStockProducts.textContent =
                lowStock;

        }


        if (outOfStockProducts) {

            outOfStockProducts.textContent =
                outOfStock;

        }

    }


    // ========================================================
    // OPEN ADD PRODUCT MODAL
    // ========================================================

    function openAddModal() {

        editingProductId = null;


        modalTitle.textContent =
            "Add Product";


        if (saveProductBtn) {

            saveProductBtn.textContent =
                "Save Product";

        }


        productForm.reset();


        lowStockThreshold.value =
            5;


        productModal.classList.remove(
            "hidden"
        );


        setTimeout(() => {

            productName.focus();

        }, 100);


        refreshIcons();

    }


    // ========================================================
    // OPEN EDIT PRODUCT MODAL
    // ========================================================

    function openEditModal(productId) {

        const product =
            products.find(
                item =>
                    String(item.id) ===
                    String(productId)
            );


        if (!product) {

            showNotification(
                "Product not found.",
                "error"
            );

            return;
        }


        editingProductId =
            product.id;


        modalTitle.textContent =
            "Edit Product";


        if (saveProductBtn) {

            saveProductBtn.textContent =
                "Update Product";

        }


        productName.value =
            product.name;


        productCategory.value =
            product.category;


        productPrice.value =
            product.price;


        productStock.value =
            product.stock;


        lowStockThreshold.value =
            product.lowStockThreshold;


        productModal.classList.remove(
            "hidden"
        );


        setTimeout(() => {

            productName.focus();

        }, 100);

    }


    // ========================================================
    // CLOSE MODAL
    // ========================================================

    function closeProductModal() {

        productModal.classList.add(
            "hidden"
        );


        editingProductId = null;


        productForm.reset();


        lowStockThreshold.value =
            5;


        if (saveProductBtn) {

            saveProductBtn.disabled =
                false;

            saveProductBtn.textContent =
                "Save Product";

        }

    }


    // ========================================================
    // SAVE PRODUCT
    // ========================================================

    productForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const name =
                productName.value.trim();


            const category =
                productCategory.value;


            const price =
                Number(productPrice.value);


            const stock =
                Number(productStock.value);


            const threshold =
                Number(
                    lowStockThreshold.value
                );


            // ------------------------------------------------
            // VALIDATION
            // ------------------------------------------------

            if (!name) {

                showNotification(
                    "Please enter a product name.",
                    "error"
                );

                return;
            }


            if (
                !Number.isFinite(price) ||
                price < 0
            ) {

                showNotification(
                    "Please enter a valid price.",
                    "error"
                );

                return;
            }


            if (
                !Number.isInteger(stock) ||
                stock < 0
            ) {

                showNotification(
                    "Stock must be a whole number.",
                    "error"
                );

                return;
            }


            if (
                !Number.isInteger(threshold) ||
                threshold < 0
            ) {

                showNotification(
                    "Low stock threshold must be a whole number.",
                    "error"
                );

                return;
            }


            // ------------------------------------------------
            // PREVENT DOUBLE SUBMISSION
            // ------------------------------------------------

            if (saveProductBtn) {

                saveProductBtn.disabled =
                    true;

                saveProductBtn.textContent =
                    editingProductId
                        ? "Updating..."
                        : "Saving...";

            }


            try {

                // ============================================
                // EDIT EXISTING PRODUCT
                // ============================================

                if (editingProductId !== null) {

                    await updateProduct(
                        editingProductId,
                        {
                            name,
                            category,
                            price,
                            stock,
                            lowStockThreshold:
                                threshold
                        }
                    );


                    closeProductModal();


                    await loadProducts();


                    showNotification(
                        "Product updated successfully.",
                        "success"
                    );


                    return;
                }


                // ============================================
                // CREATE NEW PRODUCT
                // ============================================

                await createProduct({

                    name,
                    category,
                    price,
                    stock,
                    lowStockThreshold:
                        threshold

                });


                closeProductModal();


                await loadProducts();


                showNotification(
                    "Product added successfully.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "SimplePOS: Save product error:",
                    error
                );


                showNotification(
                    error.message ||
                    "Unable to save product.",
                    "error"
                );


                if (saveProductBtn) {

                    saveProductBtn.disabled =
                        false;

                    saveProductBtn.textContent =
                        editingProductId
                            ? "Update Product"
                            : "Save Product";

                }

            }

        }
    );


    // ========================================================
    // CREATE PRODUCT
    // ========================================================

    async function createProduct(productData) {

        const response =
            await fetch(
                `${API_BASE_URL}/products`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        name:
                            productData.name,

                        category:
                            productData.category,

                        price:
                            productData.price,

                        stock:
                            productData.stock,

                        lowStockThreshold:
                            productData.lowStockThreshold

                    })
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getApiErrorMessage(
                    data,
                    "Unable to add product."
                )
            );

        }


        return data;

    }


    // ========================================================
    // UPDATE PRODUCT
    // ========================================================

    async function updateProduct(
        productId,
        productData
    ) {

        const response =
            await fetch(
                `${API_BASE_URL}/products/${encodeURIComponent(productId)}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        name:
                            productData.name,

                        category:
                            productData.category,

                        price:
                            productData.price,

                        stock:
                            productData.stock,

                        lowStockThreshold:
                            productData.lowStockThreshold

                    })
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getApiErrorMessage(
                    data,
                    "Unable to update product."
                )
            );

        }


        return data;

    }


    // ========================================================
    // EDIT / DELETE BUTTONS
    // ========================================================

    function initializeRowButtons() {

        document
            .querySelectorAll(".edit-product")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const productId =
                            button.dataset.id;


                        openEditModal(
                            productId
                        );

                    }
                );

            });


        document
            .querySelectorAll(".delete-product")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const productId =
                            button.dataset.id;


                        deleteProduct(
                            productId
                        );

                    }
                );

            });

    }


    // ========================================================
    // DELETE PRODUCT
    // ========================================================

    async function deleteProduct(productId) {

        const product =
            products.find(
                item =>
                    String(item.id) ===
                    String(productId)
            );


        if (!product) {

            showNotification(
                "Product not found.",
                "error"
            );

            return;
        }


        const confirmed =
            confirm(
                `Delete "${product.name}"?\n\nThis action cannot be undone.`
            );


        if (!confirmed) {

            return;

        }


        try {

            // ------------------------------------------------
            // DELETE FROM SQLITE THROUGH FLASK
            // ------------------------------------------------

            const response =
                await fetch(
                    `${API_BASE_URL}/products/${encodeURIComponent(productId)}`,
                    {
                        method: "DELETE"
                    }
                );


            const data =
                await parseResponse(response);


            if (!response.ok) {

                throw new Error(
                    getApiErrorMessage(
                        data,
                        "Unable to delete product."
                    )
                );

            }


            // ------------------------------------------------
            // RELOAD FROM DATABASE
            // ------------------------------------------------

            await loadProducts();


            showNotification(
                "Product deleted successfully.",
                "success"
            );


        } catch (error) {

            console.error(
                "SimplePOS: Delete product error:",
                error
            );


            showNotification(
                error.message ||
                "Unable to delete product.",
                "error"
            );

        }

    }


    // ========================================================
    // SEARCH
    // ========================================================

    if (productSearch) {

        productSearch.addEventListener(
            "input",
            () => {

                renderProducts(
                    productSearch.value
                );

            }
        );

    }


    // ========================================================
    // ADD PRODUCT BUTTON
    // ========================================================

    if (addProductBtn) {

        addProductBtn.addEventListener(
            "click",
            openAddModal
        );

    }


    // ========================================================
    // CLOSE MODAL
    // ========================================================

    if (closeModal) {

        closeModal.addEventListener(
            "click",
            closeProductModal
        );

    }


    if (cancelModal) {

        cancelModal.addEventListener(
            "click",
            closeProductModal
        );

    }


    // ========================================================
    // CLOSE WHEN CLICKING OUTSIDE MODAL
    // ========================================================

    productModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                productModal
            ) {

                closeProductModal();

            }

        }
    );


    // ========================================================
    // CLOSE WITH ESCAPE
    // ========================================================

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                !productModal.classList.contains(
                    "hidden"
                )
            ) {

                closeProductModal();

            }

        }
    );


    // ========================================================
    // DATE & TIME
    // ========================================================

    function updateClock() {

        const now =
            new Date();


        if (currentDate) {

            currentDate.textContent =
                now.toLocaleDateString(
                    "en-KE",
                    {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                    }
                );

        }


        if (currentTime) {

            currentTime.textContent =
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


    // ========================================================
    // THEME
    // ========================================================

    function initializeTheme() {

        const savedTheme =
            localStorage.getItem(
                "theme"
            );


        if (
            savedTheme ===
            "dark"
        ) {

            document.documentElement.classList.add(
                "dark"
            );

        } else if (
            savedTheme ===
            "light"
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

    }


    function toggleTheme() {

        const isDark =
            document.documentElement.classList.toggle(
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


    function updateThemeIcon() {

        if (!themeIcon) {

            return;

        }


        const isDark =
            document.documentElement.classList.contains(
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


    if (themeToggle) {

        themeToggle.addEventListener(
            "click",
            toggleTheme
        );

    }


    // ========================================================
    // LOADING STATE
    // ========================================================

    function showLoadingState() {

        emptyState.classList.add(
            "hidden"
        );


        productsTable.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="px-6 py-12 text-center">

                    <div
                        class="flex flex-col items-center justify-center">

                        <div
                            class="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin">
                        </div>

                        <p
                            class="mt-4 text-sm text-gray-500 dark:text-gray-400">

                            Loading products...

                        </p>

                    </div>

                </td>

            </tr>

        `;

    }


    // ========================================================
    // ERROR STATE
    // ========================================================

    function showErrorState(message) {

        emptyState.classList.add(
            "hidden"
        );


        productsTable.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="px-6 py-12 text-center">

                    <div
                        class="flex flex-col items-center justify-center">

                        <div
                            class="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center">

                            <i
                                data-lucide="wifi-off"
                                class="w-8 h-8">
                            </i>

                        </div>

                        <h3
                            class="font-semibold text-lg mt-4">

                            Unable to load products

                        </h3>

                        <p
                            class="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">

                            ${escapeHTML(message)}

                        </p>

                        <button
                            id="retryProductsBtn"
                            type="button"
                            class="mt-5 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium transition">

                            Try Again

                        </button>

                    </div>

                </td>

            </tr>

        `;


        refreshIcons();


        const retryButton =
            document.getElementById(
                "retryProductsBtn"
            );


        if (retryButton) {

            retryButton.addEventListener(
                "click",
                loadProducts
            );

        }

    }


    // ========================================================
    // API RESPONSE HANDLER
    // ========================================================

    async function parseResponse(response) {

        const contentType =
            response.headers.get(
                "content-type"
            );


        if (
            contentType &&
            contentType.includes(
                "application/json"
            )
        ) {

            return await response.json();

        }


        const text =
            await response.text();


        return {
            message: text
        };

    }


    // ========================================================
    // API ERROR MESSAGE
    // ========================================================

    function getApiErrorMessage(
        data,
        fallback
    ) {

        if (
            data &&
            typeof data.message ===
            "string" &&
            data.message.trim()
        ) {

            return data.message;

        }


        if (
            data &&
            typeof data.error ===
            "string" &&
            data.error.trim()
        ) {

            return data.error;

        }


        return fallback;

    }


    // ========================================================
    // NOTIFICATION
    // ========================================================

    function showNotification(
        message,
        type = "success"
    ) {

        // Remove previous notification

        const existing =
            document.getElementById(
                "productsNotification"
            );


        if (existing) {

            existing.remove();

        }


        const notification =
            document.createElement(
                "div"
            );


        notification.id =
            "productsNotification";


        const isError =
            type === "error";


        notification.className = `

            fixed
            top-6
            right-6
            z-[100]
            max-w-sm
            px-5
            py-4
            rounded-2xl
            shadow-2xl
            border
            flex
            items-start
            gap-3
            transition-all
            duration-300

            ${
                isError
                    ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                    : "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
            }

        `;


        notification.innerHTML = `

            <div class="mt-0.5">

                <i
                    data-lucide="${
                        isError
                            ? "circle-alert"
                            : "circle-check"
                    }"
                    class="w-5 h-5">
                </i>

            </div>

            <div class="flex-1">

                <p class="font-medium text-sm">

                    ${escapeHTML(message)}

                </p>

            </div>

            <button
                type="button"
                class="notification-close opacity-60 hover:opacity-100">

                <i
                    data-lucide="x"
                    class="w-4 h-4">
                </i>

            </button>

        `;


        document.body.appendChild(
            notification
        );


        refreshIcons();


        const closeButton =
            notification.querySelector(
                ".notification-close"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                () => notification.remove()
            );

        }


        setTimeout(() => {

            if (
                document.body.contains(
                    notification
                )
            ) {

                notification.classList.add(
                    "opacity-0",
                    "translate-y-2"
                );


                setTimeout(() => {

                    notification.remove();

                }, 300);

            }

        }, 3500);

    }


    // ========================================================
    // LUCIDE
    // ========================================================

    function refreshIcons() {

        if (
            typeof lucide !== "undefined" &&
            typeof lucide.createIcons ===
                "function"
        ) {

            lucide.createIcons();

        }

    }


    // ========================================================
    // ESCAPE HTML
    // ========================================================

    function escapeHTML(value) {

        return String(value)

            .replaceAll(
                "&",
                "&amp;"
            )

            .replaceAll(
                "<",
                "&lt;"
            )

            .replaceAll(
                ">",
                "&gt;"
            )

            .replaceAll(
                '"',
                "&quot;"
            )

            .replaceAll(
                "'",
                "&#039;"
            );

    }


    // ========================================================
    // MONEY FORMAT
    // ========================================================

    function formatMoney(value) {

        return Number(value).toLocaleString(
            "en-KE",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );

    }


    // ========================================================
    // INITIAL STARTUP
    // ========================================================

    initializeTheme();

    refreshIcons();

    loadProducts();

}