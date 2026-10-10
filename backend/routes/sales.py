from flask import Blueprint, jsonify, request

from database import database_connection
from models.user import get_user_by_username


sales_bp = Blueprint(
    "sales",
    __name__,
    url_prefix="/api/sales"
)


# ============================================================
# GET ALL SALES
# ============================================================

@sales_bp.route("", methods=["GET"])
def get_sales():

    try:

        with database_connection() as connection:

            sales = connection.execute("""
                SELECT
                    ID,
                    RECEIPT_NUMBER,
                    SALE_DATE,
                    SUBTOTAL,
                    TAX,
                    TOTAL,
                    PAYMENT_METHOD,
                    STATUS,
                    VOIDED_AT,
                    VOIDED_BY,
                    VOID_REASON
                FROM SALES
                ORDER BY ID DESC
            """).fetchall()

            sales_data = []

            for sale in sales:

                items = connection.execute("""
                    SELECT
                        SI.ID,
                        SI.PRODUCT_ID,
                        SI.PRODUCT_NAME,
                        P.CATEGORY,
                        SI.QUANTITY,
                        SI.UNIT_PRICE,
                        SI.TOTAL
                    FROM SALE_ITEMS SI
                    LEFT JOIN PRODUCTS P
                        ON SI.PRODUCT_ID = P.ID
                    WHERE SI.SALE_ID = ?
                    ORDER BY SI.ID ASC
                """, (sale["ID"],)).fetchall()

                sale_data = {
                    "id": sale["ID"],
                    "receiptNumber": sale["RECEIPT_NUMBER"],
                    "date": sale["SALE_DATE"],
                    "subtotal": float(sale["SUBTOTAL"]),
                    "tax": float(sale["TAX"]),
                    "total": float(sale["TOTAL"]),
                    "paymentMethod": sale["PAYMENT_METHOD"],

                    # Void information
                    "status": sale["STATUS"],
                    "voidedAt": sale["VOIDED_AT"],
                    "voidedBy": sale["VOIDED_BY"],
                    "voidReason": sale["VOID_REASON"],

                    "items": [
                        {
                            "id": item["ID"],
                            "productId": item["PRODUCT_ID"],
                            "name": (
                                item["PRODUCT_NAME"]
                                or "Unknown Product"
                            ),
                            "category": (
                                item["CATEGORY"]
                                or "Unknown"
                            ),
                            "quantity": item["QUANTITY"],
                            "unitPrice": float(
                                item["UNIT_PRICE"]
                            ),
                            "total": float(
                                item["TOTAL"]
                            )
                        }
                        for item in items
                    ]
                }

                sales_data.append(sale_data)

        return jsonify({
            "status": "success",
            "sales": sales_data
        })

    except Exception as error:

        print(
            f"GET SALES ERROR: {error}"
        )

        return jsonify({
            "status": "error",
            "message": "Unable to load sales history."
        }), 500


# ============================================================
# GET SINGLE SALE
# ============================================================

