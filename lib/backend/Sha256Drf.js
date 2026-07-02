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
const sha256 = require( '../sha256.js' ) ;



/*
	DRF: Deterministic Random Function
	This is stateless and works with a key, the same key always producing the same random output.

	SHA256 DRF: hash a seed + key (or keys), then extract a single UInt32.
	So the state is essentially only the counter.
*/

function Sha256Drf() {
	BaseRng.call( this ) ;
}

Sha256Drf.prototype = Object.create( BaseRng.prototype ) ;
Sha256Drf.prototype.constructor = Sha256Drf ;

module.exports = Sha256Drf ;

Sha256Drf.prototype.isDRF = true ;



// Could be useful one day if we would use more UInt32 out of the sha256 hash, calling a new hash once every 8 this.counter
//Sha256Drf.prototype.initState = function() {} ;



Sha256Drf.prototype.generateUInt32 = function() {
	const str = this.joinStringStates( this.seed , this._key , this.counter ) ;
	//console.log( "SHA str:" , str ) ;
	const uint32 = sha256( str , 'UInt32' ) ;
	this.nextState() ;
	return uint32 ;
} ;

Sha256Drf.prototype.generateBytes = function( count ) {
	const bytes = new Uint8Array( count ) ;
	let remainingBytes = count ;

	while ( remainingBytes > 0 ) {
		const str = this.joinStringStates( this.seed , this._key , this.counter ) ;
		//console.log( "SHA str:" , str ) ;
		const uint8array = sha256( str , 'UInt8Array' ) ;
		bytes.set( uint8array.subarray( 0 , remainingBytes ) , count - remainingBytes ) ;
		remainingBytes -= uint8array.length ;
		this.nextState() ;
	}

	return bytes ;
} ;

BaseRng.createFromUInt32Generator( Sha256Drf ) ;

