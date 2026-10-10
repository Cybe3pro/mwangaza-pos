// ============================================================
// SimplePOS
// Sales Terminal Controller
// ============================================================

let products = [];
let currentCart = [];
let activeCategory = "All";
let activePaymentMethod = "Cash";

document.addEventListener("DOMContentLoaded", async () => {

    // Make sure a user is logged in before
    // opening the sales terminal.
    const currentUser = requireLogin();

    if (!currentUser) {
        return;
    }

    console.log(
        `Logged in as: ${currentUser.full_name} (${currentUser.role})`
    );

    await initializeSalesTerminal();
});

// ============================================================
// INITIALIZATION
// ============================================================

async function initializeSalesTerminal() {
    initializeClock();
    initializeTheme();
    setupEventListeners();

    await loadProducts();

    loadCategories();
    renderProducts();
    renderCart();
    initializeManagerAuthorization();
}

// ============================================================
// API DATA ACCESS
// ============================================================

async function loadProducts() {
    try {
        const response = await fetch(
            "http://127.0.0.1:5000/api/products"
        );

        if (!response.ok) {
            throw new Error(
                `Server returned ${response.status}`
            );
        }

        const data = await response.json();

        /*
         * Flask returns database fields in UPPERCASE.
         * Convert them into the format used by the
         * sales terminal.
         */
        products = data.map(product => ({
            id: product.ID,
            name: product.NAME,
            category: product.CATEGORY,
            price: Number(product.PRICE) || 0,
            stock: Number(product.STOCK) || 0,
            lowStockThreshold:
                Number(product.LOW_STOCK_THRESHOLD) || 0
        }));

        console.log(
            "SimplePOS: Products loaded from SQLite:",
            products
        );

    } catch (error) {
        console.error(
            "SimplePOS: Failed to load products.",
            error
        );

        products = [];

        alert(
            "Unable to connect to the Mwangaza POS backend.\n\n" +
            "Make sure the Flask server is running on port 5000."
        );
    }
}

// ============================================================
// CATEGORY NAVIGATION
// ============================================================

function loadCategories() {
    const container =
        document.getElementById("categoryContainer");

    if (!container) return;

    const categories = [
        "All",
        ...new Set(
            products
                .map(product => product.category)
                .filter(Boolean)
        )
    ];

    container.innerHTML = categories
        .map(category => {

            const isActive =
                category === activeCategory;

            return `
                <button
                    type="button"
                    data-category="${category}"
                    class="category-btn px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                        isActive
                            ? "bg-green-600 text-white shadow-sm"
                            : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }"
                >
                    ${category}
                </button>
            `;
        })
        .join("");

    container
        .querySelectorAll(".category-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                activeCategory =
                    button.getAttribute(
                        "data-category"
                    );

                loadCategories();
                renderProducts();
            });
        });
}

// ============================================================
// PRODUCT ICONS
// ============================================================

function getProductIcon(product) {

    const name =
        (product.name || "").toLowerCase();

    const category =
        (product.category || "").toLowerCase();

    if (name.includes("milk")) {
        return "milk";
    }

    if (name.includes("bread")) {
        return "sandwich";
    }

    if (name.includes("oil")) {
        return "droplets";
    }

    if (name.includes("soap")) {
        return "soap-dispenser-droplet";
    }

    if (name.includes("salt")) {
        return "package";
    }

    if (category === "dairy") {
        return "milk";
    }

    if (category === "food") {
        return "package";
    }

    if (category === "household") {
        return "home";
    }

    return "package";
}

// ============================================================
// PRODUCT GRID RENDERING
// ============================================================

