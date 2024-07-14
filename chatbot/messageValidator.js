const validMessages = new Set();

function addValidMessage(message) {
    validMessages.add(message);
    // Remove the message after 10 minutes
    setTimeout(() => {
        validMessages.delete(message);
    }, 10 * 60 * 1000);
}

function isValidMessage(message) {
    return validMessages.has(message) || isSuperchatFormat(message);
}

function isSuperchatFormat(message) {
    const regex = /^⚡ Superchat \(\d+ sats\):/;
    return regex.test(message);
}

module.exports = { addValidMessage, isValidMessage, isSuperchatFormat };