// ============================================================
// SimplePOS
// Products Controller
// SINGLE SOURCE OF TRUTH
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    initializeProducts();
});


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
        console.error("Products page could not initialize.");
        return;
    }


    // --------------------------------------------------------
    // STATE
    // --------------------------------------------------------

    let products = loadProducts();

    let editingProductId = null;


    // ========================================================
    // PRODUCT DATABASE
    // ========================================================

    function loadProducts() {

        const storedProducts =
            localStorage.getItem("products");

        if (!storedProducts) {

            const defaultProducts = [

                {
                    id: generateProductId(),
                    name: "Sugar 1kg",
                    category: "food",
                    price: 150,
                    stock: 20,
                    lowStockThreshold: 5
                },

                {
                    id: generateProductId(),
                    name: "Milk 500ml",
                    category: "dairy",
                    price: 65,
                    stock: 15,
                    lowStockThreshold: 5
                },

                {
                    id: generateProductId(),
                    name: "Salt 500g",
                    category: "food",
                    price: 50,
                    stock: 10,
                    lowStockThreshold: 5
                },

                {
                    id: generateProductId(),
                    name: "Bread",
                    category: "food",
                    price: 70,
                    stock: 12,
                    lowStockThreshold: 5
                },

                {
                    id: generateProductId(),
                    name: "Cooking Oil 1L",
                    category: "food",
                    price: 280,
                    stock: 8,
                    lowStockThreshold: 3
                },

                {
                    id: generateProductId(),
                    name: "Bathing Soap",
                    category: "household",
                    price: 120,
                    stock: 9,
                    lowStockThreshold: 3
                }

            ];

            saveProducts(defaultProducts);

            return defaultProducts;
        }


        try {

            const parsed =
                JSON.parse(storedProducts);

            if (!Array.isArray(parsed)) {
                throw new Error("Products data is not an array.");
            }

            return normalizeProducts(parsed);

        } catch (error) {

            console.error(
                "Could not load products:",
                error
            );

            return [];
        }
    }


    // ========================================================
    // NORMALIZE PRODUCT DATA
    // ========================================================

    function normalizeProducts(productList) {

        return productList.map(product => {

            return {

                id:
                    product.id ||
                    generateProductId(),

                name:
                    String(product.name || "").trim(),

                category:
                    product.category || "other",

                price:
                    Number(product.price) || 0,

                stock:
                    Number(product.stock) || 0,

                lowStockThreshold:
                    Number(product.lowStockThreshold) || 5

            };

        });

    }


    // ========================================================
    // SAVE PRODUCTS
    // ========================================================

    function saveProducts(productList) {

        localStorage.setItem(
            "products",
            JSON.stringify(productList)
        );

    }


    // ========================================================
    // GENERATE PRODUCT ID
    // ========================================================

    function generateProductId() {

        return (
            "PROD-" +
            Date.now().toString(36) +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 8)
        );

    }


    // ========================================================
    // RENDER PRODUCTS
    // ========================================================

    function renderProducts(searchTerm = "") {

        productsTable.innerHTML = "";

        const search =
            searchTerm.toLowerCase().trim();


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
                );

            });


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
                getProductStatus(product);


            row.innerHTML = `

                <td class="px-6 py-4">

                    <div class="flex items-center gap-3">

                        <div
                            class="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">

                            <i data-lucide="package" class="w-5"></i>

                        </div>

                        <div>

                            <p class="font-semibold">
                                ${escapeHTML(product.name)}
                            </p>

                            <p class="text-xs text-gray-500">
                                ${escapeHTML(product.id)}
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

                            <i data-lucide="pencil" class="w-4"></i>

                        </button>


                        <button
                            type="button"
                            class="delete-product p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                            data-id="${product.id}"
                            title="Delete Product">

                            <i data-lucide="trash-2" class="w-4"></i>

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

        if (product.stock <= product.lowStockThreshold) {
            return "low";
        }

        return "good";

    }


    function getStatusBadge(status) {

        if (status === "out") {

            return `
                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    Out of Stock
                </span>
            `;

        }


        if (status === "low") {

            return `
                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    <span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                    Low Stock
                </span>
            `;

        }


        return `
            <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
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
                product.stock <= product.lowStockThreshold
            ).length;


        const outOfStock =
            products.filter(product =>
                product.stock <= 0
            ).length;


        if (totalProducts) {
            totalProducts.textContent = total;
        }


        if (lowStockProducts) {
            lowStockProducts.textContent = lowStock;
        }


        if (outOfStockProducts) {
            outOfStockProducts.textContent = outOfStock;
        }

    }


    // ========================================================
    // OPEN ADD PRODUCT MODAL
    // ========================================================

    function openAddModal() {

        editingProductId = null;

        modalTitle.textContent = "Add Product";

        productForm.reset();

        lowStockThreshold.value = 5;

        productModal.classList.remove("hidden");

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
                item => item.id === productId
            );


        if (!product) {

            console.error(
                "Product not found:",
                productId
            );

            alert("Product not found.");

            return;
        }


        editingProductId =
            product.id;


        modalTitle.textContent =
            "Edit Product";


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


        productModal.classList.remove("hidden");

        setTimeout(() => {
            productName.focus();
        }, 100);

    }


    // ========================================================
    // CLOSE MODAL
    // ========================================================

    function closeProductModal() {

        productModal.classList.add("hidden");

        editingProductId = null;

        productForm.reset();

        lowStockThreshold.value = 5;

    }


    // ========================================================
    // SAVE PRODUCT
    // ========================================================

    productForm.addEventListener("submit", event => {

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
            Number(lowStockThreshold.value);


        // ----------------------------------------------
        // VALIDATION
        // ----------------------------------------------

        if (!name) {

            alert("Please enter a product name.");

            return;
        }


        if (!Number.isFinite(price) || price < 0) {

            alert("Please enter a valid price.");

            return;
        }


        if (!Number.isInteger(stock) || stock < 0) {

            alert("Stock must be a whole number.");

            return;
        }


        if (!Number.isInteger(threshold) || threshold < 0) {

            alert(
                "Low stock threshold must be a whole number."
            );

            return;
        }


        // ----------------------------------------------
        // EDIT EXISTING PRODUCT
        // ----------------------------------------------

        if (editingProductId) {

            const index =
                products.findIndex(
                    product =>
                        product.id === editingProductId
                );


            if (index === -1) {

                alert("Product could not be found.");

                return;
            }


            products[index] = {

                ...products[index],

                name,
                category,
                price,
                stock,
                lowStockThreshold: threshold

            };


            saveProducts(products);

            closeProductModal();

            renderProducts(
                productSearch
                    ? productSearch.value
                    : ""
            );

            alert("Product updated successfully.");

            return;
        }


        // ----------------------------------------------
        // CHECK DUPLICATE PRODUCT
        // ----------------------------------------------

        const duplicate =
            products.some(
                product =>
                    product.name.toLowerCase() ===
                    name.toLowerCase()
            );


        if (duplicate) {

            alert(
                "A product with this name already exists."
            );

            return;
        }


        // ----------------------------------------------
        // CREATE NEW PRODUCT
        // ----------------------------------------------

        const newProduct = {

            id: generateProductId(),

            name,

            category,

            price,

            stock,

            lowStockThreshold: threshold

        };


        products.push(newProduct);

        saveProducts(products);

        closeProductModal();

        renderProducts(
            productSearch
                ? productSearch.value
                : ""
        );

        alert("Product added successfully.");

    });


    // ========================================================
    // EDIT / DELETE BUTTONS
    // ========================================================

    function initializeRowButtons() {

        document
            .querySelectorAll(".edit-product")
            .forEach(button => {

                button.addEventListener("click", () => {

                    const productId =
                        button.dataset.id;

                    openEditModal(productId);

                });

            });


        document
            .querySelectorAll(".delete-product")
            .forEach(button => {

                button.addEventListener("click", () => {

                    const productId =
                        button.dataset.id;

                    deleteProduct(productId);

                });

            });

    }


    // ========================================================
    // DELETE PRODUCT
    // ========================================================

    function deleteProduct(productId) {

        const product =
            products.find(
                item => item.id === productId
            );


        if (!product) {

            alert("Product not found.");

            return;
        }


        const confirmed =
            confirm(
                `Delete "${product.name}"?\n\nThis action cannot be undone.`
            );


        if (!confirmed) {
            return;
        }


        products =
            products.filter(
                item => item.id !== productId
            );


        saveProducts(products);


        renderProducts(
            productSearch
                ? productSearch.value
                : ""
        );


        alert("Product deleted successfully.");

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
    // MODAL EVENTS
    // ========================================================

    if (addProductBtn) {

        addProductBtn.addEventListener(
            "click",
            openAddModal
        );

    }


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


    // Close when clicking outside modal

    productModal.addEventListener(
        "click",
        event => {

            if (event.target === productModal) {
                closeProductModal();
            }

        }
    );


    // Close with Escape

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                !productModal.classList.contains("hidden")
            ) {

                closeProductModal();

            }

        }
    );


    // ========================================================
    // DATE & TIME
    // ========================================================

    function updateClock() {

        const now = new Date();


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

    setInterval(updateClock, 1000);


    // ========================================================
    // THEME
    // ========================================================

    function initializeTheme() {

        const savedTheme =
            localStorage.getItem("theme");


        if (savedTheme === "dark") {

            document.documentElement.classList.add("dark");

        } else if (savedTheme === "light") {

            document.documentElement.classList.remove("dark");

        } else {

            if (
                window.matchMedia &&
                window.matchMedia(
                    "(prefers-color-scheme: dark)"
                ).matches
            ) {

                document.documentElement.classList.add("dark");

            }

        }


        updateThemeIcon();

    }


    function toggleTheme() {

        const isDark =
            document.documentElement.classList.toggle("dark");


        localStorage.setItem(
            "theme",
            isDark ? "dark" : "light"
        );


        updateThemeIcon();

    }


    function updateThemeIcon() {

        if (!themeIcon) {
            return;
        }


        const isDark =
            document.documentElement.classList.contains("dark");


        themeIcon.setAttribute(
            "data-lucide",
            isDark ? "sun" : "moon"
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
    // LUCIDE
    // ========================================================

    function refreshIcons() {

        if (
            typeof lucide !== "undefined" &&
            typeof lucide.createIcons === "function"
        ) {

            lucide.createIcons();

        }

    }


    // ========================================================
    // ESCAPE HTML
    // ========================================================

    function escapeHTML(value) {

        return String(value)

            .replaceAll("&", "&amp;")

            .replaceAll("<", "&lt;")

            .replaceAll(">", "&gt;")

            .replaceAll('"', "&quot;")

            .replaceAll("'", "&#039;");

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
    // INITIAL LOAD
    // ========================================================

    initializeTheme();

    renderProducts();

    refreshIcons();

}