<?php
/**
 * MosaicPress admin screen.
 *
 * @package WordPress
 */

/**
 * Registers the MosaicPress admin screen.
 */
function mosaicpress_admin_menu() {
	add_menu_page(
		'MosaicPress',
		'MosaicPress',
		'manage_options',
		'mosaicpress',
		'mosaicpress_admin_page',
		'dashicons-layout',
		3
	);
}
add_action( 'admin_menu', 'mosaicpress_admin_menu' );

/**
 * Loads the MosaicPress admin bundle on its screen.
 *
 * @param string $hook_suffix Current admin page hook.
 */
function mosaicpress_admin_scripts( $hook_suffix ) {
	if ( 'toplevel_page_mosaicpress' !== $hook_suffix ) {
		return;
	}

	$version = mosaicpress_get_version();

	wp_enqueue_style(
		'mosaicpress-admin',
		admin_url( 'js/mosaicpress-admin.css' ),
		array(),
		$version
	);

	wp_enqueue_script(
		'mosaicpress-admin',
		admin_url( 'js/mosaicpress-admin.js' ),
		array(),
		$version,
		true
	);
}
add_action( 'admin_enqueue_scripts', 'mosaicpress_admin_scripts' );

/**
 * Prints the mount node for the MosaicPress admin bundle.
 */
function mosaicpress_admin_page() {
	echo '<div class="wrap">';
	echo '<div id="mosaicpress-admin" class="mosaicpress-admin"></div>';
	echo '</div>';
}
