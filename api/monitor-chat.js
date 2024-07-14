import { youtube, oauth2Client, getLiveChatId, deleteMessage } from '../chatbot/index';
import { isValidMessage, isSuperchatFormat } from '../chatbot/messageValidator';

export default async function handler(req, res) {
  const { videoId } = req.query;
  if (!videoId) return res.status(400).json({ error: 'Video ID required' });

  try {
    const liveChatId = await getLiveChatId(videoId);
    const response = await youtube.liveChatMessages.list({
      auth: oauth2Client,
      liveChatId,
      part: 'snippet',
    });

    for (const message of response.data.items) {
      const messageText = message.snippet.textMessageDetails.messageText;
      if (isSuperchatFormat(messageText) && !isValidMessage(messageText)) {
        await deleteMessage(message.id, liveChatId);
      }
    }

    res.status(200).json({ success: true, messagesChecked: response.data.items.length });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to monitor chat' });
  }
}