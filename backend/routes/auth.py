# ============================================================
# MWANGAZA POS — AUTHENTICATION & AUTHORIZATION ROUTES
# ============================================================

from flask import Blueprint, request, jsonify

from models.user import get_user_by_username


# ============================================================
# BLUEPRINT
# ============================================================

auth_bp = Blueprint("auth", __name__)


# ============================================================
# LOGIN
# ============================================================

@auth_bp.route("/api/login", methods=["POST"])
def login():

    data = request.get_json()

    # --------------------------------------------------------
    # Make sure data was received
    # --------------------------------------------------------

    if not data:

        return jsonify({
            "status": "error",
            "message": "No login data received."
        }), 400


    username = data.get("username", "").strip()
    password = data.get("password", "")


    # --------------------------------------------------------
    # Validate input
    # --------------------------------------------------------

    if not username or not password:

        return jsonify({
            "status": "error",
            "message": "Username and password are required."
        }), 400


    # --------------------------------------------------------
    # Find user
    # --------------------------------------------------------

    user = get_user_by_username(username)


    if user is None:

        return jsonify({
            "status": "error",
            "message": "Invalid username or password."
        }), 401


    # --------------------------------------------------------
    # Verify password
    # --------------------------------------------------------

    if password != user["PASSWORD"]:

        return jsonify({
            "status": "error",
            "message": "Invalid username or password."
        }), 401


    # --------------------------------------------------------
    # Successful login
    # --------------------------------------------------------

    return jsonify({

        "status": "success",

        "message": "Login successful.",

        "user": {
            "id": user["ID"],
            "username": user["USERNAME"],
            "full_name": user["FULL_NAME"],
            "role": user["ROLE"]
        }

    }), 200


# ============================================================
# MANAGER / ADMIN AUTHORIZATION
# ============================================================

@auth_bp.route("/api/authorize", methods=["POST"])
def authorize():

    data = request.get_json()

    # --------------------------------------------------------
    # Make sure authorization data was received
    # --------------------------------------------------------

    if not data:

        return jsonify({
            "status": "error",
            "message": "No authorization data received."
        }), 400


    username = data.get("username", "").strip()
    password = data.get("password", "")


    # --------------------------------------------------------
    # Validate input
    # --------------------------------------------------------

    if not username or not password:

        return jsonify({
            "status": "error",
            "message": "Username and password are required."
        }), 400


    # --------------------------------------------------------
    # Find authorization user
    # --------------------------------------------------------

    user = get_user_by_username(username)


    if user is None:

        return jsonify({
            "status": "error",
            "message": "Invalid authorization credentials."
        }), 401


    # --------------------------------------------------------
    # Verify password
    # --------------------------------------------------------

    if password != user["PASSWORD"]:

        return jsonify({
            "status": "error",
            "message": "Invalid authorization credentials."
        }), 401


    # --------------------------------------------------------
    # Verify role
    #
    # Only MANAGER and ADMIN can authorize restricted
    # operations.
    # --------------------------------------------------------

    role = user["ROLE"].upper()


    if role not in ["MANAGER", "ADMIN"]:

        return jsonify({
            "status": "error",
            "message": "Authorization denied. Manager or Admin approval is required."
        }), 403


    # --------------------------------------------------------
    # Authorization successful
    # --------------------------------------------------------

    return jsonify({

        "status": "success",

        "message": "Authorization approved.",

        "authorized_by": {
            "id": user["ID"],
            "username": user["USERNAME"],
            "full_name": user["FULL_NAME"],
            "role": role
        }

    }), 200