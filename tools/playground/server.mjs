import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname( fileURLToPath( import.meta.url ) );
const root = resolve( directory, '..', '..' );
const build = join( root, 'build' );
const pluginTemplate = join( directory, 'mosaic-playground-controls.php' );
const pluginFile = join( build, 'wp-content', 'mu-plugins', 'mosaic-playground-controls.php' );

function optionValue( argumentsList, option, fallback ) {
	for ( let index = 0; index < argumentsList.length; index++ ) {
		if ( argumentsList[ index ] === option ) {
			return argumentsList[ index + 1 ];
		}
		if ( argumentsList[ index ].startsWith( `${ option }=` ) ) {
			return argumentsList[ index ].slice( option.length + 1 );
		}
	}

	return fallback;
}

function port( argumentsList ) {
	const value = Number( optionValue( argumentsList, '--port', '9400' ) );
	if ( ! Number.isInteger( value ) || value < 1 || value > 65534 ) {
		throw new Error( 'Der Playground-Port muss zwischen 1 und 65534 liegen.' );
	}
	return value;
}

function withoutOption( argumentsList, ...options ) {
	return argumentsList.filter( ( argument, index ) => {
		if ( options.some( ( option ) => argument === option || argument.startsWith( `${ option }=` ) ) ) {
			return false;
		}
		return index === 0 || ! options.includes( argumentsList[ index - 1 ] );
	} );
}

function mosaicOutput( output ) {
	return output
		.replaceAll( 'WordPress Playground CLI', 'MosaicPress Playground' )
		.replaceAll( 'WordPress is running on', 'MosaicPress is running on' );
}

function selfTest() {
	assert.equal( port( [] ), 9400 );
	assert.equal( port( [ '--port', '9500' ] ), 9500 );
	assert.equal( port( [ '--port=9501' ] ), 9501 );
	assert.deepEqual( withoutOption( [ '--port', '9500', '--php=8.3' ], '--port' ), [ '--php=8.3' ] );
	assert.deepEqual( withoutOption( [ '--wp=latest', '--php=8.3' ], '--wp', '--wordpress-install-mode' ), [ '--php=8.3' ] );
	assert.equal( mosaicOutput( 'WordPress Playground CLI\nWordPress is running on http://localhost' ), 'MosaicPress Playground\nMosaicPress is running on http://localhost' );
	console.log( 'Playground controller self-test passed.' );
}

const argumentsList = process.argv.slice( 2 );
if ( argumentsList.includes( '--self-test' ) ) {
	selfTest();
	process.exit( 0 );
}

const playgroundPort = port( argumentsList );
const controlPort = playgroundPort + 1;
const controlToken = randomBytes( 32 ).toString( 'hex' );
const controlUrl = `http://127.0.0.1:${ controlPort }/mosaic-playground`;
const playgroundArguments = [
	'--yes',
	// ponytail: pin 3.1.54; @latest needs Node >=24.18
	'@wp-playground/cli@3.1.54',
	'server',
	'--wordpress-install-mode=install-from-existing-files-if-needed',
	'--mount-dir-before-install=build',
	'/wordpress',
	'--login',
	`--port=${ playgroundPort }`,
	...withoutOption( argumentsList, '--port', '--wp', '--wordpress-install-mode' ),
];

let playground;
let restarting = false;
let stopping = false;

function phpString( value ) {
	return value.replaceAll( '\\', '\\\\' ).replaceAll( "'", "\\'" );
}

async function writeControlsPlugin() {
	const template = await readFile( pluginTemplate, 'utf8' );
	await mkdir( dirname( pluginFile ), { recursive: true } );
	await writeFile(
		pluginFile,
		template
			.replaceAll( '__MOSAIC_CONTROL_URL__', phpString( controlUrl ) )
			.replaceAll( '__MOSAIC_CONTROL_TOKEN__', phpString( controlToken ) ),
		'utf8'
	);
}

function json( response, status, value ) {
	response.writeHead( status, { 'Content-Type': 'application/json' } );
	response.end( JSON.stringify( value ) );
}

function localOrigin( origin ) {
	if ( ! origin ) {
		return false;
	}

	try {
		const url = new URL( origin );
		return url.port === String( playgroundPort ) && [ '127.0.0.1', 'localhost', '[::1]' ].includes( url.hostname );
	} catch {
		return false;
	}
}

