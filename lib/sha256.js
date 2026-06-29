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



/*
	Pure vanilla Javascript SHA-256 port, no dependencies, no crypto APIs.
*/

/*
	sha256( input )
	sha256( input , outputFormat )
	sha256( input , params )

	input: the input, only string is supported ATM
	params: object, where:
		inputFormat: not coded yet
		outputFormat: the output format, supported:
			Uint32Array (alias: array): the natural unmodified output, which is an Uint32Array of 8 Uint32
			Uint8Array: convert the Uint32Array into a Uint8Array (bytes), convenient for creating Buffer out of it
			hex: convert to an hexadecimal string
			Uint32: convert to a single Uint32 obtained by XOR'ing each elements of the Uint32Array
		state: (default: null) re-use a pre-existing state, not useful instead for RNG
*/
function sha256( input , params = {} ) {
	let inputFormat , outputFormat ;

	if ( typeof params === 'string' ) { params = { outputFormat: params } ; }

	let inputData = fromUtf8( input ) ;
	inputData = padInputData( inputData ) ;
	//console.log( "Padded input:" , inputData.length ) ;

	const state = params.state ?? initState() ;
	const uint32ArrayHash = updateState( state , inputData ) ;

	if ( ! params.outputFormat ) { return uint32ArrayHash ; }

	switch ( params.outputFormat.toLowerCase() ) {
		case 'array' :
		case 'uint32array' :
			return uint32ArrayHash ;
		case 'uint8array' :
			return toUint8Array( uint32ArrayHash ) ;
		case 'hex' :
			return toHex( uint32ArrayHash ) ;
		case 'uint32' :
			return toUint32( uint32ArrayHash ) ;
		default :
			throw new Error( "Unknown output format: " + outputFormat ) ;
	}
}

module.exports = sha256 ;



// utf8 to Uint8Array
function fromUtf8( str ) {
	const bytes = [] ;

	for ( let i = 0 ; i < str.length ; i ++ ) {
		const code = str.charCodeAt( i ) ;

		if ( code < 0x80 ) {
			bytes.push( code ) ;
		}
		else if ( code < 0x800 ) {
			bytes.push(
				0xc0 | ( code >> 6 ) ,
				0x80 | ( code & 0x3f )
			) ;
		}
		else if ( code >= 0xd800 && code <= 0xdbff && i + 1 < str.length ) {
			const next = str.charCodeAt( ++ i ) ;
			const cp = 0x10000 + ( ( ( code & 0x3ff ) << 10 ) | ( next & 0x3ff ) ) ;

			bytes.push(
				0xf0 | ( cp >> 18 ) ,
				0x80 | ( ( cp >> 12 ) & 0x3f ) ,
				0x80 | ( ( cp >> 6 ) & 0x3f ) ,
				0x80 | ( cp & 0x3f )
			) ;
		}
		else {
			bytes.push(
				0xe0 | ( code >> 12 ) ,
				0x80 | ( ( code >> 6 ) & 0x3f ) ,
				0x80 | ( code & 0x3f )
			) ;
		}
	}

	return new Uint8Array( bytes ) ;
}



// Uint32Array to hex
function toHex( uint32Array ) {
	let hex = '' ;

	for ( let i = 0 ; i < uint32Array.length ; i ++ ) {
		hex += uint32Array[ i ].toString( 16 ).padStart( 8 , '0' ) ;
	}

	return hex ;
}



// Convert Uint32Array to a single Uint32, XOR'ing each 4-bytes
function toUint32( uint32Array ) {
	let uint32 = 0 ;

	for ( let i = 0 ; i < uint32Array.length ; i ++ ) {
		uint32 ^= uint32Array[ i ] ;
	}

	// Force positive Uint32 (bit operators output Int32)
	uint32 = uint32 >>> 0 ;

	return uint32 ;
}



const BYTE_MASK = 255 ;

// Convert Uint32Array to a Uint8Array
function toUint8Array( uint32Array ) {
	const uint8Array = new Uint8Array( uint32Array.length * 4 ) ;

	for ( let i = 0 ; i < uint32Array.length ; i ++ ) {
		uint8Array[ i * 4 ]     = ( uint32Array[ i ] >>> 24 ) & BYTE_MASK ;
		uint8Array[ i * 4 + 1 ] = ( uint32Array[ i ] >>> 16 ) & BYTE_MASK ;
		uint8Array[ i * 4 + 2 ] = ( uint32Array[ i ] >>> 8 ) & BYTE_MASK ;
		uint8Array[ i * 4 + 3 ] =   uint32Array[ i ] & BYTE_MASK ;
	}

	return uint8Array ;
}



const INIT_HASH = [
	0x6a09e667 ,
	0xbb67ae85 ,
	0x3c6ef372 ,
	0xa54ff53a ,
	0x510e527f ,
	0x9b05688c ,
	0x1f83d9ab ,
	0x5be0cd19
] ;



function initState() {
	const state = new Uint32Array( 72 ) ;
	state.set( INIT_HASH ) ;
	return state ;
}

// Expose it
sha256.initState = initState ;



