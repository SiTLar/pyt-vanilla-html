"use strict";
define("./actions",[],function() {
function _Actions(v){
	this.cView = v;
};
_Actions.prototype = {
	constructor:_Actions
	/*
	,"auth": function(){
		var cView = document.cView;
		cView.Utils.auth();
	}
	*/
	,"newPost": function(e){
		var cView = document.cView;
		var textField = e.target.parentNode.parentNode.cNodes["edit-txt-area"];
		if (textField.value == ""){
			alert("you should provide some text");
			return;
		}
		textField.disabled = true;
		e.target.disabled = true;
		var nodeSpinner = e.target.parentNode.appendChild(cView.gNodes["spinner"].cloneNode(true));
		var post = new Object();
		var postsTo = e.target.parentNode.parentNode.getElementsByClassName("new-post-to");
		var arrPostsTo = new Array(postsTo.length);
		for (var idx = 0; idx < postsTo.length; idx++)arrPostsTo[idx] = postsTo[idx];
		if(textField.pAtt)textField.pAtt.then(function(){ arrPostsTo.forEach(send);});
		else arrPostsTo.forEach(send);

		function send(postTo){
			var context = cView.contexts[postTo.domain];
			var postdata = new Object();
			postdata.meta = new Object();
			postdata.meta.feeds = postTo.feeds ;
			post.body = textField.value.replace(new RegExp(gConfig.front.slice(8)+"(?=[^\\s])"),"freefeed.net/");
			if(textField.attachments) post.attachments = textField.attachments;
			postdata.post = post;
			oReq.send(JSON.stringify(postdata));
			context.api.sendPost(context.logins[postTo.userid].token, post)
			.then(function(){
				var nodeAtt = cView.doc.createElement("div");
				nodeAtt.className = "attachments";
				textField.parentNode.replaceChild(nodeAtt,
					textField.parentNode.cNodes["attachments"]);
				textField.parentNode.cNodes["attachments"] = nodeAtt;
				textField.value = "";
				textField.disabled = false;
				delete textField.pAtt;
				delete textField.attachments;
				postTo.feeds = new Array();
				cView.updPostTo(cView.gMe, true, cView.gMe.users.username);
				e.target.disabled = false;
				textField.style.height  = "4em";
				try{ e.target.parentNode.removeChild(nodeSpinner); }
				catch(e){};
				var res = JSON.parse(oReq.response);
				cView.Drawer.loadGlobals(res);
				if(!cView.doc.getElementById(res.posts.id))cView.doc.posts.insertBefore(cView.Drawer.genPost(res.posts), cView.doc.posts.childNodes[0]);
			}
			,function(err){
				textField.disabled = false;
				e.target.disabled = false;
				var errmsg = "";
				try{
					e.target.parentNode.removeChild(nodeSpinner );
					var eresp = JSON.parse(oReq.response);
					errmsg = eresp.err;
				}catch(e){};
				alert("Error #"+oReq.status+": "+oReq.statusText+" "+errmsg) ;
			});
			
		/*	if(postTo.isPrivate){
				oReq.open("post",matrix.cfg.srvurl+"post", true);
				oReq.setRequestHeader("x-content-type", "post");
				oReq.setRequestHeader("Content-type","text/plain");
				oReq.onload = onload;
				var payload =  {
					"feed":postTo.feeds[0],
					"type":"post",
					"author":cView.gMe.users.username,
					"data":textField.value
				};
				matrix.sign(JSON.stringify(payload)).then(function(sign){
					var token = matrix.mkOwnToken(sign);
					if(!token) return console.log("Failed to make access token");
					oReq.setRequestHeader("x-content-token", token);
					post = matrix.encrypt(postTo.feeds,
						JSON.stringify({"payload":payload,"sign":sign}));
					oReq.setRequestHeader("Content-type","application/json");
					oReq.send(JSON.stringify({"d":post}));
				},function(){console.log("Failed to sign")});
			}else*/{
			}
		}
	}
	,"sendAttachment": function(e){
		var cView = document.cView;
		e.target.disabled = true;
		var textField = e.target.parentNode.parentNode.cNodes["edit-txt-area"];
		var nodeSpinner = cView.doc.createElement("div");
		nodeSpinner.innerHTML = '<img src="'+gConfig.static+'throbber-100.gif">';
		e.target.parentNode.parentNode.cNodes["attachments"].appendChild(nodeSpinner);
		textField.pAtt = new Promise(function(resolve,reject){
			var oReq = new XMLHttpRequest();
			oReq.onload = function(){
				if(this.status < 400){
					e.target.value = "";
					e.target.disabled = false;
					var attachments = JSON.parse(this.response).attachments;
					var nodeAtt = cView.doc.createElement("div");
					nodeAtt.className = "att-img";
					nodeAtt.innerHTML = '<a target="_blank" href="'+attachments.url+'" border=none ><img src="'+attachments.thumbnailUrl+'"></a>';
					nodeSpinner.parentNode.replaceChild(nodeAtt, nodeSpinner);
					if (typeof(textField.attachments) === "undefined" ) textField.attachments = new Array();
					textField.attachments.push(attachments.id);
					resolve();

				}else reject(this.status);
			};

			oReq.open("post",gConfig.serverURL + "attachments", true);
			oReq.setRequestHeader("X-Authentication-Token", cView.token);
			var data = new FormData();
			data.append( "name", "attachment[file]");
			data.append( "attachment[file]", e.target.files[0], e.target.value);
			oReq.send(data);
		});
	}
	,"editPost": function(e) {
		var cView = document.cView;
		var victim = e.target.getNode(["p","post"]);
		var nodeEdit = cView.Drawer.genEditNode(cView.Actions.postEditedPost,cView.Actions.cancelEditPost);
		nodeEdit.cNodes["edit-txt-area"].value = victim.rawData.body;
		victim.cNodes["post-body"].replaceChild( nodeEdit, victim.cNodes["post-body"].cNodes["post-cont"]);
}
	,"cancelEditPost": function(e){
		var cView = document.cView;
		var victim = e.target.getNode(["p","post"]);
		var postCNode = cView.doc.createElement("div");
		postCNode.innerHTML = cView.autolinker.link(victim.rawData.body.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
		postCNode.className = "post-cont";
		victim.cNodes["post-body"].replaceChild(postCNode,e.target.parentNode.parentNode );
		victim.cNodes["post-body"].cNodes["post-cont"] = postCNode;

	}
	,"postEditedPost": function(e){
		var cView = document.cView;
		var nodePost =e.target.getNode(["p","post"]);
		var context = cView.contexts[nodePost.rawData.domain];
		e.target.disabled = true;
		var post = new Object();
		post.createdAt = nodePost.rawData.createdAt;
		post.createdBy = nodePost.rawData.createdBy;
		post.updatedAt = Date.now();
		post.attachments = nodePost.rawData.attachments;
		var postdata = new Object();
		postdata.post = post;
		e.target.parentNode.parentNode.cNodes["edit-txt-area"].disabled = true;
		e.target.parentNode.replaceChild(cView.gNodes["spinner"].cloneNode(true),e.target.parentNode.cNodes["edit-buttons-cancel"] );
		post.body = e.target.parentNode.parentNode.cNodes["edit-txt-area"].value
			.replace(new RegExp(gConfig.front.slice(8)+"(?=[^\\s])"),"freefeed.net/");
		context.api.editPost(
			context.logins[nodePost.rawData.createdBy].token
			,nodePost.id
			,postdata
		).then(function(){
			var post = JSON.parse(oReq.response).posts;
			var postCNode = cView.doc.createElement("div");
			/*
			var cpost = matrix.decrypt(post.body);
			if (typeof cpost.error === "undefined") {
				cpost = JSON.parse(cpost);
				post.body = cpost.payload.data;
				nodePost.sign = cpost.sign;
			}
			*/
			postCNode.innerHTML = cView.autolinker.link(post.body.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
			postCNode.className = "post-cont";
			nodePost.rawData = post;
			nodePost.cNodes["post-body"].replaceChild(postCNode,e.target.parentNode.parentNode );
			nodePost.cNodes["post-body"].cNodes["post-cont"] = postCNode;
		});

	/*
		if(nodePost.isPrivate){
			oReq.open("put",matrix.cfg.srvurl+"edit", true);
			oReq.setRequestHeader("x-content-type", "post");
			oReq.setRequestHeader("Content-type","application/json");
			//oReq.onload = onload;
			var payload =  {
				"feed":nodePost.feed,
				"type":"post",
				"author":cView.gMe.users.username,
				"data":text
			};
			oReq.setRequestHeader("x-access-token", matrix.mkOwnToken(nodePost.sign));
			matrix.sign(JSON.stringify(payload)).then(function(sign){
				var token = matrix.mkOwnToken(sign);
				if(!token) return console.log("Failed to make access token");
				oReq.setRequestHeader("x-content-token", token);
				oReq.setRequestHeader("x-content-id",nodePost.id);
				post = matrix.encrypt(nodePost.feed,
					JSON.stringify({"payload":payload,"sign":sign}));
				oReq.send(JSON.stringify({"d":post}));
			},function(){console.log("Failed to sign")});
		}else
	*/
	}
	,"deletePost": function(e){
		var cView = document.cView;
		var victim =e.target.getNode(["p", "post"]);
		cView.Actions.deleteNode(victim, cView.Actions.doDeletePost);
	}
	,"doDeletePost": function(but){
		var cView = document.cView;
		var victim = but.node;
		var context = cView.contexts[victim.rawData.domain];
		e.target.disabled = true;
		but.parentNode.parentNode.removeChild(but.parentNode);
			oReq.open("delete",gConfig.serverURL + "posts/"+victim.id, true);
			oReq.setRequestHeader("X-Authentication-Token", cView.logins[victim.rawData.createdBy].token);
			oReq.setRequestHeader("Content-type","application/json");
			oReq.send();
		var oReq = new XMLHttpRequest();
		context.api.deletePost( 
			context.logins[victim.rawData.createdBy].token
			,victim.id
		).then(function(){
			if(this.status < 400){
				cView.doc.hiddenPosts.splice(victim.rawData.idx,1);
				//victim.parentNode.removeChild(victim);
				cView.Drawer.regenHides();
			}
		});/*
		if(victim.isPrivate){
			oReq.open("delete",matrix.cfg.srvurl+"delete",true);
			oReq.setRequestHeader("x-content-id", victim.id);
			oReq.setRequestHeader("x-access-token", matrix.mkOwnToken(victim.sign));
			oReq.setRequestHeader("x-content-type", "post");
			oReq.send();
		}else*/{
		}
	}
	,"postLike": function(e){
		var cView = document.cView;
		var nodeLikes = e.target.getNode(["p","likes"]);
		var nodePost = nodeLikes.getNode(["p","post"]);
		var context = cView.contexts[nodePost.rawData.domain];
			oReq.open("post",gConfig.serverURL + "posts/"+ e.target.parentNode.parentNode.parentNode.parentNode.parentNode.id+"/"+(e.target.action?"like":"unlike"), true);
			oReq.setRequestHeader("X-Authentication-Token", cView.token);
			oReq.send();
		e.target.innerHTML = "";
		e.target.appendChild(cView.gNodes["spinner"].cloneAll());
		context.api.sendLike(context.token, nodePost.rawData.id, action).then(function(){
			if(e.target.action){
				var idx;
				var likesUL;
				if (!nodeLikes.childNodes.length){
					nodeLikes.appendChild(cView.gNodes["likes-smile"].cloneNode(true));
					likesUL = cView.doc.createElement( "span");
					likesUL.className ="comma";
					var suffix = cView.doc.createElement("span");
					suffix.id = e.target.parentNode.postId+"-unl";
					suffix.innerHTML = " liked this";
					nodeLikes.appendChild(likesUL);
					nodeLikes.appendChild(suffix);

				}else {

				/*	for(idx = 0; idx < nodeLikes.childNodes.length; idx++)
						if (nodeLikes.childNodes[idx].nodeName == "UL")break;
					likesUL = nodeLikes.childNodes[idx];
					*/
					likesUL = nodeLikes.cNodes["comma"];
				}
				var nodeLike = cView.doc.createElement("span");
				nodeLike.className = "p-timeline-user-like";
				nodeLike.innerHTML = context.gUsers[context.gMe.users.id].link;
				if(likesUL.childNodes.length)likesUL.insertBefore(nodeLike, likesUL.childNodes[0]);
				else likesUL.appendChild(nodeLike);
				e.target.parentNode.parentNode.parentNode.myLike = nodeLike;
				if(!Array.isArray(nodePost.rawData.likes)) nodePost.rawData.likes = new Array();
				nodePost.rawData.likes.unshift(context.gMe.users.id);
			}else{
				nodePost.rawData.likes.splice(nodePost.rawData.likes.indexOf(context.gMe.users.id), 1) ;
				var myLike = e.target.parentNode.parentNode.parentNode.myLike;
				likesUL = myLike.parentNode;
				likesUL.removeChild(myLike);
				cView.Drawer.genLikes(nodePost);

			/*
				if (likesUL.childNodes.length < 2){
					var nodePI = nodeLikes.parentNode;
					nodePI.cNodes["likes"] = cView.doc.createElement("div");
					nodePI.cNodes["likes"].className = "likes";
					nodePI.replaceChild(nodePI.cNodes["likes"], nodeLikes);
				}
				*/
			 }
			e.target.innerHTML=e.target.action?"Un-like":"Like";
			e.target.action = !e.target.action;
		},function() { e.target.innerHTML= !e.target.action?"Un-like":"Like"; });



	}
	,"unfoldLikes": function(e){
		var cView = document.cView;
		var nodePost = e.target.getNode(["p","post"]);
		var context = cView.contexts[nodePost.rawData.domain];
		var span = e.target.getNode(["p","nocomma"]);
		var nodeLikes = span.parentNode.cNodes["comma"];

		if (nodePost.rawData.omittedLikes > 0){
			context.api.getPost(context.token, nodePost.rawData.id, ["likes"])
			.then (function(){
				span.parentNode.removeChild(span);
				var postUpd = JSON.parse(this.response);
				postUpd.users.forEach(cView.Common.addUser, cView.Common);
				nodePost.rawData.likes = postUpd.posts.likes;
				cView.Drawer.writeAllLikes(nodePost.id, nodeLikes);
			},function (res){
				console.log(res);

			});

		}else cView.Drawer.writeAllLikes(id, nodeLikes);
	}
	,"getUsername": function(e){
		var cView = document.cView;
		var node = e.target; do node = node.parentNode; while(typeof node.user === "undefined");
		if ( cView.cTxt == null ) return;
		cView.cTxt.value += "@" + node.user;
	}
	,"reqSubscription": function(e){
		var cView = document.cView;
		var oReq = new XMLHttpRequest();
		var username = cView.Utils.getNode(e.target,["p","up-controls"]).user;
		var loginId = e.target.getNode(["p","up-c-mu"]).loginId;
		var domain = e.target.getNode(["p","up-c-mu"]).domain;
		var context = cView.contexts[domain];
		context.api.reqSub( context.logins[loginId].token,username ).then( function(){
				var span = cView.doc.createElement("span");
				span.innerHTML = "Request sent";
				e.target.parentNode.replaceChild(span, e.target);
		} );
	}
	,"evtSubscribe": function(e){
		var cView = document.cView;
		var Utils = cView.Utils;
		var target = e.target;
		var nodeParent = target.parentNode;
		var spinner = cView.gNodes["spinner"].cloneAll();
		nodeParent.replaceChild(spinner, target);
		var nodeUC = cView.Utils.getNode(nodeParent,["p","up-controls"]);
		var username = nodeUC.user;
		var loginId = nodeParent.getNode(["p","up-c-mu"]).loginId;
		var domain = e.target.getNode(["p","up-c-mu"]).domain;
		context.api.evtSub( context.logins[loginId].token,username, target.subscribed ).then( function(res){
			comtext.logins[loginId].data = res;
			Common.refreshLogin(loginId,context);
			Utils.setChild(nodeParent.getNode(["p","up-controls"]).parentNode, "up-controls", cView.Drawer.genUpControls(username));
		},function(){  nodeParent.replaceChild( target, spinner); });
	}
	,"showHidden": function(e){
		var cView = document.cView;
		if(e.target.action){
			if(!cView.doc.hiddenCount)return;
			var nodeHiddenPosts = cView.doc.createElement("div");
			nodeHiddenPosts.id = "hidden-posts";
			cView.doc.hiddenPosts.forEach(function(oHidden){if(oHidden.is)nodeHiddenPosts.appendChild(cView.Drawer.genPost(oHidden.data));});
			e.target.parentNode.parentNode.insertBefore(nodeHiddenPosts , e.target.parentNode.nextSibling);
			e.target.innerHTML =  "Collapse "+ cView.doc.hiddenCount + " hidden entries";
		}else{
			var nodeHiddenPosts = cView.doc.getElementById("hidden-posts");
			if (nodeHiddenPosts) nodeHiddenPosts.parentNode.removeChild(nodeHiddenPosts);
			if (cView.doc.hiddenCount) e.target.innerHTML = "Show "+ cView.doc.hiddenCount + " hidden entries";
			else e.target.innerHTML = "";
		}
		e.target.action = !e.target.action;
	}
	,"postHide": function(e){
		var cView = document.cView;
		var victim = e.target.getNode(["p","post"]);
		var action = e.target.action;
		context.api.hide(context.token, victim.rawData.id, action).then(function(){
				cView.Actions.doHide(victim, action, "user");
		});
	}
	,"doHide": function(victim, action){
		var cView = document.cView;
		var nodeHide = victim.getNode(["c","post-body"],["c","post-info"],["c","post-controls"],["c","controls"],["c","hide"]);
		if(action != nodeHide.action) return;
		victim.rawData.isHidden = action;
		nodeHide.action = !action;
		var nodeShow = cView.doc.getElementsByClassName("show-hidden")[0]
		if (!nodeShow){
			nodeShow = cView.gNodes["show-hidden"].cloneAll();
			nodeShow.cNodes["href"].action = true;
			cView.doc.getElementById("content").appendChild(nodeShow);
		}
		var aShow =  nodeShow.cNodes["href"];
		if(action){
			cView.doc.hiddenPosts[victim.rawData.idx].is  = true;
			victim.parentNode.removeChild(victim);
			cView.doc.hiddenCount++;
			aShow.action = false;
			aShow.dispatchEvent(new Event("click"));
		}else{
			var count = 0;
			var idx = victim.rawData.idx;
			do if(cView.doc.hiddenPosts[idx--].is)count++;
			while ( idx >0 );
			if ((victim.rawData.idx - count+1) >= cView.doc.posts.childNodes.length )cView.doc.posts.appendChild(victim);
			else cView.doc.posts.insertBefore(victim, cView.doc.posts.childNodes[victim.rawData.idx - count+1]);
			nodeHide.innerHTML = "Hide";
			cView.doc.hiddenPosts[victim.rawData.idx].is = false;
			cView.doc.hiddenCount--;
			if(cView.doc.hiddenCount) aShow.innerHTML = "Collapse "+ cView.doc.hiddenCount + " hidden entries";
			else aShow.dispatchEvent(new Event("click"));
		}

	}
	,"addComment": function(e){
		var cView = document.cView;
		var postNBody = e.target.getNode(["p","post-body"]);
		if(postNBody.isBeenCommented === true)return;
		postNBody.isBeenCommented = true;
		var nodeComment = cView.Drawer.genAddComment();
		postNBody.cNodes["comments"].appendChild(nodeComment);
		nodeComment.getElementsByClassName("edit-txt-area")[0].focus();
	}
	,"editComment": function(e){
		var cView = document.cView;
		var victim = e.target.getNode(["p" "comment"]);
		var nodeEdit = cView.Drawer.genEditNode(cView.Actions.postEditComment,cView.Actions.cancelEditComment);
		nodeEdit.cNodes["edit-txt-area"].value = cView.gComments[victim.id].body;
		victim.replaceChild( nodeEdit, victim.cNodes["comment-body"]);
		victim.cNodes["comment-body"] = nodeEdit;
		nodeEdit.className = "comment-body";
		victim.getElementsByClassName("edit-txt-area")[0].focus();
	}
	,"postEditComment": function(e){
		var cView = document.cView;
		var nodeComment = e.target.getNode(["p", "comment"]);
		var nodePost = nodeComment.getNode(["p", "post"])
		var textField = e.target.parentNode.parentNode.cNodes["edit-txt-area"];
		e.target.disabled = true;
		e.target.parentNode.replaceChild(cView.gNodes["spinner"].cloneNode(true),e.target.parentNode.cNodes["edit-buttons-cancel"] );
		var comment = cView.gComments[nodeComment.rawId];
		comment.body = textField.value.replace(new RegExp(gConfig.front.slice(8)+"(?=[^\\s])"),"freefeed.net/"); //TODO
		comment.updatedAt = Date.now();
		var postdata = new Object();
		postdata.comment = comment;
		context.api.editComment( context.logins[comment.createdBy].token, postdata).then( function(res){
			nodeComment.parentNode.replaceChild(cView.Drawer.genComment.call(context, res.comments),nodeComment);
			context.gComments[comment.id] = res.comments;
		});

	}
	,"cancelEditComment": function(e){
		var cView = document.cView;
		var nodeComment = e.target.getNode(["p","comment"]);
		var context = cView.contexts[nodeComment.getNode(["p","post"]).rawData.domain];
		nodeComment.parentNode.replaceChild(cView.Drawer.genComment.call(context, context.gComments[nodeComment.id]),nodeComment);
	}
	,"processText": function(e) {
		var cView = document.cView;
		cView.cTxt = e.target;
		if (e.target.scrollHeight > e.target.clientHeight)
			e.target.style.height = e.target.scrollHeight + "px";
		if (e.which == "13"){
			var text = e.target.value;
			e.preventDefault();
			e.stopImmediatePropagation();
			//if(text.charAt(text.length-1) == "\n") e.target.value = text.slice(0, -1);
			e.target.parentNode.cNodes["edit-buttons"].cNodes["edit-buttons-post"].dispatchEvent(new Event("click"));
		}

	}
	,"cancelNewComment": function(e){
		var cView = document.cView;
		var postNBody = e.target.getNode(["p", "post-body");
		postNBody.isBeenCommented = false;
		if(typeof postNBody.bumpLater !== "undefined")setTimeout(postNBody.bumpLater, 1000);
		var nodeComment = e.target.getNode(["p", "comment"]);
		nodeComment.parentNode.removeChild(nodeComment);

	}
	,"postNewComment": function(e){
		var cView = document.cView;
		e.target.disabled = true;
		e.target.parentNode.replaceChild(cView.gNodes["spinner"].cloneNode(true),e.target.parentNode.cNodes["edit-buttons-cancel"] );
		cView.Actions.sendComment(e.target.parentNode.previousSibling);
		var nodeComment = e.target.getNode(["p", "comment"]);
		nodeComments.cnt++;
	}
	,"deleteComment": function(e){
		var cView = document.cView;
		var nodeComment = e.target.getNode(["p", "comment"]);
		cView.Actions.deleteNode(nodeComment,cView.Actions.doDeleteComment);
	}

	,"sendComment": function (textField){
		var cView = document.cView;
		var nodeComment = textField.getNode(["p", "comment"]);
		var nodePost = nodeComment.getNode(["p", "post"])
		var context = cView.contexts[nodePost.rawData.domain];
		nodePost.cNodes["post-body"].isBeenCommented = false;
		if(typeof nodePost.cNodes["post-body"].bumpLater !== "undefined")setTimeout(nodePost.cNodes["post-body"].bumpLater, 1000);
		textField.parentNode.cNodes["edit-buttons"].cNodes["edit-buttons-post"].disabled = true;
		var comment = new Object();
		comment.body = textField.value.replace(new RegExp(gConfig.front.slice(8)+"(?=[^\\s])"),"freefeed.net/"); //TODO
		comment.postId = nodePost.id;
		comment.createdAt = null;
		comment.createdBy = null;
		comment.updatedAt = null;
		comment.post = null;
		var postdata = new Object();
		postdata.comment = comment;
		var token;
		var nodesSelectUsr = nodeComment.getElementsByClassName("select-user-ctrl")[0].childNodes;
		if(context.ids > 1){
			for(var idx = 0; idx < nodesSelectUsr.length; idx++){
				if (nodesSelectUsr[idx].selected){
					token = context.logins[nodesSelectUsr[idx].value].token;
					break;
				}
			}
		}else token = context.token;

		context.api.sendComment(token,postdata).then(function{
			var comment = JSON.parse(this.response).comments;
			cView.gComments[comment.id] = comment;
			if( nodeComment.parentNode.childNodes.length > 4 )cView.Drawer.addLastCmtButton(nodePost.cNodes["post-body"]);
			if(!document.getElementById(comment.id))nodeComment.parentNode.replaceChild(cView.Drawer.genComment.call(context, comment),nodeComment);
			else nodeComment.parentNode.removeChild(nodeComment);
		});
		
	}
	,"deleteNode": function(node,doDelete){
		var cView = document.cView;
		var nodeConfirm = cView.doc.createElement("div");
		var butDelete = cView.doc.createElement("button");
		butDelete.innerHTML = "delete";
		butDelete.node = node;
		butDelete.onclick = function(){doDelete(butDelete);};
		var butCancel0 = cView.doc.createElement("button");
		butCancel0.innerHTML = "cancel";
		butCancel0.onclick = function (){cView.Actions.deleteCancel(nodeConfirm)};
		var aButtons = [butDelete,butCancel0] ;
		nodeConfirm.innerHTML = "<p>Sure delete?</p>";
		aButtons.forEach(function(but){ but.className = "confirm-button";});
		nodeConfirm.appendChild(aButtons.splice(Math.floor(Math.random()*2 ),1)[0]);
		nodeConfirm.appendChild(aButtons[0]);
		node.parentNode.insertBefore(nodeConfirm,node);
		nodeConfirm.node = node;
		node.hidden = true;

	}
	,"deleteCancel": function(nodeConfirm){
		var cView = document.cView;
		nodeConfirm.node.hidden = false;
		nodeConfirm.parentNode.removeChild(nodeConfirm);
	}
	,"doDeleteComment": function(but){
		var cView = document.cView;
		var nodeComment = but.node;
		var nodePost = nodeComment.getNode(["p", "post"])
		var context = cView.contexts[nodePost.rawData.domain];
		but.parentNode.parentNode.removeChild(but.parentNode);
		but.node.hidden = false;
		var token;
		if( typeof context.logins[nodeComment.userid] != "undefined") 
			token = context.logins[nodeComment.userid].token;
		else if (typeof context.logins[nodePost.rawData.createdBy] != "undefined" )
			token = context.logins[nodePost.rawData.createdBy].token;
		else return;
		context.api.deleteComment(toke, nodeComment.rawId).then(function(){
			if(nodeComment.parentNode) nodeComment.parentNode.removeChild(nodeComment);
			delete context.gComments[nodeComment.id];
		});
/*		if(nodePost.isPrivate){
			oReq.open("delete",matrix.cfg.srvurl+"delete",true);
			oReq.setRequestHeader("x-content-id", nodeComment.id);
			oReq.setRequestHeader("x-access-token", matrix.mkOwnToken(nodeComment.sign));
			oReq.setRequestHeader("x-content-type", "comment");
			oReq.send();
		}else{
*/
	}
	,"unfoldComm": function(e){
		var cView = document.cView;
		var oReq = new XMLHttpRequest();
		var post = e.target.getNode(["p","post"]).rawData;
		var id = post.id;
		var spUnfold = e.target.parentNode.appendChild(cView.doc.createElement("i"));
		spUnfold.className = "fa fa-spinner fa-pulse";
		context.api.getPost(context.token, post.id, ["comments"]).then( function(postUpd){
			cView.Drawer.loadGlobals(postUpd);
			cView.doc.getElementById(id).rawData = post;
			var nodePB = cView.doc.getElementById(id).cNodes["post-body"];
			var text = "";
			if (nodePB.isBeenCommented == true)
				text = nodePB.getElementsByTagName("textarea")[0].value;	
			if(typeof nodePB.bumpLater !== "undefined")setTimeout(postPB.bumpLater, 1000);
			nodePB.removeChild(nodePB.cNodes["comments"]);
			nodePB.cNodes["comments"] = cView.doc.createElement("div");
			nodePB.cNodes["comments"].className = "comments";

			postUpd.comments.forEach(function(cmt){context.gComments[cmt.id] =cmt; nodePB.cNodes["comments"].appendChild(cView.Drawer.genComment.call(context, cmt))});
			nodePB.appendChild(nodePB.cNodes["comments"]);
			if (nodePB.isBeenCommented == true){ 
				var nodeComment = cView.Drawer.genAddComment();
				nodePB.cNodes["comments"].appendChild(nodeComment);
				nodeComment.getElementsByClassName("edit-txt-area")[0].value = text;
			}
			cView.Drawer.addLastCmtButton(nodePB);
			nodePB.cNodes["comments"].cnt = postUpd.comments.length;

		},function(res){
			spUnfold.parentNode.removeChild(spUnfold);
			console.log(res);

		};



	}
	,"calcCmtTime": function(e){
		var cView = document.cView;
		if (typeof(e.target.parentNode.parentNode.parentNode.createdAt) !== "undefined" ){
			var absUxTime = e.target.parentNode.parentNode.parentNode.createdAt*1;
			var txtdate = new Date(absUxTime ).toString();

			e.target.title =  cView.Utils.relative_time(absUxTime) + " ("+ txtdate.slice(0, txtdate.indexOf("(")).trim()+ ")";
		}
	}
	,"me": function(e){
		var cView = document.cView;
		e.target.href = gConfig.front+cView.contexts[gConfig.frfDomain].gMe["users"]["username"];
	}
	,"home": function(e){
		var cView = document.cView;
	    e.target.href = gConfig.front;
	}
	,"directs": function(e){
		var cView = document.cView;
	    e.target.href = gConfig.front+ "filter/direct";
	}
	,"my": function(e){
		var cView = document.cView;
	    e.target.href = gConfig.front+ "filter/discussions";
	}
	,"newDirectInp": function(e){
		var cView = document.cView;
		if (e.target.value){
			var victim =e.target; do victim = victim.parentNode; while(victim.className != "new-post");
			victim.cNodes["edit-buttons"].cNodes["edit-buttons-post"].disabled = false;
			if(e.which == "13") cView.Actions.newDirectAddFeed(e);
			else{
				var txt = e.target.value.toLowerCase();
				var nodeTip = cView.gNodes["friends-tip"].cloneAll();
				var oDest = e.target.dest;
				var pos = oDest;
				for(var idx = 0; idx < txt.length; idx++){
					if (typeof pos[txt.charAt(idx)] !== "undefined")
						pos = pos[txt.charAt(idx)];
					else{
						pos = null;
						break;
					}
				}
				if(pos && pos.arr)pos.arr.forEach(function(user){
					var li = cView.doc.createElement("li");
					li.className = "ft-i";
					li.innerHTML = user;
					li.addEventListener("click",cView["Actions"]["selectFriend"]);
					nodeTip.cNodes["ft-list"].appendChild(li);
				});
				nodeTip.inp = e.target;
				nodeTip.style.top = e.target.offsetTop+e.target.offsetHeight;
				nodeTip.style.left =  e.target.offsetLeft;
				nodeTip.style.width = e.target.clientWidth;
				if((typeof e.target.tip !== "undefined") && e.target.tip.parentNode) {
					cView.doc.body.replaceChild(nodeTip, e.target.tip);
					e.target.tip = nodeTip;
				}else e.target.tip = cView.doc.body.appendChild(nodeTip);
			}
		}else if(e.target.tip){
			cView.doc.body.removeChild(e.target.tip);
			e.target.tip = undefined;
		}


	}
	,"doBan": function(e){
		var cView = document.cView;
		var oReq = new XMLHttpRequest();
		//var nodePopUp = e.target; do nodePopUp = nodePopUp.parentNode; while(nodePopUp.className != "user-popup");
		var nodeUC = e.target.getNode(["p","up-controls"]);
		var username = nodeUC.user;
		var bBan = e.target.checked;
		var nodeParent = e.target.parentNode;
		var loginId = e.target.getNode(["p","up-c-mu"]).loginId;
		var context = cView.contexts[e.target.getNode(["p","up-c-mu"]).domain];
		var spinner = cView.gNodes["spinner"].cloneNode(true);
		nodeParent.replaceChild(spinner,e.target);
		context.api.doBan(context.logins[loginId].token,username, bBan).then(function(){
			var banIds = context.logins[loginId].data.users.banIds;
			if (bBan)banIds.push(cView.gUsers.byName[username].id);
			else{
				var idx = banIds.indexOf(context.gUsers.byName[username].id);
				if (idx != -1 ) banIds.splice(idx, 1);
			}
			cView.saveLogins();
			if (typeof nodeUC.parentNode !== "undefined" )
				cView.Utils.setChild(nodeUC.parentNode, "up-controls", cView.Drawer.genUpControls(username));
		},function(){
			if (typeof nodeUC.parentNode !== "undefined" )
				cView.Utils.setChild(nodeUC.parentNode, "up-controls", cView.Drawer.genUpControls(username));

		});

	}
	,"doUnBan": function(e){
		var cView = document.cView;
		var oReq = new XMLHttpRequest();
		var nodeHost = e.target.getNode(["p","up-controls"]);
		var loginId = e.target.getNode(["p","up-c-mu"]).loginId;
		var context = cView.contexts[e.target.getNode(["p","up-c-mu"]).domain];
		var username = nodeHost.user;
		oReq.open("post", gConfig.serverURL +"users/"+username+"/unban", true);
		oReq.setRequestHeader("X-Authentication-Token", cView.logins[loginId].token);
		var spinner = cView.gNodes["spinner"].cloneNode(true);
		e.target.parentNode.replaceChild(spinner,e.target);
		context.api.doBan(context.logins[loginId].token, username, false).then(function(){
			var banIds = cView.logins[loginId].data.users.banIds;
			var idx = banIds.indexOf(context.gUsers.byName[username].id);
			if (idx != -1 ) banIds.splice(idx, 1);
			cView.localStorage.setItem("gMe",JSON.stringify(cView.logins));
			if (typeof nodeHost.parentNode !== "undefined" )
				cView.Utils.setChild(nodeHost.parentNode, "up-controls", cView.Drawer.genUpControls(username));
		},function(res){	
			console.log(res);
			if (typeof nodeHost.parentNode !== "undefined" )
				cView.Utils.setChild(nodeHost.parentNode, "up-controls", cView.Drawer.genUpControls(username));
		}

		oReq.send();
	}
	,"doBlockCom": function(e){
		var cView = document.cView;
		var action = e.target.checked;
		var nodeUC = e.target.getNode(["p","up-controls"]);
		cView.Common.updateBlockList("blockComments", nodeUC.user, action);
		cView.Drawer.blockComments(nodeUC.user, action);
	}
	,"doBlockPosts": function(e){
		var cView = document.cView;
		var action = e.target.checked;
		var nodeUC = e.target.getNode(["p","up-controls"]);
		cView.Common.updateBlockList("blockPosts", nodeUC.user, action);
		cView.Drawer.blockPosts(nodeUC.user, action);
	}
	,"setRadioOption": function(e){
		var cView = document.cView;
		cView.localStorage.setItem(e.target.name, e.target.value );
	}
	,"unfoldAttImgs": function (e){
		var cView = document.cView;
		var nodeAtts = e.target; do nodeAtts = nodeAtts.parentNode; while(nodeAtts.className != "attachments");
		if(nodeAtts.cNodes["atts-unfold"].cNodes["unfold-action"].value == "true"){
			nodeAtts.cNodes["atts-img"].style.display = "block";
			nodeAtts.cNodes["atts-unfold"].getElementsByTagName("a")[0].innerHTML = '<i class="fa fa-chevron-up fa-2x"></i>';
			nodeAtts.cNodes["atts-unfold"].cNodes["unfold-action"].value = "false";
		}else{
			nodeAtts.cNodes["atts-img"].style.display = "flex";
			nodeAtts.cNodes["atts-unfold"].getElementsByTagName("a")[0].innerHTML = '<i class="fa fa-chevron-down fa-2x"></i>';
			nodeAtts.cNodes["atts-unfold"].cNodes["unfold-action"].value = "true";
		}

	}
	,"ftClose": function(e){
		var cView = document.cView;
		var victim =e.target;while(victim.className != "friends-tip") victim = victim.parentNode;
		victim.inp.tip = undefined;
		cView.doc.body.removeChild(victim);

	}
	,"selectFriend": function(e){
		var cView = document.cView;
		var victim =e.target; do victim = victim.parentNode; while(victim.className != "friends-tip");
		victim.inp.value = e.target.innerHTML;

	}
	,"postDirect": function(e){
		var cView = document.cView;
		var victim =e.target; do victim = victim.parentNode; while(victim.className != "new-post");
		var nodesSenders = victim.getElementsByClassName("new-post-to");	
		for (var idx = 0; idx<nodesSenders.length; idx++){
			var nodeSender = nodesSenders[idx];
			var input = nodeSender.cNodes["new-direct-input"].value;
			if ((input != "") && (typeof cView.gUsers.byName[input] !== "undefined")
			&& cView.gUsers.byName[input].friend 
			&& (cView.gUsers.byName[input].subscriber||cView.gUsers.byName[input].type == "group"))
				nodeSender.feeds.push(input);
			/*
			if (nodeSender.feeds.length) cView.Actions.newPost(e);
			else alert("should have valid recipients");
			*/
		}
		cView.Actions.newPost(e);
	}
	,"logout": function(){
		var cView = document.cView;
		//matrix.ready = 0;
		try{matrix.logout();}catch(e){};
		cView.localStorage.removeItem("gMe");
		cView.Common.deleteCookie(gConfig.tokenPrefix + "authToken");
		location.reload();
	}
	,"newPostRemoveFeed": function(e){
		var cView = document.cView;
		var nodeP = e.target.parentNode.parentNode;
		nodeP.cNodes["new-post-feed-select"][e.target.idx].disabled = false;
		for(var idx = 0; idx < nodeP.feeds.length; idx++){
			if(nodeP.feeds[idx] == e.target.oValue){
				nodeP.feeds.splice(idx,1);
				break;
			}
		}
		e.target.parentNode.removeChild(e.target);
		if(nodeP.feeds.length == 0)
			nodeP.getNode(["p","new-post"],["c","edit-buttons"],["c","edit-buttons-post"]).disabled = true;
	}
	,"newDirectRemoveFeed": function(e){
		var cView = document.cView;
		var nodeP = e.target.parentNode.parentNode;
		for(var idx = 0; idx < nodeP.feeds.length; idx++){
			if(nodeP.feeds[idx] == e.target.oValue){
				nodeP.feeds.splice(idx,1);
				break;
			}
		}
		e.target.parentNode.removeChild(e.target);
		if((nodeP.feeds.length == 0)&&(nodeP.cNodes["new-direct-input"].value == ""))
			nodeP.getNode(["p","new-post"],["c","edit-buttons"],["c","edit-buttons-post"]).disabled = true;
	}
	,"newPostAddFeed": function(e){
		var cView = document.cView;
		e.target.parentNode.cNodes["new-post-feed-select"].hidden = false;
	}
	,"newDirectAddFeed": function(e){
		var cView = document.cView;
		var nodeP = e.target.parentNode;
		var option = nodeP.cNodes["new-direct-input"];
		if (option.value == "") return;
		if(typeof option.tip !== "undefined")cView.doc.body.removeChild(option.tip);
		nodeP.feeds.push(option.value);
		var li = cView.doc.createElement("li");
		li.innerHTML = option.value;
		li.className = "new-post-feed";
		li.oValue = option.value;
		li.idx = e.target.selectedIndex;
		li.addEventListener("click",cView["Actions"]["newDirectRemoveFeed"]);
		nodeP.cNodes["new-post-feeds"].appendChild(li);
		option.value = "";
	}
	,"newPostSelect": function(e){
		var cView = document.cView;
		var option = e.target[e.target.selectedIndex];
		if (option.value == "")return;
		var nodeP = e.target.parentNode;
		if (option.privateFeed ){
			nodeP.isPrivate  = true;
			var ul = cView.doc.createElement("ul");
			ul.className = "new-post-feeds";
			nodeP.replaceChild(ul, nodeP.cNodes["new-post-feeds"]);
			nodeP.cNodes["new-post-feeds"] = ul;
			nodeP.feeds = new Array();
			for(var idx = 0; idx < e.target.length; idx++)
				e.target[idx].disabled = false;
		}
		option.disabled = true;
		nodeP.feeds.push(option.value);
		var li = cView.doc.createElement("li");
		if(option.value == cView.gMe.users.username)li.innerHTML = "My feed";
		else li.innerHTML = "@" + option.value;
		li.className = "new-post-feed";
		li.oValue = option.value;
		li.idx = e.target.selectedIndex;
		li.addEventListener("click", cView["Actions"]["newPostRemoveFeed"]);
		nodeP.cNodes["new-post-feeds"].appendChild(li);
		nodeP.getNode(["p","new-post"],["c","edit-buttons"],["c","edit-buttons-post"]).disabled = false;
	}
	,"evtUserPopup": function(e){
		var cView = document.cView;
		var node = e.target; while(typeof node.userid === "undefined")node = node.parentNode;
		var user = cView.gUsers[node.userid];
		if(cView.doc.getElementById("userPopup" + node.userid))return;
		var nodePopup = cView.Drawer.genUserPopup(node, user);
		nodePopup.style.top = e.pageY;
		nodePopup.style.left = e.pageX;
		nodePopup.style["z-index"] = 1;
		cView.doc.getElementsByTagName("body")[0].appendChild(nodePopup);
	}
	,"upClose": function(e){
		var cView = document.cView;
		var node = e.target; while(node.className != "user-popup")node = node.parentNode;
		node.parentNode.removeChild(node);
	}
	,"destroy": function(e){
		var cView = document.cView;
		if (!e.currentTarget.parentNode)return;
		if (e.eventPhase != Event.AT_TARGET)return;
		e.target.parentNode.removeChild(e.target);
		//e.stopPropagation();

	}
	,"realTimeSwitch": function(e){
		var cView = document.cView;
		if(e.target.checked )cView.localStorage.setItem("rt",1);
		else cView.localStorage.setItem("rt",0);
		if(cView.timeline == "settings") return;
		var bump = e.target.parentNode.cNodes["rt-bump"].value;
		if(e.target.checked && !cView.gRt.on){
			cView.gRt = new RtUpdate(cView.token,bump);
			cView.gRt.subscribe(cView.rt);
		}else if(!e.target.checked){
			if(cView.gRt.on){
				cView.gRt.close();
				cView.gRt = new Object();
			}
		}
	}
	,"goSettings": function (e){
		var cView = document.cView;
	    e.target.href = gConfig.front+"settings";
	}
	,"goRequests": function (e){
		var cView = document.cView;
	    e.target.href = gConfig.front+"requests";
	}
	,"genBlock": function (e){
		var cView = document.cView;
		var node = e.target.parentNode;
		var nodeUC = e.target.getNode(["p","up-controls"]);
		var nodeBlock = cView.gNodes["up-block"].cloneAll();
		nodeBlock.className = "user-popup"; 
		nodeBlock.user = node.user;
		node.appendChild(nodeBlock);
		nodeBlock.style.top =  e.target.offsetTop;
		nodeBlock.style.left = e.target.offsetLeft;
		nodeBlock.style["z-index"] = 2;
		var chkboxes = nodeBlock.getElementsByTagName("input");
		for(var idx = 0; idx < chkboxes.length; idx++){
			var list = cView[chkboxes[idx].value];
			if((typeof list !== "undefined") && (list != null) && (list[cView.gUsers.byName[nodeUC.user].id]>-1))
				chkboxes[idx].checked = true;
		}

	}
	,"updateProfile": function (e){
		var cView = document.cView;
		var nodeProfile = cView.Utils.getNode(e.target,["p","settings-profile"]);
		e.target.disabled = true;
		nodeProfile.getElementsByClassName("spinner")[0].hidden = false;
		var inputs = cView.Utils.getInputsByName(nodeProfile); 
		var id = inputs["id"].value; 
		var oUser = cView.logins[id].data.users;
		oUser.screenName = inputs["screen-name"].value;
		oUser.email = inputs["email"].value;
		oUser.isPrivate = inputs["is-private"].checked?"1":"0";
			oUser.description = nodeProfile.cNodes["gs-descr"].value;
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			var nodeMsg = nodeProfile.getElementsByClassName("update-status")[0];
			e.target.disabled = false;
			nodeProfile.getElementsByClassName("spinner")[0].hidden = true;
			if(oReq.status < 400){
				cView.logins[id].data = JSON.parse(oReq.response);
				nodeMsg.className = "sr-info";
				nodeMsg.innerHTML = "Updated. @"+ oUser.username +"'s feed is <span style='font-weight: bold;'>" + ((oUser.isPrivate == "1")?"private":"public")+ ".</span>";
				cView.Common.refreshLogin(id);
			}else {
				nodeMsg.className = "msg-error";
				nodeMsg.innerHTML = "Got error: ";
				try{ 
					nodeMsg.innerHTML += JSON.parse(oReq.response).err;
				}catch(e) {nodeMsg.innerHTML += "unknown error";};

			}
		}

		oReq.open("put",gConfig.serverURL + "users/" + id ,true);
		oReq.setRequestHeader("Content-type","application/json");
		oReq.setRequestHeader("X-Authentication-Token", cView.logins[id].token);
		oReq.send(JSON.stringify({"user":oUser}));
	}
	,"addAcc": function (e){
		var cView = document.cView;
		var nodePorfiles = cView.Utils.getNode(e.target, ["p","accaunts-settings"],["c","settings-profiles"]);
		nodePorfiles.appendChild(cView.gNodes["settings-login"].cloneAll());
		document.getElementsByClassName("gs-add-acc")[0].hidden = true;
	}
	,"addProfileLogin": function (e){
		var cView = document.cView;
		e.target.disabled = true;
		var nodeLogin = cView.Utils.getNode(e.target, ["p","settings-login"]);
		nodeLogin.getElementsByClassName("spinner")[0].hidden = false;
		var oReq = new XMLHttpRequest();
		var inpsLogin = cView.Utils.getInputsByName(nodeLogin);
		var userid = null;
		oReq.onload = function(){
			var res =  JSON.parse(oReq.response);
			var nodeMsg = nodeLogin.cNodes["msg-error"];
			if(oReq.status < 400){
				nodeMsg.hidden = true;
				if(typeof cView.logins[res.users.id] !== "undefined"){
					cView.doc.getElementsByClassName("gs-add-acc")[0].hidden = false;
					nodeLogin.parentNode.removeChild(nodeLogin);
					return; 
				}
				cView.logins[res.users.id] = new Object();
				cView.logins[res.users.id].token =  res.authToken;
				userid = res.users.id;
				cView.Utils.getWhoami(res.users.id, finish);

			}else {
				nodeMsg.hidden = false;
				nodeMsg.innerHTML = res.err;
				nodeLogin.getElementsByClassName("spinner")[0].hidden = true;
				e.target.disabled = false;
			}
		};
		oReq.open("post", gConfig.serverURL +"session", true);
		oReq.setRequestHeader("X-Authentication-Token", null);
		oReq.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		oReq.send("username="+inpsLogin["login-username"].value+"&password="+inpsLogin["login-password"].value);
		function finish(){
			cView.doc.getElementsByClassName("gs-add-acc")[0].hidden = false;
			nodeLogin.parentNode.replaceChild(cView.Drawer.genProfile(cView.logins[userid].data.users),nodeLogin);

		}
	}
	,"setMainProfile": function(e){
		if(!e.target.checked)return;
		var cView = document.cView;
		//var nodeProf = cView.Utils.getNode(e.target, ["p","settings-profile"]);
		var nodeProf = e.target.getNode(["p","settings-profile"]);
		var id = cView.Utils.getInputsByName(nodeProf)["id"].value;
		cView.token = cView.logins[id].token;
		cView.mainId = id;
		cView.Common.setCookie(gConfig.tokenPrefix + "authToken", cView.token);
	}
	,"logoutAcc": function(e){
		var cView = document.cView;
		var nodeProf = cView.Utils.getNode(e.target, ["p","settings-profile"]);
		var id = cView.Utils.getInputsByName(nodeProf)["id"].value;
		delete cView.logins[id];
		cView.localStorage.setItem("gMe",JSON.stringify(cView.logins));
		nodeProf.parentNode.removeChild(nodeProf);
		if(id == cView.mainId){
			nodeProf = cView.doc.getElementsByClassName("settings-profile")[0];
			if (typeof nodeProf === "undefined") return cView.Actions.logout(e);
			var inputs = cView.Utils.getInputsByName(nodeProf);
			id = inputs["id"].value;
			inputs["is-main"].checked = true;
			cView.mainId = id;
			cView.token = cView.logins[id].token; 
			cView.Common.setCookie(gConfig.tokenPrefix + "authToken", cView.token);
		}
	}
	,"setRTparams": function (e){
		var cView = document.cView;
		var value = e.target.value;
		e.target.parentNode.getElementsByTagName("span")[0].innerHTML = value + " minutes";
		var oRTParams = new Object();
		["rt-bump-int", "rt-bump-cd", "rt-bump-d"].forEach(function(id){
			oRTParams[id] = cView.doc.getElementById(id).value;
		});
		cView.localStorage.setItem("rt_params",JSON.stringify(oRTParams) );
	}
	,"setRTBump": function (e){
		var cView = document.cView;
		var bump = e.target.checked;
		cView.localStorage.setItem("rtbump",bump?1:0);
		cView.doc.getElementById("rt-params").hidden = !bump;
	}
	,"linkPreviewSwitch": function (e){
		var cView = document.cView;
		if(e.target.checked )cView.localStorage.setItem("show_link_preview",1);
		else cView.localStorage.setItem("show_link_preview",0);
	}
	,"srAccept": function (e){
		var cView = document.cView;
		cView.Actions.sendReqResp(e.target, "acceptRequest" );
	}
	,"srReject": function (e){
		var cView = document.cView;
		cView.Actions.sendReqResp(e.target, "rejectRequest" );
	}
	,"sendReqResp": function (node, action){
		var cView = document.cView;
		node.parentNode.hidden = true;
		var host = node.parentNode.parentNode;
		var spinner = cView.gNodes["spinner"].cloneNode(true);
		host.appendChild(spinner);
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(oReq.status < 400){
				host.parentNode.removeChild(host);
				var nodeSR = cView.doc.getElementById("sr-info");
				if(--cView.subReqsCount){
					nodeSR.cNodes["sr-info-a"].innrHTML = "You have "
					+ cView.subReqsCount
					+ " subscription requests to review.";
				}else{
					nodeSR.hidden = true;
					var victim = cView.doc.getElementById("sr-header");
					victim.parentNode.removeChild(victim);
				}
				
			}else {
				host.removeChild(spinner);
				node.parentNode.hidden = false;
			}
		}

		oReq.open("post",gConfig.serverURL
			+ "users/" 
			+ action + "/" 
			+ host.cNodes["sr-user"].value
		,true);
		oReq.setRequestHeader("X-Authentication-Token", cView.logins[host.cNodes["sr-id"].value].token);
		oReq.send();
	}
	,"getauth": function (e){
		var cView = document.cView;
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(this.status < 400){
				cView.Common.setCookie(gConfig.tokenPrefix + "authToken", JSON.parse(this.response).authToken);
				cView.token =  JSON.parse(this.response).authToken;
				///cView.Utils.doc.getElementsByTagName("body")[0].removeChild(cView.Utils.doc.getElementsByClassName("nodeAuth")[0]);
			//	initDoc();

				location.reload();
			}else cView.doc.getElementById("auth-msg").innerHTML = JSON.parse(this.response).err;
		};
		oReq.open("post", gConfig.serverURL +"session", true);
		oReq.setRequestHeader("X-Authentication-Token", null);
		oReq.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		oReq.send("username="+cView.doc.getElementById("a-user").value+"&password="+cView.doc.getElementById("a-pass").value);
	}
	,"showUnfolder":function(e){
		var cView = document.cView;
		var nodeImgAtt = e.target; do nodeImgAtt = nodeImgAtt.parentNode; while(nodeImgAtt.className != "atts-img");
		if(cView.Utils.chkOverflow(nodeImgAtt))
			nodeImgAtt.parentNode.cNodes["atts-unfold"].hidden = false;
	
	}
	,"chngAvatar":function(e){
		var cView = document.cView;
		var Utils = cView.Utils;
		var files = e.target.parentNode.cNodes["edit-buttons-upload"].files; 
		if (!files.length)return;
		e.target.disabled = true;
		var nodeImg = e.target.parentNode.parentNode.cNodes["avatar-img"]
		nodeImg.src = gConfig.static+"throbber-100.gif";
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(oReq.status < 400)getNewWhoami();
		}
		var id = Utils.getInputsByName( Utils.getNode(e.target,["p","settings-profile"]))["id"].value;
		var token = cView.logins[id].token;
		oReq.open("post",gConfig.serverURL + "users/updateProfilePicture", true);
		oReq.setRequestHeader("X-Authentication-Token", token);
		var data = new FormData();
		data.append( "file",files[0]) ;
		oReq.send(data);
		function getNewWhoami() {
			e.target.value = "";
			e.target.disabled = false;
			var oReq = new XMLHttpRequest();
			oReq.onload = function(){
				if(oReq.status < 400){
					cView.logins[id].data = JSON.parse(oReq.response);
					Common.refreshLogin(id);
					nodeImg.src = cView.logins[id].data.users.profilePictureMediumUrl;
				}
			}

			oReq.open("get", gConfig.serverURL +"users/whoami", true);
			oReq.setRequestHeader("X-Authentication-Token", token);
			oReq.send();
		}
	}
	,"addSender": function(e){
		var cView = document.cView;
		if(document.getElementById("add_sender"))return
		var nodePopup = cView.Drawer.genAddSender(function(id){
			if ((typeof id !== "undefined")&&(e.target.ids.indexOf(id) == -1 ) ){
				e.target.ids.push(id);
				cView.updPostTo(cView.logins[id].data,false, cView.logins[id].data.users.username);
				var victim = document.getElementById("add_sender");
				victim.parentNode.removeChild(victim);
			}
		});
		cView.doc.getElementsByTagName("body")[0].appendChild(nodePopup);
		nodePopup.className = "user-popup";
		nodePopup.style.top = e.pageY;
		nodePopup.style.left = e.pageX - nodePopup.clientWidth;
		nodePopup.style["z-index"] = 1;
	}
	,"setSender":function(e){
		e.target.getNode(["p","add-sender-dialog"]).id = e.target.id;
	}
	,"newPostRmSender":function(e){
		var host = e.target.getNode(["p","post-to"]);
		var ids = document.getElementsByClassName("add-sender")[0].ids;
		ids.splice(ids.indexOf(e.target.parentNode.userid),1);
		host.removeChild(e.target.parentNode);
		var rmSenders = host.getElementsByClassName("rm-sender");
		if(rmSenders.length = 1)rmSenders[0].hidden = true;
	}
	,"unfoldUserDet":function(e){
		document.getElementsByClassName("ud-info")[0].style.display = "flex";
		document.getElementsByClassName("ud-fold")[0].hidden = false;
		document.getElementsByClassName("ud-unfold")[0].style.display = "none";
	}
	,"foldUserDet":function(e){
		document.getElementsByClassName("ud-info")[0].style.display = "none";
		document.getElementsByClassName("ud-fold")[0].hidden = true;
		document.getElementsByClassName("ud-unfold")[0].style.display = "block";
	}
	,"goUserSubs": function(e){
		e.target.getNode(["p","uds-subs"]).href = gConfig.front + e.target.getNode(["p","ud-info"], ["c","ud-username"]).value+ "/subscriptions";
	}
	,"goUserSubsc": function(e){
		e.target.getNode(["p","uds-subsc"]).href = gConfig.front + e.target.getNode(["p","ud-info"], ["c","ud-username"]).value+ "/subscribers";
	}
	,"goUserComments": function(e){
		e.target.getNode(["p","uds-com"]).href = gConfig.front + e.target.getNode(["p","ud-info"], ["c","ud-username"]).value+ "/comments";
	}
	,"goUserLikes": function(e){
		e.target.getNode(["p","uds-likes"]).href = gConfig.front + e.target.getNode(["p","ud-info"], ["c","ud-username"]).value+ "/likes";
	}
	,"morePostCtrls":function(e){
		var cView = document.cView;
		var node = e.target.parentNode;
		var nodePost = e.target.getNode(["p","post"]);
		var nodeMore = cView.gNodes["adv-cmts"].cloneAll();
		nodeMore.className = "user-popup"; 
		nodeMore.user = node.user;
		node.appendChild(nodeMore);
		nodeMore.style.top =  e.target.offsetTop;
		nodeMore.style.left = e.target.offsetLeft;
		nodeMore.style["z-index"] = 2;
		var nodeDisCmt = nodeMore.getElementsByClassName("disable-cmts")[0];
		var nodeModCmt = nodeMore.getElementsByClassName("moderate-cmts")[0];

		if((typeof nodePost.rawData.commentsDisabled !== "undefined")
		&& JSON.parse(nodePost.rawData.commentsDisabled)){
			nodeDisCmt.innerHTML = "Enable comments";
			nodeDisCmt.action = false;
		}else nodeDisCmt.action = true;

		if(nodePost.commentsModerated){
			nodeModCmt.innerHTML = "Stop moderating comments";
			nodeModCmt.action = false;
		}else nodeModCmt.action = true;

	}
	,"showDelete": function(e){
		var cView = document.cView;
		var action = e.target.action;
		e.target.getNode(["p","post"]).commentsModerated = action;
		var comments = e.target.getNode(["p","post-body"],["c","comments"]).getElementsByClassName("comment");
		for(var idx = 0; idx < comments.length; idx++){
			var comment = comments[idx];
			if (cView.ids.indexOf(comment.userid) != -1)continue;
			comment.getNode(["c","comment-body"],["c","comment-controls"]).hidden = !action;
		}
		e.target.innerHTML = action?"Stop moderating comments":"Moderate comments";
		e.target.action = !action;

	}
	,"switchCmts": function(e){
		var cView = document.cView;
		var nodePost = e.target.getNode(["p","post"]);
		var post = nodePost.rawData;
		var spinner = cView.gNodes["spinner"].cloneAll(); 
		var parentNode = e.target.parentNode;
		var ctrl = parentNode.replaceChild(spinner, e.target);
		var oParam = {
			"url":gConfig.serverURL +"posts/" + post.id + (e.target.action?"/disableComments":"/enableComments")
			,"token":cView.logins[post.createdBy].token
			,"method":"post"
		}
		cView.Utils.xhrReq(oParam, function(res){
			post.commentsDisabled = ctrl.action?"1":"0";
			ctrl.innerHTML = ctrl.action?"Enable comments":"Disable commnents";
			nodePost.getElementsByClassName("cmts-lock-msg")[0].hidden = !ctrl.action;
			ctrl.action = !ctrl.action;
			parentNode.replaceChild(ctrl, spinner);	
		});
	}
	,"goSetAccounts": function(e){
		e.target.href = gConfig.front+"settings/accounts";
	}
	,"goSetDisplay": function(e){
		e.target.href = gConfig.front+"settings/display";
	}
};
return _Actions;
});
