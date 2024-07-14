import { monitorLiveChat } from '../chatbot/messageMonitor';

export default async function handler(req, res) {
  const { videoId } = req.query;

  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  try {
    await monitorLiveChat(videoId);
    res.status(200).json({ success: true, message: 'Monitoring started' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to start monitoring' });
  }
}