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



const BaseRng = require( './BaseRng.js' ) ;

const STATE_SIZE = 624 ;
const INDEX_INC = 397 ;



/*
	Mersenne-Twister pseudo-random generator
*/

// Source: Wikipedia.
function MersenneTwister() {
	BaseRng.call( this ) ;
	this.index = 0 ;
	this.state = new Uint32Array( STATE_SIZE ) ;
}

MersenneTwister.prototype = Object.create( BaseRng.prototype ) ;
MersenneTwister.prototype.constructor = MersenneTwister ;

module.exports = MersenneTwister ;



// Initialize all the states using the seed
MersenneTwister.prototype.initState = function() {
	this.index = 0 ;
	this.state[ 0 ] = this.seed >>> 0 ;	// To 32bits

	for ( let i = 1 ; i < STATE_SIZE ; i ++ ) {
		this.state[ i ] = 0x6c078965 * ( this.state[ i - 1 ] ^ ( this.state[ i - 1 ] >>> 30 ) ) + i ;
		this.state[ i ] >>>= 0 ; // To 32bits integer
	}

	// Immediately twist all states
	this._twistAllStates() ;
} ;



// Call _twistAllStates() every 624 numbers
MersenneTwister.prototype.nextState = function() {
	this.index ++ ;

	if ( this.index >= STATE_SIZE ) {
		this._twistAllStates() ;
		this.index = 0 ;
	}
} ;



// Tempering as done in the classic Mersenne Twister
MersenneTwister.prototype.tempering = function( value ) {
	value ^= value >>> 11 ;
	value ^= ( value << 7 ) & 0x9d2c5680 ;
	value ^= ( value << 15 ) & 0xefc60000 ;
	value ^= value >>> 18 ;
	value = value >>> 0 ;

	return value ;
} ;



// Extract a tempered pseudorandom number based on the this.index-th value,
MersenneTwister.prototype.generate = function() {
	const number = this.tempering( this.state[ this.index ] ) ;
	this.nextState() ;
	return number ;
} ;

BaseRng.createFromUInt32Generator( MersenneTwister ) ;



// Generate an array of 624 untempered numbers
MersenneTwister.prototype._twistAllStates = function() {
	for ( let i = 0 ; i < STATE_SIZE ; i ++ ) {
		// 0x80000000: bit 31 (32nd bit) of this.state[i]
		// 0x7fffffff: bits 0-30 (first 31 bits) of this.state[...]
		const x = ( this.state[ i ] & 0x80000000 ) + ( this.state[ ( i + 1 ) % STATE_SIZE ] & 0x7fffffff ) ;
		this.state[ i ] = this.state[ ( i + INDEX_INC ) % STATE_SIZE ] ^ ( x >>> 1 ) ;

		if ( x & 1 ) {
			this.state[ i ] ^= 0x9908b0df ;
		}
	}
} ;

