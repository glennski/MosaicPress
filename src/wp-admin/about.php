<?php
/**
 * About MosaicPress administration panel.
 *
 * @package WordPress
 * @subpackage Administration
 */

/** WordPress Administration Bootstrap */
require_once __DIR__ . '/admin.php';

/* translators: Page title of the About MosaicPress page in the admin. */
$title = _x( 'About', 'page title' );

$version_text = sprintf(
	/* translators: %s: MosaicPress version number. */
	__( 'MosaicPress %s' ),
	mosaicpress_get_version()
);

require_once ABSPATH . 'wp-admin/admin-header.php';
?>
	<div class="wrap about__container">
		<div class="about__header">
			<div class="about__header-title">
				<h1><?php echo esc_html( $version_text ); ?></h1>
			</div>
		</div>

		<nav class="about__header-navigation nav-tab-wrapper wp-clearfix" aria-label="<?php esc_attr_e( 'Secondary menu' ); ?>">
			<a href="about.php" class="nav-tab nav-tab-active" aria-current="page"><?php _e( 'What&#8217;s New' ); ?></a>
			<a href="credits.php" class="nav-tab"><?php _e( 'Credits' ); ?></a>
		</nav>

		<div class="about__section">
			<div class="column is-left-padding-zero is-right-padding-zero">
				<h2><?php _e( 'Welcome to MosaicPress' ); ?></h2>
				<p class="is-subheading"><?php _e( 'MosaicPress is an independent CMS. This release keeps selected WordPress compatibility while MosaicPress uses its own version and releases.' ); ?></p>
			</div>
		</div>

		<div class="return-to-dashboard">
			<?php
			if ( isset( $_GET['updated'] ) && current_user_can( 'update_core' ) ) {
				printf(
					'<a href="%s">%s</a> ',
					esc_url( self_admin_url( 'update-core.php' ) ),
					is_multisite() ? __( 'Go to Updates' ) : __( 'Go to Dashboard &rarr; Updates' )
				);
			} else {
				printf(
					'<a href="%s">%s</a>',
					esc_url( self_admin_url() ),
					is_blog_admin() ? __( 'Go to Dashboard &rarr; Home' ) : __( 'Go to Dashboard' )
				);
			}
			?>
		</div>
	</div>

<?php require_once ABSPATH . 'wp-admin/admin-footer.php'; ?>
