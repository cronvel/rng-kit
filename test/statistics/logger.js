
"use strict" ;

const string = require( 'string-kit' ) ;
const format = string.format ;

exports.log = ( ... args ) => console.log( format( ... args ) ) ;

