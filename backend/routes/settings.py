from flask import Blueprint, jsonify, request, Response
from database import database_connection
import json
from datetime import datetime


# ============================================================
# SETTINGS BLUEPRINT
# ============================================================

settings_bp = Blueprint(
    "settings",
    __name__,
    url_prefix="/api/settings"
)


# ============================================================
# DEFAULT SETTINGS
# ============================================================

DEFAULT_SETTINGS = {
    "shopName": "Mwangaza Mini Mart",
    "shopPhone": "",
    "shopEmail": "",
    "shopLocation": "",
    "currency": "KSh",
    "defaultPayment": "Cash",
    "lowStockThreshold": 5,
    "receiptFooter": "Thank you for shopping with us!",
    "showPhoneOnReceipt": True,
    "showLocationOnReceipt": True
}


# ============================================================
# FORMAT DATABASE SETTINGS
# ============================================================

def format_settings(row):
    """
    Convert a SQLite SETTINGS row into the format
    expected by the frontend.
    """

    if row is None:
        return DEFAULT_SETTINGS.copy()

    return {
        "shopName": row["SHOP_NAME"],
        "shopPhone": row["SHOP_PHONE"] or "",
        "shopEmail": row["SHOP_EMAIL"] or "",
        "shopLocation": row["SHOP_LOCATION"] or "",
        "currency": row["CURRENCY"],
        "defaultPayment": row["DEFAULT_PAYMENT"],
        "lowStockThreshold": row["LOW_STOCK_THRESHOLD"],
        "receiptFooter": row["RECEIPT_FOOTER"] or "",
        "showPhoneOnReceipt": bool(row["SHOW_PHONE_ON_RECEIPT"]),
        "showLocationOnReceipt": bool(
            row["SHOW_LOCATION_ON_RECEIPT"]
        )
    }


# ============================================================
# GET SETTINGS
# ============================================================

@settings_bp.route("", methods=["GET"])
def get_settings():

    try:

        with database_connection() as connection:

            row = connection.execute("""
                SELECT
                    ID,
                    SHOP_NAME,
                    SHOP_PHONE,
                    SHOP_EMAIL,
                    SHOP_LOCATION,
                    CURRENCY,
                    DEFAULT_PAYMENT,
                    LOW_STOCK_THRESHOLD,
                    RECEIPT_FOOTER,
                    SHOW_PHONE_ON_RECEIPT,
                    SHOW_LOCATION_ON_RECEIPT,
                    UPDATED_AT
                FROM SETTINGS
                WHERE ID = 1
            """).fetchone()


            # Safety fallback
            if row is None:

                connection.execute("""
                    INSERT INTO SETTINGS (
                        ID,
                        SHOP_NAME,
                        SHOP_PHONE,
                        SHOP_EMAIL,
                        SHOP_LOCATION,
                        CURRENCY,
                        DEFAULT_PAYMENT,
                        LOW_STOCK_THRESHOLD,
                        RECEIPT_FOOTER,
                        SHOW_PHONE_ON_RECEIPT,
                        SHOW_LOCATION_ON_RECEIPT
                    )
                    VALUES (
                        1,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                """, (
                    DEFAULT_SETTINGS["shopName"],
                    DEFAULT_SETTINGS["shopPhone"],
                    DEFAULT_SETTINGS["shopEmail"],
                    DEFAULT_SETTINGS["shopLocation"],
                    DEFAULT_SETTINGS["currency"],
                    DEFAULT_SETTINGS["defaultPayment"],
                    DEFAULT_SETTINGS["lowStockThreshold"],
                    DEFAULT_SETTINGS["receiptFooter"],
                    int(DEFAULT_SETTINGS["showPhoneOnReceipt"]),
                    int(DEFAULT_SETTINGS["showLocationOnReceipt"])
                ))


                row = connection.execute("""
                    SELECT *
                    FROM SETTINGS
                    WHERE ID = 1
                """).fetchone()


            return jsonify({
                "status": "success",
                "settings": format_settings(row)
            })


    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


# ============================================================
# UPDATE SETTINGS
# ============================================================

