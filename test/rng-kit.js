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

/* global expect, describe, it, before, after */



const rngKit = require( '..' ) ;
const crypto = require( 'crypto' ) ;



describe( "SHA-256 built-in lib tests" , () => {

	function compareHash( str ) {
		expect( rngKit.sha256( str , 'hex' ) ).to.be( crypto.hash( 'sha256' , str ) ) ;
	}

	it( "should produce the same output than Node.js crypto.hash()" , () => {
		compareHash( '' ) ;
		compareHash( "a string" ) ;
		compareHash( "yet another string" ) ;
		compareHash( "a very very long string".repeat( 100 ) ) ;
	} ) ;

	it( "re-usable states" , () => {
		let output ;
		const state = rngKit.sha256.initState() ;

		output = rngKit.sha256( "a string" , { outputFormat: 'hex' , state } ) ;
		console.log( "output:" , output ) ;
		output = rngKit.sha256( "a string" , { outputFormat: 'hex' , state } ) ;
		console.log( "output:" , output , rngKit.sha256( "a stringa string" , 'hex' ) ) ;
	} ) ;
} ) ;

