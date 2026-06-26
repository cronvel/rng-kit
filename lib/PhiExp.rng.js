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

const MAX_UINT32 = 4294967296.0 ;

// Phi is the most irrationnal number, it should also provide enough lower bits perturbation
const PHI = ( 1 + Math.sqrt( 5 ) ) / 2 ;
const INV_PHI = PHI - 1 ;

// The state will “spin” at least that many time (it's modulus).
// This will ensure that 1 millionth produce enough perturbation (can spin once more or once less).
const SPIN = 1024 * 1024 ;



/*
	PhiExp: a custom and EXPerimental RNG based on float and PHI.
	It's like an LCG, but float-based, and the increment is applied first, ensuring that state values
	very very closed to zero will still “spin”.

	Probably not so good, just for fun and educationnal.
*/

function PhiExp() {
	BaseRng.call( this ) ;
	this.state = 0 ;
}

PhiExp.prototype = Object.create( BaseRng.prototype ) ;
PhiExp.prototype.constructor = PhiExp ;

module.exports = PhiExp ;



PhiExp.prototype.initState = function() {
	let scrambledSeed = this.scrambleSeed( this.seed ) ;

	if ( this.channelSeed ) {
		scrambledSeed ^= this.scrambleSeed( this.channelSeed ) ;
		scrambledSeed = scrambledSeed >>> 0 ;
	}

	this.state = ( scrambledSeed >>> 0 ) / MAX_UINT32 ;
} ;



PhiExp.prototype.nextState = function() {
	this.state = ( ( this.state + INV_PHI ) * SPIN * PHI ) % 1 ;
	this.count ++ ;
} ;



PhiExp.prototype.generateFloat = function() {
	const float = this.state ;
	this.nextState() ;
	return float ;
} ;

BaseRng.createFromFloatGenerator( PhiExp ) ;

