const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

console.log('YOUTUBE_CLIENT_ID:', process.env.YOUTUBE_CLIENT_ID);
console.log('YOUTUBE_CLIENT_SECRET:', process.env.YOUTUBE_CLIENT_SECRET);
console.log('YOUTUBE_REDIRECT_URI:', process.env.YOUTUBE_REDIRECT_URI);
console.log('YOUTUBE_REFRESH_TOKEN:', process.env.YOUTUBE_REFRESH_TOKEN);

const oauth2Client = new OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
  scope: 'https://www.googleapis.com/auth/youtube.force-ssl'
});

const youtube = google.youtube({
  version: 'v3',
  auth: oauth2Client
});

async function getLiveChatId(videoId) {
  const response = await youtube.videos.list({
    part: 'liveStreamingDetails',
    id: videoId
  });

  const liveStreamingDetails = response.data.items[0].liveStreamingDetails;
  return liveStreamingDetails.activeLiveChatId;
}

async function deleteMessage(messageId, liveChatId) {
  try {
    await youtube.liveChatMessages.delete({
      id: messageId,
      auth: oauth2Client
    });
    console.log(`Deleted message: ${messageId}`);
  } catch (error) {
    console.error(`Error deleting message ${messageId}:`, error);
  }
}

async function postToYouTubeChat(message, liveChatId) {
  await youtube.liveChatMessages.insert({
    part: 'snippet',
    requestBody: {
      snippet: {
        liveChatId: liveChatId,
        type: 'textMessageEvent',
        textMessageDetails: {
          messageText: message
        }
      }
    }
  });
}

module.exports = {
  youtube,
  oauth2Client,
  getLiveChatId,
  deleteMessage,
  postToYouTubeChat
};