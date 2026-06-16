/*
	RNG Kit

	Copyright (c) 2026 Cédric Ronvel

	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;



const stat = require( './stat.js' ) ;
const sha256 = require( './sha256.js' ) ;

const MAX_UINT32 = 4294967296.0 ;



/*
	Super-class, containing common random methods
*/

function BaseRng() {
	this.seed = null ;
	this.channelSeed = null ;
	this.count = 0 ;	// Number of time a random number was generated
}

module.exports = BaseRng ;



// Should be derived
BaseRng.prototype.initState = function() {} ;
BaseRng.prototype.generate = function() {} ;
BaseRng.prototype.nextState = function() { this.count ++ ; } ;



// Function to subclass
BaseRng.prototype.setSeed = function( seed , sequenceSeed = null , channelSeed = null ) {
	this.seed = seed ;
	if ( Object.hasOwn( this , 'sequenceSeed' ) ) { this.sequenceSeed = sequenceSeed ; }
	this.channelSeed = channelSeed ;
	this.initState() ;
} ;



// Maybe subclassed
BaseRng.prototype.autoSeed = function() {
	const seed = new Date().getTime() ;
	//const channelSeed = this.scrambleSeed( seed ) ;
	//this.setSeed( seed , undefined , channelSeed ) ;
	this.setSeed( seed ) ;
} ;



// Used to avoid having consecutive seeds when initializing from current timestamps, or things that are too predictable
BaseRng.prototype.scrambleSeed = function( seed ) {
	//console.log( "Initial seed:" , seed ) ;
	if ( Array.isArray( seed ) ) {
		seed = this.fuseArrayOfStrings( seed ) ;
		//console.log( "Fused seed:" , seed ) ;
	}

	if ( typeof seed === 'string' ) {
		// Turn it into a number
		seed = sha256( seed , 'UInt32' ) ;
	}
	else {
		// It's the finalizer from MurmurHash3
		seed ^= seed >>> 16 ;
		seed = Math.imul( seed , 0x85ebca6b ) ;
		seed ^= seed >>> 13 ;
		seed = Math.imul( seed , 0xc2b2ae35 ) ;
		seed ^= seed >>> 16 ;
		seed = seed >>> 0 ;
	}
	//console.log( "Scrambled seed:" , seed ) ;

	return seed ;
} ;



const JOINT = '|' ;
const REPLACE_JOINT_REGEX = /\|/g ;
const JOINT_REPLACER = '-' ;

BaseRng.prototype.fuseArrayOfStrings = function( array ) {
	return array
		.map( str => {
			if ( ! str ) { return null ; }

			if ( Array.isArray( str ) ) {
				return this.fuseArrayOfStrings( str ) ;
			}

			str = '' + str ;
			str = str.replace( REPLACE_JOINT_REGEX , JOINT_REPLACER ) ;
			return str ;
		} )
		.filter( str => str !== null )
		.join( JOINT ) ;
} ;



const RNG_CHILDREN = new WeakMap() ;
const RNG_PARENT = new WeakMap() ;

// Return a sub-RNG for a channel
BaseRng.prototype.channel = function( channelSeed ) {
	// Avoid creating children of children, only one level is possible
	const parent = RNG_PARENT.get( this ) ;
	if ( parent ) { return parent.channel( channelSeed ) ; }

	const channelName = Array.isArray( channelSeed ) ? this.fuseArrayOfStrings( channelSeed ) : '' + channelSeed ;

	let children = RNG_CHILDREN.get( this ) ;

	if ( ! children ) {
		children = new Map() ;
		RNG_CHILDREN.set( this , children ) ;
	}

	let child = children.get( channelName ) ;

	if ( ! child ) {
		const proto = Object.getPrototypeOf( this ) ;
		child = new proto.constructor() ;
		children.set( channelName , child ) ;
		RNG_PARENT.set( child , this ) ;

		child.setSeed(
			this.seed ,
			Object.hasOwn( this , 'sequenceSeed' ) ? this.sequenceSeed : undefined ,
			channelSeed
		) ;
	}

	return child ;
} ;



BaseRng.prototype.skip = function( count ) {
	// Only valid for PRNG having states, it doesn't make any sense for true random sources, since they are not replicable
	if ( ! this.nextState ) { return ; }
	for ( let i = 0 ; i < count ; i ++ ) { this.nextState() ; }
} ;



BaseRng.createFromFloatGenerator = function( Generator ) {
	Generator.prototype.randomFloat = Generator.prototype.generate ;
	Generator.prototype.randomUInt32 = BaseRng.prototype.randomUInt32FromFloat ;
} ;



