const { youtube, oauth2Client, getLiveChatId, deleteMessage } = require('./index');
const { isValidMessage, isSuperchatFormat } = require('./messageValidator');

let monitoringIntervals = new Map();

async function monitorLiveChat(videoId) {
    if (monitoringIntervals.has(videoId)) {
        console.log(`Already monitoring video ${videoId}`);
        return;
    }

    try {
        const liveChatId = await getLiveChatId(videoId);
        console.log(`Starting to monitor live chat for video ${videoId}`);

        const intervalId = setInterval(async () => {
            try {
                const response = await youtube.liveChatMessages.list({
                    auth: oauth2Client,
                    liveChatId: liveChatId,
                    part: 'snippet',
                });

                for (const message of response.data.items) {
                    const messageText = message.snippet.textMessageDetails.messageText;
                    if (!isValidMessage(messageText) && !isSuperchatFormat(messageText)) {
                        console.log(`Attempting to delete message: ${message.id}`);
                        try {
                            await deleteMessage(message.id, liveChatId);
                        } catch (error) {
                            console.error(`Error deleting message: ${error.message}`);
                        }
                    }
                }
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

    } catch (error) {
        console.error('Error starting live chat monitor:', error);
    }
}

module.exports = { monitorLiveChat };