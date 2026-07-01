#!/usr/bin/env node
"use strict" ;

const rngKit = require( '../..' ) ;
const rng = require( './getRngFromCliArgs.js' ) ;
const PreAllocator = require( './PreAllocator.js' ) ;
const logger = require( './logger.js' ) ;

// Common lags, using a mix of primes and power of 2
const LAGS = [ 1 , 2 , 3 , 4 , 5 , 7 , 8 , 11 , 13 , 16 , 23 , 32 , 47 , 64 ] ;
//const LESS_LAGS = [ 1 , 2 , 3 , 5 , 7 ] ;
const GAP_INTERVALS = [ [ 0 , 0.5 ] , [ 0.25 , 0.5 ] , [ 0 , 0.1 ] , [ 0.1 , 0.2 ] , [ 0 , 0.01 ] , [ 0.9 , 1 ] , [ 0.99 , 1 ] ] ;

const TESTS = [
	//*
	'Uniformity' ,
	'BirthdaySpacings' ,
	'Runs' ,
	... GAP_INTERVALS.map( ( [ intervalMin , intervalMax ] ) => [ 'Gap' , { intervalMin , intervalMax } ] ) ,
	... LAGS.map( lag => [ 'Autocorrelation' , { lag } ] ) ,
	... LAGS.map( lag => [ 'Tuples' , { lag } ] ) ,
	... LAGS.map( lag => [ 'Tuples' , { lag , dimensions: 3 , bucketsPerDimension: 100 , samples: 20_000_000 } ] ) ,
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

