// Initialize the map
var map = L.map('map').setView([51.505, -0.09], 13); // Coordinates and zoom level

// Add a tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Add a marker
L.marker([51.505, -0.09]).addTo(map)
    .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
    .openPopup();

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

//Function to add a marker with the name
function addMarker(e) {
    var name = prompt("Enter a name for the location: ")
    if (name) {
        var marker  = L.marker(e.latlng).addTo(map);
        marker.bindPopup(name).openPopup;
    }
}

//Add click event listener to the map
map.on('click', addMarker)
