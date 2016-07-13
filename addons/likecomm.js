define("./addons/likecomm",["../utils"],function(utils){
var cView;
var srvUrl = "https://davidmz.me/frfrfr/likecomm/";
var domain = "FreeFeed";
var auth = false;
var nodes = new Object();
var template = [
{"c":"settings"
, "children":[
	{"t":"h1", "txt":"&#22909; Like commetns"}
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
	,{"c":"action", "t":"a", "e":{"click":["addons-like-comm","action"]}}
]}
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
}
function apply (likeInfo){
	var id = likeInfo.id;
	var node = cView.doc.getElementById([domain,"cmt",id].join("-"));
	if(!node) return;
		var span = cView.doc.createElement("span");
		var nodeControl = node.getNode( ["c","comment-body"] ,["c","like-comm"]);
	if(likeInfo.likes){
		span.className = "like-comm";
		span.innerHTML = likeInfo.likes;
	}	
	node.cNodes["comment-body"].appendChild(span);
	cView.Utils.setChild( 
		nodeControl
		,"display"
		,span
	);
	if(!auth) return;
	nodeControl.cNodes["spacer"].hidden = false;
	nodeControl.cNodes["action"].action = (likeInfo.my_likes == "0");
	nodeControl.cNodes["action"].innerHTML =  (likeInfo.my_likes == "0"?"like":"un-like");
};
function initLikes(){
	cView.Common.genNodes(template).forEach(function(node){
		nodes[node.classList[0]] = node;
	});
	cView["addons-like-comm"] = handlers;
	if(typeof cView.contexts[domain] === "undefined") return;
	var arrCmts = Object.keys(cView.contexts[domain].gComments);
	auth = JSON.parse(cView.localStorage.getItem("addons-likecomm-auth"));
	if (!cView.contexts[domain].gMe) auth = false;
	if (!arrCmts.length) return;
	loadLikes(arrCmts);

}
function loadLikes(arrCmts){
	arrCmts.forEach(function(id){
		var node = cView.doc.getElementById([domain,"cmt",id].join("-"));
		if(!node) return;
		var nodeControl = nodes["control"].cloneAll();
		node.cNodes["comment-body"].appendChild(nodeControl );
		node.cNodes["comment-body"].cNodes["like-comm"] = nodeControl;
		if(!auth) return;
		nodeControl.cNodes["spacer"].hidden = false;
		nodeControl.cNodes["action"].action = true;
		nodeControl.cNodes["action"].innerHTML =  "like";
	});
	var options = {
		"url":srvUrl + "all-likes?updated_after=0"
		,"data":JSON.stringify(arrCmts)
		,"method":"post"
	};
	if(auth) options.token = cView.contexts["FreeFeed"].token;
	utils.xhr(options).then(function(res){
		res = JSON.parse(res);
		if(res.status != "error") res.data.forEach(apply);
	});
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
	var node = nodes["settings"].cloneAll();
	cView.Utils.getInputsByName(node)["auth"].checked = JSON.parse(cView.localStorage.getItem("addons-likecomm-auth"));
	return node;
}
return function(cV){
	return {
		"run": function (){
			cView = cV;
			initLikes();
			var unfold = cView.Actions.unfoldComm;
			var unfoldComm = function(e){
				return unfold(e).then(function(res){
					loadLikes(res.comments.map(function(cmt){
						return cmt.id;
					}));
				});
			}
			var nodes = cView.doc.getElementsByClassName("comments-load");
			for(var idx = 0; idx < nodes.length; idx++){
				nodes[idx].removeEventListener("click", cView.Actions.unfoldComm);
				nodes[idx].addEventListener("click", unfoldComm)
			}
			if(auth) {
				utils.xhr({
					"url": srvUrl + "auth"
					,"method":"post"
					,"token":cView.contexts[domain].token
				}).then(connect);
			}else connect(null);
		}
		,"settings": function(){return makeSettings(cView);}
	}
};
});
