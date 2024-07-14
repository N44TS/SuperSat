const { youtube, oauth2Client, getLiveChatId, deleteMessage } = require('./index');
const { isValidMessage, isSuperchatFormat } = require('./messageValidator');

async function checkLiveChat(videoId) {
    try {
        const liveChatId = await getLiveChatId(videoId);
        const response = await youtube.liveChatMessages.list({
            auth: oauth2Client,
            liveChatId: liveChatId,
            part: 'snippet',
        });

        let deletedCount = 0;
        for (const message of response.data.items) {
            const messageText = message.snippet.textMessageDetails.messageText;
            console.log('Checking message:', messageText);
            console.log('Is superchat format:', isSuperchatFormat(messageText));
            console.log('Is valid message:', isValidMessage(messageText));
            if (isSuperchatFormat(messageText) && !isValidMessage(messageText)) {
                console.log('Fake superchat detected:', messageText);
                await deleteMessage(message.id, liveChatId);
                console.log('Fake superchat deleted');
                deletedCount++;
            }
        }

        return { checked: response.data.items.length, deleted: deletedCount };
    } catch (error) {
        console.error('Error checking live chat:', error);
        throw error;
    }
}

module.exports = { checkLiveChat };