"use strict";
var _Utils = require("./utils.js");
var _Drawer =  require("./draw.js");
var _Actions = require("./actions.js");
var _SecretActions = require("./secrets.js");
//var RtUpdate = require("./rt_network.js");
var gTemplates = require("json!./templates.json");
var _Document = require("./dom_document.js")
var Autolinker = require("./Autolinker.min");
var fs = require("fs");
var url = require("url");
var XMLHttpRequest =  require("xhr2");
var gPrivTimeline = {"done":0,"postsById":{},"oraphed":{count:0},"noKey":{},"noDecipher":{},nCmts:0,"posts":[] };
require("script!./config_srv.json");
var head = require("raw!./head.template");
global.window = {"setTimeout":function(){}}
var Actions_srv = new Object();
for(var key in new _Actions()){ Actions_srv[key]=function(a){return function(){ return ["Actions",a]; }; }(key)};
var SecretActions_srv = new Object();
for(var key in new _SecretActions()){ SecretActions_srv[key]=function(a){return function(){ return ["SecretActions",a]; }; }(key)};
module.exports = function(req,res){

	var document = new _Document();
	var cView = {
		"gUsers": { "byName":{}}
		,"gUsersQ": {}
		,"gMe": {}
		,"gComments": {}
		,"gAttachments": {}
		,"gFeeds": {}
		,"gNodes": {}
		,"gEmbed": {}
		,"gRt": {}
		,"rtSub" : {}
		,"mode": "username" 
/*		,"initRt": function(){
			var cView = this;
			var bump = cView.localStorage.getItem("rtbump");
			cView.gRt = new RtUpdate(cView.token, bump);
			cView.gRt.subscribe(cView.rtSub);
		}
*/
	};
	var Utils = new _Utils(cView);
	var Drawer = new _Drawer(cView);
	cView.doc = document;
	document.cView = cView;
	cView.Utils = Utils;
	cView.Drawer = Drawer;
	cView.Actions = Actions_srv;
	cView.SecretActions = SecretActions_srv;
	Utils.genNodes(gTemplates.nodes).forEach( function(node){ cView.gNodes[node.className] = node; });
	cView.autolinker = new Autolinker({"truncate":20,  "replaceFn":Utils.frfAutolinker } );
	Utils.setStorage();
	var urlReq = url.parse(req.url, true);	
	var locationPath = (urlReq.pathname).slice(gConfig.front.length);
	var locationSearch = urlReq.search;
	if (locationPath == "")locationPath = "home";
	if (locationSearch == "")locationSearch = "?offset=0";
	cView.cSkip = parseInt(locationSearch.match(/offset=([0-9]*).*/)[1]);
	var arrLocationPath = locationPath.split("/");
	cView.timeline = arrLocationPath[0];
	if(req.headers.cookie) req.headers.cookie.split(";").some(function(c){
		var cookie = c.split("=");
		if(cookie[0].trim() == gConfig.tokenPrefix + "authToken" ){
			cView.token = decodeURIComponent(cookie[1]);
			return true;
		}
	});
	if(["home", "filter", "settings", "requests"].some(function(a){
		return a == cView.timeline;
	})){
		if(!cView.token) {
			res.writeHeader(403);
			res.end();
			return;
		}
	}else if(!cView.token) cView.gMe = undefined;
	if(cView.timeline == "settings")return Drawer.drawSettings();
	if(cView.timeline == "requests")return Drawer.drawRequests();
	if(arrLocationPath.length > 1){
		if (locationPath == "filter/discussions") {
			cView.timeline = locationPath;
			cView.xhrurl = gConfig.serverURL + "timelines/filter/discussions";
		} else	if (locationPath == "filter/direct") {
			cView.timeline = locationPath;
			cView.xhrurl = gConfig.serverURL + "timelines/filter/directs";
		}else{
			cView.xhrurl = gConfig.serverURL +"posts/"+arrLocationPath[1];
			locationSearch = "?maxComments=all";
		}
	} else cView.xhrurl = gConfig.serverURL + "timelines/"+locationPath;

	//initDoc(req)
	//new Promise(function(resolve,reject){resolve([JSON.parse(fs.readFileSync("data.json"))]);})
	getContent(cView.xhrurl+locationSearch, cView.token).then(function(vals){
		var content = vals[0];
		if(vals.length>1){
			cView.gMe = vals[1];
			Utils.addUser(cView.gMe);
		}
		Drawer.draw(content);
		document.head.innerHTML += head;
		var nodeInitS = document.createElement("script");
		nodeInitS.innerHTML = "\ninit();\n";
		nodeInitS.innerHTML += "document.cView.gContent = " + JSON.stringify(content)+ ";\n";
		if(typeof cView.gMe !== "undefined")nodeInitS.innerHTML += "\ndocument.cView.gMe = " + JSON.stringify(cView.gMe)+ ";\n";
		nodeInitS.innerHTML += "srvDoc();";
		document.body.appendChild(nodeInitS);
		res.writeHead(200);	
		res.end(document.toString());
	},function(ret){
		res.writeHead(500);	
		res.end();
	
	});
}
function getContent(url, token){
	var arrP = new Array();
	arrP.push(new Promise(function(resolve,reject){
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(oReq.status < 400) 
				resolve(JSON.parse(oReq.response));
			else {
				//console.log(oReq.statusText);
				reject();
			}
		};
		
		oReq.open("get",url,true);
		if(token)oReq.setRequestHeader("X-Authentication-Token", token);
		oReq.send();
	}));

	if(token) arrP.push(new Promise(function(resolve,reject){
		var oReq = new XMLHttpRequest();
		oReq.open("get", gConfig.serverURL +"users/whoami", true);
		oReq.setRequestHeader("X-Authentication-Token", token);
		oReq.onload = function(){
			if(oReq.status < 400) 
				resolve(JSON.parse(oReq.response));
			else {
				//console.log(oReq.statusText);
				reject();
			}
		}
		oReq.send();
	}));
	return Promise.all(arrP);
}
