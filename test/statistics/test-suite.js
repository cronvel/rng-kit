#!/usr/bin/env node
"use strict" ;

const rngKit = require( '../..' ) ;
const rng = require( './getRngFromCliArgs.js' ) ;
const PreAllocator = require( './PreAllocator.js' ) ;
const logger = require( './logger.js' ) ;



const TESTS = [
	'Uniformity' ,
	'BirthdaySpacings' ,
	'Tuples' ,
	[ 'Tuples' , { lag: 2 } ] ,
	[ 'Tuples' , { lag: 3 } ] ,
	[ 'Tuples' , { lag: 5 } ] ,
	[ 'Tuples' , { lag: 7 } ] ,
	[ 'Tuples' , { dimensions: 3 , bucketsPerDimension: 100 , samples: 20_000_000 } ] ,
	[ 'Tuples' , { dimensions: 3 , lag: 2 , bucketsPerDimension: 100 , samples: 20_000_000 } ] ,
	[ 'Tuples' , { dimensions: 3 , lag: 3 , bucketsPerDimension: 100 , samples: 20_000_000 } ] ,
	[ 'Tuples' , { dimensions: 3 , lag: 5 , bucketsPerDimension: 100 , samples: 20_000_000 } ] ,
	[ 'Tuples' , { dimensions: 3 , lag: 7 , bucketsPerDimension: 100 , samples: 20_000_000 } ] ,
] ;



function run() {
	const preAllocator = new PreAllocator( rng ) ;

	const tests = TESTS.map( testConfig => {
		let testName ;
		let testParams = {} ;

		if ( Array.isArray( testConfig ) ) { [ testName , testParams ] = testConfig ; }
		else { testName = testConfig ; }

		const Test = require( './' + testName + '.js' ) ;
		return new Test( preAllocator , testParams ) ;
	} ) ;

	const startTime = Date.now() ;
	let fullRngDuration = 0 ;
	let fullRunDuration = 0 ;

	for ( let test of tests ) {
		logger.log( "Prepare random numbers for: %s" , test.testName ) ;
		const rngStartTime = Date.now() ;
		test.prepare() ;
		const rngDuration = Date.now() - rngStartTime ;
		fullRngDuration += rngDuration ;

		logger.log( "Running test: %s" , test.testName ) ;
		const runStartTime = Date.now() ;
		test.run() ;
		const runDuration = Date.now() - runStartTime ;
		fullRunDuration += runDuration ;
		logger.log( "Test done: %s (in %[.3!a]t)" , test.testName , runDuration ) ;
	}

	const fullDuration = Date.now() - startTime ;
	logger.log( "\nEverything done in: %[.3!a]t" , fullDuration ) ;
	logger.log( "All random number generations done in: %[.3!a]t" , fullRngDuration ) ;
	logger.log( "All tests done in: %[.3!a]t" , fullRunDuration ) ;

	for ( let test of tests ) {
		test.displayReport() ;
	}
}

run() ;

