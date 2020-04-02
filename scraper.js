'use strict';

const axios = require('axios');
const fs = require('fs');
const _ = require('underscore');
const moment = require('moment');

const db = require('./db');
const config = require('./config');
const TOKEN = config.token;

/* REST API Implementation

const START = config.start;
const OFFSET = config.offset;

const scrapeGithubUsers = async () => {
    const users = [];
    let rateLimitRemaining = 5000;
    let since = START;

    console.log('Scraping all Github users ...');
    while (since < START + OFFSET) {
        const response = await axios({
            method: 'GET',
            url: `https://api.github.com/users`,
            params: {
                since,
                'per_page': 100
            },
            headers: {
                'Authorization': `token ${TOKEN}`
            }
        })
        users.push(...response.data.map((user) => {
            return {
                login: user.login,
                id: user.id,
                type: user.type
            };
        }));
        console.log(`Scraped ${users.length} users ...`);

        since = response.data[response.data.length - 1].id;
        rateLimitRemaining = parseInt(response.headers['x-ratelimit-remaining'], 10);
        console.log(`Rate Limit Remaining: ${rateLimitRemaining}, Last ID: ${since}`);
    }

    return users;
};

const scrapeGithubUserEmails = async (users) => {

    console.log('Scraping for user emails ...');
    const userEmails = await Promise.all(users.map( async (user) => {
        let userData = {
            ...user,
            email: null,
            name: null,
            company: null,
            blog: null,
            location: null,
            bio: null,
        };

        console.log('Checking user information from API ... ');
        const response = await axios({
            method: 'GET',
            url: `https://api.github.com/users/${user.login}`,
            headers: {
                'Authorization': `token ${TOKEN}`
            }
        });

        response.data.name ? userData.name = response.data.name : null;
        response.data.company ? userData.company = response.data.company : null;
        response.data.location ? userData.location = response.data.location : null;
        response.data.blog ? userData.blog = response.data.blog : null;
        response.data.bio ? userData.bio = response.data.bio : null;

        if (response.data.email) {
            userData.email = response.data.email;
        } else {
            console.log('Checking Events API for Push Events with emails ...');
            const response = await axios({
                method: 'GET',
                url: `https://api.github.com/users/${user.login}/events/public`,
                headers: {
                    'Authorization': `token ${TOKEN}`
                }
            });

            for (var i=0; i < response.data.length; i++){
                if(response.data[i].type === 'PushEvent'){
                    const event = response.data[i];
                    if (event.payload && event.payload.commits && event.payload.commits[0].author) {
                        const email = event.payload.commits[0].author.email;
                        if (email) {
                            userData.email = email;
                            break;
                        }
                    }
                }
            }
        }

        return userData;
    }));
    
    return userEmails;
};

*/


const scrape24HoursGithubUsers = async (date) => {

    let rateLimitRemaining = 2;
    console.log(`STARTING: Scraping all 24 hours of users on ${date.format('YYYY-MM-DD')}`);
    let cursor = '';
    let hour = 0;

    while (hour <= 24 && rateLimitRemaining > 1) {
        let hour_string = hour < 10 ? `T0${hour}` : `T${hour}`
        console.log(`STARTING: ${hour_string}`);

        const payload = {
            query: `{
                search(query: "created:${date.format('YYYY-MM-DD')}${hour_string} sort:joined-asc", type: USER, first: 100${ cursor ? `, after: "${cursor}"` : ''}) {
                    userCount
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                    edges {
                        node {
                            ... on User {
                                name
                                login
                                databaseId
                                email
                                bio
                                isHireable
                                websiteUrl
                                company
                                location
                                createdAt
                            }
                        }
                    }
                }
            }`
        }

        const response = await axios({
            method: 'POST',
            url: `https://api.github.com/graphql`,
            headers: {
                'Authorization': `token ${TOKEN}`
            },
            data: payload
        })

        let users = [];
        users.push(...response.data.data.search.edges.map((user) => {
            return {
                ...user.node
            };
        }));
        users = users.filter(user => !_.isEmpty(user));
        console.log(`SCRAPED ${response.data.data.search.edges.length} USERS ...`);
        await db.insertUsers(users, date.format('YYYY-MM-DD') + hour_string);

        const lastUserId = users[users.length - 1] && users[users.length - 1].databaseId;
        if (response.data.data.search.pageInfo.hasNextPage === false) {
            const log = JSON.stringify({ date: date.format('YYYY-MM-DD') + hour_string, userCount: response.data.data.search.userCount, lastUserId }) + '\n';
            fs.appendFile('./scraper.log', log, function (err) {
                if (err) throw err;
                console.log(log);
            });
            fs.writeFileSync('./lastChecked', JSON.stringify({ date: date.format('YYYY-MM-DD'), cursor }));
        } else {
            cursor = response.data.data.search.pageInfo.endCursor;
        }

        rateLimitRemaining = parseInt(response.headers['x-ratelimit-remaining'], 10);    
        console.log(`Rate Limit Remaining: ${rateLimitRemaining},\nCursor: ${cursor},\nLast ID: ${lastUserId}`);
        console.log(`FINISHED: ${hour_string}`);
        hour++;
    }

    console.log(`FINISHED: Scraping all 24 hours of users on ${date.format('YYYY-MM-DD')}`)
    return;
}

