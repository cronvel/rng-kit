"use strict" ;

const stat = require( '../../lib/stat.js' ) ;
const logger = require( './logger.js' ) ;

const string = require( 'string-kit' ) ;



function BaseTest( preAllocator ) {
	this.preAllocator = preAllocator ;
	this.requiredFloats = 0 ;
	this.reportData = null ;
}

module.exports = BaseTest ;



BaseTest.zScore = ( actual , expected , stdDev ) => ( actual - expected ) / stdDev ;
BaseTest.zScoreToPValue = zScore => stat.erfc( Math.abs( zScore ) / Math.SQRT2 ) ;
BaseTest.aggregateZScores = ( ... zScores ) => zScores.reduce( ( acc , zScore ) => acc + zScore , 0 ) / zScores.length ;



BaseTest.prototype.prepare = function() {
	this.preAllocator.allocateFloats( this.requiredFloats ) ;
} ;



BaseTest.prototype.displayReport = function() {
	logger.log( "\n^B== %s ==" , this.testName ) ;
	logger.log( "^K  -- %s" , this.description ) ;
	logger.log( "Duration: %[.3!a]t" , this.reportData.duration ) ;

	if ( this.requiredFloats ) {
		logger.log( "Required random floats: %k" , this.requiredFloats ) ;
	}

	if ( Object.hasOwn( this , 'batches' ) ) {
		logger.log( "Batches: %k" , this.batches ) ;
		logger.log( "Samples per batch: %k" , this.samples ) ;
		logger.log( "Samples: %k" , this.samples * this.batches ) ;
	}
	else {
		logger.log( "Samples: %k" , this.samples ) ;
	}

	if ( this.reportData.extra ) {
		for ( let extraParam of this.reportData.extra ) {
			if ( typeof extraParam === 'string' ) {
				// This is a property of the object
				logger.log( string.toTitleCase( extraParam ) + ": %f" , this[ extraParam ] ) ;
			}
			else if ( Array.isArray( extraParam ) ) {
				// This is an ad-hoc value
				if ( extraParam[ 2 ] ) {
					// Has a format
					logger.log( string.toTitleCase( extraParam[ 0 ] ) + ": " + extraParam[ 2 ] , extraParam[ 1 ] ) ;
				}
				else {
					logger.log( string.toTitleCase( extraParam[ 0 ] ) + ": %f" , extraParam[ 1 ] ) ;
				}
			}
		}
	}

	logger.log( this.reportData.measureOf + ": %[.2]f" , this.reportData.actual ) ;
	logger.log( "Expected " + this.reportData.measureOf + ": %[.2]f" , this.reportData.expected ) ;
	logger.log( "Std-dev of " + this.reportData.measureOf + ": %[.2]f" , this.reportData.stdDev ) ;

	if ( Math.abs( this.reportData.zScore ) > 5 ) {
		logger.log( "Z-score: ^R%[+.2]fσ" , this.reportData.zScore ) ;
		logger.log( "P-value: %[5]f" , this.reportData.pValue ) ;
	}
	else if ( Math.abs( this.reportData.zScore ) > 3 ) {
		logger.log( "Z-score: ^Y%[+.2]fσ" , this.reportData.zScore ) ;
		logger.log( "P-value: %[5]f" , this.reportData.pValue ) ;
	}
	else {
		logger.log( "Z-score: %[+.2]fσ" , this.reportData.zScore ) ;
		logger.log( "P-value: %[5]f" , this.reportData.pValue ) ;
	}
} ;



BaseTest.prototype.displaySummary = function() {
	if ( Math.abs( this.reportData.zScore ) > 5 ) {
		logger.log( "  ^r✘ %s (%[+.2]fσ)" , this.testName , this.reportData.zScore ) ;
	}
	else if ( Math.abs( this.reportData.zScore ) > 3 ) {
		logger.log( "  ^y≈ %s (%[+.2]fσ)" , this.testName , this.reportData.zScore ) ;
	}
	else {
		logger.log( "  ^g✔ %s (%[+.2]fσ)" , this.testName , this.reportData.zScore ) ;
	}
} ;

