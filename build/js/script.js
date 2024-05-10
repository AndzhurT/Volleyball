

// Map initilization 
var map = L.map('map', {
    center: [40.7128, -74.0060],
    zoom: 10,
    doubleClickZoom: false,
});

// Map tiles
var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    doubleClickZoom: false,
});

// Add map
osm.addTo(map);


// Marker and markerOnMap initialization
var marker;
var markerOnMap;

// Function on click
map.on('dblclick', function(e) {
    if (markerOnMap == true) {
        map.removeLayer(marker);
    }
    marker = new L.marker(e.latlng, {draggable: true});
    map.addLayer(marker);
    marker.bindPopup("Hi, I'm a popup").openPopup();
    markerOnMap = true;
    
    // console.log("You clicked the map at latitude: " + e.latlng.lat.toFixed(5) + " and longitude: " + e.latlng.lng.toFixed(5));
});
