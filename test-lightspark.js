// sandbox
require('dotenv').config();
const { AccountTokenAuthProvider, LightsparkClient } = require('@lightsparkdev/lightspark-sdk');

const API_TOKEN_CLIENT_ID = process.env.LIGHTSPARK_API_TOKEN_ID;
const API_TOKEN_CLIENT_SECRET = process.env.LIGHTSPARK_API_TOKEN_SECRET;
const NODE_ID = process.env.LIGHTSPARK_NODE_ID;

if (!API_TOKEN_CLIENT_ID || !API_TOKEN_CLIENT_SECRET || !NODE_ID) {
  throw new Error("Missing LIGHTSPARK_API_TOKEN_ID, LIGHTSPARK_API_TOKEN_SECRET, or LIGHTSPARK_NODE_ID");
}

const client = new LightsparkClient(
  new AccountTokenAuthProvider(
    API_TOKEN_CLIENT_ID,
    API_TOKEN_CLIENT_SECRET
  )
);

const generateMetadataForUser = (username, lightningAddress) => {
  return JSON.stringify([
    ["text/plain", `Pay ${username} on Lightspark`],
    ["text/identifier", lightningAddress],
  ]);
};

async function createInvoiceForLightningAddress(lightningAddress, amountSats, memo) {
  try {
    const [username, domain] = lightningAddress.split('@');
    const amountMsats = amountSats * 1000; // Convert sats to msats
    const metadata = generateMetadataForUser(username, lightningAddress);

    console.log(`Creating invoice for ${lightningAddress} with amount ${amountMsats} msats`);
    const invoice = await client.createLnurlInvoice(
      NODE_ID,
      amountMsats,
      metadata
    );

    if (!invoice) {
      throw new Error("Invoice creation failed.");
    }

    console.log('Invoice created successfully');
    return invoice.data.encodedPaymentRequest;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
}

const testLightningAddress = 'user@getalby.com'; 
const testAmount = 1000; // 1000 sats
const testMemo = 'Test superchat payment';

createInvoiceForLightningAddress(testLightningAddress, testAmount, testMemo)
  .then(invoice => {
    console.log('Successfully created invoice:', invoice);
  })
  .catch(error => {
    console.error('Failed to create invoice:', error.message);
  });