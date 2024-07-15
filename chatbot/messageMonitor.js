const { youtube, oauth2Client, getLiveChatId, deleteMessage } = require('./index');
const { isValidMessage, isSuperchatFormat } = require('./messageValidator');
const fs = require('fs');
const path = require('path');

// Store active monitoring intervals
const monitoringIntervals = new Map();
// Store the last checked message ID for each video
const lastCheckedMessageId = new Map();
// File path for storing valid superchats
const validSuperchatsFile = path.join(__dirname, 'validSuperchats.json');

// Load valid superchats from file
let validSuperchats = {};
if (fs.existsSync(validSuperchatsFile)) {
    validSuperchats = JSON.parse(fs.readFileSync(validSuperchatsFile, 'utf8'));
}

async function monitorLiveChat(videoId) {
    // Check if we're already monitoring this video
    if (monitoringIntervals.has(videoId)) {
        console.log(`Already monitoring video ${videoId}`);
        return;
    }

    try {
        // Get the live chat ID for the video
        const liveChatId = await getLiveChatId(videoId);
        console.log(`Starting to monitor live chat for video ${videoId}`);

        // Set up an interval to check for new messages every 10 seconds
        const intervalId = setInterval(() => checkLiveChatMessages(videoId, liveChatId), 10000);
        monitoringIntervals.set(videoId, intervalId);
    } catch (error) {
        console.error('Error starting live chat monitor:', error);
    }
}

async function checkLiveChatMessages(videoId, liveChatId) {
    try {
        // Fetch new messages since the last check
        const response = await youtube.liveChatMessages.list({
            auth: oauth2Client,
            liveChatId: liveChatId,
            part: 'snippet,id',
            pageToken: lastCheckedMessageId.get(videoId)
        });

        // Update the last checked message ID
        lastCheckedMessageId.set(videoId, response.data.nextPageToken);

        // Process each new message
        for (const message of response.data.items) {
            await processMessage(message, liveChatId, videoId);
        }
    } catch (error) {
        handleError(error, videoId);
    }
}

async function processMessage(message, liveChatId, videoId) {
    const messageText = message.snippet.textMessageDetails.messageText;
    if (isSuperchatFormat(messageText)) {
        const messageId = message.id;
        // Check if this superchat was previously validated
        if (validSuperchats[videoId] && validSuperchats[videoId].includes(messageId)) {
            console.log('Previously validated superchat:', messageText);
        } else if (isValidMessage(messageText)) {
            // New valid superchat
            console.log('Valid superchat detected:', messageText);
            if (!validSuperchats[videoId]) {
                validSuperchats[videoId] = [];
            }
            validSuperchats[videoId].push(messageId);
            // Save the updated valid superchats to file
            fs.writeFileSync(validSuperchatsFile, JSON.stringify(validSuperchats, null, 2));
        } else {
            // Invalid superchat
            console.log('Fake superchat detected:', messageText);
            await deleteMessage(messageId, liveChatId);
            console.log('Fake superchat deleted');
        }
    }
}

function handleError(error, videoId) {
    console.error('Error fetching live chat messages:', error);
    if (error.code === 403) {
        // Live stream ended or bot removed
        console.log('Live stream ended or bot removed. Stopping monitor.');
        clearInterval(monitoringIntervals.get(videoId));
        monitoringIntervals.delete(videoId);
        lastCheckedMessageId.delete(videoId);
    }
}

module.exports = { monitorLiveChat };