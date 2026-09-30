require("dotenv").config();

const MARIADB = require("mariadb");

const POOL = MARIADB.createPool({
    HOST: process.env.DB_HOST,
    USER: process.env.DB_USER,
    PASSWORD: process.env.DB_PASSWORD,
    DATABASE: process.env.DB_NAME,
    CONNECTIONLIMIT: 5
});

async function TESTDATABASE() {

    let CONNECTION;

    try {

        CONNECTION = await POOL.getConnection();

        console.log(
            "CONNECTED TO MWANGAZA DATABASE SUCCESSFULLY."
        );

    } catch (ERROR) {

        console.error(
            "DATABASE CONNECTION FAILED:",
            ERROR.message
        );

    } finally {

        if (CONNECTION) {
            CONNECTION.release();
        }

    }

}

TESTDATABASE();

module.exports = POOL;