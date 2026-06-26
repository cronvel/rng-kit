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

const MASK_64 = 0xffff_ffff_ffff_ffffn ;



/*
	xoshiro**: xor shift rotate **
*/

function Xoshiro256ss() {
	BaseRng.call( this ) ;

	this.state = [ 0n , 0n , 0n , 0n ] ;
}

Xoshiro256ss.prototype = Object.create( BaseRng.prototype ) ;
Xoshiro256ss.prototype.constructor = Xoshiro256ss ;

module.exports = Xoshiro256ss ;



Xoshiro256ss.prototype.integerBits = 64 ;
Xoshiro256ss.prototype.maxInteger = MASK_64 ;



Xoshiro256ss.prototype.initState = function() {
	let scrambledSeed = this.scrambleSeed( this.seed ) ;

	if ( this.channelSeed ) {
		scrambledSeed ^= this.scrambleSeed( this.channelSeed ) ;
		scrambledSeed = scrambledSeed >>> 0 ;
	}

	// SplitMix64

	let x = BigInt( scrambledSeed ) & MASK_64 ;

	const next = () => {
		x = ( x + 0x9e3779b97f4a7c15n ) & MASK_64 ;

		let z = x ;
		z = ( ( z ^ ( z >> 30n ) ) * 0xbf58476d1ce4e5b9n ) & MASK_64 ;
		z = ( ( z ^ ( z >> 27n ) ) * 0x94d049bb133111ebn ) & MASK_64 ;

		return ( z ^ ( z >> 31n ) ) & MASK_64 ;
	} ;

	this.state[ 0 ] = next() ;
	this.state[ 1 ] = next() ;
	this.state[ 2 ] = next() ;
	this.state[ 3 ] = next() ;
} ;



Xoshiro256ss.prototype.nextState = function() {
	const s = this.state ;
	const t = ( s[ 1 ] << 17n ) & MASK_64 ;

	s[ 2 ] ^= s[ 0 ] ;
	s[ 3 ] ^= s[ 1 ] ;
	s[ 1 ] ^= s[ 2 ] ;
	s[ 0 ] ^= s[ 3 ] ;
	s[ 2 ] ^= t ;
	s[ 3 ] = rotl( s[ 3 ] , 45 ) ;

	this.count ++ ;
} ;



Xoshiro256ss.prototype.generateBigInt = function() {
	const bigInt = ( rotl( ( this.state[ 1 ] * 5n ) & MASK_64 , 7 ) * 9n ) & MASK_64 ;
	this.nextState() ;
	return bigInt ;
} ;

BaseRng.createFromBigIntGenerator( Xoshiro256ss ) ;



function rotl( x , k ) {
	return ( ( x << BigInt( k ) ) | ( x >> ( 64n - BigInt( k ) ) ) ) & MASK_64 ;
}

