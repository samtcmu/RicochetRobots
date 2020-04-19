const socket = io();

function sendMessage(event) {
    // Prevent the page from reloading.
    event.preventDefault();

    const message = document.getElementById("message");
    socket.emit('chat message', message.value);
    message.value = "";

    return false;
}

function setUsername(event) {
    // Prevent the page from reloading.
    event.preventDefault();

    const message = document.getElementById("username");
    socket.emit('set-username', message.value);

    return false;
}

function addMessage(chatEntry) {
    const messages = document.getElementById("messages");
    const messageListItem = document.createElement("li");
    messageListItem.innerHTML = `${chatEntry.user}: ${chatEntry.message}`;
    messages.appendChild(messageListItem);
}

function processHistory(history) {
    const chats = JSON.parse(history);
    for (let i = 0; i < chats.length; ++i) {
        addMessage(chats[i]);
    }
}

function loadChatApp() {
    const message_form = document.getElementById("message-form");
    message_form.onsubmit = sendMessage;
    const username_form = document.getElementById("username-form");
    username_form.onsubmit = setUsername;

    socket.on('chat message', addMessage);
    socket.on('chat history', processHistory);
    socket.on('unable-to-set-username', (m) => alert(m));
}