@sales_bp.route("/<int:sale_id>", methods=["GET"])
def get_sale(sale_id):

    try:

        with database_connection() as connection:

            sale = connection.execute("""
                SELECT
                    ID,
                    RECEIPT_NUMBER,
                    SALE_DATE,
                    SUBTOTAL,
                    TAX,
                    TOTAL,
                    PAYMENT_METHOD,
                    STATUS,
                    VOIDED_AT,
                    VOIDED_BY,
                    VOID_REASON
                FROM SALES
                WHERE ID = ?
            """, (sale_id,)).fetchone()

            if not sale:

                return jsonify({
                    "status": "error",
                    "message": "Sale not found."
                }), 404

            items = connection.execute("""
                SELECT
                    SI.ID,
                    SI.PRODUCT_ID,
                    SI.PRODUCT_NAME,
                    P.CATEGORY,
                    SI.QUANTITY,
                    SI.UNIT_PRICE,
                    SI.TOTAL
                FROM SALE_ITEMS SI
                LEFT JOIN PRODUCTS P
                    ON SI.PRODUCT_ID = P.ID
                WHERE SI.SALE_ID = ?
                ORDER BY SI.ID ASC
            """, (sale_id,)).fetchall()

        sale_data = {
            "id": sale["ID"],
            "receiptNumber": sale["RECEIPT_NUMBER"],
            "date": sale["SALE_DATE"],
            "subtotal": float(sale["SUBTOTAL"]),
            "tax": float(sale["TAX"]),
            "total": float(sale["TOTAL"]),
            "paymentMethod": sale["PAYMENT_METHOD"],

            # Void information
            "status": sale["STATUS"],
            "voidedAt": sale["VOIDED_AT"],
            "voidedBy": sale["VOIDED_BY"],
            "voidReason": sale["VOID_REASON"],

            "items": [
                {
                    "id": item["ID"],
                    "productId": item["PRODUCT_ID"],
                    "name": (
                        item["PRODUCT_NAME"]
                        or "Unknown Product"
                    ),
                    "category": (
                        item["CATEGORY"]
                        or "Unknown"
                    ),
                    "quantity": item["QUANTITY"],
                    "unitPrice": float(
                        item["UNIT_PRICE"]
                    ),
                    "total": float(
                        item["TOTAL"]
                    )
                }
                for item in items
            ]
        }

        return jsonify({
            "status": "success",
            "sale": sale_data
        })

    except Exception as error:

        print(
            f"GET SALE ERROR: {error}"
        )

        return jsonify({
            "status": "error",
            "message": "Unable to load sale."
        }), 500


# ============================================================
# CREATE SALE
# ============================================================

