"use strict";
var gPrivTimeline = {"done":0,"postsById":{},"oraphed":{count:0},"noKey":{},"noDecipher":{},nCmts:0,"posts":[] };
var matrix  = new Object();
var _Utils = require("./utils.js");
var _Drawer =  require("./draw.js");
var _Actions = require("./actions.js");
var _SecretActions = require("./secrets.js");
var RtUpdate = require("./rt_network.js");
var gTemplates = require("json!./templates.json");
/* @externs
@interface
*/
window.init = function (){
	var cView = {
		"gUsers": { "byName":{}}
		,"gUsersQ": {}
		,"gComments": {}
		,"gAttachments": {}
		,"gFeeds": {}
		,"gEmbed": {}
		,"gRt": {}
		,"gNodes": {}
		,"logins": []
		,"mainId": ""
		,"rtSub" : {}
		,"initRt": function(){
			var cView = this;
			var bump = cView.localStorage.getItem("rtbump");
			cView.gRt = new RtUpdate(cView.token, bump);
			cView.gRt.subscribe(cView.rtSub);
		}
		,get "gMe"(){
			var ids = Object.keys(this.logins);
			if(ids.length == 1)return this.logins[ids[0]].data;
			if((this.mainId == "")||(ids.length == 0))return null;
			return this.logins[this.mainId].data;
		}
		,get "ids"(){
			var ids = Object.keys(this.logins);
			if (!ids.length) return null;
			return ids;
		}
	};
	var Utils = new _Utils(cView);
	var Drawer = new _Drawer(cView);
	var Autolinker = require("./Autolinker.min");
	cView.autolinker = new Autolinker({"truncate":20,  "replaceFn":Utils.frfAutolinker } );
	cView.doc = document;
	document.cView = cView;
	cView.Utils = Utils;
	cView.Drawer = Drawer;
	cView.Actions = new _Actions(cView);
	cView.SecretActions = new _SecretActions(cView);
	cView.cTxt = null;
	Utils.genNodes(gTemplates.nodes).forEach( function(node){ cView.gNodes[node.className] = node; });
	Utils.setStorage();
	["blockPosts", "blockComments"].forEach(function(list){
		cView[list]= JSON.parse(cView.localStorage.getItem(list));
	});
	Utils.setIcon("throbber-16.gif");
}
/* @externs
@interface
*/
window.browserDoc = function(){
	var cView = document.cView;
	var Utils = cView.Utils;
	var locationPath = (document.location.origin + document.location.pathname).slice(gConfig.front.length);
	var locationSearch = document.location.search;
	if (locationPath == "")locationPath = "home";
	if (locationSearch == "")locationSearch = "?offset=0";
	cView.cSkip = JSON.parse(locationSearch.match(/offset=([0-9]*).*/)[1]);
	var arrLocationPath = locationPath.split("/");
	cView.timeline = arrLocationPath[0];
	var nameMode = cView.localStorage.getItem("screenname");
	if(nameMode){
		cView.localStorage.setItem("display_name", nameMode);
		cView.localStorage.removeItem("screenname");
	}
	setLocalSettings();
	if(["home", "filter", "settings", "requests"].some(function(a){
		return a == cView.timeline;
	})){
		if(!Utils.auth()) return;
	}else if(!Utils.auth(true)) cView.logins = [];
	if(cView.timeline == "settings"){
		cView.Drawer.drawSettings();
		return Utils.postInit();	
	}
	if(cView.timeline == "requests"){
		cView.Drawer.drawRequests();
		return Utils.postInit();	
	}
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		document.getElementById("loading-msg").innerHTML = "Building page";
		if(oReq.status < 400){
			cView.Drawer.draw(JSON.parse(this.response));
			cView.doc.body.removeChild(cView.doc.getElementById("splash"));
			Utils.postInit();	
			return;
		}
		else{
			if (oReq.status==401) {
				Utils.deleteCookie("token");
				cView.localStorage.removeItem("gMe");
				location.reload();
			}
			if(Utils.auth())
				document.getElementsByTagName("body")[0].appendChild(cView.gNodes["controls-user"].cloneAll());
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
	document.getElementById("loading-msg").innerHTML = "Loading content";
	oReq.send();
}

/* @externs
@interface
*/
window.initDoc = function(){
	init();
	browserDoc();
}

/* @externs
@interface
*/
window.srvDoc = function(){
	var cView = document.cView;
	var idx = 0;
	var aidx = 0;
	if(typeof cView.gContent !== "undefined")
		cView.Drawer.loadGlobals(cView.gContent);
	regenCNodes(document.getElementsByTagName("body")[0]);
	setLocalSettings();
	
	switch(cView.timeline){
	case "settings":
		return cView.Drawer.drawSettings();
	case "requests":
		return cView.Drawer.drawRequests();
	default:
	
	
	}

	document.posts = document.getElementById("posts");
	document.hiddenCount = 0;
	document.hiddenPosts = new Array();
	if(Array.isArray(cView.gContent.posts))
		cView.gContent.posts.forEach(function(post){ 
			document.hiddenPosts.push({"data":post, "is": post.isHidden});
			if(!post.isHidden) document.getElementById(post.id).rawData = post; 
			else document.hiddenCount++;
		});
	else if(typeof cView.gContent.posts !== "undefined") 
		document.getElementById(cView.gContent.posts.id).rawData = cView.gContent.posts; 
	setAttr(document.getElementsByClassName("avatar-h"),"userid");
	setAttr(document.getElementsByTagName("a"),"action");
	Object.keys(gEvents).forEach(function(id){
		var node = document.getElementById(id);
		var eh = gEvents[id];
		Object.keys(eh).forEach(function(evt){
			eh[evt].forEach(function(a){
				node.addEventListener(evt, cView[a[0]][a[1]])
			});
		});
	});
	if(cView.gContent.comments)cView.gContent.comments.forEach(function(cmt){
		var nodeComment = document.getElementById(cmt.id);	
		if(nodeComment ){
			nodeComment.createdAt = cmt.createdAt;
			nodeComment.userid = cmt.createdBy;
		}
	});
	var nodesDate = document.getElementsByClassName("post-date");
	for(idx = 0; idx < nodesDate.length; idx++){
		var victim = nodesDate[idx]; do victim = victim.parentNode; while(victim.className != "post");
		var aNode = nodesDate[idx].getElementsByTagName("a")[0];
		aNode.date = JSON.parse(victim.rawData.createdAt);
		window.setTimeout(cView.Drawer.updateDate, 100, aNode, cView);

	}
	var nodesUsernames = document.getElementsByClassName("username");
	var arrUsernames = new Array();
	for(idx = 0; idx < nodesUsernames.length; idx++) 
		arrUsernames.push(nodesUsernames[idx]);
	arrUsernames.forEach(function(node){
		node.parentNode.outerHTML = cView.gUsers.byName[node.innerHTML].link;
	
	});
	var urlMatch;
	if(cView.localStorage.getItem("show_link_preview") == "1"){
		var nodesPost = document.getElementsByClassName("post");
		for(idx = 0; idx < nodesPost.length; idx ++){
			if(((urlMatch = nodesPost[idx].rawData.body.match(/https?:\/\/[^\s\/$.?#].[^\s]*/i) )!= null) 
			&& (!nodesPost[idx].rawData.attachments))
			(function(url, nodePost){
				cView.gEmbed.p.then(function(oEmbedPr){
					cView.Drawer.embedPreview(oEmbedPr
						,url[0]
						,nodePost.cNodes["post-body"].cNodes["attachments"] 
					);
				});
			})(urlMatch, nodesPost[idx]);
		}
	}
	["blockPosts", "blockComments"].forEach(function(list){
		cView[list].forEach(function(user){ cView.Drawer[list](user,true); });
	});
	document.getElementsByClassName("add-sender")[0].ids = [cView.gMe.users.id];
	document.getElementsByClassName("new-post-to")[0].userid = cView.gMe.users.id;
	cView.Utils.postInit();	
}
function regenCNodes(node){
	var cView = document.cView;
	node.cNodes = new Object();
	node.getNode = function(){
		var args = cView.Utils.args2Arr.apply(this,arguments);
		args.unshift(node);
		return cView.Utils.getNode.apply(node, args);
	};
	for(var idx = 0; idx < node.childNodes.length; idx++){
		regenCNodes(node.childNodes[idx]);
		var cName = node.childNodes[idx].className; 
		if(cName != "")node.cNodes[cName] = node.childNodes[idx];
	}
}
function setAttr(nodes, name){
	for(var idx = 0; idx < nodes.length; idx++){
		var aidx = 0;
		do{
			if (nodes[idx].attributes[aidx].name == name){
				nodes[idx][name] = nodes[idx].attributes[aidx].value;
				if (nodes[idx][name] == "true") nodes[idx][name] = true;
				if (nodes[idx][name] == "false") nodes[idx][name] = false;
				break; 
			}
		}while(++aidx< nodes[idx].attributes.length);

	}
}
function setLocalSettings(){
	var cView = document.cView;
	cView.mode = cView.localStorage.getItem("display_name");
	var cssTheme = cView.localStorage.getItem("display_theme");
	if(cssTheme) document.getElementById("main-stylesheet").href = gConfig.static + cssTheme;
	 
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

		cView.gEmbed.p = new Promise(function(resolve,reject){
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

}
