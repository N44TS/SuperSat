// require('dotenv').config(); // Ensure this is at the very top
const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const { AccountTokenAuthProvider, LightsparkClient, InvoiceType, BitcoinNetwork } = require("@lightsparkdev/lightspark-sdk");
const { google } = require('googleapis');
const cors = require('cors');
const { monitorLiveChat } = require('./chatbot/messageMonitor');
const { addValidMessage } = require('./chatbot/messageValidator');
const { createInvoice, checkInvoiceStatus } = require('./webapp/index');

dotenv.config();
const app = express();
const port = process.env.PORT || 3001; // Changed to 3001

app.use(express.json()); // Added this line to parse JSON in request body

const lightsparkClient = new LightsparkClient(
    new AccountTokenAuthProvider(
        process.env.LIGHTSPARK_API_TOKEN_ID,
        process.env.LIGHTSPARK_API_TOKEN_SECRET
    )
);

const youtube = google.youtube('v3');
const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
);

oauth2Client.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'webapp', 'public')));

// Include route handlers from webapp/index.js
const { postToYouTubeChat, getLiveChatId } = require('./chatbot/index');

app.use(cors());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'webapp', 'public', 'creator.html'));
});

app.get('/superchat', (req, res) => {
    res.sendFile(path.join(__dirname, 'webapp', 'public', 'chatpopup.html'));
});

app.get('/chatpopup', (req, res) => {
    res.sendFile(path.join(__dirname, 'webapp', 'public', 'chatpopup.html'));
});

app.post('/send-message', async (req, res) => {
    const { message, amount, videoId, lightningAddress } = req.body;
    console.log('Received message:', message);
    console.log('Amount:', amount);
    console.log('Video ID:', videoId);
    console.log('Lightning Address:', lightningAddress);

    try {
        const invoice = await createInvoice(amount, `${message}${lightningAddress ? ` | LN:${lightningAddress}` : ''}`);

        // for testing purposes to log the real invoice
        console.log('Real invoice (not used yet):', invoice);

           //YOUTUBE POSTING
        // // Get live chat ID
        // console.log('Getting live chat ID for video:', videoId);
        // const liveChatId = await getLiveChatId(videoId);
        // console.log('Live chat ID obtained:', liveChatId);

        // // Prepare and post message to YouTube chat
        // const fullMessage = `⚡ Superchat (${amount} sats): ${message}`;
        // console.log('Prepared message:', fullMessage);
        // console.log('Posting message to YouTube chat...');
        // await postToYouTubeChat(fullMessage, liveChatId);
        // console.log('Message posted successfully');

        // addValidMessage(fullMessage);

        //res.json({ invoice, status: 'Invoice created and message posted to YouTube chat' });

        res.json({ invoice, status: 'Invoice created' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ status: 'Error processing request', error: error.message });
    }
});

app.get('/check-invoice/:invoice', async (req, res) => {
    try {
        const status = await checkInvoiceStatus(req.params.invoice, lightsparkClient);
        res.json(status);
    } catch (error) {
        console.error('Error checking invoice status:', error);
        res.status(500).json({ error: 'Error checking invoice status' });
    }
});

app.post('/simulate-payment', async (req, res) => {
    const { invoice, message, amount, videoId } = req.body;
    console.log('Payment simulation request received:', { invoice, message, amount, videoId });
    
    try {
        console.log('Getting live chat ID for video:', videoId);
        const liveChatId = await getLiveChatId(videoId);
        console.log('Live chat ID obtained:', liveChatId);

        const fullMessage = `⚡ Superchat (${amount} sats): ${message}`;
        console.log('Prepared message:', fullMessage);

        console.log('Posting message to YouTube chat...');
        await postToYouTubeChat(fullMessage, liveChatId);
        console.log('Message posted successfully');

        addValidMessage(fullMessage);

        res.json({ success: true, message: 'Payment simulated and message posted to YouTube chat' });
    } catch (error) {
        console.error('Error in simulate-payment:', error);
        res.status(500).json({ success: false, message: 'Error processing payment', error: error.message });
    }
});

app.post('/post-message', async (req, res) => {
    const { message, videoId } = req.body;
    console.log('Bot received message:', message, 'for video ID:', videoId);
    console.log('YouTube API credentials:', {
        clientId: process.env.YOUTUBE_CLIENT_ID ? 'Set' : 'Not set',
        clientSecret: process.env.YOUTUBE_CLIENT_SECRET ? 'Set' : 'Not set',
        redirectUri: process.env.YOUTUBE_REDIRECT_URI,
        refreshToken: process.env.YOUTUBE_REFRESH_TOKEN ? 'Set' : 'Not set'
    });
    try {
        console.log('Attempting to get live chat ID...');
        const liveChatId = await getLiveChatId(videoId);
        console.log('Live chat ID obtained:', liveChatId);
        
        console.log('Attempting to post to YouTube chat...');
        await postToYouTubeChat(message, liveChatId);
        console.log('Message posted successfully');
        
        res.json({ status: 'Message posted to YouTube live chat' });
    } catch (error) {
        console.error('Error posting to YouTube:', error);
        console.error('Error details:', error.response ? error.response.data : 'No response data');
        res.status(500).json({ status: 'Error posting message', error: error.message, details: error.response ? error.response.data : 'No response data' });
    }
});

app.get('/test-youtube-api/:videoId', async (req, res) => {
    console.log('Testing YouTube API for video ID:', req.params.videoId);
    console.log('YouTube API credentials:', {
        clientId: process.env.YOUTUBE_CLIENT_ID ? 'Set' : 'Not set',
        clientSecret: process.env.YOUTUBE_CLIENT_SECRET ? 'Set' : 'Not set',
        redirectUri: process.env.YOUTUBE_REDIRECT_URI,
        refreshToken: process.env.YOUTUBE_REFRESH_TOKEN ? 'Set' : 'Not set'
    });
    try {
        const liveChatId = await getLiveChatId(req.params.videoId);
        res.json({ success: true, liveChatId });
    } catch (error) {
        console.error('Error testing YouTube API:', error);
        res.status(500).json({ success: false, error: error.message, stack: error.stack });
    }
});

const shortUrls = new Map();

function generateShortCode() {
    return Math.random().toString(36).substr(2, 6);
}

app.post('/generate-short-url', (req, res) => {
    const { videoId, lightningAddress } = req.body;
    console.log('Received request:', { videoId, lightningAddress });
    const shortCode = generateShortCode();
    shortUrls.set(shortCode, { videoId, lightningAddress });
    console.log('Generated short code:', shortCode);
    
    // Start monitoring the live chat
    monitorLiveChat(videoId).catch(error => {
        console.error('Failed to start monitoring:', error);
        // Don't throw an error here, just log it
    });
    
    res.json({ shortCode });
});

app.get('/s/:shortCode', (req, res) => {
    const { shortCode } = req.params;
    const urlData = shortUrls.get(shortCode);
    if (urlData) {
        res.redirect(`/superchat?vid=${urlData.videoId}&lnaddr=${urlData.lightningAddress}`);
    } else {
        res.status(404).send('Short URL not found');
    }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Try a different port.`);
    } else {
      console.error('An error occurred:', err);
    }
    process.exit(1);
  });
}

module.exports = app;