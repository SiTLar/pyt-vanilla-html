"use strict";
var apis = {
	"freefeed": require("./freefeed")
	,"mokum": require("./mokum")

}

var gTemplates = require("json!./templates.json");
var gDomains = require("json!./domains.json");
define( [ "./utils" , "./common", "./draw" ,"./actions" , "./router", "./hasher" ]
,function(Utils, _Common, _Drawer,_Actions, _Router, _Hasher){
	function _Context(v, domain, api){
		var context = this ;
		Object.keys(context.defaults).forEach(function(key){
			context[key] = JSON.parse(JSON.stringify(context.defaults[key]))
		});
		context.domain = domain;
		context.cView = v;
		v.contexts[domain] = context;
		context.api = new Object();
		Object.keys(api.protocol).forEach(function(f){
			context.api[f] = function(){
				return api.protocol[f].apply(context, arguments)
				.then(function(res){
					return ( typeof res !== "undefined")?
						api.parse(res)
						:null;

				});
			}
		});
		context.api.parse = api.parse;
		context.api.name = api.name;
		this.p = new Utils._Promise( function(resolve){resolve()});
		if ((typeof api.oRT !== "undefined") && JSON.parse(v.localStorage.getItem("rt"))){
			context.rt = new api.oRT(context,JSON.parse(v.localStorage.getItem("rtbump")));
			["rtSubTimeline","rtSubPost"].forEach(function(key){
				context[key] = function(inp){context.rt[key](inp)};
			});
		}else ["rtSubTimeline","rtSubPost"].forEach(function(key){context[key] = function(){};});

	}
	_Context.prototype = {
		constructor:_Context
		,"defaults":{
			"gUsers": { "byName":{}}
			,"gUsersQ": {}
			,"gComments": {}
			,"gAttachments": {}
			,"gFeeds": {}
			,"gRt": {}
			,"logins": {} 
			,"token": null
			,"pending":[]
			,"timelineId": null
		}
		,"initRt": function(){
			var cView = this;
			var bump = cView.localStorage.getItem("rtbump");
			this.gRt = new RtUpdate(this.token, bump);
			this.gRt.subscribe(this.rtSub);
		}
		,get "gMe"(){
			var context = this;
			var logins = context.logins;
			var mainId;  
			var ids = Object.keys(logins);
			if(ids.length == 0)return null;
			if(ids.length === 1){
				mainId = ids[0];
				context.token = logins[ids[0]].token;
			}else ids.some(function(id){
				if(logins[id].token == context.token) {
					mainId = id;
					return true;
				}else return false;
			});
			
			logins[mainId].data.domain = context.domain;
			return logins[mainId].data;
		}
		,get "ids"(){
			var ids = Object.keys(this.logins);
			return ids;
		}
		,"digestText":function(text){
			var context = this;
			var arr = context.cView.autolinker.link(
				text.trim().replace(/&/g,"&amp;")
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;")
					.replace(/\n{2,}/g, "\n\n")
				,"array"
			).reduce(function(prev,curr){return prev.concat(curr);},[]);
			arr.forEach(function(txt,idx,arr){
				arr[idx] = txt.replace(
					/___CONTEXT_PATH___/g
					,gConfig.front+"as/"+context.domain
				);
			});
			arr.toString = function(){return this.join(" ");};
			return arr;
		}
		,"getWhoami": function(token){
			var context = this;
			return context.api["_getWhoami"](token).then(function(res){
				var id = res.users.id;
				if(typeof context.logins[id] === "undefined"){
					context.logins[id] = new Object();
					context.logins[id].token = token;
					context.logins[id].domain = context.domain;
				}

				context.logins[id].data = res;
				context.logins[id].data.domain = context.domain;
				context.cView.Common.refreshLogin(id,context);
				return res;
			});
		}
	}
	function _cView(doc){
		var cView = this;	
		Object.keys(cView.defaults).forEach(function(key){
			cView[key] = JSON.parse(JSON.stringify(cView.defaults[key]))
		});
		//cView.autolinker = new Autolinker({"truncate":20,  "replaceFn":Utils.frfAutolinker } );
		["localStorage", "sessionStorage"].forEach(function(storage){
			cView[storage] = new Object();
			["setItem", "getItem", "removeItem"].forEach(function(action){
				cView[storage][action] = function(){
					try{
						return window[storage][action].apply(window[storage],arguments);
					} catch(e){return null};
				}
			});
		});
		cView.doc = doc;
		doc.cView = cView;
		cView.cView = cView;
		cView.Common = new _Common(cView);
		cView.Drawer = new _Drawer(cView);
		cView.Actions = new _Actions(cView);
		cView.Router = new _Router(cView);
		cView.hasher = new _Hasher["_Minhash"]({"fnum":1000});
		cView.addons = { 
			"all":new Array()
			,"ok": function(){}
			,"pr": new Object()
		};
		cView.addons.pr = new Utils._Promise(function(resolve){
			cView.addons.ok = resolve;
		});
		//cView.SecretActions = new _SecretActions(cView);
		var Url2link =  require("./url2link");
		cView.autolinker = new Url2link({ "truncate":25
			,"url":{
				"actions":[
					["pre",cView.Common.setFrontUrl]
				]
			}
			,"text":{
				"actions":[
					["post",function(text){
						return text.replace(/\n/g," \n").split(" ")
							.filter(function(txt){return txt!="";});
					}]
				]
			}
			,"hashtag":{
				"actions":[
					["post",function(text){
						return text.replace(
							/___CONTEXT_SEARCH___/
							, gConfig.front+"search?qs="
						);
					}]
				]
			}
		});
		var domains = new Object();
		var confDomains = Array.isArray(gConfig.domains)?gConfig.domains:Object.keys(gConfig.domains);
		//gConfig.domains.forEach(function (d){
		confDomains.forEach(function (d){
			var cfg = gDomains[d];
			domains[d] = cfg;
			cView.contexts[d] = new _Context(cView, d, apis[cfg.api](cfg.server));
		});
		gConfig.domains = domains;
		cView.leadContext =  cView.contexts[gConfig.leadDomain];
	}
	_cView.prototype = {
		constructor: _cView
		,"defaults":{
			"contexts":{}
			,"gEmbed": {}
			,"gNodes": {}
			,"rtSub" : {}
			,"cTxt": null
			,"subReqsCount":0
			,"blocks": {"blockPosts":{},"blockComments":{},"blockStrings":{}}
			,"blockLists": {"cmts":"blockComments", "posts":"blockPosts"}
			,"threshold":0.63
			,"skip":0
			,"minBody": 20
			,"noBlocks":false
		}
		,"Utils":Utils
	};
	function init(doc){
		var cView = new _cView(doc);
		cView.Common.genNodes(gTemplates.nodes).forEach( function(node){ cView.gNodes[node.classList[0]] = node; });
		cView.Common.setIcon("throbber-16.gif");
		return cView;
	}
	return {
		"cView":_cView
		,"init":init
	}
});
