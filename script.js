document.getElementById('map-btn').addEventListener('click', function() {
    window.open('../map/map.html', '_self');
});

document.getElementById('events-btn').addEventListener('click', function() {
    window.open('../events/events.html', '_self');
});

document.getElementById('wrk-btn').addEventListener('click', function() {
    window.open('../workouts/workouts.html', '_self');
});

document.getElementById('chat-btn').addEventListener('click', function() {
    window.open('../chat/chat.html', '_self');
});

document.getElementById('nav-sign').addEventListener('click', function() {
    window.open('../signup/sign.html', '_self');
});

function openLoginForm() {
    document.getElementById('login-popup').style.opacity = 1;
}

function closeLoginForm() {
    document.getElementById('login-popup').style.opacity = 0;
}