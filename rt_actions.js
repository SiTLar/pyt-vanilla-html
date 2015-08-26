"use strict";
var RtHandler = function (){};
RtHandler.prototype = {
	constructor: RtHandler
	,unshiftPost: function(data){
		data.subscribers.forEach(addUser);
		if(data.attachments)data.attachments.forEach(function(attachment){ gAttachments[attachment.id] = attachment; });
		if(data.comments)data.comments.forEach(function(comment){ gComments[comment.id] = comment; });
		if(data.users)data.users.forEach(addUser);
		document.posts.insertBefore(genPost(data.posts),document.posts.firstChild);
		this.regenHids();
	}
	,bumpPost: function(nodePost){
		if(nodePost.cNodes["post-body"].isBeenCommented)
			nodePost.cNodes["post-body"].bumpLater = true;
		else {
			var nodeParent = nodePost.parentNode;
			nodeParent.removeChild(nodePost);
			nodeParent.insertBefore(nodePost,nodeParent.firstChild);
			this.regenHids();
		}
	}
	,injectPost: function(id){
		var oReq = new XMLHttpRequest();
		oReq.onload = function (){
			if(oReq.status < 400){
				 that.unshiftPost(JSON.parse(oReq.response));
			}
		}
		oReq.open("get",gConfig.serverURL+"posts/"+id, true);
		oReq.send();	
	}
	,handlers: [
	{"comment:new":
	 function(data){
	 	var that = this;
	 	if (gMe && Array.isArray(gMe.users.banIds)
			&& (gMe.users.banIds.indexOf(datacomments.createdBy) > -1))
			return;
		var nodePost = document.getElementById(data.comments.postId);
		if(nodePost){
			gComments[data.comments.id] = data.comments; 
			nodePost.cNodes["post-body"].cNodes["comments"].appendChild(genComment(data.comments));
			that.bumpPost(nodePost);
		}else injectPost(data.comments.postId);
	}}
	,{"comment:update":
	function(data){
		gComments[data.comments.id] = data.comments; 
		var nodeComment = document.getElementById(data.comments.id);
		if (nodeComment) nodeComment.cNodes["comment-body"] = data.comments.body;
	}}
	,{"comment:destroy":
	function(data){
		var nodeComment = document.getElementById(data.comments.id);
		if(!nodeComment)return;
		nodeComment.parentNode.removeChild(nodeComment);
		if(typeof gComments[data.comments.id] !== "undefined")delete gComments[data.comments.id];
		var nodePost  = document.getElementById(data.comments.postId);
		if((typeof nodePost.rawData.comments !== "undefined")
			&&(nodePost.rawData.comments.indexOf(data.comments.id))
			nodePost.rawData.comments.splice(nodePost.rawData.comments.indexOf(data.comments.id),1);
	}}
	,{"like:new":"newLike"}
		,{"like:remove":"removeLike"}
	,{"post:new" :
	 function(data){
	 	var that = this;
		if(gConfig.skip)return;
		if(document.getElementById(data.posts.id)) return;
		that.unshiftPost(data);
	}}
	, {"post:update" :
	 function(data){
		var nodePost = document.getElementById(data.posts.id);
		if(!nodePost) return;
		nodePost.cNodes["post-body"].cNodes["post-cont"] = autolinker.link(data.posts.body.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
		nodePost.rawData.body = data.posts.body;
	}}
	, {"post:destroy" :
	 function(data){
		var nodePost = document.getElementById(data.posts.id);
		if(!nodePost) return;
		nodePost.parentNode.removeChild(nodePost);
	}}
	, {"post:hide" :
	 function(data){
		var nodePost = document.getElementById(data.posts.id);
		if(!nodePost) return;
		doHide(nodePost, true);
	}}
	, {"post:unhide" :
	 function(data){
		var nodePost = document.getElementById(data.posts.id);
		if(nodePost) {
			doHide(nodePost, false);
			return;
		}
		document.hiddenEnries.forEach(function (item){
			if (item && (item.id == data.posts.id))	nodePost = genPost(item);
		})
	}}
	]	
}
