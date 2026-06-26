#!/usr/bin/env node
"use strict" ;

const rngKit = require( '..' ) ;
const rng = require( './getRngFromCliArgs.js' ) ;

const Uniform = require( './Uniform.js' ) ;
const test = new Uniform( rng ) ;
test.run() ;


