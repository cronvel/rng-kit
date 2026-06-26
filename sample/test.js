#!/usr/bin/env node
"use strict" ;

const rngKit = require( '..' ) ;
const rng = require( './getRngFromCliArgs.js' ) ;

function logStat( name , occurence , total ) {
	const percent = Math.floor( occurence / total * 10000 ) / 100 ;
	console.log( '' + name +': ' + percent + '%' ) ;
}

function run1() {
	console.log( "RNG object:" , rng ) ;

	const max = 10000 ;

	let upperCount = 0 ,
		lowerCount = 0 ,
		topCount = 0 ,
		bottomCount = 0 ,
		tooBigCount = 0 ,
		negativeCount = 0 ;

	for ( let i = 0 ; i < max ; i ++ ) {
		let v = rng.randomFloat() ;
		if ( v > 0.5 ) { upperCount ++ ; }
		if ( v < 0.5 ) { lowerCount ++ ; }
		if ( v >= 0.99 ) { topCount ++ ; }
		if ( v < 0.01 ) { bottomCount ++ ; }
		if ( v >= 1 ) { tooBigCount ++ ; }
		if ( v < 0 ) { negativeCount ++ ; }
		//console.log( '#' + i + ':' , v ) ;
	}

	logStat( "> 0.5" , upperCount , max ) ;
	logStat( "< 0.5" , lowerCount , max ) ;
	logStat( "≥ 0.99" , topCount , max ) ;
	logStat( "< 0.01" , bottomCount , max ) ;
	console.log( "≥ 1 (error):" , tooBigCount ) ;
	console.log( "< 0 (error):" , negativeCount ) ;
	console.log( "RNG object:" , rng ) ;
}

function run2() {
	console.log( "RNG object:" , rng ) ;

	const max = 10 ;

	for ( let i = 0 ; i < max ; i ++ ) {
		let v = rng.randomFloat() ;
		console.log( 'float #' + i + ':' , v ) ;
	}

	for ( let i = 0 ; i < max ; i ++ ) {
		let v = rng.randomInt( 100 ) ;
		console.log( 'int #' + i + ':' , v ) ;
	}

	for ( let i = 0 ; i < max ; i ++ ) {
		//let v = rng.randomString( 4 , 4 ) ;
		//let v = rng.randomString( 4 , 4 , '-' , rngKit.CHARSET.BASE36 ) ;
		let v = rng.randomString( 4 , 4 , '-' , rngKit.CHARSET.UPPERCASE_ALPHANUMERIC ) ;
		console.log( 'string #' + i + ':' , v ) ;
	}

	for ( let i = 0 ; i < max ; i ++ ) {
		let baseValue = 100 ;
		let multiplicator = 1.2 ;
		let v = rng.randomLogNormal( baseValue , multiplicator ) ;
		console.log( 'log normal (baseValue=' + baseValue + ', multiplicator=' + multiplicator + ') #' + i + ':' , v ) ;
	}

	for ( let i = 0 ; i < max ; i ++ ) {
		let baseValue = 10 ;
		//let v = rng.randomTriangular( 80 , baseValue , 200 ) ;
		//let v = rng.randomExponential( baseValue ) ;
		let v = rng.randomPoisson( baseValue ) ;
		console.log( 'special distribution (baseValue=' + baseValue + ') #' + i + ':' , v ) ;
	}

	console.log( "RNG object:" , rng ) ;
}

function run3() {
	console.log( "RNG object:" , rng ) ;

	const max = 5 ;

	for ( let i = 0 ; i < max ; i ++ ) {
		let v = rng.randomInt( 100 ) ;
		console.log( 'master int #' + i + ':' , v ) ;
	}

	let newChannel = 'loot' ;

	for ( let i = 0 ; i < max ; i ++ ) {
		let v = rng.channel( newChannel ).randomInt( 100 ) ;
		console.log( '1st channel int #' + i + ':' , v ) ;
	}

	console.log( "1st Child RNG object:" , rng.channel( newChannel ) ) ;

	newChannel = [ 'loot' , 'user_1234' ] ;

	for ( let i = 0 ; i < max ; i ++ ) {
		let v = rng.channel( newChannel ).randomInt( 100 ) ;
		console.log( '2nd channel int #' + i + ':' , v ) ;
	}

	console.log( "2nd Child RNG object:" , rng.channel( newChannel ) ) ;

	for ( let i = 0 ; i < max ; i ++ ) {
		let v = rng.channel( newChannel ).channel( newChannel ).randomInt( 100 ) ;
		console.log( '2nd channel² int #' + i + ':' , v ) ;
	}

	console.log( "2nd Child² RNG object:" , rng.channel( newChannel ).channel( newChannel ) ) ;

	if ( rng.channel( newChannel ) !== rng.channel( newChannel ) ) {
		console.error( "Bad channel sibling" ) ;
	}

	if ( rng.channel( newChannel ) !== rng.channel( newChannel ).channel( newChannel ) ) {
		console.error( "Bad channel parenting" ) ;
	}
}

