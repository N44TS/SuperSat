const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

// Set the refresh token
oauth2Client.setCredentials({
  refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
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
  await youtube.liveChatMessages.delete({
    id: messageId,
    auth: oauth2Client
  });
}

module.exports = {
  youtube,
  oauth2Client,
  getLiveChatId,
  deleteMessage
};