@settings_bp.route("", methods=["PUT"])
def update_settings():

    data = request.get_json(silent=True)


    if not data:

        return jsonify({
            "status": "error",
            "message": "No settings data was provided."
        }), 400


    # --------------------------------------------------------
    # Read incoming values
    # --------------------------------------------------------

    shop_name = str(
        data.get("shopName", DEFAULT_SETTINGS["shopName"])
    ).strip()

    shop_phone = str(
        data.get("shopPhone", "")
    ).strip()

    shop_email = str(
        data.get("shopEmail", "")
    ).strip()

    shop_location = str(
        data.get("shopLocation", "")
    ).strip()

    currency = str(
        data.get("currency", DEFAULT_SETTINGS["currency"])
    ).strip()

    default_payment = str(
        data.get(
            "defaultPayment",
            DEFAULT_SETTINGS["defaultPayment"]
        )
    ).strip()

    receipt_footer = str(
        data.get("receiptFooter", "")
    ).strip()


    # --------------------------------------------------------
    # Validate required values
    # --------------------------------------------------------

    if not shop_name:

        return jsonify({
            "status": "error",
            "message": "Shop name cannot be empty."
        }), 400


    allowed_currencies = {
        "KSh",
        "USD",
        "EUR",
        "GBP"
    }


    if currency not in allowed_currencies:

        return jsonify({
            "status": "error",
            "message": "Invalid currency."
        }), 400


    allowed_payments = {
        "Cash",
        "M-Pesa"
    }


    if default_payment not in allowed_payments:

        return jsonify({
            "status": "error",
            "message": "Invalid default payment method."
        }), 400


    # --------------------------------------------------------
    # Validate low-stock threshold
    # --------------------------------------------------------

    try:

        low_stock_threshold = int(
            data.get(
                "lowStockThreshold",
                DEFAULT_SETTINGS["lowStockThreshold"]
            )
        )

    except (TypeError, ValueError):

        return jsonify({
            "status": "error",
            "message": "Low-stock threshold must be a number."
        }), 400


    if low_stock_threshold < 0:

        return jsonify({
            "status": "error",
            "message": "Low-stock threshold cannot be negative."
        }), 400


    # --------------------------------------------------------
    # Validate receipt settings
    # --------------------------------------------------------

    show_phone = bool(
        data.get(
            "showPhoneOnReceipt",
            DEFAULT_SETTINGS["showPhoneOnReceipt"]
        )
    )

    show_location = bool(
        data.get(
            "showLocationOnReceipt",
            DEFAULT_SETTINGS["showLocationOnReceipt"]
        )
    )


    # --------------------------------------------------------
    # Update database
    # --------------------------------------------------------

    try:

        with database_connection() as connection:

            existing = connection.execute("""
                SELECT ID
                FROM SETTINGS
                WHERE ID = 1
            """).fetchone()


            if existing is None:

                connection.execute("""
                    INSERT INTO SETTINGS (
                        ID,
                        SHOP_NAME,
                        SHOP_PHONE,
                        SHOP_EMAIL,
                        SHOP_LOCATION,
                        CURRENCY,
                        DEFAULT_PAYMENT,
                        LOW_STOCK_THRESHOLD,
                        RECEIPT_FOOTER,
                        SHOW_PHONE_ON_RECEIPT,
                        SHOW_LOCATION_ON_RECEIPT,
                        UPDATED_AT
                    )
                    VALUES (
                        1,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        CURRENT_TIMESTAMP
                    )
                """, (
                    shop_name,
                    shop_phone,
                    shop_email,
                    shop_location,
                    currency,
                    default_payment,
                    low_stock_threshold,
                    receipt_footer,
                    int(show_phone),
                    int(show_location)
                ))


            else:

                connection.execute("""
                    UPDATE SETTINGS
                    SET
                        SHOP_NAME = ?,
                        SHOP_PHONE = ?,
                        SHOP_EMAIL = ?,
                        SHOP_LOCATION = ?,
                        CURRENCY = ?,
                        DEFAULT_PAYMENT = ?,
                        LOW_STOCK_THRESHOLD = ?,
                        RECEIPT_FOOTER = ?,
                        SHOW_PHONE_ON_RECEIPT = ?,
                        SHOW_LOCATION_ON_RECEIPT = ?,
                        UPDATED_AT = CURRENT_TIMESTAMP
                    WHERE ID = 1
                """, (
                    shop_name,
                    shop_phone,
                    shop_email,
                    shop_location,
                    currency,
                    default_payment,
                    low_stock_threshold,
                    receipt_footer,
                    int(show_phone),
                    int(show_location)
                ))


            row = connection.execute("""
                SELECT *
                FROM SETTINGS
                WHERE ID = 1
            """).fetchone()


            return jsonify({
                "status": "success",
                "message": "Settings saved successfully.",
                "settings": format_settings(row)
            })


    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


# ============================================================
# BACKUP
# ============================================================

