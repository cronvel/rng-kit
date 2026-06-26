
"use strict" ;

const BaseTest = require( './BaseTest.js' ) ;

const logger = require( './logger.js' ) ;
const stat = require( '../lib/stat.js' ) ;



function Uniformity( rng ) {
	BaseTest.call( this , rng ) ;
	this.buckets = 256 ;
	this.samples = 1_000_000 ;
}

Uniformity.prototype = Object.create( Uniformity.prototype ) ;
Uniformity.prototype.constructor = Uniformity ;

module.exports = Uniformity ;



Uniformity.prototype.run = function() {
	const startTime = Date.now() ;

	const bucketsCounter = new Array( this.buckets ).fill( 0 ) ;
	const expected = this.samples / this.buckets ;
	const sigma = Math.sqrt( expected ) ;	// standard deviation
	const expectedChiSquared = this.buckets - 1 ;
	const sigmaChiSquared = Math.sqrt( 2 * expectedChiSquared ) ;	// standard deviation for chi²

	for ( let i = 0 ; i < this.samples ; i ++ ) {
		const v = this.rng.randomInt( this.buckets ) ;
		bucketsCounter[ v ] ++ ;
	}

	let chiSquared = 0 ;

	for ( let i = 0 ; i < this.buckets ; i ++ ) {
		const errorSquared = ( ( bucketsCounter[ i ] - expected ) ** 2 ) / expected ;
		chiSquared += errorSquared ;
		//logger.log( "Error for #%i:\t%[.2]f\t%i / %i" , i , errorSquared , bucketsCounter[ i ] , expected ) ;
	}

	const zScore = BaseTest.zScore( chiSquared , expectedChiSquared , sigmaChiSquared ) ;
	const pValue = BaseTest.zScoreToPValue( zScore ) ;

	const duration = Date.now() - startTime ;

	logger.log( "\n== Uniformity test ==" ) ;
	logger.log( "Duration: %[.3!a]t" , duration ) ;
	logger.log( "Samples: %k" , this.samples ) ;
	logger.log( "Buckets: %i" , this.buckets ) ;
	logger.log( "χ²: %[.2]f" , chiSquared ) ;
	logger.log( "Expected χ²: %[.2]f" , expectedChiSquared ) ;
	logger.log( "Std-dev: %[.2]f" , sigmaChiSquared ) ;
	logger.log( "Z-score: %[+.2]fσ " , zScore ) ;
	logger.log( "P-value: %[5]f " , pValue ) ;
} ;

