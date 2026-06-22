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
const sampleUtils = require( './sampleUtils.js' ) ;

const MAX_UINT32 = 4294967296.0 ;



/*
	Super-class, containing common random methods
*/

function BaseRng() {
	this.seed = null ;
	this.count = 0 ;	// Number of time a random number was generated

	// For pseudo-random generation with negative feedback
	this.bias = 0 ;		// The bias from the expected chance of success
	this.feedback = 1 ;	// The strength of the feedback, between 0 and 1

	// For RNG that support multiple channels
	this.channelSeed = null ;
	this.children = null ;
}

module.exports = BaseRng ;



// Should be derived
BaseRng.prototype.initState = function() {} ;
BaseRng.prototype.generate = function() {} ;
BaseRng.prototype.nextState = function() { this.count ++ ; } ;



// Reset the RNG, PRNG should output the same sequence again
BaseRng.prototype.reset = function() {
	this.count = 0 ;
	this.bias = 0 ;
	this.initState() ;
} ;



// It's a userland function, do not call it when cloning a RNG, it would remove array representation (e.g. for channelSeed)
BaseRng.prototype.setSeed = function( seed , sequenceSeed = null , channelSeed = null ) {
	this.seed = this.sanitizeSeedLike( seed ) ;
	if ( Object.hasOwn( this , 'sequenceSeed' ) ) { this.sequenceSeed = this.sanitizeSeedLike( sequenceSeed ) ; }
	this.channelSeed = this.sanitizeSeedLike( channelSeed ) ;
	this.initState() ;
} ;



const JOINT = '|' ;
const REPLACE_JOINT_REGEX = /\|/g ;
const JOINT_REPLACER = '-' ;



// A seed or seed-like could be: a Number (finite), a BigInt, a String, or an Array of all that.
// String should not contains the JOINT except if it was an array, after being flatten.
BaseRng.prototype.sanitizeSeedLike = function( seedLike ) {
	if ( seedLike === null || seedLike === undefined ) { return null ; }

	if ( typeof seedLike === 'number' ) {
		if ( ! Number.isFinite( seedLike ) ) { throw new Error( "The seed or seed-like cannot be NaN or +/- Infinity" ) ; }
		return seedLike ;
	}

	if ( typeof seedLike === 'bigint' ) { return seedLike ; }

	if ( typeof seedLike === 'string' ) {
		seedLike = seedLike.replace( REPLACE_JOINT_REGEX , JOINT_REPLACER ) ;
		return seedLike ;
	}

	if ( Array.isArray( seedLike ) ) {
		return seedLike
			.map( subSeedLike => {
				let sanitized = this.sanitizeSeedLike( subSeedLike ) ;
				if ( sanitized === null || sanitized === undefined ) { return '' ; }
				return '' + sanitized ;
			} )
			.join( JOINT ) ;
	}

	throw new Error( "The seed or seed-like cannot be of type " + ( typeof seedLike ) ) ;
} ;



