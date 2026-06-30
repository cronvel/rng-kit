#!/usr/bin/env node
"use strict" ;

const rngKit = require( '../..' ) ;
const rng = require( './getRngFromCliArgs.js' ) ;
const PreAllocator = require( './PreAllocator.js' ) ;
const logger = require( './logger.js' ) ;



const TESTS = [
	//*
	'Uniformity' ,
	'BirthdaySpacings' ,
	'Runs' ,
	//*/
	'Autocorrelation' ,
	[ 'Autocorrelation' , { lag: 2 } ] ,
	[ 'Autocorrelation' , { lag: 3 } ] ,
	[ 'Autocorrelation' , { lag: 4 } ] ,
	[ 'Autocorrelation' , { lag: 5 } ] ,
	[ 'Autocorrelation' , { lag: 7 } ] ,
	[ 'Autocorrelation' , { lag: 8 } ] ,
	[ 'Autocorrelation' , { lag: 11 } ] ,
	[ 'Autocorrelation' , { lag: 13 } ] ,
	[ 'Autocorrelation' , { lag: 16 } ] ,
	[ 'Autocorrelation' , { lag: 23 } ] ,
	[ 'Autocorrelation' , { lag: 32 } ] ,
	[ 'Autocorrelation' , { lag: 47 } ] ,
	[ 'Autocorrelation' , { lag: 64 } ] ,
	//*
	'Tuples' ,
	[ 'Tuples' , { lag: 2 } ] ,
	[ 'Tuples' , { lag: 3 } ] ,
	[ 'Tuples' , { lag: 4 } ] ,
	[ 'Tuples' , { lag: 5 } ] ,
	[ 'Tuples' , { lag: 7 } ] ,
	[ 'Tuples' , { lag: 8 } ] ,
	[ 'Tuples' , { lag: 11 } ] ,
	[ 'Tuples' , { lag: 13 } ] ,
	[ 'Tuples' , { lag: 16 } ] ,
	[ 'Tuples' , { lag: 23 } ] ,
	[ 'Tuples' , { lag: 32 } ] ,
	[ 'Tuples' , { lag: 47 } ] ,
	[ 'Tuples' , { lag: 64 } ] ,
	[ 'Tuples' , { dimensions: 3 , bucketsPerDimension: 100 , samples: 20_000_000 } ] ,
	[ 'Tuples' , { dimensions: 3 , lag: 2 , bucketsPerDimension: 100 , samples: 20_000_000 } ] ,
	[ 'Tuples' , { dimensions: 3 , lag: 3 , bucketsPerDimension: 100 , samples: 20_000_000 } ] ,
	[ 'Tuples' , { dimensions: 3 , lag: 5 , bucketsPerDimension: 100 , samples: 20_000_000 } ] ,
	[ 'Tuples' , { dimensions: 3 , lag: 7 , bucketsPerDimension: 100 , samples: 20_000_000 } ] ,
	//*/
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

	logger.log( "\n\n\n^+^WFull Report:\n" ) 
	for ( let test of tests ) { test.displayReport() ; }

	logger.log( "\n\n\n^+^WSummary:" ) 
	for ( let test of tests ) { test.displaySummary() ; }
}

run() ;

