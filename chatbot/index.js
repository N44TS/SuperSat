const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const port = 3001;

app.use(bodyParser.json());

app.post('/post-message', (req, res) => {
    const { message } = req.body;
    console.log('Bot received message:', message);
    // Here you would add code to post the message to the live chat
    res.json({ status: 'Message posted by bot' });
});

app.listen(port, () => {
    console.log(`Bot server running at http://localhost:${port}`);
});