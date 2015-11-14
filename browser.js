"use strict";
var gNodes = new Object();
var gPrivTimeline = {"done":0,"postsById":{},"oraphed":{count:0},"noKey":{},"noDecipher":{},nCmts:0,"posts":[] };
var matrix  = new Object();
var _Utils = require("./utils.js");
var _Drawer =  require("./draw.js");
var _Actions = require("./actions.js");
document.addEventListener("DOMContentLoaded", initDoc);

function initDoc(){
	var cView = {
		"gUsers": { "byName":{}}
		,"gUsersQ": {}
		,"gMe": {}
		,"gComments": {}
		,"gAttachments": {}
		,"gFeeds": {}
		,"gRt": {}
	};
	var Utils = new _Utils(document, cView);
	var Drawer = new _Drawer(document, cView, gNodes, Utils);
	var Actions = new _Actions(document, cView, gNodes, Utils, Drawer);
	for(var k in Utils)console.log(k);
	Utils.setStorage();
	Utils.addIcon("throbber-16.gif");
	var locationPath = (document.location.origin + document.location.pathname).slice(gConfig.front.length);
	var locationSearch = document.location.search;
	if (locationPath == "")locationPath = "home";
	if (locationSearch == "")locationSearch = "?offset=0";
	cView.cSkip = locationSearch.split("&")[0].split("=")[1]*1;
	var arrLocationPath = locationPath.split("/");
	cView.timeline = arrLocationPath[0];
	switch(cView.timeline){
	case "home":
	case "filter":
		if(!Utils.auth()) return;
		break;
	default:
		if(!Utils.auth(true)) gMe = undefined;
	}
	var nameMode = cView.localStorage.getItem("screenname");
	if(nameMode){
		cView.localStorage.setItem("display_name", nameMode);
		cView.localStorage.removeItem("screenname");
	}
	var cssTheme = cView.localStorage.getItem("display_theme");
	if(cssTheme) document.getElementById("main-sytlesheet").href = gConfig.static + cssTheme;
	 
	if(cView.localStorage.getItem("show_link_preview") == "1"){
		var nodeEmScript =  document.createElement("script");
		(function(w, d){
			var id='embedly-platform', n = 'script';
			if (!d.getElementById(id)){
				w.embedly = w.embedly || function() {(w.embedly.q = w.embedly.q || []).push(arguments);};
				var e = d.createElement(n); e.id = id; e.async=1;
				e.src = ('https:' === document.location.protocol ? 'https' : 'http') + '://cdn.embedly.com/widgets/platform.js';
				var s = d.getElementsByTagName(n)[0];
				s.parentNode.insertBefore(e, s);
			}
		})(window, document);
		embedly("defaults", {
			cards: {
				height: 200
				//width: 700
				//align: 'right',
				//chrome: 0
			}
		});

		gEmbed.p = new Promise(function(resolve,reject){
			var oReq = new XMLHttpRequest();
			oReq.onload = function(){
				if(oReq.status < 400)
					resolve(JSON.parse(oReq.response));
				else reject(oReq.response);
			}

			oReq.open("get",gConfig.static + "providers.json",true);
			oReq.send();
					
		});
	}
	Utils.genNodes(templates.nodes).forEach( function(node){ gNodes[node.className] = node; });
	if(["home", "filter", "settings", "requests"].some(function(a){
		return a == cView.timeline;
	})){
		if(!Utils.auth()) return;
	}else if(!Utils.auth(true)) gMe = undefined;
	if(cView.timeline == "settings")return Drawer.drawSettings();
	if(cView.timeline == "requests")return Drawer.drawRequests();
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		document.getElementById("loading").innerHTML = "Building page";
		if(oReq.status < 400){
			Drawer.draw(JSON.parse(this.response));
			Utils.addIcon("favicon.ico");
			return;
		}
		else{
			if (oReq.status==401) {
				Utils.deleteCookie("token");
				cView.localStorage.removeItem("gMe");
				location.reload();
			}
			if(Utils.auth())
				document.getElementsByTagName("body")[0].appendChild(gNodes["controls-user"].cloneAll());
			var nodeError = document.createElement("div");
			nodeError.className = "error-node";
			nodeError.innerHTML = "Error #"+ oReq.status + ": " + oReq.statusText;
			try{
				var res = JSON.parse(this.response);
				nodeError.innerHTML += "<br>"+res.err;
			}catch(e){};
			document.getElementsByTagName("body")[0].appendChild(nodeError);
			document.body.removeChild(document.getElementById("splash"));

		}

	};
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
	} else
		cView.xhrurl = gConfig.serverURL + "timelines/"+locationPath;

	oReq.open("get",cView.xhrurl+locationSearch,true);
	oReq.setRequestHeader("X-Authentication-Token", cView.token);
	document.getElementById("loading").innerHTML = "Loading content";
	oReq.send();
}
