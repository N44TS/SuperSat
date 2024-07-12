Based on the error message you've provided, the issue is clear: your Lightspark account has the necessary permissions for TESTNET operations, but there are no TESTNET nodes set up in your account. Here's a breakdown of what's happening:

    The code is successfully detecting that you have TESTNET permissions (TESTNET_VIEW and TESTNET_TRANSACT).
    However, when it tries to find TESTNET nodes in your account, it doesn't find any.
    Because you have TESTNET permissions, the code is designed to prioritize TESTNET and not fall back to REGTEST in this case.

To resolve this issue, you need to set up a TESTNET node in your Lightspark account. Here's what you should do:

    Log into your Lightspark dashboard.
    Look for an option to create a new node or manage existing nodes.
    Create a new node, specifically selecting the Bitcoin TESTNET as the network.
    Follow the setup process, which may include funding the node with testnet bitcoin.

If you're unable to find the option to create a TESTNET node, or if you're encountering any issues during the setup process, you should contact Lightspark support for assistance. They can guide you through the process of setting up a TESTNET node for your account.

In the meantime, if you need your application to work immediately and you're okay with using REGTEST instead of TESTNET, we can modify the code to fall back to REGTEST even when TESTNET permissions are present. Here's how we can update the createInvoice function to do this:

You should make a similar change to the checkInvoiceStatus function:

These changes will allow your application to fall back to REGTEST if no TESTNET nodes are found, regardless of the permissions. This should allow your application to work immediately.

However, I strongly recommend setting up a TESTNET node in your Lightspark account as soon as possible if you intend to use TESTNET. The REGTEST fallback should be considered a temporary solution.
N

the problem i have with regtest is i cant test it as i dont want to download anything onto my laptop and there arent any regtest wallets. But bigger problem is lightspark doesnt allow changing nodes.
Is there anythgin in the example docs that show how create a regtest wallet wth them where my test funcs can pay my own invoice?
2 / 2

I understand your concerns about REGTEST and the limitations you're facing. Let's explore the options based on the example documents you provided earlier.

After reviewing the examplesdk.ts file, I found a relevant section that demonstrates creating a test mode invoice and paying it. We can adapt this approach for your use case. Here's how we can modify your createInvoice function to use test mode invoices:

This updated function does the following:

    It uses REGTEST network, which is suitable for test mode invoices.
    It creates a test mode invoice using createTestModeInvoice.
    It automatically pays the invoice using payInvoice.
    It returns both the invoice and the payment information.

You'll need to update your route handler to work with this new function:

You'll also need to update the checkInvoiceStatus function, although it may not be necessary if you're automatically paying the test invoices:

These changes will allow you to create and pay test mode invoices without needing to download anything or use external wallets. It uses the REGTEST network, which is suitable for this kind of testing.

Remember to update your error handling and logging as needed to work with these changes. Also, make sure you have the necessary permissions to create and pay test mode invoices on your Lightspark account.

This approach should allow you to test your invoice creation and payment process without the need for external wallets or changing nodes in Lightspark. However, keep in mind that this is using test mode and REGTEST, so it's not a full simulation of a real-world scenario on TESTNET or MAINNET.
N

so your saying the api will let me create a testnet invoice that accepts testnet even if though i am unalbe to change the node to a testnet node?
will it only be payable from creating a payment within lightspark, rather than from a wallet running testnet? just give a quick answer
the js (not node) api docs say this about it:
Create Test Mode Invoice
In test mode, this function generates a Lightning Invoice payable to the Lightspark test node that your node has an open channel with.
Parameters
CreateTestModeInvoiceInputFields (4)
local_node_id
ID
amount_msats
Long
memo
String (optional)
invoice_type
InvoiceType (optional)
Returns
CreateTestModeInvoiceOutputFields (1)
encoded_payment_request
String

Create Test Mode Payment
In test mode, this function simulates sending a payment from a Lightspark test node to your Lightspark node given an invoice.
Parameters
CreateTestModePaymentInputFields (3)
local_node_id
ID
The node to where you want to send the payment.
encoded_invoice
String
The invoice you want to be paid (as defined by the BOLT11 standard).
amount_msats
Long (optional)
The amount you will be paid for this invoice, expressed in msats. It should ONLY be set when the invoice amount is zero.
Returns
CreateTestModePaymentoutputThis is an object identifying the output of a test mode payment. This object can be used to retrieve the associated payment made from a Test Mode Payment call.Fields (2)
payment
OutgoingPayment
The payment that has been sent.
DEPRECATED: Use incoming_payment instead.
incoming_payment
IncomingPayment
The payment that has been received.
5 / 5

You're right to seek clarification. Let me provide a quick answer based on the API documentation you've shared:

    The API allows you to create a test mode invoice on the REGTEST network, even if you can't change your node to a testnet node.
    These test mode invoices are designed to be paid within the Lightspark ecosystem, specifically by a Lightspark test node that your node has an open channel with.
    These invoices are not payable from external testnet wallets. They are specifically for testing within the Lightspark environment.
    You can simulate both creating an invoice and paying it using the Lightspark API, without needing an external wallet.
    The CreateTestModeInvoice function creates an invoice payable to a Lightspark test node.
    The CreateTestModePayment function simulates sending a payment from a Lightspark test node to your node, given an invoice.

So, in essence, this setup allows you to test the full cycle of creating and paying invoices within the Lightspark ecosystem, without needing external testnet wallets or changing your node to a testnet node. However, it's important to note that this is a simulated environment and doesn't interact with the actual Bitcoin testnet network.