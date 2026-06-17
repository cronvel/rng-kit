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


const MASK64 = ( 1n << 64n ) - 1n ;
const MASK32 = ( 1n << 32n ) - 1n ;
const MULTIPLIER = 6364136223846793005n ;
const DEFAULT_INCREMENT = 1442695040888963407n ;



/*
	PCG32: Permuted congruential generator
	(better than LCG: Linear Congruential Generator, but similar)
*/

function Pcg32() {
	BaseRng.call( this ) ;
    this.sequenceSeed = null ;
	this.state = 0n ;
	this.increment = DEFAULT_INCREMENT ;
}

Pcg32.prototype = Object.create( BaseRng.prototype ) ;
Pcg32.prototype.constructor = Pcg32 ;

module.exports = Pcg32 ;



Pcg32.prototype.initState = function() {
	let scrambledSeed = this.scrambleSeed( this.seed ) ;

	if ( this.channelSeed ) {
		scrambledSeed ^= this.scrambleSeed( this.channelSeed ) ;
	}

	this.state = ( this.increment + MULTIPLIER * ( this.increment + BigInt( scrambledSeed ) ) ) & MASK64 ;

	if ( this.sequenceSeed ) {
		// Ensure the increment is odd
		this.increment = BigInt( this.scrambleSeed( this.sequenceSeed ) ) << 1n | 1n & MASK64 ;
	}
	else {
		this.increment = DEFAULT_INCREMENT ;
	}
} ;



Pcg32.prototype.nextState = function() {
	this.state = ( this.increment + this.state * MULTIPLIER ) & MASK64 ;
	this.count ++ ;
} ;



Pcg32.prototype.generate = function() {
	const uint32 = this.tempering( this.state ) ;
	this.nextState() ;
	return uint32 ;
} ;

BaseRng.createFromUInt32Generator( Pcg32 ) ;



// XSH-RR is used for tempering the 64-bits state into a suitable number
Pcg32.prototype.tempering = function( bigIntValue ) {
	const xorShifted = Number( ( ( ( bigIntValue >> 18n ) ^ bigIntValue ) >> 27n ) & MASK32 ) ;
	const rightRot = Number( ( bigIntValue >> 59n ) & 31n ) ;
	const leftRot = ( 32 - rightRot ) & 31 ;
	return ( ( ( xorShifted >>> rightRot ) | ( xorShifted << leftRot ) ) ) >>> 0 ;
} ;

