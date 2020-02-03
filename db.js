'use strict';

const pg = require('pg');

const config = require('./config');

var dbConfig = {
    host: 'localhost',
    user: config.user,
    database: config.database,
    password: config.password,
    port: 5432,
    max: 10, //max number of connections open to database
    idleTimeoutMillis: 30000, //how long a client is allowed to remain idle
  };
var pool = new pg.Pool(dbConfig);

const dropusersTableQuery=`
DROP TABLE users;
`;

const createUsersTableQuery = `
CREATE TABLE users(
    id TEXT PRIMARY KEY,
    login TEXT,
    type TEXT,
    email TEXT,
    name TEXT,
    company TEXT,
    blog TEXT,
    location TEXT,
    bio TEXT
);
`;

const insertUsers = async (users) => {
    const insertUser = `
        INSERT INTO users (id, login, type, email, name, company, blog, location, bio) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id)
        DO NOTHING;
    `;
    const client = await pool.connect();

    for (let user of users) {
        const result = await client.query(insertUser, [
            user.id, 
            user.login, 
            user.type,
            user.email,
            user.name,
            user.company,
            user.blog,
            user.location,
            user.bio
        ]);
    };
};

const selectUsers = async () => {
    const selectUsers = `
        SELECT MAX(id) FROM users;
    `;

    const client = await pool.connect();
    const result = await client.query(selectUsers);
    console.log(result.rows);
};

// const main = async () => {

// };
//main();

module.exports = {
    insertUsers,
    selectUsers,
};
