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

// Super-class
exports.BaseRng = require( './BaseRng.js' ) ;
exports.BaseRng.crossPlatform = require( './crossPlatformNode.js' ) ;

// Shorthands
exports.CHARSET = exports.BaseRng.CHARSET ;

// PRNG
exports.Native = require( './backend/Native.js' ) ;
exports.Lcg = require( './backend/Lcg.js' ) ;
exports.Pcg32 = require( './backend/Pcg32.js' ) ;
exports.Xoshiro256ss = require( './backend/Xoshiro256ss.js' ) ;
exports.MersenneTwister = require( './backend/MersenneTwister.js' ) ;
exports.Sha256Counter = require( './backend/Sha256Counter.js' ) ;
exports.PhiExp = require( './backend/PhiExp.js' ) ;

// Crypto RNG or almost true RNG
exports.CryptoRng = require( './backend/CryptoRng.js' ) ;

// DRF Deterministic Random Function
exports.Sha256Drf = require( './backend/Sha256Drf.js' ) ;

// Noises
exports.Perlin = require( './Perlin.js' ) ;

// Other exported things
exports.stat = require( './stat.js' ) ;
exports.sha256 = require( './sha256.js' ) ;

