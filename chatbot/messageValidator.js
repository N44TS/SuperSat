const fs = require('fs');
const path = require('path');

const validMessagesFile = path.join(__dirname, 'validMessages.json');

// Load valid messages from file on startup
let validMessages = new Set();
if (fs.existsSync(validMessagesFile)) {
    const validMessagesArray = JSON.parse(fs.readFileSync(validMessagesFile, 'utf8'));
    validMessages = new Set(validMessagesArray);
}

function addValidMessage(message) {
    validMessages.add(message);
    // Save the updated valid messages to file
    fs.writeFileSync(validMessagesFile, JSON.stringify(Array.from(validMessages)), 'utf8');
    
    // Remove the message after 10 minutes
    setTimeout(() => {
        validMessages.delete(message);
        // Save the updated valid messages to file
        fs.writeFileSync(validMessagesFile, JSON.stringify(Array.from(validMessages)), 'utf8');
    }, 10 * 60 * 1000);
}

function isValidMessage(message) {
    return validMessages.has(message);
}

function isSuperchatFormat(message) {
    const regex = /^⚡+ 𝗦𝗨𝗣𝗘𝗥𝗖𝗛𝗔𝗧 \[\d+ 𝗦𝗔𝗧𝗦\]: .+/;
    return regex.test(message);
}

module.exports = { addValidMessage, isValidMessage, isSuperchatFormat };