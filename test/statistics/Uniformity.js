"use strict" ;

const BaseTest = require( './BaseTest.js' ) ;

const logger = require( './logger.js' ) ;
const stat = require( '../../lib/stat.js' ) ;



function Uniformity( preAllocator , params = {} ) {
	BaseTest.call( this , preAllocator ) ;
	this.samples = params.samples ?? 1_000_000 ;
	this.buckets = params.buckets ?? 256 ;

	this.requiredFloats = this.samples ;
}

Uniformity.prototype = Object.create( BaseTest.prototype ) ;
Uniformity.prototype.constructor = Uniformity ;

module.exports = Uniformity ;

Uniformity.prototype.testName = 'Uniformity' ;
Uniformity.prototype.description = 'Measure the deviation from the expected occurence of each integers (χ²)' ;



Uniformity.prototype.run = function() {
	const startTime = Date.now() ;

	const generator = this.preAllocator.floatGenerator() ;
	const bucketsCounter = new Array( this.buckets ).fill( 0 ) ;
	const expected = this.samples / this.buckets ;
	const sigma = Math.sqrt( expected ) ;	// standard deviation
	const expectedChiSquared = this.buckets - 1 ;
	const sigmaChiSquared = Math.sqrt( 2 * expectedChiSquared ) ;	// standard deviation for chi²

	for ( let i = 0 ; i < this.samples ; i ++ ) {
		const float = generator.next().value ;
		const int = Math.floor( float * this.buckets ) ;
		bucketsCounter[ int ] ++ ;
	}

	let chiSquared = 0 ;

	for ( let i = 0 ; i < this.buckets ; i ++ ) {
		const errorSquared = ( ( bucketsCounter[ i ] - expected ) ** 2 ) / expected ;
		chiSquared += errorSquared ;
		//logger.log( "Error for #%i:\t%[.2]f\t%i / %[.2]f" , i , errorSquared , bucketsCounter[ i ] , expected ) ;
	}

	const zScore = BaseTest.zScore( chiSquared , expectedChiSquared , sigmaChiSquared ) ;
	const pValue = BaseTest.zScoreToPValue( zScore ) ;

	const duration = Date.now() - startTime ;
	
	this.reportData = {
		duration ,
		extra: [ 'buckets' ] ,
		measureOf: "χ²" ,
		actual: chiSquared ,
		expected: expectedChiSquared ,
		stdDev: sigmaChiSquared ,
		zScore ,
		pValue
	} ;
} ;

