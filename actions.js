"use strict";
define("./actions",[],function() {
function regenAttaches(host){
	var cView = document.cView;
	if (typeof host.attachs  === "undefined") return;
	var nodesDest = host.childNodes;
	delete host.attP;
	var arrAttP = new Array();
	for (var idx = 0; idx < nodesDest.length; idx++ )(function(domain){
		var context = cView.contexts[domain];
		if (typeof host.attachs[domain] === "undefined") 
			host.attachs[domain] = {
				"arrP":[]
				,"arrId":[]
				,"timestamps":[]
			}
		host.files.forEach(function(oAttach){
			if (host.attachs[domain].timestamps.indexOf(oAttach.timestamp) == -1){
				host.attachs[domain].arrP.push(
					context.api.sendAttachment(
						context.token
						,oAttach.file
						,oAttach.name
					).then(function(data){
						var id = (Array.isArray(data.attachments)?
							data.attachments[0]
							:data.attachments
						).id;
						host.attachs[domain].arrId.push(id);
						return data;
					})
				);
				arrAttP = arrAttP.concat(host.attachs[domain].arrP);
				host.attachs[domain].timestamps.push(oAttach.timestamp);
			}
		});
	})(nodesDest[idx].domain);
	host.attP = cView.Utils._Promise.all(arrAttP).then( function(data){
		if (typeof host.nodeSpinner === "undefined") return data;
		host.nodeInput.value = "";
		host.nodeInput.disabled = false;
		host.buttonPost.disabled = false;
		var payload = data[0].attachments;
		var attachments = Array.isArray(payload)?payload[0]:payload ;
		var nodeAtt = cView.doc.createElement("div");
		nodeAtt.className = "att-img";
		nodeAtt.innerHTML = '<a target="_blank" href="'
			+attachments.url
			+'" border=none ><img src="'
			+attachments.thumbnailUrl
			+'"></a>';
		host.nodeSpinner.parentNode.replaceChild(nodeAtt, host.nodeSpinner);
		delete host.nodeSpinner;
		return data;
	},function(data){
		host.nodeInput.value = "";
		host.nodeInput.disabled = false;
		host.buttonPost.disabled = false;
		if (typeof host.nodeSpinner === "undefined")
			delete host.nodeSpinner;
	});
}
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
		var postsTo = e.target.getNode(["p", "new-post"]).getElementsByClassName("new-post-to");
		var arrPostsTo = new Array(postsTo.length);
		var body = cView.Common.urlsToCanonical(textField.value);
		for (var idx = 0; idx < postsTo.length; idx++)arrPostsTo[idx] = postsTo[idx];
		cView.Utils._Promise.all(arrPostsTo.map(send)).then(function(res){
			var nodeAtt = cView.doc.createElement("div");
			var nodePostTo =  e.target.getNode(["p", "new-post"],["c","post-to"]);
			delete nodePostTo.attachs;
			delete nodePostTo.files;
			delete nodePostTo.attP;
			nodeAtt.className = "attachments";
			textField.parentNode.replaceChild(nodeAtt,
				textField.parentNode.cNodes["attachments"]);
			textField.parentNode.cNodes["attachments"] = nodeAtt;
			textField.value = "";
			textField.disabled = false;
			e.target.disabled = false;
			textField.style.height  = "4em";
			try{ e.target.parentNode.removeChild(nodeSpinner); }
			catch(e){};
			arrPostsTo.forEach(function(postTo,idx){
				res[idx].posts.domain = postTo.domain;
				var context = cView.contexts[postTo.domain];
				cView.updPostTo(context.gMe, true, context.gMe.users.username);
				cView.Common.loadGlobals(res[idx], context);
				var nodePostId = [
					context.domain
					,"post" 
					,res[idx].posts.id
				].join("-");
				if(!cView.doc.getElementById(nodePostId))
					cView.doc.posts.insertBefore(
						cView.Drawer.genPost(res[idx].posts)
						, cView.doc.posts.childNodes[0]
					);
			});
		} ,function(err){
			textField.disabled = false;
			e.target.disabled = false;
			var errmsg = "";
			try{
				e.target.parentNode.removeChild(nodeSpinner );
				errmsg = err.err;
			}catch(e){};
			//TODO
		});

		function send(postTo){
			var context = cView.contexts[postTo.domain];
			var postdata = new Object();
			postdata.meta = new Object();
			postdata.post = new Object();
			postdata.post.body = body;
			postdata.meta.feeds = postTo.feeds ;
			if(typeof postTo.parentNode.attachs !== "undefined")
				postdata.post.attachments = postTo.parentNode.attachs[context.domain].arrId;

			return context.api.sendPost(
				context.logins[postTo.userid].token
				,postdata
				,context.logins[postTo.userid].data.users.username
				,postTo.destType
				,context.timelineId
			);
		}			
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
	,"sendAttachment": function(e){//TODO
		var cView = document.cView;
		e.target.disabled = true;
		var host = e.target.getNode(["p","new-post"],["c","post-to"]);
		var nodeSpinner = cView.doc.createElement("div");
		var buttonPost = host.getNode(["p","new-post"]).getElementsByClassName("edit-buttons-post")[0];
		buttonPost.disabled = true;
		host.buttonPost = buttonPost;
		host.nodeInput = e.target;
		host.nodeSpinner = nodeSpinner;
		nodeSpinner.innerHTML = '<img src="'+gConfig.static+'throbber-100.gif">';
		e.target.parentNode.parentNode.cNodes["attachments"].appendChild(nodeSpinner);
		if (typeof host.files === "undefined") host.files = new Array(); 
		if (typeof host.attachs === "undefined") host.attachs = new Object(); 
		host.files.push({ 
			"name": e.target.value
			,"file":e.target.files[0]
			,"timestamp":Date.now() 
		});
		regenAttaches(host);
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
		var context = cView.contexts[victim.rawData.domain]
		var postCNode = cView.doc.createElement("div");
		postCNode.innerHTML = context.digestText(victim.rawData.body);
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
		var textField = e.target.parentNode.parentNode.cNodes["edit-txt-area"];
		textField.disabled = true;
		e.target.parentNode.replaceChild(cView.gNodes["spinner"].cloneNode(true),e.target.parentNode.cNodes["edit-buttons-cancel"] );
		post.body = cView.Common.urlsToCanonical( textField.value);
		context.api.editPost(
			context.logins[nodePost.rawData.createdBy].token
			,nodePost.rawData.id
			,postdata
		).then(function(res){
			var post = res.posts;
			var postCNode = cView.doc.createElement("div");
			/*
			var cpost = matrix.decrypt(post.body);
			if (typeof cpost.error === "undefined") {
				cpost = JSON.parse(cpost);
				post.body = cpost.payload.data;
				nodePost.sign = cpost.sign;
			}
			*/
			postCNode.innerHTML = context.digestText(post.body);
			postCNode.className = "post-cont";
			nodePost.rawData.body = post.body;
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
		but.parentNode.parentNode.removeChild(but.parentNode);
		context.api.deletePost( 
			context.logins[victim.rawData.createdBy].token
			,victim.rawData.id
		).then(function(){
			cView.doc.hiddenPosts.splice(victim.rawData.idx,1);
			//victim.parentNode.removeChild(victim);
			cView.Drawer.regenHides();
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
		var nodeLikes = cView.Utils.getNode(e.target,["p","post-info"],["c","likes"]);
		var nodePost = cView.Utils.getNode(nodeLikes, ["p","post"]);
		var context = cView.contexts[nodePost.rawData.domain];
		e.target.innerHTML = "";
		e.target.appendChild(cView.gNodes["spinner"].cloneAll());
		context.api.sendLike(context.token, nodePost.rawData.id, e.target.action).then(function(){
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
		var rawData = nodePost.rawData;
		var context = cView.contexts[rawData.domain];
		var span = e.target.getNode(["p","nocomma"]);
		var nodeLikes = span.parentNode.cNodes["comma"];

		if (nodePost.rawData.omittedLikes > 0){
			context.api.getPost(context.token 
				,context.gUsers[rawData.createdBy].username + "/" + rawData.id
				,["likes"]
			).then (function(postUpd){
				span.parentNode.removeChild(span);
				postUpd.users.forEach(cView.Common.addUser, context);
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
		var username = cView.Utils.getNode(e.target,["p","up-controls"]).user;
		var loginId = e.target.getNode(["p","up-c-mu"]).loginId;
		var domain = e.target.getNode(["p","up-controls"]).domain;
		var context = cView.contexts[domain];
		context.api.reqSub( context.logins[loginId].token,username ).then( function(){
			var span = cView.doc.createElement("span");
			span.innerHTML = "Request sent";
			e.target.parentNode.replaceChild(span, e.target);
			context.getWhoami(context.logins[loginId].token);
		} );
	}
	,"evtSubscribe": function(e){
		var cView = document.cView;
		var target = e.target;
		var nodeParent = target.parentNode;
		var spinner = cView.gNodes["spinner"].cloneAll();
		nodeParent.replaceChild(spinner, target);
		var nodeUC = cView.Utils.getNode(nodeParent,["p","up-controls"]);
		var username = nodeUC.user;
		var loginId = nodeParent.getNode(["p","up-c-mu"]).loginId;
		var context = cView.contexts[nodeUC.domain];
		context.api.evtSub( context.logins[loginId].token,username, target.subscribed ).then( function(res){
			context.logins[loginId].data = res;
			cView.Common.refreshLogin(loginId,context);
			cView.Utils.setChild(nodeParent.getNode(["p","up-controls"]).parentNode, "up-controls", cView.Drawer.genUpControls(context.gUsers.byName[username]));
			context.getWhoami(context.logins[loginId].token);
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
		var context = cView.contexts[victim.rawData.domain];
		context.api.sendHide(context.token, victim.rawData.id, action).then(function(){
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
		var nodePost = cView.Utils.getNode(e.target,["p","post"]);
		var postNBody = nodePost.cNodes["post-body"];
		if(postNBody.isBeenCommented === true)return;
		postNBody.isBeenCommented = true;
		var nodeComment = cView.Drawer.genAddComment(cView.contexts[nodePost.rawData.domain]);
		postNBody.cNodes["comments"].appendChild(nodeComment);
		nodeComment.getElementsByClassName("edit-txt-area")[0].focus();
	}
	,"editComment": function(e){
		var cView = document.cView;
		var victim = e.target.getNode(["p", "comment"]);
		var context = cView.contexts[victim.domain];
		var nodeEdit = cView.Drawer.genEditNode(cView.Actions.postEditComment,cView.Actions.cancelEditComment);
		nodeEdit.cNodes["edit-txt-area"].value = context.gComments[victim.rawId].body;
		victim.replaceChild( nodeEdit, victim.cNodes["comment-body"]);
		victim.cNodes["comment-body"] = nodeEdit;
		nodeEdit.className = "comment-body";
		victim.getElementsByClassName("edit-txt-area")[0].focus();
	}
	,"postEditComment": function(e){
		var cView = document.cView;
		var nodeComment = e.target.getNode(["p", "comment"]);
		var postId = nodeComment.getNode(["p","post"]).rawData.id;
		var context = cView.contexts[nodeComment.domain];
		var textField = e.target.parentNode.parentNode.cNodes["edit-txt-area"];
		e.target.disabled = true;
		e.target.parentNode.replaceChild(cView.gNodes["spinner"].cloneNode(true),e.target.parentNode.cNodes["edit-buttons-cancel"] );
		var comment = context.gComments[nodeComment.rawId];
		comment.body = cView.Common.urlsToCanonical(textField.value);
		comment.updatedAt = Date.now();
		var postdata = new Object();
		postdata.comment = comment;
		context.api.editComment( context.logins[comment.createdBy].token
			,comment.id, postdata,postId 
		).then( function(res){
			nodeComment.parentNode.replaceChild(cView.Drawer.genComment.call(context, res.comments),nodeComment);
			context.gComments[comment.id] = res.comments;
		});

	}
	,"cancelEditComment": function(e){
		var cView = document.cView;
		var nodeComment = e.target.getNode(["p","comment"]);
		var context = cView.contexts[nodeComment.getNode(["p","post"]).rawData.domain];
		nodeComment.parentNode.replaceChild(cView.Drawer.genComment.call(context, context.gComments[nodeComment.rawId]),nodeComment);
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
		var postNBody = e.target.getNode(["p", "post-body"]);
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
		e.target.getNode(["p", "comments"]).cnt++;
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
		comment.body = cView.Common.urlsToCanonical(textField.value);
		comment.postId = nodePost.rawData.id;
		comment.createdAt = null;
		comment.createdBy = null;
		comment.updatedAt = null;
		comment.post = null;
		var postdata = new Object();
		postdata.comment = comment;
		var token;
		var nodesSelectUsr = nodeComment.getElementsByClassName("select-user-ctrl")[0].childNodes;
		if(context.ids.length > 1){
			for(var idx = 0; idx < nodesSelectUsr.length; idx++){
				if (nodesSelectUsr[idx].selected){
					token = context.logins[nodesSelectUsr[idx].value].token;
					break;
				}
			}
		}else token = context.token;

		context.api.sendComment(token,postdata).then(function(res){
			var comment = res.comments;
			context.gComments[comment.id] = comment;
			if( nodeComment.parentNode.childNodes.length > 4 )cView.Drawer.addLastCmtButton(nodePost.cNodes["post-body"]);
			if(!document.getElementById(context.domain + "-cmt-" + comment.id))nodeComment.parentNode.replaceChild(cView.Drawer.genComment.call(context, comment),nodeComment);
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
		context.api.deleteComment(token, nodeComment.rawId, nodePost.rawData.id ).then(function(){
			if(nodeComment.parentNode) nodeComment.parentNode.removeChild(nodeComment);
			delete context.gComments[nodeComment.rawId];
		});
/*		
		if(nodePost.isPrivate){
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
		var nodePost = e.target.getNode(["p","post"]);
		var domain = nodePost.rawData.domain;
		var context = cView.contexts[domain];
		var id = nodePost.id;
		var spUnfold = e.target.parentNode.appendChild(cView.doc.createElement("i"));
		spUnfold.className = "fa fa-spinner fa-pulse";
		context.api.getPost(context.token
			, context.gUsers[nodePost.rawData.createdBy].username
				+ "/" + nodePost.rawData.id 
			, ["comments"]
		).then( function(postUpd){
			cView.Common.loadGlobals(postUpd, context);
			postUpd.posts.domain = domain;
			cView.doc.getElementById(id).rawData = postUpd.posts;
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
				var nodeComment = cView.Drawer.genAddComment(context);
				nodePB.cNodes["comments"].appendChild(nodeComment);
				nodeComment.getElementsByClassName("edit-txt-area")[0].value = text;
			}
			cView.Drawer.addLastCmtButton(nodePB);
			nodePB.cNodes["comments"].cnt = postUpd.comments.length;

		},function(res){
			spUnfold.parentNode.removeChild(spUnfold);
			console.log(res);

		});



	}
	,"calcCmtTime": function(e){
		var cView = document.cView;
		if (typeof(e.target.parentNode.parentNode.parentNode.createdAt) !== "undefined" ){
			var absUxTime = e.target.getNode(["p","comment"]).createdAt*1;
			var txtdate = new Date(absUxTime ).toString();

			e.target.title =  cView.Utils.relative_time(absUxTime) + " ("+ txtdate.slice(0, txtdate.indexOf("(")).trim()+ ")";
		}
	}
	,"me": function(e){
		e.target.href = gConfig.front+"filter/me";
	}
	,"home": function(e){
	    e.target.href = gConfig.front;
	}
	,"directs": function(e){
	    e.target.href = gConfig.front+ "filter/direct";
	}
	,"my": function(e){
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
					var li = cView.gNodes["ft-i"].cloneAll();
					li.innerHTML = user;
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
		//var nodePopUp = e.target; do nodePopUp = nodePopUp.parentNode; while(nodePopUp.className != "user-popup");
		var nodeUC = e.target.getNode(["p","up-controls"]);
		var username = nodeUC.user;
		var bBan = e.target.checked;
		var nodeParent = e.target.parentNode;
		var loginId = e.target.getNode(["p","up-c-mu"]).loginId;
		var context = cView.contexts[nodeUC.domain];
		var user = context.gUsers.byName[username];
		var spinner = cView.gNodes["spinner"].cloneNode(true);
		nodeParent.replaceChild(spinner,e.target);
		context.api.doBan(context.logins[loginId].token,username, bBan).then(function(){
			var banIds = context.logins[loginId].data.users.banIds;
			if (bBan)banIds.push(context.gUsers.byName[username].id);
			else{
				var idx = banIds.indexOf(user.id);
				if (idx != -1 ) banIds.splice(idx, 1);
			}
			cView.Common.saveLogins();
			if (typeof nodeUC.parentNode !== "undefined" )
				cView.Utils.setChild(nodeUC.parentNode, "up-controls", cView.Drawer.genUpControls(user));
		},function(){
			if (typeof nodeUC.parentNode !== "undefined" )
				cView.Utils.setChild(nodeUC.parentNode, "up-controls", cView.Drawer.genUpControls(user));

		});

	}
	,"doUnBan": function(e){
		var cView = document.cView;
		var nodeHost = e.target.getNode(["p","up-controls"]);
		var loginId = e.target.getNode(["p","up-c-mu"]).loginId;
		var context = cView.contexts[nodeHost.domain];
		var username = nodeHost.user;
		var user = context.gUsers.byName[username];
		var spinner = cView.gNodes["spinner"].cloneNode(true);
		e.target.parentNode.replaceChild(spinner,e.target);
		context.api.doBan(context.logins[loginId].token, username, false).then(function(){
			var banIds = context.logins[loginId].data.users.banIds;
			var idx = banIds.indexOf(user.id);
			if (idx != -1 ) banIds.splice(idx, 1);
			cView.localStorage.setItem("gMe",JSON.stringify(cView.logins));
			if (typeof nodeHost.parentNode !== "undefined" )
				cView.Utils.setChild(nodeHost.parentNode, "up-controls", cView.Drawer.genUpControls(user));
		},function(res){	
			console.log(res);
			if (typeof nodeHost.parentNode !== "undefined" )
				cView.Utils.setChild(nodeHost.parentNode, "up-controls", cView.Drawer.genUpControls(users));
		});

	}
	,"doBlockCom": function(e){
		var cView = document.cView;
		var nodeUPC = e.target.getNode(["p" ,"up-controls"]);
		cView.Common.updateBlockList("blockComments" ,nodeUPC ,e.target.checked);
		cView.Drawer.blockComments( nodeUPC ,e.target.checked);
	}
	,"doBlockPosts": function(e){
		var cView = document.cView;
		var nodeUPC = e.target.getNode(["p" ,"up-controls"]);
		cView.Common.updateBlockList("blockPosts" ,nodeUPC ,e.target.checked);
		cView.Drawer.blockPosts( nodeUPC,e.target.checked );
	}
	,"setRadioOption": function(e){
		var cView = document.cView;
		cView.localStorage.setItem(e.target.name, e.target.value );
	}
	,"unfoldAttImgs": function (e){
		var cView = document.cView;
		var nodeAtts = cView.Utils.getNode(e.target,["p", "attachments"]);
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
		var victim =e.target.getNode(["p","friends-tip"]);
		victim.inp.tip = undefined;
		cView.doc.body.removeChild(victim);

	}
	,"selectFriend": function(e){
		var cView = document.cView;
		var victim =e.target.getNode(["p","friends-tip"]);
		victim.inp.value = e.target.innerHTML;

	}
	,"postDirect": function(e){
		var cView = document.cView;
		var victim =e.target.getNode(["p","new-post"]);
		var nodesSenders = victim.getElementsByClassName("new-post-to");	
		for (var idx = 0; idx<nodesSenders.length; idx++){
			var nodeSender = nodesSenders[idx];
			var context = cView.contexts[nodeSender.domain];
			var input = nodeSender.cNodes["new-direct-input"].value;
			if ((input != "") && (typeof context.gUsers.byName[input] !== "undefined")
			&& context.gUsers.byName[input].friend 
			&& (context.gUsers.byName[input].subscriber||context.gUsers.byName[input].type == "group"))
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
		cView.localStorage.removeItem("logins");
		Object.keys(cView.contexts).forEach(function(domain){ cView.contexts[domain].token = null;});
		cView.Common.saveLogins();
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
		var context = cView.contexts[nodeP.domain];
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
		if(option.value == context.gMe.users.username)li.innerHTML = "My feed";
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
		var nodePost = node.getNode(["p","post"]);
		var context = cView.contexts[nodePost.rawData.domain];
		var user = context.gUsers[node.userid];
		if(cView.doc.getElementById("userPopup" + context.domain+ node.userid))return;
		var nodePopup = cView.Drawer.genUserPopup(node, user);
		nodePopup.style.top = e.pageY;
		nodePopup.style.left = e.pageX;
		nodePopup.style["z-index"] = 1;
		cView.doc.getElementsByTagName("body")[0].appendChild(nodePopup);
	}
	,"upClose": function(e){
		var cView = document.cView;
		var node = e.target.getNode(["p", "user-popup"]);
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
		var context = cView.contexts[nodeUC.domain];
		nodeBlock.className = "user-popup"; 
		nodeBlock.user = node.user;
		node.appendChild(nodeBlock);
		nodeBlock.style.top =  e.target.offsetTop;
		nodeBlock.style.left = e.target.offsetLeft;
		nodeBlock.style["z-index"] = 2;
		var chkboxes = nodeBlock.getElementsByTagName("input");
		for(var idx = 0; idx < chkboxes.length; idx++){
			var list = cView.blocks[chkboxes[idx].value];
			if((typeof list !== "undefined") 
				&& (typeof list[context.domain]!== "undefined")
				&& (list[context.domain] != null) 
				&& (list[context.domain][context.gUsers.byName[nodeUC.user].id]>-1)
			)
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
		var context = cView.contexts[inputs["domain"].value]; 
		var oUser = context.logins[id].data.users;
		oUser.screenName = inputs["screen-name"].value;
		oUser.email = inputs["email"].value;
		oUser.isPrivate = inputs["is-private"].checked?"1":"0";
		oUser.description = nodeProfile.cNodes["gs-descr"].value;
		var nodeMsg = nodeProfile.getElementsByClassName("update-status")[0];
		context.api.updProfile(context.logins[id].token, id, {"user":oUser})
		.then(function(res){
			e.target.disabled = false;
			nodeProfile.getElementsByClassName("spinner")[0].hidden = true;
			context.logins[id].data = res;
			nodeMsg.className = "sr-info";
			nodeMsg.innerHTML = "Updated. @"+ oUser.username +"'s feed is <span style='font-weight: bold;'>" + ((oUser.isPrivate == "1")?"private":"public")+ ".</span>";
			cView.Common.refreshLogin(id, context);
		}
		,function(res){
			e.target.disabled = false;
			nodeProfile.getElementsByClassName("spinner")[0].hidden = true;
			nodeMsg.className = "msg-error";
			nodeMsg.innerHTML = "Got error: ";
			try{ 
				nodeMsg.innerHTML += res.data.err;
			}catch(e) {nodeMsg.innerHTML += "unknown error";};

			
		});
	}
	,"addAcc": function (e){
		var cView = document.cView;
		var nodePorfiles = e.target.getNode( ["p","accaunts-settings"],["c","settings-profiles"]);
		var nodeLogin = cView.gNodes["settings-login"].cloneAll();
		nodePorfiles.appendChild(nodeLogin);
		document.getElementsByClassName("gs-add-acc")[0].hidden = true;
		Object.keys(cView.contexts).forEach(function(domain,num){
			var nodeIB = cView.gNodes["input-block"].cloneAll();
			nodeIB.cNodes["ib-input"].value = domain;
			nodeIB.cNodes["ib-input"].name = "domain";
			nodeIB.cNodes["ib-span"].innerHTML = domain;
			if(!num) nodeIB.cNodes["ib-input"].checked = true;
			nodeLogin.cNodes["domains"].appendChild(nodeIB); 
		});

	}
	,"addProfileLogin": function (e){
		var cView = document.cView;
		e.target.disabled = true;
		var nodeLogin = cView.Utils.getNode(e.target, ["p","settings-login"]);
		nodeLogin.getElementsByClassName("spinner")[0].hidden = false;
		var inpsLogin = cView.Utils.getInputsByName(nodeLogin);
		var context = cView.contexts[inpsLogin["domain"].value];
		var userid = null;
		var nodeMsg = nodeLogin.cNodes["msg-error"];
		context.api.login(inpsLogin["login-username"].value ,inpsLogin["login-password"].value)
		.then( function(res){
			nodeMsg.hidden = true;
			userid = res.users.id;
			if(!context.ids)context.token = res.authToken;
			if(typeof context.logins[userid] !== "undefined"){
				cView.doc.getElementsByClassName("gs-add-acc")[0].hidden = false;
				nodeLogin.parentNode.removeChild(nodeLogin);
				return; 
			}
			context.logins[userid] = new Object();
			context.logins[userid].token =  res.authToken;
			context.logins[userid].domain = context.domain;
			if (!context.token)context.token = res.authToken;
			cView.Common.saveLogins();
			context.getWhoami(res.authToken).then(finish);

		} ,function(res){
			nodeMsg.hidden = false;
			nodeMsg.innerHTML = res.code+" "+ res.data;
			nodeLogin.getElementsByClassName("spinner")[0].hidden = true;
			e.target.disabled = false;
		});
		function finish(){
			cView.doc.getElementsByClassName("gs-add-acc")[0].hidden = false;
			nodeLogin.parentNode.replaceChild(cView.Drawer.genProfile(context.logins[userid].data.users),nodeLogin);

		}
	}
	,"setMainProfile": function(e){
		if(!e.target.checked)return;
		var cView = document.cView;
		var nodeProf = e.target.getNode(["p","settings-profile"]);
		var inputs = cView.Utils.getInputsByName(nodeProf);
		var id = inputs["id"].value;
		var context = cView.contexts[inputs["domain"].value];
		context.token = context.logins[id].token;
		cView.Common.saveLogins();
	}
	,"logoutAcc": function(e){
		var cView = document.cView;
		var nodeProf = cView.Utils.getNode(e.target, ["p","settings-profile"]);
		var inputs = cView.Utils.getInputsByName(nodeProf);
		var id = inputs["id"].value;
		var context = cView.contexts[inputs["domain"].value];
		var token = context.logins[id].token;
		delete context.logins[id];
		nodeProf.parentNode.removeChild(nodeProf);
		if(token ==  context.token){
			context.token = null;
			nodesProf = cView.doc.getElementsByClassName("settings-profile");
			if (!nodesProf.length) return cView.Actions.logout(e);
			for (var idx = 0; idx < nodesProf.length; idx++ ){
				var nodeProf = nodesProf[idx];
				inputs = cView.Utils.getInputsByName(nodeProf);
				if(context.domin != inputs["domain"].value) continue;
				id = inputs["id"].value;
				inputs["is-main-"+context.domain].checked = true;
				context.token = context.logins[id].token;
				break;
			}
		}
		cView.Common.saveLogins();
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
		var context = cView.contexts[host.cNodes["sr-domain"].value];
		var spinner = cView.gNodes["spinner"].cloneNode(true);
		host.appendChild(spinner);
		context.api.reqResp(context.logins[host.cNodes["sr-id"].value].token
			,host.cNodes["sr-user"].value
			,action
			,host.cNodes["sr-reqid"].value 
		).then(function() {
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
			
		}
		,function(){
			host.removeChild(spinner);
			node.parentNode.hidden = false;
		});

	}
	,"getauth": function (e){
		var cView = document.cView;
		var context = cView.leadContext;
		var oReq = new XMLHttpRequest();
		context.api.login(cView.doc.getElementById("a-user").value,
			cView.doc.getElementById("a-pass").value
		).then(function(data){
				cView.Common.setCookie(gConfig.domains[context.domain].tokenPrefix 
					+ "authToken"
					, data.authToken
				);
				location.reload();
		},function(err){
			cView.doc.getElementById("auth-msg").innerHTML = JSON.parse(err.data).err;
		});
	}
	,"showUnfolder":function(e){
		var cView = document.cView;
		var nodeImgAtt = cView.Utils.getNode(e.target, ["p", "atts-img"]);
		if(cView.Utils.chkOverflow(nodeImgAtt))
			nodeImgAtt.parentNode.cNodes["atts-unfold"].hidden = false;
	
	}
	,"chngAvatar":function(e){
		var cView = document.cView;
		var Utils = cView.Utils;
		var files = e.target.parentNode.cNodes["edit-buttons-upload"].files; 
		if (!files.length)return;
		e.target.disabled = true;
		var nodeImg = e.target.getNode(["p","chng-avatar"],["c","sp-avatar-img"]);
		nodeImg.src = gConfig.static+"throbber-100.gif";
		var inputs = Utils.getInputsByName( e.target.getNode(["p","settings-profile"]));
		var id = inputs["id"].value;
		var context = cView.contexts[inputs["domain"].value];
		var token = context.logins[id].token;
		context.api.chngAvatar(token, files[0]).then( function() {
			e.target.value = "";
			e.target.disabled = false;
			context.getWhoami(token).then(function(res){
				nodeImg.src = context.logins[id].data.users.profilePictureMediumUrl;
			});
		});
	}
	,"addSender": function(e){
		var cView = document.cView;
		if(document.getElementById("add_sender"))return
		var nodePopup = cView.Drawer.genAddSender(function(id,context){
			if ((typeof id !== "undefined")&&(e.target.ids.indexOf(id) == -1 ) ){
				e.target.ids.push(id);
				cView.updPostTo(context.logins[id].data,false, context.logins[id].data.users.username);
				var victim = document.getElementById("add_sender");
				victim.parentNode.removeChild(victim);
				regenAttaches(document.getElementsByClassName("post-to")[0]);
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
		regenAttaches(host);
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
		e.target.getNode(["p","uds-subs"]).href =document.location + "/subscriptions";
	}
	,"goUserSubsc": function(e){
		e.target.getNode(["p","uds-subsc"]).href = document.location + "/subscribers";
	}
	,"goUserComments": function(e){
		e.target.getNode(["p","uds-com"]).href = document.location + "/comments";
	}
	,"goUserLikes": function(e){
		e.target.getNode(["p","uds-likes"]).href = document.location +"/likes";
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
		var context = cView.contexts[post.domain];
		var spinner = cView.gNodes["spinner"].cloneAll(); 
		var parentNode = e.target.parentNode;
		var ctrl = parentNode.replaceChild(spinner, e.target);
		context.api.switchCmts(context.logins[post.createdBy].token
			,post.id
			,e.target.action )
		.then(function(res){
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
