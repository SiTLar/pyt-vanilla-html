"use strict";
var RtHandler = function (){};
RtHandler.prototype = {
	constructor: RtHandler
	,handlers: [
		{":"newPost"}
		,{":"updatePost"}
		,{":"destroyPost"}
		,{":"hidePost"}
		,{":"unhidePost"}
		,{"comment:new":"newComment"}
		,{"comment:update":"updateComment"}
		,{"comment:destroy":"destroyComment"}
		,{"like:new":"newLike"}
		,{"like:remove":"removeLike"}
	{"post:new" :
	 function(data){
		if(gConfig.skip)return;
		if(document.getElementById(data.posts.id)) return;
		data.subscribers.forEach(addUser);
		document.posts.insertBefore(genPost(data.posts),document.posts.firstChild);
	}}
	, {"post:update" :
	 function(data){
		var nodePost = document.getElementById(data.posts.id);
		if(!nodePost) return;
		nodePost.cNodes["post-body"].cNodes["post-cont"] = autolinker.link(data.posts.body.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
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
		if(!nodePost) return;
	}}
	]	
}
