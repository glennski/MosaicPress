/**
 * External dependencies
 */
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const { join } = require( 'path' );

/**
 * Internal dependencies
 */
const { baseDir } = require( './shared' );

/**
 * Builds the MosaicPress admin bundle.
 *
 * Tailwind runs only for src/js/mosaicpress. Preflight is omitted so the
 * bundle does not reset the surrounding WordPress admin.
 *
 * @param {Object}  env             Environment options.
 * @param {string}  env.buildTarget Build target directory, `src/` or `build/`.
 * @param {boolean} env.watch       Whether to watch for changes.
 * @return {Object} Webpack configuration.
 */
module.exports = function ( env = { buildTarget: 'src/', watch: false } ) {
	const buildTarget = env.buildTarget || 'src/';

	return {
		name: 'mosaicpress-admin',
		target: 'browserslist',
		mode: env.environment === 'production' ? 'production' : 'development',
		devtool: false,
		entry: {
			'mosaicpress-admin': './src/js/mosaicpress/admin/index.js',
		},
		output: {
			path: join( baseDir, buildTarget, 'wp-admin/js' ),
			filename: '[name].js',
		},
		watch: env.watch,
		module: {
			rules: [
				{
					test: /\.js$/,
					include: join( baseDir, 'src/js/mosaicpress' ),
					use: {
						loader: 'babel-loader',
						options: {
							presets: [
								[ '@babel/preset-react', { runtime: 'automatic' } ],
							],
						},
					},
				},
				{
					test: /\.css$/,
					use: [
						MiniCssExtractPlugin.loader,
						'css-loader',
						{
							loader: 'postcss-loader',
							options: {
								postcssOptions: {
									plugins: [ '@tailwindcss/postcss' ],
								},
							},
						},
					],
				},
			],
		},
		plugins: [
			new MiniCssExtractPlugin( {
				filename: '[name].css',
			} ),
		],
		stats: 'errors-only',
	};
};

if ( require.main === module ) {
	const webpack = require( 'webpack' );

	webpack(
		module.exports( {
			environment: 'production',
			buildTarget: 'src/',
		} ),
		( error, stats ) => {
			if ( error || stats.hasErrors() ) {
				console.error( error || stats.toString() );
				process.exit( 1 );
			}
		}
	);
}