function renderProducts() {

    const grid =
        document.getElementById("productGrid");

    const emptyState =
        document.getElementById("noProductsState");

    const searchInput =
        document.getElementById("productSearch");

    if (!grid) return;

    const query =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

    const filtered =
        products.filter(product => {

            const matchesCategory =
                activeCategory === "All" ||
                product.category === activeCategory;

            const matchesSearch =
                !query ||
                (
                    product.name &&
                    product.name
                        .toLowerCase()
                        .includes(query)
                ) ||
                (
                    product.category &&
                    product.category
                        .toLowerCase()
                        .includes(query)
                );

            return (
                matchesCategory &&
                matchesSearch
            );
        });

    grid.innerHTML = "";

    // --------------------------------------------------------
    // NO PRODUCTS
    // --------------------------------------------------------

    if (filtered.length === 0) {

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
    // CREATE PRODUCT CARDS
    // --------------------------------------------------------

    filtered.forEach(product => {

        const stock =
            Number(product.stock) || 0;

        const price =
            Number(product.price) || 0;

        const isOutOfStock =
            stock <= 0;

        const card =
            document.createElement("div");

        card.className = `
            product-card
            bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-800
            rounded-2xl p-4
            flex flex-col justify-between
            shadow-card relative overflow-hidden
            ${
                isOutOfStock
                    ? "opacity-60 cursor-not-allowed"
                    : "cursor-pointer hover:border-green-500/50"
            }
        `;

        card.innerHTML = `
            <div>

                <div class="flex items-start justify-between gap-2 mb-2">

                    <span
                        class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md truncate max-w-[100px]"
                    >
                        ${product.category || "General"}
                    </span>

                    <span
                        class="text-xs font-extrabold ${
                            isOutOfStock
                                ? "text-red-500"
                                : "text-slate-500 dark:text-slate-400"
                        }"
                    >
                        ${
                            isOutOfStock
                                ? "Out of Stock"
                                : `${stock} left`
                        }
                    </span>

                </div>

                <div class="flex items-center gap-3">

                    <div
                        class="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0"
                    >
                        <i
                            data-lucide="${getProductIcon(product)}"
                            class="w-5 h-5"
                        ></i>
                    </div>

                    <h4
                        class="font-heading font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-2"
                    >
                        ${product.name}
                    </h4>

                </div>

            </div>

            <div
                class="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60"
            >

                <span
                    class="font-heading font-extrabold text-sm text-green-600 dark:text-green-400"
                >
                    ${formatCurrency(price)}
                </span>

                <button
                    type="button"
                    ${
                        isOutOfStock
                            ? "disabled"
                            : ""
                    }
                    class="add-to-cart w-8 h-8 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-white flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <i
                        data-lucide="plus"
                        class="w-4 h-4"
                    ></i>
                </button>

            </div>
        `;

        // ----------------------------------------------------
        // ADD BUTTON
        // ----------------------------------------------------
        //
        // stopPropagation() prevents the button click
        // from also triggering the card click.
        //

        const addButton =
            card.querySelector(".add-to-cart");

        if (addButton && !isOutOfStock) {

            addButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    addToCart(product);
                }
            );
        }

        // ----------------------------------------------------
        // PRODUCT CARD CLICK
        // ----------------------------------------------------

        if (!isOutOfStock) {

            card.addEventListener(
                "click",
                () => {
                    addToCart(product);
                }
            );
        }

        grid.appendChild(card);
    });

    refreshIcons();
}

// ============================================================
// CART LOGIC
// ============================================================

function addToCart(product) {

    const stock =
        Number(product.stock) || 0;

    const existingIndex =
        currentCart.findIndex(
            item => item.id === product.id
        );

    // --------------------------------------------------------
    // PRODUCT ALREADY IN CART
    // --------------------------------------------------------

    if (existingIndex > -1) {

        if (
            currentCart[existingIndex].quantity + 1 >
            stock
        ) {

            alert(
                `Cannot add more ${product.name}. ` +
                `Only ${stock} items in stock.`
            );

            return;
        }

        currentCart[existingIndex].quantity += 1;

    }

    // --------------------------------------------------------
    // NEW PRODUCT
    // --------------------------------------------------------

    else {

        if (stock < 1) {

            alert(
                `${product.name} is out of stock.`
            );

            return;
        }

        currentCart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price) || 0,
            quantity: 1,
            maxStock: stock
        });
    }

    renderCart();
}

// ============================================================
// UPDATE CART QUANTITY
// ============================================================

function updateQuantity(id, change) {

    const item =
        currentCart.find(
            item => item.id === id
        );

    if (!item) return;

    const newQty =
        item.quantity + change;

    if (newQty <= 0) {

        removeFromCart(id);

    } else if (newQty > item.maxStock) {

        alert(
            `Maximum available stock (${item.maxStock}) reached.`
        );

    } else {

        item.quantity = newQty;

        renderCart();
    }
}

// ============================================================
// REMOVE FROM CART
// ============================================================

function removeFromCart(id) {

    currentCart =
        currentCart.filter(
            item => item.id !== id
        );

    renderCart();
}

// ============================================================
// CLEAR CART
// ============================================================

function clearCart() {

    if (currentCart.length === 0) {
        return;
    }

    currentCart = [];

    renderCart();
}

// ============================================================
// CART DOM RENDERING
// ============================================================

