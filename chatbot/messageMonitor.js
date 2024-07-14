const { youtube, oauth2Client, getLiveChatId, deleteMessage } = require('./index');
const { isValidMessage, isSuperchatFormat } = require('./messageValidator');

let monitoringIntervals = new Map();

async function monitorLiveChat(videoId) {
    console.log(`Starting to monitor chat for video ${videoId}`);
    const liveChatId = await getLiveChatId(videoId);
    console.log(`Got live chat ID: ${liveChatId}`);

    const intervalId = setInterval(async () => {
        try {
            const response = await youtube.liveChatMessages.list({
                auth: oauth2Client,
                liveChatId: liveChatId,
                part: 'snippet',
            });

            response.data.items.forEach(async (message) => {
                console.log(`Processing message: ${message.snippet.displayMessage}`);
                if (!isValidMessage(message.snippet.displayMessage)) {
                    console.log(`Invalid message detected: ${message.snippet.displayMessage}`);
                    try {
                        await deleteMessage(message.id, liveChatId);
                    } catch (error) {
                        console.error(`Error deleting message: ${error.message}`);
                    }
                } else {
                    console.log(`Valid message: ${message.snippet.displayMessage}`);
                }
            });

        } catch (error) {
            console.error('Error fetching live chat messages:', error);
            if (error.code === 403) {
                console.log('Live stream ended or bot removed. Stopping monitor.');
                clearInterval(intervalId);
                monitoringIntervals.delete(videoId);
            }
        }
    }, 10000); // Check every 10 seconds

    monitoringIntervals.set(videoId, intervalId);

    // Stop monitoring after 6 hours
    setTimeout(() => {
        clearInterval(intervalId);
        monitoringIntervals.delete(videoId);
        console.log(`Monitoring stopped for video ${videoId} after 6 hours`);
    }, 6 * 60 * 60 * 1000);

}

module.exports = { monitorLiveChat };