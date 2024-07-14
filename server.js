const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const { AccountTokenAuthProvider, LightsparkClient, InvoiceType, BitcoinNetwork } = require("@lightsparkdev/lightspark-sdk");
const { google } = require('googleapis');
const cors = require('cors');
const { monitorLiveChat } = require('./chatbot/messageMonitor');

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
const { createInvoice, checkInvoiceStatus } = require('./webapp/index');
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
        //  const invoice = await createInvoice(amount, message, lightsparkClient);
        // use the creator lightningAddress to create an invoice
        // that can be paid to the specific creator's wallet. 
        const invoice = await createTestModeInvoice(amount, message, lightningAddress);
        res.json({ invoice, status: 'Invoice created' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ status: 'Error creating invoice', error: error.message });
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
    console.log('Generating short URL for:', { videoId, lightningAddress });
    const shortCode = generateShortCode();
    shortUrls.set(shortCode, { videoId, lightningAddress });
    console.log('Short URL generated:', shortCode);
    
    // Start monitoring immediately
    monitorLiveChat(videoId).catch(error => {
        console.error('Failed to start monitoring: ' + error.message);
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

app.post('/start-monitoring', async (req, res) => {
    const { videoId } = req.body;
    console.log('Starting monitoring for video ID:', videoId);
    try {
        const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3001'}/api/monitor-chat?videoId=${videoId}`);
        if (!response.ok) {
            throw new Error('Failed to start monitoring');
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Failed to start monitoring:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

async function createTestModeInvoice(amount, message, lightningAddress) {
     // Use creator lightning address for invoice
     //const memo = `${message} | Creator: ${lightningAddress}`;
    
     // In prod, change to use an actual invoice
     // For demo purposes, we're returning a dummy invoice string for payment due to lightsparks own testnest(Regtest)
    // return `lnbc${amount}n1p38q3g0sp5zyg3...${Buffer.from(memo).toString('base64')}`;
    try {
        const account = await lightsparkClient.getCurrentAccount();
        if (!account) {
            throw new Error("Unable to get account");
        }
        const nodes = await account.getNodes(lightsparkClient, undefined, [BitcoinNetwork.REGTEST]);
        if (nodes.entities.length === 0) {
            throw new Error("No nodes found for this account on REGTEST");
        }
        const nodeId = nodes.entities[0].id;

        // Create Lightspark SDK test mode invoice
        const testInvoice = await lightsparkClient.createTestModeInvoice(
            nodeId,
            amount * 1000, // Convert to millisatoshis
            `${message} | Creator: ${lightningAddress}` // Include creator's address in memo
        );

        if (!testInvoice) {
            throw new Error("Unable to create the test invoice.");
        }

        console.log(`Test invoice created: ${testInvoice}`);
        return testInvoice;
    } catch (error) {
        console.error("Error creating test mode invoice:", error);
        throw error;
    }
}


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