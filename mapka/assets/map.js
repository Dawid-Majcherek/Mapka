document.addEventListener("DOMContentLoaded", function () {
    const mapElement = document.getElementById("custom-map");
    if (!mapElement) return;

    const map = L.map("custom-map").setView([52.2297, 21.0122], 6);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    const layersGroup = L.featureGroup().addTo(map);
    /**
     * cm_data – global variable passed from PHP to JS via wp_localize_script().
     * It contains all the data about points and polygons saved in the plugin's database.
     * Structure:
     * [
     *   {
     *     title: "Location title",
     *     type: "point" | "polygon",
     *     coords: [[lat, lng], [lat, lng], ...],
     *     color: "#ff0000"
     *   },
     *   ...
     * ]
     * Thanks to this variable, the map frontend knows what elements to draw.
     */
    if (typeof cm_data !== "undefined" && cm_data.length > 0) {
        cm_data.forEach(function (item) {
            if (!item.coords) return; 

            if (item.type === "point" && item.coords.length === 1) {
                const singlePoint = item.coords[0];
                if (Array.isArray(singlePoint) && singlePoint.length === 2) {
                    const marker = L.marker(singlePoint).bindPopup(item.title || "");
                    marker.addTo(layersGroup);
                }
            } else if (item.type === "polygon" && item.coords.length >= 3) {
                const polygon = L.polygon(item.coords, {
                    color: item.color || "red",
                    fillColor: item.color || "red",
                    fillOpacity: 0.4,
                }).bindPopup(item.title || "");
                polygon.addTo(layersGroup);
            }
        });

        if (layersGroup.getLayers().length > 0) {
            map.fitBounds(layersGroup.getBounds(), { padding: [20, 20] });
        }
    }
});

