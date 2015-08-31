"use strict";
var RtHandler = function (bumpCooldown, bumpInterval){
	var that = this;
	if(typeof bumpCooldown !== "undefined") that.bumpCooldown = bumpCooldown;
	if(typeof bumpInterval !== "undefined") that.bumpInterval = bumpInterval;
	if(typeof gConfig.bumpIntervalId !== "undefined" ) clearInterval(gConfig.bumpIntervalId);
	if(that.bumpCooldown && that.bumpInterval ) gConfig.bumpIntervalId = setInterval(function(){gConfig.bumps.forEach(that.bump);gConfig.bumps = new Array(); }, that.bumpInterval*1000);
	
};
RtHandler.prototype = {
	constructor: RtHandler
	,bumpCooldown: 0
	,bumpInterval:60 
	,timeGrow : 1000
	,insertSmooth: function(node, nodePos){
		var that = this;
		node.style.opacity = 0;
		node.style.position = "absolute";
		nodePos.parentNode.insertBefore(node,nodePos);
		node.style.width = nodePos.parentNode.clientWidth;
		var height = node.clientHeight;
		node.style.width = "auto";
		console.log("height=" + height);
		node.style.height = 0;
		if(node.className == "post")regenHides();
		node.style.position = "static";
		node.style["transition-property"] = "height";
		node.style["transition-duration"] = that.timeGrow;
		setTimeout(function(){
			node.style.height = height;
			node.style.opacity = 1; 
			setTimeout(function(){ node.style.height = "auto"; } ,  that.timeGrow);
		}, 1);
	}
	,unshiftPost: function(data){
		var that = this;
		loadGlobals(data);
		var nodePost = genPost(data.posts);
		document.hiddenPosts.unshift({"is":nodePost.rawData.isHidden,"data":nodePost.rawData});
		that.insertSmooth(nodePost, document.posts.firstChild);
	}
	,bumpPost: function(nodePost){
		if(gConfig.skip)return;
		var that = this;
		if(nodePost.cNodes["post-body"].isBeenCommented)
			nodePost.cNodes["post-body"].bumpLater = function(){ that.bumpPost(nodePost);}
		else {
	 		var nodeParent = nodePost.parentNode;
			document.hiddenPosts.splice(nodePost.rawData.idx,1);
			document.hiddenPosts.unshift({"is":nodePost.rawData.isHidden,"data":nodePost.rawData});
			nodeParent.removeChild(nodePost);
			that.insertSmooth(nodePost, nodeParent.firstChild);
		}
	}
	,injectPost: function(id){
		var that = this;
		if(gConfig.skip)return;
		var oReq = new XMLHttpRequest();
		oReq.onload = function (){
			if(oReq.status < 400){
				 that.unshiftPost(JSON.parse(oReq.response));
			}
		}
		oReq.open("get",gConfig.serverURL+"posts/"+id, true);
		oReq.send();	
	}
	,"comment:new": function(data){
		var that = this;
		if (gMe && Array.isArray(gMe.users.banIds)
			&& (gMe.users.banIds.indexOf(data.comments.createdBy) > -1))
			return;
		var nodePost = document.getElementById(data.comments.postId);
		if(nodePost){
			gComments[data.comments.id] = data.comments; 
			nodePost.cNodes["post-body"].cNodes["comments"].appendChild(genComment(data.comments));
			if (nodePost.rawData.updatedAt + that.bumpCooldown*1000 < Date.now()){
				if(!Array.isArray(gConfig.bumps))gConfig.bumps = new Array();
				gConfig.bumps.push(nodePost);
			}
			nodePost.rawData.updatedAt = Date.now();
						
		}else that.injectPost(data.comments.postId);
	}
	,"comment:update": function(data){
		gComments[data.comments.id] = data.comments; 
		var nodeComment = document.getElementById(data.comments.id);
		if (nodeComment) nodeComment.cNodes["comment-body"].innerHTML = data.comments.body;
	}
	,"comment:destroy": function(data){
		var nodeComment = document.getElementById(data.comments.id);
		if(!nodeComment)return;
		nodeComment.parentNode.removeChild(nodeComment);
		if(typeof gComments[data.comments.id] !== "undefined")delete gComments[data.comments.id];
		var nodePost  = document.getElementById(data.comments.postId);
		if((typeof nodePost.rawData.comments !== "undefined")
			&&(nodePost.rawData.comments.indexOf(data.comments.id) > -1))
			nodePost.rawData.comments.splice(nodePost.rawData.comments.indexOf(data.comments.id),1);
	}
	,"like:new": function(data){
		var that = this;
		if (gMe && Array.isArray(gMe.users.banIds)
			&& (gMe.users.banIds.indexOf(data.users.id) > -1))
			return;
		addUser(data.users);
		var nodePost = document.getElementById(data.meta.postId);
		if(nodePost){
			if (!Array.isArray(nodePost.rawData.likes)) nodePost.rawData.likes = new Array();
			nodePost.rawData.likes.unshift(data.users.id);
			genLikes(nodePost);
			/*
			if (nodePost.rawData.updatedAt + that.bumpCooldown*1000 < Date.now()){
				if(!Array.isArray(gConfig.bumps))gConfig.bumps = new Array();
				gConfig.bumps.push(nodePost);
			}
			*/
			nodePost.rawData.updatedAt = Date.now();
		}else that.injectPost(data.meta.postId);
	}
	,"like:remove": function(data){
		var nodePost = document.getElementById(data.meta.postId);
		if(nodePost  && Array.isArray(nodePost.rawData.likes)
			&& (nodePost.rawData.likes.indexOf(data.meta.userId) > -1 )) {
			nodePost.rawData.likes.splice(nodePost.rawData.likes.indexOf(data.meta.userId), 1) ;
			genLikes(nodePost);
		}

	}
	,"post:new" : function(data){
		var that = this;
		if(gConfig.skip)return;
		if(document.getElementById(data.posts.id)) return;
		that.unshiftPost(data);
	}
	, "post:update" : function(data){
		var nodePost = document.getElementById(data.posts.id);
		if(!nodePost) return;
		nodePost.cNodes["post-body"].cNodes["post-cont"].innerHTML = autolinker.link(data.posts.body.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
		nodePost.rawData.body = data.posts.body;
	}
	, "post:destroy" : function(data){
		var nodePost = document.getElementById(data.meta.postId);
		if(!nodePost) return;
		nodePost.parentNode.removeChild(nodePost);
	}
	, "post:hide" : function(data){
		var nodePost = document.getElementById(data.meta.postId);
		if(!nodePost) return;
		doHide(nodePost, true);
	}
	, "post:unhide" : function(data){
		var nodePost = document.getElementById(data.meta.postId);
		if(!nodePost) 
			document.hiddenPosts.forEach(function (item){
				if (item.is && (item.data.id == data.meta.postId))nodePost = genPost(item.data);
			});
		if (nodePost) doHide(nodePost, false);
	}
}
