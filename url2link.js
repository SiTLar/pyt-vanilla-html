"use strict";
var tlds = require("raw!val!./loadtlds");
define("Url2link", [], function(){
function _Url2link(cfg){
	var that = this;
	Object.keys(cfg).forEach(function(key){
		switch(key){
		case "truncate":
			that.trunc = cfg[key];
			break;
		default:
			Object.keys(cfg[key]).forEach(function(k){
				that[key][k] = cfg[key][k];
			});
		}
	});
};
_Url2link.prototype = {
	constructor:_Url2link
	,"trunc": 0
	,"bra": "([{*%$'\""
	,"ket": ")]}*%$'\""
	,"email": {
		"regex": /(([-\w!#$%&'*+/=?^`{|}~\\]*\.)*([-\w!#$%&'*+/=?^`{|}~\\])+@(?:[^\s\/~!@#$^&*()_?:;|\\]+\.)+(?:[^\s\/~!@#$^&*()_?:;|\\\.]){2,})/
		,"flags": "i"
		,"newtab":false
		,"action":function(match,host){
			var regex = /.*@(?:[^\s\/~!@#$^&*()_?:;|\\]+\.)+((?:[^\s\/~!@#$^&*()_?:;|\\\.]){2,})/;
			var parts = regex.exec(match); 
			if(typeof tlds[parts[1].toLocaleLowerCase()] === "undefined") return match;
			else return '<a href="mailto:' + match + '" >' + match + '</a>'; 

		}
	}
	,"text":{
		"regex":/([\W\w])/
		,"action":function(match){
			return match;
		}
	
	}
	,"url":{
		"regex": /((?:https?:\/\/)?(?:[^\s\/~!@#$^&*()_?:;|\\]+\.)+(?:[^\s\/~!@#$^&*()_?:;|\\\.]){2,}(?:\.)?(?::[0-9]+)?(?:\/[^\s]*)*)/
		,"flags": "i"
		,"newtab": true
		,"action":function(match,host){
			var regex = /(https?:\/\/)?(?:[^\s\/~!@#$^&*()_?:;|\\]+\.)+((?:[^\s\/~!@#$^&*()_?:;|\\\.]){2,})(?:\.)?(?::[0-9]+)?(?:\/[^\s]*)*/
			var text;
			var parts = regex.exec(match); 
			if(typeof tlds[parts[2].toLocaleLowerCase()] === "undefined") return match;
			if(typeof parts[1] !== "undefined"  ) text = match.slice(parts[1].length);
			else {
				text = match;
				match = "http://"+match;
			}
			text = decodeURI(text);
			if (text.slice(-1) == "/")text = text.slice(0,-1);
			text = (host.trunc &&(text.length > host.trunc))? text.substr(0,host.trunc)+"...":text;
			return '<a ' +(host["url"].newtab?'target="_blank"':"") +' href="'+match+'">' + text + "</a>";
		}
	}
	,"uname":{
		"regex": /@([a-z0-9]{3,})/
		,"newtab": true
		,"flags":"i"
		,"action":function(match, host){
			return '<a '+(host["uname"].newtab?'target="_blank"':"") +' href="' + gConfig.front+match+'" >@' +match + '</a>' ;
		}
	}
	,"link": function(input){
		var that = this;
		var matches = new Array();
		var out = new Array({"type":"text", "prefix":"", "val":input});

		["email","url","uname"].forEach(function(type){
			var newOut = new Array();
			out.forEach(function(el){
				if (el.type == "text") 
					newOut = newOut.concat(digest(type, el.val));
				else newOut = newOut.concat(el);
			});
			out = newOut;
		});
		
		
		function digest(t, text){
			var conv = that[t];
			var prevIdx = 0;
			var idxEnd;
			var idxBra;
			var oMatch;
			var val;
			var output = new Array();
			var regex = new RegExp("(^|\\s|.)"+conv.regex.source, conv.flags+"g");
			while((oMatch = regex.exec(text) )!== null){
				if( text.slice(prevIdx, oMatch.index) != "" ){
					output.push({
						"type":"text"
						,"prefix":""
						,"val": text.slice(prevIdx, oMatch.index)
					});
				}
				idxEnd = regex.lastIndex;
				val = oMatch[2];
				if((oMatch[1] != "")
				&&((idxBra = that.bra.indexOf(oMatch[1])) != -1)){
					idxEnd = oMatch[2].lastIndexOf(that.ket.charAt(idxBra));
					if (idxEnd != -1){
						val =  oMatch[2].slice(0,idxEnd++);
						idxEnd += oMatch.index;
					}
					else idxEnd = regex.lastIndex;
				}
				
				output.push({
					"type":t
					,"prefix":oMatch[1]
					,"val":val
				});
				prevIdx = regex.lastIndex;

			}
			output.push({
				"type":"text"
				,"prefix":""
				,"val": text.slice(prevIdx)
			});
			return output;
		}
	/*	matches.sort(function(a,b){return a.start - b.start;});
		var lastPos = 0;
		matches.forEach(function(m){
			out.push(text.slice(lastPos,m.start));
			out.push(m.prefix+that[m.type].action(m.val,that));
			lastPos = m.end;
		});
		out.push(text.slice(lastPos));
		return out.join("");
	*/
		return out.reduce(function(prev,curr){
			return prev + curr.prefix +that[curr.type].action( curr.val, that);
		},"");
	}
};
return _Url2link;
});
