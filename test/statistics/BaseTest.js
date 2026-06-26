
"use strict" ;

const stat = require( '../../lib/stat.js' ) ;
const logger = require( './logger.js' ) ;

const string = require( 'string-kit' ) ;



function BaseTest( rng ) {
	this.rng = rng ;
}

module.exports = BaseTest ;



BaseTest.zScore = ( actual , expected , stdDev ) => ( actual - expected ) / stdDev ;
BaseTest.zScoreToPValue = zScore => stat.erfc( Math.abs( zScore ) / Math.SQRT2 ) ;
BaseTest.aggregateZScores = ( ... zScores ) => zScores.reduce( ( acc , zScore ) => acc + zScore , 0 ) / zScores.length ;



BaseTest.prototype.displayResults = function( params ) {
	logger.log( "\n^B== %s ==" , this.testName ) ;
	logger.log( "^K  -- %s" , this.description ) ;
	logger.log( "Duration: %[.3!a]t" , params.duration ) ;

	if ( Object.hasOwn( this , 'batches' ) ) {
		logger.log( "Batches: %k" , this.batches ) ;
		logger.log( "Samples per batch: %k" , this.samples ) ;
		logger.log( "Samples: %k" , this.samples * this.batches ) ;
	}
	else {
		logger.log( "Samples: %k" , this.samples ) ;
	}

	if ( params.extra ) {
		for ( let extraParam of params.extra ) {
			if ( typeof extraParam === 'string' ) {
				logger.log( string.toTitleCase( extraParam ) + ": %f" , this[ extraParam ] ) ;
			}
		}
	}

	logger.log( params.measureOf + ": %[.2]f" , params.actual ) ;
	logger.log( "Expected " + params.measureOf + ": %[.2]f" , params.expected ) ;
	logger.log( "Std-dev of " + params.measureOf + ": %[.2]f" , params.stdDev ) ;

	if ( Math.abs( params.zScore ) > 5 ) {
		logger.log( "Z-score: ^R%[+.2]fσ " , params.zScore ) ;
		logger.log( "P-value: %[5]f " , params.pValue ) ;
	}
	else if ( Math.abs( params.zScore ) > 3 ) {
		logger.log( "Z-score: ^Y%[+.2]fσ " , params.zScore ) ;
		logger.log( "P-value: %[5]f " , params.pValue ) ;
	}
	else {
		logger.log( "Z-score: %[+.2]fσ " , params.zScore ) ;
		logger.log( "P-value: %[5]f " , params.pValue ) ;
	}
} ;

