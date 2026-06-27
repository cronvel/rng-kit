
"use strict" ;

const BaseTest = require( './BaseTest.js' ) ;

const logger = require( './logger.js' ) ;
const stat = require( '../../lib/stat.js' ) ;



function BirthdaySpacings( rng , params = {} ) {
	BaseTest.call( this , rng ) ;
	this.batches = params.batches ?? 100 ;
	this.samples = params.samples ?? 400 ;
	this.interval = params.interval ?? 1_000_000 ;
}

BirthdaySpacings.prototype = Object.create( BaseTest.prototype ) ;
BirthdaySpacings.prototype.constructor = BirthdaySpacings ;

module.exports = BirthdaySpacings ;

BirthdaySpacings.prototype.testName = 'Birthday Spacings test' ;
BirthdaySpacings.prototype.description = 'Measure the number of duplicated spacings (λ)' ;



BirthdaySpacings.prototype.run = function() {
	const startTime = Date.now() ;

	let duplicatedSpacings = 0 ;

	for ( let batch = 0 ; batch < this.batches ; batch ++ ) {
		const randomArray = [] ;

		for ( let i = 0 ; i < this.samples ; i ++ ) {
			randomArray.push( this.rng.randomInt( this.interval ) ) ;
		}

		randomArray.sort( ( a , b ) => a - b ) ;
		
		const spacingSet = new Set() ;
		
		for ( let i = 1 ; i < randomArray.length ; i ++ ) {
			let spacing = randomArray[ i ] - randomArray[ i - 1 ] ;
			if ( spacingSet.has( spacing ) ) { duplicatedSpacings ++ ; }
			else { spacingSet.add( spacing ) ; }
		}
	}

	// Poisson distribution
	const expectedDuplicatedSpacings = ( ( this.samples ** 3 ) / ( 4 * this.interval ) ) * this.batches ;
	const sigmaDuplicatedSpacings = Math.sqrt( expectedDuplicatedSpacings ) ;

	// λ should be ≥ 10 to have a meaningful value for Z-score
	const zScore = BaseTest.zScore( duplicatedSpacings , expectedDuplicatedSpacings , sigmaDuplicatedSpacings ) ;
	const pValue = BaseTest.zScoreToPValue( zScore ) ;

	const duration = Date.now() - startTime ;

	this.displayResults( {
		duration ,
		extra: [ 'interval' ] ,
		measureOf: "λ" ,
		actual: duplicatedSpacings ,
		expected: expectedDuplicatedSpacings ,
		stdDev: sigmaDuplicatedSpacings ,
		zScore ,
		pValue
	} ) ;
} ;

