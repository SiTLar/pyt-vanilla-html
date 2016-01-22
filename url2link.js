"use strict";
var tlds = require("raw!val!./loadtlds");
define("Url2link", [], function(){
function _Url2link(cfg){
	var that = this;
	if (typeof cfg === "undefined")return;
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
		"regex": /((?:[-\w!#$%&'*+/=?^`{|}~\\]*\.)*([-\w!#$%&'*+/=?^`{|}~\\])+@(?:[^\s"\/~!@#$^&*()_?:;|\\]+\.)+(?:[^\s"\/~!@#$^&*()_?:;|\\\.,]){2,})/
		,"flags": "i"
		,"check":function(text){
			var regex = /@(?:[^\s"\/~!@#$^&*()_?:;|\\]+\.)+([^\s\/"~!@#$^&*()_?:;|\\\.,]{2,})/;
			var matches = regex.exec(text);
			if(matches && (typeof tlds[matches[1].toLocaleLowerCase()] !== "undefined"))
				return true;
			else return false;
		}
		,"newtab":false
		,"action":function(match,host){
			return '<a href="mailto:' + match + '" >' + match + '</a>'; 
		}
	}
	,"text":{
		"regex":/([\W\w])/
		,"action":function(match){
			return match;
		}
	
	}
	,"url":{
		"regex": /((?:https?:\/\/)?(?:[^\s\/"~!@#$^&*()_?:;|\\,]+\.)+[^\s\/"~!@#$^&*()_?:;|\\\.,]{2,}(?:\.)?(?::[0-9]+)?(?:\/[^\s]*)*)/
		,"flags": "i"
		,"newtab": true
		,"check":function(text){
			var regex = /^(?:https?:\/\/)?(?:[^\s\/"~!@#$^&*()_?:;|\\,]+\.)+([^\s\/"~!@#$^&*()_?:;|\\\.,]{2,})/;
			var matches = regex.exec(text);
			if(matches && (typeof tlds[matches[1].toLocaleLowerCase()] !== "undefined"))
				return true;
			else return false;
		}
		,"action":function(match,host){
			var text;
			var regex = /^https?:\/\//
			var scheme = regex.exec(match); 
			if(scheme) text = match.slice(scheme[0].length);
			else {
				text = match;
				match = "http://"+match;
			}
			try {text = decodeURI(text);}
			catch(e){};
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
		var out = new Array({"type":"text", "prefix":"", "val":input, "start":0});
		var bracketsMap = new Array();
		var brackets = new Array(that.bra.length);
		brackets.fill(0);
		for(var idx = 0; idx < input.length; idx++ ){
			var idxBra = that.bra.indexOf(input.charAt(idx));
			var idxKet = that.ket.indexOf(input.charAt(idx));
			if((idxBra == idxKet)&&(idxBra != -1)) brackets[idxBra]= brackets[idxBra]?0:1;
			else {
				if(idxBra != -1) brackets[idxBra]++;
				if(idxKet != -1) brackets[idxKet]--;
			}
			if((idxBra != -1)|| (idxKet != -1))bracketsMap.push({"idx":idx,"a":brackets.slice()});
		}
		
		["email","url","uname"].forEach(function(type){
			var newOut = new Array();
			out.forEach(function(el){
				if (el.type == "text") 
					newOut = newOut.concat(digest(type, el.val, el.start));
				else newOut = newOut.concat(el);
			});
			out = newOut;
		});
		
		function digest(t, text, start){
			var conv = that[t];
			var prevIdx = 0;
			var oMatch;
			var val;
			var head = new Object();
			var tail = new Object();
			var output = new Array();
			var regex = new RegExp("(^|\\s|.)"+conv.regex.source, conv.flags+"g");
			while((oMatch = regex.exec(text) )!== null){
				var absStart = oMatch.index + start;
				if( text.slice(prevIdx, oMatch.index) != "" )
					output.push(textobj(text.slice(prevIdx, oMatch.index), absStart));
				prevIdx = regex.lastIndex;

				var startBr = binarySearch(bracketsMap,absStart+oMatch[1].length);
				var endBr = binarySearch(bracketsMap,regex.lastIndex+start);
				val = oMatch[2];
				head = {"prefix":oMatch[1]
					,"start":start 
					,"val":val
				}
				var brOK = true;
				if( (startBr!=endBr)&& (bracketsMap[startBr].idx >= absStart)){
					if(startBr)startBr--;
					var arrSBr = bracketsMap[startBr].a;
					do{
						brOK = true;
						var arrEBr = bracketsMap[endBr--].a;
						for(var idx = 0; idx < arrSBr.length; idx++)
							if(arrSBr[idx] != arrEBr[idx]){
								brOK = false;
								break;
							}
					}while(!(brOK || (startBr == endBr)) );
					//if(startBr != endBr){
					//if(!brOK)
					head.val =val.slice(0, bracketsMap[++endBr].idx - start )
					
						
					tail = {"prefix":""
						,"start":bracketsMap[endBr].idx
						,"val":val.slice(bracketsMap[endBr].idx - start)
					}
					//}
				}
				[head,tail].forEach(function(el){
					if(typeof el.start === "undefined" )return;
					if(el.val == "")return;
					if(!el.val.match(new RegExp(regex.source))
					||((typeof conv.check === "function") 
						&& !conv.check(el.val))) el.type = "text";
					else el.type = t;
					output.push(el);
				});
				/*
				if((oMatch[1] != "")
				&&((idxBra = that.bra.indexOf(oMatch[1])) != -1)){
					idxEnd = oMatch[2].lastIndexOf(that.ket.charAt(idxBra));
					if (idxEnd != -1){
						val =  oMatch[2].slice(0,idxEnd++);
						idxEnd += oMatch.index;
					}
					else idxEnd = regex.lastIndex;
				}
				*/

			}
			output.push(textobj(text.slice(prevIdx), prevIdx+start));
			return output;
		}

		function binarySearch(array, key) {
			var lo = 0,
			    hi = array.length - 1,
			    mid,
			    element;
			while (lo <= hi) {
				mid = ((lo + hi) >> 1);
				element = array[mid];
				if (element.idx < key) {
					lo = mid + 1;
				} else if (element.idx > key) {
					hi = mid - 1;
				} else {
					return mid;
				}
			}
			return hi;
		}
		function textobj(text, idx){
			return {
				"type":"text"
				,"start": idx
				,"prefix":""
				,"val":text
			};
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
