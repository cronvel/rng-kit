#!/usr/bin/env node
"use strict" ;

const rngKit = require( '..' ) ;

const CLASS_FOR_TYPE_NAME = {
	native: rngKit.Native ,
	pcg: rngKit.PCG32 ,
	pcg32: rngKit.PCG32 ,
	sha256prng: rngKit.SHA256Prng ,
	"sha256-prng": rngKit.SHA256Prng ,
	"sha-256-prng": rngKit.SHA256Prng ,
	sha256: rngKit.SHA256Prng ,
	"sha-256": rngKit.SHA256Prng ,
	sha: rngKit.SHA256Prng ,
	mersenne: rngKit.MersenneTwister ,
	mersennetwister: rngKit.MersenneTwister ,
	"mersenne-twister": rngKit.MersenneTwister ,
	entropy: rngKit.Entropy ,
	pseudoentropy: rngKit.PseudoEntropy ,
	"pseudo-entropy": rngKit.PseudoEntropy ,
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

function run() {
	const rng = new RngClass() ;
	console.log( "RNG init:" , RngClass.name , "Seed:" , seed , "Channel seed:" , channelSeed ) ;
	console.log( "RNG object:" , rng ) ;

	if ( seed === null ) { rng.autoSeed() ; }
	else { rng.setSeed( seed , channelSeed ) ; }

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

run() ;

