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

// This is from the math-kit lib, but it is greatly improved (math-kit should get this version)



const stat = {} ;
module.exports = stat ;



/*
	Return the probability at x for the Gaussian distribution or Normal Ditribution Function.

	* x: the x coordinate
	* u => µ: expected value (fr: esperance) or average value
	* s => sigma: standard deviation (fr: écart-type)

	If µ=0 and sigma=1, this is the normal distribution reduced and centered.
*/
stat.normalDf = ( x , u = 0 , s = 1 ) =>
	( 1 / ( s * Math.sqrt( 2 * Math.PI ) ) ) * Math.exp( - 0.5 * Math.pow( ( x - u ) / s , 2 ) ) ;



/*
	Error function.
	u and s are only useful for the .normalCdf() function.
*/
stat.erf = ( x , u = 0 , s = 1 ) => {
	// Borrowed from:
	// https://stackoverflow.com/questions/5259421/cumulative-distribution-function-in-javascript

	// Lookup constants
	const a1 =  0.254829592 ;
	const a2 = - 0.284496736 ;
	const a3 =  1.421413741 ;
	const a4 = - 1.453152027 ;
	const a5 =  1.061405429 ;

	const z = ( x - u ) / Math.sqrt( 2 * s * s ) ;
	const t = 1 / ( 1 + 0.3275911 * Math.abs( z ) ) ;
	let erfValue = 1 - ( ( ( ( ( a5 * t + a4 ) * t ) + a3 ) * t + a2 ) * t + a1 ) * t * Math.exp( - z * z ) ;

	if ( z < 0 ) { erfValue = - erfValue ; }

	return erfValue ;
} ;



stat.normalCdf = ( x , u = 0 , s = 1 ) =>
	0.5 * ( 1 + stat.erf( x , u , s ) ) ;



/*
	Return the inverse of the Gaussian distribution's function or Normal Inverse Cumulative Distribution Function.
	This is the Holy Grail of role-player ;)

	* p: the probability value
	* u => µ: expected value (fr: esperance) or average value, this control the offset (Y-axis)
	* s => sigma: standard deviation (fr: écart-type), this control the scale (Y-axis)

	If µ=0 and sigma=1, this is the normal distribution reduced and centered.
*/
stat.normalInvCdf = ( p , u = 0 , s = 1 ) => {
	let x ;


	// Lookup tables

	const a = [
		undefined ,
		- 3.969683028665376e+01 ,
		2.209460984245205e+02 ,
		- 2.759285104469687e+02 ,
		1.383577518672690e+02 ,
		- 3.066479806614716e+01 ,
		2.506628277459239e+00
	] ;

	const b = [
		undefined ,
		- 5.447609879822406e+01 ,
		1.615858368580409e+02 ,
		- 1.556989798598866e+02 ,
		6.680131188771972e+01 ,
		- 1.328068155288572e+01
	] ;

	const c = [
		undefined ,
		- 7.784894002430293e-03 ,
		- 3.223964580411365e-01 ,
		- 2.400758277161838e+00 ,
		- 2.549732539343734e+00 ,
		4.374664141464968e+00 ,
		2.938163982698783e+00
	] ;

	const d = [
		undefined ,
		7.784695709041462e-03 ,
		3.224671290700398e-01 ,
		2.445134137142996e+00 ,
		3.754408661907416e+00
	] ;

	// Define break-points
	const pLow =  0.02425 ;	// Use lower region approx below this
	const pHigh = 1 - pLow ;	// Use upper region approx above this

	// Rational approximation for lower region
	if ( 0 < p && p < pLow ) {
		const q = Math.sqrt( - 2 * Math.log( p ) ) ;
		x = ( ( ( ( ( c[1] * q + c[2] ) * q + c[3] ) * q + c[4] ) * q + c[5] ) *
			q + c[6] ) / ( ( ( ( d[1] * q + d[2] ) * q + d[3] ) * q + d[4] ) *
			q + 1 ) ;
	}
	// Rational approximation for central region
	else if ( pLow <= p && p <= pHigh ) {
		const q = p - 0.5 ;
		const r = q * q ;
		x = ( ( ( ( ( a[1] * r + a[2] ) * r + a[3] ) * r + a[4] ) * r + a[5] ) *
			r + a[6] ) * q / ( ( ( ( ( b[1] * r + b[2] ) * r + b[3] ) * r +
			b[4] ) * r + b[5] ) * r + 1 ) ;
	}
	// Rational approximation for upper region
	else if ( pHigh < p && p < 1 ) {
		const q = Math.sqrt( - 2 * Math.log( 1 - p ) ) ;
		x = - ( ( ( ( ( c[1] * q + c[2] ) * q + c[3] ) * q + c[4] ) * q +
			c[5] ) * q + c[6] ) / ( ( ( ( d[1] * q + d[2] ) * q + d[3] ) *
			q + d[4] ) * q + 1 ) ;
	}
	else if ( p <= 0 ) {
		return - Infinity ;
	}
	else {	//if ( p >= 0 ) {
		return Infinity ;
	}

	// We multiply by the standard deviation and add the expected value
	x = u + s * x ;

	return x ;
} ;



