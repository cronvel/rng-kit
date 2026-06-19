#!/usr/bin/env node
"use strict" ;

const rngKit = require( '..' ) ;

const CLASS_FOR_TYPE_NAME = {
	native: rngKit.Native ,
	pcg: rngKit.Pcg32 ,
	pcg32: rngKit.Pcg32 ,
	sha256prng: rngKit.Sha256Prng ,
	"sha256-prng": rngKit.Sha256Prng ,
	"sha-256-prng": rngKit.Sha256Prng ,
	sha256: rngKit.Sha256Prng ,
	"sha-256": rngKit.Sha256Prng ,
	sha: rngKit.Sha256Prng ,
	mersenne: rngKit.MersenneTwister ,
	mersennetwister: rngKit.MersenneTwister ,
	"mersenne-twister": rngKit.MersenneTwister ,
	cryptorng: rngKit.CryptoRng ,
	"crypto-rng": rngKit.CryptoRng ,
	crypto: rngKit.CryptoRng
} ;

const type = process.argv[ 2 ] ;
const seed = process.argv[ 3 ] ? process.argv[ 3 ] : null ;
const channelSeed = process.argv[ 4 ] ? process.argv[ 4 ] : null ;
const RngClass = type ? CLASS_FOR_TYPE_NAME[ type ] : rngKit.Native ;

if ( ! RngClass ) {
	throw new Error( "Bad type: " + type ) ;
}

function logStat( name , occurence , total ) {
	const percent = Math.floor( occurence / total * 10000 ) / 100 ;
	console.log( '' + name +': ' + percent + '%' ) ;
}

const rng = new RngClass() ;
console.log( "RNG init:" , RngClass.name , "Seed:" , seed , "Channel seed:" , channelSeed ) ;

if ( seed === null ) { rng.autoSeed() ; }
else { rng.setSeed( seed , undefined , channelSeed ) ; }



function run1() {
	console.log( "RNG object:" , rng ) ;

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

	const array = [ 'Alice' , 'Bob' , 'Charlie' , 'Denise' , 'Eve' , 'Fabiano' , 'Georges' , 'Hugo' , 'Irma' , 'Julian' ] ;
	const max = 1 ;

	for ( let i = 0 ; i < max ; i ++ ) {
		let sample = rng.sample( array , 3 ) ;
		console.log( 'sample #' + i + ':' , sample ) ;
	}

	console.log( "RNG object:" , rng ) ;
}

run6() ;

