# Scraping 10 Years of Github to Analyze User/Dev Data

## Beginnings

So I first noticed that some *personal* user data was available on Github through their REST API. The users endpoint returned user data and you could invidually view each profile -> profiles have websites, bios, emails, full names etc. I had to have it ALL. Plus I thought it was interesting to see how many developers wanted to be found and famed, although I will never give the data to anyone. You could scrape it too if you wanted.

## Methods

Wait a minute, what ... you can get that data? Yep, just take a look at `https://api.github.com/users?since=0&per_page=10` to programmatically grab it. This lists all the users and the individual information endpoint is `https://api.github.com/users/{username}`. In fact, you don't even need an API key to access it (you do get rate limited though).

Doing a bit more digging into the GitHub REST API you can only make 5000 requests per hour. Which basically meant 5000 users per hour give or take using their endpoints. This wasn't enough. A rough search of the total amount of users in the GitHub search was above 40M. I can't wait years for this. There's gotta be a better way, right?

There is, by using GitHub's GraphQL API. Using their search functionality you can retrieve users register in increments of 100 users per API call. Awesome. That means 500K users per hour. With the rough total this would take about a week or so (which it did). They also calculate the cost of a GraphQL API call VERY LENIENTLY. You've gotta try it out if you have the chance.

Segmenting the users by day and grabbing them based on the time they signed up is the only way to get them all through the GraphQL API. Moreover, I never really sought out to grab a proofed ALL the users for this project. I just wanted a lot. Any day where there were above 24,000 users that signed up I was unable to grasp them all because I was scraping by the hour.

I tried doing this on my poor good boi personal computer but sadly I also wanted to browse the internet and work on other projects. Plus, with only a 256GB SSD I don't have much space to spare. So I spun up a small VM in GCP and ran the script on a crontab every hour. I could've probably optimized by having it sleep instead of on a cron job and check in at the rate-limit-reset-time but, like I said, I like to approach my projects rough-and-tumble. Where's the fun in spending a few hours writing a mathematically perfect solution when you can have data NOW, start coming up with analysis ideas and fix your code as you go. There's got to be a balance.

I stored all the data relationally on a Postgres instance in Cloud SQL. I really only needed like 10GB of space so it cost $0 to do the whole project. Plus the $300 in credits from GCP I was just sitting on needed some love.

## GHTorrent and Github Archive

While doing this project I wanted to see some other analyses and found these. They were picking up the event streams from GitHub and posting them publically for analysis. These are AMAZING. Although they are completely deanonymized and made for researchers mostly. Though I did download pieces of both to check it out. I thought GHTorrent looked super promising so I downloaded the 2019 MySQL dump that they had. First off, this was over a 100GB compressed. My bandwidth was crying for 2 days. Second, uncompressed it was 400GB ... So I had to explore the parts I needed piecewise. Honestly, small tip for anyone hosting large data. Just document the schema with some examples of the data in the dataset pls and make it clear where to find the schemas. I realized they had a documentation page after looking through it all and realizing that I didn't even need to bother with like 350GB of the data they had since I didn't find it interesting. Big tip: always read the documentation. GHTorrent is also great since it is two-way compatible with MySQL and PostgreSQL. They have \copy scripts and different schema files (check it out here: https://github.com/gousiosg/github-mirror/tree/master/sql) for both.

## Analysis

* How many days did you scrape? 

I started 2007-10-20, ended on 2018-03-02. As I mentioned before this was a 'lazy' scrape. My deviation on actual users scraped per day vs. the amount of users that signed up was approximately 948 per day. Some days more, some less. It is technically possible to scrape on a granularity of the minute the user was created. You'll probably die of boredom though. This is more than enough sample size for my small research I assume haha.

* How many users scraped?

24589201

* How many listed a ... ?

location: 2924599

email: 2167455

name: 5602646

website: 1421849

bio: 1443553

company: 1630421

* How many listed themselves as hireable?

833488

* Top companies listed

![word_cloud](/data/company_word_cloud.png)

* How many unique companies among users?

983578

* Top locations

***HEATMAPS NEEDED***

* How many users have their login in their email?

560033

* How many users have their login in their website?

384305

* Most used email domains

* Most used website TLDs

* http vs https in website

Https - 460909
http - 552077

* How many use ... as their website?

Twitter: 28052

LinkedIn: 108291

Facebook: 15617

* Bio Word Cloud


## GHTorrent Data

I analyzed a few pieces of this as well: users, commit_comments, project_members, projects, pull_request_comments. The GHTorrent dump ends on 2019-06-01.

users

* How many users?

32411734

* How many sign up per day?

![chart](/data/users_per_day.png)


* Top locations (country)

![map](/data/full-world-heatmap-500k.png)

* Top companies listed

![word_cloud](/data/top_companies_ghtorrent.png)



pull_request_comments

* How many pull request comments?

35453290

projects

* How many projects?

125486232. This includes forks.

* Top languages in projects

![word_cloud](/data/top_languages_word_cloud.png)


project_members

* How many project members?

12618714. This represents the number of members across all projects.

commit_comments

* How many commit comments?

5682741

* How many commit comments per day?

![chart](/data/commit_comments_per_day.png)

* Most said words in commit comments

![word_cloud](/data/raw_commit_comment_word_cloud.png)

![word_cloud](/data/cleaned_commit_comment_world_cloud.png)


* Top users submitting commit comments

![table](/data/top_users_commit_comments.png)


## Conclusion

The potential use cases for this that I see:
* Talent Sourcing - you can source talent from any company, any location, by amount of repos, amount of followers etc. Especially useful for developers that put themselves as hireable or that work at larger tech companies. You can even source talent for consultation by looking for startup founders, active python devs etc.
* Personalized Bug Bounties - find bugs on people's projects or personal websites (do not attack them) and pop them an automated email from your screener or a message on GitHub or make an issue on their repo to warn them.
* Research applications - look at weird hotspots of developers based on their location, detect fake accounts on Github, get the scoop from niche developer communities in the boonies

Honestly the potential is endless. I'll probably be doing more analysis when I can. The geographical developer/user data really is priceless.


## Postmortem, Fun Points, References

See my code here: https://github.com/nealav/github-email-scraper (be gentle uwu).

[1] Why df isn't my Node running through crontab? OH, because cron passes in a completetely different environment without Node in the path

[2] So you think you're bulletproof, huh? You didn't post your email so I can't get it, right? Well, here's another thing that surprised me. Looking into the GitHub events stream, most commits have an author email attached to them. So, sorry to say but, if you haven't listed your email on your profile a person can still scrape it from their Events API (part 2 maybe? lol). Seriously, just check out `https://api.github.com/users/{username}/events/public`

[3] Tried to do the whole thing in Node but I eventually realized that the data analysis packages of Node SUCK. SUCK HUGE BIG. Immediately switched to Python and KNOCKED IT OUT.

[4] I NEED A FASTER COMPUTER WHY ARE THESE QUERIES SO SLOW - I've been slowly going insane and upping my Cloud SQL instance memory/SSD storage and vCPUs. At first it was 1 vCPU with 0.6GB memory and 10GB SSD, then 1 with 2GB memory and 40GB SSD, then finally 2 with 8GB memory and 46GB SSD.

[5] https://alcidanalytics.com/p/geographic-heatmap-in-python