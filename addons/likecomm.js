"use strict";
define("./addons/likecomm",["../utils"],function(utils){
var cView;
var srvUrl = "https://davidmz.me/frfrfr/likecomm/";
//var domain = "FreeFeed";
var auth = false;
var nodesT = new Object();
var template = [
{"c":"settings"
, "el":[
	{"t":"h1", "txt":"&#22909; Like comments"}
	,{"t":"label"
	,"el":[
		{"t":"input" ,"p":{"type":"checkbox","name":"auth", "value":"addons-likecomm-auth"}, "e":{"click":["Actions","setChkboxOption"]} }
		,{"t":"span", "txt":"Authenticate with my token to be able to send likes."}
	]}
	,{"c":"warning", "t":"p", "txt":"Your token will be sent to a third party server &mdash; "+srvUrl }
]}
,{"c":"control", "cl":["inline-control"]
,"el":[
	{"c":"spacer","t":"span","txt":"&mdash;", "p":{"hidden":true}}
	,{"c":"display","t":"span" }
	,{"c":"action", "t":"a", "cl":["like-comm-action"], "e":{"click":["addons-like-comm","action"]}}
]}
,{"c":"display", "cl":["like-comm"], "t":"a", "e":{"click":["addons-like-comm","show"]}}
];
var handlers = {
	"action":function(e){
		var id = e.target.getNode(["p","comment"]).rawId;
		var action = e.target.action;
		var post = e.target.getNode(["p","post"]).rawData;
		var domain = e.target.getNode(["p","comment"]).domain;
		var context = cView.contexts[domain];
		switch(context.api.name){
		case "FreeFeed":
			utils.xhr({
				"url":srvUrl + (action?"like":"unlike")
					+ "?comm_id=" + id + "&post_id=" + post.id
				,"method":"post"
				,"token":context.token
			}).then(function(res){
				res = JSON.parse(res);
				if(res.status == "error") return;
				e.target.action = !action;
				e.target.innerHTML = (!action?"like":"un-like");
			});
			break;
		case "Mokum":
			utils.xhr({
				"url":[gConfig.domains[domain].server.serverApiURL + "posts"  
					, context.gUsers[post.createdBy].username 
					, post.id
					, "clike"
					, id+".json"
				].join("/")
				,"method": action?"post":"DELETE"
				,"headers":{
					"X-API-Token":context.token
					,"Accept": "application/json"
					,"Content-Type": "application/json"
				}
			}).then(function(res){
				e.target.action = !action;
				e.target.innerHTML = (!action?"like":"un-like");
			});
			break;
		}
	}
	,"show":function(e){
		var id = e.target.getNode(["p","comment"]).rawId;
		var domain = e.target.getNode(["p","comment"]).domain;
		var context = cView.contexts[domain];
		switch(context.api.name){
		case "FreeFeed":
			utils.xhr({
				"url":srvUrl + "likes" + "?comm_id=" + id
				,"token":context.token
			}).then(function(res){
				res = JSON.parse(res);
				if(res.status == "error") return;
				display(res.data);
			});
			break;
		case "Mokum":
			var clikes = context.gComments[id].clikes;
			if(Array.isArray(clikes))
				display(clikes.map(function(id){return context.gUsers[id].username;}));
			break;
		}
		return;
		function display(data){
			var popup = cView.gNodes["user-popup"].cloneAll();
			popup.style.top =  e.target.offsetTop;
			popup.style.left = e.target.offsetLeft;
			popup.cNodes["up-info"].innerHTML = "<b>Liked by:</b>";
			if (!data.length)popup.cNodes["up-info"].innerHTML = "No info";
			data.forEach(function(uname){
				var div = cView.doc.createElement("div");
				var link = cView.doc.createElement("a");
				link.innerHTML = "@" + uname;
				link.href = gConfig.front + "as/"+domain+"/"+uname; 
				div.appendChild(link);
				popup.cNodes["up-info"].appendChild(div);
			});
			e.target.parentNode.appendChild(popup);
			cView.Utils.fixPopupPos(popup);
		};
	}
	,"evtUpdNode":function (e){
		var node = e.detail;
		if(!node||(node.classList[0] !== "comment"))
			return;
		var payload = new Object();
		payload[node.domain] = [node];
		loadLikes(payload);	
	}
	,"evtNewNode":function (e){
		var arrNodes = e.detail;
		if(!arrNodes)return;
		arrNodes = Array.isArray(arrNodes)?arrNodes:[arrNodes];
		var cmts = new Object();
		arrNodes.forEach(function(node){
			switch(node.classList[0]){
			case "post":
				domain = node.rawData.domain;
				if(!Array.isArray(cmts[domain]))cmts[domain] = new Array();
				var comments = node.getElementsByClassName("comment");
				for (var idx = 0; idx < comments.length; idx++ )
					if(typeof comments[idx].rawId !== "undefined")
						cmts[domain].push( comments[idx]);
				break;
			case "comment":
				domain = node.domain;
				if(!Array.isArray(cmts[domain]))cmts[domain] = new Array();
				cmts[domain].push(node);
				break;
			}
		});
		loadLikes(cmts);
	}
	,"evtCLikeMokum" :function(e){
		apply(e.detail.info,e.detail.node);
	}

}
function setControls(node){
	var context = cView.contexts[node.domain];
	var nodeControl = nodesT["control"].cloneAll();
	node.cNodes["comment-body"].appendChild(nodeControl );
	node.cNodes["comment-body"].cNodes["like-comm"] = nodeControl;
	if(auth || ((context.api.name == "Mokum" )&&context.gMe) ){ 
		nodeControl.cNodes["spacer"].hidden = false;
		nodeControl.cNodes["action"].action = true;
		nodeControl.cNodes["action"].innerHTML =  "&#22909;";
	}
	return nodeControl;

}
function apply (likeInfo, node){
	var context = cView.contexts[node.domain];
	var authLocal = auth || ((context.api.name == "Mokum" )&&context.gMe);
	var nodeControl = node.getNode( ["c","comment-body"] ,["c","like-comm"]);
	if (!nodeControl) nodeControl= setControls(node);
	var nodeLike = cView.doc.createElement("span"); 
	if(likeInfo.likes){
		var nodeLike = nodesT["display"].cloneAll();
		nodeLike.innerHTML = likeInfo.likes;
			
		if(authLocal){ 
			nodeControl.cNodes["spacer"].hidden = false;
			nodeControl.cNodes["action"].action = (likeInfo.my_likes == "0");
			nodeControl.cNodes["action"].innerHTML =  (likeInfo.my_likes == "0"?"like":"un-like");
		}
	}else if(authLocal){ 
		nodeControl.cNodes["spacer"].hidden = false;
		nodeControl.cNodes["action"].action = false;
		nodeControl.cNodes["action"].innerHTML = "&#22909;";
	}
	cView.Utils.setChild( 
		nodeControl
		,"display"
		,nodeLike
	);
};
function initLikes(){
	cView.Common.genNodes(template).forEach(function(node){
		nodesT[node.classList[0]] = node;
	});
	cView["addons-like-comm"] = handlers;
	auth = JSON.parse(cView.localStorage.getItem("addons-likecomm-auth"));
	/*
	if(typeof cView.contexts[domain] === "undefined") return;
	var genCmt = cView.Drawer.genComment;
	cView.Drawer.genComment = function(comment){
		var nodeComment = genCmt.call(this, comment);
		if (this.domain == domain) setControls(nodeComment);
		return nodeComment;
	}
	var arrCmts = Object.keys(cView.contexts[domain].gComments);
	if (!arrCmts.length) return;
	arrCmts.forEach(function(id){
		node = cView.doc.getElementById(domain+"-cmt-"+id);
		if(node)setControls( node);
	});
	*/
	if (!cView.contexts["FreeFeed"].gMe) auth = false;
	var cmts = new Object();
	var nodesCmt = cView.doc.getElementsByClassName("comment");
	for(var idx = 0; idx < nodesCmt.length; idx++){
		if( nodesCmt[idx].classList.contains("comments-load") )
			continue;
		domain = nodesCmt[idx].domain;
		if(!Array.isArray(cmts[domain]))cmts[domain] = new Array();
		cmts[domain].push(nodesCmt[idx]);
	}
	loadLikes(cmts);

}
function loadLikes(cmts) {
	var likeApi = {
		"FreeFeed":function (context, arrCmts){
			do{
				var options = {
					"url":srvUrl + "all-likes?updated_after=0"
					,"data":JSON.stringify(arrCmts.splice(0,100))
					,"method":"post"
				};
				if(auth) options.token = context.token;
				utils.xhr(options).then(function(res){
					res = JSON.parse(res);
					if(res.status != "error") res.data.forEach(function(likeInfo){
						var commentId = context.domain + "-cmt-" + likeInfo.id;
						var nodeCmt = document.getElementById(commentId);
						if(nodeCmt)apply(likeInfo, nodeCmt);
					});
				});
			}while(arrCmts.length);
		}
		,"Mokum": function (context, arrCmts){
			arrCmts.forEach(function(id){
				var commentId = context.domain + "-cmt-" + id;
				var cmt = context.gComments[id]; 
				var nodeCmt = document.getElementById(commentId);
				var cmtCount = ( typeof cmt.clikes_count !== "undefined" ) ?
					cmt.clikes_count : (Array.isArray(cmt.clikes)?cmt.clikes.length:0);
				if(nodeCmt && cmtCount){
					apply({ "id":id
							,"likes":cmtCount
							,"my_likes":( 
								(typeof cmt.user_liked !== "undefined")
								&& cmt.user_liked ?"1":"0"
							)
						}
						,nodeCmt
					);
				}
			});
		}
	}
	Object.keys(cmts).forEach(function(domain){
		var context = cView.contexts[domain];
		if(typeof context === "undefined") {
			console.log("Something went wrong. Unknown domain:", domain);
			return;
		}
		likeApi[context.api.name](context, cmts[domain].map(function(node){
			setControls(node);
			return node.rawId;
		}));
	});
}
function connect(token){
	if (token) token = JSON.parse(token).data;
	cView["like-comm-ws"] = new WebSocket(srvUrl.replace("https","wss")
		+ "watch" + (token?"?auth="+token:"")
	);
	cView["like-comm-ws"].onopen = function(){
		cView["like-comm-ws"].onmessage = function(e){
			var data = JSON.parse(e.data);
			var context = cView.contexts["FreeFeed"];
			if(!context ||!data) return;
			var commentId = context.domain + "-cmt-" + data.id;
			var cmt = context.gComments[data.id]; 
			var nodeCmt = document.getElementById(commentId);
			if (nodeCmt)apply(data, nodeCmt);
		};
	};
}
function makeSettings(){
	var node = nodesT["settings"].cloneAll();
	cView.Utils.getInputsByName(node)["auth"].checked = JSON.parse(cView.localStorage.getItem("addons-likecomm-auth"));
	return node;
}
return function(cV){
	return {
		"run": function (){
			cView = cV;
			initLikes();

			if(auth) {
				utils.xhr({
					"url": srvUrl + "auth"
					,"method":"post"
					,"token":cView.contexts["FreeFeed"].token
				}).then(connect);
			}else connect(null);
			window.addEventListener("newNode",cView["addons-like-comm"].evtNewNode); 
			window.addEventListener("evtCLikeMokum",cView["addons-like-comm"].evtCLikeMokum); 
			return cView.Utils._Promise.resolve();
		}
		,"settings": function(){return makeSettings(cView);}
	}
};
});
