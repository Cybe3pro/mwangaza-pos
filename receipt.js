// ==========================================
// SimplePOS
// Digital Receipt Controller
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    initializeReceipt();

});


function initializeReceipt() {

    const receiptNumber =
        document.getElementById("receiptNumber");

    const receiptDate =
        document.getElementById("receiptDate");

    const receiptItems =
        document.getElementById("receiptItems");

    const receiptSubtotal =
        document.getElementById("receiptSubtotal");

    const receiptTotal =
        document.getElementById("receiptTotal");

    const paymentMethod =
        document.getElementById("paymentMethod");

    const paymentIcon =
        document.getElementById("paymentIcon");


    // ==========================================
    // GET SALE DATA
    // ==========================================

    const saleData =
        JSON.parse(
            localStorage.getItem("lastSale")
        );


    // If there is no sale data

    if (!saleData) {

        receiptItems.innerHTML = `
            <div class="text-center py-10">

                <p class="text-gray-500">
                    No receipt data found.
                </p>

                <a
                    href="sales.html"
                    class="inline-block mt-4
                           text-green-600
                           font-medium
                           hover:underline">

                    Return to Sales

                </a>

            </div>
        `;

        return;

    }


    // ==========================================
    // RECEIPT NUMBER
    // ==========================================

    receiptNumber.textContent =
        `#${saleData.receiptNumber}`;


    // ==========================================
    // DATE & TIME
    // ==========================================

    const saleDate =
        new Date(saleData.date);


    receiptDate.textContent =
        saleDate.toLocaleString(
            "en-KE",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );


    // ==========================================
    // PAYMENT METHOD
    // ==========================================

    paymentMethod.textContent =
        saleData.paymentMethod;


    if (saleData.paymentMethod === "M-Pesa") {

        paymentIcon.setAttribute(
            "data-lucide",
            "smartphone"
        );

    } else {

        paymentIcon.setAttribute(
            "data-lucide",
            "banknote"
        );

    }


    // ==========================================
    // RECEIPT ITEMS
    // ==========================================

    receiptItems.innerHTML = "";


    saleData.items.forEach(item => {

        const itemTotal =
            item.price * item.quantity;


        const itemElement =
            document.createElement("div");


        itemElement.className =
            "flex justify-between items-start gap-4";


        itemElement.innerHTML = `

            <div>

                <p class="font-medium">
                    ${item.name}
                </p>

                <p class="text-xs text-gray-500 mt-1">

                    ${item.quantity}
                    ×
                    KSh ${item.price.toLocaleString()}

                </p>

            </div>


            <p class="font-semibold whitespace-nowrap">

                KSh ${itemTotal.toLocaleString()}

            </p>

        `;


        receiptItems.appendChild(itemElement);

    });


    // ==========================================
    // TOTALS
    // ==========================================

    const subtotal =
        saleData.items.reduce(
            (sum, item) =>
                sum + item.price * item.quantity,
            0
        );


    receiptSubtotal.textContent =
        `KSh ${subtotal.toLocaleString()}`;


    receiptTotal.textContent =
        `KSh ${subtotal.toLocaleString()}`;


    // Re-render icons

    if (typeof lucide !== "undefined") {

        lucide.createIcons();

    }

}