#!/usr/bin/env node
"use strict" ;

const rngKit = require( '../..' ) ;
const rng = require( './getRngFromCliArgs.js' ) ;



const TESTS = [
	'Uniformity' ,
	'Tuples' ,
	[ 'Tuples' , { dimensions: 3 , bucketsPerDimension: 100 , samples: 20_000_000 } ] ,
	'BirthdaySpacings'
] ;



function run() {
	for ( let testConfig of TESTS ) {
		let testName ;
		let testParams = {} ;

		if ( Array.isArray( testConfig ) ) { [ testName , testParams ] = testConfig ; }
		else { testName = testConfig ; }

		const Test = require( './' + testName + '.js' ) ;
		const test = new Test( rng , testParams ) ;
		test.run() ;
	}
}

run() ;