@sales_bp.route("", methods=["POST"])
def create_sale():

    try:

        data = request.get_json()

        if not data:

            return jsonify({
                "status": "error",
                "message": "No sale data was provided."
            }), 400

        payment_method = data.get("paymentMethod")
        items = data.get("items")

        allowed_payment_methods = [
            "Cash",
            "M-Pesa",
            "Card"
        ]

        if payment_method not in allowed_payment_methods:

            return jsonify({
                "status": "error",
                "message": "Invalid payment method."
            }), 400

        if (
            not isinstance(items, list)
            or len(items) == 0
        ):

            return jsonify({
                "status": "error",
                "message": (
                    "The sale must contain "
                    "at least one item."
                )
            }), 400

        subtotal = 0
        sale_items = []

        with database_connection() as connection:

            # ====================================================
            # VALIDATE SALE ITEMS
            # ====================================================

            for item in items:

                product_id = item.get("productId")
                quantity = item.get("quantity")

                if (
                    not product_id
                    or not isinstance(quantity, int)
                ):

                    return jsonify({
                        "status": "error",
                        "message": (
                            "Invalid product or quantity."
                        )
                    }), 400

                if quantity <= 0:

                    return jsonify({
                        "status": "error",
                        "message": (
                            "Quantity must be "
                            "greater than zero."
                        )
                    }), 400

                product = connection.execute("""
                    SELECT
                        ID,
                        NAME,
                        PRICE,
                        STOCK
                    FROM PRODUCTS
                    WHERE ID = ?
                """, (product_id,)).fetchone()

                if product is None:

                    return jsonify({
                        "status": "error",
                        "message": (
                            f"Product with ID "
                            f"{product_id} was not found."
                        )
                    }), 404

                if product["STOCK"] < quantity:

                    return jsonify({
                        "status": "error",
                        "message": (
                            f"Not enough stock for "
                            f"{product['NAME']}. "
                            f"Available: "
                            f"{product['STOCK']}."
                        )
                    }), 400

                unit_price = float(
                    product["PRICE"]
                )

                item_total = (
                    unit_price * quantity
                )

                subtotal += item_total

                # =================================================
                # SAVE PRODUCT SNAPSHOT
                # =================================================

                sale_items.append({
                    "product_id":
                        product["ID"],

                    "product_name":
                        product["NAME"],

                    "quantity":
                        quantity,

                    "unit_price":
                        unit_price,

                    "total":
                        item_total
                })

            # ====================================================
            # CALCULATE TOTALS
            # ====================================================

            tax_rate = 0.16

            tax = subtotal * tax_rate

            total = subtotal + tax

            # ====================================================
            # GENERATE RECEIPT NUMBER
            # ====================================================

            last_sale = connection.execute("""
                SELECT
                    ID
                FROM SALES
                ORDER BY ID DESC
                LIMIT 1
            """).fetchone()

            if last_sale:

                next_number = (
                    last_sale["ID"] + 1
                )

            else:

                next_number = 1

            receipt_number = (
                f"MWZ-{next_number:06d}"
            )

            # ====================================================
            # CREATE SALE
            # ====================================================

            cursor = connection.execute("""
                INSERT INTO SALES (
                    RECEIPT_NUMBER,
                    SUBTOTAL,
                    TAX,
                    TOTAL,
                    PAYMENT_METHOD,
                    STATUS
                )
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                receipt_number,
                subtotal,
                tax,
                total,
                payment_method,
                "COMPLETED"
            ))

            sale_id = cursor.lastrowid

            # ====================================================
            # GET ACTUAL SALE DATE
            # ====================================================

            created_sale = connection.execute("""
                SELECT
                    ID,
                    RECEIPT_NUMBER,
                    SALE_DATE,
                    SUBTOTAL,
                    TAX,
                    TOTAL,
                    PAYMENT_METHOD,
                    STATUS,
                    VOIDED_AT,
                    VOIDED_BY,
                    VOID_REASON
                FROM SALES
                WHERE ID = ?
            """, (sale_id,)).fetchone()

            # ====================================================
            # CREATE SALE ITEMS
            # ====================================================

            for item in sale_items:

                connection.execute("""
                    INSERT INTO SALE_ITEMS (
                        SALE_ID,
                        PRODUCT_ID,
                        PRODUCT_NAME,
                        QUANTITY,
                        UNIT_PRICE,
                        TOTAL
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    sale_id,
                    item["product_id"],
                    item["product_name"],
                    item["quantity"],
                    item["unit_price"],
                    item["total"]
                ))

                # =================================================
                # REDUCE PRODUCT STOCK
                # =================================================

                connection.execute("""
                    UPDATE PRODUCTS
                    SET
                        STOCK = STOCK - ?,
                        UPDATED_AT = CURRENT_TIMESTAMP
                    WHERE ID = ?
                """, (
                    item["quantity"],
                    item["product_id"]
                ))

        # ========================================================
        # SUCCESS RESPONSE
        # ========================================================

        return jsonify({

            "status":
                "success",

            "message":
                "Sale completed successfully.",

            "sale": {

                "id":
                    created_sale["ID"],

                "receiptNumber":
                    created_sale["RECEIPT_NUMBER"],

                "date":
                    created_sale["SALE_DATE"],

                "subtotal":
                    float(
                        created_sale["SUBTOTAL"]
                    ),

                "tax":
                    float(
                        created_sale["TAX"]
                    ),

                "total":
                    float(
                        created_sale["TOTAL"]
                    ),

                "paymentMethod":
                    created_sale["PAYMENT_METHOD"],

                "status":
                    created_sale["STATUS"],

                "voidedAt":
                    created_sale["VOIDED_AT"],

                "voidedBy":
                    created_sale["VOIDED_BY"],

                "voidReason":
                    created_sale["VOID_REASON"],

                "items": [

                    {
                        "productId":
                            item["product_id"],

                        "name":
                            item["product_name"],

                        "quantity":
                            item["quantity"],

                        "unitPrice":
                            item["unit_price"],

                        "total":
                            item["total"]
                    }

                    for item in sale_items

                ]

            }

        }), 201

    except Exception as error:

        print(
            f"SALE ERROR: {error}"
        )

        return jsonify({

            "status":
                "error",

            "message":
                "An unexpected error occurred "
                "while processing the sale."

        }), 500


