"use strict";
var apis = {
	"freefeed": require("./freefeed")

}

var gTemplates = require("json!./templates.json");
define( [ "./utils" , "./common", "./draw" ,"./actions" ,"./secrets", "./router" ]
,function(Utils, _Common, _Drawer,_Actions, _SecretActions, _Router){
	function _Context(v, domain, api){
		var that = this ;
		Object.keys(that.defaults).forEach(function(key){
			that[key] = JSON.parse(JSON.stringify(that.defaults[key]))
		});
		that.domain = domain;
		that.cView = v;
		v.contexts[domain] = that;
		that.api = new Object();
		Object.keys(api.protocol).forEach(function(f){
			that.api[f] = function(){
				return api.protocol[f].apply(that, arguments)
				.then(api.parse);
			}
		});
		this.p = new Utils._Promise( function(resolve){resolve()});

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
			if(ids.length == 1){
				logins[ids[0]].isMain = true;
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
			if (!ids.length) return null;
			return ids;
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
		cView.SecretActions = new _SecretActions(cView);
		var Url2link =  require("./url2link");
		cView.autolinker = new Url2link({ "truncate":25
			,"url":{
				"actions":[
					["pre",cView.Common.setFrontUrl]
				]
			}
		});
		Object.keys(gConfig.domains).forEach(function (d){
			var cfg = gConfig.domains[d];
			cView.contexts[d] = new _Context(cView, d, apis[cfg.api](cfg.server));
		});
	}
	_cView.prototype = {
		constructor: _cView
		,"defaults":{
			"contexts":{}
			,"gEmbed": {}
			,"gNodes": {}
			,"rtSub" : {}
			,"cTxt": null
			,"blocks": {"blockPosts":{},"blockComments":{}}
		}
		,"Utils":Utils
	};
	function init(doc){
		var cView = new _cView(doc);
		cView.Common.genNodes(gTemplates.nodes).forEach( function(node){ cView.gNodes[node.className] = node; });
		cView.Common.setIcon("throbber-16.gif");
		return cView;
	}
	return {
		"cView":_cView
		,"init":init
	}
});
