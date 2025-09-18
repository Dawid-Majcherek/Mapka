jQuery(document).ready(function($) {
    console.log("admin.js is working");

    // Convert coordinates array into a readable string for display
    function coordsToDisplay(coords) {
        if (!Array.isArray(coords) || coords.length === 0) return '';
        
        if (coords.length === 1 && Array.isArray(coords[0]) && coords[0].length === 2) {
            return coords[0][0].toFixed(6) + ", " + coords[0][1].toFixed(6);
        }
        return coords.map(function(p) { 
            return p[0].toFixed(6) + ", " + p[1].toFixed(6); 
        }).join(" ; ");
    }

    // Redraw map elements based on coordinates and type (point or polygon)
    function redrawFromCoords(coords, type, map, drawnItems) {
        drawnItems.clearLayers();
        if (!Array.isArray(coords) || coords.length === 0) return;

        if (type === 'point') {
            const lastPoint = coords[coords.length - 1];
            if (Array.isArray(lastPoint) && lastPoint.length === 2) {
                L.marker(lastPoint).addTo(drawnItems);
                map.setView(lastPoint, 12);
            }
        } else if (type === 'polygon' && coords.length >= 1) {
            if (coords.length === 1) {
                L.marker(coords[0]).addTo(drawnItems);
                map.setView(coords[0], 12);
            } else {
                L.polygon(coords).addTo(drawnItems);
                map.fitBounds(coords);
            }
        }
    }

    if ($("#cm-admin-map").length) {
        const map = L.map("cm-admin-map").setView([52.2297, 21.0122], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        const drawnItems = L.featureGroup().addTo(map);

        const existingCoordsValue = $("#cm_coords").val();
        let coords = [];
        if (existingCoordsValue) {
            try { 
                coords = JSON.parse(existingCoordsValue) || []; 
            } catch(e) { 
                coords = []; 
                console.log("JSON parse error in cm_coords:", e); 
            }
        }

        let currentType = $("select[name='cm_type']").val() || 'point';

        $("#cm_coords_display").val(coordsToDisplay(coords));
        redrawFromCoords(coords, currentType, map, drawnItems);

        // Add coordinates by clicking on the map
        map.on("click", function(e) {
            currentType = $("select[name='cm_type']").val() || 'point';
            if (currentType === "point") {
                coords = [[e.latlng.lat, e.latlng.lng]];
            } else {
                coords = coords || [];
                coords.push([e.latlng.lat, e.latlng.lng]);
            }

            $("#cm_coords").val(JSON.stringify(coords));
            $("#cm_coords_display").val(coordsToDisplay(coords));
            redrawFromCoords(coords, currentType, map, drawnItems);
        });

        // Clear all coordinates
        $("#cm_clear_coords").on('click', function(e) {
            e.preventDefault();
            coords = [];
            $("#cm_coords").val('');
            $("#cm_coords_display").val('');
            drawnItems.clearLayers();
        });

        // Undo last added coordinate
        $("#cm_undo_coord").on('click', function(e) {
            e.preventDefault();
            if (!coords || coords.length === 0) return;
            coords.pop();
            if (coords.length === 0) {
                $("#cm_coords").val('');
                $("#cm_coords_display").val('');
                drawnItems.clearLayers();
            } else {
                $("#cm_coords").val(JSON.stringify(coords));
                $("#cm_coords_display").val(coordsToDisplay(coords));
                redrawFromCoords(coords, $("select[name='cm_type']").val() || 'point', map, drawnItems);
            }
        });
        // Change between point and polygon type
        $("select[name='cm_type']").on('change', function() {
            const newType = $(this).val();
            if (newType === 'point') {
                if (coords && coords.length > 1) {
                    coords = [coords[coords.length - 1]];
                }
            } 
            $("#cm_coords").val(coords && coords.length ? JSON.stringify(coords) : '');
            $("#cm_coords_display").val(coordsToDisplay(coords));
            redrawFromCoords(coords, newType, map, drawnItems);
        });
    }

    // Initialize WordPress color picker for polygon color
    if ($('.cm-color-field').length && typeof $.fn.wpColorPicker === 'function') {
        $('.cm-color-field').wpColorPicker();
    }
});

