# github-scraper


## Github Archive

Still need to look into this.

https://stackoverflow.com/a/37307463
https://www.gharchive.org/


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
  search(query: "repos:>=0", type: USER, first: 100, after: "Y3Vyc29yOjEwMg==") {
    userCount
    pageInfo {
      endCursor
      startCursor
    }
    edges {
      node {
        ... on User {
          name
          login
          databaseId
          email
          bio
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