function renderCart() {

    const container =
        document.getElementById("cartItems");

    const emptyState =
        document.getElementById("emptyCartState");

    const completeBtn =
        document.getElementById("completeSale");

    const subtotalEl =
        document.getElementById("cartSubtotal");

    const taxEl =
        document.getElementById("cartTax");

    const totalEl =
        document.getElementById("cartTotal");

    if (!container) return;

    container.innerHTML = "";

    // --------------------------------------------------------
    // EMPTY CART
    // --------------------------------------------------------

    if (currentCart.length === 0) {

        if (emptyState) {
            emptyState.classList.remove("hidden");
        }

        if (completeBtn) {
            completeBtn.disabled = true;
        }

        if (subtotalEl) {
            subtotalEl.textContent =
                formatCurrency(0);
        }

        if (taxEl) {
            taxEl.textContent =
                formatCurrency(0);
        }

        if (totalEl) {
            totalEl.textContent =
                formatCurrency(0);
        }

        refreshIcons();

        return;
    }

    // --------------------------------------------------------
    // CART HAS ITEMS
    // --------------------------------------------------------

    if (emptyState) {
        emptyState.classList.add("hidden");
    }

    if (completeBtn) {
        completeBtn.disabled = false;
    }

    let subtotal = 0;

    currentCart.forEach(item => {

        const itemTotal =
            item.price * item.quantity;

        subtotal += itemTotal;

        const row =
            document.createElement("div");

        row.className =
            "flex items-center justify-between p-3 rounded-2xl " +
            "bg-slate-50 dark:bg-slate-800/50 " +
            "border border-slate-100 dark:border-slate-800";

        row.innerHTML = `
            <div class="min-w-0 flex-1 pr-3">

                <h5
                    class="font-heading font-semibold text-xs text-slate-800 dark:text-slate-200 truncate"
                >
                    ${item.name}
                </h5>

                <p
                    class="text-[11px] text-slate-400 font-mono mt-0.5"
                >
                    ${formatCurrency(item.price)} each
                </p>

            </div>

            <div class="flex items-center gap-2">

                <div
                    class="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1"
                >

                    <button
                        type="button"
                        onclick="updateQuantity('${item.id}', -1)"
                        class="decrease w-6 h-6 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
                    >
                        <i
                            data-lucide="minus"
                            class="w-3 h-3"
                        ></i>
                    </button>

                    <span
                        class="w-6 text-center font-bold text-xs font-mono text-slate-800 dark:text-white"
                    >
                        ${item.quantity}
                    </span>

                    <button
                        type="button"
                        onclick="updateQuantity('${item.id}', 1)"
                        class="increase w-6 h-6 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
                    >
                        <i
                            data-lucide="plus"
                            class="w-3 h-3"
                        ></i>
                    </button>

                </div>

                <span
                    class="w-16 text-right font-mono font-bold text-xs text-slate-800 dark:text-white"
                >
                    ${formatCurrency(itemTotal)}
                </span>

                <button
                    type="button"
                    onclick="removeFromCart('${item.id}')"
                    class="text-slate-400 hover:text-red-500 p-1 transition"
                >
                    <i
                        data-lucide="trash-2"
                        class="w-4 h-4"
                    ></i>
                </button>

            </div>
        `;

        container.appendChild(row);
    });

    // --------------------------------------------------------
    // TOTALS
    // --------------------------------------------------------

    const tax =
        subtotal * 0.16;

    const total =
        subtotal + tax;

    if (subtotalEl) {
        subtotalEl.textContent =
            formatCurrency(subtotal);
    }

    if (taxEl) {
        taxEl.textContent =
            formatCurrency(tax);
    }

    if (totalEl) {
        totalEl.textContent =
            formatCurrency(total);
    }

    refreshIcons();
}

// ============================================================
// CHECKOUT
// ============================================================

/*
 * Checkout is handled by the Flask backend.
 *
 * JavaScript sends the selected products and quantities.
 * Python validates the sale, calculates totals, updates
 * inventory, creates the sale records, and returns the receipt.
 */

