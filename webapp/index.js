import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { AccountTokenAuthProvider, LightsparkClient, InvoiceType, BitcoinNetwork } from "@lightsparkdev/lightspark-sdk";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

const lightsparkClient = new LightsparkClient(
    new AccountTokenAuthProvider(
        process.env.LIGHTSPARK_API_TOKEN_ID,
        process.env.LIGHTSPARK_API_TOKEN_SECRET
    )
);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function createInvoice(amount, memo) {
    try {
        const account = await lightsparkClient.getCurrentAccount();
        if (!account) {
            throw new Error("Unable to get account");
        }

        const nodes = await account.getNodes(lightsparkClient, undefined, [BitcoinNetwork.REGTEST]);
        if (nodes.entities.length === 0) {
            throw new Error("No REGTEST nodes found for this account");
        }

        const nodeId = nodes.entities[0].id;
        const amountMsats = amount * 1000; // Convert sats to msats

        const invoice = await lightsparkClient.createInvoice(
            nodeId,
            amountMsats,
            memo,
            InvoiceType.STANDARD,
            undefined,
            BitcoinNetwork.REGTEST
        );

        console.log("Full invoice object:", JSON.stringify(invoice, null, 2));

        if (typeof invoice === 'string') {
            return invoice; // The invoice is already the encoded payment request
        } else if (invoice && invoice.data && invoice.data.encoded_payment_request) {
            return invoice.data.encoded_payment_request;
        } else {
            throw new Error("Invalid invoice structure returned");
        }
    } catch (error) {
        console.error("Error creating invoice:", error);
        throw error;
    }
}

app.post('/send-message', async (req, res) => {
    const { message, amount } = req.body;
    console.log('Received message:', message);
    console.log('Amount:', amount);

    try {
        const invoice = await createInvoice(amount, message);
        
        try {
            await axios.post('http://localhost:3001/post-message', { message });
        } catch (botError) {
            console.error('Error posting message to bot:', botError);
            // Continue even if bot is not available
        }

        res.json({ invoice, status: 'Invoice created' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ status: 'Error creating invoice' });
    }
});

async function checkInvoiceStatus(invoice) {
    try {
        const account = await lightsparkClient.getCurrentAccount();
        if (!account) {
            throw new Error("Unable to get account");
        }

        console.log("Attempting to use REGTEST...");
        const nodes = await account.getNodes(lightsparkClient, undefined, [BitcoinNetwork.REGTEST]);
        
        if (nodes.entities.length === 0) {
            throw new Error("No nodes found for this account on REGTEST");
        }

        const nodeId = nodes.entities[0].id;

        const invoiceData = await lightsparkClient.executeRawQuery(`
            query GetInvoice($invoice: String!, $nodeId: ID!) {
                invoice(encoded_payment_request: $invoice, node_id: $nodeId) {
                    status
                }
            }
        `, {
            invoice: invoice,
            nodeId: nodeId,
        });

        console.log("Invoice data:", JSON.stringify(invoiceData, null, 2));

        if (invoiceData.invoice) {
            return { paid: invoiceData.invoice.status === 'PAID', expired: invoiceData.invoice.status === 'EXPIRED' };
        } else {
            throw new Error("Invoice not found");
        }
    } catch (error) {
        console.error("Error checking invoice status:", error);
        throw error;
    }
}

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
    const { invoice } = req.body;
    try {
        // In a real scenario, you'd update the invoice status in your database
        // For demo purposes, we'll just return a success response
        // You might want to add a delay here to simulate processing time
        setTimeout(() => {
            res.json({ success: true, message: 'Payment simulated successfully' });
        }, 2000); // 2 second delay
    } catch (error) {
        console.error('Error simulating payment:', error);
        res.status(500).json({ success: false, message: 'Error simulating payment' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});