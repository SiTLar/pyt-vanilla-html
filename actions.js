"use strict";
define("Actions",[],function() {return{
	"newPost": function(e){
		var textField = e.target.parentNode.parentNode.cNodes["edit-txt-area"];
		textField.disabled = true;
		e.target.disabled = true;
		var nodeSpinner = e.target.parentNode.appendChild(gNodes["spinner"].cloneNode(true));
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
					var nodeAtt = document.createElement("div");
					nodeAtt.className = "attachments";
					textField.parentNode.replaceChild(nodeAtt, 
						textField.parentNode.cNodes["attachments"]);
					textField.parentNode.cNodes["attachments"] = nodeAtt;
					textField.value = "";
					textField.disabled = false;
					delete textField.pAtt;
					delete textField.attachments;
					postTo.feeds = new Array();
					gConfig.regenPostTo();
					e.target.disabled = false;
					textField.style.height  = "4em";
					e.target.parentNode.removeChild(nodeSpinner);
					var res = JSON.parse(oReq.response);
					loadGlobals(res);
					if(!document.getElementById(res.posts.id))document.posts.insertBefore(genPost(res.posts), document.posts.childNodes[0]);
				}else{
					textField.disabled = false;
					e.target.disabled = false;
					e.target.parentNode.removeChild(nodeSpinner );
					var errmsg = "";
					try{	
						var eresp = JSON.parse(oReq.response);
						errmsg = eresp.err;
					}catch(e){}
					alert("Error #"+oReq.status+": "+oReq.statusText+" "+errmsg) ;
				}
			}
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
					"author":gMe.users.username,
					"data":textField.value,
				}
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
					gConfig.token);
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
		e.target.disabled = true;
		var textField = e.target.parentNode.parentNode.cNodes["edit-txt-area"];
		var nodeSpinner = gNodes["attachment"].cloneAll();
		nodeSpinner.innerHTML = '<img src="'+gConfig.static+'throbber-100.gif">';
		e.target.parentNode.parentNode.cNodes["attachments"].appendChild(nodeSpinner);
		textField.pAtt = new Promise(function(resolve,reject){
			var oReq = new XMLHttpRequest();
			oReq.onload = function(){
				if(this.status < 400){
					e.target.value = "";
					e.target.disabled = false;
					var attachments = JSON.parse(this.response).attachments;
					var nodeAtt = gNodes["attachment"].cloneAll();
					nodeAtt.innerHTML = '<a target="_blank" href="'+attachments.url+'" border=none ><img src="'+attachments.thumbnailUrl+'"></a>';
					nodeSpinner.parentNode.replaceChild(nodeAtt, nodeSpinner);
					if (typeof(textField.attachments) === "undefined" ) textField.attachments = new Array();
					textField.attachments.push(attachments.id);
					resolve();

				}else reject(this.status);
			}

			oReq.open("post",gConfig.serverURL + "attachments", true);
			oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
			var data = new FormData();
			data.append( "name", "attachment[file]");
			data.append( "attachment[file]", e.target.files[0], e.target.value);
			oReq.send(data);
		});
	}
	,"editPost": function(e) {
		var victim = e.target; do victim = victim.parentNode; while(victim.className != "post");
		var nodeEdit = genEditNode(postEditedPost,cancelEditPost);
		nodeEdit.cNodes["edit-txt-area"].value = victim.rawData.body;
		victim.cNodes["post-body"].replaceChild( nodeEdit, victim.cNodes["post-body"].cNodes["post-cont"]);
	}
	,"cancelEditPost": function(e){
		 var victim = e.target; do victim = victim.parentNode; while(victim.className != "post");
		 var postCNode = document.createElement("div");
		 postCNode.innerHTML = victim.rawData.body;
		 postCNode.className = "post-cont";
		 victim.cNodes["post-body"].replaceChild(postCNode,e.target.parentNode.parentNode );
		 victim.cNodes["post-body"].cNodes["post-cont"] = postCNode;

	}
	,"postEditedPost": function(e){
		var nodePost =e.target; do nodePost = nodePost.parentNode; while(nodePost.className != "post");
		var oReq = new XMLHttpRequest();
		e.target.disabled = true;
		oReq.onload = function(){
			if(this.status < 400){
				var post = JSON.parse(oReq.response).posts;
				var postCNode = document.createElement("div");
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
		}

		var post = new Object();
		post.createdAt = nodePost.rawData.createdAt;
		post.createdBy = nodePost.rawData.createdBy;
		post.updatedAt = Date.now();
		var postdata = new Object();
		postdata.post = post;
		e.target.parentNode.parentNode.cNodes["edit-txt-area"].disabled = true;

		e.target.parentNode.replaceChild(gNodes["spinner"].cloneNode(true),e.target.parentNode.cNodes["edit-buttons-cancel"] );
		var text = e.target.parentNode.parentNode.cNodes["edit-txt-area"].value;
		if(nodePost.isPrivate){ 
			oReq.open("put",matrix.cfg.srvurl+"edit", true);
			oReq.setRequestHeader("x-content-type", "post"); 
			oReq.setRequestHeader("Content-type","application/json");
			//oReq.onload = onload;
			var payload =  {
				"feed":nodePost.feed, 
				"type":"post", 
				"author":gMe.users.username,
				"data":text,
			}
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
			oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
			oReq.setRequestHeader("Content-type","application/json");
			oReq.send(JSON.stringify(postdata));
		}
	}
	,"deletePost": function(e){
		var victim =e.target; do victim = victim.parentNode; while(victim.className != "post");
		deleteNode(victim, doDeletePost);
	}
	,"doDeletePost": function(but){
		var victim = but.node;
		but.parentNode.parentNode.removeChild(but.parentNode);
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(this.status < 400){
				document.hiddenPosts.splice(victim.rawData.idx,1);
				//victim.parentNode.removeChild(victim);
				regenHides();
			}
		}
		if(victim.isPrivate){ 
			oReq.open("delete",matrix.cfg.srvurl+"delete",true);
			oReq.setRequestHeader("x-content-id", victim.id); 
			oReq.setRequestHeader("x-access-token", matrix.mkOwnToken(victim.sign)); 
			oReq.setRequestHeader("x-content-type", "post"); 
			oReq.send();
		}else{
			oReq.open("delete",gConfig.serverURL + "posts/"+victim.id, true);
			oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
			oReq.setRequestHeader("Content-type","application/json");
			oReq.send();
		}
	}
	,"postLike": function(e){
		var oReq = new XMLHttpRequest();
		var nodeLikes = e.target.parentNode.parentNode.parentNode.cNodes["likes"];
		var nodePost =nodeLikes; do nodePost = nodePost.parentNode; while(nodePost.className != "post");
		oReq.onload = function(){
			if(this.status < 400){	
				if(e.target.action){
					var idx;
					var likesUL;
					if (!nodeLikes.childNodes.length){
						nodeLikes.appendChild(gNodes["likes-smile"].cloneNode(true));
						likesUL = document.createElement( "ul");
						likesUL.className ="p-timeline-user-likes";
						var suffix = document.createElement("span");
						suffix.id = e.target.parentNode.postId+"-unl";
						suffix.innerHTML = " liked this";
						nodeLikes.appendChild(likesUL);
						nodeLikes.appendChild(suffix);

					}else {

						for(idx = 0; idx < nodeLikes.childNodes.length; idx++)
							if (nodeLikes.childNodes[idx].nodeName == "UL")break;
						likesUL = nodeLikes.childNodes[idx];
					}
					var nodeLike = document.createElement("li");
					nodeLike.className = "p-timeline-user-like";
					nodeLike.innerHTML = gUsers[gMe.users.id].link;
					if(likesUL.childNodes.length)likesUL.insertBefore(nodeLike, likesUL.childNodes[0]);
					else likesUL.appendChild(nodeLike);
					e.target.parentNode.parentNode.parentNode.myLike = nodeLike;
					if(!Array.isArray(nodePost.rawData.likes)) nodePost.rawData.likes = new Array();
					nodePost.rawData.likes.unshift(gMe.users.id);
				}else{
					nodePost.rawData.likes.splice(nodePost.rawData.likes.indexOf(gMe.users.id), 1) ;
					var myLike = e.target.parentNode.parentNode.parentNode.myLike;
					likesUL = myLike.parentNode;
					likesUL.removeChild(myLike);  	
					Drawer["genLikes"](nodePost);

				/*	
					if (likesUL.childNodes.length < 2){ 
						var nodePI = nodeLikes.parentNode;
						nodePI.cNodes["likes"] = document.createElement("div");
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
			oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
			oReq.send();
			e.target.innerHTML = "";
			e.target.appendChild(gNodes["spinner"].cloneAll());
			
	}

	,"unfoldLikes": function(id){
		var post = document.getElementById(id).rawData;
		var span  = document.getElementById(id+"-unl");
		var nodeLikes = span.parentNode;
		
		if (post.omittedLikes > 0){
			var oReq = new XMLHttpRequest();
			oReq.onload = function(){
				if(oReq.status < 400){
				nodeLikes.removeChild(span);
					var postUpd = JSON.parse(this.response);
					post.likes = postUpd.posts.likes;
					postUpd.users.forEach(addUser);
					document.getElementById(id).rawData = post;
					writeAllLikes(id, nodeLikes);
				}else{
					console.log(oReq.toString());
				
				}
			}
			oReq.open("get",gConfig.serverURL + "posts/"+post.id+"?maxComments=0&maxLikes=all", true);
			oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
			oReq.send();

		}else  writeAllLikes(id, nodeLikes);
	}

	,"getUsername": function(e){
		var node = e.target; do node = node.parentNode; while(typeof node.user === "undefined");
		if ( gConfig.cTxt == null ) return;
		gConfig.cTxt.value += "@" + node.user;
	}
	,"reqSubscription": function(e){
		var oReq = new XMLHttpRequest();
		var username = e.target.parentNode.user;
		oReq.open("post", gConfig.serverURL +"users/"+username+"/sendRequest/", true);
		oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
		oReq.onload = function(){
			if(oReq.status < 400) {
				var span = document.createElement("span");
				span.innerHTML = "Request sent";
				e.target.parentNode.replaceChild(span, e.target);
			}
		}

		oReq.send();

	}
	,"ban": function(e){
		var oReq = new XMLHttpRequest();
		var username = e.target.parentNode.user;
		oReq.open("post", gConfig.serverURL +"users/"+username+(e.target.banned?"/unban":"/ban"), true);
		oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
		oReq.onload = function(){
			if(oReq.status < 400) {
				if (!e.target.banned)gMe.users.banIds.push(gUsers.byName[username].id);
				else{
					var idx = gMe.users.banIds.indexOf(gUsers.byName[username].id);
					if (idx != -1 ) gMe.users.banIds.splice(idx, 1);
				}
				window.localStorage.setItem("gMe",JSON.stringify(gMe));
				e.target.parentNode.parentNode.replaceChild(genUpControls(username), e.target.parentNode);
			}
		}

		oReq.send();
	}
	,"subscribe": function(e){
		var oReq = new XMLHttpRequest();
		var username = e.target.parentNode.user;
		oReq.open("post", gConfig.serverURL +"users/"+username+(e.target.subscribed?"/unsubscribe":"/subscribe"), true);
		oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
		oReq.onload = function(){
			if(oReq.status < 400) {
				gMe = JSON.parse(oReq.response);
				window.localStorage.setItem("gMe",JSON.stringify(gMe));
				gUsers.byName[username].friend = !e.target.subscribed;
				e.target.parentNode.parentNode.replaceChild(genUpControls(username), e.target.parentNode);
			}
		}

		oReq.send();
	}


	,"showHidden": function(e){
		if(e.target.action){
			if(!document.hiddenCount)return;	
			var nodeHiddenPosts = document.createElement("div");
			nodeHiddenPosts.id = "hidden-posts"; 
			document.hiddenPosts.forEach(function(oHidden){if(oHidden.is)nodeHiddenPosts.appendChild(genPost(oHidden.data));});
			e.target.parentNode.parentNode.insertBefore(nodeHiddenPosts , e.target.parentNode.nextSibling);
			e.target.innerHTML =  "Collapse "+ document.hiddenCount + " hidden entries";
		}else{
			var nodeHiddenPosts = document.getElementById("hidden-posts");
			if (nodeHiddenPosts) nodeHiddenPosts.parentNode.removeChild(nodeHiddenPosts);
			if (document.hiddenCount) e.target.innerHTML = "Show "+ document.hiddenCount + " hidden entries";
			else e.target.innerHTML = "";
		}
		e.target.action = !e.target.action; 
	}
	,"postHide": function(e){
		var victim = e.target; do victim = victim.parentNode; while(victim.className != "post");
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(this.status < 400){	
				doHide(victim, e.target.action);
			}
		}
		

			oReq.open("post",gConfig.serverURL + "posts/"+ e.target.parentNode.parentNode.parentNode.parentNode.parentNode.id+"/"+(e.target.action?"hide":"unhide"), true);
			oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
			oReq.send();
			

		
	}
	,"doHide": function(victim, action){
		var nodeHide = victim.cNodes["post-body"].cNodes["post-info"].cNodes["post-controls"].nodeHide;
		if(action != nodeHide.action) return; 
		var nodeShow = document.getElementsByClassName("show-hidden")[0]
		if (!nodeShow){
			nodeShow = gNodes["show-hidden"].cloneAll();
			nodeShow.cNodes["href"].action = true;
			document.getElementById("content").appendChild(nodeShow);
		}
		var aShow =  nodeShow.cNodes["href"];
		if(action){
			victim.rawData.isHidden = true;
			document.hiddenPosts[victim.rawData.idx].is  = true;
			victim.parentNode.removeChild(victim);
			document.hiddenCount++;
			aShow.action = false;
			aShow.dispatchEvent(new Event("click"));
		}else{
			var count = 0;
			var idx = victim.rawData.idx;
			do if(document.hiddenPosts[idx--].is)count++;
			while ( idx >0 );
			if ((victim.rawData.idx - count+1) >= document.posts.childNodes.length )document.posts.appendChild(victim);
			else document.posts.insertBefore(victim, document.posts.childNodes[victim.rawData.idx - count+1]);
			nodeHide.innerHTML = "Hide";
			document.hiddenPosts[victim.rawData.idx].is = false;
			document.hiddenCount--;
			if(document.hiddenCount) aShow.innerHTML = "Collapse "+ document.hiddenCount + " hidden entries"; 
			else aShow.dispatchEvent(new Event("click"));
		}
		nodeHide.action = !action; 

	}

	,"addComment": function(e){
		var postNBody = e.target; do postNBody = postNBody.parentNode; while(postNBody.className != "post-body");
		if(postNBody.isBeenCommented === true)return;
		postNBody.isBeenCommented = true;
		var nodeComment = gNodes["comment"].cloneAll();
		nodeComment.cNodes["comment-body"].appendChild(genEditNode(postNewComment,cancelNewComment));
		nodeComment.userid = gMe.users.id;
		postNBody.cNodes["comments"].appendChild(nodeComment);
		nodeComment.getElementsByClassName("edit-txt-area")[0].focus();
	}
	,"editComment": function(e){
		var victim = e.target; do victim = victim.parentNode; while(victim.className != "comment");
		var nodeEdit = genEditNode(postEditComment,cancelEditComment);
		nodeEdit.cNodes["edit-txt-area"].value = gComments[victim.id].body;
		victim.replaceChild( nodeEdit, victim.cNodes["comment-body"]);
		victim.cNodes["comment-body"] = nodeEdit;
		nodeEdit.className = "comment-body";
		victim.getElementsByClassName("edit-txt-area")[0].focus();
	}


	,"postEditComment": function(e){
		var nodeComment = e.target; do nodeComment = nodeComment.parentNode; while(nodeComment.className != "comment");
		var nodePost =nodeComment; do nodePost = nodePost.parentNode; while(nodePost.className != "post");
		var textField = e.target.parentNode.parentNode.cNodes["edit-txt-area"];
		e.target.disabled = true;
		e.target.parentNode.replaceChild(gNodes["spinner"].cloneNode(true),e.target.parentNode.cNodes["edit-buttons-cancel"] );
		if(nodePost.isPrivate){
			sendEditedPrivateComment(textField, nodeComment, nodePost);
			return;
		}
		var comment = gComments[nodeComment.id];
		comment.body = textField.value ; 
		comment.updatedAt = Date.now();
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(this.status < 400){
				var comment = JSON.parse(this.response).comments;
				nodeComment.parentNode.replaceChild(genComment(comment),nodeComment);
				gComments[comment.id] = comment;

			}
		}

		oReq.open("put",gConfig.serverURL + "comments/"+comment.id, true);
		oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
		oReq.setRequestHeader("Content-type","application/json");
		var postdata = new Object();
		postdata.comment = comment;
		postdata.users = new Array(gMe);
		oReq.send(JSON.stringify(postdata));

	}
	,"cancelEditComment": function(e){
		var nodeComment = e.target; do nodeComment = nodeComment.parentNode; while(nodeComment.className != "comment");
		 nodeComment.parentNode.replaceChild(genComment( gComments[nodeComment.id]),nodeComment);
	}
	,"processText": function(e) {
		gConfig.cTxt = e.target;
		if (e.target.scrollHeight > e.target.clientHeight) 
			e.target.style.height = e.target.scrollHeight + "px";
		if (e.which == "13"){
			var text = e.target.value;
			if(text.charAt(text.length-1) == "\n") e.target.value = text.slice(0, -1);
			e.target.parentNode.cNodes["edit-buttons"].cNodes["edit-buttons-post"].dispatchEvent(new Event("click"));
		}
		
	}
	,"cancelNewComment": function(e){ 
		var postNBody = e.target; do postNBody = postNBody.parentNode; while(postNBody.className != "post-body");
		postNBody.isBeenCommented = false;
		if(typeof postNBody.bumpLater !== "undefined")setTimeout(postNBody.bumpLater, 1000);
		var nodeComment =e.target; do nodeComment = nodeComment.parentNode; while(nodeComment.className != "comment");
		nodeComment.parentNode.removeChild(nodeComment);

	}
	,"postNewComment": function(e){
		e.target.disabled = true;
		e.target.parentNode.replaceChild(gNodes["spinner"].cloneNode(true),e.target.parentNode.cNodes["edit-buttons-cancel"] );
		sendComment(e.target.parentNode.previousSibling);
		var nodeComments =e.target; do nodeComments = nodeComments.parentNode; while(nodeComments.className != "comments");
		nodeComments.cnt++;
	}
	,"deleteComment": function(e){
		var nodeComment = e.target; do nodeComment = nodeComment.parentNode; while(nodeComment.className != "comment");
		deleteNode(nodeComment,doDeleteComment);
	}
	,"deleteNode": function(node,doDelete){
		var nodeConfirm = document.createElement("div");
		var butDelete = document.createElement("button");
		butDelete.innerHTML = "delete";
		butDelete.node = node;
		butDelete.onclick = function(){doDelete(butDelete);}
		var butCancel0 = document.createElement("button");
		butCancel0.innerHTML = "cancel";
		butCancel0.onclick = function (){deleteCancel(nodeConfirm)}
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
		nodeConfirm.node.hidden = false;	
		nodeConfirm.parentNode.removeChild(nodeConfirm);
	}

	,"doDeleteComment": function(but){
		var nodeComment = but.node;
		var nodePost =nodeComment; do nodePost = nodePost.parentNode; while(nodePost.className != "post");
		but.parentNode.parentNode.removeChild(but.parentNode);
		but.node.hidden = false;
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(this.status < 400){
				if(nodeComment.parentNode) nodeComment.parentNode.removeChild(nodeComment);
				delete gComments[nodeComment.id];
			}
		}
		if(nodePost.isPrivate){ 
			oReq.open("delete",matrix.cfg.srvurl+"delete",true);
			oReq.setRequestHeader("x-content-id", nodeComment.id); 
			oReq.setRequestHeader("x-access-token", matrix.mkOwnToken(nodeComment.sign)); 
			oReq.setRequestHeader("x-content-type", "comment"); 
			oReq.send();
		}else{
			oReq.open("delete",gConfig.serverURL + "comments/"+nodeComment.id, true);
			oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
			oReq.setRequestHeader("Content-type","application/json");
			oReq.send();
		}
	}

	,"unfoldComm": function(id){
		var post = document.getElementById(id).rawData;
		var oReq = new XMLHttpRequest();
		var spUnfold = document.getElementById(id+"-unc").parentNode.appendChild(document.createElement("i"));
		spUnfold.className = "fa fa-spinner fa-pulse";
		oReq.onload = function(){
			if(oReq.status < 400){
				var postUpd = JSON.parse(this.response);
				loadGlobals(postUpd);
				document.getElementById(id).rawData = post;
				var nodePB = document.getElementById(id).cNodes["post-body"];
				nodePB.isBeenCommented = false;
				if(typeof nodePB.bumpLater !== "undefined")setTimeout(postPB.bumpLater, 1000); 
				nodePB.removeChild(nodePB.cNodes["comments"]);
				nodePB.cNodes["comments"] = document.createElement("div");
				nodePB.cNodes["comments"].className = "comments";
				 
				postUpd.comments.forEach(function(cmt){gComments[cmt.id] =cmt; nodePB.cNodes["comments"].appendChild(genComment(cmt))});
				nodePB.appendChild(nodePB.cNodes["comments"]);
				addLastCmtButton(nodePB);
				nodePB.cNodes["comments"].cnt = postUpd.comments.length;

			}else{
				spUnfold.parentNode.removeChild(spUnfold);
				console.log(oReq.toString());

			}
		}

		oReq.open("get",gConfig.serverURL + "posts/"+post.id+"?maxComments=all&maxLikes=0", true);
		oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
		oReq.send();


	}


	,"calcCmtTime": function(e){
		if (typeof(e.target.parentNode.parentNode.parentNode.createdAt) !== "undefined" ){
			var absUxTime = e.target.parentNode.parentNode.parentNode.createdAt*1;
			var txtdate = new Date(absUxTime ).toString();
			
			e.target.title =  relative_time(absUxTime) + " ("+ txtdate.slice(0, txtdate.indexOf("(")).trim()+ ")";
		}
	}


	,"me": function(e){
		e.target.href = gConfig.front+gMe["users"]["username"];
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
		if (e.target.value){
			var victim =e.target; do victim = victim.parentNode; while(victim.className != "new-post");
			victim.cNodes["edit-buttons"].cNodes["edit-buttons-post"].disabled = false;
			if(e.which == "13") newDirectAddFeed(e);
			else{
				var txt = e.target.value.toLowerCase();
				var nodeTip = gNodes["friends-tip"].cloneAll();
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
					var li = document.createElement("li");
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
					document.body.replaceChild(nodeTip, e.target.tip);
					e.target.tip = nodeTip;
				}else e.target.tip = document.body.appendChild(nodeTip);
			}
		}else if(e.target.tip){
			document.body.removeChild(e.target.tip);
			e.target.tip = undefined;
		}
		
		
	}
	,"ftClose": function(e){
		var victim =e.target;while(victim.className != "friends-tip") victim = victim.parentNode;
		victim.inp.tip = undefined;
		document.body.removeChild(victim);

	}
	,"selectFriend": function(e){
		var victim =e.target; do victim = victim.parentNode; while(victim.className != "friends-tip");
		victim.inp.value = e.target.innerHTML;

	}
	,"postDirect": function(e){
		var victim =e.target; do victim = victim.parentNode; while(victim.className != "new-post");
		var input = victim.cNodes["new-post-to"].cNodes["new-direct-input"].value;
		if ((input != "") && (typeof gUsers.byName[input] !== "undefined") 
			&& gUsers.byName[input].friend && (gUsers.byName[input].subscriber||gUsers.byName[input].type == "group")) 
			victim.cNodes["new-post-to"].feeds.push(input);
		if (victim.cNodes["new-post-to"].feeds.length) newPost(e);	
		else alert("should have valid recipients");
	}

	,"logout": function(){
		matrix.ready = 0;
		matrix.logout();
		window.localStorage.removeItem("gMe");
		deleteCookie("token");
		location.reload();
	}
	,"newPostRemoveFeed": function(e){
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
		e.target.parentNode.cNodes["new-post-feed-select"].hidden = false;
	}
	,"newDirectAddFeed": function(e){
		var nodeP = e.target.parentNode;
		var option = nodeP.cNodes["new-direct-input"];
		if (option.value == "") return;
		if(typeof option.tip !== "undefined")document.body.removeChild(option.tip); 
		nodeP.feeds.push(option.value);
		var li = document.createElement("li");
		li.innerHTML = option.value;
		li.className = "new-post-feed";
		li.oValue = option.value;
		li.idx = e.target.selectedIndex;
		li.addEventListener("click",newDirectRemoveFeed);
		nodeP.cNodes["new-post-feeds"].appendChild(li);
		option.value = "";
	}
	,"newPostSelect": function(e){
		var option = e.target[e.target.selectedIndex];
		if (option.value == "")return;
		var nodeP = e.target.parentNode;
		if (option.privateFeed ){
			nodeP.isPrivate  = true;
			var ul = document.createElement("ul");
			ul.className = "new-post-feeds";
			nodeP.replaceChild(ul, nodeP.cNodes["new-post-feeds"]);
			nodeP.cNodes["new-post-feeds"] = ul;
			nodeP.feeds = new Array();
			for(var idx = 0; idx < e.target.length; idx++)
				e.target[idx].disabled = false;
		}
		option.disabled = true;
		nodeP.feeds.push(option.value);
		var li = document.createElement("li");
		li.innerHTML = option.innerHTML;
		li.className = "new-post-feed";
		li.oValue = option.value;
		li.idx = e.target.selectedIndex;
		li.addEventListener("click",newPostRemoveFeed);
		nodeP.cNodes["new-post-feeds"].appendChild(li);
		nodeP.parentNode.cNodes["edit-buttons"].cNodes["edit-buttons-post"].disabled = false;
	}
	,"genUserPopup": function(e){
		var node = e.target; while(typeof node.userid === "undefined")node = node.parentNode;
		var user = gUsers[node.userid];
		if(document.getElementById("userPopup" + node.userid))return;
		var nodePopup = gNodes["user-popup"].cloneAll(true);
		document.getElementsByTagName("body")[0].appendChild(nodePopup);
		nodePopup.id = "userPopup" + node.userid; 
		nodePopup.cNodes["up-avatar"].innerHTML = '<img src="'+ user.profilePictureMediumUrl+'" />';
		nodePopup.cNodes["up-info"].innerHTML  = user.link + "<br><span>@" + user.username + "</span>"
		document.getElementsByTagName("body")[0].appendChild(nodePopup);
		if((typeof gMe !== "undefined") && (user.id != gMe.users.id) )
			nodePopup.appendChild(genUpControls(user.username));
		nodePopup.style.top = e.pageY;
		nodePopup.style.left = e.pageX;
		if (typeof node.createdAt !== "undefined"){
			var spanDate = document.createElement("span");
			var txtdate = new Date(node.createdAt*1).toString();
			spanDate.innerHTML = txtdate.slice(0, txtdate.indexOf("(")).trim();
			nodePopup.appendChild(spanDate);
		}


	}
	,"upClose": function(e){
		var node = e.target; while(node.className != "user-popup")node = node.parentNode;
		node.parentNode.removeChild(node);
	}
	,"destroy": function(e){
		if (!e.currentTarget.parentNode)return;
		if (e.eventPhase != Event.AT_TARGET)return;
		e.target.parentNode.removeChild(e.target);
		//e.stopPropagation();

	}
	,"realTimeSwitch": function(e){
		var bump = e.target.parentNode.cNodes["rt-bump"].value;
		if(e.target.checked && !gRt.on){
			window.localStorage.setItem("rt",true);
			gRt = new RtUpdate(gConfig.token,bump);
			gRt.subscribe(gConfig.rt);
		}else if(!e.target.checked){
			window.localStorage.setItem("rt",false);
			if(gRt.on){
				gRt.close();
				gRt = new Object();
			}
		}
	}
	,"setRTCooldown": function(e){
		var bump = e.target.value;
		window.localStorage.setItem("rtbump",bump);
		if(gRt.on)gRt.handlers.setBumpCooldown( bump);
	}
}});

