
"use strict" ;

const stat = require( '../lib/stat.js' ) ;



function BaseTest( rng ) {
	this.rng = rng ;
}

module.exports = BaseTest ;


BaseTest.zScore = ( actual , expected , stdDev ) => ( actual - expected ) / stdDev ;
BaseTest.zScoreToPValue = zScore => stat.erfc( Math.abs( zScore ) / Math.SQRT2 ) ;
BaseTest.aggregateZScores = ( ... zScores ) => zScores.reduce( ( acc , zScore ) => acc + zScore , 0 ) / zScores.length ;