@settings_bp.route("/backup", methods=["GET"])
def backup_data():

    try:

        with database_connection() as connection:

            # ------------------------------------------------
            # SETTINGS
            # ------------------------------------------------

            settings_row = connection.execute("""
                SELECT *
                FROM SETTINGS
                WHERE ID = 1
            """).fetchone()


            # ------------------------------------------------
            # PRODUCTS
            # ------------------------------------------------

            products_rows = connection.execute("""
                SELECT *
                FROM PRODUCTS
                ORDER BY ID
            """).fetchall()


            # ------------------------------------------------
            # SALES
            # ------------------------------------------------

            sales_rows = connection.execute("""
                SELECT *
                FROM SALES
                ORDER BY ID
            """).fetchall()


            # ------------------------------------------------
            # SALE ITEMS
            # ------------------------------------------------

            sale_items_rows = connection.execute("""
                SELECT *
                FROM SALE_ITEMS
                ORDER BY ID
            """).fetchall()


            backup = {
                "backupVersion": 1,
                "application": "SimplePOS",
                "createdAt": datetime.now().isoformat(),
                "settings": dict(settings_row) if settings_row else None,
                "products": [
                    dict(row)
                    for row in products_rows
                ],
                "sales": [
                    dict(row)
                    for row in sales_rows
                ],
                "saleItems": [
                    dict(row)
                    for row in sale_items_rows
                ]
            }


            return Response(
                json.dumps(
                    backup,
                    indent=4,
                    default=str
                ),
                mimetype="application/json",
                headers={
                    "Content-Disposition":
                        "attachment; filename=mwangaza-pos-backup.json"
                }
            )


    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


# ============================================================
# RESTORE
# ============================================================

