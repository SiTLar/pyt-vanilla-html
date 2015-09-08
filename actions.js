"use strict";

function unfoldLikes(id){
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
			
			};
		};
		oReq.open("get",gConfig.serverURL + "posts/"+post.id+"?maxComments=0&maxLikes=all", true);
		oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
		oReq.send();

	}else  writeAllLikes(id, nodeLikes);
}

function getUsername(e){
	var node = e.target; do node = node.parentNode; while(typeof node.user === "undefined");
	if ( gConfig.cTxt == null ) return;
	gConfig.cTxt.value += "@" + node.user;
}
function reqSubscription(e){
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
function ban(e){
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
function subscribe(e){
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


function showHidden(e){
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
function postHide(e){
	var victim = e.target; do victim = victim.parentNode; while(victim.className != "post");
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		if(this.status < 400){	
			doHide(victim, e.target.action);
		};
	}
	

		oReq.open("post",gConfig.serverURL + "posts/"+ e.target.parentNode.parentNode.parentNode.parentNode.parentNode.id+"/"+(e.target.action?"hide":"unhide"), true);
		oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
		oReq.send();
		

	
}
function doHide(victim, action){
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

function addComment(e){
	var postNBody = e.target; do postNBody = postNBody.parentNode; while(postNBody.className != "post-body");
	if(postNBody.isBeenCommented === true)return;
	postNBody.isBeenCommented = true;
	var nodeComment = gNodes["comment"].cloneAll();
	nodeComment.cNodes["comment-body"].appendChild(genEditNode(postNewComment,cancelNewComment));
	nodeComment.userid = gMe.users.id;
	postNBody.cNodes["comments"].appendChild(nodeComment);
	nodeComment.getElementsByClassName("edit-txt-area")[0].focus();
}
function editComment(e){
	var victim = e.target; do victim = victim.parentNode; while(victim.className != "comment");
	var nodeEdit = genEditNode(postEditComment,cancelEditComment);
	nodeEdit.cNodes["edit-txt-area"].value = gComments[victim.id].body;
	victim.replaceChild( nodeEdit, victim.cNodes["comment-body"]);
	victim.cNodes["comment-body"] = nodeEdit;
	nodeEdit.className = "comment-body";
	victim.getElementsByClassName("edit-txt-area")[0].focus();
}


function postEditComment(e){
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
	};

	oReq.open("put",gConfig.serverURL + "comments/"+comment.id, true);
	oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
	oReq.setRequestHeader("Content-type","application/json");
	var postdata = new Object();
	postdata.comment = comment;
	postdata.users = new Array(gMe);
	oReq.send(JSON.stringify(postdata));

};
function cancelEditComment(e){
	var nodeComment = e.target; do nodeComment = nodeComment.parentNode; while(nodeComment.className != "comment");
	 nodeComment.parentNode.replaceChild(genComment( gComments[nodeComment.id]),nodeComment);
};
function processText(e) {
	gConfig.cTxt = e.target;
	if (e.target.scrollHeight > e.target.clientHeight) 
		e.target.style.height = e.target.scrollHeight + "px";
	if (e.which == "13"){
		var text = e.target.value;
		if(text.charAt(text.length-1) == "\n") e.target.value = text.slice(0, -1);
		e.target.parentNode.cNodes["edit-buttons"].cNodes["edit-buttons-post"].dispatchEvent(new Event("click"));
	}
	
}
function cancelNewComment(e){ 
	var postNBody = e.target; do postNBody = postNBody.parentNode; while(postNBody.className != "post-body");
	postNBody.isBeenCommented = false;
	if(typeof postNBody.bumpLater !== "undefined")setTimeout(postNBody.bumpLater, 1000);
	var nodeComment =e.target; do nodeComment = nodeComment.parentNode; while(nodeComment.className != "comment");
	nodeComment.parentNode.removeChild(nodeComment);

}
function postNewComment(e){
	e.target.disabled = true;
	e.target.parentNode.replaceChild(gNodes["spinner"].cloneNode(true),e.target.parentNode.cNodes["edit-buttons-cancel"] );
	sendComment(e.target.parentNode.previousSibling);
	var nodeComments =e.target; do nodeComments = nodeComments.parentNode; while(nodeComments.className != "comments");
	nodeComments.cnt++;
}
function deleteComment(e){
	var nodeComment = e.target; do nodeComment = nodeComment.parentNode; while(nodeComment.className != "comment");
	deleteNode(nodeComment,doDeleteComment);
}
function deleteNode(node,doDelete){
	var nodeConfirm = document.createElement("div");
	var butDelete = document.createElement("button");
	butDelete.innerHTML = "delete";
	butDelete.node = node;
	butDelete.onclick = function(){doDelete(butDelete);};
	var butCancel0 = document.createElement("button");
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
function deleteCancel(nodeConfirm){
	nodeConfirm.node.hidden = false;	
	nodeConfirm.parentNode.removeChild(nodeConfirm);
}

function doDeleteComment(but){
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
	};
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

function unfoldComm(id){
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

		};
	};

	oReq.open("get",gConfig.serverURL + "posts/"+post.id+"?maxComments=all&maxLikes=0", true);
	oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
	oReq.send();


}


function calcCmtTime(e){
	if (typeof(e.target.parentNode.parentNode.parentNode.createdAt) !== "undefined" ){
		var absUxTime = e.target.parentNode.parentNode.parentNode.createdAt*1;
		var txtdate = new Date(absUxTime ).toString();
		
		e.target.title =  relative_time(absUxTime) + " ("+ txtdate.slice(0, txtdate.indexOf("(")).trim()+ ")";
	}
}


function me(e){
	e.target.href = gConfig.front+gMe["users"]["username"];
}

function home(e){
    e.target.href = gConfig.front;
}

function directs(e){
    e.target.href = gConfig.front+ "filter/direct";
}
function my(e){
    e.target.href = gConfig.front+ "filter/discussions";
}

function newDirectInp(e){
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
function ftClose(e){
	var victim =e.target;while(victim.className != "friends-tip") victim = victim.parentNode;
	victim.inp.tip = undefined;
	document.body.removeChild(victim);

}
function selectFriend(e){
	var victim =e.target; do victim = victim.parentNode; while(victim.className != "friends-tip");
	victim.inp.value = e.target.innerHTML;

}
function postDirect(e){
	var victim =e.target; do victim = victim.parentNode; while(victim.className != "new-post");
	var input = victim.cNodes["new-post-to"].cNodes["new-direct-input"].value;
	if ((input != "") && (typeof gUsers.byName[input] !== "undefined") 
		&& gUsers.byName[input].friend && (gUsers.byName[input].subscriber||gUsers.byName[input].type == "group")) 
		victim.cNodes["new-post-to"].feeds.push(input);
	if (victim.cNodes["new-post-to"].feeds.length) newPost(e);	
	else alert("should have valid recipients");
}

function logout(){
	matrix.ready = 0;
	matrix.logout();
	window.localStorage.removeItem("gMe");
	deleteCookie("token");
	location.reload();
}
function newPostRemoveFeed(e){
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
function newDirectRemoveFeed(e){
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
function newPostAddFeed(e){
	e.target.parentNode.cNodes["new-post-feed-select"].hidden = false;
}
function newDirectAddFeed(e){
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
function newPostSelect(e){
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
function genUserPopup(e){
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
function upClose(e){
	var node = e.target; while(node.className != "user-popup")node = node.parentNode;
	node.parentNode.removeChild(node);
}
function destroy(e){
	if (!e.currentTarget.parentNode)return;
	if (e.eventPhase != Event.AT_TARGET)return;
	e.target.parentNode.removeChild(e.target);
	//e.stopPropagation();

}
function realTimeSwitch(e){
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
function setRTCooldown(e){
	var bump = e.target.value;
	window.localStorage.setItem("rtbump",bump);
	if(gRt.on)gRt.handlers.setBumpCooldown( bump);
}


