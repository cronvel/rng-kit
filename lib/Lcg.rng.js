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



/*
	LCG: Linear congruential generator
	This is generic LCG class, more for fun than for quality.
	There is a big parameter collection, some are really outdated, use with care.
	It also use BigInt, so it's not so fast than implementation using Math.imul().
*/

function Lcg( params = 'glibc' ) {
	BaseRng.call( this ) ;

	this.state = 0n ;
	this.modulus = 0n ;
	this.multiplier = 0n ;
	this.increment = 0n ;
	this.bitMask = 0n ;
	this.bitShift = 0n ;

	this.maxInteger = 0n ;
	this.integerBits = 0 ;

	this.setParameters( params ) ;
}

Lcg.prototype = Object.create( BaseRng.prototype ) ;
Lcg.prototype.constructor = Lcg ;

module.exports = Lcg ;



// https://en.wikipedia.org/wiki/Linear_congruential_generator#Parameters_in_common_use
const LCG_CONSTANTS = {
	//						modulus					multiplier		increment		lowest bit		highest bit
	glibc:				[	1n << 31n ,				1103515245n ,	12345n ,		0n ,			30n	] ,
	ANSI_C:				[	1n << 31n ,				1103515245n ,	12345n ,		16n ,			30n	] ,
	POSIX_rand48:		[	1n << 48n ,				25214903917n ,	11n ,			0n ,			47n	] ,
	MINSTD:				[	( 1n << 31n ) - 1n ,	48271n ,		0n ,			16n ,			30n	] ,
	MS_VISUAL_CPP:		[	1n << 31n ,				214013n ,		2531011n ,		16n ,			30n	] ,
	MS_VISUAL_BASIC:	[	1n << 24n ,				1140671485n ,	12820163n ,		0n ,			23n	]
} ;

const DEFAULT_CONSTANTS = LCG_CONSTANTS.glibc ;



Lcg.prototype.setParameters = function( params ) {
	if ( typeof params === 'string' ) {
		if ( ! Object.hasOwn( LCG_CONSTANTS , params ) ) {
			throw new Error( "Unknown common parameters: " + params ) ;
		}

		params = LCG_CONSTANTS[ params ] ;

		this.modulus = params[ 0 ] ;
		this.multiplier = params[ 1 ] ;
		this.increment = params[ 2 ] ;
		this.bitMask = ( 1n << params[ 4 ] + 1n ) - 1n ;
		this.bitShift = params[ 3 ] ;
	}
	else if ( params && typeof params === 'object' ) {
		this.modulus = Object.hasOwn( params.modulus ) ? BigInt( params.modulus ) : DEFAULT_CONSTANTS[ 0 ] ;
		this.multiplier = Object.hasOwn( params.multiplier ) ? BigInt( params.multiplier ) : DEFAULT_CONSTANTS[ 1 ] ;
		this.increment = Object.hasOwn( params.increment ) ? BigInt( params.increment ) : DEFAULT_CONSTANTS[ 2 ] ;
		this.bitMask =
			Object.hasOwn( params.bitMask ) ? BigInt( params.bitMask ) :
			Object.hasOwn( params.highestBit ) ? ( 1n << BigInt( params.highestBit ) + 1n ) - 1n :
			( 1n << DEFAULT_CONSTANTS[ 4 ] + 1n ) - 1n ;
		this.bitShift =
			Object.hasOwn( params.bitShift ) ? BigInt( params.bitShift ) :
			Object.hasOwn( params.lowestBit ) ? BigInt( params.lowestBit ) :
			DEFAULT_CONSTANTS[ 3 ] ;
	}

	this.updateDerivedParameters() ;
} ;



Lcg.prototype.updateDerivedParameters = function() {
	const shiftedMask = this.bitMask >> this.bitShift ;
	const shiftedModulus = this.modulus >> this.bitShift ;
	this.maxInteger = shiftedMask <= shiftedModulus ? shiftedMask : shiftedModulus ;
	this.integerBits = Math.floor( Math.log2( Number( this.maxInteger + 1n ) ) ) ;
	console.log( "maxInteger:" , this.maxInteger , "integerBits:" , this.integerBits ) ;
} ;



Lcg.prototype.initState = function() {
	let scrambledSeed = this.scrambleSeed( this.seed ) ;

	if ( this.channelSeed ) {
		scrambledSeed ^= this.scrambleSeed( this.channelSeed ) ;
	}

	//this.state = scrambledSeed >>> 0 ; // To 32bits
	this.state = BigInt( scrambledSeed ) ;
} ;



Lcg.prototype.nextState = function() {
	// UNSAFE, it will grow past Number.MAX_SAFE_INTEGER which is 9007199254740991, e.g. for glibc multiplier
	// Either use BigInt or use multiplication in 2-step (for lower and higher bits), or maybe Math.imul()
	//this.state = ( ( this.increment + this.state * this.multiplier ) % this.modulus ) >>> 0 ;

	// 32-bits Version using Math.imul()
	//this.state = ( ( ( this.increment + Math.imul( this.state , this.multiplier ) ) >>> 0 ) % this.modulus ) >>> 0 ;

	// BigInt version
	this.state = ( this.increment + this.state * this.multiplier ) % this.modulus ;

	this.count ++ ;
} ;



Lcg.prototype.generateBigInt = function() {
	// The size of the integer depends on the modulus and the bit mask/bit shift, most of time it's not a Uint32...
	const bigInt = ( this.state & this.bitMask ) >> this.bitShift ;
	this.nextState() ;
	return bigInt ;
} ;

BaseRng.createFromBigIntGenerator( Lcg ) ;

