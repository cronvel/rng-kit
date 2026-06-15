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

function PCG32() {
	this.state = 0n ;
	this.increment = DEFAULT_INCREMENT ;
	this.isInit = false ;
}

PCG32.prototype = Object.create( BaseRng.prototype ) ;
PCG32.prototype.constructor = PCG32 ;

module.exports = PCG32 ;



PCG32.prototype.setSeed = function( seedState , seedSequence ) {
	// Ensure the increment is odd
	this.increment = seedSequence === undefined ? DEFAULT_INCREMENT : BigInt( seedSequence ) << 1n | 1n & MASK64 ;
	this.state = ( this.increment + MULTIPLIER * ( this.increment + BigInt( seedState ) ) ) & MASK64 ;
} ;



PCG32.prototype.autoSeed = function() {
	const seed = new Date().getTime() ;
	const seedSequence = seed ^ Number( DEFAULT_INCREMENT & MASK32 ) ;
	this.setSeed( seed , seedSequence ) ;
} ;



PCG32.prototype.nextState = function() {
	this.state = ( this.increment + this.state * MULTIPLIER ) & MASK64 ;
} ;



// XSH-RR is used to transform the 64-bits state into a suitable number
PCG32.prototype.xshrr = function() {
	const xorShifted = Number( ( ( ( this.state >> 18n ) ^ this.state ) >> 27n ) & MASK32 ) ;
	const rightRot = Number( ( this.state >> 59n ) & 31n ) ;
	const leftRot = ( 32 - rightRot ) & 31 ;
	return ( ( ( xorShifted >>> rightRot ) | ( xorShifted << leftRot ) ) ) >>> 0 ;
} ;



PCG32.prototype.randomUInt32 = function() {
	const number = this.xshrr() ;
	this.nextState() ;
	return number ;
} ;

BaseRng.createFromRandomUInt32( PCG32.prototype ) ;

