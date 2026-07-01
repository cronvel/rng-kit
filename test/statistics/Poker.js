"use strict" ;

const BaseTest = require( './BaseTest.js' ) ;

const logger = require( './logger.js' ) ;
const stat = require( '../../lib/stat.js' ) ;



function Poker( preAllocator , params = {} ) {
	BaseTest.call( this , preAllocator ) ;
	this.samples = params.samples ?? 1_000_000 ;
	this.symbols = params.maxPoker ?? 10 ;	// Number of symbols
	//this.handSize = 5 ;	// handsize is fixed to 5
	this.requiredFloats = this.samples * 5 ;
}

Poker.prototype = Object.create( BaseTest.prototype ) ;
Poker.prototype.constructor = Poker ;

module.exports = Poker ;

Poker.prototype.testName = 'Poker' ;
Poker.prototype.description = 'Measure the probability of poker-like hand (group of 5 non-overlapping random numbers)' ;



Poker.prototype.run = function() {
	const startTime = Date.now() ;

	const handProbability = this.computeHandProbability() ;
	const handTypesCounter = {} ;
	const expectedHandTypes = {} ;

	for ( let handType of Object.keys( handProbability ) ) {
		handTypesCounter[ handType ] = 0 ;
		expectedHandTypes[ handType ] = handProbability[ handType ] * this.samples ;
	}

	const expectedChiSquared = Object.keys( handProbability ).length - 1 ;	// number of bins, like always
	const sigmaChiSquared = Math.sqrt( 2 * expectedChiSquared ) ;	// standard deviation for chi²

	for ( let i = 0 ; i < this.samples ; i ++ ) {
		const hand = this.preAllocator.floatArray.subarray( i * 5 , ( i + 1 ) * 5 ).map( float => Math.floor( float * this.symbols ) ) ;
		const handType = this.getHandType( hand ) ;
		handTypesCounter[ handType ] ++ ;
	}


	let chiSquared = 0 ;
	let probabilitySum = 0 ;

	for ( let handType of Object.keys( handProbability ) ) {
		const expected = expectedHandTypes[ handType ] ;
		const errorSquared = ( ( handTypesCounter[ handType ] - expected ) ** 2 ) / expected ;
		chiSquared += errorSquared ;
		logger.log( "Error for poker hand %s:\t%[.3]f\t%i / %[.3]f" , handType , errorSquared , handTypesCounter[ handType ] , expected ) ;
	}

	const zScore = BaseTest.zScore( chiSquared , expectedChiSquared , sigmaChiSquared ) ;
	const pValue = BaseTest.zScoreToPValue( zScore ) ;

	const duration = Date.now() - startTime ;

	this.reportData = {
		duration ,
		extra: [ 'symbols' , ] ,
		measureOf: "χ²" ,
		actual: chiSquared ,
		expected: expectedChiSquared ,
		stdDev: sigmaChiSquared ,
		zScore ,
		pValue
	} ;
} ;



Poker.prototype.computeHandProbability = function() {
	const m = this.symbols ;
	return {
		fiveDistinct: ( m * ( m - 1 ) * ( m - 2 ) * ( m - 3 ) * ( m - 4 ) ) / ( m ** 5 ) ,
		onePair: ( 10 * m * ( m - 1 ) * ( m - 2 ) * ( m - 3 ) ) / ( m ** 5 ) ,
		twoPairs: ( 15 * m * ( m - 1 ) * ( m - 2 ) ) / ( m ** 5 ) ,
		threeOfAKind: ( 10 * m * ( m - 1 ) * ( m - 2 ) ) / ( m ** 5 ) ,
		fullHouse: ( 10 * m * ( m - 1 ) ) / ( m ** 5 ) ,
		fourOfAKind: ( 5 * m * ( m - 1 ) ) / ( m ** 5 ) ,
		fiveOfAKind: 1 / ( m ** 4 )
	} ;
} ;



const PATTERN_NAMES = {
	'1,1,1,1,1': 'fiveDistinct' ,
	'2,1,1,1': 'onePair' ,
	'2,2,1': 'twoPairs' ,
	'3,1,1': 'threeOfAKind' ,
	'3,2': 'fullHouse' ,
	'4,1': 'fourOfAKind' ,
	'5': 'fiveOfAKind'
} ;



Poker.prototype.getHandType = function( hand ) {
	// Count occurrences of each value
	const counts = new Map() ;

	for ( let value of hand ) {
		counts.set( value , ( counts.get( value ) || 0 ) + 1 ) ;
	}

	// Descending sort
	const pattern = [ ... counts.values() ].sort( ( a , b ) => b - a ) ;
	const patternStr = pattern.join( ',' ) ;

	if ( ! Object.hasOwn( PATTERN_NAMES , patternStr ) ) {
		throw new Error( "Impossible hand pattern" ) ;
	}

	return PATTERN_NAMES[ patternStr ] ;
} ;

