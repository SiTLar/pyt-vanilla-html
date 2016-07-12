define("./addons/likecomm",["../utils"],function(utils){
var cView;
var template = [{"children":[
	{"t":"h1", "txt":"&#22909; Like commetns"}
	,{"t":"label"
	,"children":[
		{"t":"input" ,"p":{"type":"checkbox", "value":"blockPosts"}, "e":{"click":["addons-like-comm","token"]} }
		,{"t":"span", "txt":"Authenticate with my token to be able to send likes."}
	]}
	,{"c":"warning", "t":"p", "txt":"Your token will be sent to a third party server &mdash; https://davidmz.me/frfrfr/likecomm/" }
]}
];
var handlers = {
	"token":function(e){
	}
}
function apply (likeInfo){
	var id = likeInfo.id;
	var node = cView.doc.getElementById("FreeFeed-cmt-"+id);
	if(likeInfo.likes){
		var span = cView.doc.createElement("span");
		span.className = "like-comm";
		span.innerHTML = likeInfo.likes;
		node.cNodes["comment-body"].appendChild(span);
	}

};
function initLikes(){
	var arrCmts = Object.keys(cView.contexts["FreeFeed"].gComments);
	if (!arrCmts.length) return;
	loadLikes(arrCmts);

}
function loadLikes(arrCmts){
	utils.xhr({
		"url":"https://davidmz.me/frfrfr/likecomm/all-likes?updated_after=0"
		,"data":JSON.stringify(arrCmts)
		,"method":"post"
	}).then(function(res){
		res = JSON.parse(res);
		if(res.status != "error") res.data.forEach(apply);
	});
}
function makeSettings(){
	cView["addons-like-comm"] = handlers;
	return cView.Common.genNodes(template)[0].cloneAll();
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
				nodes[idx].addEventListener("click", unfoldComm);
			}


		}
		,"settings": function(){return makeSettings(cView);}
	}
};
});
