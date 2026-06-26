"use strict" ;

const rngKit = require( '..' ) ;

const CLASS_FOR_TYPE_NAME = {
	native: rngKit.Native ,
	lcg: rngKit.Lcg ,
	pcg: rngKit.Pcg32 ,
	pcg32: rngKit.Pcg32 ,
	xoshiro256ss: rngKit.Xoshiro256ss ,
	xoshiro256: rngKit.Xoshiro256ss ,
	xoshiro: rngKit.Xoshiro256ss ,
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
	crypto: rngKit.CryptoRng ,
	phiexp: rngKit.PhiExp ,
	phi: rngKit.PhiExp
} ;

const type = process.argv[ 2 ] ;
const subtype = process.argv[ 3 ] || undefined ;
const seed = process.argv[ 4 ] || null ;
const RngClass = type ? CLASS_FOR_TYPE_NAME[ type ] : rngKit.Native ;

if ( ! RngClass ) {
	throw new Error( "Bad type: " + type ) ;
}

const rng = new RngClass( subtype ) ;
console.log( "RNG type:" , RngClass.name , " --  RNG params:" , subtype , " --  Seed:" , seed ) ;

if ( seed === null ) { rng.autoSeed() ; }
else { rng.setSeed( seed , undefined , channelSeed ) ; }

//console.log( "RNG:" , rng ) ;

module.exports = rng ;

