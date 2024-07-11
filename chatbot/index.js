const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const youtube = google.youtube('v3');
const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
);

oauth2Client.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
});

async function postToYouTubeChat(message, liveChatId) {
    await youtube.liveChatMessages.insert({
        auth: oauth2Client,
        part: 'snippet',
        resource: {
            snippet: {
                type: 'textMessageEvent',
                liveChatId: liveChatId,
                textMessageDetails: {
                    messageText: message
                }
            }
        }
    });
}

async function getLiveChatId(videoId) {
    const response = await youtube.videos.list({
        auth: oauth2Client,
        part: 'liveStreamingDetails',
        id: videoId
    });

    if (response.data.items.length === 0 || !response.data.items[0].liveStreamingDetails) {
        throw new Error('No live stream found for this video ID');
    }

    return response.data.items[0].liveStreamingDetails.activeLiveChatId;
}

module.exports = {
  postToYouTubeChat,
  getLiveChatId
};