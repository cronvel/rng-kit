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
const sha256 = require( './sha256.js' ) ;

const JOINT = '|' ;
const REPLACE_JOINT_REGEX = /\|/g ;
const JOINT_REPLACER = '-' ;



/*
	SHA256Prng: hash a seed + channel seed and counter, then extract a single UInt32.
	So the state is essentially only the counter.
*/

function SHA256Prng() {
	BaseRng.call( this ) ;
}

SHA256Prng.prototype = Object.create( BaseRng.prototype ) ;
SHA256Prng.prototype.constructor = SHA256Prng ;

module.exports = SHA256Prng ;



SHA256Prng.prototype.generate = function() {
	const str =
		this._sanitize( this.seed ) + JOINT
		+ this._sanitize( this.channelSeed ) + JOINT
		+ this._sanitize( this.count ) ;

	const uint32 = sha256( str , 'UInt32' ) ;

	this.nextState() ;

	return uint32 ;
} ;

BaseRng.createFromUInt32Generator( SHA256Prng ) ;



SHA256Prng.prototype._sanitize = function( str ) {
	if ( Array.isArray( str ) ) {
		return str.map( subStr => this._sanitize( subStr ) ).join( JOINT ) ;
	}

	str = '' + str ;
	str = str.replace( REPLACE_JOINT_REGEX , JOINT_REPLACER ) ;

	return str ;
} ;

