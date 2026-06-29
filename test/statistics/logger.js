"use strict" ;

const termkit = require( 'terminal-kit' ) ;
const term = termkit.terminal ;

let lastWasRewritable = false ;

exports.log = ( format , ... args ) => {
	if ( lastWasRewritable ) {
		term( '\n' + format + '\n' , ... args ) ;
	}
	else {
		term( format + '\n' , ... args ) ;
	}

	lastWasRewritable = false ;
} ;

exports.rewritableLog = ( format , ... args ) => {
	if ( lastWasRewritable ) {
		term.column( 1 )( format , ... args ).eraseLineAfter() ;
	}
	else {
		term( format , ... args ) ;
	}

	lastWasRewritable = true ;
} ;

