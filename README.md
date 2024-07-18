# SuperSat💫

Use your lLightning address to receive youtube super chats in stream! 

A Lightning Network-powered superchat system for YouTube live streams, using Lightspark. SuperSat empowers creators to monetize their content through fast, cheap micropayments without losing 30% of their revenue to the platform. 
Get paid from anywhere in the world, to anywhere in the world, regardless of having a bank account. 

livedemo: [Supersat](https://supersats.onrender.com) its hosted on Render free tier so if it doesnt start right away its probably asleep so please refresh. 

(yes bitpay already exists by the user experience sucks, supersat is so much easier)

## Inspiration

I watch a lot of YouTube lives lately, and want an easy way that doesnt involve having to mess with software and apis, to pay the creator using crypto.

## What it does / how it works

1. Creators generate a unique SuperSat link that is connected to their Lightning address and video ID, they can pin it in their livestream for visability.
2. Viewers use this link to send Sats directly to the creator's wallet via Lightning Network (and Lightspark).
3. Viewers can include a message that instantly appears as a special superchat in the YouTube live chat.
4. The system validates authentic SuperSat messages and removes fake ones.

## How I built it

I built SuperSat using a combination of technologies:

- Backend: Node.js with Express
- Frontend: HTML, CSS, and JavaScript
- Lightning Network Integration: Lightspark SDK
- YouTube API: For live chat interaction
- QR Code Generation: For easy Lightning invoice sharing
- Blood, sweat and tears


## Features:
LNULR

## Accomplishments that I'm proud of

1. Successfully integrating the Lightning Network with Ya YouTube live stream.
2. Creating an easy experience for both creators and viewers. I really wanted this to be user friendly. 
2. Developing a creative solution to overcome YouTube API limitations, ensuring unique message identification.
3. Implementing an extra verification layer by deleting copycat messages.
4. Creating an intuitive interface that makes Lightning Network payments accessible to a broader audience.

My goal with SuperSat was to seamlessly integrate the Lightning Network with YouTube live streams, and built with a focus on user experience


## Challenges I ran into

Lots! 

- Lightspark testnet being sandboxed made things tricky, and i had to think hard about how to impliment it as close to real life as possible whilst only being able to simulate payments within the account.  I had wanted to use a mobile wallet in the demo to scan the QR code as most users do, but due to lightspark regtest sdk restrictions/being in a sandbox this wasn't possible and it took a bit of time to figure that out. 

- kept hitting youtube api usage quotas during testing before i managed to debug it. So had to wait hours or even a whole day before I could continue troubleshooting issues and building. It was my first time using youtube api and I didnt realise until the day before submission that i could just create a new project, oops. 

-youtube api limitation with regards to superchats. I had to try and make mine stand out as much as i could and think of ways to make it hard to copy. 

-This leads onto Message validation. I tried to implementing a robust system to prevent abuse while ensuring legitimate messages get through. I eventually landed on a bot that deletes messages that look like the Supersat chats. 

- Limited resources. I found I had to problem-solve independently most of the time. 


## Impact

SuperSat addresses key challenges in the creator economy:

1. **Reduced Fees**: Enables creators to retain a larger portion of their earnings.
2. **Global Reach**: Allows international viewers to easily support creators.
3. **Bitcoin Adoption**: Encourages wider use of Bitcoin and Lightning Network in everyday transactions.
4. **Scalability**: The system can be adapted for other streaming platforms and use cases.

## Contribution to Bitcoin Ecosystem

SuperSat directly contributes to the growth of the Bitcoin ecosystem by:

1. Increasing Lightning Network adoption and usage
2. Demonstrating practical, user-friendly applications of Bitcoin in everyday scenarios
3. Bridging the gap between traditional content platforms and cryptocurrency


## Getting Started

To use SuperSat, creators need:

    A YouTube account with live streaming enabled
    A Lightning Network wallet address
    That's literally it. so easy. so fast. no tech knowledge necessary.


## How to use SuperSat

For Creators:
1. Visit the SuperSat creator page.
2. Enter your YouTube Live URL and Lightning address.
3. Generate your unique SuperSat link.
4. Pin this link in your live chat for viewers to use. 

For Viewers:
1. Click the SuperSat link provided by the creator.
2. Enter the amount you want to tip and your message.
3. Scan the QR code or copy the Lightning invoice to pay.
4. Watch your message appear in the YouTube live chat!

## What's next for SuperSat

1. Expand to additional streaming platforms like Twitch, TikTok Live and Instagram Live.
2. Implement advanced analytics for creators to track earnings and engagement.
3. Explore integration with other Bitcoin Layer 2 solutions for increased scalability.
Optimizing API Usage


## Conclusion

SuperSat directly addresses the Lightning Network Track Challenge by:

1. Providing a real-world application that showcases the speed of Lightning Network transactions.
2. Improving user experience for both creators and viewers in the live streaming ecosystem.
3. Enabling new micropayment-based business models for content creators.
4. Demonstrating how Lightning Network can compete with and surpass traditional payment systems in specific use cases.
5. Encouraging wider adoption of Bitcoin and Lightning Network through an intuitive, user-friendly interface.

By bridging the gap between content creation and Bitcoin's Lightning Network, SuperSat not only solves a real problem for creators but also paves the way for broader Lightning Network adoption in everyday transactions.