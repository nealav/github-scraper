# github-email-scraper

Uses GitHub's API to get public emails in Push Events or even by the user's profile. Most people don't hide their emails on GitHub for whatever reason. Implications could be connecting code to job profiles, talent sourcing w/ automated emails, DoSing websites, finding devs at companies, finding dev in areas of interest etc.

You can scrape about 5000x100x24 = 12,000,000 users per day. I think at the time of writing this there are between 50-60 million users, couldn't get an accurate estimate.

Scraping the emails is a lot more annoying. You can only do 5000x24 = 120,000 per day becuase of API rate limiting. GraphQL API can net you 12,000,000 emails a day but it isn't ordered so I can't really trust the fault tolerance of writing code to scrape that. Plus you can't parallelize it by running different scrapers on blocks of ids.

Need to explore running in a Docker container on a cron job. No idea what I would do with the scraped emails lol. Meta-analysis on open devs? Tool to find most active developers around you for projects?

## GHTorrent

http://ghtorrent.org/downloads.html

This is a dump of github commits needed. Using the latest mysql dump and importing into Postgres is perfect.

## config.js

Make a config.js file:

```
module.exports = {
    token: '',
    user: '',
    database: '',
    password: '',
    start: 0,
    offset: 100
};
```

## PostgreSQL

Run postgres. Create DB and Table for data.

## Github Archive

Still need to look into this.

* https://stackoverflow.com/a/37307463
* https://www.gharchive.org/


## GraphQL API v4

Considered using this but the way to get the info wasn't straight forward enough. I like simple so a few extra REST calls doesn't hurt.

https://developer.github.com/v4/explorer/

```
{
  rateLimit {
    limit
    cost
    remaining
    resetAt
  }
  search(query: "created:2007-10-20 sort:joined-asc", type: USER, first: 100, after: "Y3Vyc29yOjEwMg==") {
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
              }
          }
      }
  }
}
```

https://stackoverflow.com/questions/48244950/can-i-list-githubs-public-repositories-using-graphql


## References

https://www.sourcecon.com/how-to-find-almost-any-github-users-email-address/
https://www.sourcecon.com/how-to-find-almost-any-github-users-email-address-2-0/
