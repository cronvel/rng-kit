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

/*
	Utilities for sampling an array.
*/

exports.buildCumulativeWeights = ( weights ) => {
	const cumulativeWeights = new Array( weights.length ) ;
	let sum = 0 ;

	for ( let i = 0 ; i < weights.length ; i ++ ) {
		sum += weights[ i ] ;
		cumulativeWeights[ i ] = sum ;
	}

	return cumulativeWeights ;
} ;



exports.buildCumulativeWeightsFromObjects = ( array , weightProperty ) => {
	const cumulativeWeights = new Array( array.length ) ;
	let sum = 0 ;

	for ( let i = 0 ; i < array.length ; i ++ ) {
		sum += array[ i ][ weightProperty ] ;
		cumulativeWeights[ i ] = sum ;
	}

	return cumulativeWeights ;
} ;



exports.randomIndexFromCumulativeWeights = ( cumulativeWeights , randomFloat ) => {
	const random = randomFloat * cumulativeWeights[ cumulativeWeights.length - 1 ] ;

	// Divide and conquer algo (also named binary search)
	let lowerBound = 0 ;
	let upperBound = cumulativeWeights.length - 1 ;

	while ( lowerBound < upperBound ) {
		const midIndex = ( lowerBound + upperBound ) >>> 1 ;	// divide by 2 and round down

		if ( random < cumulativeWeights[ midIndex ] ) {
			upperBound = midIndex ;
		}
		else {
			lowerBound = midIndex + 1 ;
		}
	}

	return lowerBound ;
} ;



// Nullify a weight and update cumulative weights
exports.nullifyCumulativeWeightsAtIndex = ( cumulativeWeights , startIndex ) => {
	const delta =
		startIndex > 0 ? cumulativeWeights[ startIndex - 1 ] - cumulativeWeights[ startIndex ] :
		- cumulativeWeights[ startIndex ] ;

	for ( let i = startIndex ; i < cumulativeWeights.length ; i ++ ) {
		cumulativeWeights[ i ] += delta ;
	}
} ;

