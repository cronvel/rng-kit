"use strict" ;

const logger = require( './logger.js' ) ;

const EXTRA_SPACE = 1.2 ;
const BATCH_SIZE = 200_000 ;



function PreAllocator( rng ) {
	this.rng = rng ;
	this.allocatedFloats = 0 ;
	this.floatArray = null ;
	this.integerArray = null ;
}

module.exports = PreAllocator ;



PreAllocator.prototype.allocateFloats = function( count ) {
	if ( this.floatArray ) {
		if ( this.floatArray.length < count ) {
			let newFloatArray = new Float64Array( Math.ceil( count * EXTRA_SPACE ) ) ;
			newFloatArray.set( this.floatArray ) ;
			this.floatArray = newFloatArray ;
		}
	}
	else {
		this.floatArray = new Float64Array( Math.ceil( count * EXTRA_SPACE ) ) ;
	}

	for ( let i = this.allocatedFloats ; i < count ; ) {
		const nextStop = Math.min( i + BATCH_SIZE , count ) ;
		for ( ; i < nextStop ; i ++ ) {
			this.floatArray[ i ] = this.rng.randomFloat() ;
		}

		logger.rewritableLog( "%k / %k floats generated" , i - this.allocatedFloats , count - this.allocatedFloats ) ;
	}

	this.allocatedFloats = count ;
} ;


/*
// Probably useless, it's best to tap directly into the floatArray, since some tests require
// seeking multiple random number ahead, and going back and forth...
PreAllocator.prototype.floatGenerator = function*() {
	for ( let i = 0 ; i < this.allocatedFloats ; i ++ ) {
		yield this.floatArray[ i ] ;
	}
} ;
*/

