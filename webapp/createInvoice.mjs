import {
  AccountTokenAuthProvider,
  InvoiceType,
  LightsparkClient,
} from "@lightsparkdev/lightspark-sdk";
import dotenv from 'dotenv';

dotenv.config();

const getCredentialsFromEnvOrThrow = () => {
  const apiTokenClientId = process.env.LIGHTSPARK_API_TOKEN_ID;
  const apiTokenClientSecret = process.env.LIGHTSPARK_API_TOKEN_SECRET;
  
  if (!apiTokenClientId || !apiTokenClientSecret) {
    throw new Error("Missing API credentials in environment variables");
  }

  return { apiTokenClientId, apiTokenClientSecret };
};

async function main() {
  try {
    const credentials = getCredentialsFromEnvOrThrow();
    const client = new LightsparkClient(
      new AccountTokenAuthProvider(
        credentials.apiTokenClientId,
        credentials.apiTokenClientSecret,
      )
    );

    console.log("Fetching account...");
    const account = await client.getCurrentAccount();
    if (!account) {
      throw new Error("Unable to get account");
    }

    console.log("Fetching nodes...");
    const nodes = await account.getNodes(client);
    if (nodes.entities.length === 0) {
      throw new Error("No nodes found for this account");
    }

    const nodeId = nodes.entities[0].id;
    console.log("Using node ID:", nodeId);

    const amountMsats = 1000; // 1 sat
    const memo = "Test Invoice";

    console.log("Creating invoice...");
    const invoice = await client.createInvoice(
      nodeId,
      amountMsats,
      memo,
      InvoiceType.STANDARD
    );

    console.log("Invoice created:", JSON.stringify(invoice, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

main();