const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const { AccountTokenAuthProvider, LightsparkClient, InvoiceType, BitcoinNetwork } = require("@lightsparkdev/lightspark-sdk");

dotenv.config();

const nodeId = process.env.LIGHTSPARK_NODE_ID;

const app = express();
const port = process.env.PORT || 3001;

const lightsparkClient = new LightsparkClient(
    new AccountTokenAuthProvider(
        process.env.LIGHTSPARK_API_TOKEN_ID,
        process.env.LIGHTSPARK_API_TOKEN_SECRET
    )
);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/creator', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'creator.html'));
});

app.get('/superchat', (req, res) => {
    res.send(`
        <script>
            window.resizeTo(400, 600);
            window.location.href = '/chatpopup.html?vid=${req.query.vid}';
        </script>
    `);
});

async function createInvoice(amount, memo) {
    try {
        const testInvoice = await lightsparkClient.createTestModeInvoice(
            nodeId,
            amount * 1000, // Convert to millisatoshis
            memo
        );
        if (!testInvoice) {
            throw new Error("Unable to create the test invoice.");
        }
        console.log(`Invoice created: ${testInvoice}`);
        return testInvoice;
    } catch (error) {
        console.error("Error creating invoice:", error);
        throw error;
    }
}

async function checkInvoiceStatus(invoice) {
    try {
        console.log("Checking invoice status for:", invoice);
        const decodedInvoice = await lightsparkClient.decodeInvoice(invoice);
        const paymentHash = decodedInvoice.paymentHash;
        const paymentStatus = await lightsparkClient.outgoingPaymentsForPaymentHash(paymentHash);
        
        console.log("Payment status:", JSON.stringify(paymentStatus, null, 2));
        
        if (paymentStatus.length > 0 && paymentStatus[0].status === 'SUCCESS') {
            return { paid: true, status: 'PAID' };
        } else {
            return { paid: false, status: 'UNPAID' };
        }
    } catch (error) {
        console.error("Error checking invoice status:", error);
        return { paid: false, expired: false, error: error.message };
    }
}

app.post('/send-message', async (req, res) => {
    const { message, amount, videoId, lightningAddress } = req.body;
    console.log('Received message:', message);
    console.log('Amount:', amount);
    console.log('Video ID:', videoId);
    console.log('Lightning Address:', lightningAddress);

    try {
        const invoice = await createInvoice(amount, `${message}${lightningAddress ? ` | LN:${lightningAddress}` : ''}`);
        console.log('Real invoice:', invoice);

        // Get live chat ID
        console.log('Getting live chat ID for video:', videoId);
        const liveChatId = await getLiveChatId(videoId);
        console.log('Live chat ID obtained:', liveChatId);

        // Prepare and post message to YouTube chat
        const fullMessage = `⚡⚡ 𝗦𝗨𝗣𝗘𝗥𝗖𝗛𝗔𝗧 [${amount} 𝗦𝗔𝗧𝗦]: ${message.toUpperCase()}`;
        console.log('Prepared message:', fullMessage);
        console.log('Posting message to YouTube chat...');
        await postToYouTubeChat(fullMessage, liveChatId);
        console.log('Message posted successfully');

        addValidMessage(fullMessage);

        // Check the invoice status
        const invoiceStatus = await checkInvoiceStatus(invoice);
        console.log('Invoice status:', invoiceStatus);

        if (invoiceStatus.paid) {
            res.json({ invoice, status: 'Invoice paid and message posted to YouTube chat' });
        } else {
            res.status(500).json({ status: 'Error processing request', error: 'Invoice not paid' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ status: 'Error processing request', error: error.message });
    }
});

app.get('/check-invoice/:invoice', async (req, res) => {
    try {
        const status = await checkInvoiceStatus(req.params.invoice);
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
            await axios.post(`${process.env.VERCEL_URL || 'http://localhost:3001'}/post-message`, { 
                message: `⚡⚡ 𝗦𝗨𝗣𝗘𝗥𝗖𝗛𝗔𝗧 [${amount} 𝗦𝗔𝗧𝗦] ⚡⚡: ${message.toUpperCase()}`,
                videoId: videoId
            });
            res.json({ success: true, message: 'Payment simulated and message posted to YouTube chat' });
        } catch (botError) {
            console.error('Error posting message to YouTube:', botError);
            res.status(500).json({ success: false, message: 'Error posting message to YouTube chat' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error processing payment', error: error.message });
    }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  }).on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
}

module.exports = {
    createInvoice,
    checkInvoiceStatus,
    app
};