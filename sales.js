// ============================================================
// SimplePOS
// Sales Terminal Controller
// ============================================================

let currentCart = [];
let activeCategory = "All";
let activePaymentMethod = "Cash";

document.addEventListener("DOMContentLoaded", () => {
    initializeSalesTerminal();
});

// ============================================================
// INITIALIZATION
// ============================================================

function initializeSalesTerminal() {
    initializeClock();
    initializeTheme();
    setupEventListeners();
    loadCategories();
    renderProducts();
    renderCart();
}

// ============================================================
// DATA ACCESS HELPERS
// ============================================================

function getProducts() {
    try {
        const stored = localStorage.getItem("products");
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("SimplePOS: Failed to parse products from localStorage.", error);
        return [];
    }
}

function getSalesHistory() {
    try {
        const stored = localStorage.getItem("salesHistory");
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("SimplePOS: Failed to parse sales history.", error);
        return [];
    }
}

function saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
}

function saveSalesHistory(history) {
    localStorage.setItem("salesHistory", JSON.stringify(history));
}

// ============================================================
// CATEGORY NAVIGATION
// ============================================================

function loadCategories() {
    const container = document.getElementById("categoryContainer");
    if (!container) return;

    const products = getProducts();
    const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];

    container.innerHTML = categories.map(cat => {
        const isActive = cat === activeCategory;
        return `
            <button
                type="button"
                data-category="${cat}"
                class="category-btn px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    isActive 
                        ? "bg-green-600 text-white shadow-sm" 
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }"
            >
                ${cat}
            </button>
        `;
    }).join("");

    // Attach click handlers
    container.querySelectorAll(".category-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            activeCategory = btn.getAttribute("data-category");
            loadCategories();
            renderProducts();
        });
    });
}

// ============================================================
// PRODUCT GRID RENDERING
// ============================================================

function renderProducts() {
    const grid = document.getElementById("productGrid");
    const emptyState = document.getElementById("noProductsState");
    const searchInput = document.getElementById("productSearch");
    
    if (!grid) return;

    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const products = getProducts();

    const filtered = products.filter(product => {
        const matchesCategory = activeCategory === "All" || product.category === activeCategory;
        const matchesSearch = !query || 
            (product.name && product.name.toLowerCase().includes(query)) ||
            (product.category && product.category.toLowerCase().includes(query)) ||
            (product.barcode && product.barcode.toLowerCase().includes(query));

        return matchesCategory && matchesSearch;
    });

    grid.innerHTML = "";

    if (filtered.length === 0) {
        if (emptyState) emptyState.classList.remove("hidden");
        refreshIcons();
        return;
    }

    if (emptyState) emptyState.classList.add("hidden");

    filtered.forEach(product => {
        const stock = Number(product.stock) || 0;
        const isOutOfStock = stock <= 0;
        const price = Number(product.price) || 0;

        const card = document.createElement("div");
        card.className = `product-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-card relative overflow-hidden ${
            isOutOfStock ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-green-500/50"
        }`;

        card.innerHTML = `
            <div>
                <div class="flex items-start justify-between gap-2 mb-2">
                    <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md truncate max-w-[100px]">
                        ${product.category || "General"}
                    </span>
                    <span class="text-xs font-extrabold ${isOutOfStock ? "text-red-500" : "text-slate-500 dark:text-slate-400"}">
                        ${isOutOfStock ? "Out of Stock" : `${stock} left`}
                    </span>
                </div>
                <h4 class="font-heading font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-2 mb-1">
                    ${product.name}
                </h4>
            </div>

            <div class="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60">
                <span class="font-heading font-extrabold text-sm text-green-600 dark:text-green-400">
                    ${formatCurrency(price)}
                </span>
                <button
                    type="button"
                    ${isOutOfStock ? "disabled" : ""}
                    class="add-to-cart w-8 h-8 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-white flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <i data-lucide="plus" class="w-4 h-4"></i>
                </button>
            </div>
        `;

        if (!isOutOfStock) {
            card.addEventListener("click", () => addToCart(product));
        }

        grid.appendChild(card);
    });

    refreshIcons();
}

// ============================================================
// CART LOGIC
// ============================================================

