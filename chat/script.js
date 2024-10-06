// login - sign up popups
const popup = document.querySelector('.login-popup');
const loginLink = document.querySelector('.login-link');
const registerLink = document.querySelector('.register-link');
const loginButton = document.querySelector('.login-btn');
const popupCloseButton = document.querySelector('.close-btn');

// hamburger 
const hamburgerMenu = document.querySelector('.hamburger-menu');
const hamburgerCheckbox = document.querySelector('.hamburger-checkbox');
const navMenuList = document.querySelector('.vb-nav-menu-group');

const items = document.querySelectorAll('.item');

// navbar
const navbar = document.querySelector('.navbar');

registerLink.addEventListener('click', async () => {
    popup.classList.add('active');
});

loginLink.addEventListener('click', async () => {
    popup.classList.remove('active');
});

loginButton.addEventListener('click', async () => {
    popup.classList.add('active-popup');
});

popupCloseButton.addEventListener('click', async () => {
    popup.classList.remove('active-popup');
});

document.getElementById('nav-sign').addEventListener('click', async function() {
    window.open('../signup/sign.html', '_self');
});

const hamburgerMenuPopup = async (ev) => {
    if (hamburgerCheckbox.checked) {   
        navbar.classList.add('active');
        navMenuList.classList.add('active');
        items.forEach(item => item.classList.add('active'));
    } else {
        navbar.classList.remove('active');
        navMenuList.classList.remove('active');
        items.forEach(item => item.classList.remove('active'));
    }
}

hamburgerCheckbox.addEventListener('click', hamburgerMenuPopup);

//Locations data

document.getElementById('main-btn').addEventListener('click', function() {
    window.location.href = "../index.html";
});

document.getElementById('map-btn').addEventListener('click', function() {
    window.location.href = "../map/map.html";
});

document.getElementById('events-btn').addEventListener('click', function() {
    window.location.href = "../events/events.html";
});

document.getElementById('wrk-btn').addEventListener('click', function() {
    window.location.href = "../workouts/workout.html";
});

/* Chat section */
// Get DOM elements
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendMessageBtn = document.getElementById("send-message-btn");

// Function to send a message
function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
        // Create a new message element
        const messageElement = document.createElement("div");
        messageElement.classList.add("chat-message");
        messageElement.textContent = message;

        // Append message to chat
        chatMessages.appendChild(messageElement);

        // Clear input
        chatInput.value = "";
        // Scroll to the bottom of the chat
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Event listener for the send button
sendMessageBtn.addEventListener("click", sendMessage);

// Optional: Send message with Enter key
chatInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});
