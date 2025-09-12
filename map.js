// DEV: Tu gdzieś powinien być albo komentarz albo jsdoc na temat zmienniej cm_data.
// DEV: vary są przestarzałe, patrz admin.js
document.addEventListener("DOMContentLoaded", function() {
    var map = L.map('custom-map').setView([52.2297, 21.0122], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    cm_data.forEach(function(item) {
        if (item.type === "point") {
            L.marker(item.coords).addTo(map).bindPopup(item.title);
        } else if (item.type === "polygon") {
            L.polygon(item.coords, { color: item.color || '#3388ff' })
              .addTo(map)
              .bindPopup(item.title);
        }
    });
});

