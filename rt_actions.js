"use strict";
define("RtHandler", [], function(){
var RtHandler = function (bump){
	var that = this;
	var cView = document.cView;
	var rtParams = cView.localStorage.getItem("rt_params"); 
	if(typeof bump !== "undefined") that.bump = bump;
	if( rtParams ){
		var oRTparams = JSON.parse(rtParams);
		that.bumpCooldown = oRTparams["rt-bump-cd"]*60000;
		that.bumpInterval = oRTparams["rt-bump-int"]*60000;
		that.bumpDelay = oRTparams["rt-bump-d"]*60000;
	}
	if(typeof cView.bumpIntervalId !== "undefined" ) clearInterval(cView.bumpIntervalId);
	if(that.bump) cView.bumpIntervalId = setInterval(function(){that.chkBumps();}, that.bumpInterval);
	
};
RtHandler.prototype = {
	constructor: RtHandler
	,bumpCooldown: 1200000
	,bumpInterval: 60000 
	,bumpDelay: 0 
	,timeGrow: 1000
	,bump: 0
	,insertSmooth: function(node, nodePos){
		var that = this;
		var cView = document.cView;
		node.style.opacity = 0;
		node.style.position = "absolute";
		var victim = document.getElementById(node.id);
		if(!nodePos)document.posts.appendChild(node);
		else nodePos.parentNode.insertBefore(node,nodePos);
		if(victim) victim.parentNode.removeChild(victim);
		node.style.width = node.parentNode.clientWidth;
		var height = node.clientHeight;
		node.style.width = "auto";
		node.style.height = 0;
		node.style.overflow = "hidden";
		if(["metapost", "post"].indexOf(node.className) != -1)
			cView.Drawer.regenHides();
		node.style.position = "static";
		node.style["transition-property"] = "height";
		node.style["transition-duration"] = that.timeGrow;
		cView.Drawer.applyReadMore(node);
		setTimeout(function(){
			node.style.height = height;
			node.style.opacity = 1; 
			setTimeout(function(){ 
				node.style.height = "auto";
				node.style.overflow = "unset"; 
			} ,  that.timeGrow);
		}, 1);
	}
	,setBumpCooldown: function(cooldown){
		var that = this;
		var cView = document.cView;
		that.bumpCooldown = cooldown;
		clearInterval(cView.bumpIntervalId);
		if(that.bumpCooldown && that.bumpInterval ) cView.bumpIntervalId = setInterval(function(){that.chkBumps}, that.bumpInterval);
	}
	,chkBumps: function(){
		var that = this;
		var cView = document.cView;
		if(!Array.isArray(cView.bumps))cView.bumps = new Array();
		cView.bumps.forEach(that.bumpPost, that);
		cView.bumps = new Array();
	}
	,unshiftPost: function(data, context){
		var that = this;
		var cView = document.cView;
		if(cView.skip)return;
		if (context.gMe && Array.isArray(context.gMe.users.banIds)
			&& (context.gMe.users.banIds.indexOf(data.posts.createdBy) > -1))
			return;
		cView.Common.loadGlobals(data, context);
		data.posts.domain = context.domain;
		var nodePost = cView.Drawer.genPost(data.posts);
		nodePost.rawData.sign = cView.hasher.of(nodePost.rawData.body);
		if ((nodePost.rawData.body.length >= cView.minBody) && cView.hiddenPosts.some(function(a){
			if(cView.hasher.similarity(a.data.sign, nodePost.rawData.sign)>cView.threshold){
				if(a.data.type  != "metapost"){
					a.data = cView.Common.metapost([a.data]);
				
					var oldNode = document.getElementById([
						a.data.dups[0].domain
						,"post"
						,a.data.dups[0].id
					].join("-")); 
				}else var oldNode = document.getElementById([
					a.data.dups[0].domain
					,"post"
					,a.data.dups[0].id
				].join("-")).parentNode; 

				a.data.dups.push(nodePost.rawData);
				if(a.is)return nodePost.isHidden = true;
				var host = oldNode.parentNode;
				var dummy = document.createElement("div");
				var newNode = nodePost;
				host.insertBefore(dummy, oldNode);
				nodePost = cView.Drawer.makeMetapost( a.data.dups.map(function(post){
					var node = document.getElementById(
						[post.domain, "post", post.id].join("-")
					);
					return node; 
				}).filter(function(node){return node;}).concat(nodePost));
				host.replaceChild(nodePost, dummy);
				cView.Common.markMetaMenu(newNode);
				return true;
			}else return false;
		})){
			if(!nodePost.isHidden)this.bumpPost(nodePost);
		} else {
			cView.hiddenPosts.unshift({
				"is":nodePost.rawData.isHidden
				,"data":nodePost.rawData
			});
			if (!nodePost.rawData.isHidden)that.insertSmooth(nodePost, document.posts.firstChild);
		}
		var evt = new CustomEvent("newNode", {"detail":nodePost});
		window.dispatchEvent(evt);

	}

	,bumpPost: function(nodePost){
		var cView = document.cView;
		if(cView.skip)return;
		var that = this;
		if(nodePost.rtCtrl.isBeenCommented)
			nodePost.rtCtrl.bumpLater = function(){ that.bumpPost(nodePost);}
		else {
	 		var nodeParent = nodePost.parentNode;
			if(nodeParent.className == "metapost"){
				nodePost = nodeParent;
				nodeParent = nodePost.parentNode;
			}
			var postInfo = cView.hiddenPosts.splice(nodePost.rawData.idx,1);
			cView.hiddenPosts.unshift(postInfo[0]);
			nodeParent.removeChild(nodePost);
			that.insertSmooth(nodePost, nodeParent.firstChild);
		}
	}
	,injectPost: function(id, context){
		var that = this;
		var cView = document.cView;
		if(cView.skip)return;
		context.api.getPost(context.token, "posts/" + id /*, ["comments"]*/).then(function(data){
			that.unshiftPost(data,context);
		});
	}
	,"comment:new": function(data, context){
		var that = this;
		var cView = document.cView;
		if (context.gMe && Array.isArray(context.gMe.users.banIds)
			&& (context.gMe.users.banIds.indexOf(data.comments.createdBy) > -1))
			return;
		var commentId = [context.domain,"cmt" ,data.comments.id].join("-");
		var postId = [context.domain,"post" ,data.comments.postId].join("-");
		var nodePost = document.getElementById(postId);
		data.users.forEach(cView.Common.addUser,context);
		if(nodePost){
			context.gComments[data.comments.id] = data.comments; 
			if(!Array.isArray( nodePost.rawData.comments))
				nodePost.rawData.comments = new Array();
			nodePost.rawData.comments.push(data.comments.id);
			if(!document.getElementById(commentId)){
				var nodeComment = nodePost.cNodes["post-body"].cNodes["comments"].appendChild(
					cView.Drawer.genComment.call(context, data.comments)
				);
				cView.Drawer.applyReadMore(nodeComment);
			}
			if (that.bump && ( (nodePost.rawData.updatedAt*1 + that.bumpCooldown) < Date.now())){
				if(!Array.isArray(cView.bumps))cView.bumps = new Array();
				setTimeout(function(){ cView.bumps.push(nodePost)},that.bumpDelay+1);
			}
			nodePost.rawData.updatedAt = Date.now();
			cView.Common.markMetaMenu(nodePost);
			var evt = new CustomEvent("newNode", {"detail":nodeComment});
			window.dispatchEvent(evt);
		}else that.injectPost(data.comments.postId, context);
	}
	,"comment:update": function(data, context){
		var cView = document.cView;
		var commentId = [context.domain,"cmt" ,data.comments.id].join("-");
		var postId = [context.domain,"post" ,data.comments.postId].join("-");
		context.gComments[data.comments.id] = data.comments; 
		var nodeComment = document.getElementById(commentId);
		if (nodeComment){
			var newComment = cView.Drawer.genComment.call(context, data.comments);
			nodeComment.parentNode.replaceChild( newComment , nodeComment);
			cView.Drawer.applyReadMore( newComment );
			cView.Common.markMetaMenu(document.getElementById(postId));
		}
	}
	,"comment:destroy": function(data, context){
		var cView = document.cView;
		if(typeof context.gComments[data.commentId] !== "undefined")delete context.gComments[data.commentId];
		var postId = [context.domain,"post" ,data.postId].join("-");
		var commentId = [context.domain,"cmt" ,data.commentId].join("-");
		var nodePost  = document.getElementById(postId);
		if(!nodePost)return;
		if((typeof nodePost.rawData.comments !== "undefined")
			&&(nodePost.rawData.comments.indexOf(commentId) > -1))
			nodePost.rawData.comments.splice(nodePost.rawData.comments.indexOf(commentId),1);
		var nodeComment = document.getElementById(commentId);
		if(!nodeComment)return;
		nodeComment.parentNode.removeChild(nodeComment);
		cView.Common.markMetaMenu(nodePost);
	}
	,"like:new": function(data, context){
		var that = this;
		var cView = document.cView;
		if (context.gMe && Array.isArray(context.gMe.users.banIds)
			&& (context.gMe.users.banIds.indexOf(data.users.id) > -1))
			return;
		cView.Common.addUser.call(context, data.users);
		var postId = [context.domain,"post" ,data.meta.postId].join("-");
		var nodePost = document.getElementById(postId);
		if(nodePost){
			if (!Array.isArray(nodePost.rawData.likes)) nodePost.rawData.likes = new Array();
			if (nodePost.rawData.likes.indexOf(data.users.id) > -1) return;
			nodePost.rawData.likes.unshift(data.users.id);
			cView.Drawer.genLikes(nodePost);
			nodePost.rawData.updatedAt = Date.now();
			cView.Common.markMetaMenu(nodePost);
		}else that.injectPost(data.meta.postId, context);
	}
	,"like:remove": function(data, context){
		var cView = document.cView;
		var postId = [context.domain,"post" ,data.meta.postId].join("-");
		var nodePost = document.getElementById(postId);
		if(nodePost  && Array.isArray(nodePost.rawData.likes)
			&& (nodePost.rawData.likes.indexOf(data.meta.userId) > -1 )) {
			nodePost.rawData.likes.splice(nodePost.rawData.likes.indexOf(data.meta.userId), 1) ;
			cView.Drawer.genLikes(nodePost);
			nodePost.cNodes["post-body"].cNodes["post-info"].nodeLike.innerHTML = "Like";
			nodePost.cNodes["post-body"].cNodes["post-info"].nodeLike.action = true ;
			cView.Common.markMetaMenu(nodePost);
		}

	}
	,"post:new" : function(data, context){
		var that = this;
		var cView = document.cView;
		if(cView.skip)return;
		var postId = [context.domain,"post" ,data.posts.id].join("-");
		if(document.getElementById(postId)) return;
		that.unshiftPost(data, context);
	}
	, "post:update" : function(data, context){
		var cView = document.cView;
		var postId = [context.domain,"post" ,data.posts.id].join("-");
		var nodePost = document.getElementById(postId);
		if(!nodePost) return;

		var nodeCont = nodePost.getNode(["c","post-body"],["c","post-cont"]);
		nodeCont.words = context.digestText(data.posts.body);
		nodeCont.innerHTML = "";
		cView.Drawer.applyReadMore( nodePost);
		nodePost.rawData.body = data.posts.body;
		cView.Common.markMetaMenu(nodePost);
	}
	, "post:destroy" : function(data, context){
		var postId = [context.domain,"post" ,data.meta.postId].join("-");
		var nodePost = document.getElementById(postId);
		if(!nodePost) return;
		nodePost.parentNode.removeChild(nodePost);
	}
	, "post:hide" : function(data, context){
		var cView = document.cView;
		var postId = [context.domain,"post" ,data.meta.postId].join("-");
		var nodePost = document.getElementById(postId);
		if(!nodePost) return;
		cView.Actions.doHide(nodePost, true, "rt");
	}
	, "post:unhide" : function(data, context){
		var cView = document.cView;
		var postId = [context.domain,"post" ,data.meta.postId].join("-");
		var nodePost = document.getElementById(postId);
		if(!nodePost) 
			cView.hiddenPosts.forEach(function (item){
				if (item.is && (item.data.id == data.meta.postId))nodePost = cView.Drawer.genPost(item.data);
			});
		if (nodePost) cView.Actions.doHide(nodePost, false, "rt");
	}
}
return RtHandler; 
});
