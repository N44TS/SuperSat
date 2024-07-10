import express from 'express';
import { AccountTokenAuthProvider, LightsparkClient, InvoiceType, BitcoinNetwork } from "@lightsparkdev/lightspark-sdk";
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

const lightsparkClient = new LightsparkClient(
    new AccountTokenAuthProvider(
        process.env.LIGHTSPARK_API_TOKEN_ID,
        process.env.LIGHTSPARK_API_TOKEN_SECRET
    ),
    undefined,
    { network: 'REGTEST' }
);

app.post('/create-invoice', async (req, res) => {
    const { message, amount } = req.body;
    try {
        const account = await lightsparkClient.getCurrentAccount();
        if (!account) {
            throw new Error("Unable to get account");
        }
        const nodes = await account.getNodes(lightsparkClient);
        if (nodes.entities.length === 0) {
            throw new Error("No nodes found for this account");
        }
        const nodeId = nodes.entities[0].id;
        const invoice = await lightsparkClient.createInvoice(
            nodeId,
            amount * 1000, // Convert sats to msats
            message,
            InvoiceType.STANDARD
        );
        console.log("Invoice created:", invoice);
        
        if (!invoice) {
            throw new Error("Unable to create the invoice.");
        }

        const decodedInvoice = await lightsparkClient.decodeInvoice(invoice);
        if (!decodedInvoice) {
            throw new Error("Unable to decode the invoice.");
        }

        res.json({
            invoice: invoice,
            invoiceId: decodedInvoice.paymentHash,
            amount: decodedInvoice.amount.originalValue,
            message: decodedInvoice.memo
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ status: 'Error creating invoice', error: error.message });
    }
});

app.get('/check-invoice/:invoiceId', async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const account = await lightsparkClient.getCurrentAccount();
        if (!account) {
            throw new Error("Unable to get account");
        }
        const transactions = await account.getTransactions(
            lightsparkClient,
            1,
            undefined,
            undefined,
            undefined,
            undefined,
            BitcoinNetwork.REGTEST
        );
        const paid = transactions.entities.some(tx => 
            tx.paymentRequest && tx.paymentRequest.paymentHash === invoiceId && tx.status === 'SUCCESS'
        );
        res.json({ paid });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ status: 'Error checking invoice', error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});