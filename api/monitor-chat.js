const { checkLiveChat } = require('../chatbot/messageMonitor');

module.exports = async (req, res) => {
  const { videoId } = req.query;
  if (!videoId) return res.status(400).json({ error: 'Video ID required' });

  try {
    const result = await checkLiveChat(videoId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to monitor chat' });
  }
};