@settings_bp.route("/restore", methods=["POST"])
def restore_data():

    data = request.get_json(silent=True)


    if not data:

        return jsonify({
            "status": "error",
            "message": "No backup data was provided."
        }), 400


    products = data.get("products", [])
    sales = data.get("sales", [])
    sale_items = data.get("saleItems", [])
    settings = data.get("settings")


    if not isinstance(products, list):
        return jsonify({
            "status": "error",
            "message": "Invalid products backup data."
        }), 400


    if not isinstance(sales, list):
        return jsonify({
            "status": "error",
            "message": "Invalid sales backup data."
        }), 400


    if not isinstance(sale_items, list):
        return jsonify({
            "status": "error",
            "message": "Invalid sale items backup data."
        }), 400


    try:

        with database_connection() as connection:

            # ------------------------------------------------
            # Clear existing transactional data first
            # ------------------------------------------------

            connection.execute("""
                DELETE FROM SALE_ITEMS
            """)

            connection.execute("""
                DELETE FROM SALES
            """)

            connection.execute("""
                DELETE FROM PRODUCTS
            """)


            # ------------------------------------------------
            # Restore PRODUCTS
            # ------------------------------------------------

            for product in products:

                connection.execute("""
                    INSERT INTO PRODUCTS (
                        ID,
                        NAME,
                        CATEGORY,
                        PRICE,
                        STOCK,
                        LOW_STOCK_THRESHOLD,
                        CREATED_AT,
                        UPDATED_AT
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    product["ID"],
                    product["NAME"],
                    product["CATEGORY"],
                    product["PRICE"],
                    product["STOCK"],
                    product.get("LOW_STOCK_THRESHOLD", 5),
                    product.get("CREATED_AT"),
                    product.get("UPDATED_AT")
                ))


            # ------------------------------------------------
            # Restore SALES
            # ------------------------------------------------

            for sale in sales:

                connection.execute("""
                    INSERT INTO SALES (
                        ID,
                        RECEIPT_NUMBER,
                        SALE_DATE,
                        SUBTOTAL,
                        TAX,
                        TOTAL,
                        PAYMENT_METHOD
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    sale["ID"],
                    sale["RECEIPT_NUMBER"],
                    sale["SALE_DATE"],
                    sale["SUBTOTAL"],
                    sale["TAX"],
                    sale["TOTAL"],
                    sale["PAYMENT_METHOD"]
                ))


            # ------------------------------------------------
            # Restore SALE_ITEMS
            # ------------------------------------------------

            for item in sale_items:

                connection.execute("""
                    INSERT INTO SALE_ITEMS (
                        ID,
                        SALE_ID,
                        PRODUCT_ID,
                        QUANTITY,
                        UNIT_PRICE,
                        TOTAL,
                        PRODUCT_NAME
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    item["ID"],
                    item["SALE_ID"],
                    item["PRODUCT_ID"],
                    item["QUANTITY"],
                    item["UNIT_PRICE"],
                    item["TOTAL"],
                    item.get("PRODUCT_NAME")
                ))


            # ------------------------------------------------
            # Restore SETTINGS
            # ------------------------------------------------

            if settings:

                connection.execute("""
                    INSERT INTO SETTINGS (
                        ID,
                        SHOP_NAME,
                        SHOP_PHONE,
                        SHOP_EMAIL,
                        SHOP_LOCATION,
                        CURRENCY,
                        DEFAULT_PAYMENT,
                        LOW_STOCK_THRESHOLD,
                        RECEIPT_FOOTER,
                        SHOW_PHONE_ON_RECEIPT,
                        SHOW_LOCATION_ON_RECEIPT,
                        UPDATED_AT
                    )
                    VALUES (
                        1,
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                    )
                    ON CONFLICT(ID)
                    DO UPDATE SET
                        SHOP_NAME = excluded.SHOP_NAME,
                        SHOP_PHONE = excluded.SHOP_PHONE,
                        SHOP_EMAIL = excluded.SHOP_EMAIL,
                        SHOP_LOCATION = excluded.SHOP_LOCATION,
                        CURRENCY = excluded.CURRENCY,
                        DEFAULT_PAYMENT = excluded.DEFAULT_PAYMENT,
                        LOW_STOCK_THRESHOLD =
                            excluded.LOW_STOCK_THRESHOLD,
                        RECEIPT_FOOTER = excluded.RECEIPT_FOOTER,
                        SHOW_PHONE_ON_RECEIPT =
                            excluded.SHOW_PHONE_ON_RECEIPT,
                        SHOW_LOCATION_ON_RECEIPT =
                            excluded.SHOW_LOCATION_ON_RECEIPT,
                        UPDATED_AT = excluded.UPDATED_AT
                """), (
                    settings.get("ID", 1),
                    settings.get("SHOP_NAME", "Mwangaza Mini Mart"),
                    settings.get("SHOP_PHONE", ""),
                    settings.get("SHOP_EMAIL", ""),
                    settings.get("SHOP_LOCATION", ""),
                    settings.get("CURRENCY", "KSh"),
                    settings.get("DEFAULT_PAYMENT", "Cash"),
                    settings.get("LOW_STOCK_THRESHOLD", 5),
                    settings.get(
                        "RECEIPT_FOOTER",
                        "Thank you for shopping with us!"
                    ),
                    settings.get("SHOW_PHONE_ON_RECEIPT", 1),
                    settings.get("SHOW_LOCATION_ON_RECEIPT", 1),
                    settings.get(
                        "UPDATED_AT",
                        datetime.now().isoformat()
                    )
                )


            return jsonify({
                "status": "success",
                "message": "Backup restored successfully.",
                "productsRestored": len(products),
                "salesRestored": len(sales),
                "saleItemsRestored": len(sale_items)
            })


    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


# ============================================================
# CLEAR ALL DATA
# ============================================================

@settings_bp.route("/clear", methods=["DELETE"])
def clear_all_data():

    try:

        with database_connection() as connection:

            # ------------------------------------------------
            # Delete child records first
            # ------------------------------------------------

            connection.execute("""
                DELETE FROM SALE_ITEMS
            """)


            # ------------------------------------------------
            # Delete sales
            # ------------------------------------------------

            connection.execute("""
                DELETE FROM SALES
            """)


            # ------------------------------------------------
            # Delete products
            # ------------------------------------------------

            connection.execute("""
                DELETE FROM PRODUCTS
            """)


            # ------------------------------------------------
            # Reset settings
            # ------------------------------------------------

            connection.execute("""
                DELETE FROM SETTINGS
            """)


            connection.execute("""
                INSERT INTO SETTINGS (
                    ID,
                    SHOP_NAME,
                    SHOP_PHONE,
                    SHOP_EMAIL,
                    SHOP_LOCATION,
                    CURRENCY,
                    DEFAULT_PAYMENT,
                    LOW_STOCK_THRESHOLD,
                    RECEIPT_FOOTER,
                    SHOW_PHONE_ON_RECEIPT,
                    SHOW_LOCATION_ON_RECEIPT
                )
                VALUES (
                    1,
                    'Mwangaza Mini Mart',
                    '',
                    '',
                    '',
                    'KSh',
                    'Cash',
                    5,
                    'Thank you for shopping with us!',
                    1,
                    1
                )
            """)


            return jsonify({
                "status": "success",
                "message": "All POS data has been cleared."
            })


    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500