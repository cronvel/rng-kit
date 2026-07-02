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



const BaseNoise = require( './BaseNoise.js' ) ;
const misc = require( './misc.js' ) ;



/*
	Perlin Noise port.
	It's modified from the original, since there is no predefined gradient table, and it uses a hash method instead of permutations.
	The DRF (Sha256Drf) is used to get the gradient at each lattice points.
*/

function Perlin( dimensions ) {
	BaseNoise.call( this ) ;
	this.dimensions = dimensions ;
	this.gradientList = null ;
	this.initGradientList() ;
}

Perlin.prototype = Object.create( BaseNoise.prototype ) ;
Perlin.prototype.constructor = Perlin ;

module.exports = Perlin ;



Perlin.prototype.getValueAt = function( x , y ) {
	// Integer lattice coordinates
	const x0 = Math.floor( x ) ;
	const y0 = Math.floor( y ) ;

	const x1 = x0 + 1 ;
	const y1 = y0 + 1 ;

	// Local position inside the cell
	const localX = x - x0 ;
	const localY = y - y0 ;

	// Gradients
	const g00 = this.drf.key( x0 , y0 ).randomUnitVector( 2 ) ;
	const g10 = this.drf.key( x1 , y0 ).randomUnitVector( 2 ) ;
	const g01 = this.drf.key( x0 , y1 ).randomUnitVector( 2 ) ;
	const g11 = this.drf.key( x1 , y1 ).randomUnitVector( 2 ) ;

	// Distance vectors
	const n00 = misc.dot( g00[0] , g00[1] , localX ,     localY ) ;
	const n10 = misc.dot( g10[0] , g10[1] , localX - 1 , localY ) ;
	const n01 = misc.dot( g01[0] , g01[1] , localX ,     localY - 1 ) ;
	const n11 = misc.dot( g11[0] , g11[1] , localX - 1 , localY - 1 ) ;

	// Fade curves
	const u = misc.fade( localX ) ;
	const v = misc.fade( localY ) ;

	// Bilinear interpolation
	const nx0 = misc.lerp( n00 , n10 , u ) ;
	const nx1 = misc.lerp( n01 , n11 , u ) ;

	return misc.lerp( nx0 , nx1 , v ) ;
} ;