function run4() {
	console.log( "RNG object:" , rng ) ;

	const max = 10 ;
	const chance = 0.7 ;
	rng.setFeedback( 1 ) ;

	console.log() ;

	let success = 0 ;
	for ( let i = 0 ; i < max ; i ++ ) {
		let v = rng.randomTrial( chance ) ;
		if ( v ) { success ++ ; }
		console.log( 'unbiased #' + i + ':' , v ) ;
	}
	logStat( "unbiased success" , success , max ) ;
	console.log() ;

	rng.reset() ;
	console.log( "RNG is reset" ) ;
	success = 0 ;
	for ( let i = 0 ; i < max ; i ++ ) {
		let v = rng.pseudoRandomTrial( chance ) ;
		if ( v ) { success ++ ; }
		console.log( 'biased #' + i + ':' , v ) ;
	}
	logStat( "biased success" , success , max ) ;
	console.log() ;

	console.log( "RNG object:" , rng ) ;
}

async function run5() {
	const readline = require('node:readline/promises');
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

	console.log( "RNG object:" , rng ) ;

	const chance = 0.7 ;
	rng.setFeedback( 1 ) ;

	console.log() ;

	let success = 0 ;
	let i ;
	for ( i = 0 ;; i ++ ) {
		console.log( '#' + i + ') Bias:' , rng.bias ) ;
		let answer = await rl.question( "Chance in % ? " ) ;
		if ( ! answer ) { break ; }
		let chance = ( + answer || 0 ) / 100 ;
		let v = rng.pseudoRandomTrial( chance ) ;
		if ( v ) { success ++ ; }
		console.log( v ? "Success!" : "Failure..." ) ;
	}
	logStat( "biased success" , success , i ) ;
	console.log() ;

	console.log( "RNG object:" , rng ) ;
	process.exit() ;
}

function run6() {
	console.log( "RNG object:" , rng ) ;

	const arrayOfObjects = [
		{ name: 'Alice' , w: 1.2 } ,
		{ name: 'Bob' , w: 4.5 } ,
		{ name: 'Charlie' , w: 1.4 } ,
		{ name: 'Denise' , w: 0.2 } ,
		{ name: 'Eve' , w: 0.7 } ,
		{ name: 'Fabiano' , w: 0.1 } ,
		{ name: 'Georges' , w: 0.15 } ,
		{ name: 'Hugo' , w: 0.05 } ,
		{ name: 'Irma' , w: 0.02 } ,
		{ name: 'Julian' , w: 0.08 }
	] ;
	const array = arrayOfObjects.map( o => o.name ) ;
	const weights = arrayOfObjects.map( o => o.w ) ;
	const max = 1 ;
	
	/*
	//let sample = rng.sampleAndRemove( arrayOfObjects , 3 ) ;
	let sample = rng.weightedSampleAndRemove( arrayOfObjects , 'w' , 3 ) ;
	console.log( "sample:" , sample , "arrayOfObjects:" , arrayOfObjects ) ;
	return ;
	*/

	for ( let i = 0 ; i < max ; i ++ ) {
		//let sample = rng.sample( array , 3 ) ;
		//let sample = rng.weightedSample( array , weights , 3 ) ;
		let sample = rng.weightedSample( arrayOfObjects , 'w' , 3 ) ;
		console.log( 'sample #' + i + ':' , sample ) ;
	}

	console.log( "RNG object:" , rng ) ;
}

// getState() / setState()
function run7() {
	console.log( "RNG object:" , rng ) ;

	const max = 5 ;
	let newChannel = [ 'loot' , 'user_1234' ] ;

	console.log() ;

	for ( let i = 0 ; i < max ; i ++ ) {
		let v = rng.randomInt( 100 ) ;
		console.log( 'int #' + i + ':' , v ) ;
		let channelV = rng.channel( newChannel ).randomInt( 100 ) ;
		console.log( 'channel int #' + i + ':' , channelV ) ;
	}

	console.log() ;
	let state = rng.getState() ;
	//console.log( "state:" , state , state.children[ 0 ] ) ;

	for ( let i = 0 ; i < max ; i ++ ) {
		let v = rng.randomInt( 100 ) ;
		console.log( 'int #' + i + ':' , v ) ;
		let channelV = rng.channel( newChannel ).randomInt( 100 ) ;
		console.log( 'channel int #' + i + ':' , channelV ) ;
	}

	console.log() ;
	rng.setState( state ) ;

	for ( let i = 0 ; i < max ; i ++ ) {
		let v = rng.randomInt( 100 ) ;
		console.log( 'int #' + i + ':' , v ) ;
		let channelV = rng.channel( newChannel ).randomInt( 100 ) ;
		console.log( 'channel int #' + i + ':' , channelV ) ;
	}

	console.log() ;
	console.log( "RNG object:" , rng ) ;
}

function run8() {
	console.log( "RNG object:" , rng ) ;

	const max = 10 ;

	//*
	for ( let i = 0 ; i < max ; i ++ ) {
		let v = rng.randomUInt32() ;
		console.log( 'uint32 #' + i + ':' , v ) ;
	}
	//*/

	//*
	for ( let i = 0 ; i < max ; i ++ ) {
		let v = rng.randomBytes( 4 ) ;
		console.log( 'bytes #' + i + ':' , v ) ;
	}
	//*/

	console.log( "RNG object:" , rng ) ;
}

run3() ;

