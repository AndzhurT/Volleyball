
// login - sign up popups
const popup = document.querySelector('.login-popup');
const loginLink = document.querySelector('.login-link');
const registerLink = document.querySelector('.register-link');
const loginButton = document.querySelector('.login-btn');
const popupCloseButton = document.querySelector('.close-btn');

const items = document.querySelectorAll('.item');

// navbar
const navbar = document.querySelector('.navbar');


registerLink.addEventListener('click', ()=> {
    popup.classList.add('active');
});

loginLink.addEventListener('click', ()=> {
    popup.classList.remove('active');
});

loginButton.addEventListener('click', ()=> {
    popup.classList.add('active-popup');
});

popupCloseButton.addEventListener('click', ()=> {
    popup.classList.remove('active-popup');
});

document.getElementById('map-btn').addEventListener('click', function() {
    window.open('../map/map.html', '_self');
});

document.getElementById('events-btn').addEventListener('click', function() {
    window.open('../events/events.html', '_self');
});

document.getElementById('wrk-btn').addEventListener('click', function() {
    window.open('../workouts/workout.html', '_self');
});

document.getElementById('chat-btn').addEventListener('click', function() {
    window.open('../chat/chat.html', '_self');
});

document.getElementById('nav-sign').addEventListener('click', function() {
    window.open('../signup/sign.html', '_self');
});

