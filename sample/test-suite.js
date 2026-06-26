#!/usr/bin/env node
"use strict" ;

const rngKit = require( '..' ) ;
const rng = require( './getRngFromCliArgs.js' ) ;

let test ;

//*
const Uniformity = require( './Uniformity.js' ) ;
test = new Uniformity( rng ) ;
test.run() ;
//*/

const BirthdaySpacings = require( './BirthdaySpacings.js' ) ;
test = new BirthdaySpacings( rng ) ;
test.run() ;


