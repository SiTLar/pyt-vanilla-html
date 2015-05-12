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
	var likesNode = document.createElement( 'ul');
	likesNode.className ="p-timeline-user-likes";

	for (var idx = 0; idx< post.likes.lenght;idx++) {
		var like = post.likes[idx];		
		if(like == gMe.users.id){
			arr.splice(idx,1);
			arr.unshift(like);
			break;
		}
	}
	
 	var l = post.likes.length;
	var likeNode = document.createElement('li');
	likeNode.className = "p-timeline-user-like";
	for (var idx = 0; idx < (4<l?4:l) ; idx++){
		var cLikeNode = likeNode.cloneNode();
		cLikeNode.innerHTML = gUsers[post.likes[idx]].link;
		likesNode.appendChild(cLikeNode);
	}
	var suffix = document.createElement("span");
	suffix.id = post.id+'-unl' 
	if ( l > 4)
		suffix.innerHTML = 'and <a onclick="unfoldLikes(\''+post.id+'\')">'+ (post.likes.length - 4) +' other people</a>' ;
	suffix.innerHTML += ' liked this';
	postNBody.cNodes["post-info"].cNodes["likes"].appendChild(likesNode);
	postNBody.cNodes["post-info"].cNodes["likes"].appendChild(suffix);
	if(post.likes[0] == gMe.users.id)likesNode.parentNode.parentNode.myLike = likesNode.children[0];
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
			var spDate = document.createElement("span");
			spDate.innerHTML = "<a href='"+ gConfig.static + user.username+'/'+post.id+ "?offset=0' >"+ (new Date(post.updatedAt*1)).toLocaleString()+"</a>";
			postNBody.cNodes["post-info"].cNodes["controls"].appendChild(spDate);
			var nodeControls = document.createElement("span");
			var aLike = document.createElement('a');
			nodeControls.postId = post.id;
			nodeControls.className ='post-controls';
			nodeControls.innerHTML = " <a href='javascript:' onclick=addComment(this)>Comment</a> - ";
			if (post.createdBy == gMe.users.id)  nodeControls.innerHTML += "<a href='javascript:'='javascript:' onclick=postEdit(this)>Edit</a> - <a href='javascript:' onclick=postDestroy(this)>Destroy</a> - "; 
			else nodeControls.appendChild(aLike);
			var aHide = document.createElement('a');
			aHide.href = "javascript:";
			aHide.innerHTML = 'Hide';
			aHide.addEventListener("click",function(){
			postHide(this,true);
			});
			nodeControls.appendChild(aHide);
			nodeControls.likes = postNBody.cNodes["post-info"].cNodes["likes"];
			 postNBody.cNodes["post-info"].cNodes["controls"].appendChild( nodeControls);
			if (post.likes)	genLikes(post, postNBody );
			var action = !!(postNBody.cNodes["post-info"].myLike);
			aLike.innerHTML=action?'Un-like - ':'Like - ';aLike.onclick=function(){postLike(this,!action);}; 
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
function postLike(callee, action){
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		if(this.status < 400){	
			callee.innerHTML=action?'Un-like - ':'Like - ';callee.onclick=function(){postLike(callee,!action);}; 
			if(action){
				var idx;
				var likesNode = callee.parentNode.likes;
				var likesUL;
				if (!likesNode.children.length){
					likesUL = document.createElement( 'ul');
					likesUL.className ="p-timeline-user-likes";
					var suffix = document.createElement("span");
					suffix.id = callee.parentNode.postId+'-unl';
					suffix.innerHTML = " liked this";
					likesNode.appendChild(likesUL);
					likesNode.appendChild(suffix);

				}else {

					for(idx = 0; idx < likesNode.children.length; idx++)
						if (likesNode.children[idx].nodeName == 'UL')break;
					likesUL = likesNode.children[idx];
				}
				var likeNode = document.createElement('li');
				likeNode.className = "p-timeline-user-like";
				likeNode.innerHTML = gUsers[gMe.users.id].link;
				if(likesUL.children.length)likesUL.insertBefore(likeNode, likesUL.children[idx].children[0]);
				else likesUL.appendChild(likeNode);
				callee.parentNode.parentNode.parentNode.myLike = likeNode;
			}else{
				var myLike = callee.parentNode.parentNode.parentNode.myLike;
				likesUL = myLike.parentNode;
				likesUL.removeChild(myLike);  	
				if (!likesUL.children.length) likesUL.parentNode.innerHTML = '';
			 }

		};
	}
	oReq.open("post",gConfig.serverURL + "posts/"+ callee.parentNode.parentNode.parentNode.parentNode.parentNode.id+"/"+(action?"like":"unlike"), true);
	oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
	oReq.send();

}
function addComment(callee){
	var postNode = document.getElementById(callee.parentNode.postId);
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
		oReq.onload = function(){
			if(this.status < 400){
			textField.postNBody.cNodes['comments'].insertBefore(genComment(JSON.parse(this.response).comments),textField.parentNode.parentNode);
			}
		};
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
function genNodes(divs){
	var nodes = new Object();
	//oTemplates = JSON.parse(templates);
	divs.forEach(function(div){
		nodes[div.c] = document.createElement("div"); 
		nodes[div.c].cloneAll = function(){
			var newNode = this.cloneNode(true); 
			genCNodes(newNode);
			return newNode;
		};
		nodes[div.c].className = div.c; 
		if (div.children){
			var children = genNodes(div.children);
			for (var node in children){
				nodes[div.c].appendChild(children[node]);
			};
		};
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
		gNodes = genNodes(templates.divs);
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){draw(JSON.parse(this.response))};
		oReq.open("get",gConfig.serverURL + "timelines/home?offset=0", true);
		oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
		oReq.send();
	}
}

