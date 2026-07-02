/*
	RNG Kit

	Copyright (c) 2026 Cédric Ronvel

	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;



const BaseRng = require( '../BaseRng.js' ) ;



/*
	It uses Node or Web crypto API random
*/

function CryptoRng() {
	BaseRng.call( this ) ;
}

CryptoRng.prototype = Object.create( BaseRng.prototype ) ;
CryptoRng.prototype.constructor = CryptoRng ;

module.exports = CryptoRng ;

CryptoRng.prototype.isDeterministic = false ;

// Get a pseudo random UInt32
CryptoRng.prototype.generateUInt32 = function() {
	const uint32Array = new Uint32Array( 1 ) ;
	BaseRng.crossPlatform.getRandomValues( uint32Array ) ;
	this.nextState() ;
	return uint32Array[ 0 ] ;
} ;

CryptoRng.prototype.generateBytes = function( count ) {
	const uint8Array = new Uint8Array( count ) ;
	BaseRng.crossPlatform.getRandomValues( uint8Array ) ;
	this.nextState() ;
	return uint8Array ;
} ;

BaseRng.createFromUInt32Generator( CryptoRng ) ;