BaseRng.prototype.joinStringStates = function( ... states ) {
	return states.join( JOINT ) ;
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



const RNG_PARENT = new WeakMap() ;

// Return a sub-RNG for a channel
BaseRng.prototype.channel = function( channelSeed ) {
	// Avoid creating children of children, only one level is possible
	const parent = RNG_PARENT.get( this ) ;
	if ( parent ) { return parent.channel( channelSeed ) ; }

	// Immediately sanitize it
	channelSeed = this.sanitizeSeedLike( channelSeed ) ;

	if ( ! this.children ) { this.children = new Map() ; }

	let child = this.children.get( channelSeed ) ;

	if ( ! child ) {
		const proto = Object.getPrototypeOf( this ) ;
		child = new proto.constructor() ;
		this.children.set( channelSeed , child ) ;
		RNG_PARENT.set( child , this ) ;

		// Do not call child.setSeed(), it would sanitize twice, thus remove channel array representation
		child.seed = this.seed ;
		if ( Object.hasOwn( this , 'sequenceSeed' ) ) { child.sequenceSeed = this.sequenceSeed ; }
		child.channelSeed = channelSeed ;
		child.feedback = this.feedback ;
		child.initState() ;
	}

	return child ;
} ;



BaseRng.prototype.resetBias = function() { this.bias = 0 ; } ;
BaseRng.prototype.setFeedback = function( feedback ) { this.feedback = Math.max( 0 , Math.min( 1 , + feedback ) ) ; } ;



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



BaseRng.inheritFromMasterGenerator = function( Generator ) {
	Generator.prototype.randomFloat = function() { return this.masterRng.randomFloat() ; } ;
	Generator.prototype.randomUInt32 = function() { return this.masterRng.randomUInt32() ; } ;
} ;



BaseRng.prototype.randomFloatFromUInt32 = function() {
	return this.randomUInt32() / MAX_UINT32 ;
} ;



BaseRng.prototype.randomUInt32FromFloat = function() {
	return Math.floor( this.randomFloat() * MAX_UINT32 ) ;
} ;



// .randomInt( IntegerA ) : generate a [ 0 , IntegerA ) integer
BaseRng.prototype.randomInt = BaseRng.prototype.randomInteger = function( int ) {
	return Math.floor( this.randomFloat() * int ) ;
} ;



// .randomIntRange( IntegerA , IntegerB ) : generate a [ IntegerA , IntegerB ] integer
BaseRng.prototype.randomIntRange = BaseRng.prototype.randomIntegerRange = function( intA , intB ) {
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
	Random dice ( number of dice , number of faces )
*/
BaseRng.prototype.diceRoll = function( diceCount , faceCount ) {
	var sum = 0 ;
	for ( ; diceCount > 0 ; diceCount -- ) { sum += this.randomIntRange( 1 , faceCount ) ; }
	return sum ;
} ;



/*
	Return a random element from an array.
*/
BaseRng.prototype.randomElement = function( array ) {
	return array[ this.randomInt( array.length ) ] ;
} ;



/*
	Sample an array.
	It's like copying an array, partially shuffling it and only keep the n-first entries.
*/
BaseRng.prototype.sample = function( array , count ) {
	// Copy the array before shuffling it and truncating it
	array = Array.from( array ) ;
	count = Math.max( 0 , Math.min( array.length , count ) ) ;

	for ( let currentIndex = 0 ; currentIndex < count ; currentIndex ++ ) {
		let randomIndex = this.randomIntRange( currentIndex , array.length - 1 ) ;
		//if ( randomIndex !== currentIndex ) // it's probably slower to have a conditionnal rather than just let it swap itself
		let temp = array[ currentIndex ] ;
		array[ currentIndex ] = array[ randomIndex ] ;
		array[ randomIndex ] = temp ;
	}

	array.length = count ;
	return array ;
} ;



/*
	Sample an array with weights, making some elements more likely to be chosen.

	Syntax:
		.weightedSample( array , weights , count )
		.weightedSample( array , weightProperty , count )

	array: the array to sample from
	weights: an array of weights
	weightProperty: if this syntax is used, weightProperty is a string, 'array' is an Array of objects having this property used as the weight
	count: the number of array element to choose
*/
BaseRng.prototype.weightedSample = function( array , weights , count ) {
	const cumulativeWeights =
		typeof weights === 'string' ? sampleUtils.buildCumulativeWeightsFromObjects( array , weights ) :
		sampleUtils.buildCumulativeWeights( weights ) ;

	//console.log( "cumulativeWeights:" , cumulativeWeights ) ;
	count = Math.min( count , cumulativeWeights.length ) ;
	const sample = new Array( count ) ;

	let randomIndex ;

	for ( let i = 0 ; i < count ; i ++ ) {
		if ( i > 0 ) {
			// We nullify the weight of the last chosen random index and update subsequent cumulative weights
			sampleUtils.nullifyCumulativeWeightsAtIndex( cumulativeWeights , randomIndex ) ;
		}

		randomIndex = sampleUtils.randomIndexFromCumulativeWeights( cumulativeWeights , this.randomFloat() ) ;
		sample[ i ] = array[ randomIndex ] ;
	}

	return sample ;
} ;



/*
	Shuffle an array.
*/
BaseRng.prototype.shuffle = function( array ) {
	for ( let currentIndex = 0 ; currentIndex < array.length ; currentIndex ++ ) {
		let randomIndex = this.randomIntRange( currentIndex , array.length - 1 ) ;
		//if ( randomIndex !== currentIndex ) // it's probably slower to have a conditionnal rather than just let it swap itself
		let temp = array[ currentIndex ] ;
		array[ currentIndex ] = array[ randomIndex ] ;
		array[ randomIndex ] = temp ;
	}

	return array ;
} ;



const CHARSET = BaseRng.CHARSET = {} ;
CHARSET.LOWERCASE_ALPHA = [
	'a' , 'b' , 'c' , 'd' , 'e' , 'f' , 'g' , 'h' , 'i' , 'j' , 'k' , 'l' , 'm' ,
	'n' , 'o' , 'p' , 'q' , 'r' , 's' , 't' , 'u' , 'v' , 'w' , 'x' , 'y' , 'z'
] ;
CHARSET.UPPERCASE_ALPHA = [
	'A' , 'B' , 'C' , 'D' , 'E' , 'F' , 'G' , 'H' , 'I' , 'J' , 'K' , 'L' , 'M' ,
	'N' , 'O' , 'P' , 'Q' , 'R' , 'S' , 'T' , 'U' , 'V' , 'W' , 'X' , 'Y' , 'Z'
] ;
CHARSET.NUMERIC = CHARSET.NUMBERS = [ '0' , '1' , '2' , '3' , '4' , '5' , '6' , '7' , '8' , '9' ] ;
CHARSET.ALPHA = [ ... CHARSET.LOWERCASE_ALPHA , ... CHARSET.UPPERCASE_ALPHA ] ;
CHARSET.LOWERCASE_ALPHANUM = CHARSET.LOWERCASE_ALPHANUMERIC = CHARSET.BASE36 = [ ... CHARSET.NUMERIC , ... CHARSET.LOWERCASE_ALPHA ] ;
CHARSET.UPPERCASE_ALPHANUM = CHARSET.UPPER_ALPHANUMERIC = [ ... CHARSET.NUMERIC , ... CHARSET.UPPERCASE_ALPHA ] ;
CHARSET.ALPHANUM = CHARSET.ALPHANUMERIC = [ ... CHARSET.NUMERIC , ... CHARSET.LOWERCASE_ALPHA , ... CHARSET.UPPERCASE_ALPHA ] ;
CHARSET.HEX = CHARSET.HEXA = CHARSET.HEXADECIMAL = [ ... CHARSET.NUMERIC , 'a' , 'b' , 'c' , 'd' , 'e' , 'f'  ] ;
CHARSET.BASE64 = [ ... CHARSET.UPPERCASE_ALPHA , ... CHARSET.LOWERCASE_ALPHA , ... CHARSET.NUMERIC , '+' , '/' ] ;
CHARSET.BASE64_URL = [ ... CHARSET.UPPERCASE_ALPHA , ... CHARSET.LOWERCASE_ALPHA , ... CHARSET.NUMERIC , '-' , '_' ] ;



/*
	Return a random alphanumeric string.
	Can produce hyphen-separated groups, e.g. .randomString( 4 , 4 ) would produce something like this: a9W3-S7d9-2uMs-v4Jo
*/
BaseRng.prototype.randomString = function( groupSize , groups = 1 , groupSeparator = '-' , charset = CHARSET.ALPHANUM ) {
	let str = '' ;

	for ( let g = 0 ; g < groups ; g ++ ) {
		if ( g ) { str += groupSeparator ; }

		for ( let i = 0 ; i < groupSize ; i ++ ) {
			str += this.randomElement( charset ) ;
		}
	}

	return str ;
} ;



/*
	Normal distribution.

	baseValue: also expectedValue, mean or mu
	standardDeviation: also sigma (fr: écart-type)
*/
BaseRng.prototype.randomNormal = function( baseValue = 0 , standardDeviation = 1 ) {
	return stat.normalInvCdf( this.randomFloat() , baseValue , standardDeviation ) ;
} ;



/*
	Log normal distribution.
	Since baseValue is a median, if you need to pass the mean, use the exponential distribution instead.

	baseValue: also median or "multiplicative mean" (≠ from mean or expected value, because of the exponential shape)
	multiplicativeStdDev: 1 sigma (=68%) will fall between baseValue / multiplicativeStdDev and baseValue * multiplicativeStdDev,
		sort of standard deviation for multiplication
*/
BaseRng.prototype.randomLogNormal = function( baseValue , multiplicativeStdDev = 2 ) {
	return stat.logNormalInvCdf( this.randomFloat() , baseValue , multiplicativeStdDev ) ;
} ;



/*
	Triangular distribution.

	min: the minimal value having 0 probability chance
	mid: the middle value with the greatest density of probability
	max: the maximal value having 0 probability chance
*/
BaseRng.prototype.randomTriangular = function( min , mid , max ) {
	return stat.triangularInvCdf( this.randomFloat() , min , mid , max ) ;
} ;



/*
	Exponential distribution.
	Good for time related randomization.
	Also good replacement for log-normal if the parameter should be the mean (since log-normal parameter is the median)

	baseValue: also expectedValue, mean or mu
*/
BaseRng.prototype.randomExponential = function( baseValue = 0 ) {
	return baseValue * stat.exponentialInvCdf( this.randomFloat() ) ;
} ;



/*
	Poisson distribution.
	Output an integer.
	Good for event counting in a time-frame or the number of thing in a cell.

	It is **ITERATIVE**, so DO NOT USE FOR LARGE BASE VALUE!!!

	baseValue: also expectedValue, mean or mu
*/
BaseRng.prototype.randomPoisson = function( baseValue ) {
	return stat.poissonIterativeInvCdf( this.randomFloat() , baseValue ) ;
} ;



/*
	A single trial with a p probability of success.
*/
BaseRng.prototype.randomTrial = function( p ) {
	return this.randomFloat() < p ;
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



/*
	A single trial with a p probability of success.
	It has a negative feedback based on the current random bias, the strenght of the feedback is the .feedback property.
*/
BaseRng.prototype.pseudoRandomTrial = function( p ) {
	// We don't want 0% or 100% to be altered, so we lower the feedback strength for extreme p-values
	const factor = 2 * Math.min( p , 1 - p ) * this.feedback ;
	//const factor = this.feedback ;
	//console.log( "compensated p is" , p - this.bias * factor ) ;

	if ( this.randomFloat() < p - this.bias * factor ) {
		this.bias += 1 - p ;
		return true ;
	}

	this.bias += - p ;
	return false ;

} ;

