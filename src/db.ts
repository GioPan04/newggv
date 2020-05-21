import mysql from 'mysql';

const db = mysql.createConnection({
    user: process.env.db_user,
    password: process.env.db_password,
    database: process.env.db_name,
    host: 'localhost',
    charset : 'utf8_general_ci'
});

export default db;
