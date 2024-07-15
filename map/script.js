async function initializeMap() {
    var map = L.map('map').setView([51.505, -0.09], 13); // Coordinates and zoom level

    // Add a tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Layer group for markers
    var markersLayer = new L.LayerGroup();
    map.addLayer(markersLayer);

    // Store custom markers
    var customMarkers = {};

    // Search input event listener
    document.getElementById('search').addEventListener('keydown', async function (e) {
        if (e.key === 'Enter') {
            var query = e.target.value;
            var url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;
            var response = await fetch(url);
            var data = await response.json();

            if (data.length > 0) {
                var bbox = data[0].boundingbox;
                var lat = data[0].lat;
                var lon = data[0].lon;

                map.fitBounds([
                    [bbox[0], bbox[2]],
                    [bbox[1], bbox[3]]
                ]);

                // Store the location for the "Add" button
                document.getElementById('add-btn').dataset.lat = lat;
                document.getElementById('add-btn').dataset.lon = lon;
                document.getElementById('add-btn').disabled = false;
            } else {
                alert('Address not found. Please try again.');
            }
        }
    });

    // Add button event listener
    document.getElementById('add-btn').addEventListener('click', function () {
        var lat = this.dataset.lat;
        var lon = this.dataset.lon;
        var name = prompt("Enter a name for the location:");

        if (name) {
            var marker = L.marker([lat, lon]).addTo(map).bindPopup(name);
            markersLayer.addLayer(marker);
            customMarkers[name.toLowerCase()] = [lat, lon]; // Store marker by name
        }

        // Disable the "Add" button after adding the location
        this.disabled = true;
    });

    // Click event listener to add marker
    map.on('click', function(e) {
        var name = prompt("Enter a name for the location:");
        if (name) {
            var marker = L.marker(e.latlng).addTo(map);
            marker.bindPopup(name).openPopup();
            markersLayer.addLayer(marker); // Add the new marker to the layer
            customMarkers[name.toLowerCase()] = [e.latlng.lat, e.latlng.lng]; // Store marker by name
        }
    });
}

// Call the initializeMap function to set up the map
initializeMap();

// //Function to add a marker with the name
// function addMarker(e) {
//     var name = prompt("Enter a name for the location: ")
//     if (name) {
//         var marker  = L.marker(e.latlng).addTo(map);
//         marker.bindPopup(name).openPopup;
//     }
// }

// //Add click event listener to the map
// map.on('click', addMarker)


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

document.getElementById('events-btn').addEventListener('click', function() {
    window.location.href = "../events/events.html";
});

document.getElementById('wrk-btn').addEventListener('click', function() {
    window.location.href = "../workouts/workout.html";
});

document.getElementById('chat-btn').addEventListener('click', function() {
    window.location.href = "../chat/chat.html";
});
