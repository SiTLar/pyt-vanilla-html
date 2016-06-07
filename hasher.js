"use strict";
var crc32 = require("crc-32");
define("hasher", [], function(){

function tokenize(original) {
	var parts = original.replace(/[,.\/?\\~!`'"@#$%^&*()_+-=;:{}\[\]]/," " ).split(" ");
	var shingles = new Array();
	var kshingles = 12;
	parts.forEach(function(part){
		var size = part.length;
		if(size <= kshingles) {
		    shingles.push(part.substr(0));
		    return;
		}

		for (var i = 0; i < size; i = i + kshingles) {
		    shingles.push(i + kshingles < size ? part.slice(i, i + kshingles) : part.slice(i));
		}
	});
        return shingles;
    };

function _Minhash (options){
	this.fnum = (typeof options !== "undefined")? options.fnum:100;
	this.fArr = new Array(); 
	for(var idx = 0; idx<this.fnum; idx++){
		this.fArr[idx] = { 
			"a": Math.floor(Math.random() * 0xffffffff) 
			,"b": Math.floor(Math.random() * 0xffffffff) 
		};
	};
}
_Minhash.prototype = {
	constructor: _Minhash
	,"of":  function (str){
		var tokens = tokenize(str);
		var shingles = tokens.map(crc32.str)
				.map(function(hash){ return parseInt(hash, 16);});
		return this.fArr.map(function(coef){
			return Math.min.apply(null,shingles.map(function(shingle){
				return (shingle*coef.a+coef.b) >> 32 ;
			}));
		});
		/*
		var out = new Object();
		this.fArr.forEach(function(coef){
			out[ Math.min.apply(null,shingles.map(function(shingle){
				return (shingle*coef.a+coef.b) >> 32 ;
			}))] = true;
		});
		return out;
		*/
		 
	}
	,"similarity": function(x,y){
		//return x.reduce(function(acc, hash, idx){return acc + ((y[idx]==hash)?1:0); },0)/x.length;
		/*
		var hashes = Object.keys(x);
		*/
		var total = 0;
		for(var idx = 0; idx< x.length; idx++)
			total += ((y[idx] == x[idx] )?1:0);
		return total/x.length;
		
	}
}
return {
	"_Minhash":_Minhash
}
});
