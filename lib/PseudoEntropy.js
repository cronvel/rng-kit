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
const crypto = require( 'crypto' ) ;



/*
	It uses node's crypto pseudo-random
*/

function PseudoEntropy() {
	BaseRng.call( this ) ;
}

PseudoEntropy.prototype = Object.create( BaseRng.prototype ) ;
PseudoEntropy.prototype.constructor = PseudoEntropy ;

module.exports = PseudoEntropy ;

// Get a pseudo random uint32
PseudoEntropy.prototype.generate = function() {
	return crypto.pseudoRandomBytes( 4 ).readUInt32LE( 0 , true ) ;
} ;

BaseRng.createFromUInt32Generator( PseudoEntropy ) ;

