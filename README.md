curl -X POST -H "Content-Type: application/json" -d '{"message":"a message here", "videoId":"your video id here"}' http://localhost:3001/post-message
{"status":"Message posted to YouTube live chat"}%      

## Deployment
Before deploying:
1. Update the domain in creator.html from 'your-domain.com' to your actual domain.
2. Ensure all server URLs are updated to use the deployed domain instead of localhost.