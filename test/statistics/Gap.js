"use strict" ;

const BaseTest = require( './BaseTest.js' ) ;

const logger = require( './logger.js' ) ;
const stat = require( '../../lib/stat.js' ) ;



function Gap( preAllocator , params = {} ) {
	BaseTest.call( this , preAllocator ) ;
	this.samples = params.samples ?? 2_000_000 ;
	this.intervalMin = params.intervalMin ?? 0.25 ;
	this.intervalMax = params.intervalMax ?? 0.75 ;	// excluded
	this.maxGap = params.maxGap ?? 8 ;	// included
	this.requiredFloats = this.samples ;

	this.testName = 'Gap [' + this.intervalMin + ',' + this.intervalMax + ')' ;
}

Gap.prototype = Object.create( BaseTest.prototype ) ;
Gap.prototype.constructor = Gap ;

module.exports = Gap ;

Gap.prototype.testName = 'Gap' ;
Gap.prototype.description = 'Measure the number of consecutive below / above the median' ;



Gap.prototype.run = function() {
	const startTime = Date.now() ;

	const gapHistogram = new Array( this.maxGap + 1 ).fill( 0 ) ;
	const hitProbability = this.intervalMax - this.intervalMin ;
	const expectedChiSquared = this.maxGap ;
	const sigmaChiSquared = Math.sqrt( 2 * expectedChiSquared ) ;	// standard deviation for chi²

	let currentGap = 0 ;
	let gapCount = 1 ;

	for ( let i = 0 ; i < this.samples ; i ++ ) {
		const float = this.preAllocator.floatArray[ i ] ;

		if ( float >= this.intervalMin && float < this.intervalMax ) {
			if ( currentGap <= this.maxGap ) {
				gapHistogram[ currentGap ] ++ ;
			}
			else {
				// Merge the tail
				gapHistogram[ this.maxGap ] ++ ;
			}

			currentGap = 0 ;
			gapCount ++ ;
		}
		else {
			currentGap ++ ;
		}
	}

	if ( currentGap <= this.maxGap ) {
		// Merge the tail
		gapHistogram[ this.maxGap ] ++ ;
	}
	else {
		gapHistogram[ currentGap ] ++ ;
	}


	let chiSquared = 0 ;
	let probabilitySum = 0 ;

	for ( let i = 0 ; i <= this.maxGap ; i ++ ) {
		let probability ;

		if ( i < this.maxGap ) {
			probability = ( ( 1 - hitProbability ) ** i ) * hitProbability ;
			probabilitySum += probability ;
		}
		else {
			probability = 1 - probabilitySum ;
		}

		const expected = probability * gapCount ;
		const errorSquared = ( ( gapHistogram[ i ] - expected ) ** 2 ) / expected ;
		chiSquared += errorSquared ;
		logger.log( "Error for gap %i:\t%[.2]f\t%i / %[.2]f" , i , errorSquared , gapHistogram[ i ] , expected ) ;
	}

	const zScore = BaseTest.zScore( chiSquared , expectedChiSquared , sigmaChiSquared ) ;
	const pValue = BaseTest.zScoreToPValue( zScore ) ;

	const duration = Date.now() - startTime ;

	this.reportData = {
		duration ,
		extra: [
			'maxGap' , 'intervalMin' , 'intervalMax' ,
			[ 'Hit probability' , hitProbability , "%[.3]f" ] ,
			[ 'Gap count' , gapCount , "%[.3]f" ]
		] ,
		measureOf: "χ²" ,
		actual: chiSquared ,
		expected: expectedChiSquared ,
		stdDev: sigmaChiSquared ,
		zScore ,
		pValue
	} ;
} ;

