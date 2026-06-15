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
const LessEntropy = require( './LessEntropy.js' ) ;

const STATE_SIZE = 624 ;
const INDEX_INC = 397 ;

/*
	Mersenne-Twister pseudo-random generator
*/

// Source: Wikipedia.
function MersenneTwister() {
	this.state = new Uint32Array( STATE_SIZE ) ;
	this.index = 0 ;
	this.isInit = false ;
}

MersenneTwister.prototype = Object.create( BaseRng.prototype ) ;
MersenneTwister.prototype.constructor = MersenneTwister ;

module.exports = MersenneTwister ;



// Initialize the generator from a seed
MersenneTwister.prototype.setSeed = function( newSeed ) {
	var i ;

	this.index = 0 ;
	this.state[ 0 ] = newSeed >>> 0 ;	// To 32bits

	// loop over each other elements
	for ( i = 1 ; i < STATE_SIZE ; i ++ ) {
		this.state[ i ] = 0x6c078965 * ( this.state[ i - 1 ] ^ ( this.state[ i - 1 ] >>> 30 ) ) + i ;
		this.state[ i ] >>>= 0 ; // To 32bits integer
	}
} ;



// Initialize the generator with better random values, but the series cannot be reproduced
// with a single integer seed, you should save the state
MersenneTwister.prototype.betterInit = function() {
	var i ;

	// loop over each other element
	for ( i = 0 ; i < STATE_SIZE ; i ++ ) {
		this.state[ i ] = LessEntropy.prototype.randomUInt32() >>> 0 ;
	}
} ;



// Extract a tempered pseudorandom number based on the this.index-th value,
// calling _generate_numbers() every 624 numbers
MersenneTwister.prototype.randomUInt32 = function() {
	if ( this.index === 0 )  { this._generate_numbers() ; }

	var x = this.state[ this.index ] ;

	x ^= x >>> 11 ;
	x ^= ( x << 7 ) & 0x9d2c5680 ;
	x ^= ( x << 15 ) & 0xefc60000 ;
	x ^= x >>> 18 ;

	this.index = ( this.index + 1 ) % STATE_SIZE ;

	return x >>> 0 ;
} ;

BaseRng.createFromRandomUInt32( MersenneTwister.prototype ) ;



// Generate an array of 624 untempered numbers
MersenneTwister.prototype._generate_numbers = function() {
	var i , x ;

	for ( i = 0 ; i < STATE_SIZE ; i ++ ) {
		x = this.state[ this.index ] ;

		// 0x80000000: bit 31 (32nd bit) of this.state[i]
		// 0x7fffffff: bits 0-30 (first 31 bits) of this.state[...]
		x = ( this.state[ i ] & 0x80000000 ) + ( this.state[ ( i + 1 ) % STATE_SIZE ] & 0x7fffffff ) ;
		this.state[ i ] = this.state[ ( i + INDEX_INC ) % STATE_SIZE ] ^ ( this.state[ i ] >>> 1 ) ;

		if ( x % 2 !== 0 ) {
			this.state[ i ] = this.state[ i ] ^ 0x9908b0df ;
		}
	}
} ;

