import sqlite3
from pathlib import Path
from contextlib import contextmanager


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_DIR = BASE_DIR / "database"
DATABASE_PATH = DATABASE_DIR / "mwangaza.db"


# Make sure the database directory exists
DATABASE_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():
    """
    Create and return a connection to the Mwangaza POS database.
    """

    connection = sqlite3.connect(DATABASE_PATH)

    # Allows us to access columns by name
    connection.row_factory = sqlite3.Row

    # Enforce foreign key relationships
    connection.execute("PRAGMA FOREIGN_KEYS = ON")

    return connection


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

def initialize_database():
    """
    Create all required database tables if they don't already exist.

    Also performs safe database migrations when new columns
    are introduced into existing tables.
    """

    connection = get_connection()

    try:

        # ========================================================
        # USERS TABLE
        # ========================================================

        connection.execute("""
            CREATE TABLE IF NOT EXISTS USERS (
                ID INTEGER PRIMARY KEY AUTOINCREMENT,
                USERNAME TEXT NOT NULL UNIQUE,
                PASSWORD TEXT NOT NULL,
                FULL_NAME TEXT NOT NULL,
                ROLE TEXT NOT NULL DEFAULT 'CASHIER',
                CREATED_AT TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)


        # ========================================================
        # PRODUCTS TABLE
        # ========================================================

        connection.execute("""
            CREATE TABLE IF NOT EXISTS PRODUCTS (
                ID INTEGER PRIMARY KEY AUTOINCREMENT,
                NAME TEXT NOT NULL UNIQUE,
                CATEGORY TEXT NOT NULL,
                PRICE REAL NOT NULL CHECK (PRICE >= 0),
                STOCK INTEGER NOT NULL DEFAULT 0 CHECK (STOCK >= 0),
                LOW_STOCK_THRESHOLD INTEGER NOT NULL DEFAULT 5
                    CHECK (LOW_STOCK_THRESHOLD >= 0),
                CREATED_AT TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UPDATED_AT TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)


        # ========================================================
        # SALES TABLE
        # ========================================================

        connection.execute("""
            CREATE TABLE IF NOT EXISTS SALES (
                ID INTEGER PRIMARY KEY AUTOINCREMENT,
                RECEIPT_NUMBER TEXT NOT NULL UNIQUE,
                SALE_DATE TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                SUBTOTAL REAL NOT NULL CHECK (SUBTOTAL >= 0),
                TAX REAL NOT NULL CHECK (TAX >= 0),
                TOTAL REAL NOT NULL CHECK (TOTAL >= 0),
                PAYMENT_METHOD TEXT NOT NULL,

                STATUS TEXT NOT NULL DEFAULT 'COMPLETED',

                VOIDED_AT TEXT,
                VOIDED_BY TEXT,
                VOID_REASON TEXT
            )
        """)


        # ========================================================
        # SALE_ITEMS TABLE
        # ========================================================

        connection.execute("""
            CREATE TABLE IF NOT EXISTS SALE_ITEMS (
                ID INTEGER PRIMARY KEY AUTOINCREMENT,
                SALE_ID INTEGER NOT NULL,
                PRODUCT_ID INTEGER NOT NULL,
                QUANTITY INTEGER NOT NULL CHECK (QUANTITY > 0),
                UNIT_PRICE REAL NOT NULL CHECK (UNIT_PRICE >= 0),
                TOTAL REAL NOT NULL CHECK (TOTAL >= 0),

                FOREIGN KEY (SALE_ID)
                    REFERENCES SALES(ID)
                    ON DELETE CASCADE,

                FOREIGN KEY (PRODUCT_ID)
                    REFERENCES PRODUCTS(ID)
            )
        """)


        # ========================================================
        # SETTINGS TABLE
        # ========================================================

        connection.execute("""
            CREATE TABLE IF NOT EXISTS SETTINGS (
                ID INTEGER PRIMARY KEY CHECK (ID = 1),
                SHOP_NAME TEXT NOT NULL,
                SHOP_PHONE TEXT DEFAULT '',
                SHOP_EMAIL TEXT DEFAULT '',
                SHOP_LOCATION TEXT DEFAULT '',
                CURRENCY TEXT NOT NULL DEFAULT 'KSh',
                DEFAULT_PAYMENT TEXT NOT NULL DEFAULT 'Cash',
                LOW_STOCK_THRESHOLD INTEGER NOT NULL DEFAULT 5
                    CHECK (LOW_STOCK_THRESHOLD >= 0),
                RECEIPT_FOOTER TEXT DEFAULT '',
                SHOW_PHONE_ON_RECEIPT INTEGER NOT NULL DEFAULT 1,
                SHOW_LOCATION_ON_RECEIPT INTEGER NOT NULL DEFAULT 1,
                UPDATED_AT TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)


        # ========================================================
        # DEFAULT SETTINGS
        # ========================================================

        settings_exists = connection.execute("""
            SELECT ID
            FROM SETTINGS
            WHERE ID = 1
        """).fetchone()


        if settings_exists is None:

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

            print("Default POS settings created.")


        # ========================================================
        # DATABASE MIGRATIONS
        # ========================================================


        # ========================================================
        # SALE_ITEMS MIGRATION
        # ========================================================

        sale_items_columns = connection.execute("""
            PRAGMA TABLE_INFO(SALE_ITEMS)
        """).fetchall()


        sale_items_column_names = [
            column["name"]
            for column in sale_items_columns
        ]


        # --------------------------------------------------------
        # Add PRODUCT_NAME to SALE_ITEMS if missing
        # --------------------------------------------------------

        if "PRODUCT_NAME" not in sale_items_column_names:

            connection.execute("""
                ALTER TABLE SALE_ITEMS
                ADD COLUMN PRODUCT_NAME TEXT
            """)


            connection.execute("""
                UPDATE SALE_ITEMS
                SET PRODUCT_NAME = (
                    SELECT NAME
                    FROM PRODUCTS
                    WHERE PRODUCTS.ID = SALE_ITEMS.PRODUCT_ID
                )
                WHERE PRODUCT_NAME IS NULL
            """)


            print(
                "Database migration completed: "
                "PRODUCT_NAME added to SALE_ITEMS."
            )


        # ========================================================
        # SALES MIGRATION
        # ========================================================

        sales_columns = connection.execute("""
            PRAGMA TABLE_INFO(SALES)
        """).fetchall()


        sales_column_names = [
            column["name"]
            for column in sales_columns
        ]


        # --------------------------------------------------------
        # Add STATUS to SALES if missing
        # --------------------------------------------------------

        if "STATUS" not in sales_column_names:

            connection.execute("""
                ALTER TABLE SALES
                ADD COLUMN STATUS TEXT NOT NULL
                DEFAULT 'COMPLETED'
            """)


            print(
                "Database migration completed: "
                "STATUS added to SALES."
            )


        # --------------------------------------------------------
        # Add VOIDED_AT to SALES if missing
        # --------------------------------------------------------

        if "VOIDED_AT" not in sales_column_names:

            connection.execute("""
                ALTER TABLE SALES
                ADD COLUMN VOIDED_AT TEXT
            """)


            print(
                "Database migration completed: "
                "VOIDED_AT added to SALES."
            )


        # --------------------------------------------------------
        # Add VOIDED_BY to SALES if missing
        # --------------------------------------------------------

        if "VOIDED_BY" not in sales_column_names:

            connection.execute("""
                ALTER TABLE SALES
                ADD COLUMN VOIDED_BY TEXT
            """)


            print(
                "Database migration completed: "
                "VOIDED_BY added to SALES."
            )


        # --------------------------------------------------------
        # Add VOID_REASON to SALES if missing
        # --------------------------------------------------------

        if "VOID_REASON" not in sales_column_names:

            connection.execute("""
                ALTER TABLE SALES
                ADD COLUMN VOID_REASON TEXT
            """)


            print(
                "Database migration completed: "
                "VOID_REASON added to SALES."
            )


        # --------------------------------------------------------
        # Make sure existing sales are marked COMPLETED
        # --------------------------------------------------------

        connection.execute("""
            UPDATE SALES
            SET STATUS = 'COMPLETED'
            WHERE STATUS IS NULL
               OR TRIM(STATUS) = ''
        """)


        # ========================================================
        # COMMIT DATABASE CHANGES
        # ========================================================

        connection.commit()


        print("Database initialized successfully.")
        print(f"Database location: {DATABASE_PATH}")


    except Exception as error:

        connection.rollback()

        print(
            f"Database initialization error: {error}"
        )

        raise


    finally:

        connection.close()


# ============================================================
# DATABASE CONTEXT MANAGER
# ============================================================

@contextmanager
def database_connection():
    """
    Safely open and close a database connection.

    Automatically commits successful operations
    and rolls back operations if an error occurs.
    """

    connection = get_connection()

    try:

        yield connection

        connection.commit()

    except Exception:

        connection.rollback()
        raise

    finally:

        connection.close()


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    initialize_database()