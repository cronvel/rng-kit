"use strict" ;

const BaseTest = require( './BaseTest.js' ) ;

const logger = require( './logger.js' ) ;
const stat = require( '../../lib/stat.js' ) ;



function Tuples( preAllocator , params = {} ) {
	BaseTest.call( this , preAllocator ) ;
	this.samples = params.samples ?? 5_000_000 ;
	this.dimensions = params.dimensions ?? 2 ;
	this.bucketsPerDimension = params.bucketsPerDimension ?? 256 ;
	this.buckets = this.bucketsPerDimension ** this.dimensions ;
	this.lag = params.lag ?? 1 ;

	this.requiredFloats = this.samples + ( this.dimensions - 1 ) * this.lag ;

	this.testName =
		this.lag === 1 ? 'Serial Tuples ' + this.dimensions + 'D' :
		'Lagged Tuples ' + this.dimensions + 'D (lag=' + this.lag + ')' ;
}

Tuples.prototype = Object.create( BaseTest.prototype ) ;
Tuples.prototype.constructor = Tuples ;

module.exports = Tuples ;

Tuples.prototype.testName = 'Tuples' ;
Tuples.prototype.description = 'Measure the deviation from the expected occurence of each tuples of integers (χ²), also known as the serial test for lag=1' ;



Tuples.prototype.run = function() {
	const startTime = Date.now() ;

	const bucketsCounter = new Uint32Array( this.buckets ).fill( 0 ) ;
	const expected = this.samples / this.buckets ;
	const sigma = Math.sqrt( expected ) ;	// standard deviation
	const expectedChiSquared = this.buckets - 1 ;
	const sigmaChiSquared = Math.sqrt( 2 * expectedChiSquared ) ;	// standard deviation for chi²

	const tuple = [] ;

	for ( let i = 0 ; i < this.samples ; i ++ ) {
		for ( let d = 0 ; d < this.dimensions ; d ++ ) {
			const float = this.preAllocator.floatArray[ i + d * this.lag ] ;
			const int = Math.floor( float * this.bucketsPerDimension ) ;
			tuple[ d ] = int ;
		}
			
		let index = this.tupleToIndex( tuple ) ;
		bucketsCounter[ index ] ++ ;
	}

	let chiSquared = 0 ;

	for ( let i = 0 ; i < this.buckets ; i ++ ) {
		const errorSquared = ( ( bucketsCounter[ i ] - expected ) ** 2 ) / expected ;
		chiSquared += errorSquared ;
		//logger.log( "Error for #%i (%N):\t%[.2]f\t%i / %[.2]f" , i , this.indexToTuple( i ) , errorSquared , bucketsCounter[ i ] , expected ) ;
	}

	const zScore = BaseTest.zScore( chiSquared , expectedChiSquared , sigmaChiSquared ) ;
	const pValue = BaseTest.zScoreToPValue( zScore ) ;

	const duration = Date.now() - startTime ;
	
	this.reportData = {
		duration ,
		extra: [ 'dimensions' , 'lag' , 'bucketsPerDimension' , 'buckets' ] ,
		measureOf: "χ²" ,
		actual: chiSquared ,
		expected: expectedChiSquared ,
		stdDev: sigmaChiSquared ,
		zScore ,
		pValue
	} ;
} ;



Tuples.prototype.tupleToIndex = function( tuple ) {
	let index = 0 ;

	for ( let i = 0 ; i < this.dimensions ; i ++ ) {
		index += tuple[ i ] * ( this.bucketsPerDimension ** i ) ;
	}

	//console.log( "index=" , index , tuple ) ;
	return index ;
} ;



Tuples.prototype.indexToTuple = function( index ) {
	const tuple = [] ;

	for ( let i = 0 ; i < this.dimensions ; i ++ ) {
		tuple[ i ] = index % this.bucketsPerDimension ;
		index = Math.floor( index / this.bucketsPerDimension ) ;
	}

	//console.log( "index=" , index , tuple ) ;
	return tuple ;
} ;

