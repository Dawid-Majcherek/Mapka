document.addEventListener("DOMContentLoaded", function () {
    const mapContainer = document.getElementById("custom-map");
    if (!mapContainer) return;

    var map = L.map("custom-map").setView([52.2297, 21.0122], 6);

    
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    
    var allLayers = L.featureGroup().addTo(map);

    if (typeof cm_data !== "undefined" && cm_data.length > 0) {
        cm_data.forEach(function (item) {
            if (!item.coords) return; 

            if (item.type === "point" && item.coords.length === 1) {
                
                var point = item.coords[0];
                if (Array.isArray(point) && point.length === 2) {
                    var marker = L.marker(point).bindPopup(item.title || "");
                    marker.addTo(allLayers);
                }
            } else if (item.type === "polygon" && item.coords.length >= 3) {
                
                var polygon = L.polygon(item.coords, {
                    color: item.color || "red",
                    fillColor: item.color || "red",
                    fillOpacity: 0.4,
                }).bindPopup(item.title || "");
                polygon.addTo(allLayers);
            }
        });

       
        if (allLayers.getLayers().length > 0) {
            map.fitBounds(allLayers.getBounds(), { padding: [20, 20] });
        }
    }
});
