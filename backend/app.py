from flask import Flask, jsonify
from flask_cors import CORS
from database import initialize_database
from routes.products import products_bp
from routes.sales import sales_bp
from routes.settings import settings_bp
from routes.auth import auth_bp

app = Flask(__name__)
CORS(app)

initialize_database()

app.register_blueprint(products_bp)
app.register_blueprint(sales_bp)
app.register_blueprint(settings_bp)
app.register_blueprint(auth_bp)


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "success",
        "message": "Mwangaza POS backend is running"
    })


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )