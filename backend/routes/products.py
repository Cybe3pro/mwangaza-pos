from flask import Blueprint, jsonify, request

from database import database_connection


# ============================================================
# PRODUCTS BLUEPRINT
# ============================================================

products_bp = Blueprint(
    "products",
    __name__,
    url_prefix="/api/products"
)


# ============================================================
# GET ALL PRODUCTS
# ============================================================

@products_bp.route("", methods=["GET"])
def get_products():

    with database_connection() as connection:

        products = connection.execute("""
            SELECT
                ID,
                NAME,
                CATEGORY,
                PRICE,
                STOCK,
                LOW_STOCK_THRESHOLD,
                CREATED_AT,
                UPDATED_AT
            FROM PRODUCTS
            ORDER BY NAME ASC
        """).fetchall()

    return jsonify([
        dict(product)
        for product in products
    ])


# ============================================================
# CREATE PRODUCT
# ============================================================

@products_bp.route("", methods=["POST"])
def create_product():

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "No product data provided"
        }), 400

    name = data.get("name")
    category = data.get("category")
    price = data.get("price")
    stock = data.get("stock", 0)
    low_stock_threshold = data.get(
        "lowStockThreshold",
        5
    )

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not name or not category:
        return jsonify({
            "status": "error",
            "message": "Product name and category are required"
        }), 400

    if price is None:
        return jsonify({
            "status": "error",
            "message": "Product price is required"
        }), 400

    try:

        price = float(price)
        stock = int(stock)
        low_stock_threshold = int(low_stock_threshold)

    except (ValueError, TypeError):

        return jsonify({
            "status": "error",
            "message": "Price, stock and low-stock threshold must be valid numbers"
        }), 400

    if price < 0:
        return jsonify({
            "status": "error",
            "message": "Price cannot be negative"
        }), 400

    if stock < 0:
        return jsonify({
            "status": "error",
            "message": "Stock cannot be negative"
        }), 400

    if low_stock_threshold < 0:
        return jsonify({
            "status": "error",
            "message": "Low-stock threshold cannot be negative"
        }), 400

    # --------------------------------------------------------
    # INSERT PRODUCT
    # --------------------------------------------------------

    try:

        with database_connection() as connection:

            cursor = connection.execute("""
                INSERT INTO PRODUCTS (
                    NAME,
                    CATEGORY,
                    PRICE,
                    STOCK,
                    LOW_STOCK_THRESHOLD
                )
                VALUES (?, ?, ?, ?, ?)
            """, (
                name.strip(),
                category.strip(),
                price,
                stock,
                low_stock_threshold
            ))

            product_id = cursor.lastrowid

            product = connection.execute("""
                SELECT
                    ID,
                    NAME,
                    CATEGORY,
                    PRICE,
                    STOCK,
                    LOW_STOCK_THRESHOLD,
                    CREATED_AT,
                    UPDATED_AT
                FROM PRODUCTS
                WHERE ID = ?
            """, (product_id,)).fetchone()

        return jsonify({
            "status": "success",
            "message": "Product created successfully",
            "product": dict(product)
        }), 201

    except Exception as error:

        if "UNIQUE constraint failed" in str(error):

            return jsonify({
                "status": "error",
                "message": "A product with this name already exists"
            }), 409

        raise


# ============================================================
# UPDATE PRODUCT
# ============================================================

@products_bp.route("/<int:product_id>", methods=["PUT"])
def update_product(product_id):

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "No product data provided"
        }), 400

    name = data.get("name")
    category = data.get("category")
    price = data.get("price")
    stock = data.get("stock")
    low_stock_threshold = data.get("lowStockThreshold")

    if not name or not category:
        return jsonify({
            "status": "error",
            "message": "Product name and category are required"
        }), 400

    try:

        price = float(price)
        stock = int(stock)
        low_stock_threshold = int(low_stock_threshold)

    except (ValueError, TypeError):

        return jsonify({
            "status": "error",
            "message": "Invalid product values"
        }), 400

    if price < 0 or stock < 0 or low_stock_threshold < 0:
        return jsonify({
            "status": "error",
            "message": "Product values cannot be negative"
        }), 400

    try:

        with database_connection() as connection:

            existing_product = connection.execute("""
                SELECT ID
                FROM PRODUCTS
                WHERE ID = ?
            """, (product_id,)).fetchone()

            if not existing_product:

                return jsonify({
                    "status": "error",
                    "message": "Product not found"
                }), 404

            connection.execute("""
                UPDATE PRODUCTS
                SET
                    NAME = ?,
                    CATEGORY = ?,
                    PRICE = ?,
                    STOCK = ?,
                    LOW_STOCK_THRESHOLD = ?,
                    UPDATED_AT = CURRENT_TIMESTAMP
                WHERE ID = ?
            """, (
                name.strip(),
                category.strip(),
                price,
                stock,
                low_stock_threshold,
                product_id
            ))

            product = connection.execute("""
                SELECT
                    ID,
                    NAME,
                    CATEGORY,
                    PRICE,
                    STOCK,
                    LOW_STOCK_THRESHOLD,
                    CREATED_AT,
                    UPDATED_AT
                FROM PRODUCTS
                WHERE ID = ?
            """, (product_id,)).fetchone()

        return jsonify({
            "status": "success",
            "message": "Product updated successfully",
            "product": dict(product)
        })

    except Exception as error:

        if "UNIQUE constraint failed" in str(error):

            return jsonify({
                "status": "error",
                "message": "A product with this name already exists"
            }), 409

        raise


