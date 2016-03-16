"use strict";
var apis = {
	"freefeed.net": require("./freefeed")
	,"micropeppa.freefeed.net": require("./freefeed")

}

var gTemplates = require("json!./templates.json");
define( [ "./utils" , "./common", "./draw" ,"./actions" ,"./secrets", "./router" ]
,function(Utils, _Common, _Drawer,_Actions, _SecretActions, _Router){
	function _Context(domain, v){
		var that = this ;
		Object.keys(that.defaults).forEach(function(key){
			that[key] = JSON.parse(JSON.stringify(that.defaults[key]))
		});
		this.domain = domain;
		this.cView = v;
		v.contexts[domain] = this;
		this.api = apis[domain];
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
			,"mainId": ""
			,"token": null
		}
		,"initRt": function(){
			var cView = this;
			var bump = cView.localStorage.getItem("rtbump");
			this.gRt = new RtUpdate(this.token, bump);
			this.gRt.subscribe(this.rtSub);
		}
		,get "gMe"(){
			var logins = this.logins;
			var ids = Object.keys(logins);
			if(ids.length == 1){
				logins[ids[0]].isMain = true;
				this.token = logins[ids[0]].token;
				return logins[ids[0]].data;
			}
			if((this.mainId == "")||(ids.length == 0))return null;
			return logins[this.mainId].data;
		}
		,get "ids"(){
			var ids = Object.keys(this.logins);
			if (!ids.length) return null;
			return ids;
		}
		,"getWhoami": function(token){
			var context = this;
			return new Utils._Promise(function(resolve, reject){
				context.api["_getWhoami"](token).then(function(res){
					var id = res.users.id;
					if(typeof context.logins[id] === "undefined"){
						context.logins[id] = new Object();
						context.logins[id].token = token;
					}
					context.logins[id].data = res;
					context.cView.Common.refreshLogin(id,context);
					context.logins[id].data.domain = context.domain;
					resolve(res);
				},reject);
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
	}
	_cView.prototype = {
		constructor: _cView
		,"defaults":{
			"contexts":{}
			,"gEmbed": {}
			,"gNodes": {}
			,"rtSub" : {}
			,"cTxt": null
		}
		,"_Context":_Context
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
