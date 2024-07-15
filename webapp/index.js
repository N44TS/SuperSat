const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const { AccountTokenAuthProvider, LightsparkClient, InvoiceType, BitcoinNetwork } = require("@lightsparkdev/lightspark-sdk");

// Load .env file from the root directory
// dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config();

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

// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'creator.html'));
// });

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
        const account = await lightsparkClient.getCurrentAccount();
        if (!account) {
            throw new Error("Unable to get account");
        }
        const nodes = await account.getNodes(lightsparkClient, undefined, [BitcoinNetwork.REGTEST]);
        if (nodes.entities.length === 0) {
            throw new Error("No nodes found for this account on REGTEST");
        }
        const nodeId = nodes.entities[0].id;

        const invoice = await lightsparkClient.createInvoice(
            nodeId,
            amount * 1000, // Convert to millisatoshis
            memo,
            InvoiceType.STANDARD
        );

        if (!invoice) {
            throw new Error("Unable to create the invoice.");
        }

        console.log(`Invoice created: ${invoice}`);
        return invoice;
    } catch (error) {
        console.error("Error creating invoice:", error);
        throw error;
    }
}

app.post('/send-message', async (req, res) => {
    const { message, amount, videoId, lightningAddress } = req.body;
    console.log('Received message:', message);
    console.log('Amount:', amount);
    console.log('Video ID:', videoId);
    console.log('Lightning Address:', lightningAddress);

    try {
        // use the creator lightningAddress to create an invoice
        // that can be paid to the specific creator's wallet. 
        const invoice = await createInvoice(amount, `${message}${lightningAddress ? ` | LN:${lightningAddress}` : ''}`);

        // for testing purposes to log the real invoice
        console.log('Real invoice (not used yet):', invoice);

        // Get live chat ID
        console.log('Getting live chat ID for video:', videoId);
        const liveChatId = await getLiveChatId(videoId);
        console.log('Live chat ID obtained:', liveChatId);

        // Prepare and post message to YouTube chat
        const fullMessage = `⚡ Superchat (${amount} sats): ${message}`;
        console.log('Prepared message:', fullMessage);
        console.log('Posting message to YouTube chat...');
        await postToYouTubeChat(fullMessage, liveChatId);
        console.log('Message posted successfully');

        addValidMessage(fullMessage);

        // Process the payment before checking the invoice status
        console.log('Processing payment...');
        const paymentResponse = await processPayment(invoice, amount);
        console.log('Payment processed:', paymentResponse);

        // Check the invoice status after processing the payment
        const invoiceStatus = await checkInvoiceStatus(invoice, lightsparkClient);
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

async function checkInvoiceStatus(invoice, lightsparkClient) {
    try {
        console.log("Checking invoice status for:", invoice);
        const response = await lightsparkClient.executeRawQuery(`
            query GetInvoice($invoice: String!) {
                decoded_payment_request(encoded_payment_request: $invoice) {
                    __typename
                    ... on Invoice {
                        status
                        amount {
                            original_value
                            original_unit
                        }
                        paid_amount {
                            original_value
                            original_unit
                        }
                    }
                }
            }
        `, {
            invoice: invoice,
        });

        console.log("Full invoice data response:", JSON.stringify(response, null, 2));

        if (response && response.data && response.data.decoded_payment_request) {
            const decodedRequest = response.data.decoded_payment_request;
            if (decodedRequest.__typename === 'Invoice') {
                const status = decodedRequest.status;
                const amount = decodedRequest.amount?.original_value;
                const paidAmount = decodedRequest.paid_amount?.original_value;
                console.log(`Invoice status: ${status}, Amount: ${amount}, Paid Amount: ${paidAmount}`);
                return {
                    paid: status === 'PAID' || (paidAmount && paidAmount >= amount),
                    expired: status === 'EXPIRED',
                    status: status,
                    amount: amount,
                    paidAmount: paidAmount
                };
            } else {
                console.error("Unexpected decoded_payment_request type:", decodedRequest.__typename);
                return { paid: false, expired: false, error: "Unexpected decoded_payment_request type" };
            }
        } else {
            console.error("Unexpected response structure:", response);
            return { paid: false, expired: false, error: "Unexpected response structure" };
        }
    } catch (error) {
        console.error("Error checking invoice status:", error);
        return { paid: false, expired: false, error: error.message };
    }
}

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
            await axios.post(`${process.env.VERCEL_URL || 'http://localhost:3001'}/post-message`, { 
                message: `⚡ Superchat (${amount} sats): ${message}`,
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

// At the end of server.js
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  }).on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
}

module.exports = app;

// Add these lines at the end of the file
module.exports = {
    createInvoice,
    checkInvoiceStatus
};