async function processCheckout() {

    // --------------------------------------------------------
    // 1. CHECK CART
    // --------------------------------------------------------

    if (currentCart.length === 0) {

        alert(
            "Your cart is empty."
        );

        return;
    }

    // --------------------------------------------------------
    // 2. PREPARE ITEMS FOR PYTHON
    // --------------------------------------------------------

    const items =
        currentCart.map(item => ({
            productId: item.id,
            quantity: item.quantity
        }));

    // --------------------------------------------------------
    // 3. DISABLE CHECKOUT BUTTON
    // --------------------------------------------------------

    const checkoutButton =
        document.getElementById("completeSale");

    if (checkoutButton) {

        checkoutButton.disabled = true;

        checkoutButton.innerHTML = `
            <i
                data-lucide="loader-2"
                class="w-5 h-5 animate-spin"
            ></i>
            Processing...
        `;

        refreshIcons();
    }

    try {

        // ----------------------------------------------------
        // 4. SEND SALE TO FLASK
        // ----------------------------------------------------

        const response =
            await fetch(
                "http://127.0.0.1:5000/api/sales",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        paymentMethod:
                            activePaymentMethod,

                        items: items
                    })
                }
            );

        // ----------------------------------------------------
        // 5. READ RESPONSE
        // ----------------------------------------------------

        const result =
            await response.json();

        // ----------------------------------------------------
        // 6. HANDLE BACKEND ERROR
        // ----------------------------------------------------

        if (
            !response.ok ||
            result.status !== "success"
        ) {

            throw new Error(
                result.message ||
                "Unable to complete the sale."
            );
        }

        // ----------------------------------------------------
        // 7. SALE SUCCESSFUL
        // ----------------------------------------------------

        console.log(
            "SALE COMPLETED:",
            result
        );

        // Update frontend stock.
        currentCart.forEach(cartItem => {

            const product =
                products.find(
                    product =>
                        product.id === cartItem.id
                );

            if (product) {

                product.stock -=
                    cartItem.quantity;
            }
        });

        // ----------------------------------------------------
        // 8. PREPARE RECEIPT
        // ----------------------------------------------------

        showReceipt(result.sale);

        // ----------------------------------------------------
        // 9. CLEAR CART
        // ----------------------------------------------------

        currentCart = [];

        renderCart();
        renderProducts();

    } catch (error) {

        console.error(
            "CHECKOUT ERROR:",
            error
        );

        alert(
            "Sale could not be completed.\n\n" +
            error.message
        );

    } finally {

        // ----------------------------------------------------
        // 10. RESTORE CHECKOUT BUTTON
        // ----------------------------------------------------

        if (checkoutButton) {

            checkoutButton.disabled = false;

            checkoutButton.innerHTML = `
                <i
                    data-lucide="check-circle"
                    class="w-5 h-5"
                ></i>
                Complete Sale
            `;

            refreshIcons();
        }
    }
}

// ============================================================
// RECEIPT
// ============================================================

function showReceipt(sale) {

    if (!sale || !sale.id) {

        console.error(
            "SALE RESPONSE DOES NOT CONTAIN A SALE ID:",
            sale
        );

        alert(
            "Sale completed, but the receipt ID could not be found."
        );

        return;
    }

    console.log(
        "Opening receipt for sale:",
        sale.id
    );

    window.location.href =
        `receipt.html?id=${sale.id}`;
}

// ============================================================
// EVENT LISTENERS & UI SETUP
// ============================================================

function setupEventListeners() {

    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------

    const searchInput =
        document.getElementById(
            "productSearch"
        );

    const clearSearchBtn =
        document.getElementById(
            "clearSearch"
        );

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {

                if (clearSearchBtn) {

                    clearSearchBtn.classList.toggle(
                        "hidden",
                        searchInput.value.length === 0
                    );
                }

                renderProducts();
            }
        );
    }

    // --------------------------------------------------------
    // CLEAR SEARCH
    // --------------------------------------------------------

    if (clearSearchBtn) {

        clearSearchBtn.addEventListener(
            "click",
            () => {

                if (searchInput) {
                    searchInput.value = "";
                }

                clearSearchBtn.classList.add(
                    "hidden"
                );

                renderProducts();
            }
        );
    }

    // --------------------------------------------------------
    // CLEAR CART
    // --------------------------------------------------------

    const clearCartBtn =
        document.getElementById(
            "clearCart"
        );

    if (clearCartBtn) {

        clearCartBtn.addEventListener(
            "click",
            clearCart
        );
    }

    // --------------------------------------------------------
    // CHECKOUT
    // --------------------------------------------------------

    const completeSaleBtn =
        document.getElementById(
            "completeSale"
        );

    if (completeSaleBtn) {

        completeSaleBtn.addEventListener(
            "click",
            processCheckout
        );
    }

    // --------------------------------------------------------
    // PAYMENT METHODS
    // --------------------------------------------------------

    const paymentButtons =
        document.querySelectorAll(
            ".payment-btn"
        );

    paymentButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                activePaymentMethod =
                    button.getAttribute(
                        "data-payment"
                    );

                paymentButtons.forEach(
                    paymentButton => {

                        const isSelected =
                            paymentButton.getAttribute(
                                "data-payment"
                            ) ===
                            activePaymentMethod;

                        if (isSelected) {

                            paymentButton.className =
                                "payment-btn p-2.5 rounded-xl " +
                                "border border-green-600 " +
                                "bg-green-50 dark:bg-green-900/20 " +
                                "text-green-700 dark:text-green-400 " +
                                "font-semibold text-xs " +
                                "flex flex-col items-center gap-1";

                        } else {

                            paymentButton.className =
                                "payment-btn p-2.5 rounded-xl " +
                                "border border-slate-200 " +
                                "dark:border-slate-800 " +
                                "text-slate-600 dark:text-slate-400 " +
                                "font-medium text-xs " +
                                "flex flex-col items-center gap-1";
                        }
                    }
                );
            }
        );
    });
}