/*
	This is like normal, but for multiplication.

	* median: here it is also known as the "multiplicative mean" (not the regular mean)
	* multiplicativeStdDev: it is not a classic statistical parameter.
		It is designed after normal distribution standard deviation, it's a sort of standard deviation for multiplication.
		1 sigma (=68%) will produce values between median / multiplicativeStdDev and median * multiplicativeStdDev.
*/
stat.logNormalInvCdf = ( p , median , multiplicativeStdDev ) =>
	median * Math.exp( Math.log( multiplicativeStdDev ) * stat.normalInvCdf( p , 0 , 1 ) ) ;



/*
	The exponential distribution function is great for memoryless time chance for an event.
*/
stat.exponentialDf = ( x , lambda ) =>
	lambda * Math.exp( - lambda * x ) ;



stat.exponentialCdf = ( x , lambda ) =>
	1 - Math.exp( - lambda * x ) ;



/*
	The mean or expected value is 1/lambda, the median value ln(2)/lambda (0.693 for lambda=1).

	* p: the probability value
*/
stat.exponentialInvCdf = ( p , lambda = 1 ) =>
	- Math.log( 1 - p ) / lambda ;



/*
	Triangular density of probability.

	* p: the probability value
	* a: the lower bound value
	* c: the value in the middle with the greatest density of probability
	* b: the upper bound value
*/
stat.triangularInvCdf = ( p , a , c , b ) => {
	const rate = ( c - a ) / ( b - a ) ;

	return p < rate ? a + Math.sqrt( p * ( b - a ) * ( c - a ) ) :
		b - Math.sqrt( ( 1 - p ) * ( b - a ) * ( b - c ) ) ;
} ;



/*
	Poisson density of probability.
	This is the iterative variant, do not use with big lambda values, or p very very close to 1 (like p=0.99999...).

	* p: the probability value
	* lambda: the mean
*/
stat.poissonIterativeInvCdf = ( p , lambda ) => {
	let k = 0 ,
		expLambda = Math.exp( - lambda ) ,
		cdf = expLambda ;

	while ( p > cdf ) {
		k ++ ;
		expLambda *= lambda / k ;
		cdf += expLambda ;
	}

	return k ;
} ;



/*
	Poisson density of probability.
	For large values of lambda, it is way faster.
	It use the normal inverse cumulative.

	* p: the probability value
	* lambda: the mean
*/
stat.poissonApproximativeInvCdf = ( p , lambda ) =>
	Math.max( 0 , Math.round( stat.normalInvCdf( p , lambda , Math.sqrt( lambda ) ) ) ) ;



/*
	Poisson density of probability.
	It uses the iterative variant for lambda ≤ 30, and the normal approximation for lambda > 30,
	and also for p ≥ 0.9999999999.

	/!\ The transition from p-value from 0.9999999999 to upper value is BAD,
	but it avoids very huge loops (could blow up to infinity).

	* p: the probability value
	* lambda: the mean
*/
stat.poissonMixedInvCdf = ( p , lambda ) =>
	lambda <= 30 && p <= 0.9999999999 ? stat.poissonIterativeInvCdf( p , lambda ) :
	stat.poissonApproximativeInvCdf( p , lambda ) ;

