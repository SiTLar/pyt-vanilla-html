"use strict";
var punycode = require("punycode");
var request = require("then-request");
var fs = require("fs");
var Promise = require("promise");
var write = Promise.denodeify(fs.writeFile);
module.exports = (function(){
	return request("GET", "http://data.iana.org/TLD/tlds-alpha-by-domain.txt")
	.then(function(res){
		var tlds = res.getBody("utf8").split("\n").reduce((prev,curr)=>{
			if(curr[0] == "#") return prev;
			if(curr.indexOf("XN--") != -1){
				prev[punycode.decode(curr.slice(4)).toLocaleLowerCase()] = true;
			}
			prev[curr.toLocaleLowerCase()] = true;
			return prev;
		} ,{});
		return write("tlds.json", JSON.stringify(tlds), "utf8");
	});
})();
