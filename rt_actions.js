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
	,insertSmooth: function(node, nodePos, host){
		var that = this;
		var cView = document.cView;
		var victim = document.getElementById(node.id);
		if(typeof host === "undefined" )host = document.posts;
		if(victim) victim.parentNode.removeChild(victim);
		
		if(!nodePos)host.appendChild(node);
		else nodePos.parentNode.insertBefore(node,nodePos);
		if(["metapost", "post"].indexOf(node.className) != -1)
			cView.Drawer.regenHides();
		cView.Drawer.applyReadMore(node);
		/*
		setTimeout(function(){
			node.style.height = height;
			node.style.opacity = 1; 
			setTimeout(function(){ 
				node.style.height = "auto";
				node.style.overflow = "unset"; 
			} ,  that.timeGrow);
		}, 1);
		
		if(document.getElementsByClassName("posts").length == 0){
			console.log("%s, %s",node.id, nodePos.id);
			console.log( cView.posts);
			throw "Same shit again";
		
		}
		*/
		return node;
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
		data.posts.src = "rt";
		var nodePost = manageMeta(cView.Drawer.genPost(data.posts));
		
		if(nodePost.classList[0] == "metapost" ){
			if(!nodePost.isHidden)this.bumpPost(nodePost);
		} else {
			cView.posts.unshift({
				"hidden":nodePost.rawData.isHidden
				,"data":nodePost.rawData
			});
			cView.Drawer.regenHides();
			if (!nodePost.rawData.isHidden)
				cView.Utils.unscroll.call(that
					,that.insertSmooth
					,nodePost
					,document.posts.firstChild
				);
		}
		window.dispatchEvent(new CustomEvent("newNode", {"detail":nodePost}));

		function manageMeta(nodePost){
			nodePost.rawData.sign = cView.hasher.of(nodePost.rawData.body);
			if(cView.posts.some(function(a){
				if((typeof a.data.id !== "undefined") 
				&& (a.data.id  ==  nodePost.rawData.id)) 
					return true;
				else return false;
			}))return nodePost; 

			if (nodePost.rawData.body.length < cView.minBody) 
				return nodePost;
			var targetMeta = cView.posts.find(function(a){
				if((typeof a.data.dups!== "undefined")
				&&a.data.dups.some( function(dup){return dup.id == nodePost.rawData.id;}))
					return true;
				else return false;
			}); 
			if(typeof targetMeta !== "undefined")
				targetMeta.data.dups = targetMeta.data.dups.filter(function(dup){
					return dup.id != nodePost.rawData.id;
				});
			else {
				var targetMeta = cView.posts.find(function(a){
					return cView.hasher.similarity(
						a.data.sign
						, nodePost.rawData.sign
					) > cView.threshold;
				});
			}
			if(typeof targetMeta === "undefined") return nodePost;

			var oldNode = null;
			if(targetMeta.data.type  == "metapost"){
				oldNode = document.getElementById(
					targetMeta.data.dups[0].domain
					+"-post-"
					+targetMeta.data.dups[0].id
				).parentNode; 
			}else {
				targetMeta.data = cView.Common.metapost([targetMeta.data]);
				oldNode = document.getElementById(
					targetMeta.data.dups[0].domain
					+"-post-"
					+targetMeta.data.dups[0].id
				);
			}
			targetMeta.data.dups.push(nodePost.rawData);
			if(targetMeta.hidden){
				nodePost.isHidden = true;
				return nodePost;
			}
			var host = oldNode.parentNode;
			var dummy = document.createElement("div");
			var newNode = nodePost;
			host.insertBefore(dummy,oldNode );
			var posts = targetMeta.data.dups.map(function(post){
				return document.getElementById( 
					post.domain
					+ "-post-"
					+ post.id
				);
			}).filter(function(node){return node;}).concat(nodePost)
			host.removeChild(oldNode);
			nodePost = cView.Drawer.makeMetapost( posts);
			host.replaceChild(nodePost, dummy);
			cView.Common.markMetaMenu(newNode);
			return nodePost;
		}

	}

	,bumpPost: function(nodePost){
		var cView = document.cView;
		if(cView.skip || (nodePost.rawData.idx === 0))return;
		var that = this;
		if(nodePost.rtCtrl.isBeenCommented)
			nodePost.rtCtrl.bumpLater = function(){ that.bumpPost(nodePost);}
		else {
	 		var nodeParent = nodePost.parentNode;
			if(nodeParent&&(nodeParent.className == "metapost")){
				nodePost = nodeParent;
				nodeParent = nodePost.parentNode;
			}
			var postInfo = cView.posts.splice(nodePost.rawData.idx,1);
			cView.posts.unshift(postInfo[0]);
			cView.Utils.unscroll.call(that
				,that.insertSmooth
				,nodePost
				,nodeParent?nodeParent.firstChild:null
			);
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
		var commentId = context.domain + "-cmt-" +data.comments.id;
		var postId = context.domain+"-post-" +data.comments.postId;
		var nodePost = document.getElementById(postId);
		var nodeComment;
		data.users.forEach(cView.Common.addUser,context);
		if(nodePost){
			context.gComments[data.comments.id] = data.comments; 
			if(!Array.isArray( nodePost.rawData.comments))
				nodePost.rawData.comments = new Array();
			nodePost.rawData.comments.push(data.comments.id);
			if(!document.getElementById(commentId)) 
				nodeComment = cView.Utils.unscroll(function(){
					var nodeComment = that.insertSmooth(
						cView.Drawer.genComment.call(context, data.comments)
						,null
						,nodePost.cNodes["post-body"].cNodes["comments"]
					);
					cView.Drawer.applyReadMore(nodeComment);
					return nodeComment;
				});
			else return;
			if (that.bump && ( (nodePost.rawData.updatedAt*1 + that.bumpCooldown) < Date.now())){
				if(!Array.isArray(cView.bumps))cView.bumps = new Array();
				setTimeout(function(){ cView.bumps.push(nodePost)},that.bumpDelay+1);
			}
			nodePost.rawData.updatedAt = Date.now();
			cView.Common.markMetaMenu(nodePost);
			if(nodePost.getElementsByClassName("comment").length>4)
				nodePost.getNode(["c","post-body"],["c","many-cmts-ctrl"]).hidden = false;
			window.dispatchEvent(new CustomEvent("newNode", {"detail":nodeComment}));
		}else that.injectPost(data.comments.postId, context);
	}
	,"comment:update": function(data, context){
		var cView = document.cView;
		var commentId = context.domain+"-cmt-"+ data.comments.id;
		var postId = context.domain+"-post-"+data.comments.postId;
		context.gComments[data.comments.id] = data.comments; 
		var nodeComment = document.getElementById(commentId);
		if (nodeComment){ 
			var newComment = cView.Drawer.genComment.call(context, data.comments);
			cView.Utils.unscroll(function(){
				var nodePost = document.getElementById(postId);
				nodeComment.parentNode.replaceChild( newComment , nodeComment);
				cView.Drawer.applyReadMore( newComment );
				cView.Common.markMetaMenu(nodePost);
				return newComment;
			});
			window.dispatchEvent(new CustomEvent("updNode", {"detail":newComment}));
		}
		
	}
	,"comment:destroy": function(data, context){
		var cView = document.cView;
		if(typeof context.gComments[data.commentId] !== "undefined")delete context.gComments[data.commentId];
		var postId = context.domain+"-post-" +data.postId;
		var commentId = context.domain+"-cmt-" +data.commentId;
		var nodePost  = document.getElementById(postId);
		if(!nodePost)return;
		if((typeof nodePost.rawData.comments !== "undefined")
			&&(nodePost.rawData.comments.indexOf(commentId) > -1))
			nodePost.rawData.comments.splice(nodePost.rawData.comments.indexOf(commentId),1);
		var nodeComment = document.getElementById(commentId);
		if (nodeComment) cView.Utils.unscroll(function(){
			nodeComment.parentNode.removeChild(nodeComment);
			cView.Common.markMetaMenu(nodePost);
			return nodeComment.parentNode;
		});
	}
	,"like:new": function(data, context){
		var that = this;
		var cView = document.cView;
		if (context.gMe && Array.isArray(context.gMe.users.banIds)
			&& (context.gMe.users.banIds.indexOf(data.users.id) > -1))
			return;
		cView.Common.addUser.call(context, data.users);
		var postId = context.domain+"-post-" +data.meta.postId;
		var nodePost = document.getElementById(postId);
		if(nodePost){
			if (!Array.isArray(nodePost.rawData.likes)) nodePost.rawData.likes = new Array();
			if (nodePost.rawData.likes.indexOf(data.users.id) > -1) return;
			nodePost.rawData.likes.unshift(data.users.id);
			cView.Utils.unscroll(function(){
				cView.Drawer.genLikes(nodePost);
				nodePost.rawData.updatedAt = Date.now();
				cView.Common.markMetaMenu(nodePost);
				return nodePost; 
			});
		}else that.injectPost(data.meta.postId, context);
	}
	,"like:remove": function(data, context){
		var cView = document.cView;
		var postId = context.domain+"-post-" +data.meta.postId;
		var nodePost = document.getElementById(postId);
		if(nodePost  && Array.isArray(nodePost.rawData.likes)
			&& (nodePost.rawData.likes.indexOf(data.meta.userId) > -1 )) {
			nodePost.rawData.likes.splice(nodePost.rawData.likes.indexOf(data.meta.userId), 1) ;
			cView.Utils.unscroll(function(){
				cView.Drawer.genLikes(nodePost);
				nodePost.cNodes["post-body"].cNodes["post-info"].nodeLike.innerHTML = "Like";
				nodePost.cNodes["post-body"].cNodes["post-info"].nodeLike.action = true ;
				cView.Common.markMetaMenu(nodePost);
				return nodePost; 
			});
		}

	}
	,"post:new" : function(data, context){
		var that = this;
		var cView = document.cView;
		if(cView.skip)return;
		var postId = context.domain+"-post-" +data.posts.id;
		if(document.getElementById(postId)) return;
		that.unshiftPost(data, context);
	}
	, "post:update" : function(data, context){
		var cView = document.cView;
		var postId = context.domain+"-post-" +data.posts.id;
		var nodePost = document.getElementById(postId);
		if(!nodePost) return;

		var nodeCont = nodePost.getNode(["c","post-body"],["c","post-cont"]);
		nodeCont.words = context.digestText(data.posts.body);
		cView.Utils.unscroll(function(){
			nodeCont.innerHTML = "";
			cView.Drawer.applyReadMore( nodePost);
			nodePost.rawData.body = data.posts.body;
			cView.Common.markMetaMenu(nodePost);
			return nodePost; 
		});
		window.dispatchEvent(new CustomEvent("updNode", {"detail":nodePost}));
	}
	, "post:destroy" : function(data, context){
		var cView = document.cView;
		var postId = context.domain+"-post-" +data.meta.postId;
		var victim = document.getElementById(postId);
		if(!victim) return;
		var host = victim.parentNode;
		if(host.classList[0] == "metapost"){
			cView.Utils.unscroll(function(){
				host.removeChild(victim);
				cView.Drawer.regenMetapost(host);
				return host;
			});
			var metapostData = cView.posts[victim.rawData.idx].data;
			metapostData.dups = metapostData.dups.filter(function(dup){ 
				return dup.id != victim.rawData.id;
			});
			if (metapostData.dups.length == 1)
				cView.posts[victim.rawData.idx].data = metapostData.dups[0];
		}else{
			var dummy = document.createElement("div");
			cView.Utils.unscroll(function(){
				victim.parentNode.replaceChild(dummy, victim);
				return dummy; 
			});
			dummy.parentNode.removeChild(dummy);
			cView.posts.splice(victim.rawData.idx,1);
		}

	}
	, "post:hide" : function(data, context){
		var cView = document.cView;
		var postId = context.domain+"-post-" +data.meta.postId;
		var nodePost = document.getElementById(postId);
		if(!nodePost) return;
		cView.Actions.doHide(nodePost, true, "rt");
	}
	, "post:unhide" : function(data, context){
		var cView = document.cView;
		var postId = context.domain+"-post-" +data.meta.postId;
		var nodePost = document.getElementById(postId);
		if(!nodePost) 
			cView.posts.forEach(function (item){
				if (item.hidden && (item.data.id == data.meta.postId))
					nodePost = cView.Drawer.genPost(item.data);
			});
		if (nodePost) cView.Actions.doHide(nodePost, false, "rt");
	}
}
return RtHandler; 
});
