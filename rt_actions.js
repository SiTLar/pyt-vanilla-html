"use strict";
var RtHandler = function (){};
RtHandler.prototype = {
	constructor: RtHandler
	,handlers: [
		{"post:new":"newPost"}
		,{"post:update":"updatePost"}
		,{"post:destroy":"destroyPost"}
		,{"post:hide":"hidePost"}
		,{"post:unhide":"unhidePost"}
		,{"comment:new":"newComment"}
		,{"comment:update":"updateComment"}
		,{"comment:destroy":"destroyComment"}
		,{"like:new":"newLike"}
		,{"like:remove":"removeLike"}
	]
	, newPost: function(data){
		if(gConfig.skip)return;
		if(document.getElementById(data.posts.id)) return;
		data.subscribers.forEach(addUser);
		document.posts.insertBefore(genPost(data.posts),document.posts.firstChild);
	}
	, updatePost: function(data){
		var nodePost = document.getElementById(data.posts.id);
		if(!nodePost) return;
		nodePost.cNodes["post-body"].cNodes["post-cont"] = autolinker.link(data.posts.body.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
	}
	, destroyPost: function(data){
		var nodePost = document.getElementById(data.posts.id);
		if(!nodePost) return;
		nodePost.parentNode.removeChild(nodePost);
	}
	, hidePost: function(data){
		var nodePost = document.getElementById(data.posts.id);
		if(!nodePost) return;
		doHide(nodePost, true);
	}
	, unhidePost: function(data){
		var nodePost = document.getElementById(data.posts.id);
		if(!nodePost) return;
	}
}
