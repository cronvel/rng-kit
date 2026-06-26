
"use strict" ;

const BaseTest = require( './BaseTest.js' ) ;

const logger = require( './logger.js' ) ;
const stat = require( '../../lib/stat.js' ) ;



function Tuples( rng , params = {} ) {
	BaseTest.call( this , rng ) ;
	this.samples = params.samples ?? 10_000_000 ;
	this.dimensions = params.dimensions ?? 2 ;
	this.bucketsPerDimension = params.bucketsPerDimension ?? 256 ;
	this.buckets = this.bucketsPerDimension ** this.dimensions ;

	this.testName = 'Tuples ' + this.dimensions + 'D test' ;
}

Tuples.prototype = Object.create( BaseTest.prototype ) ;
Tuples.prototype.constructor = Tuples ;

module.exports = Tuples ;

Tuples.prototype.testName = 'Tuples test' ;
Tuples.prototype.description = 'Measure the deviation from the expected occurence of each tuples of integers (χ²), i.e. consecutives integers' ;



Tuples.prototype.run = function() {
	const startTime = Date.now() ;

	const bucketsCounter = new Uint32Array( this.buckets ).fill( 0 ) ;
	const expected = this.samples / this.buckets ;
	const sigma = Math.sqrt( expected ) ;	// standard deviation
	const expectedChiSquared = this.buckets - 1 ;
	const sigmaChiSquared = Math.sqrt( 2 * expectedChiSquared ) ;	// standard deviation for chi²

	const iteration = this.samples + this.dimensions - 1 ;
	const tuple = [] ;

	for ( let i = 0 ; i < this.dimensions - 1 ; i ++ ) {
		tuple.push( this.rng.randomInt( this.bucketsPerDimension ) ) ;
	}

	for ( let i = 0 ; i < this.samples ; i ++ ) {
		tuple.push( this.rng.randomInt( this.bucketsPerDimension ) ) ;
		let index = this.tupleToIndex( tuple ) ;
		bucketsCounter[ index ] ++ ;

		tuple.shift() ;
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
	
	this.displayResults( {
		duration ,
		extra: [ 'dimensions' , 'bucketsPerDimension' , 'buckets' ] ,
		measureOf: "χ²" ,
		actual: chiSquared ,
		expected: expectedChiSquared ,
		stdDev: sigmaChiSquared ,
		zScore ,
		pValue
	} ) ;
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

