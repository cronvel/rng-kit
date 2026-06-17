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

// This is from the math-kit lib



const stat = {} ;
module.exports = stat ;



/*
	Return the probability at x for the Gaussian distribution or Normal Ditribution Function.

	* x: the x coordinate
	* u => µ: expected value (fr: esperance) or average value
	* s => sigma: standard deviation (fr: écart-type)

	If µ=0 and sigma=1, this is the normal distribution reduced and centered.
*/
stat.normalDf = function( x , u = 0 , s = 1 ) {
	return ( 1 / ( s * Math.sqrt( 2 * Math.PI ) ) ) * Math.exp( - 0.5 * Math.pow( ( x - u ) / s , 2 ) ) ;
} ;



/*
	Return the inverse of the Gaussian distribution's function or Normal Inverse Cumulative Distribution Function.
	This is the Holy Grail of role-player ;)

	* p: the probability value
	* u => µ: expected value (fr: esperance) or average value, this control the offset (Y-axis)
	* s => sigma: standard deviation (fr: écart-type), this control the scale (Y-axis)

	If µ=0 and sigma=1, this is the normal distribution reduced and centered.
*/
stat.normalInvCdf = function( p , u = 0 , s = 1 ) {
	let a , b , c , d , x , r , q , pLow , pHigh ;


	// Lookup tables

	a = [
		undefined ,
		- 3.969683028665376e+01 ,
		2.209460984245205e+02 ,
		- 2.759285104469687e+02 ,
		1.383577518672690e+02 ,
		- 3.066479806614716e+01 ,
		2.506628277459239e+00
	] ;

	b = [
		undefined ,
		- 5.447609879822406e+01 ,
		1.615858368580409e+02 ,
		- 1.556989798598866e+02 ,
		6.680131188771972e+01 ,
		- 1.328068155288572e+01
	] ;

	c = [
		undefined ,
		- 7.784894002430293e-03 ,
		- 3.223964580411365e-01 ,
		- 2.400758277161838e+00 ,
		- 2.549732539343734e+00 ,
		4.374664141464968e+00 ,
		2.938163982698783e+00
	] ;

	d = [
		undefined ,
		7.784695709041462e-03 ,
		3.224671290700398e-01 ,
		2.445134137142996e+00 ,
		3.754408661907416e+00
	] ;

	// Define break-points
	pLow =  0.02425 ;	//Use lower region approx. below this
	pHigh = 1 - pLow ;	//Use upper region approx. above this

	// Rational approximation for lower region
	if ( 0 < p && p < pLow ) {
		q = Math.sqrt( - 2 * Math.log( p ) ) ;
		x = ( ( ( ( ( c[1] * q + c[2] ) * q + c[3] ) * q + c[4] ) * q + c[5] ) *
			q + c[6] ) / ( ( ( ( d[1] * q + d[2] ) * q + d[3] ) * q + d[4] ) *
			q + 1 ) ;
	}
	// Rational approximation for central region
	else if ( pLow <= p && p <= pHigh ) {
		q = p - 0.5 ;
		r = q * q ;
		x = ( ( ( ( ( a[1] * r + a[2] ) * r + a[3] ) * r + a[4] ) * r + a[5] ) *
			r + a[6] ) * q / ( ( ( ( ( b[1] * r + b[2] ) * r + b[3] ) * r +
			b[4] ) * r + b[5] ) * r + 1 ) ;
	}
	// Rational approximation for upper region
	else if ( pHigh < p && p < 1 ) {
		q = Math.sqrt( - 2 * Math.log( 1 - p ) ) ;
		x = - ( ( ( ( ( c[1] * q + c[2] ) * q + c[3] ) * q + c[4] ) * q +
			c[5] ) * q + c[6] ) / ( ( ( ( d[1] * q + d[2] ) * q + d[3] ) *
			q + d[4] ) * q + 1 ) ;
	}
	// If p <= 0 or p >= 1, x is undefined
	else {
		x = undefined ;
	}

	// We multiply by the standard deviation and add the expected value
	x = u + s * x ;

	return x ;
} ;



/*
	Error function.
	u and s are only useful for the .normalCdf() function.
*/
stat.erf = function( x , u = 0 , s = 1 ) {
	// Borrowed from:
	// https://stackoverflow.com/questions/5259421/cumulative-distribution-function-in-javascript

	let z , t , a1 , a2 , a3 , a4 , a5 , erfValue ;

	// Lookup constants
	a1 =  0.254829592 ;
	a2 = - 0.284496736 ;
	a3 =  1.421413741 ;
	a4 = - 1.453152027 ;
	a5 =  1.061405429 ;

	z = ( x - u ) / Math.sqrt( 2 * s * s ) ;
	t = 1 / ( 1 + 0.3275911 * Math.abs( z ) ) ;
	erfValue = 1 - ( ( ( ( ( a5 * t + a4 ) * t ) + a3 ) * t + a2 ) * t + a1 ) * t * Math.exp( - z * z ) ;

	if ( z < 0 ) { erfValue = - erfValue ; }

	return erfValue ;
} ;



stat.normalCdf = function( x , u = 0 , s = 1 ) {
	return 0.5 * ( 1 + stat.erf( x , u , s ) ) ;
} ;

