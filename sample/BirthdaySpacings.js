
"use strict" ;

const BaseTest = require( './BaseTest.js' ) ;

const logger = require( './logger.js' ) ;
const stat = require( '../lib/stat.js' ) ;



function BirthdaySpacings( rng ) {
	BaseTest.call( this , rng ) ;
	this.interval = 1_000_000 ;
	this.samples = 400 ;
	this.batches = 100 ;
}

BirthdaySpacings.prototype = Object.create( BirthdaySpacings.prototype ) ;
BirthdaySpacings.prototype.constructor = BirthdaySpacings ;

module.exports = BirthdaySpacings ;



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

	logger.log( "\n== BirthdaySpacings test ==" ) ;
	logger.log( "Duration: %[.3!a]t" , duration ) ;
	logger.log( "Batches: %k" , this.batches ) ;
	logger.log( "Samples: %k" , this.samples ) ;
	logger.log( "Interval: %i" , this.interval ) ;
	logger.log( "Duplicated spacings: %i" , duplicatedSpacings ) ;
	logger.log( "λ (expected duplicated spacings): %f" , expectedDuplicatedSpacings ) ;
	logger.log( "Std-dev: %[.2]f" , sigmaDuplicatedSpacings ) ;
	logger.log( "Z-score: %[+.2]fσ " , zScore ) ;
	logger.log( "P-value: %[5]f " , pValue ) ;
} ;

