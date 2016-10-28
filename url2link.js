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
				if (k == "actions"){
					if(!Array.isArray(cfg[key][k])) 
						that[key][k] = [cfg[key][k]];
					else cfg[key][k].forEach(function(act){
						switch(act[0]){
						case "pre":
							that[key][k].unshift(act[1]);
							break;
						case "post":
							that[key][k].push(act[1]);
							break;
						}
					});
				}
				else that[key][k] = cfg[key][k];
			});
		}
	});
};
_Url2link.prototype = {
	constructor:_Url2link
	,"trunc": 0
	,"email": {
		"regex": /((?:[-\w!#$%&'*+/=?^`{|}~\\]*\.)*([-\w!#$%&'*+/=?^`{|}~\\])+@(?:[^\s"\/~!@#$^&*()_?:;|\\\.]+\.)+(?:[^\s"\/~!@#$^&*()_?:;|\\\.,]){2,})/
		,"flags": "i"
		,"check":function(text){
			var regex = /@(?:[^\s"\/~!@#$^&*()_?:;|\.\\]+\.)+([^\s\/"~!@#$^&*()_?:;|\\\.,]{2,})/;
			var matches = regex.exec(text);
			if(matches && (typeof tlds[matches[1].toLocaleLowerCase()] !== "undefined"))
				return true;
			else return false;
		}
		,"newtab":false
		,"actions":[function(match,host){
			return '<a class="url2link-email" href="mailto:' + match + '" >' + match + '</a>'; 
		}]
	}
	,"text":{
		"regex":/([\W\w])/
		,"actions":[function(match){
			return match;
		}]
	
	}
	,"url":{
		"regex": /(?:https?:\/\/)?(?:[^\s\/'`"<>~!@#$^&*()_?\.:;|\\,]+\.)+[^\s\/'`"<>~!@#$^&*()_?:;|\\\.,]{2,}(?:\.)?(?::[0-9]+)?(?:\/[^\s]*?)*?[\]>)}]*?(?=[.,({\[<?:;`"]*(?:\s|$))/
		,"flags": "i"
		,"newtab": true
		,"check":function(text){
			var regex = /^(?:https?:\/\/)?(?:[^\s\/"~!@#$^&*()_?\.:;|\\,]+\.)+([^\s\/"~!@#$^&*()_?:;|\\\.,]{2,})/;
			var matches = regex.exec(text);
			if(matches && (typeof tlds[matches[1].toLocaleLowerCase()] !== "undefined"))
				return true;
			else return false;
		}
		,"actions":[function(match,host){
			var text;
			var suffix = ""; 
			var regex = /^https?:\/\//;
			var scheme = regex.exec(match); 
			var pos = match.length - 1;
			do{
				var idx = ">})]".indexOf(match.charAt(pos));
				if(idx == -1) continue;
				var bra = "<{([".charAt(idx);				
				var ket = match.charAt(pos);
				var ketPos = match.lastIndexOf(ket, pos-1);
				if(match.indexOf(bra,ketPos) == -1){
					suffix = match.slice(pos) + suffix;
					match = match.slice(0,pos);
				}
			}while(--pos > 0);
			if(scheme) text = match.slice(scheme[0].length);
			else {
				text = match;
				match = "http://"+match;
			}
			try {text = decodeURI(text);}
			catch(e){};
			if (text.slice(-1) == "/")text = text.slice(0,-1);
			text = (host.trunc &&(text.length > host.trunc))? text.substr(0,host.trunc)+"...":text;
			return '<a class="url2link-url" dir="ltr" ' +(host["url"].newtab?'target="_blank"':"") +' href="'+match+'">' + text + "</a>"+suffix;
		}]
	}
	,"uname":{
		//"regex": /@[-_a-z0-9]{3,}(?=[{}\[\]\(\)\*.,;:!?-\s]|$)/
		"regex": /@[-_a-z0-9]{3,}/
		,"newtab": true
		,"flags":"i"
		,"actions":[function(match, host){
			var uname = match.slice(1);
			return '<a class="url2link-uname" '+(host["uname"].newtab?'target="_blank"':"") +' href="___CONTEXT_PATH___/' + uname+'" >@' +uname + '</a>' ;
		}]
	}
	,"hashtag":{
		"regex": /#[^\s]{2,}(?=[}\]\).,;:!?\s]|$)/
		,"newtab": true
		,"flags":"i"
		,"actions":[function(match, host){
			return '<a class="url2link-hashtag" '+(host["hashtag"].newtab?'target="_blank"':"") +' href="___CONTEXT_SEARCH___%23' + match.slice(1)+'" >' + match+ '</a>' ;
		}]
	}
	,"link": function(input, format){
		var that = this;
		var matches = new Array();
		var out = new Array({"type":"text", "val":input});
		
		["email","url","uname","hashtag"].forEach(function(type){
			var newOut = new Array();
			out.forEach(function(el){
				if (el.type == "text") 
					newOut = newOut.concat(digest(type, el.val, el.start));
				else newOut = newOut.concat(el);
			});
			out = fuseText(newOut);
		});
		
		function digest(t, text, start){
			var conv = that[t];
			var prevIdx = 0;
			var oMatch;
			var val;
			var head = new Object();
			var tail = new Object();
			var output = new Array();
			var regex = new RegExp(conv.regex.source, conv.flags+"g");
			while((oMatch = regex.exec(text) )!== null){
				var absStart = oMatch.index + start;
				if( text.slice(prevIdx, oMatch.index) != "" )
					output.push(textobj(text.slice(prevIdx, oMatch.index)));
				prevIdx = regex.lastIndex;
				var el = {
					"val":oMatch[0]
				}

				if(el.val == "")continue;
				if ((typeof conv.check === "function") 
					&& !conv.check(el.val)) el.type = "text";
				else el.type = t;
				output.push(el);
			}
			output.push(textobj(text.slice(prevIdx)));
			return output;
		}
		function fuseText(inp){
			if(!inp.length)return inp;
			var outIdx = 0;
			var out = new Array();
			out.push(inp[0]);
			for (var idx = 1; idx<inp.length; idx++){
				if((inp[idx].type == "text") && (out[outIdx].type == "text") )
					out[outIdx].val = out[outIdx].val.concat(inp[idx].val);
				else out[++outIdx] = inp[idx];
			}
			return out;
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
		function textobj(text){
			return {
				"type":"text"
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
		switch(format){
		case "array":
			return out.map(function(curr){
				return that[curr.type]
					.actions
					.reduce(function(prev,action){ 
						return action(prev, that);
					}, curr.val);
			});
			break;

		case "text":
		default:
			return out.reduce(function(prev,curr){
				return prev 
					+that[curr.type]
						.actions
						.reduce(function(prev,action){ 
							return action(prev, that);
						}, curr.val);
			},"");
		}
	}
};
return _Url2link;
});
