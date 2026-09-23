<?php
/**
 * Plugin Name: MosaicPress Playground Controls
 * Description: Local controls for the Playground preview.
 */

define( 'MOSAIC_PLAYGROUND_CONTROL_URL', '__MOSAIC_CONTROL_URL__' );
define( 'MOSAIC_PLAYGROUND_CONTROL_TOKEN', '__MOSAIC_CONTROL_TOKEN__' );

if ( ! defined( 'ABSPATH' ) ) {
	return;
}

add_action(
	'admin_menu',
	static function () {
		add_management_page(
			'MosaicPress Playground',
			'Mosaic Playground',
			'manage_options',
			'mosaic-playground',
			'mosaic_playground_controls_page'
		);
	}
);

function mosaic_playground_controls_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	?>
	<div class="wrap">
		<h1>MosaicPress Playground</h1>
		<p id="mosaic-playground-status">Serverstatus wird geladen …</p>
		<p>
			<button type="button" class="button" data-mosaic-action="restart">Server neu starten</button>
			<button type="button" class="button" data-mosaic-action="reset">Daten zurücksetzen &amp; neu starten</button>
			<button type="button" class="button button-link-delete" data-mosaic-action="stop">Server stoppen</button>
		</p>
		<p class="description">Diese Controls existieren nur in der lokalen Playground-Vorschau.</p>
	</div>
	<script>
		(() => {
			const endpoint = <?php echo wp_json_encode( MOSAIC_PLAYGROUND_CONTROL_URL ); ?>;
			const token = <?php echo wp_json_encode( MOSAIC_PLAYGROUND_CONTROL_TOKEN ); ?>;
			const status = document.getElementById( 'mosaic-playground-status' );

			async function send( action ) {
				status.textContent = 'Bitte warten …';
				const response = await fetch( endpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-Mosaic-Playground-Token': token,
					},
					body: JSON.stringify( { action } ),
				} );
				const result = await response.json();
				if ( ! response.ok ) {
					throw new Error( result.error || 'Die Serveraktion ist fehlgeschlagen.' );
				}
				status.textContent = result.message;
			}

			document.querySelectorAll( '[data-mosaic-action]' ).forEach( ( button ) => {
				button.addEventListener( 'click', () => {
					if ( button.dataset.mosaicAction === 'reset' && ! window.confirm( 'Alle Playground-Inhalte zurücksetzen?' ) ) {
						return;
					}
					send( button.dataset.mosaicAction ).catch( ( error ) => {
						status.textContent = error.message;
					} );
				} );
			} );

			send( 'status' ).catch( ( error ) => {
				status.textContent = error.message;
			} );
		})();
	</script>
	<?php
}
