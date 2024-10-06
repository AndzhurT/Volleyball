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

document.getElementById('chat-btn').addEventListener('click', function() {
    window.location.href = "../chat/chat.html";
});

/* Workout categorie section */

const categories = document.querySelectorAll('.category');

categories.forEach(category => {
    category.addEventListener('click', () => {
        const description = category.querySelector('p');
        description.classList.toggle('visible');
    });
});