const scrapeGithubUsersGraphQLAPI = async () => {
    let rateLimitRemaining = 2;

    if(!fs.existsSync('./lastChecked')) {
        fs.writeFileSync('./lastChecked', JSON.stringify({ date: '2007-10-20', cursor: ''}));
    }
    let lastChecked = JSON.parse(fs.readFileSync('./lastChecked', { encoding: 'utf8' }));
    let cursor = lastChecked.cursor;
    let date = moment(lastChecked.date);

    console.log('START: USER SCRAPING');

    while (rateLimitRemaining > 1) {
        const payload = {
            query: `{
                search(query: "created:${date.format('YYYY-MM-DD')} sort:joined-asc", type: USER, first: 100${ cursor ? `, after: "${cursor}"` : ''}) {
                    userCount
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                    edges {
                        node {
                            ... on User {
                                name
                                login
                                databaseId
                                email
                                bio
                                isHireable
                                websiteUrl
                                company
                                location
                                createdAt
                            }
                        }
                    }
                }
            }`
        };

        //Hit GraphQL API
        const response = await axios({
            method: 'POST',
            url: `https://api.github.com/graphql`,
            headers: {
                'Authorization': `token ${TOKEN}`
            },
            data: payload
        })

        //Insert users into Postgres DB
        let users = [];
        users.push(...response.data.data.search.edges.map((user) => {
            return {
                ...user.node
            };
        }));
        users = users.filter(user => !_.isEmpty(user));
        console.log(`SCRAPED ${response.data.data.search.edges.length} USERS ...`);
        await db.insertUsers(users, date.format('YYYY-MM-DD'));

        //Increment Cursor Page or Day By 1
        const lastUserId = users[users.length - 1] && users[users.length - 1].databaseId;
        if (response.data.data.search.pageInfo.hasNextPage === false && response.data.data.search.userCount <= 1000) {
            const log = JSON.stringify({ date: date.format('YYYY-MM-DD'), userCount: response.data.data.search.userCount, lastUserId }) + '\n';
            fs.appendFile('./scraper.log', log, function (err) {
                if (err) throw err;
                console.log(log);
            });
            cursor = '';
            date.add(1, 'days');
            fs.writeFileSync('./lastChecked', JSON.stringify({ date: date.format('YYYY-MM-DD'), cursor }));
        } else if (response.data.data.search.userCount > 1000) {
            const log = JSON.stringify({ date: date.format('YYYY-MM-DD'), userCount: response.data.data.search.userCount }) + '\n';
            fs.appendFile('./scraper.log', log, function (err) {
                if (err) throw err;
                console.log(log);
            });
            await scrape24HoursGithubUsers(date);
            cursor = '';
            date.add(1, 'days');
            fs.writeFileSync('./lastChecked', JSON.stringify({ date: date.format('YYYY-MM-DD'), cursor }));
        } else {
            cursor = response.data.data.search.pageInfo.endCursor;
        }

        //Decrement Rate Limit
        rateLimitRemaining = parseInt(response.headers['x-ratelimit-remaining'], 10);    
        console.log(`Rate Limit Remaining: ${rateLimitRemaining},\nCursor: ${cursor},\nLast ID: ${lastUserId}`);
    }
};

const main = async () => {
    // REST API
    // const users = await scrapeGithubUsers();
    // const usersEmails = await scrapeGithubUserEmails(users);
    // await db.insertUsers(usersEmails);

    // GraphQL API
    try {
        const users = await scrapeGithubUsersGraphQLAPI();
    } catch (e) {
        console.error(e);
        return process.exit(1);
    }
    return process.exit(0);
};

main();