# ============================================================
# VOID / CANCEL COMPLETED SALE
# ============================================================

@sales_bp.route("/<int:sale_id>/void", methods=["POST"])
def void_sale(sale_id):

    try:

        data = request.get_json()

        if not data:

            return jsonify({
                "status": "error",
                "message": "No authorization data was provided."
            }), 400

        username = data.get("username")
        password = data.get("password")
        reason = data.get("reason")

        # ========================================================
        # VALIDATE AUTHORIZATION INPUT
        # ========================================================

        if not username or not password:

            return jsonify({
                "status": "error",
                "message": (
                    "Manager/Admin username and password "
                    "are required."
                )
            }), 400

        if not reason or not str(reason).strip():

            return jsonify({
                "status": "error",
                "message": (
                    "A reason is required when voiding a sale."
                )
            }), 400

        reason = str(reason).strip()

        # Keep the reason reasonably sized.
        if len(reason) > 500:

            return jsonify({
                "status": "error",
                "message": (
                    "Void reason cannot exceed 500 characters."
                )
            }), 400

        # ========================================================
        # VERIFY MANAGER / ADMIN CREDENTIALS
        # ========================================================

        user = get_user_by_username(
            str(username).strip()
        )

        if user is None:

            return jsonify({
                "status": "error",
                "message": "Invalid authorization credentials."
            }), 401

        # --------------------------------------------------------
        # Current development authentication uses plaintext
        # passwords.
        #
        # Password hashing can be introduced later without
        # changing the void workflow.
        # --------------------------------------------------------

        if user["PASSWORD"] != password:

            return jsonify({
                "status": "error",
                "message": "Invalid authorization credentials."
            }), 401

        # ========================================================
        # VERIFY ROLE
        # ========================================================

        role = (
            user["ROLE"]
            or ""
        ).upper()

        if role not in ["MANAGER", "ADMIN"]:

            return jsonify({
                "status": "error",
                "message": (
                    "You are not authorized to void sales. "
                    "Manager or Admin authorization is required."
                )
            }), 403

        # ========================================================
        # PERFORM VOID TRANSACTION
        # ========================================================

        with database_connection() as connection:

            # ----------------------------------------------------
            # GET SALE
            # ----------------------------------------------------

            sale = connection.execute("""
                SELECT
                    ID,
                    RECEIPT_NUMBER,
                    SALE_DATE,
                    SUBTOTAL,
                    TAX,
                    TOTAL,
                    PAYMENT_METHOD,
                    STATUS,
                    VOIDED_AT,
                    VOIDED_BY,
                    VOID_REASON
                FROM SALES
                WHERE ID = ?
            """, (sale_id,)).fetchone()

            if sale is None:

                return jsonify({
                    "status": "error",
                    "message": "Sale not found."
                }), 404

            # ----------------------------------------------------
            # PREVENT DOUBLE VOID
            # ----------------------------------------------------

            if sale["STATUS"] == "VOIDED":

                return jsonify({
                    "status": "error",
                    "message": (
                        "This sale has already been voided."
                    )
                }), 409

            # ----------------------------------------------------
            # GET SALE ITEMS
            # ----------------------------------------------------

            items = connection.execute("""
                SELECT
                    ID,
                    PRODUCT_ID,
                    PRODUCT_NAME,
                    QUANTITY,
                    UNIT_PRICE,
                    TOTAL
                FROM SALE_ITEMS
                WHERE SALE_ID = ?
                ORDER BY ID ASC
            """, (sale_id,)).fetchall()

            if not items:

                return jsonify({
                    "status": "error",
                    "message": (
                        "This sale has no recorded items "
                        "and cannot be voided."
                    )
                }), 400

            # ====================================================
            # RESTORE INVENTORY
            # ====================================================

            for item in items:

                product = connection.execute("""
                    SELECT
                        ID,
                        NAME,
                        STOCK
                    FROM PRODUCTS
                    WHERE ID = ?
                """, (item["PRODUCT_ID"],)).fetchone()

                if product is None:

                    raise Exception(
                        f"Product with ID "
                        f"{item['PRODUCT_ID']} "
                        f"no longer exists."
                    )

                connection.execute("""
                    UPDATE PRODUCTS
                    SET
                        STOCK = STOCK + ?,
                        UPDATED_AT = CURRENT_TIMESTAMP
                    WHERE ID = ?
                """, (
                    item["QUANTITY"],
                    item["PRODUCT_ID"]
                ))

            # ====================================================
            # MARK SALE AS VOIDED
            # ====================================================

            connection.execute("""
                UPDATE SALES
                SET
                    STATUS = 'VOIDED',
                    VOIDED_AT = CURRENT_TIMESTAMP,
                    VOIDED_BY = ?,
                    VOID_REASON = ?
                WHERE ID = ?
                  AND STATUS != 'VOIDED'
            """, (
                user["USERNAME"],
                reason,
                sale_id
            ))

            # ====================================================
            # VERIFY THE UPDATE ACTUALLY HAPPENED
            # ====================================================

            updated_sale = connection.execute("""
                SELECT
                    ID,
                    RECEIPT_NUMBER,
                    SALE_DATE,
                    SUBTOTAL,
                    TAX,
                    TOTAL,
                    PAYMENT_METHOD,
                    STATUS,
                    VOIDED_AT,
                    VOIDED_BY,
                    VOID_REASON
                FROM SALES
                WHERE ID = ?
            """, (sale_id,)).fetchone()

            if updated_sale is None:

                raise Exception(
                    "Sale could not be updated after "
                    "inventory restoration."
                )

            if updated_sale["STATUS"] != "VOIDED":

                raise Exception(
                    "Sale status could not be changed to VOIDED."
                )

        # ========================================================
        # SUCCESS RESPONSE
        # ========================================================

        return jsonify({

            "status":
                "success",

            "message":
                "Sale voided successfully.",

            "sale": {

                "id":
                    updated_sale["ID"],

                "receiptNumber":
                    updated_sale["RECEIPT_NUMBER"],

                "date":
                    updated_sale["SALE_DATE"],

                "subtotal":
                    float(
                        updated_sale["SUBTOTAL"]
                    ),

                "tax":
                    float(
                        updated_sale["TAX"]
                    ),

                "total":
                    float(
                        updated_sale["TOTAL"]
                    ),

                "paymentMethod":
                    updated_sale["PAYMENT_METHOD"],

                "status":
                    updated_sale["STATUS"],

                "voidedAt":
                    updated_sale["VOIDED_AT"],

                "voidedBy":
                    updated_sale["VOIDED_BY"],

                "voidReason":
                    updated_sale["VOID_REASON"],

                "items": [

                    {
                        "productId":
                            item["PRODUCT_ID"],

                        "name":
                            item["PRODUCT_NAME"],

                        "quantity":
                            item["QUANTITY"],

                        "unitPrice":
                            float(
                                item["UNIT_PRICE"]
                            ),

                        "total":
                            float(
                                item["TOTAL"]
                            )
                    }

                    for item in items

                ]

            },

            "authorizedBy": {

                "username":
                    user["USERNAME"],

                "full_name":
                    user["FULL_NAME"],

                "role":
                    user["ROLE"]

            }

        }), 200

    except Exception as error:

        print(
            f"VOID SALE ERROR: {error}"
        )

        return jsonify({

            "status":
                "error",

            "message":
                "An unexpected error occurred "
                "while voiding the sale."

        }), 500