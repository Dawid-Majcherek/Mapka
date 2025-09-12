<?php
/*
Plugin Name: custom-map
Description: Interaktywna mapa z punktami i obszarami.
Version: 1.0
Author: Dawid Majcherek
*/

if (!defined('ABSPATH')) exit;

/*
DEV

Generalnie dobra robota. Komentarze tylko po angielsku, nazwy zmiennych też. 
Dodaj sobie linijkę przerwy między funkcjami

Dobrze, że prefiksujesz nazwy funkcji. Możesz zrobić to samo przy nazwach shortcodów, id, nazwy klas etc.
Wszystkie teksty muszą być tłumaczalne

*/

function cm_register_cpt() {
    register_post_type('map_marker', [
        'labels' => [
            'name' => 'Map Markers',
            'singular_name' => 'Map Marker'
        ],
        'public' => false,
        'show_ui' => true,
        'menu_icon' => 'dashicons-location',
        'supports' => ['title']
    ]);
}
add_action('init', 'cm_register_cpt');
function cm_admin_scripts($hook) {
    global $post;
    if ($hook === 'post.php' || $hook === 'post-new.php') {
        if (isset($post) && $post->post_type === 'map_marker') {
            wp_enqueue_style('wp-color-picker');
            wp_enqueue_script(
                'cm-admin',
                plugin_dir_url(__FILE__) . 'assets/admin.js',
                ['jquery', 'wp-color-picker'],
                false,
                true
            );
        }
    }
}
add_action('admin_enqueue_scripts', 'cm_admin_scripts');
function cm_add_metaboxes() {
    add_meta_box('cm_marker_data', 'Marker Data', 'cm_render_metabox', 'map_marker');
}
add_action('add_meta_boxes', 'cm_add_metaboxes');
function cm_render_metabox($post) {
    $type   = get_post_meta($post->ID, '_cm_type', true);
    $coords = get_post_meta($post->ID, '_cm_coords', true);
    $coords = json_decode($coords, true);
    if (!is_array($coords)) $coords = [];
    $color  = get_post_meta($post->ID, '_cm_color', true);
    
    ?>
    <p>
        <label>Wybierz lokalizację na mapie:</label><br>
        <div id="cm-admin-map" style="width:100%; height:300px;"></div>
    </p>

    <input type="hidden" id="cm_coords" name="cm_coords" 
       value="<?php echo esc_attr($coords ? wp_json_encode($coords) : ''); ?>">

    <p>
        <label>Typ:</label><br>
        <select name="cm_type">
            <option value="point" <?php selected($type, 'point'); ?>>Punkt</option>
            <option value="polygon" <?php selected($type, 'polygon'); ?>>Obszar</option>
        </select>
    </p>

    <p>
        <label>Koordynaty:</label><br>
        <div id="cm-coords-wrapper">
            <?php 
            if (!empty($coords)) {
                foreach ($coords as $pair) {
                    // DEV: Po co tutaj używasz echo? Możesz zamknąć tag php i otworzyć go z powrotem trochę dalej?
                    echo '<div class="cm-coord">' .
                         '<input type="text" name="cm_coords_lat[]" value="'.esc_attr($pair[0]).'" placeholder="Lat"> ' .
                         '<input type="text" name="cm_coords_lng[]" value="'.esc_attr($pair[1]).'" placeholder="Lng"> ' .
                         '<button class="remove-coord">Usuń</button>' .
                         '</div>';
                }
            } else {
                // 1 puste pole na start
                // DEV: Nie do końca rozumiem po co ci nazwy klas, skoro nigdzie nie ma do tego referencji, ani w css ani w js.. :/
                echo '<div class="cm-coord">' .
                     '<input type="text" name="cm_coords_lat[]" placeholder="Szerokość geograficzna"> ' .
                     '<input type="text" name="cm_coords_lng[]" placeholder="Długość geograficzna"> ' .
                     '<button class="remove-coord">Usuń</button>' .
                     '</div>';
            }
            ?>
        </div>
        <button id="add-coord">Dodaj punkt</button>
    </p>

    <p>
        <!-- DEV: Wszystkie teksty powinny być zamknięte w funkcję do tłumaczeń, np. _e("Kolor obszaru", "domena-wtyczki") -->
        <label>Kolor obszaru:</label><br>
        <input type="text" name="cm_color" 
               value="<?php echo esc_attr($color); ?>" 
               class="cm-color-field" />
    </p>
    <?php
}

function cm_save_post($post_id) {
    if (isset($_POST['cm_type'])) {
        update_post_meta($post_id, '_cm_type', sanitize_text_field($_POST['cm_type']));
    }

    if (isset($_POST['cm_coords'])) {
        $coords = json_decode(stripslashes($_POST['cm_coords']), true);
        if (is_array($coords) && !empty($coords)) {
            update_post_meta($post_id, '_cm_coords', wp_json_encode($coords));
        } else {
            delete_post_meta($post_id, '_cm_coords');
        }
    }

    if (isset($_POST['cm_color'])) {
        $clean_color = sanitize_hex_color($_POST['cm_color']);
        if ($clean_color) {
            update_post_meta($post_id, '_cm_color', $clean_color);
        } else {
            delete_post_meta($post_id, '_cm_color');
        }
    }
}


add_action('save_post', 'cm_save_post');

// Shortcode
function cm_render_map() {
    // DEV: Skoro tutaj dodajesz style z cdn, po co ci pobrane w kodzie źródłowym?
    wp_enqueue_style('leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
    wp_enqueue_script('leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', [], null, true);
    wp_enqueue_script('cm-map', plugins_url('/assets/map.js', __FILE__), ['leaflet'], false, true);

    $args = ['post_type' => 'map_marker', 'posts_per_page' => -1];
    $markers = get_posts($args);
    $data = [];
    foreach ($markers as $marker) {
        $data[] = [
            'title' => $marker->post_title,
            'type' => get_post_meta($marker->ID, '_cm_type', true),
            'coords' => json_decode(get_post_meta($marker->ID, '_cm_coords', true)),
            'color' => get_post_meta($marker->ID, '_cm_color', true)
        ];
    }
    
    // DEV: Jak robisz coś takiego, warto najlepiej komentarzem, albo jsdoc'iem oznaczyć to w pliku, żeby było wiadomo skąd ta zmienna się tam pojawia
    wp_localize_script('cm-map', 'cm_data', $data);

    // DEV: Nie dawaj id takich jak "custom-map", tylko też użyj prefixu, ale to pierdoła
    return '<div id="custom-map" style="width:100%; height:500px;"></div>';
}

// DEV: Nie dawaj takich nazw jak "custom_map", tylko też użyj prefixu, ale to pierdoła 
add_shortcode('custom_map', 'cm_render_map');


