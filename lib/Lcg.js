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
	This is generic LCG class, more for fun than for the correctness
*/

function Lcg( params ) {
	BaseRng.call( this ) ;
	this.state = 0 ;
	this.modulus = 0 ;
	this.multiplier = 0 ;
	this.increment = 0 ;
	this.bitMask = 0 ;
	this.bitShift = 0 ;
	this.setParameters( params ) ;
}

Lcg.prototype = Object.create( BaseRng.prototype ) ;
Lcg.prototype.constructor = Lcg ;

module.exports = Lcg ;



// https://en.wikipedia.org/wiki/Linear_congruential_generator#Parameters_in_common_use
const LCG_CONSTANTS = {
	//			modulus			multiplier		increment		lowest bit		highest bit
	glibc: [	2 ** 31 ,		1103515245 ,	12345 ,			0 ,				30	] ,
} ;



Lcg.prototype.setParameters = function( params = 'glibc' ) {
	if ( typeof params === 'string' ) {
		if ( ! Object.hasOwn( LCG_CONSTANTS , params ) ) {
			throw new Error( "Unknown common parameters: " + params ) ;
		}

		params = LCG_CONSTANTS[ params ] ;
		this.modulus = params[ 0 ] ;
		this.multiplier = params[ 1 ] ;
		this.increment = params[ 2 ] ;
		this.bitMask = ( ( 1 << params[ 3 ] ) - 1 ) >>> 0 ;
		this.bitShift = params[ 4 ] ;
	}
	else {
		const defaultParams = LCG_CONSTANTS.glibc ;
		this.modulus = params.modulus ?? defaultParams.modulus ;
		this.multiplier = params.multiplier ?? defaultParams.multiplier ;
		this.increment = params.increment ?? defaultParams.increment ;
		this.bitMask =  params.bitMask  ??  ( ( 1 << ( params.highestBit ?? params[ 3 ] ) ) - 1 ) >>> 0  ;
		this.bitShift = params.bitShift ?? params.lowestBit ?? params[ 4 ] ;
	}
} ;



Lcg.prototype.initState = function() {
	let scrambledSeed = this.scrambleSeed( this.seed ) ;

	if ( this.channelSeed ) {
		scrambledSeed ^= this.scrambleSeed( this.channelSeed ) ;
	}

	this.state[ 0 ] = scrambledSeed >>> 0 ; // To 32bits
} ;



Lcg.prototype.nextState = function() {
	// UNSAFE, it will grow past Number.MAX_SAFE_INTEGER which is 9007199254740991, e.g. for glibc multiplier
	// Either use BigInt or use multiplication in 2-step (for lower and higher bits), or maybe Math.imul()
	//this.state = ( ( this.increment + this.state * this.multiplier ) % this.modulus ) >>> 0 ;
	this.state = ( ( ( this.increment + Math.imul( this.state , this.multiplier ) ) >>> 0 ) % this.modulus ) >>> 0 ;

	this.count ++ ;
} ;



Lcg.prototype.generate = function() {
	const uint32 = ( this.state & this.bitMask ) >>> this.bitShift ;
	this.nextState() ;
	return uint32 ;
} ;

BaseRng.createFromUInt32Generator( Lcg ) ;

