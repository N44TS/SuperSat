# SuperSat💫 
## Lightning Network Superchat for YouTube

SuperSat integrates Lightning Network payments with YouTube live streams, allowing viewers to send sats  ( Bitcoin micropayments) directly to creators during live streams and see their superchats appear in real time on the live chat.

TLDR: a Youtube superchat alternative, where a user can pay via lightning network directly to the content creator via a popup from a url in the chat. 

Simple Setup: The creator generates a unique URL.

Easy Interaction: Users click the URL to open a popup for sending superchats.

Real-Time Display: The bot posts messages to the live chat, visible to everyone.

## Features

- Send sats directly to creators via Lightning Network
- popup payment window, so no need to leabe the stream and miss any of the live.
- Display superchats in YouTube live chat in real time
- Validates authentic SuperSat messages and remove fake one
- Flexible Payment Amounts: Viewers can choose how much to donate
- Creator dashboard to view superchats and payments coming in in real-time or historical data from previous lives (via lightspark api). 

livedemo: [Supersat](https://supersats.onrender.com) its hosted on Render free tier so if it doesnt start right away its probably asleep so please refresh. 

***For the best experience please use youtube in firefox as sometimes the popup doesnt open in other browsers (like brave). Currently implimented on Lightspark Regtest** *

## What it does / how it works

1. Creators generate a unique SuperSat link from the creator landing page.
2. The link is connected to their Lightning address and video ID, they can pin it in their livestream for visability.
2. Viewers click this link to send Sats directly to the creator's wallet via Lightning Network (and Lightspark).
3. Viewers can include a message that instantly appears as a special superchat in the YouTube live chat.
4. The system validates authentic SuperSat messages and removes fake ones.


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

## Usage

### For Creators

1. Visit the creator page
2. Enter your YouTube Live URL and Lightning address
3. Generate a unique SuperSat link
4. Pin the generated link in your YouTube live chat

### For Viewers

1. Click the SuperSat link in the live chat
2. Enter your message and the amount of sats to send
3. Pay the Lightning invoice
4. Your superchat will appear in the YouTube live chat

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in a `.env` file:
   ```
   LIGHTSPARK_API_TOKEN_ID=your_lightspark_api_token_id
   LIGHTSPARK_API_TOKEN_SECRET=your_lightspark_api_token_secret
   LIGHTSPARK_NODE_ID=your_lightspark_node_id
   YOUTUBE_CLIENT_ID=your_youtube_client_id
   YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
   YOUTUBE_REDIRECT_URI=your_youtube_redirect_uri
   YOUTUBE_REFRESH_TOKEN=your_youtube_refresh_token
   ```
4. Start the server: `npm start`


## Technologies Used

- Backend: Node.js with Express
- Frontend: HTML, CSS, and JavaScript
- Lightning Network Integration: Lightspark SDK
- YouTube API: For live chat integration

## License

[MIT License](LICENSE)

