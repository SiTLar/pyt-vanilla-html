define("./addons/likecomm",["../utils"],function(utils){
var cView;
var srvUrl = "https://davidmz.me/frfrfr/likecomm/";
var domain = "FreeFeed";
var auth = false;
var nodesT = new Object();
var template = [
{"c":"settings"
, "children":[
	{"t":"h1", "txt":"&#22909; Like comments"}
	,{"t":"label"
	,"children":[
		{"t":"input" ,"p":{"type":"checkbox","name":"auth", "value":"addons-likecomm-auth"}, "e":{"click":["Actions","setChkboxOption"]} }
		,{"t":"span", "txt":"Authenticate with my token to be able to send likes."}
	]}
	,{"c":"warning", "t":"p", "txt":"Your token will be sent to a third party server &mdash; "+srvUrl }
]}
,{"c":"control", "cl":["inline-control"]
,"children":[
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
		var postId = e.target.getNode(["p","post"]).rawData.id;
		utils.xhr({
			"url":srvUrl + (action?"like":"unlike")
				+ "?comm_id=" + id + "&post_id=" + postId
			,"method":"post"
			,"token":cView.contexts[domain].token
		}).then(function(res){
			res = JSON.parse(res);
			if(res.status == "error") return;
			e.target.action = !action;
			e.target.innerHTML = (!action?"like":"un-like");
		});
	}
	,"show":function(e){
		var id = e.target.getNode(["p","comment"]).rawId;
		utils.xhr({
			"url":srvUrl + "likes" + "?comm_id=" + id
			,"token":cView.contexts[domain].token
		}).then(function(res){
			res = JSON.parse(res);
			if(res.status == "error") return;
			var popup = cView.gNodes["user-popup"].cloneAll();
			popup.style.top =  e.target.offsetTop;
			popup.style.left = e.target.offsetLeft;
			popup.cNodes["up-info"].innerHTML = "<b>Liked by:</b>";
			res.data.forEach(function(uname){
				var div = cView.doc.createElement("div");
				var link = cView.doc.createElement("a");
				link.innerHTML = "@" + uname;
				link.href = gConfig.front + "as/"+domain+"/"+uname; 
				div.appendChild(link);
				popup.cNodes["up-info"].appendChild(div);
				e.target.parentNode.appendChild(popup);
				cView.Utils.fixPopupPos(popup);
			});
		});
	}
	,"evtNewNode":function (e){
		var arrNodes = e.detail;
		if(!arrNodes)return;
		arrNodes = Array.isArray(arrNodes)?arrNodes:[arrNodes];
		var cmts = new Array();
		arrNodes.forEach(function(node){
			switch(node.classList[0]){
			case "post":
				if (node.rawData.domain != domain)return;
				var comments = node.getElementsByClassName("comment");
				for (var idx = 0; idx < comments.length; idx++ )
					if(typeof comments[idx].rawId !== "undefined")
						cmts.push( comments[idx]);
				break;
			case "comment":
				if (node.domain != domain)return;
				cmts.push(node);
				break;
			}
		});
		if(cmts.length) loadLikes(cmts.map(function(node){return node.rawId;}));
	}

}
function setControls(node){
	var nodeControl = nodesT["control"].cloneAll();
	node.cNodes["comment-body"].appendChild(nodeControl );
	node.cNodes["comment-body"].cNodes["like-comm"] = nodeControl;
	if(auth){ 
		nodeControl.cNodes["spacer"].hidden = false;
		nodeControl.cNodes["action"].action = true;
		nodeControl.cNodes["action"].innerHTML =  "&#22909;";
	}
	return nodeControl;

}
function apply (likeInfo, node){
	var id = likeInfo.id;
	if(typeof node === "undefined")
		node = cView.doc.getElementById(domain+"-cmt-"+id);
	if(!node) return;
	var nodeControl = node.getNode( ["c","comment-body"] ,["c","like-comm"]);
	if (!nodeControl) nodeControl= setControls(node);
	var nodeLike = cView.doc.createElement("span"); 
	if(likeInfo.likes){
		var nodeLike = nodesT["display"].cloneAll();
		nodeLike.innerHTML = likeInfo.likes;
			
		if(auth){ 
			nodeControl.cNodes["spacer"].hidden = false;
			nodeControl.cNodes["action"].action = (likeInfo.my_likes == "0");
			nodeControl.cNodes["action"].innerHTML =  (likeInfo.my_likes == "0"?"like":"un-like");
		}
	}else if(auth){ 
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
	if(typeof cView.contexts[domain] === "undefined") return;
	auth = JSON.parse(cView.localStorage.getItem("addons-likecomm-auth"));
	var genCmt = cView.Drawer.genComment;
	cView.Drawer.genComment = function(comment){
		var nodeComment = genCmt.call(this, comment);
		if (this.domain == domain) setControls(nodeComment);
		return nodeComment;
	}
	if (!cView.contexts[domain].gMe) auth = false;
	var arrCmts = Object.keys(cView.contexts[domain].gComments);
	if (!arrCmts.length) return;
	arrCmts.forEach(function(id){
		node = cView.doc.getElementById(domain+"-cmt-"+id);
		if(node)setControls( node);
	});
	loadLikes(arrCmts);

}
function loadLikes(arrCmts){
	do{
		var options = {
			"url":srvUrl + "all-likes?updated_after=0"
			,"data":JSON.stringify(arrCmts.splice(0,100))
			,"method":"post"
		};
		if(auth) options.token = cView.contexts[domain].token;
		utils.xhr(options).then(function(res){
			res = JSON.parse(res);
			if(res.status != "error") res.data.forEach(function(likeInfo){apply(likeInfo);});
		});
	}while(arrCmts.length);
}
function connect(token){
	if (token) token = JSON.parse(token).data;
	cView["like-comm-ws"] = new WebSocket(srvUrl.replace("https","wss")
		+ "watch" + (token?"?auth="+token:"")
	);
	cView["like-comm-ws"].onopen = function(){
		cView["like-comm-ws"].onmessage = function(e){
			apply(JSON.parse(e.data));
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
			function addLikes(res){
				loadLikes(res.comments.map(function(cmt){
					return cmt.id;
				}));
				return res;
			}

			if(auth) {
				utils.xhr({
					"url": srvUrl + "auth"
					,"method":"post"
					,"token":cView.contexts[domain].token
				}).then(connect);
			}else connect(null);
			window.addEventListener("newNode",cView["addons-like-comm"].evtNewNode); 
			return cView.Utils._Promise.resolve();
		}
		,"settings": function(){return makeSettings(cView);}
	}
};
});
