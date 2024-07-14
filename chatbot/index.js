const { youtube, oauth2Client, getLiveChatId, deleteMessage } = require('../chatbot/index');
const { isValidMessage } = require('../chatbot/messageValidator');

let lastCheckedMessageId = '';

module.exports = async function handler(req, res) {
  const { videoId } = req.query;

  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  try {
    const liveChatId = await getLiveChatId(videoId);
    const response = await youtube.liveChatMessages.list({
      auth: oauth2Client,
      liveChatId: liveChatId,
      part: 'snippet,id',
      pageToken: lastCheckedMessageId ? undefined : null,
    });

    for (const message of response.data.items) {
      if (!isValidMessage(message.snippet.displayMessage)) {
        await deleteMessage(message.id, liveChatId);
      }
    }

    if (response.data.items.length > 0) {
      lastCheckedMessageId = response.data.items[response.data.items.length - 1].id;
    }

    res.status(200).json({ success: true, messagesChecked: response.data.items.length });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to monitor chat' });
  }
};