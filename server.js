const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const { AccountTokenAuthProvider, LightsparkClient, InvoiceType, BitcoinNetwork } = require("@lightsparkdev/lightspark-sdk");
const { google } = require('googleapis');
const cors = require('cors');

dotenv.config();
const app = express();
const port = process.env.PORT || 3001; // Changed to 3001

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
    res.sendFile(path.join(__dirname, 'webapp', 'public', 'index.html'));
});

app.get('/creator', (req, res) => {
    res.sendFile(path.join(__dirname, 'webapp', 'public', 'creator.html'));
});

app.get('/superchat', (req, res) => {
    res.sendFile(path.join(__dirname, 'webapp', 'public', 'chatpopup.html'));
});

app.post('/send-message', async (req, res) => {
    const { message, amount, videoId } = req.body;
    console.log('Received message:', message);
    console.log('Amount:', amount);
    console.log('Video ID:', videoId);

    try {
        const invoice = await createInvoice(amount, message, lightsparkClient);
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
    try {
        console.log('Payment simulated for invoice:', invoice);
        console.log('Message:', message);
        console.log('Amount:', amount);
        console.log('Video ID:', videoId);

        // Send message to YouTube chat
        try {
            const serverUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001';
            console.log('Posting to:', `${serverUrl}/post-message`);
            const response = await axios.post(`${serverUrl}/post-message`, { 
                message: `⚡ Superchat (${amount} sats): ${message}`,
                videoId: videoId
            });
            console.log('YouTube API response:', response.data);
            res.json({ success: true, message: 'Payment simulated and message posted to YouTube chat' });
        } catch (botError) {
            console.error('Error posting message to YouTube:', botError.message);
            console.error('Error details:', botError.response ? botError.response.data : 'No response data');
            res.status(500).json({ success: false, message: 'Error posting message to YouTube chat', error: botError.message, details: botError.response ? botError.response.data : 'No response data' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error processing payment', error: error.message });
    }
});

app.post('/post-message', async (req, res) => {
    const { message, videoId } = req.body;
    console.log('Bot received message:', message, 'for video ID:', videoId);
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