# ============================================================
# DELETE PRODUCT
# ============================================================

@products_bp.route("/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):

    with database_connection() as connection:

        product = connection.execute("""
            SELECT ID, NAME
            FROM PRODUCTS
            WHERE ID = ?
        """, (product_id,)).fetchone()

        if not product:

            return jsonify({
                "status": "error",
                "message": "Product not found"
            }), 404

        connection.execute("""
            DELETE FROM PRODUCTS
            WHERE ID = ?
        """, (product_id,))

    return jsonify({
        "status": "success",
        "message": "Product deleted successfully"
    })

# ============================================================
# ADJUST PRODUCT STOCK
# ============================================================

@products_bp.route("/<int:product_id>/stock", methods=["PATCH"])
def adjust_product_stock(product_id):

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "No stock adjustment data provided"
        }), 400

    action = data.get("action")
    quantity = data.get("quantity")

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    allowed_actions = ["add", "remove", "set"]

    if action not in allowed_actions:
        return jsonify({
            "status": "error",
            "message": "Invalid stock adjustment action"
        }), 400

    try:
        quantity = int(quantity)
    except (ValueError, TypeError):
        return jsonify({
            "status": "error",
            "message": "Quantity must be a valid number"
        }), 400

    if quantity < 0:
        return jsonify({
            "status": "error",
            "message": "Quantity cannot be negative"
        }), 400

    # --------------------------------------------------------
    # UPDATE STOCK
    # --------------------------------------------------------

    try:

        with database_connection() as connection:

            product = connection.execute("""
                SELECT
                    ID,
                    NAME,
                    CATEGORY,
                    PRICE,
                    STOCK,
                    LOW_STOCK_THRESHOLD,
                    CREATED_AT,
                    UPDATED_AT
                FROM PRODUCTS
                WHERE ID = ?
            """, (product_id,)).fetchone()

            if not product:

                return jsonify({
                    "status": "error",
                    "message": "Product not found"
                }), 404

            old_stock = int(product["STOCK"])

            # ------------------------------------------------
            # CALCULATE NEW STOCK
            # ------------------------------------------------

            if action == "add":

                new_stock = old_stock + quantity

            elif action == "remove":

                if quantity > old_stock:

                    return jsonify({
                        "status": "error",
                        "message": (
                            f"Cannot remove {quantity} units. "
                            f"Only {old_stock} units are available."
                        )
                    }), 400

                new_stock = old_stock - quantity

            else:

                # SET STOCK
                new_stock = quantity

            # ------------------------------------------------
            # UPDATE DATABASE
            # ------------------------------------------------

            connection.execute("""
                UPDATE PRODUCTS
                SET
                    STOCK = ?,
                    UPDATED_AT = CURRENT_TIMESTAMP
                WHERE ID = ?
            """, (
                new_stock,
                product_id
            ))

            updated_product = connection.execute("""
                SELECT
                    ID,
                    NAME,
                    CATEGORY,
                    PRICE,
                    STOCK,
                    LOW_STOCK_THRESHOLD,
                    CREATED_AT,
                    UPDATED_AT
                FROM PRODUCTS
                WHERE ID = ?
            """, (product_id,)).fetchone()

        return jsonify({
            "status": "success",
            "message": "Stock adjusted successfully",
            "adjustment": {
                "productId": product_id,
                "productName": product["NAME"],
                "action": action,
                "quantity": quantity,
                "oldStock": old_stock,
                "newStock": new_stock
            },
            "product": dict(updated_product)
        })

    except Exception as error:

        print(f"STOCK ADJUSTMENT ERROR: {error}")

        return jsonify({
            "status": "error",
            "message": "An unexpected error occurred while adjusting stock"
        }), 500