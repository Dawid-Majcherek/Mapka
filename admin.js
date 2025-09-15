jQuery(document).ready(function($){
    console.log("admin.js działa");

    function coordsToDisplay(coords) {
        if (!Array.isArray(coords) || coords.length === 0) return '';
        
        if (coords.length === 1 && Array.isArray(coords[0]) && coords[0].length === 2) {
            return coords[0][0].toFixed(6) + ", " + coords[0][1].toFixed(6);
        }
        return coords.map(function(p){ return p[0].toFixed(6) + ", " + p[1].toFixed(6); }).join(" ; ");
    }

    function redrawFromCoords(coords, type, map, drawnItems) {
        drawnItems.clearLayers();
        if (!Array.isArray(coords) || coords.length === 0) return;
        if (type === 'point') {
            var pt = coords[coords.length - 1];
            if (Array.isArray(pt) && pt.length === 2) {
                L.marker(pt).addTo(drawnItems);
                map.setView(pt, 12);
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
        var map = L.map("cm-admin-map").setView([52.2297, 21.0122], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        var drawnItems = L.featureGroup().addTo(map);

        var existingVal = $("#cm_coords").val();
        var coords = [];
        if (existingVal) {
            try { coords = JSON.parse(existingVal) || []; } catch(e) { coords = []; console.log("Błąd JSON w cm_coords:", e); }
        }

        var currentType = $("select[name='cm_type']").val() || 'point';

        
        $("#cm_coords_display").val(coordsToDisplay(coords));
        redrawFromCoords(coords, currentType, map, drawnItems);

        
        map.on("click", function(e){
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

        
        $("#cm_clear_coords").on('click', function(e){
            e.preventDefault();
            coords = [];
            $("#cm_coords").val('');
            $("#cm_coords_display").val('');
            drawnItems.clearLayers();
        });

        
        $("#cm_undo_coord").on('click', function(e){
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

        
        $("select[name='cm_type']").on('change', function(){
            var newType = $(this).val();
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

    if ($('.cm-color-field').length && typeof $.fn.wpColorPicker === 'function') {
        $('.cm-color-field').wpColorPicker();
    }
});
