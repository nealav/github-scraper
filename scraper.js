'use strict';

const axios = require('axios');
const linkParser = require('parse-link-header');
const fs = require('fs');

const db = require('./db');
const config = require('./config');

const TOKEN = config.token;
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

const main = async () => {
    const users = await scrapeGithubUsers();
    const usersEmails = await scrapeGithubUserEmails(users);
    await db.insertUsers(usersEmails);
    console.log(users[users.length - 1]);
    return process.exit(0);
};

main();
