
"use strict" ;



function Uniform( rng ) {
	this.rng = rng ;
	this.partitions = 100 ;
	this.expectedPerPartition = 1000 ;
}

module.exports = Uniform ;



Uniform.prototype.run = function() {
	const results = new Array( this.partitions ).fill( 0 ) ;
	const count = this.partitions * this.expectedPerPartition ;

	for ( let i = 0 ; i < count ; i ++ ) {
		const v = this.rng.randomInt( this.partitions ) ;
		results[ v ] ++ ;
	}

	let maxError = 0 ;
	for ( let i = 0 ; i < this.partitions ; i ++ ) {
		let error = results[ i ] / this.expectedPerPartition ;
		if ( error > 1 ) { error = 1 / error ; }
		error = 1 - error ;
		if ( error > maxError ) { maxError = error ; }
	}

	console.log( "maxError:" , maxError ) ;
} ;

