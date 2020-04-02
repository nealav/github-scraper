#!/bin/bash

PATH=/home/neal_viswanath/.nvm/versions/node/v12.16.1/bin:/usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games

case "$(pidof node | wc -w)" in 

0) echo "Restarting Github Scraper: $(date)" >> /home/neal_viswanath/github-email-scraper/process.txt
   node /home/neal_viswanath/github-email-scraper/scraper.js
   ;;
1) #Process is running
   echo "Process is running"
   ;;
*) echo "Remove double: $(date)" >> /home/neal_viswanath/github-email-scraper/process.txt
   kill $(pidof node | awk '{print $1}')
   ;;
esac   