function validToken( token ) {
	return typeof token === 'string' && token.length === controlToken.length && timingSafeEqual( Buffer.from( token ), Buffer.from( controlToken ) );
}

async function requestBody( request ) {
	let body = '';
	for await ( const chunk of request ) {
		body += chunk;
		if ( body.length > 1024 ) {
			throw new Error( 'Request ist zu groß.' );
		}
	}
	return JSON.parse( body || '{}' );
}

function stopProcess() {
	if ( ! playground?.pid ) {
		return Promise.resolve();
	}

	if ( process.platform !== 'win32' ) {
		playground.kill( 'SIGTERM' );
		return Promise.resolve();
	}

	return new Promise( ( resolveStop ) => {
		execFile( 'taskkill.exe', [ '/PID', String( playground.pid ), '/T', '/F' ], resolveStop );
	} );
}

async function resetSite() {
	await rm( join( build, 'wp-config.php' ), { force: true } );
	await rm( join( build, 'wp-content', 'database' ), { force: true, recursive: true } );
	await rm( join( build, 'wp-content', 'uploads' ), { force: true, recursive: true } );
}

function startPlayground() {
	const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
	playground = spawn( executable, playgroundArguments, {
		cwd: root,
		stdio: [ 'inherit', 'pipe', 'pipe' ],
		shell: process.platform === 'win32',
	} );
	playground.stdout.on( 'data', ( output ) => process.stdout.write( mosaicOutput( output.toString() ) ) );
	playground.stderr.on( 'data', ( output ) => process.stderr.write( mosaicOutput( output.toString() ) ) );

	playground.once( 'exit', async ( code ) => {
		playground = undefined;
		if ( restarting ) {
			return;
		}
		controlServer.close();
		process.exit( stopping ? 0 : ( code || 1 ) );
	} );
}

async function restart( reset ) {
	restarting = true;
	await stopProcess();
	if ( reset ) {
		await resetSite();
	}
	setTimeout( () => {
		restarting = false;
		startPlayground();
	}, 500 );
}

const controlServer = createServer( async ( request, response ) => {
	const origin = request.headers.origin;
	if ( localOrigin( origin ) ) {
		response.setHeader( 'Access-Control-Allow-Origin', origin );
		response.setHeader( 'Vary', 'Origin' );
	}

	if ( request.method === 'OPTIONS' ) {
		response.writeHead( 204, {
			'Access-Control-Allow-Headers': 'Content-Type, X-Mosaic-Playground-Token',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
		} );
		response.end();
		return;
	}

	if ( request.method !== 'POST' || request.url !== '/mosaic-playground' || ! localOrigin( origin ) || ! validToken( request.headers[ 'x-mosaic-playground-token' ] ) ) {
		json( response, 403, { error: 'Nicht autorisiert.' } );
		return;
	}

	try {
		const { action } = await requestBody( request );
		if ( action === 'status' ) {
			json( response, 200, { message: playground ? 'Server läuft.' : 'Server wird gestartet.' } );
			return;
		}
		if ( action === 'restart' || action === 'reset' ) {
			json( response, 202, { message: action === 'reset' ? 'Daten werden zurückgesetzt und der Server neu gestartet.' : 'Server wird neu gestartet.' } );
			void restart( action === 'reset' );
			return;
		}
		if ( action === 'stop' ) {
			stopping = true;
			json( response, 202, { message: 'Server wird gestoppt.' } );
			void stopProcess();
			return;
		}
		json( response, 400, { error: 'Unbekannte Aktion.' } );
	} catch ( error ) {
		json( response, 400, { error: error.message } );
	}
} );

for ( const signal of [ 'SIGINT', 'SIGTERM' ] ) {
	process.on( signal, () => {
		stopping = true;
		void stopProcess();
	} );
}

if ( ! existsSync( join( build, 'wp-load.php' ) ) ) {
	throw new Error( 'Kein MosaicPress-Build gefunden. Zuerst `npm run build` ausführen.' );
}

await writeControlsPlugin();
controlServer.listen( controlPort, '127.0.0.1', () => {
	console.log( `Mosaic Playground controls: ${ controlUrl }` );
	startPlayground();
} );
