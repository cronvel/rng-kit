"use strict" ;

const BaseTest = require( './BaseTest.js' ) ;

const logger = require( './logger.js' ) ;
const stat = require( '../../lib/stat.js' ) ;



function Runs( preAllocator , params = {} ) {
	BaseTest.call( this , preAllocator ) ;
	this.samples = params.samples ?? 200_000 ;
	this.maxRunLength = params.maxRunLength ?? 8 ;
	this.requiredFloats = this.samples ;
}

Runs.prototype = Object.create( BaseTest.prototype ) ;
Runs.prototype.constructor = Runs ;

module.exports = Runs ;

Runs.prototype.testName = 'Runs' ;
Runs.prototype.description = 'Measure the number of consecutive below / above the median' ;



Runs.prototype.run = function() {
	const startTime = Date.now() ;

	const runsHistogram = new Array( this.maxRunLength ).fill( 0 ) ;
	const expectedChiSquared = this.maxRunLength - 1 ;
	const sigmaChiSquared = Math.sqrt( 2 * expectedChiSquared ) ;	// standard deviation for chi²


	let belowCount = 0 , aboveCount = 0 ;

	for ( let i = 0 ; i < this.samples ; i ++ ) {
		if ( this.preAllocator.floatArray[ i ] < 0.5 ) { belowCount ++ ; }
		else { aboveCount ++ ; }
	}

	const expectedRuns = 1 + ( 2 * belowCount * aboveCount ) / this.samples ;
	const sigmaRuns = Math.sqrt(
		( 2 * belowCount * aboveCount ) * ( 2 * belowCount * aboveCount - this.samples ) /
		( ( this.samples * this.samples ) * ( this.samples - 1 ) )
	) ;


	let previousFloat = this.preAllocator.floatArray[ 0 ] ;
	let currentRunLength = 0 ;	// in fact, the real run value is currentRunLength + 1, but we store in a zero-index-based array
	let runs = 1 ;

	for ( let i = 1 ; i < this.samples ; i ++ ) {
		const previousFloat = this.preAllocator.floatArray[ i - 1 ] ;
		const float = this.preAllocator.floatArray[ i ] ;

		if ( ( float < 0.5 && previousFloat < 0.5 ) || ( float >= 0.5 && previousFloat >= 0.5 ) ) {
			currentRunLength ++ ;
		}
		else {
			if ( currentRunLength < this.maxRunLength ) {
				runsHistogram[ currentRunLength ] ++ ;
			}
			else {
				// Merge the tail
				runsHistogram[ this.maxRunLength - 1 ] ++ ;
			}

			currentRunLength = 0 ;
			runs ++ ;
		}
	}

	if ( currentRunLength < this.maxRunLength ) {
		runsHistogram[ currentRunLength ] ++ ;
	}
	else {
		// Merge the tail
		runsHistogram[ this.maxRunLength - 1 ] ++ ;
	}


	let chiSquared = 0 ;

	for ( let i = 0 ; i < this.maxRunLength ; i ++ ) {
		// The Math.min part is because the last bucket has all the tails merged
		const expected = runs * ( 2 ** - Math.min( i + 1 , this.maxRunLength - 1 ) ) ;
		const errorSquared = ( ( runsHistogram[ i ] - expected ) ** 2 ) / expected ;
		chiSquared += errorSquared ;
		//logger.log( "Error for run length %i:\t%[.2]f\t%i / %[.2]f" , i + 1 , errorSquared , runsHistogram[ i ] , expected ) ;
	}

	const zScore = BaseTest.zScore( chiSquared , expectedChiSquared , sigmaChiSquared ) ;
	const zScoreRuns = BaseTest.zScore( runs , expectedRuns , sigmaRuns ) ;
	const pValue = BaseTest.zScoreToPValue( zScore ) ;

	const duration = Date.now() - startTime ;

	this.reportData = {
		duration ,
		extra: [
			'maxRunLength' ,
			[ 'Runs' , runs ] ,
			[ 'Expected Runs' , expectedRuns , "%[.2]f" ] ,
			[ 'Std-dev of Runs' , sigmaRuns , "%[.2]f" ] ,
			[ 'Z-score Runs' , zScoreRuns , "%[+.2]fσ" ] ,
		] ,
		measureOf: "χ²" ,
		actual: chiSquared ,
		expected: expectedChiSquared ,
		stdDev: sigmaChiSquared ,
		zScore ,
		pValue
	} ;
} ;

