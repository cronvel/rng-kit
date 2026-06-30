"use strict" ;

const BaseTest = require( './BaseTest.js' ) ;

const logger = require( './logger.js' ) ;
const stat = require( '../../lib/stat.js' ) ;

const arrayKit = require( 'array-kit' ) ;



function Autocorrelation( preAllocator , params = {} ) {
	BaseTest.call( this , preAllocator ) ;
	this.samples = params.samples ?? 500_000 ;
	this.lag = params.lag ?? 1 ;

	this.requiredFloats = this.samples ;

	this.testName = this.lag === 1 ? 'Serial Autocorrelation' : 'Lagged Autocorrelation (lag=' + this.lag + ')' ;
}

Autocorrelation.prototype = Object.create( BaseTest.prototype ) ;
Autocorrelation.prototype.constructor = Autocorrelation ;

module.exports = Autocorrelation ;

Autocorrelation.prototype.testName = 'Autocorrelation' ;
Autocorrelation.prototype.description = 'It checks whether a value produced is correlated with a previous value, also known as the serial correlation for lag=1' ;



Autocorrelation.prototype.run = function() {
	const startTime = Date.now() ;

	const intervals = this.samples - this.lag ;
	const expectedAutocorrelation = 0 ;
	const sigmaAutocorrelation = 1 / Math.sqrt( intervals ) ;

	// Most lib seems to use 0.5 as the mean instead of the real mean, but it would be possible to do so...
	const expectedMean = 0.5 ;
	//const actualMean = arrayKit.mean( this.preAllocator.floatArray , 0 , this.samples ) ;


	let covarianceSum = 0 ;

	// Sum of products for samples separated by lag
	for ( let i = 0 ; i < intervals ; i ++ ) {
		const float = this.preAllocator.floatArray[ i ] ;
		const nextFloat = this.preAllocator.floatArray[ i + this.lag ] ;
		covarianceSum += ( float - expectedMean ) * ( nextFloat - expectedMean ) ;
	}

	let varianceSum = 0 ;

	// Sum of squared deviations from the expected mean
	for ( let i = 0 ; i < this.samples ; i ++ ) {
		const float = this.preAllocator.floatArray[ i ] ;
		const deviation = float - expectedMean ;
		varianceSum += deviation * deviation ;
	}

	const autocorrelation = covarianceSum / varianceSum ;
	const zScore = autocorrelation * Math.sqrt( intervals ) ;

	//const zScore = BaseTest.zScore( chiSquared , expectedChiSquared , sigmaChiSquared ) ;
	const pValue = BaseTest.zScoreToPValue( zScore ) ;

	const duration = Date.now() - startTime ;
	
	this.reportData = {
		duration ,
		extra: [ 'lag' ] ,
		measureOf: "autocorrelation" ,
		actual: autocorrelation ,
		expected: expectedAutocorrelation ,
		stdDev: sigmaAutocorrelation ,
		zScore ,
		pValue
	} ;
} ;