BaseRng.createFromUInt32Generator = function( Generator ) {
	Generator.prototype.randomFloat = BaseRng.prototype.randomFloatFromUInt32 ;
	Generator.prototype.randomUInt32 = Generator.prototype.generate ;
} ;



BaseRng.prototype.randomFloatFromUInt32 = function() {
	return this.randomUInt32() / MAX_UINT32 ;
} ;



BaseRng.prototype.randomUInt32FromFloat = function() {
	return Math.floor( this.randomFloat() * MAX_UINT32 ) ;
} ;



// .randomInt( IntegerA ) : generate a [ 0 , IntegerA ) integer
BaseRng.prototype.randomInt = function( int ) {
	return Math.floor( this.randomFloat() * int ) ;
} ;



// .randomIntRange( IntegerA , IntegerB ) : generate a [ IntegerA , IntegerB ] integer
BaseRng.prototype.randomIntRange = function( intA , intB ) {
	return Math.floor( intA + this.randomFloat() * ( 1 + intB - intA ) ) ;
} ;



// .randomFloatRange( FloatA , FloatB ) : generate a [ FloatA , FloatB ) float
BaseRng.prototype.randomFloatRange = function( floatA , floatB ) {
	return floatA + this.randomFloat() * ( floatB - floatA ) ;
} ;



/*
	Round a number randomly up or down and returns it, the closer integer has more chance.
	Example:
		* 3.5 has 50% of chance to be rounded to 3 or to 4
		* 3.2 has 80% of chance to be rounded to 3 and 20% to be rounded to 4

	* f `number` the number to round
*/
BaseRng.prototype.randomRound = function( f ) {
	return Math.floor( f + this.randomFloat() ) ;
} ;



/*
	Like randomRound(), except that it accepts an array (or object) of number, the error by each round is reported
	to the next value.
	It returns an array (or object) of rounded values.
*/
BaseRng.prototype.sharedRandomRound = function( container ) {
	var key , r , error = 0 , result = Array.isArray( container ) ? [] : {} ;

	for ( key in container ) {
		r = error < 0 ? this.randomFloatRange( - error , 1 ) : this.randomFloatRange( 0 , 1 - error ) ;
		result[ key ] = Math.floor( container[ key ] + r ) ;
		error += result[ key ] - container[ key ] ;
	}

	return result ;
} ;



/*
	Return a random element from an array.
*/
BaseRng.prototype.randomElement = function( array ) {
	return array[ this.randomInt( array.length ) ] ;
} ;



/*
	Random dice ( number of dice , number of faces )
*/
BaseRng.prototype.dice = function( diceCount , faceCount ) {
	var sum = 0 ;
	for ( ; diceCount > 0 ; diceCount -- ) { sum += this.randomIntRange( 1 , faceCount ) ; }
	return sum ;
} ;



/*
	Given the probability of success for each independent experiment and a number of trial,
	it returns the random number of success.
*/
BaseRng.prototype.randomTrialSuccesses = function( p , n ) {
	if ( n <= 30 ) { return this.randomTrialSuccessesBruteForce( p , n ) ; }
	return this.randomTrialSuccessesNormal( p , n ) ;
} ;



// This provide the best results possible, it uses 'n' trials with the 'p' probability, so it costs CPU
BaseRng.prototype.randomTrialSuccessesBruteForce = function( p , n ) {
	var i , s = 0 ;

	for ( i = 0 ; i < n ; i ++ ) {
		if ( this.randomFloat() < p ) { s ++ ; }
	}

	return s ;
} ;



/*
	This use the Normal inverse cumulative distribution function.
	Warning: to be perfect, it should use the Binomial distribution, the Normal distribution
	approximate it when 'n' is big enough.
	For lower 'n' values (e.g. n <= 30), one may use .randomTrialSuccessesBruteForce().
	For higher values, its way faster than the brute force algorithm.
*/
BaseRng.prototype.randomTrialSuccessesNormal = function( p , n ) {
	var expectedValue , // fr: esperance
		s , variance , sigma ;

	expectedValue = p * n ;
	variance = p * ( 1 - p ) * n ;
	sigma = Math.sqrt( variance ) ;

	s = stat.normalInvCdf( this.randomFloat() , expectedValue , sigma ) ;

	s = Math.round( s ) ;

	// Sometime out of bound values are produced, when 'n' is low
	if ( s < 0 ) { s = 0 ; }
	else if ( s > n ) { s = n ; }

	return s ;
} ;

