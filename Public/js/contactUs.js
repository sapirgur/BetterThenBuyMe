async function fetchLocations() {
    const response = await fetch('/api/locations');
    return response.json();
}

function initMap() {
    const map = new google.maps.Map(document.getElementById('map'), {
        zoom: 8,
        center: { lat: 32.0, lng: 35.0 } // Adjust center as needed
    });

    fetchLocations().then(locations => {
        locations.forEach(location => {
            new google.maps.Marker({
                position: { lat: location.latitude, lng: location.longitude },
                map: map,
                title: location.name
            });
        });

        if (locations.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            locations.forEach(location => {
                bounds.extend(new google.maps.LatLng(location.latitude, location.longitude));
            });
            map.fitBounds(bounds);
        }
    });
}

window.onload = initMap;