// ============================================================
// UTILITIES
// ============================================================

function formatCurrency(amount) {

    const value =
        Number(amount) || 0;

    return (
        `KSh ${value.toLocaleString("en-KE")}`
    );
}

// ============================================================
// CLOCK
// ============================================================

function initializeClock() {

    const dateEl =
        document.getElementById(
            "currentDate"
        );

    const timeEl =
        document.getElementById(
            "currentTime"
        );

    function update() {

        const now =
            new Date();

        if (dateEl) {

            dateEl.textContent =
                now.toLocaleDateString(
                    "en-KE",
                    {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                    }
                );
        }

        if (timeEl) {

            timeEl.textContent =
                now.toLocaleTimeString(
                    [],
                    {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    }
                );
        }
    }

    update();

    setInterval(
        update,
        1000
    );
}

// ============================================================
// THEME
// ============================================================

function initializeTheme() {

    const button =
        document.getElementById(
            "themeToggle"
        );

    const icon =
        document.getElementById(
            "themeIcon"
        );

    if (!button) return;

    const storedTheme =
        localStorage.getItem(
            "theme"
        );

    if (
        storedTheme === "dark" ||
        (
            !storedTheme &&
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
        )
    ) {

        document.documentElement
            .classList.add("dark");

        if (icon) {

            icon.setAttribute(
                "data-lucide",
                "sun"
            );
        }

    } else {

        document.documentElement
            .classList.remove("dark");

        if (icon) {

            icon.setAttribute(
                "data-lucide",
                "moon"
            );
        }
    }

    button.addEventListener(
        "click",
        () => {

            const isDark =
                document.documentElement
                    .classList.toggle(
                        "dark"
                    );

            localStorage.setItem(
                "theme",
                isDark
                    ? "dark"
                    : "light"
            );

            if (icon) {

                icon.setAttribute(
                    "data-lucide",
                    isDark
                        ? "sun"
                        : "moon"
                );
            }

            refreshIcons();
        }
    );
}

// ============================================================
// LUCIDE ICONS
// ============================================================

function refreshIcons() {

    if (window.lucide) {

        window.lucide.createIcons();
    }
}

// ============================================================
// MANAGER AUTHORIZATION
// ============================================================

const API_BASE_URL = "http://127.0.0.1:5000";

let managerAuthorizationCallback = null;


// ============================================================
// OPEN AUTHORIZATION MODAL
// ============================================================

function openManagerAuthorization(onApproved = null) {

    const modal =
        document.getElementById(
            "managerAuthorizationModal"
        );

    const usernameInput =
        document.getElementById(
            "authorizationUsername"
        );

    const passwordInput =
        document.getElementById(
            "authorizationPassword"
        );

    const errorElement =
        document.getElementById(
            "authorizationError"
        );


    if (!modal) {
        console.error(
            "Manager authorization modal not found."
        );
        return;
    }


    managerAuthorizationCallback =
        onApproved;


    // Clear previous values
    if (usernameInput) {
        usernameInput.value = "";
    }

    if (passwordInput) {
        passwordInput.value = "";
    }

    if (errorElement) {
        errorElement.textContent = "";
        errorElement.classList.add("hidden");
    }


    // Show modal
    modal.classList.remove("hidden");
    modal.classList.add("flex");


    // Focus username
    setTimeout(() => {

        if (usernameInput) {
            usernameInput.focus();
        }

    }, 100);


    // Refresh Lucide icons
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}


// ============================================================
// CLOSE AUTHORIZATION MODAL
// ============================================================