function addToCart(product) {
    const stock = Number(product.stock) || 0;
    const existingIndex = currentCart.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
        if (currentCart[existingIndex].quantity + 1 > stock) {
            alert(`Cannot add more ${product.name}. Only ${stock} items in stock.`);
            return;
        }
        currentCart[existingIndex].quantity += 1;
    } else {
        if (stock < 1) {
            alert(`${product.name} is out of stock.`);
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

function updateQuantity(id, change) {
    const item = currentCart.find(i => i.id === id);
    if (!item) return;

    const newQty = item.quantity + change;

    if (newQty <= 0) {
        removeFromCart(id);
    } else if (newQty > item.maxStock) {
        alert(`Maximum available stock (${item.maxStock}) reached.`);
    } else {
        item.quantity = newQty;
        renderCart();
    }
}

function removeFromCart(id) {
    currentCart = currentCart.filter(item => item.id !== id);
    renderCart();
}

function clearCart() {
    currentCart = [];
    renderCart();
}

// ============================================================
// CART DOM RENDERING
// ============================================================

function renderCart() {
    const container = document.getElementById("cartItems");
    const emptyState = document.getElementById("emptyCartState");
    const completeBtn = document.getElementById("completeSale");
    
    const subtotalEl = document.getElementById("cartSubtotal");
    const taxEl = document.getElementById("cartTax");
    const totalEl = document.getElementById("cartTotal");

    if (!container) return;

    container.innerHTML = "";

    if (currentCart.length === 0) {
        if (emptyState) emptyState.classList.remove("hidden");
        if (completeBtn) completeBtn.disabled = true;
        
        if (subtotalEl) subtotalEl.textContent = formatCurrency(0);
        if (taxEl) taxEl.textContent = formatCurrency(0);
        if (totalEl) totalEl.textContent = formatCurrency(0);

        refreshIcons();
        return;
    }

    if (emptyState) emptyState.classList.add("hidden");
    if (completeBtn) completeBtn.disabled = false;

    let subtotal = 0;

    currentCart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const row = document.createElement("div");
        row.className = "flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800";

        row.innerHTML = `
            <div class="min-w-0 flex-1 pr-3">
                <h5 class="font-heading font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">${item.name}</h5>
                <p class="text-[11px] text-slate-400 font-mono mt-0.5">${formatCurrency(item.price)} each</p>
            </div>

            <div class="flex items-center gap-2">
                <div class="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                    <button type="button" onclick="updateQuantity('${item.id}', -1)" class="decrease w-6 h-6 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                        <i data-lucide="minus" class="w-3 h-3"></i>
                    </button>
                    <span class="w-6 text-center font-bold text-xs font-mono text-slate-800 dark:text-white">${item.quantity}</span>
                    <button type="button" onclick="updateQuantity('${item.id}', 1)" class="increase w-6 h-6 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                        <i data-lucide="plus" class="w-3 h-3"></i>
                    </button>
                </div>

                <span class="w-16 text-right font-mono font-bold text-xs text-slate-800 dark:text-white">${formatCurrency(itemTotal)}</span>

                <button type="button" onclick="removeFromCart('${item.id}')" class="text-slate-400 hover:text-red-500 p-1 transition">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;

        container.appendChild(row);
    });

    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (taxEl) taxEl.textContent = formatCurrency(tax);
    if (totalEl) totalEl.textContent = formatCurrency(total);

    refreshIcons();
}

// ============================================================
// COMPLETE CHECKOUT TRANSACTION
// ============================================================

function processCheckout() {
    if (currentCart.length === 0) return;

    const products = getProducts();
    const salesHistory = getSalesHistory();

    const subtotal = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    // Deduct Stock
    currentCart.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        if (product) {
            product.stock = Math.max(0, (Number(product.stock) || 0) - cartItem.quantity);
        }
    });

    // Create Sale Record
    const newSale = {
        id: "REC-" + Date.now().toString().slice(-6),
        receiptNumber: "REC-" + Math.floor(100000 + Math.random() * 900000),
        date: new Date().toISOString(),
        items: [...currentCart],
        subtotal: subtotal,
        tax: tax,
        total: total,
        paymentMethod: activePaymentMethod
    };

    salesHistory.push(newSale);

    // Save Data
    saveProducts(products);
    saveSalesHistory(salesHistory);

    alert(`Sale completed successfully via ${activePaymentMethod}!\nReceipt: ${newSale.receiptNumber}\nTotal: ${formatCurrency(total)}`);

    // Reset Session
    currentCart = [];
    renderCart();
    renderProducts();
}

// ============================================================
// EVENT LISTENERS & UI SETUP
// ============================================================

function setupEventListeners() {
    // Live Search Input
    const searchInput = document.getElementById("productSearch");
    const clearSearchBtn = document.getElementById("clearSearch");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            if (clearSearchBtn) {
                clearSearchBtn.classList.toggle("hidden", searchInput.value.length === 0);
            }
            renderProducts();
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener("click", () => {
            if (searchInput) {
                searchInput.value = "";
                clearSearchBtn.classList.add("hidden");
                renderProducts();
            }
        });
    }

    // Clear Cart Button
    const clearCartBtn = document.getElementById("clearCart");
    if (clearCartBtn) {
        clearCartBtn.addEventListener("click", clearCart);
    }

    // Checkout Button
    const completeSaleBtn = document.getElementById("completeSale");
    if (completeSaleBtn) {
        completeSaleBtn.addEventListener("click", processCheckout);
    }

    // Payment Selection Buttons
    const paymentButtons = document.querySelectorAll(".payment-btn");
    paymentButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            activePaymentMethod = btn.getAttribute("data-payment");

            paymentButtons.forEach(b => {
                const isSelected = b.getAttribute("data-payment") === activePaymentMethod;
                if (isSelected) {
                    b.className = "payment-btn p-2.5 rounded-xl border border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-semibold text-xs flex flex-col items-center gap-1";
                } else {
                    b.className = "payment-btn p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-medium text-xs flex flex-col items-center gap-1";
                }
            });
        });
    });
}

// ============================================================
// UTILITIES
// ============================================================

function formatCurrency(amount) {
    const value = Number(amount) || 0;
    return `KSh ${value.toLocaleString("en-KE")}`;
}

function initializeClock() {
    const dateEl = document.getElementById("currentDate");
    const timeEl = document.getElementById("currentTime");

    function update() {
        const now = new Date();
        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString("en-KE", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric"
            });
        }
        if (timeEl) {
            timeEl.textContent = now.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
        }
    }

    update();
    setInterval(update, 1000);
}

function initializeTheme() {
    const button = document.getElementById("themeToggle");
    const icon = document.getElementById("themeIcon");

    if (!button) return;

    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark" || (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.documentElement.classList.add("dark");
        if (icon) icon.setAttribute("data-lucide", "sun");
    } else {
        document.documentElement.classList.remove("dark");
        if (icon) icon.setAttribute("data-lucide", "moon");
    }

    button.addEventListener("click", () => {
        const isDark = document.documentElement.classList.toggle("dark");
        localStorage.setItem("theme", isDark ? "dark" : "light");
        if (icon) icon.setAttribute("data-lucide", isDark ? "sun" : "moon");
        refreshIcons();
    });
}

function refreshIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}