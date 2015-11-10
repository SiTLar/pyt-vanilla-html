var Utils = require("./utils.js");
var Document = require("./dom_document.js")
var Actions = require("./actions_srv.js");
var fs = require("fs");
var util = require('util');
var url = require("url");
var XMLHttpRequest =  require("xhr2");
global.window = new Object();
global.gUsers = new Object();
global.gUsersQ = new Object();
gUsers.byName = new Object();
global.gNodes = new Object();
global.gMe = undefined;//new Object();
global.gComments = new Object();
global.gAttachments  = new Object();
global.gFeeds = new Object();
global.autolinker = new Object();
global.gRt = new Object();
var gPrivTimeline = {"done":0,"postsById":{},"oraphed":{count:0},"noKey":{},"noDecipher":{},nCmts:0,"posts":[] };
eval(fs.readFileSync('templates.json')+'');
eval(fs.readFileSync('config.json')+'');
var head = fs.readFileSync('head.template');
genNodes(templates.nodes).forEach( function(node){ gNodes[node.className] = node; });
module.exports = function(req,res){
	var document = new Document();
	window.localStorage ={
		setItem: function(){return;}
		,getItem: function(){return null;}
		,removeItem: function(){return null;}
	};
	window.sessionStorage = window.localStorage;
	window.setTimeout = function(){};
	global.gConfig = gConfig;
	//initDoc(req)
	new Promise(function(resolve,reject){resolve([JSON.parse(fs.readFileSync("data.json"))]);})
	.then(function(vals){
		require.ensure(["./draw"], function(require){
			var Drawer = require("./draw");
			var content = vals[0];
			if(vals.length>1){
				gMe = vals[1];
				Utils["addUser"](gMe);
			}
			Drawer.init(document, gNodes);
			Drawer.draw(content);
			document.head.innerHTML += head;
			var nodeInitS = document.createElement("script");
			nodeInitS.innerHTML = "var gContent = " + JSON.stringify(content);
			if(typeof gMe !== "undefined")nodeInitS.innerHTML += "\ngMe = " + JSON.stringify(gMe);
			nodeInitS.innerHTML += "\nicecreamInit()";
			document.body.appendChild(nodeInitS);
		/*
			res.writeHead(200);	
			res.write(document.toString());
			res.end();
			fs.writeFileSync('docdump.js', util.inspect(document, { showHidden: true, depth: 12, colors: false }));
		*/	
			fs.writeFileSync("out.html", document.toString());
			gMe = undefined;
			gConfig.token = null;
		});
	},function(ret){
		res.writeHead(500);	
		res.end();
		gConfig.token = null;
	
	});
}
function initDoc(req){
	var token = null;
	var urlReq = url.parse(req.url, true);	
	var locationPath = (urlReq.pathname).slice(gConfig.front.length);
	var locationSearch = urlReq.search;
	if (locationPath == "")locationPath = "home";
	if (locationSearch == "")locationSearch = "?offset=0";
	gConfig.cSkip = locationSearch.split("&")[0].split("=")[1]*1;
	var arrLocationPath = locationPath.split("/");
	gConfig.timeline = arrLocationPath[0];
	if(req.headers.cookie) req.headers.cookie.split(";").some(function(c){
		var cookie = c.split("=");
		if(cookie[0].trim() == gConfig.tokenPrefix + "authToken" ){
			token = decodeURIComponent(cookie[1]);
			return true;
		}
	});
	gConfig.token = token;
	/*
	switch(gConfig.timeline){
	case "home":
	case "filter":
		if(!token) return;
		break;
	default:
		if(!token) gMe = undefined;
	}
	*/

	if(arrLocationPath.length > 1){
		if (locationPath == "filter/discussions") {
			gConfig.timeline = locationPath;
			gConfig.xhrurl = gConfig.serverURL + "timelines/filter/discussions";
		} else	if (locationPath == "filter/direct") {
			gConfig.timeline = locationPath;
			gConfig.xhrurl = gConfig.serverURL + "timelines/filter/directs";
		}else{
			gConfig.xhrurl = gConfig.serverURL +"posts/"+arrLocationPath[1];
			locationSearch = "?maxComments=all";
		}
	} else gConfig.xhrurl = gConfig.serverURL + "timelines/"+locationPath;
	return getContent(gConfig.xhrurl+locationSearch, token);
}
function genNodes(templates){
	var document = new Document();
	var nodes = new Array();
	//oTemplates = JSON.parse(templates);
	templates.forEach(function(template){
		if (!template.t)template.t = "div";
		var node = document.createElement(template.t); 
		node.cloneAll = function(){
			var newNode = this.cloneNode(true); 
			genCNodes(newNode, this);
			return newNode;
		};
		if(template.c)node.className = template.c; 
		if(template.children)
		genNodes(template.children).forEach(function(victim){
			node.appendChild(victim);
		});
		if(template.txt) node.innerHTML = template.txt;
		if(template.e) node.e = template.e;
		if(template.p) for( var p in template.p) node[p] =  template.p[p];
		nodes.push(node);
	} );
	return nodes;

	function genCNodes(node, proto){
		node.cNodes = new Object(); 
		for(var idx = 0; idx <  node.childNodes.length; idx++){
			genCNodes(node.childNodes[idx], proto.childNodes[idx]);
			node.cNodes[node.childNodes[idx].className] = node.childNodes[idx];
		}
		if (typeof(proto.e) !== "undefined" ) 
			for(var action in proto.e)
				node.addEventListener(action, Actions[proto.e[action]]);	
	}
}
function getContent(url, token){
	var arrP = new Array();
	arrP.push(new Promise(function(resolve,reject){
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(oReq.status < 400) 
				resolve(JSON.parse(oReq.response));
			else {
				console.log(oReq.statusText);
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
				console.log(oReq.statusText);
				reject();
			}
		}
		oReq.send();
	}));

	//console.log(util.inspect(arrP[0], { showHidden: true, depth: null }));
	return Promise.all(arrP);
}
