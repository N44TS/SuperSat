//node test-lightspark.js

require('dotenv').config();
const { LightsparkClient, AccountTokenAuthProvider } = require('@lightsparkdev/lightspark-sdk');

const apiTokenId = process.env.LIGHTSPARK_API_TOKEN_ID;
const apiTokenSecret = process.env.LIGHTSPARK_API_TOKEN_SECRET;
const nodeId = process.env.LIGHTSPARK_NODE_ID;

const client = new LightsparkClient(
  new AccountTokenAuthProvider(apiTokenId, apiTokenSecret)
);

async function testLightspark() {
  try {
    console.log("Using node ID:", nodeId);

    // Create a test mode invoice
    const testInvoice = await client.createTestModeInvoice(
      nodeId,
      100000, // amount in millisatoshis (100 sats)
      "Test invoice"
    );
    console.log("Created test invoice:", testInvoice);

    if (!testInvoice) {
      throw new Error("Unable to create the test invoice.");
    }

    // Decode the invoice
    console.log("Attempting to decode invoice:", testInvoice);
    const decodedInvoice = await client.decodeInvoice(testInvoice);
    console.log("Decoded invoice:", JSON.stringify(decodedInvoice, null, 2));

    // Load the node signing key
    await client.loadNodeSigningKey(nodeId, {
      password: process.env.TEST_NODE_PASSWORD,
    });
    console.log("Node signing key loaded.");

    // Pay the invoice
    console.log("Paying the invoice...");
    const payment = await client.payInvoice(nodeId, testInvoice, 100000, 60);
    if (!payment) {
      throw new Error("Unable to pay invoice.");
    }
    console.log("Payment done with ID:", payment.id);

    // Check payment status
    console.log("Checking payment status...");
    const paymentStatus = await client.outgoingPaymentsForPaymentHash(decodedInvoice.paymentHash);
    console.log("Payment status:", JSON.stringify(paymentStatus, null, 2));

  } catch (error) {
    console.error("Error:", error);
    if (error.extraInfo) {
      console.error("Extra info:", error.extraInfo);
    }
  }
}

testLightspark();