#!/bin/bash


case "$(pidof node | wc -w)" in 

0) echo "Restarting Github Scraper: $(date)" >> /home/neal_viswanath/github-email-scraper/process.txt
   cd /home/neal_viswanath/github-email-scraper/ && npm start
   ;;
1) #Process is running
   echo "Process is running"
   ;;
*) echo "Remove double: $(date)" >> /home/neal_viswanath/github-email-scraper/process.txt
   kill $(pidof node | awk '{print $1}')
   ;;
esac   
