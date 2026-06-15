#!/usr/bin/env node
"use strict" ;

const rngKit = require( '..' ) ;

function logStat( name , occurence , total ) {
	const percent = Math.floor( occurence / total * 10000 ) / 100 ;
	console.log( '' + name +': ' + percent + '%' ) ;
}

function run() {
	//const rng = new rngKit.MersenneTwister() ;
	const rng = new rngKit.PCG32() ;
	rng.autoSeed() ;
	console.log( "RNG:" , rng ) ;

	const max = 10000 ;

	let upperCount = 0 ,
		lowerCount = 0 ,
		topCount = 0 ,
		bottomCount = 0 ;

	for ( let i = 0 ; i < max ; i ++ ) {
		let v = rng.randomFloat() ;
		if ( v > 0.5 ) { upperCount ++ ; }
		if ( v < 0.5 ) { lowerCount ++ ; }
		if ( v >= 0.99 ) { topCount ++ ; }
		if ( v < 0.01 ) { bottomCount ++ ; }
		//console.log( '#' + i + ':' , v ) ;
	}

	logStat( "> 0.5" , upperCount , max ) ;
	logStat( "< 0.5" , lowerCount , max ) ;
	logStat( "≥ 0.99" , topCount , max ) ;
	logStat( "< 0.01" , bottomCount , max ) ;
	//console.log( "RNG:" , rng ) ;
}

run() ;