function closeManagerAuthorization() {

    const modal =
        document.getElementById(
            "managerAuthorizationModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.add("hidden");
    modal.classList.remove("flex");


    managerAuthorizationCallback = null;
}


// ============================================================
// SHOW AUTHORIZATION ERROR
// ============================================================

function showAuthorizationError(message) {

    const errorElement =
        document.getElementById(
            "authorizationError"
        );


    if (!errorElement) {
        return;
    }


    errorElement.textContent = message;

    errorElement.classList.remove(
        "hidden"
    );
}


// ============================================================
// AUTHORIZE MANAGER / ADMIN
// ============================================================

async function authorizeManager() {

    const usernameInput =
        document.getElementById(
            "authorizationUsername"
        );

    const passwordInput =
        document.getElementById(
            "authorizationPassword"
        );

    const authorizeButton =
        document.getElementById(
            "authorizeManagerButton"
        );


    if (!usernameInput || !passwordInput) {
        return;
    }


    const username =
        usernameInput.value.trim();

    const password =
        passwordInput.value;


    // --------------------------------------------------------
    // Validate fields
    // --------------------------------------------------------

    if (!username || !password) {

        showAuthorizationError(
            "Please enter the manager or administrator credentials."
        );

        return;
    }


    // --------------------------------------------------------
    // Disable button while checking
    // --------------------------------------------------------

    if (authorizeButton) {

        authorizeButton.disabled = true;

        authorizeButton.innerHTML = `
            <span class="animate-spin">⟳</span>
            <span>Checking...</span>
        `;
    }


    try {

        // ----------------------------------------------------
        // Send authorization request to backend
        // ----------------------------------------------------

        const response = await fetch(
            `${API_BASE_URL}/api/authorize`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    username: username,
                    password: password
                })
            }
        );


        const result =
            await response.json();


        // ----------------------------------------------------
        // Authorization rejected
        // ----------------------------------------------------

        if (
            !response.ok ||
            result.status !== "success"
        ) {

            showAuthorizationError(
                result.message ||
                "Authorization failed."
            );

            return;
        }


        // ----------------------------------------------------
        // SAVE CALLBACK BEFORE CLOSING MODAL
        // ----------------------------------------------------

        const approvedCallback =
            managerAuthorizationCallback;


        const authorizedBy =
            result.authorized_by;


        // ----------------------------------------------------
        // Close authorization modal
        // ----------------------------------------------------

        closeManagerAuthorization();


        // ----------------------------------------------------
        // Log successful authorization
        // ----------------------------------------------------

        console.log(
            `Authorization approved by ${authorizedBy.full_name} (${authorizedBy.role})`
        );


        // ----------------------------------------------------
        // Execute approved action
        // ----------------------------------------------------

        if (
            typeof approvedCallback ===
            "function"
        ) {

            approvedCallback(
                authorizedBy
            );
        }


    } catch (error) {

        console.error(
            "Authorization request failed:",
            error
        );


        showAuthorizationError(
            "Unable to contact the POS server. Please try again."
        );


    } finally {

        // ----------------------------------------------------
        // Restore button
        // ----------------------------------------------------

        if (authorizeButton) {

            authorizeButton.disabled = false;

            authorizeButton.innerHTML = `
                <i data-lucide="shield-check"
                   class="w-5 h-5"></i>

                <span>Authorize</span>
            `;


            if (typeof lucide !== "undefined") {
                lucide.createIcons();
            }
        }
    }
}

// ============================================================
// AUTHORIZATION EVENT LISTENERS
// ============================================================

function initializeManagerAuthorization() {

    const form =
        document.getElementById(
            "managerAuthorizationForm"
        );

    const closeButton =
        document.getElementById(
            "closeManagerAuthorization"
        );

    const cancelButton =
        document.getElementById(
            "cancelManagerAuthorization"
        );


    // --------------------------------------------------------
    // Form submission
    // --------------------------------------------------------

    if (form) {

        form.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                await authorizeManager();

            }
        );
    }


    // --------------------------------------------------------
    // Close button
    // --------------------------------------------------------

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeManagerAuthorization
        );
    }


    // --------------------------------------------------------
    // Cancel button
    // --------------------------------------------------------

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeManagerAuthorization
        );
    }
}

document.addEventListener("keydown", (event) => {

    if (event.ctrlKey && event.shiftKey && event.key === "A") {

        openManagerAuthorization((authorizedBy) => {

            console.log(
                "TEST APPROVED BY:",
                authorizedBy
            );

        });

    }

});