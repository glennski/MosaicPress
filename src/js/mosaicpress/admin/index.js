import { createRoot } from 'react-dom/client';
import { Button } from './components/button';
import './admin.css';

function MosaicPressAdmin() {
	return (
		<div className="flex flex-col items-start gap-4 rounded-lg bg-background-50 p-6">
			<h2 className="text-title-50 text-xl font-medium">MosaicPress</h2>
			<Button>Hello Tailgrids</Button>
		</div>
	);
}

const mount = document.getElementById( 'mosaicpress-admin' );

if ( mount ) {
	createRoot( mount ).render( <MosaicPressAdmin /> );
}
