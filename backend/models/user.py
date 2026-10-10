# ============================================================
# MWANGAZA POS — USER MODEL
# ============================================================

from database import database_connection


def create_user(username, password, full_name, role="CASHIER"):
    """
    Create a new POS user.
    """

    with database_connection() as connection:

        connection.execute("""
            INSERT INTO USERS (
                USERNAME,
                PASSWORD,
                FULL_NAME,
                ROLE
            )
            VALUES (?, ?, ?, ?)
        """, (
            username,
            password,
            full_name,
            role
        ))


def get_user_by_username(username):
    """
    Retrieve a user using their username.
    """

    with database_connection() as connection:

        user = connection.execute("""
            SELECT
                ID,
                USERNAME,
                PASSWORD,
                FULL_NAME,
                ROLE,
                CREATED_AT
            FROM USERS
            WHERE USERNAME = ?
        """, (username,)).fetchone()

        return user