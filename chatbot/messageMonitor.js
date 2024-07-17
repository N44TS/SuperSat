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
        if (error.message === 'No live stream found for this video ID') {
            console.log(`No live stream found for video ${videoId}. Skipping monitoring.`);
        } else {
            // Handle other errors if needed
        }
    }
}

async function checkLiveChatMessages(videoId, liveChatId) {
    try {
        // Check if the live stream is still active
        const videoResponse = await youtube.videos.list({
            auth: oauth2Client,
            part: 'liveStreamingDetails',
            id: videoId
        });

        if (videoResponse.data.items.length === 0 || 
            !videoResponse.data.items[0].liveStreamingDetails || 
            !videoResponse.data.items[0].liveStreamingDetails.activeLiveChatId ||
            videoResponse.data.items[0].liveStreamingDetails.actualEndTime) {
            console.log('Live stream ended or not found. Stopping monitor.');
            stopMonitoring(videoId);
            return;
        }

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
    const messageId = message.id;

    console.log('Processing message:', messageText);

    if (isSuperchatFormat(messageText)) {
        console.log('Message is in superchat format:', messageText);
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
    } else if (messageText.startsWith('⚡')) {
        // Invalid superchat
        console.log('Fake superchat detected:', messageText);
        await deleteMessage(messageId, liveChatId);
        console.log('Fake superchat deleted');
    }
}

//hopefully just a fallback, just incase to make sure i dont use up all my api quota
function handleError(error, videoId) {
    console.error('Error fetching live chat messages:', error.message);
    if (error.code === 404 || error.response?.status === 404 || error.message.includes('liveChatNotFound')) {
        console.log('Live stream ended. Stopping monitor.');
    } else {
        console.log(`Stopping monitor for video ${videoId} due to error:`, error.message);
    }
    stopMonitoring(videoId);
}

function stopMonitoring(videoId) {
    if (monitoringIntervals.has(videoId)) {
        clearInterval(monitoringIntervals.get(videoId));
        monitoringIntervals.delete(videoId);
        lastCheckedMessageId.delete(videoId);
        console.log(`Stopped monitoring for video ${videoId}`);
    }
}

module.exports = { monitorLiveChat, stopMonitoring };