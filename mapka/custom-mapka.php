<?php
/*
Plugin Name: custom-map
Description: Interactive map with clickable points and areas.
Version: 1.1
Author: Dawid Majcherek
*/

if (!defined('ABSPATH')) exit;

/**
 * Register custom post type for map markers
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


/**
 * Load scripts and styles in the admin panel
 * (Leaflet + color picker + custom JS)
 */
function cm_admin_scripts($hook) {
    global $post;
    if (($hook === 'post.php' || $hook === 'post-new.php') && isset($post) && $post->post_type === 'map_marker') {
        
        // Leaflet library
        wp_enqueue_style('leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        wp_enqueue_script('leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', [], null, true);

        // WP color picker
        wp_enqueue_style('wp-color-picker');
        wp_enqueue_script('wp-color-picker');

        // Custom admin script
        wp_enqueue_script(
            'cm-admin',
            plugin_dir_url(__FILE__) . 'assets/admin.js',
            ['jquery', 'leaflet', 'wp-color-picker'],
            null,
            true
        );
    }
}
add_action('admin_enqueue_scripts', 'cm_admin_scripts');


/**
 * Add custom metabox for marker data
 */
function cm_add_metaboxes() {
    add_meta_box('cm_marker_data', 'Marker Data', 'cm_render_metabox', 'map_marker');
}
add_action('add_meta_boxes', 'cm_add_metaboxes');


/**
 * Render metabox content for marker editing
 */
function cm_render_metabox($post) {
    $marker_type = get_post_meta($post->ID, '_cm_type', true);
    $coordinates = get_post_meta($post->ID, '_cm_coords', true);
    $area_color = get_post_meta($post->ID, '_cm_color', true);
    ?>
    <p>
        <label>Type:</label><br>
        <select name="cm_type">
            <option value="point" <?php selected($marker_type, 'point'); ?>>Point</option>
            <option value="polygon" <?php selected($marker_type, 'polygon'); ?>>Area</option>
        </select>
    </p>

    <p>
        <label>Coordinates (click on map):</label><br>
        
        <!-- Hidden field to store JSON coordinates -->
        <input type="hidden" id="cm_coords" name="cm_coords" value="<?php echo esc_attr($coordinates ? $coordinates : ''); ?>">

        <!-- Display-only field with readable coords -->
        <textarea id="cm_coords_display" readonly rows="3" style="width:100%;"></textarea>
        <br>
        <button type="button" id="cm_clear_coords" class="button">Clear</button>
        <button type="button" id="cm_undo_coord" class="button">Undo last point</button>
    </p>

    <!-- Map container -->
    <div id="cm-admin-map" style="width:100%; height:300px; border:1px solid #ccc; margin-top:10px;"></div>

    <p>
        <label>Area color:</label><br>
        <input type="text" class="cm-color-field" name="cm_color" value="<?php echo esc_attr($area_color); ?>" placeholder="#ff0000" />
    </p>
    <?php
}


/**
 * Save metabox data when post is saved
 */
function cm_save_post($post_id) {
    if (isset($_POST['cm_type'])) {
        update_post_meta($post_id, '_cm_type', sanitize_text_field($_POST['cm_type']));
    }
    if (isset($_POST['cm_coords'])) {
        update_post_meta($post_id, '_cm_coords', sanitize_textarea_field($_POST['cm_coords']));
    }
    if (isset($_POST['cm_color'])) {
        update_post_meta($post_id, '_cm_color', sanitize_hex_color($_POST['cm_color']));
    }
}
add_action('save_post', 'cm_save_post');


/**
 * Render map on frontend via shortcode [custom_map]
 */
function cm_render_map() {
    // Leaflet CSS/JS
    wp_enqueue_style('leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
    wp_enqueue_script('leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', [], null, true);

    // Custom map script
    wp_enqueue_script('cm-map', plugins_url('/assets/map.js', __FILE__), ['leaflet'], null, true);

    // Collect markers data from database
    $args = ['post_type' => 'map_marker', 'posts_per_page' => -1];
    $markers = get_posts($args);
    $marker_data = [];
    foreach ($markers as $marker) {
        $marker_data[] = [
            'title' => $marker->post_title,
            'type' => get_post_meta($marker->ID, '_cm_type', true),
            'coords' => json_decode(get_post_meta($marker->ID, '_cm_coords', true)),
            'color' => get_post_meta($marker->ID, '_cm_color', true)
        ];
    }

    // Pass data to JavaScript
    wp_localize_script('cm-map', 'cm_data', $marker_data);

    // Map container
    return '<div id="custom-map" style="width:100%; height:500px;"></div>';
}
add_shortcode('custom_map', 'cm_render_map');