function padInputData( input ) {
	const bitLength = input.length * 8 ;
	const paddedLength = ( ( ( input.length + 9 + 63 ) >> 6 ) << 6 ) ;
	const data = new Uint8Array( paddedLength ) ;

	data.set( input ) ;
	data[ input.length ] = 0x80 ;

	const hi = Math.floor( bitLength / 0x100000000 ) ;
	const lo = bitLength >>> 0 ;

	data[ paddedLength - 8 ] = ( hi >>> 24 ) & 0xff ;
	data[ paddedLength - 7 ] = ( hi >>> 16 ) & 0xff ;
	data[ paddedLength - 6 ] = ( hi >>> 8 ) & 0xff ;
	data[ paddedLength - 5 ] = hi & 0xff ;

	data[ paddedLength - 4 ] = ( lo >>> 24 ) & 0xff ;
	data[ paddedLength - 3 ] = ( lo >>> 16 ) & 0xff ;
	data[ paddedLength - 2 ] = ( lo >>> 8 ) & 0xff ;
	data[ paddedLength - 1 ] = lo & 0xff ;

	return data ;
}


const K = new Uint32Array( [
	0x428a2f98 , 0x71374491 , 0xb5c0fbcf , 0xe9b5dba5 ,
	0x3956c25b , 0x59f111f1 , 0x923f82a4 , 0xab1c5ed5 ,
	0xd807aa98 , 0x12835b01 , 0x243185be , 0x550c7dc3 ,
	0x72be5d74 , 0x80deb1fe , 0x9bdc06a7 , 0xc19bf174 ,
	0xe49b69c1 , 0xefbe4786 , 0x0fc19dc6 , 0x240ca1cc ,
	0x2de92c6f , 0x4a7484aa , 0x5cb0a9dc , 0x76f988da ,
	0x983e5152 , 0xa831c66d , 0xb00327c8 , 0xbf597fc7 ,
	0xc6e00bf3 , 0xd5a79147 , 0x06ca6351 , 0x14292967 ,
	0x27b70a85 , 0x2e1b2138 , 0x4d2c6dfc , 0x53380d13 ,
	0x650a7354 , 0x766a0abb , 0x81c2c92e , 0x92722c85 ,
	0xa2bfe8a1 , 0xa81a664b , 0xc24b8b70 , 0xc76c51a3 ,
	0xd192e819 , 0xd6990624 , 0xf40e3585 , 0x106aa070 ,
	0x19a4c116 , 0x1e376c08 , 0x2748774c , 0x34b0bcb5 ,
	0x391c0cb3 , 0x4ed8aa4a , 0x5b9cca4f , 0x682e6ff3 ,
	0x748f82ee , 0x78a5636f , 0x84c87814 , 0x8cc70208 ,
	0x90befffa , 0xa4506ceb , 0xbef9a3f7 , 0xc67178f2
] ) ;




// The real thing.
// Input: Uint8Array
// Output: Uint32Array
// It's not my code here, I have no idea how it works, it's just a port.
function updateState( state , data ) {
	const hash = state.subarray( 0 , 8 ) ;
	const W = state.subarray( 8 , 72 ) ;

	for ( let offset = 0 ; offset < data.length ; offset += 64 ) {

		for ( let t = 0 ; t < 16 ; t ++ ) {
			const i = offset + t * 4 ;
			W[ t ] = ( data[ i ] << 24 ) | ( data[ i + 1 ] << 16 ) | ( data[ i + 2 ] << 8 ) | data[ i + 3 ] ;
		}

		for ( let t = 16 ; t < 64 ; t ++ ) {
			const s0 = rotr( W[ t - 15 ] , 7 ) ^ rotr( W[ t - 15 ] , 18 ) ^ ( W[ t - 15 ] >>> 3 ) ;
			const s1 = rotr( W[ t - 2 ] , 17 ) ^ rotr( W[ t - 2 ] , 19 ) ^ ( W[ t - 2 ] >>> 10 ) ;
			W[ t ] = ( W[ t - 16 ] + s0 + W[ t - 7 ] + s1 ) >>> 0 ;
		}

		let [  a , b , c , d , e , f , g , h  ] = hash ;

		for ( let t = 0 ; t < 64 ; t ++ ) {
			const S1 = rotr( e , 6 ) ^ rotr( e , 11 ) ^ rotr( e , 25 ) ;
			const ch = ( e & f ) ^ ( ~ e & g ) ;
			const temp1 = ( h + S1 + ch + K[ t ] + W[ t ] ) >>> 0 ;
			const S0 = rotr( a , 2 ) ^ rotr( a , 13 ) ^ rotr( a , 22 ) ;
			const maj = ( a & b ) ^ ( a & c ) ^ ( b & c ) ;
			const temp2 = ( S0 + maj ) >>> 0 ;

			h = g ;
			g = f ;
			f = e ;
			e = ( d + temp1 ) >>> 0 ;
			d = c ;
			c = b ;
			b = a ;
			a = ( temp1 + temp2 ) >>> 0 ;
		}

		hash[ 0 ] = ( hash[ 0 ] + a ) >>> 0 ;
		hash[ 1 ] = ( hash[ 1 ] + b ) >>> 0 ;
		hash[ 2 ] = ( hash[ 2 ] + c ) >>> 0 ;
		hash[ 3 ] = ( hash[ 3 ] + d ) >>> 0 ;
		hash[ 4 ] = ( hash[ 4 ] + e ) >>> 0 ;
		hash[ 5 ] = ( hash[ 5 ] + f ) >>> 0 ;
		hash[ 6 ] = ( hash[ 6 ] + g ) >>> 0 ;
		hash[ 7 ] = ( hash[ 7 ] + h ) >>> 0 ;
	}

	return hash ;
}



function rotr( x , n ) {
	return ( x >>> n ) | ( x << ( 32 - n ) ) ;
}

