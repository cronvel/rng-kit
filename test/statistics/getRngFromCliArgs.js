"use strict" ;

const rngKit = require( '../..' ) ;

const CLASS_FOR_TYPE_NAME = {
	native: rngKit.Native ,
	lcg: rngKit.Lcg ,
	pcg32: rngKit.Pcg32 ,
	pcg: rngKit.Pcg32 ,
	xoshiro256ss: rngKit.Xoshiro256ss ,
	xoshiro256: rngKit.Xoshiro256ss ,
	xoshiro: rngKit.Xoshiro256ss ,
	sha256counter: rngKit.Sha256Counter ,
	"sha256-counter": rngKit.Sha256Counter ,
	"sha-256-counter": rngKit.Sha256Counter ,
	sha256: rngKit.Sha256Counter ,
	"sha-256": rngKit.Sha256Counter ,
	sha: rngKit.Sha256Counter ,
	mersennetwister: rngKit.MersenneTwister ,
	"mersenne-twister": rngKit.MersenneTwister ,
	mersenne: rngKit.MersenneTwister ,
	mt: rngKit.MersenneTwister ,
	cryptorng: rngKit.CryptoRng ,
	"crypto-rng": rngKit.CryptoRng ,
	crypto: rngKit.CryptoRng ,
	phiexp: rngKit.PhiExp ,
	phi: rngKit.PhiExp ,
	sha256drf: rngKit.Sha256Drf ,
	drf: rngKit.Sha256Drf
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

