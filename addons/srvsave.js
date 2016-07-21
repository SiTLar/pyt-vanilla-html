"use strict";
define("./addons/srvsave",["../utils"],function(utils){

var cView;
var nodesT = new Object(); 
//var savDomain = "micropeppa";
var loginOK = false;
var savDomain = "FreeFeed";
var template = [
{"c":"settings-no-login"
, "children":[
	{"t":"h1", "txt":"&#x52A9; Sync settings to server"}
	,{"t":"p","txt":"To be able to sync settings to the server, you should be logged in to an account on "+ savDomain}
]}
,{"c":"settings"
, "children":[
	{"t":"h1", "txt":"&#x52A9; Sync settings to server"}
	,{"t":"span", "txt":"The account for saving the settings will be the main account on " + savDomain + ":&nbsp;" }
	,{"c":"account", "t":"span"}
	,{
	"children":[
		,{"t":"label" 
		,"children":[
			{"t":"input" ,"p":{"type":"checkbox","name":"autosave", "value":"addons-save-blocks"}, "e":{"click":["addons-srvsave","autosave"]} }
			,{"t":"span", "txt":"Automatically sync blocked users to server."}
		]}
	]}
	,{"c":"buttons"
	,"children":[
		{"t":"input"
			,"p":{"value":"Upload settings","type":"button"}
			,"e":{"click":["addons-srvsave","upload"]}
		}
		,{"t":"input"
			,"p":{"value":"Download settings","type":"button"} 
			,"e":{"click":["addons-srvsave","download"]}
		}
	]}
	,{"c":"update-status" }
]}
];
var settingsNames = require("json!../settings.json");;
function netError(res){
	nodeMsg.className = "msg-error";
	nodeMsg.innerHTML = "Got error: ";
	try{ 
		nodeMsg.innerHTML += res.data.err;
	}catch(e) {nodeMsg.innerHTML += "unknown error";};
	e.target.disabled = false;
}
var handlers = {
	"upload":function(e){
		e.target.disabled = true;
		var nodeMsg = e.target.getNode(["p","settings"], ["c", "update-status"]);
		save().then(function(){
			e.target.disabled = false;
			nodeMsg.className = "sr-info";
			nodeMsg.innerHTML = "Your settings and login tokens are saved to the server";
		},netError);


	}
	,"download":function(e){
		e.target.disabled = true;
		var savContext = cView.contexts[savDomain];
		var nodeMsg = e.target.getNode(["p","settings"], ["c", "update-status"]);
		savContext.getWhoami(savContext.token).then(function(){
			nodeMsg.className = "sr-info";
			oSettings = savContext.gMe.users.frontendPreferences.vanilla;
			if ((typeof oSettings === "undefined")
			||!Object.keys(oSettings).length){
				nodeMsg.className = "msg-error";
				nodeMsg.innerHTML = "No settings were found on the server.";
				e.target.disabled = false;
				return;
			}
			settingsNames.forEach(function(name){
				cView.localStorage.setItem(name,oSettings[name] );
			});
			Object.keys( oSettings.tokens).forEach(function(domain){
				var context = cView.contexts[domain];
				var tokens = oSettings.tokens[domain];
				Object.keys( tokens).forEach(function(id){
					context.logins[id] = {
						"token":tokens[id]
						,"domain":domain
					};
				});
				var mainId = oSettings.mainIds[domain];
				if (typeof mainId !== "undefined")
					context.token = context.logins[mainId].token;
			});
			cView.Common.saveLogins();
			location.reload();
		},netError);
	}
	,"autosave": function(e){
		var action = e.target.checked;
		if (action){
			if (confirm(" Enabling this will overwrite existing user blocking preferences on the server. Consider downloading the settings first.")){
				cView.localStorage.setItem(e.target.value, action);
				var savContext = cView.contexts[savDomain];
				savContext.getWhoami(savContext.token).then(function(){
					oSettings = savContext.gMe.users.frontendPreferences.vanilla;
					oSettings.blocks = cView.localStorage.getItem("blocks");
					savContext.api.updProfile(
						savContext.token
						,savContext.gMe.users.id
						,{"user":{"frontendPreferences":{"vanilla":oSettings}}}
					);
				});
			}else  e.target.checked = false;
		} else cView.localStorage.setItem(e.target.value, action);
	
	}
};
function save(){
	var oSettings = new Object();
	settingsNames.forEach(function(name){
		oSettings[name] = cView.localStorage.getItem(name);
	});
	var tokens = new Object();
	var mainIds = new Object();
	Object.keys(cView.contexts).forEach(function (domain){
		var context = cView.contexts[domain];
		tokens[domain] = new Object();
		Object.keys(context.logins).forEach(function(id){ 
			if (context.logins[id].token == context.token)
				mainIds[domain] = id;
			tokens[domain][id] = context.logins[id].token;
		});
	});
	oSettings.tokens = tokens;
	oSettings.mainIds = mainIds;
	var savContext = cView.contexts[savDomain];
	return savContext.api.updProfile(
		savContext.token
		,savContext.gMe.users.id
		,{"user":{"frontendPreferences":{"vanilla":oSettings}}}
	);
}
function makeSettings(){
	
	if(!loginOK)return nodesT["settings-no-login"].cloneAll();
	var node = nodesT["settings"].cloneAll();
	cView.Utils.getInputsByName(node)["autosave"].checked = JSON.parse(cView.localStorage.getItem("addons-save-blocks"));
	cView.contexts[savDomain].p.then(function(){
		node.cNodes["account"].innerHTML = "@" + cView.contexts[savDomain].gMe.users.username;
	});
	return node;
}
return function(cV){
	return {
		"run": function (){
			cView = cV;
			cView.Common.genNodes(template).forEach(function(node){
				nodesT[node.classList[0]] = node;
			});
			if ((typeof cView.contexts[savDomain] === "undefined")
			|| !cView.contexts[savDomain].token) return;
			loginOK = true;
			cView["addons-srvsave"] = handlers;
			if (JSON.parse(cView.localStorage.getItem("addons-save-blocks"))){
				var savContext = cView.contexts[savDomain];
				savContext.getWhoami(savContext.token).then(function(){
					var oSettings = savContext.gMe.users.frontendPreferences.vanilla;
					cView.localStorage.setItem("blocks",oSettings["blocks"]);
					var ub = cView.Common.updateBlockList;
					cView.Common.updateBlockList = function(){
						ub.apply(cView, arguments);
						save();
					}

				});
			}
		}
		,"settings": function(){return makeSettings(cView);}
	}
};
});
