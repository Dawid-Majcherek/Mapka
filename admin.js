// DEV: "var"y są przestarzałe od 2015 roku - nie używaj ich. Używaj albo let albo const
// DEV: Jquery Ci daruję bo pół wordpressa na tym stoi, ale gdziekolwiek indziej - nie ma potrzeby tego używać
// DEV: logi jeżeli już to po angielsku, komentarze również

jQuery(document).ready(function($){
    console.log("admin.js działa ✅");

    // uruchom mapę w panelu
    if ($("#cm-admin-map").length) {
        var map = L.map("cm-admin-map").setView([52.2297, 21.0122], 6); // start np. Polska

        // tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        var drawnItems = L.featureGroup().addTo(map);

        // jeśli mamy zapisane współrzędne -> pokaż na mapie
        var existing = $("#cm_coords").val();
        if (existing) {
            try {
                var coords = JSON.parse(existing);
                if (coords.length === 1) {
                    L.marker(coords[0]).addTo(drawnItems);
                    map.setView(coords[0], 12);
                } else if (coords.length > 1) {
                    L.polygon(coords).addTo(drawnItems);
                    map.fitBounds(coords);
                }
            } catch(e) { console.log("Błąd JSON coords", e); }
        }

        // obsługa kliknięć
        map.on("click", function(e){
            var type = $("select[name='cm_type']").val();

            drawnItems.clearLayers(); // usuwamy poprzednie

            if (type === "point") {
                L.marker([e.latlng.lat, e.latlng.lng]).addTo(drawnItems);
                $("#cm_coords").val(JSON.stringify([[e.latlng.lat, e.latlng.lng]]));
            } else if (type === "polygon") {
                // dla polygona dodajemy kolejne kliknięcia
                var current = $("#cm_coords").val();
                var coords = current ? JSON.parse(current) : [];
                coords.push([e.latlng.lat, e.latlng.lng]);
                L.polygon(coords).addTo(drawnItems);
                $("#cm_coords").val(JSON.stringify(coords));
            }
        });
    }

    // color picker
    if ($('.cm-color-field').length) {
        $('.cm-color-field').wpColorPicker();
    }
});
