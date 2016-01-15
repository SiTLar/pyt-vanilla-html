"use strict";
var punycode = require("punycode");
module.exports = (function(){
	var request = require("sync-request");
	var res = request("GET", "http://data.iana.org/TLD/tlds-alpha-by-domain.txt");
	 return res.getBody("utf8").split("\n").reduce((prev,curr)=>{
	 	if(curr[0] == "#") return prev;
		if(curr.indexOf("XN--") != -1){
			prev[punycode.decode(curr.slice(4)).toLocaleLowerCase()] = true;
		}
		prev[curr.toLocaleLowerCase()] = true;
		return prev;

	 } ,{});

})();
