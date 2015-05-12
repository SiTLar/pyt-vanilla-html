function unfoldLikes(id){
	var post = document.getElementById(id).rawData;
	var span  = document.getElementById(id+'-unl');
	var likesNode = span.parentNode;
	likesNode.removeChild(span);
	var idx;
	for(idx = 0; idx < likesNode.children.length; idx++)
		if (likesNode.children[idx].nodeName == 'UL')break;
	var likeNode = document.createElement('li');
	likeNode.className = "p-timeline-user-like";
	for(var like = 4; like < post.likes.length; like++){
		var cLikeNode = likeNode.cloneNode();
		cLikeNode.innerHTML = gUsers[post.likes[like]].link;
		likesNode.children[idx].appendChild(cLikeNode);
	}
	span = document.createElement('span');
	span.innerHTML = " liked this";
	likesNode.children[idx].appendChild(span);
}
function genLikes(post, postNBody){
	var likes = '<ul class="p-timeline-user-likes">';
 	var l =  post.likes.length;
	for (var idx = 0; idx < (4<l?4:l) ; idx++)
		likes+= '<li class="p-timeline-user-like"> '+gUsers[post.likes[idx]].link+'</li>';
	
	likes += '</ul>';
	if ( l > 4)
		likes += '<span id='+post.id+'-unl > and <a onclick="unfoldLikes(\''+post.id+'\')">'+ (post.likes.length - 4) +' other people</a>' ;
	else likes += '<span>';
	likes +=' liked this</span>';
	postNBody.cNodes["post-info"].cNodes["likes"].innerHTML = likes;
}
function draw(content){
	var body = document.getElementsByTagName("body")[0];
	comments = new Object();
	gUsers= new Object();
	var attachments  = new Object();
	if(content.attachments)content.attachments.forEach(function(attachment){ attachments[attachment.id] = attachment; });
	if(content.comments)content.comments.forEach(function(comment){ comments[comment.id] = comment; });
	content.users.forEach(function(user){
			gUsers[user.id] = user;
			gUsers[user.id].link = "<a href=" + gConfig.static +  user.username+">"+ user.screenName+'</a>';
			if(!user.profilePictureMediumUrl)user.profilePictureMediumUrl = gConfig.static + "/img/default-userpic-48.png";
	});
	content.posts.forEach(function(post){
			var postNode = gNodes['post'].cloneAll();
			var postNBody = postNode.cNodes["post-body"];
			var user = gUsers[post.createdBy];
			postNode.rawData = post;
			postNode.id = post.id;
			postNBody.cNodes["post-cont"].innerHTML =  autolinker.link(post.body);
			postNode.cNodes["avatar"].innerHTML = '<img src="'+ user.profilePictureMediumUrl+'" />';
			postNBody.cNodes["title"].innerHTML =  user.link;
			if(post.attachments){
				var attsNode = postNBody.cNodes["attachments"];
				for(att in post.attachments){
					var attNode = gNodes['attachment'].cloneAll();
					attNode.innerHTML = '<img src='+attachments[post.attachments[att]].thumbnailUrl+'>';
					attsNode.appendChild(attNode);

				}		
			
			}
			postNBody.cNodes["post-info"].innerHTML = "<span class='post-date'><a href='"+ gConfig.static + user.username+'/'+post.id+ "?offset=0' >"+ (new Date(post.updatedAt*1)).toLocaleString()+"</a></span>";
			var nodeControls = gNodes[(post.id==gMe.id?"controls-self":"controls-others")].cloneAll();
			nodeControls.postId = post.id;
			nodeControls.className ='post-controls';/*
			nodeControls.innerHTML = " <a href='javascript:' onclick=addComment(this)>Comment</a> -";
			if (post.createdBy == gMe.users.id)  nodeControls.innerHTML += " <a href='javascript:'='javascript:' onclick=postEdit(this)>Edit</a> - <a href='javascript:' onclick=postDestroy(this)>Destroy</a> -"; 
			else  nodeControls.innerHTML += " <a href=
			'javascript:' onclick=postLike(this,true)>Like</a> - ";
			*/

			var aHide = document.createElement('a');
			aHide.href = "javascript:";
			aHide.innerHTML = 'Hide';
			aHide.addEventListener("click",function(){ postHide(this,true); });
			nodeControls.appendChild(aHide);
			 postNBody.cNodes["post-info"].appendChild( nodeControls);
			if (post.likes)	genLikes(post, postNBody );
			if (post.comments){
				var l = post.comments.length;
				for (var idx = 0; idx < (2<l?2:l) ; idx++)
					postNBody.cNodes['comments'].appendChild(genComment(comments[post.comments[idx]]));
				if (l>3){
					var commentNode = gNodes['comment'].cloneAll();
					commentNode.cNodes['comment-body'].innerHTML = '<a id='+post.id+'-unc  onclick="unfoldComm(\''+post.id +'\')" style="font-style: italic;">'+(l-4)+' more comments</a>';
					postNBody.cNodes['comments'].appendChild(commentNode);
				}
				if(l>2)
					postNBody.cNodes['comments'].appendChild(genComment(comments[post.comments[l-1]]));
			}
			body.appendChild(postNode);
	});
}
function postHide(e,action){
	console.log(e);

}
function initLike(e){
	postLike(e.target, true);
}
function postLike(callee, action){
	var oReq = new XMLHttpRequest();
		oReq.onload = function(){callee.innerHTML=action?'Un-like':'Like';callee.onclick=function(){postLike(callee,!action);}; };
		oReq.open("post",gConfig.serverURL + "posts/"+ callee.parentNode.parentNode.parentNode.parentNode.id+"/"+(action?"like":"unlike"), true);
		oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
		oReq.send();
}
function addComment(e){
	var postNode = document.getElementById(e.target.parentNode.postId);
	var commentNode = gNodes['comment'].cloneAll();
	var text = document.createElement('textarea');
	var bPost = document.createElement('button');
	var aCancel = document.createElement('a');
	var conrolsNode = document.createElement('div');
	bPost.textContent = "Post";
	bPost.addEventListener("click",function(){sendComment(text);});
	aCancel.innerHTML = "Cancel";
	aCancel.addEventListener("click",function(){ text.postNBody.cNodes['comments'].removeChild(commentNode);} );
	text.className = "edit-comment-area";
	bPost.className = "control-button-post";
	text.addEventListener('keyup',  processText);
	commentNode.cNodes['comment-body'].appendChild(text);
	conrolsNode.appendChild(bPost);
	conrolsNode.appendChild(aCancel);
	commentNode.cNodes['comment-body'].appendChild(conrolsNode);
	text.postNBody = postNode.cNodes["post-body"];
	text.postNBody.cNodes['comments'].appendChild(commentNode);
}
function processText(e) {
	if (e.target.scrollHeight > e.target.clientHeight) 
		e.target.style.height = e.target.scrollHeight + "px";
	if (e.which == '13') sendComment(e.target);
}
function sendComment(textField){
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){textField.postNBody.cNodes['comments'].insertBefore(genComment(JSON.parse(this.response).comments),textField.parentNode.parentNode);};
		oReq.open("post",gConfig.serverURL + "comments", true);
		oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
		oReq.setRequestHeader("Content-type","application/json");
		var comment = new Object();
		comment.body = textField.value.slice(0, -1);
		textField.value = '';
		comment.postId = textField.postNBody.parentNode.id;
		comment.createdAt = null;
		comment.createdBy = null;
		comment.updatedAt = null;
		comment.post = null;
		var postdata = new Object();
		postdata.comment = comment;
		oReq.send(JSON.stringify(postdata));
}
function genComment(comment){
	var commentNode = gNodes['comment'].cloneAll();
	var cUser = gUsers[comment.createdBy];
	commentNode.cNodes['comment-body'].innerHTML = autolinker.link(comment.body)+ " - " + cUser.link ;
	return commentNode; 
}
function unfoldComm(id){
	var post = document.getElementById(id).rawData;
	var unfoldNode  = document.getElementById(id+'-unc');
	var commentsNode = unfoldNode.parentNode.parentNode;
	var cNode = genComment(comments[post.comments[ post.comments.length-2]]); 
	commentsNode.replaceChild(cNode, unfoldNode.parentNode); 
	for(var idx = post.comments.length - 3; idx > 2; idx--)
		cNode =commentsNode.insertBefore(genComment(comments[post.comments[idx]]), cNode); 
}
function genCNodes(node){
	node.cNodes = new Object(); 
	for(var child in node.children){
		genCNodes(node.children[child]);
		node.cNodes[node.children[child].className] = node.children[child];
	}
}
function genNodes(templates){
	var nodes = new Array();
	templates.forEach(function(nTempl){
		if(!nTempl.t)nTempl.t='div';
		var cNode = document.createElement(nTempl.t); 
		if(nTempl.txt) cNode.innerHTML = nTempl.txt;
		cNode.cloneAll = function(){
			var newNode = this.cloneNode(true); 
			genCNodes(newNode);
			if (this.e) 
				for(action in this.e)
					newNode.addEventListener(action, window[this.e[action]]);	
			return newNode;
		};
		cNode.className = nTempl.c; 
		if (nTempl.children)
			genNodes(nTempl.children).forEach(function(node){cNode.appendChild(node)});
		
		if (nTempl.e)cNode.e = nTempl.e; 
		nodes.push(cNode);	
	} );
	return nodes;

}
function auth(){
	var token = window.localStorage.getItem("token");
	var oReq = new XMLHttpRequest();
	if(token){
		oReq.open("get", gConfig.serverURL +"users/whoami", false);
		oReq.setRequestHeader("X-Authentication-Token", token);
		oReq.send();
		if(oReq.status < 400) {
			gMe = JSON.parse(oReq.response);
			if (gMe.users) return true;
		}
	}
	var authNode = document.createElement("div");
	authNode.className = "authNode";
	authNode.innerHTML = "<div id=auth-msg>&nbsp;</div><form action='javascript:' onsubmit=getauth(this)><table><tr><td>Username</td><td><input name='username' id=a-user type='text'></td></tr><tr><td>Password</td><td><input name='password' id=a-pass type='password'></td></tr><tr><td><input type='submit' value='Log in'></td></tr></table></form>";
	document.getElementsByTagName("body")[0].appendChild(authNode);
	return false;
	
}
function getauth(oFormElement){
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		if(this.status < 400){	
			window.localStorage.setItem("token", JSON.parse(this.response).authToken);
			 document.getElementsByTagName("body")[0].removeChild(document.getElementsByClassName("authNode")[0]);
			initDoc();
		}else document.getElementById('auth-msg').innerHTML = this.statusText;
	};
	oReq.open("post", gConfig.serverURL +"session", true);
	oReq.setRequestHeader("X-Authentication-Token", null);
	oReq.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	oReq.send("username="+document.getElementById('a-user').value+"&password="+document.getElementById('a-pass').value);
}
function initDoc(){
	
	if (auth()){
		autolinker = new Autolinker({'truncate':20,  'twitter':false} );

		gNodes = new Object();
		genNodes(templates.nodes).forEach(function(node){gNodes[node.className ] = node;});
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){draw(JSON.parse(this.response))};
		oReq.open("get",gConfig.serverURL + "timelines/home?offset=0", true);
		oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
		oReq.send();
	}
}

