define("./addons/likecomm",["../utils"],function(utils){
function apply (likeInfo){
	var cView = this;
	var id = likeInfo.id;
	var node = cView.doc.getElementById("FreeFeed-cmt-"+id);
	if(likeInfo.likes){
		var span = cView.doc.createElement("span");
		span.className = "like-comm";
		span.innerHTML = likeInfo.likes;
		node.cNodes["comment-body"].appendChild(span);
	}

};
function loadLikes(cView){
	var arrCmts = Object.keys(cView.contexts["FreeFeed"].gComments);
	if (!arrCmts.length) return;


	utils.xhr({
		"url":"https://davidmz.me/frfrfr/likecomm/all-likes?updated_after=0"
		,"data":JSON.stringify(arrCmts)
		,"method":"post"
	}).then(function(res){
		JSON.parse(res).data.forEach(apply, cView);
	});
}
return function(cView){
	loadLikes(cView);
};
	

});
