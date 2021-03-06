'use strict';

const pg = require('pg');
const fs = require('fs');

const config = require('./config');

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var dbConfig = {
    host: config.host,
    user: config.user,
    database: config.database,
    password: config.password,
    port: 5432,
    max: 10,
    idleTimeoutMillis: 30000,
  };
var pool = new pg.Pool(dbConfig);

const insertUsers = async (users, date) => {

    if (users.length === 0) {
        return;
    }

    console.log(`START: INSERT USERS`)
    let values = [];
    for (let user of users) {
        values.push(`(${user.databaseId}, '${user.login}', '${user.isHireable}', '${user.email ? user.email.replace(/'/g,"''") : null}', '${user.name ? user.name.replace(/'/g,"''") : null}', '${user.company ? user.company.replace(/'/g,"''") : null}', '${user.websiteUrl ? user.websiteUrl.replace(/'/g,"''") : null}', '${user.location ? user.location.replace(/'/g,"''") : null}', '${user.bio ? user.bio.replace(/'/g,"''") : null}', '${user.createdAt}')`);
    }

    const insertUsersQuery = `
        INSERT INTO github_users (id, login, "isHireable", email, name, company, "websiteURL", location, bio, "createdAt") 
        VALUES
            ${values.join(', ')}
        ON CONFLICT (id)
        DO NOTHING;
    `;

    const result = pool.query(insertUsersQuery, (err, res) => {
        if (err) {
            fs.appendFile('./error.log', `ERROR: ERROR FOR ${users.length} USERS ON ${date} \n`, function (err) {
                if (err) throw err;
            });
            console.error(err.stack);
        } else {
            console.log(`SUCCESS: INSERTED ${users.length} USERS FOR ${date}`);
        }
    });

    //await sleep(100);
    
    return;
};

const insertDates = async (date, count) => {
    const insertDatesQuery = `
        INSERT INTO users_per_day (date, count) 
        VALUES ('${date}', ${count})
        ON CONFLICT(date)
        DO NOTHING
    `;
    const result = pool.query(insertDatesQuery, (err, res) => {
        if (err) {
            fs.appendFile('./error.log', `ERROR: ERROR ON ${date} \n`, function (err) {
                if (err) throw err;
            });
            console.error(err.stack);
        } else {
            console.log(`SUCCESS: ON ${date}`);
        }
    });
}

module.exports = {
    insertUsers,
    insertDates,
};
