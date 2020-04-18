const socket = io();

function sendMessage(event) {
    // Prevent the page from reloading.
    event.preventDefault();

    const message = document.getElementById("message");
    socket.emit('chat message', message.value);
    message.value = "";

    return false;
}

function addMessage(message) {
    const messages = document.getElementById("messages");
    const messageListItem = document.createElement("li");
    messageListItem.innerHTML = message;
    messages.appendChild(messageListItem);
}

function processHistory(history) {
    const chats = JSON.parse(history);
    for (let i = 0; i < chats.length; ++i) {
        addMessage(chats[i]);
    }
}

function loadChatApp() {
    const form = document.getElementById("message-form");
    form.onsubmit = sendMessage;

    socket.on('chat message', addMessage);
    socket.on('chat history', processHistory);
}
