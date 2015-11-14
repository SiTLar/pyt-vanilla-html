"use strict";
define("Actions",[],function() {
function _Actions(d, v,n,u,dr){
	this.doc = d;
	this.cView = v;
	this.gNodes = n;
	this.Utils = u;
	this.Drawer = dr; 
};
_Actions.prototype = {
	constructor:_Actions
	,"newPost": function(e){
		var Actions = this;
		var textField = e.target.parentNode.parentNode.cNodes["edit-txt-area"];
		textField.disabled = true;
		e.target.disabled = true;
		var nodeSpinner = e.target.parentNode.appendChild(Actions.gNodes["spinner"].cloneNode(true));
		if(textField.pAtt)textField.pAtt.then(send);
		else send();
		function send(){
			var postdata = new Object();
			var post = new Object();
			var postTo = e.target.parentNode.parentNode.cNodes["new-post-to"];
			postdata.meta = new Object();
			postdata.meta.feeds = postTo.feeds ;
			var oReq = new XMLHttpRequest();
			var onload = function(){
				if(oReq.status < 400){
					var nodeAtt = Actions.doc.createElement("div");
					nodeAtt.className = "attachments";
					textField.parentNode.replaceChild(nodeAtt,
						textField.parentNode.cNodes["attachments"]);
					textField.parentNode.cNodes["attachments"] = nodeAtt;
					textField.value = "";
					textField.disabled = false;
					delete textField.pAtt;
					delete textField.attachments;
					postTo.feeds = new Array();
					Actions.cView.regenPostTo();
					e.target.disabled = false;
					textField.style.height  = "4em";
					e.target.parentNode.removeChild(nodeSpinner);
					var res = JSON.parse(oReq.response);
					Actions.Drawer.loadGlobals(res);
					if(!Actions.doc.getElementById(res.posts.id))Actions.doc.posts.insertBefore(Actions.Drawer.genPost(res.posts), Actions.doc.posts.childNodes[0]);
				}else{
					textField.disabled = false;
					e.target.disabled = false;
					e.target.parentNode.removeChild(nodeSpinner );
					var errmsg = "";
					try{
						var eresp = JSON.parse(oReq.response);
						errmsg = eresp.err;
					}catch(e){};
					alert("Error #"+oReq.status+": "+oReq.statusText+" "+errmsg) ;
				}
			};
			if(textField.attachments) post.attachments = textField.attachments;
			postdata.post = post;
			if(postTo.isPrivate){
				oReq.open("post",matrix.cfg.srvurl+"post", true);
				oReq.setRequestHeader("x-content-type", "post");
				oReq.setRequestHeader("Content-type","text/plain");
				oReq.onload = onload;
				var payload =  {
					"feed":postTo.feeds[0],
					"type":"post",
					"author":Actions.cView.gMe.users.username,
					"data":textField.value,
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
			}else{
				oReq.open("post",gConfig.serverURL + "posts", true);
				oReq.onload = onload;
				oReq.setRequestHeader("Content-type","application/json");
				oReq.setRequestHeader("X-Authentication-Token",
					Actions.cView.token);
				if (textField.value == ""){
					textField.disabled = false;
					e.target.disabled = false;
					e.target.parentNode.removeChild(nodeSpinner );
					alert("you should provide some text");
					return;
				}
				post.body = textField.value;
				oReq.send(JSON.stringify(postdata));
			}
		}
	}
	,"sendAttachment": function(e){
		var Actions = this;
		e.target.disabled = true;
		var textField = e.target.parentNode.parentNode.cNodes["edit-txt-area"];
		var nodeSpinner = Actions.doc.createElement("div");
		nodeSpinner.innerHTML = '<img src="'+gConfig.static+'throbber-100.gif">';
		e.target.parentNode.parentNode.cNodes["attachments"].appendChild(nodeSpinner);
		textField.pAtt = new Promise(function(resolve,reject){
			var oReq = new XMLHttpRequest();
			oReq.onload = function(){
				if(this.status < 400){
					e.target.value = "";
					e.target.disabled = false;
					var attachments = JSON.parse(this.response).attachments;
					var nodeAtt = Actions.doc.createElement("div");
					nodeAtt.className = "att-img";
					nodeAtt.innerHTML = '<a target="_blank" href="'+attachments.url+'" border=none ><img src="'+attachments.thumbnailUrl+'"></a>';
					nodeSpinner.parentNode.replaceChild(nodeAtt, nodeSpinner);
					if (typeof(textField.attachments) === "undefined" ) textField.attachments = new Array();
					textField.attachments.push(attachments.id);
					resolve();

				}else reject(this.status);
			};

			oReq.open("post",gConfig.serverURL + "attachments", true);
			oReq.setRequestHeader("X-Authentication-Token", Actions.cView.token);
			var data = new FormData();
			data.append( "name", "attachment[file]");
			data.append( "attachment[file]", e.target.files[0], e.target.value);
			oReq.send(data);
		});
	}
	,"editPost": function(e) {
		var Actions = this;
	var victim = e.target; do victim = victim.parentNode; while(victim.className != "post");
	var nodeEdit = Actions.Drawer.genEditNode(postEditedPost,cancelEditPost);
	nodeEdit.cNodes["edit-txt-area"].value = victim.rawData.body;
	victim.cNodes["post-body"].replaceChild( nodeEdit, victim.cNodes["post-body"].cNodes["post-cont"]);
}
	,"cancelEditPost": function(e){
		var Actions = this;
		 var victim = e.target; do victim = victim.parentNode; while(victim.className != "post");
		 var postCNode = Actions.doc.createElement("div");
		 postCNode.innerHTML = victim.rawData.body;
		 postCNode.className = "post-cont";
		 victim.cNodes["post-body"].replaceChild(postCNode,e.target.parentNode.parentNode );
		 victim.cNodes["post-body"].cNodes["post-cont"] = postCNode;

	}
	,"postEditedPost": function(e){
		var Actions = this;
		var nodePost =e.target; do nodePost = nodePost.parentNode; while(nodePost.className != "post");
		var oReq = new XMLHttpRequest();
		e.target.disabled = true;
		oReq.onload = function(){
			if(this.status < 400){
				var post = JSON.parse(oReq.response).posts;
				var postCNode = Actions.doc.createElement("div");
				var cpost = matrix.decrypt(post.body);
				if (typeof cpost.error === "undefined") {
					cpost = JSON.parse(cpost);
					post.body = cpost.payload.data;
					nodePost.sign = cpost.sign;
				}
				postCNode.innerHTML = autolinker.link(post.body.replace(/\n/g,"").replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
				postCNode.className = "post-cont";
				nodePost.rawData = post;
				nodePost.cNodes["post-body"].replaceChild(postCNode,e.target.parentNode.parentNode );
				nodePost.cNodes["post-body"].cNodes["post-cont"] = postCNode;
			}
		};

		var post = new Object();
		post.createdAt = nodePost.rawData.createdAt;
		post.createdBy = nodePost.rawData.createdBy;
		post.updatedAt = Date.now();
		post.attachments = nodePost.rawData.attachments;
		var postdata = new Object();
		postdata.post = post;
		e.target.parentNode.parentNode.cNodes["edit-txt-area"].disabled = true;

		e.target.parentNode.replaceChild(Actions.gNodes["spinner"].cloneNode(true),e.target.parentNode.cNodes["edit-buttons-cancel"] );
		var text = e.target.parentNode.parentNode.cNodes["edit-txt-area"].value;
		if(nodePost.isPrivate){
			oReq.open("put",matrix.cfg.srvurl+"edit", true);
			oReq.setRequestHeader("x-content-type", "post");
			oReq.setRequestHeader("Content-type","application/json");
			//oReq.onload = onload;
			var payload =  {
				"feed":nodePost.feed,
				"type":"post",
				"author":Actions.cView.gMe.users.username,
				"data":text,
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
		}else{
			post.body =  text;
			oReq.open("put",gConfig.serverURL + "posts/"+nodePost.id, true);
			oReq.setRequestHeader("X-Authentication-Token", Actions.cView.token);
			oReq.setRequestHeader("Content-type","application/json");
			oReq.send(JSON.stringify(postdata));
		}
	}
	,"deletePost": function(e){
		var Actions = this;
		var victim =e.target; do victim = victim.parentNode; while(victim.className != "post");
		deleteNode(victim, doDeletePost);
	}
	,"doDeletePost": function(but){
		var Actions = this;
		var victim = but.node;
		but.parentNode.parentNode.removeChild(but.parentNode);
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(this.status < 400){
				Actions.doc.hiddenPosts.splice(victim.rawData.idx,1);
				//victim.parentNode.removeChild(victim);
				Actions.Drawer.regenHides();
			}
		};
		if(victim.isPrivate){
			oReq.open("delete",matrix.cfg.srvurl+"delete",true);
			oReq.setRequestHeader("x-content-id", victim.id);
			oReq.setRequestHeader("x-access-token", matrix.mkOwnToken(victim.sign));
			oReq.setRequestHeader("x-content-type", "post");
			oReq.send();
		}else{
			oReq.open("delete",gConfig.serverURL + "posts/"+victim.id, true);
			oReq.setRequestHeader("X-Authentication-Token", Actions.cView.token);
			oReq.setRequestHeader("Content-type","application/json");
			oReq.send();
		}
	}
	,"postLike": function(e){
		var Actions = this;
		var oReq = new XMLHttpRequest();
		var nodeLikes = e.target.parentNode.parentNode.parentNode.cNodes["likes"];
		var nodePost =nodeLikes; do nodePost = nodePost.parentNode; while(nodePost.className != "post");
		oReq.onload = function(){
			if(this.status < 400){
				if(e.target.action){
					var idx;
					var likesUL;
					if (!nodeLikes.childNodes.length){
						nodeLikes.appendChild(Actions.gNodes["likes-smile"].cloneNode(true));
						likesUL = Actions.doc.createElement( "span");
						likesUL.className ="comma";
						var suffix = Actions.doc.createElement("span");
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
					var nodeLike = Actions.doc.createElement("span");
					nodeLike.className = "p-timeline-user-like";
					nodeLike.innerHTML = Actions.cView.gUsers[Actions.cView.gMe.users.id].link;
					if(likesUL.childNodes.length)likesUL.insertBefore(nodeLike, likesUL.childNodes[0]);
					else likesUL.appendChild(nodeLike);
					e.target.parentNode.parentNode.parentNode.myLike = nodeLike;
					if(!Array.isArray(nodePost.rawData.likes)) nodePost.rawData.likes = new Array();
					nodePost.rawData.likes.unshift(Actions.cView.gMe.users.id);
				}else{
					nodePost.rawData.likes.splice(nodePost.rawData.likes.indexOf(Actions.cView.gMe.users.id), 1) ;
					var myLike = e.target.parentNode.parentNode.parentNode.myLike;
					likesUL = myLike.parentNode;
					likesUL.removeChild(myLike);
				Actions.Drawer.genLikes(nodePost);

				/*
					if (likesUL.childNodes.length < 2){
						var nodePI = nodeLikes.parentNode;
						nodePI.cNodes["likes"] = Actions.doc.createElement("div");
						nodePI.cNodes["likes"].className = "likes";
						nodePI.replaceChild(nodePI.cNodes["likes"], nodeLikes);
					}
					*/
				 }
				e.target.innerHTML=e.target.action?"Un-like":"Like";
				e.target.action = !e.target.action;
			}else e.target.innerHTML= !e.target.action?"Un-like":"Like";
		}


			oReq.open("post",gConfig.serverURL + "posts/"+ e.target.parentNode.parentNode.parentNode.parentNode.parentNode.id+"/"+(e.target.action?"like":"unlike"), true);
			oReq.setRequestHeader("X-Authentication-Token", Actions.cView.token);
			oReq.send();
			e.target.innerHTML = "";
			e.target.appendChild(Actions.gNodes["spinner"].cloneAll());

	}
	,"unfoldLikes": function(id){
		var Actions = this;
		var post = Actions.doc.getElementById(id).rawData;
		var span  = Actions.doc.getElementById(id+"-unl");
		var nodeLikes = span.parentNode.cNodes["comma"];

		if (post.omittedLikes > 0){
			var oReq = new XMLHttpRequest();
			oReq.onload = function(){
				if(oReq.status < 400){
					span.parentNode.removeChild(span);
					var postUpd = JSON.parse(this.response);
					post.likes = postUpd.posts.likes;
					postUpd.users.forEach(Actions.Utils.addUser);
					Actions.doc.getElementById(id).rawData = post;
					Actions.Drawer.writeAllLikes(id, nodeLikes);
				}else{
					console.log(oReq.toString());

				};
			};
			oReq.open("get",gConfig.serverURL + "posts/"+post.id+"?maxComments=0&maxLikes=all", true);
			oReq.setRequestHeader("X-Authentication-Token", Actions.cView.token);
			oReq.send();

		}else Actions.Drawer.writeAllLikes(id, nodeLikes);
	}
	,"getUsername": function(e){
		var Actions = this;
		var node = e.target; do node = node.parentNode; while(typeof node.user === "undefined");
		if ( Actions.cView.cTxt == null ) return;
		Actions.cView.cTxt.value += "@" + node.user;
	}
	,"reqSubscription": function(e){
		var Actions = this;
		var oReq = new XMLHttpRequest();
		var username = e.target.parentNode.user;
		oReq.open("post", gConfig.serverURL +"users/"+username+"/sendRequest/", true);
		oReq.setRequestHeader("X-Authentication-Token", Actions.cView.token);
		oReq.onload = function(){
			if(oReq.status < 400) {
				var span = Actions.doc.createElement("span");
				span.innerHTML = "Request sent";
				e.target.parentNode.replaceChild(span, e.target);
			}
		}

		oReq.send();

	}
	,"subscribe": function(e){
		var Actions = this;
		var oReq = new XMLHttpRequest();
		var username = e.target.parentNode.user;
		oReq.open("post", gConfig.serverURL +"users/"+username+(e.target.subscribed?"/unsubscribe":"/subscribe"), true);
		oReq.setRequestHeader("X-Authentication-Token", Actions.cView.token);
		oReq.onload = function(){
			if(oReq.status < 400) {
				Actions.cView.gMe = JSON.parse(oReq.response);
				Actions.cView.localStorage.setItem("Actions.cView.gMe",JSON.stringify(Actions.cView.gMe));
				Actions.cView.gUsers.byName[username].friend = !e.target.subscribed;
				setChild(e.target.parentNode.parentNode, "up-controls", Actions.Drawer.genUpControls(username));
			}
		}

		oReq.send();
	}
	,"showHidden": function(e){
		var Actions = this;
		if(e.target.action){
			if(!Actions.doc.hiddenCount)return;
			var nodeHiddenPosts = Actions.doc.createElement("div");
			nodeHiddenPosts.id = "hidden-posts";
			Actions.doc.hiddenPosts.forEach(function(oHidden){if(oHidden.is)nodeHiddenPosts.appendChild(Actions.Drawer.genPost(oHidden.data));});
			e.target.parentNode.parentNode.insertBefore(nodeHiddenPosts , e.target.parentNode.nextSibling);
			e.target.innerHTML =  "Collapse "+ Actions.doc.hiddenCount + " hidden entries";
		}else{
			var nodeHiddenPosts = Actions.doc.getElementById("hidden-posts");
			if (nodeHiddenPosts) nodeHiddenPosts.parentNode.removeChild(nodeHiddenPosts);
			if (Actions.doc.hiddenCount) e.target.innerHTML = "Show "+ Actions.doc.hiddenCount + " hidden entries";
			else e.target.innerHTML = "";
		}
		e.target.action = !e.target.action;
	}
	,"postHide": function(e){
		var Actions = this;
		var victim = e.target; do victim = victim.parentNode; while(victim.className != "post");
		var oReq = new XMLHttpRequest();
		var action = e.target.action;
		oReq.onload = function(){
			if(this.status < 400){
				doHide(victim, action, "user");
			};
		}
			oReq.open("post",gConfig.serverURL + "posts/"+ victim.id+"/"+(action?"hide":"unhide"), true);
			oReq.setRequestHeader("X-Authentication-Token", Actions.cView.token);
			oReq.send();
	}
	,"doHide": function(victim, action){
		var Actions = this;
		var nodeHide = victim.cNodes["post-body"].cNodes["post-info"].cNodes["post-controls"].nodeHide;
		if(action != nodeHide.action) return;
		victim.rawData.isHidden = action;
		nodeHide.action = !action;
		var nodeShow = Actions.doc.getElementsByClassName("show-hidden")[0]
		if (!nodeShow){
			nodeShow = Actions.gNodes["show-hidden"].cloneAll();
			nodeShow.cNodes["href"].action = true;
			Actions.doc.getElementById("content").appendChild(nodeShow);
		}
		var aShow =  nodeShow.cNodes["href"];
		if(action){
			Actions.doc.hiddenPosts[victim.rawData.idx].is  = true;
			victim.parentNode.removeChild(victim);
			Actions.doc.hiddenCount++;
			aShow.action = false;
			aShow.dispatchEvent(new Event("click"));
		}else{
			var count = 0;
			var idx = victim.rawData.idx;
			do if(Actions.doc.hiddenPosts[idx--].is)count++;
			while ( idx >0 );
			if ((victim.rawData.idx - count+1) >= Actions.doc.posts.childNodes.length )Actions.doc.posts.appendChild(victim);
			else Actions.doc.posts.insertBefore(victim, Actions.doc.posts.childNodes[victim.rawData.idx - count+1]);
			nodeHide.innerHTML = "Hide";
			Actions.doc.hiddenPosts[victim.rawData.idx].is = false;
			Actions.doc.hiddenCount--;
			if(Actions.doc.hiddenCount) aShow.innerHTML = "Collapse "+ Actions.doc.hiddenCount + " hidden entries";
			else aShow.dispatchEvent(new Event("click"));
		}

	}
	,"addComment": function(e){
		var Actions = this;
		var postNBody = e.target; do postNBody = postNBody.parentNode; while(postNBody.className != "post-body");
		if(postNBody.isBeenCommented === true)return;
		postNBody.isBeenCommented = true;
		var nodeComment = Actions.gNodes["comment"].cloneAll();
		nodeComment.cNodes["comment-body"].appendChild(Actions.Drawer.genEditNode(postNewComment,cancelNewComment));
		nodeComment.userid = Actions.cView.gMe.users.id;
		postNBody.cNodes["comments"].appendChild(nodeComment);
		nodeComment.getElementsByClassName("edit-txt-area")[0].focus();
	}
	,"editComment": function(e){
		var Actions = this;
		var victim = e.target; do victim = victim.parentNode; while(victim.className != "comment");
		var nodeEdit = Actions.Drawer.genEditNode(postEditComment,cancelEditComment);
		nodeEdit.cNodes["edit-txt-area"].value = Actions.cView.gComments[victim.id].body;
		victim.replaceChild( nodeEdit, victim.cNodes["comment-body"]);
		victim.cNodes["comment-body"] = nodeEdit;
		nodeEdit.className = "comment-body";
		victim.getElementsByClassName("edit-txt-area")[0].focus();
	}
	,"postEditComment": function(e){
		var Actions = this;
		var nodeComment = e.target; do nodeComment = nodeComment.parentNode; while(nodeComment.className != "comment");
		var nodePost =nodeComment; do nodePost = nodePost.parentNode; while(nodePost.className != "post");
		var textField = e.target.parentNode.parentNode.cNodes["edit-txt-area"];
		e.target.disabled = true;
		e.target.parentNode.replaceChild(Actions.gNodes["spinner"].cloneNode(true),e.target.parentNode.cNodes["edit-buttons-cancel"] );
		if(nodePost.isPrivate){
			sendEditedPrivateComment(textField, nodeComment, nodePost);
			return;
		}
		var comment = Actions.cView.gComments[nodeComment.id];
		comment.body = textField.value ;
		comment.updatedAt = Date.now();
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(this.status < 400){
				var comment = JSON.parse(this.response).comments;
				nodeComment.parentNode.replaceChild(Actions.Drawer.genComment(comment),nodeComment);
				Actions.cView.gComments[comment.id] = comment;

			}
		};

		oReq.open("put",gConfig.serverURL + "comments/"+comment.id, true);
		oReq.setRequestHeader("X-Authentication-Token", Actions.cView.token);
		oReq.setRequestHeader("Content-type","application/json");
		var postdata = new Object();
		postdata.comment = comment;
		postdata.users = new Array(Actions.cView.gMe);
		oReq.send(JSON.stringify(postdata));

	}
	,"cancelEditComment": function(e){
		var Actions = this;
		var nodeComment = e.target; do nodeComment = nodeComment.parentNode; while(nodeComment.className != "comment");
		 nodeComment.parentNode.replaceChild(Actions.Drawer.genComment( Actions.cView.gComments[nodeComment.id]),nodeComment);
	}
	,"processText": function(e) {
		var Actions = this;
		Actions.cView.cTxt = e.target;
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
		var Actions = this;
		var postNBody = e.target; do postNBody = postNBody.parentNode; while(postNBody.className != "post-body");
		postNBody.isBeenCommented = false;
		if(typeof postNBody.bumpLater !== "undefined")setTimeout(postNBody.bumpLater, 1000);
		var nodeComment =e.target; do nodeComment = nodeComment.parentNode; while(nodeComment.className != "comment");
		nodeComment.parentNode.removeChild(nodeComment);

	}
	,"postNewComment": function(e){
		var Actions = this;
		e.target.disabled = true;
		e.target.parentNode.replaceChild(Actions.gNodes["spinner"].cloneNode(true),e.target.parentNode.cNodes["edit-buttons-cancel"] );
		sendComment(e.target.parentNode.previousSibling);
		var nodeComments =e.target; do nodeComments = nodeComments.parentNode; while(nodeComments.className != "comments");
		nodeComments.cnt++;
	}
	,"deleteComment": function(e){
		var Actions = this;
		var nodeComment = e.target; do nodeComment = nodeComment.parentNode; while(nodeComment.className != "comment");
		deleteNode(nodeComment,doDeleteComment);
	}
	,"deleteNode": function(node,doDelete){
		var Actions = this;
		var nodeConfirm = Actions.doc.createElement("div");
		var butDelete = Actions.doc.createElement("button");
		butDelete.innerHTML = "delete";
		butDelete.node = node;
		butDelete.onclick = function(){doDelete(butDelete);};
		var butCancel0 = Actions.doc.createElement("button");
		butCancel0.innerHTML = "cancel";
		butCancel0.onclick = function (){deleteCancel(nodeConfirm)};
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
		var Actions = this;
		nodeConfirm.node.hidden = false;
		nodeConfirm.parentNode.removeChild(nodeConfirm);
	}
	,"doDeleteComment": function(but){
		var Actions = this;
		var nodeComment = but.node;
		var nodePost =nodeComment; do nodePost = nodePost.parentNode; while(nodePost.className != "post");
		but.parentNode.parentNode.removeChild(but.parentNode);
		but.node.hidden = false;
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(this.status < 400){
				if(nodeComment.parentNode) nodeComment.parentNode.removeChild(nodeComment);
				delete Actions.cView.gComments[nodeComment.id];
			}
		};
		if(nodePost.isPrivate){
			oReq.open("delete",matrix.cfg.srvurl+"delete",true);
			oReq.setRequestHeader("x-content-id", nodeComment.id);
			oReq.setRequestHeader("x-access-token", matrix.mkOwnToken(nodeComment.sign));
			oReq.setRequestHeader("x-content-type", "comment");
			oReq.send();
		}else{
			oReq.open("delete",gConfig.serverURL + "comments/"+nodeComment.id, true);
			oReq.setRequestHeader("X-Authentication-Token", Actions.cView.token);
			oReq.setRequestHeader("Content-type","application/json");
			oReq.send();
		}
	}
	,"unfoldComm": function(id){
		var Actions = this;
		var post = Actions.doc.getElementById(id).rawData;
		var oReq = new XMLHttpRequest();
		var spUnfold = Actions.doc.getElementById(id+"-unc").parentNode.appendChild(Actions.doc.createElement("i"));
		spUnfold.className = "fa fa-spinner fa-pulse";
		oReq.onload = function(){
			if(oReq.status < 400){
				var postUpd = JSON.parse(this.response);
				Actions.Drawer.loadGlobals(postUpd);
				Actions.doc.getElementById(id).rawData = post;
				var nodePB = Actions.doc.getElementById(id).cNodes["post-body"];
				nodePB.isBeenCommented = false;
				if(typeof nodePB.bumpLater !== "undefined")setTimeout(postPB.bumpLater, 1000);
				nodePB.removeChild(nodePB.cNodes["comments"]);
				nodePB.cNodes["comments"] = Actions.doc.createElement("div");
				nodePB.cNodes["comments"].className = "comments";

				postUpd.comments.forEach(function(cmt){Actions.cView.gComments[cmt.id] =cmt; nodePB.cNodes["comments"].appendChild(Actions.Drawer.genComment(cmt))});
				nodePB.appendChild(nodePB.cNodes["comments"]);
				Actions.Drawer.addLastCmtButton(nodePB);
				nodePB.cNodes["comments"].cnt = postUpd.comments.length;

			}else{
				spUnfold.parentNode.removeChild(spUnfold);
				console.log(oReq.toString());

			};
		};

		oReq.open("get",gConfig.serverURL + "posts/"+post.id+"?maxComments=all&maxLikes=0", true);
		oReq.setRequestHeader("X-Authentication-Token", Actions.cView.token);
		oReq.send();


	}
	,"calcCmtTime": function(e){
		var Actions = this;
		if (typeof(e.target.parentNode.parentNode.parentNode.createdAt) !== "undefined" ){
			var absUxTime = e.target.parentNode.parentNode.parentNode.createdAt*1;
			var txtdate = new Date(absUxTime ).toString();

			e.target.title =  relative_time(absUxTime) + " ("+ txtdate.slice(0, txtdate.indexOf("(")).trim()+ ")";
		}
	}
	,"me": function(e){
		var Actions = this;
		e.target.href = gConfig.front+Actions.cView.gMe["users"]["username"];
	}
	,"home": function(e){
		var Actions = this;
	    e.target.href = gConfig.front;
	}
	,"directs": function(e){
		var Actions = this;
	    e.target.href = gConfig.front+ "filter/direct";
	}
	,"my": function(e){
		var Actions = this;
	    e.target.href = gConfig.front+ "filter/discussions";
	}
	,"newDirectInp": function(e){
		var Actions = this;
		if (e.target.value){
			var victim =e.target; do victim = victim.parentNode; while(victim.className != "new-post");
			victim.cNodes["edit-buttons"].cNodes["edit-buttons-post"].disabled = false;
			if(e.which == "13") newDirectAddFeed(e);
			else{
				var txt = e.target.value.toLowerCase();
				var nodeTip = Actions.gNodes["friends-tip"].cloneAll();
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
				if(pos)pos.arr.forEach(function(user){
					var li = Actions.doc.createElement("li");
					li.className = "ft-i";
					li.innerHTML = user;
					li.addEventListener("click",selectFriend);
					nodeTip.cNodes["ft-list"].appendChild(li);
				});
				nodeTip.inp = e.target;
				nodeTip.style.top = e.target.offsetTop+e.target.offsetHeight;
				nodeTip.style.left =  e.target.offsetLeft;
				nodeTip.style.width = e.target.clientWidth;
				if((typeof e.target.tip !== "undefined") && e.target.tip.parentNode) {
					Actions.doc.body.replaceChild(nodeTip, e.target.tip);
					e.target.tip = nodeTip;
				}else e.target.tip = Actions.doc.body.appendChild(nodeTip);
			}
		}else if(e.target.tip){
			Actions.doc.body.removeChild(e.target.tip);
			e.target.tip = undefined;
		}


	}
	,"doBan": function(e){
		var Actions = this;
		var oReq = new XMLHttpRequest();
		var nodePopUp = e.target; do nodePopUp = nodePopUp.parentNode; while(nodePopUp.className != "user-popup");
		var username = nodePopUp.user;
		var bBan = e.target.checked;
		var nodeParent = e.target.parentNode;
		oReq.open("post", gConfig.serverURL +"users/"+username+(bBan?"/ban":"/unban"), true);
		oReq.setRequestHeader("X-Authentication-Token", Actions.cView.token);
		var spinner = Actions.gNodes["spinner"].cloneNode(true);
		var ckBox = nodeParent.replaceChild(spinner,e.target);
		oReq.onload = function(){
			nodeParent.replaceChild(ckBox, spinner);
			if(oReq.status < 400) {
				if (bBan)Actions.cView.gMe.users.banIds.push(Actions.cView.gUsers.byName[username].id);
				else{
					var idx = Actions.cView.gMe.users.banIds.indexOf(Actions.cView.gUsers.byName[username].id);
					if (idx != -1 ) Actions.cView.gMe.users.banIds.splice(idx, 1);
				}
				Actions.cView.localStorage.setItem("Actions.cView.gMe",JSON.stringify(Actions.cView.gMe));
				setChild(nodePopUp.parentNode.parentNode, "up-controls", Actions.Drawer.genUpControls(username));
			}
		}

		oReq.send();
	}
	,"doUnBan": function(e){
		var Actions = this;
		var oReq = new XMLHttpRequest();
		var nodeHost = e.target; do nodeHost = nodeHost.parentNode; while(nodeHost.className != "up-controls");
		var username = nodeHost.user;
		oReq.open("post", gConfig.serverURL +"users/"+username+"/unban", true);
		oReq.setRequestHeader("X-Authentication-Token", Actions.cView.token);
		oReq.onload = function(){
			if(oReq.status < 400) {
				var idx = Actions.cView.gMe.users.banIds.indexOf(Actions.cView.gUsers.byName[username].id);
				if (idx != -1 ) Actions.cView.gMe.users.banIds.splice(idx, 1);
				Actions.cView.localStorage.setItem("Actions.cView.gMe",JSON.stringify(Actions.cView.gMe));
				setChild(nodeHost.parentNode, "up-controls", Actions.Drawer.genUpControls(username));
			}
		}

		oReq.send();
	}
	,"doBlockCom": function(e){
		var Actions = this;
		var action = e.target.checked;
		var nodePopUp = e.target; do nodePopUp = nodePopUp.parentNode; while(nodePopUp.className != "user-popup");
		updateBlockList("blockComments", nodePopUp.user, action);
		var id = Actions.cView.gUsers.byName[nodePopUp.user].id;
		var nodesCmts = Actions.doc.getElementsByClassName("comment");
		for(var idx = 0; idx < nodesCmts.length; idx++){
			if(nodesCmts[idx].userid == id){
				if(action) nodesCmts[idx].innerHTML = "---";
				else nodesCmts[idx].parentNode.replaceChild(Actions.Drawer.genComment(Actions.cView.gComments[nodesCmts[idx].id]), nodesCmts[idx]);
			}
		}
	}
	,"doBlockPosts": function(e){
		var Actions = this;
		var action = e.target.checked;
		var nodePopUp = e.target; do nodePopUp = nodePopUp.parentNode; while(nodePopUp.className != "user-popup");
		updateBlockList("blockPosts", nodePopUp.user, action);
		var id = Actions.cView.gUsers.byName[nodePopUp.user].id;
		var nodesPosts = Actions.doc.getElementsByClassName("post");
		for(var idx = 0; idx < nodesPosts.length; idx++){
			if(nodesPosts[idx].rawData.createdBy == id)
				nodesPosts[idx].hidden = action;
		}
	}
	,"updateBlockList": function(list, username, add){
		var Actions = this;
		var id = Actions.cView.gUsers.byName[username].id;
		if(add){
			if ((typeof Actions.cView[list] === "undefined") || (Actions.cView[list] == null)) Actions.cView[list] = new Object();
			Actions.cView[list][id] = true;
			Actions.cView.localStorage.setItem(list, JSON.stringify(Actions.cView[list]));
		}else try{
			delete Actions.cView[list][id];
			Actions.cView.localStorage.setItem(list, JSON.stringify(Actions.cView[list]));
		}catch(e){};
	}
	,"setRadioOption": function(e){
		var Actions = this;
		Actions.cView.localStorage.setItem(e.target.name, e.target.value );
	}
	,"unfoldAttImgs": function (e){
		var Actions = this;
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
		var Actions = this;
		var victim =e.target;while(victim.className != "friends-tip") victim = victim.parentNode;
		victim.inp.tip = undefined;
		Actions.doc.body.removeChild(victim);

	}
	,"selectFriend": function(e){
		var Actions = this;
		var victim =e.target; do victim = victim.parentNode; while(victim.className != "friends-tip");
		victim.inp.value = e.target.innerHTML;

	}
	,"postDirect": function(e){
		var Actions = this;
		var victim =e.target; do victim = victim.parentNode; while(victim.className != "new-post");
		var input = victim.cNodes["new-post-to"].cNodes["new-direct-input"].value;
		if ((input != "") && (typeof Actions.cView.gUsers.byName[input] !== "undefined")
		&& Actions.cView.gUsers.byName[input].friend 
		&& (Actions.cView.gUsers.byName[input].subscriber||Actions.cView.gUsers.byName[input].type == "group"))
			victim.cNodes["new-post-to"].feeds.push(input);
		if (victim.cNodes["new-post-to"].feeds.length) newPost(e);
		else alert("should have valid recipients");
	}
	,"logout": function(){
		var Actions = this;
		matrix.ready = 0;
		try{matrix.logout();}catch(e){};
		Actions.cView.localStorage.removeItem("Actions.cView.gMe");
		deleteCookie(Actions.cView.tokenPrefix + "authToken");
		location.reload();
	}
	,"newPostRemoveFeed": function(e){
		var Actions = this;
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
			nodeP.parentNode.cNodes["edit-buttons"].cNodes["edit-buttons-post"].disabled = true;
	}
	,"newDirectRemoveFeed": function(e){
		var Actions = this;
		var nodeP = e.target.parentNode.parentNode;
		for(var idx = 0; idx < nodeP.feeds.length; idx++){
			if(nodeP.feeds[idx] == e.target.oValue){
				nodeP.feeds.splice(idx,1);
				break;
			}
		}
		e.target.parentNode.removeChild(e.target);
		if((nodeP.feeds.length == 0)&&(nodeP.cNodes["new-direct-input"].value == ""))
			nodeP.parentNode.cNodes["edit-buttons"].cNodes["edit-buttons-post"].disabled = true;
	}
	,"newPostAddFeed": function(e){
		var Actions = this;
		e.target.parentNode.cNodes["new-post-feed-select"].hidden = false;
	}
	,"newDirectAddFeed": function(e){
		var Actions = this;
		var nodeP = e.target.parentNode;
		var option = nodeP.cNodes["new-direct-input"];
		if (option.value == "") return;
		if(typeof option.tip !== "undefined")Actions.doc.body.removeChild(option.tip);
		nodeP.feeds.push(option.value);
		var li = Actions.doc.createElement("li");
		li.innerHTML = option.value;
		li.className = "new-post-feed";
		li.oValue = option.value;
		li.idx = e.target.selectedIndex;
		li.addEventListener("click",newDirectRemoveFeed);
		nodeP.cNodes["new-post-feeds"].appendChild(li);
		option.value = "";
	}
	,"newPostSelect": function(e){
		var Actions = this;
		var option = e.target[e.target.selectedIndex];
		if (option.value == "")return;
		var nodeP = e.target.parentNode;
		if (option.privateFeed ){
			nodeP.isPrivate  = true;
			var ul = Actions.doc.createElement("ul");
			ul.className = "new-post-feeds";
			nodeP.replaceChild(ul, nodeP.cNodes["new-post-feeds"]);
			nodeP.cNodes["new-post-feeds"] = ul;
			nodeP.feeds = new Array();
			for(var idx = 0; idx < e.target.length; idx++)
				e.target[idx].disabled = false;
		}
		option.disabled = true;
		nodeP.feeds.push(option.value);
		var li = Actions.doc.createElement("li");
		li.innerHTML = option.innerHTML;
		li.className = "new-post-feed";
		li.oValue = option.value;
		li.idx = e.target.selectedIndex;
		li.addEventListener("click",newPostRemoveFeed);
		nodeP.cNodes["new-post-feeds"].appendChild(li);
		nodeP.parentNode.cNodes["edit-buttons"].cNodes["edit-buttons-post"].disabled = false;
	}
	,"genUserPopup": function(e){
		var Actions = this;
		var node = e.target; while(typeof node.userid === "undefined")node = node.parentNode;
		var user = Actions.cView.gUsers[node.userid];
		if(Actions.doc.getElementById("userPopup" + node.userid))return;
		var nodePopup = Actions.gNodes["user-popup"].cloneAll(true);
		Actions.doc.getElementsByTagName("body")[0].appendChild(nodePopup);
		nodePopup.id = "userPopup" + node.userid;
		nodePopup.cNodes["up-avatar"].innerHTML = '<img src="'+ user.profilePictureMediumUrl+'" />';
		nodePopup.cNodes["up-info"].innerHTML  = user.link + "<br><span>@" + user.username + "</span>"
		Actions.doc.getElementsByTagName("body")[0].appendChild(nodePopup);
		if((typeof Actions.cView.gMe !== "undefined") && (user.id != Actions.cView.gMe.users.id) )
			setChild(nodePopup, "up-controls", Actions.Drawer.genUpControls(user.username));
		nodePopup.style.top = e.pageY;
		nodePopup.style.left = e.pageX;
		nodePopup.style["z-index"] = 1;
		if (typeof node.createdAt !== "undefined"){
			var spanDate = Actions.doc.createElement("span");
			var txtdate = new Date(node.createdAt*1).toString();
			spanDate.innerHTML = txtdate.slice(0, txtdate.indexOf("(")).trim();
			nodePopup.appendChild(spanDate);
		}


	}
	,"upClose": function(e){
		var Actions = this;
		var node = e.target; while(node.className != "user-popup")node = node.parentNode;
		node.parentNode.removeChild(node);
	}
	,"destroy": function(e){
		var Actions = this;
		if (!e.currentTarget.parentNode)return;
		if (e.eventPhase != Event.AT_TARGET)return;
		e.target.parentNode.removeChild(e.target);
		//e.stopPropagation();

	}
	,"realTimeSwitch": function(e){
		var Actions = this;
		if(e.target.checked )Actions.cView.localStorage.setItem("rt",1);
		else Actions.cView.localStorage.setItem("rt",0);
		if(Actions.cView.timeline == "settings") return;
		var bump = e.target.parentNode.cNodes["rt-bump"].value;
		if(e.target.checked && !gRt.on){
			gRt = new RtUpdate(Actions.cView.token,bump);
			gRt.subscribe(Actions.cView.rt);
		}else if(!e.target.checked){
			if(gRt.on){
				gRt.close();
				gRt = new Object();
			}
		}
	}
	,"goSettings": function (e){
		var Actions = this;
	    e.target.href = gConfig.front+"settings";
	}
	,"goRequests": function (e){
		var Actions = this;
	    e.target.href = gConfig.front+"requests";
	}
	,"genBlock": function (e){
		var Actions = this;
		var node = e.target.parentNode;
		var nodeBlock = Actions.gNodes["up-block"].cloneAll();
		nodeBlock.className = "user-popup"; 
		nodeBlock.user = node.user;
		node.appendChild(nodeBlock);
		nodeBlock.style.top =  e.target.offsetTop;
		nodeBlock.style.left = e.target.offsetLeft;
		nodeBlock.style["z-index"] = 2;
		var chkboxes = nodeBlock.getElementsByTagName("input");
		for(var idx = 0; idx < chkboxes.length; idx++){
			var list = Actions.cView[chkboxes[idx].value];
			if((typeof list !== "undefined") && (list != null) && (list[Actions.cView.gUsers.byName[node.user].id]>-1))
				chkboxes[idx].checked = true;
		}

	}
	,"updateProfile": function (e){
		var Actions = this;
		e.target.disabled = true;
		Actions.doc.getElementById("update-spinner").hidden = false;
		Actions.cView.gMe.users.screenName = Actions.doc.getElementById("my-screen-name").value;
		Actions.cView.gMe.users.email = Actions.doc.getElementById("my-email").value;
		if (Actions.doc.getElementById("me-private").checked == false)
			Actions.cView.gMe.users.isPrivate = false;
		else Actions.cView.gMe.users.isPrivate = true;
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			var nodeMsg = Actions.doc.getElementById("update-status");
			e.target.disabled = false;
			Actions.doc.getElementById("update-spinner").hidden = true;
			if(oReq.status < 400){
				Actions.cView.gMe = JSON.parse(oReq.response);
				nodeMsg.className = "sr-info";
				nodeMsg.innerHTML = "Updated. Your feed is <span style='font-weight: bold;'>" + ((Actions.cView.gMe.users.isPrivate == true)?"private.":"public.")+ "</span>";
				Actions.Utils.refreshActions.cView.gMe();
			}else {
				nodeMsg.className = "msg-error";
				nodeMsg.innerHTML = "Got error: ";
				try{ 
					nodeMsg.innerHTML += JSON.parse(oReq.response).err;
				}catch(e) {nodeMsg.innerHTML += "unknown error";};

			}
		}

		oReq.open("put",gConfig.serverURL + "users/" + Actions.cView.gMe.users.id ,true);
		oReq.setRequestHeader("Content-type","application/json");
		oReq.setRequestHeader("X-Authentication-Token", Actions.cView.token);
		oReq.send(JSON.stringify({"user":Actions.cView.gMe.users}));
	}
	,"setRTparams": function (e){
		var Actions = this;
		var value = e.target.value;
		e.target.parentNode.getElementsByTagName("span")[0].innerHTML = value + " minutes";
		var oRTParams = new Object();
		["rt-bump-int", "rt-bump-cd", "rt-bump-d"].forEach(function(id){
			oRTParams[id] = Actions.doc.getElementById(id).value;
		});
		Actions.cView.localStorage.setItem("rt_params",JSON.stringify(oRTParams) );
	}
	,"setRTBump": function (e){
		var Actions = this;
		var bump = e.target.checked;
		Actions.cView.localStorage.setItem("rtbump",bump?1:0);
		Actions.doc.getElementById("rt-params").hidden = !bump;
	}
	,"linkPreviewSwitch": function (e){
		var Actions = this;
		if(e.target.checked )Actions.cView.localStorage.setItem("show_link_preview",1);
		else Actions.cView.localStorage.setItem("show_link_preview",0);
	}
	,"srAccept": function (e){
		var Actions = this;
		sendReqResp(e.target, "acceptRequest" );
	}
	,"srReject": function (e){
		var Actions = this;
		sendReqResp(e.target, "rejectRequest" );
	}
	,"sendReqResp": function (node, action){
		var Actions = this;
		node.parentNode.hidden = true;
		var host = node.parentNode.parentNode;
		var spinner = Actions.gNodes["spinner"].cloneNode(true);
		host.appendChild(spinner);
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(oReq.status < 400){
				host.parentNode.removeChild(host);
				var nodeSR = Actions.doc.getElementById("sr-info");
				if(--Actions.cView.subReqsCount){
					nodeSR.cNodes["sr-info-a"].innrHTML = "You have "
					+ Actions.cView.gMe.users.subscriptionRequests.length 
					+ " subscription requests to review.";
				}else{
					nodeSR.hidden = true;
					var victim = Actions.doc.getElementById("sr-header");
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
		oReq.setRequestHeader("X-Authentication-Token", Actions.cView.token);
		oReq.send();
	}
	,"getauth": function (e){
		var Actions = this;
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(this.status < 400){
				Actions.Utils.setCookie(Actions.Utils.cView.tokenPrefix + "authToken", JSON.parse(this.response).authToken);
				Actions.cView.token =  JSON.parse(this.response).authToken;
				Actions.Utils.doc.getElementsByTagName("body")[0].removeChild(Actions.Utils.doc.getElementsByClassName("nodeAuth")[0]);
			//	initDoc();

				location.reload();
			}else Actions.doc.getElementById("auth-msg").innerHTML = JSON.parse(this.response).err;
		};
		oReq.open("post", gConfig.serverURL +"session", true);
		oReq.setRequestHeader("X-Authentication-Token", null);
		oReq.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		oReq.send("username="+Actions.Utils.doc.getElementById("a-user").value+"&password="+Actions.Utils.doc.getElementById("a-pass").value);
	}
};
return _Actions;
});
