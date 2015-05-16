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
 	var l =  post.likes.length;
	for (var idx = 0; idx< l;idx++) {
		var like = post.likes[idx];		
		if(like == gMe.users.id){
			post.likes.splice(idx,1);
			post.likes.unshift(like);
			break;
		}
	}
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
	if(post.likes[0] == gMe.users.id){
		postNBody.cNodes["post-info"].myLike = likesNode.children[0];
		if( postNBody.cNodes["post-info"].likeNode) {
			postNBody.cNodes["post-info"].likeNode.innerHTML = "Un-like";
			postNBody.cNodes["post-info"].likeNode.action = false;
		}

	}
}
function draw(content){
	var body = document.getElementsByTagName("body")[0];
	gComments = new Object();
	gUsers= new Object();
	gAttachments  = new Object();
	gTimelines = content.timelines;
	if(content.attachments)content.attachments.forEach(function(attachment){ gAttachments[attachment.id] = attachment; });
	if(content.comments)content.comments.forEach(function(comment){ gComments[comment.id] = comment; });
	content.users.forEach(function(user){
			gUsers[user.id] = user;
			gUsers[user.id].link = "<a href=" + gConfig.static +  user.username+">"+ user.screenName+'</a>';
			if(!user.profilePictureMediumUrl)user.profilePictureMediumUrl = gConfig.static + "/img/default-userpic-48.png";
	});
	var addPostNode = gNodes['new-post'].cloneAll();
	body.appendChild(addPostNode );
	body.posts = document.createElement("div");
	body.appendChild(body.posts);
	content.posts.forEach(function(post){ body.posts.appendChild(genPost(post)); });
}
function postHide(e,action){
	console.log(e);

}
function genPost(post){
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
			attNode.innerHTML = '<img src='+gAttachments[post.attachments[att]].thumbnailUrl+'>';
			attsNode.appendChild(attNode);
		}		
	}
	postNBody.cNodes["post-info"].cNodes["post-controls"].cNodes["post-date"].innerHTML = "<a href='"+ gConfig.static + user.username+'/'+post.id+ "?offset=0' >"+ (new Date(post.updatedAt*1)).toLocaleString()+"</a>";

	var nodeControls;
	if (post.createdBy == gMe.users.id)
		nodeControls = gNodes['controls-self'].cloneAll();
	else {
		nodeControls = gNodes['controls-others'].cloneAll();
		postNBody.cNodes["post-info"].likeNode = nodeControls.cNodes['post-control-like'];
		nodeControls.cNodes['post-control-like'].action = true;
	}
	var aHide = document.createElement('a');
	aHide.innerHTML = 'Hide';
	aHide.addEventListener("click",function(){
			postHide(this,true);
			});
	nodeControls.appendChild(aHide);
	postNBody.cNodes["post-info"].cNodes["post-controls"].appendChild( nodeControls);
	if (post.likes)	genLikes(post, postNBody );
	if (post.comments){
		var l = post.comments.length;
		for (var idx = 0; idx < (2<l?2:l) ; idx++)
			postNBody.cNodes['comments'].appendChild(genComment(gComments[post.comments[idx]]));
		if (l>3){
			var commentNode = gNodes['comment'].cloneAll();
			commentNode.cNodes['comment-date'].innerHTML = '';
			commentNode.cNodes['comment-body'].innerHTML = '<a id='+post.id+'-unc  onclick="unfoldComm(\''+post.id +'\')" style="font-style: italic;">'+(l-3)+' more comments</a>';
			postNBody.cNodes['comments'].appendChild(commentNode);
		}
		if(l>2)
			postNBody.cNodes['comments'].appendChild(genComment(gComments[post.comments[l-1]]));
		if(l>3){
			var aAddComment = document.createElement('a');
			aAddComment.className = 'post-control-comment';
			aAddComment.innerHTML = 'Comment';
			aAddComment.addEventListener("click",addComment);
			postNBody.cNodes['comments'].parentNode.appendChild( aAddComment);
		}
	}
	return postNode;

}
function newPost(e){
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		if(this.status < 400){
			e.target.parentNode.parentNode.cNodes['edit-txt-area'].value = '';
			var post = JSON.parse(this.response).posts;
			document.body.posts.insertBefore(genPost(post), document.body.posts.childNodes[0]);
		}
	};

	oReq.open("post",gConfig.serverURL + "posts", true);
	oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
	oReq.setRequestHeader("Content-type","application/json");
	var post = new Object();
	post.body = e.target.parentNode.parentNode.cNodes['edit-txt-area'].value;
	/*comment.postId = postNode.id;
	comment.createdAt = null;
	comment.createdBy = null;
	comment.updatedAt = null;
	comment.post = null;
	*/
	var postdata = new Object();
	postdata.post = post;
	postdata.meta = new Object();
	postdata.meta.feeds = gMe.users.username;
	oReq.send(JSON.stringify(postdata));
}
function editPost(e) {
	var victim = e.target; do victim = victim.parentNode; while(victim.className != 'post');
	var editNode = genEditNode(postEditedPost,cancelEditPost);
	editNode.cNodes['edit-txt-area'].value = victim.rawData.body;
	victim.cNodes['post-body'].replaceChild( editNode, victim.cNodes['post-body'].cNodes['post-cont']);
}
function cancelEditPost(e){
         var victim = e.target; do victim = victim.parentNode; while(victim.className != 'post');
	 var postCNode = document.createElement('div');
	 postCNode.innerHTML = victim.rawData.body;
	 postCNode.className = 'post-cont';
	 victim.cNodes['post-body'].replaceChild(postCNode,e.target.parentNode.parentNode );
	 victim.cNodes['post-body'].cNodes['post-cont'] = postCNode;

}
function postEditedPost(e){
	var postNode =e.target; do postNode = postNode.parentNode; while(postNode.className != 'post');
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		if(this.status < 400){
			var post = JSON.parse(this.response).posts;
			var postCNode = document.createElement('div');
			postCNode.innerHTML = post.body;
			postCNode.className = 'post-cont';
			postNode.rawData = post;
			postNode.cNodes['post-body'].replaceChild(postCNode,e.target.parentNode.parentNode );
			postNode.cNodes['post-body'].cNodes['post-cont'] = postCNode;
		}
	};

	oReq.open("put",gConfig.serverURL + "posts/"+postNode.id, true);
	oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
	oReq.setRequestHeader("Content-type","application/json");
	var post = new Object();
	post.body = e.target.parentNode.parentNode.cNodes['edit-txt-area'].value;
	post.createdAt = postNode.rawData.createdAt;
	post.createdBy = postNode.rawData.createdAt;
	post.updatedAt = Date.now();
	var postdata = new Object();
	postdata.post = post;
	oReq.send(JSON.stringify(postdata));
}
function deletePost(e){
	var victim =e.target; do victim = victim.parentNode; while(victim.className != 'post');
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		if(this.status < 400){
			victim.parentNode.removeChild(victim);
			//delete gPosts[victim.id];
		}
	};
	oReq.open("delete",gConfig.serverURL + "posts/"+victim.id, true);
	oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
	oReq.setRequestHeader("Content-type","application/json");
	oReq.send();
}
function postLike(e){
	var oReq = new XMLHttpRequest();

	oReq.onload = function(){
		if(this.status < 400){	
			if(e.target.action){
				var idx;
				var likesNode = e.target.parentNode.parentNode.parentNode.cNodes["likes"];
				var likesUL;
				if (!likesNode.children.length){
					likesUL = document.createElement( 'ul');
					likesUL.className ="p-timeline-user-likes";
					var suffix = document.createElement("span");
					suffix.id = e.target.parentNode.postId+'-unl';
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
				if(likesUL.children.length)likesUL.insertBefore(likeNode, likesUL.children[0]);
				else likesUL.appendChild(likeNode);
				e.target.parentNode.parentNode.parentNode.myLike = likeNode;
			}else{
				var myLike = e.target.parentNode.parentNode.parentNode.myLike;
				likesUL = myLike.parentNode;
				likesUL.removeChild(myLike);  	
				if (!likesUL.children.length) likesUL.parentNode.innerHTML = '';
			 }
			e.target.innerHTML=e.target.action?'Un-like':'Like';
			e.target.action = !e.target.action; 
		};
	}
	

		oReq.open("post",gConfig.serverURL + "posts/"+ e.target.parentNode.parentNode.parentNode.parentNode.parentNode.id+"/"+(e.target.action?"like":"unlike"), true);
		oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
		oReq.send();
		
}
function genEditNode(post,cancel){
	var editNode = gNodes['edit'].cloneAll();
	editNode.cNodes["edit-buttons"].cNodes["edit-buttons-post"].addEventListener('click',post);
	editNode.cNodes["edit-buttons"].cNodes["edit-buttons-cancel"].addEventListener('click',cancel);
	return editNode;
}
function addComment(e){
	var postNBody = e.target; do postNBody = postNBody.parentNode; while(postNBody.className != 'post-body');
	var commentNode = gNodes['comment'].cloneAll();
	 commentNode.cNodes['comment-body'].appendChild(genEditNode(postNewComment,cancelNewComment));
	postNBody.cNodes['comments'].appendChild(commentNode);
}
function editComment(e){
	var victim = e.target; do victim = victim.parentNode; while(victim.className != 'comment');
	var editNode = genEditNode(postEditComment,cancelEditComment);
	var commentNode = gNodes['comment'].cloneAll();
	editNode.cNodes['edit-txt-area'].value = gComments[victim.id].body;
	//commentNode.replaceChild(editNode, commentNode.cNodes['comment-body']);
	 commentNode.cNodes['comment-body'].appendChild(editNode);
	victim.parentNode.replaceChild( commentNode, victim);
	commentNode.id = victim.id;

}

function postEditComment(e){
	var commentNode = e.target; do commentNode = commentNode.parentNode; while(commentNode.className != 'comment');
	var comment = gComments[commentNode.id];
	comment.body = e.target.parentNode.parentNode.cNodes['edit-txt-area'].value;
	comment.updatedAt = Date.now();
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		if(this.status < 400){
			var comment = JSON.parse(this.response).comments;
			commentNode.parentNode.replaceChild(genComment(comment),commentNode);
			gComments[comment.id] = comment;

		}
	};

	oReq.open("put",gConfig.serverURL + "comments/"+comment.id, true);
	oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
	oReq.setRequestHeader("Content-type","application/json");
	var postdata = new Object();
	postdata.comment = comment;
	postdata.users = new Array(gMe);
	oReq.send(JSON.stringify(postdata));

};
function cancelEditComment(e){
	var commentNode = e.target; do commentNode = commentNode.parentNode; while(commentNode.className != 'comment');
	 commentNode.parentNode.replaceChild(genComment( gComments[commentNode.id]),commentNode);
};
function processText(e) {
	if (e.target.scrollHeight > e.target.clientHeight) 
		e.target.style.height = e.target.scrollHeight + "px";
	if (e.which == '13'){
		
		e.target.nextSibling.cNodes["edit-buttons-post"].dispatchEvent(new Event('click'));
	}
	
}
function cancelNewComment(e){ 
	var commentNode = e.target;
	for(var idx = 4; idx;idx--)commentNode = commentNode.parentNode;
	commentNode.parentNode.removeChild(commentNode);

}
function postNewComment(e){
		sendComment(e.target.parentNode.previousSibling);
}
function deleteComment(e){
	var commentNode =e.target; do commentNode = commentNode.parentNode; while(commentNode.className != 'comment');
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		if(this.status < 400){
			commentNode.parentNode.removeChild(commentNode);
			delete gComments[commentNode.id];
		}
	};
	oReq.open("delete",gConfig.serverURL + "comments/"+commentNode.id, true);
	oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
	oReq.setRequestHeader("Content-type","application/json");
	oReq.send();
}
function sendComment(textField){
	var commentNode =textField; do commentNode = commentNode.parentNode; while(commentNode.className != 'comment');
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		if(this.status < 400){
			textField.value = '';
			var comment = JSON.parse(this.response).comments;
			commentNode.parentNode.insertBefore(genComment(comment),commentNode);
			gComments[comment.id] = comment;

		}
	};

	oReq.open("post",gConfig.serverURL + "comments", true);
	oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
	oReq.setRequestHeader("Content-type","application/json");
	var comment = new Object();
	comment.body = textField.value.slice(0, -1);
	var postNode =textField; do postNode = postNode.parentNode; while(postNode.className != 'post');
	comment.postId = postNode.id;
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
	commentNode.id = comment.id;
	if(cUser.id == gMe.users.id) commentNode.cNodes['comment-body'].appendChild(gNodes['comment-controls'].cloneAll());
	return commentNode; 
}
function unfoldComm(id){
	var post = document.getElementById(id).rawData;
	var unfoldNode  = document.getElementById(id+'-unc');
	var commentsNode = unfoldNode.parentNode.parentNode.parentNode;
	var cNode = genComment(gComments[post.comments[ post.comments.length-2]]); 
	commentsNode.replaceChild(cNode, unfoldNode.parentNode.parentNode); 
	for(var idx = post.comments.length - 3; idx > 1; idx--)
		cNode =commentsNode.insertBefore(genComment(gComments[post.comments[idx]]), cNode); 
}
function genCNodes(node, proto){
	node.cNodes = new Object(); 
	for(var idx = 0; idx <  node.children.length; idx++){
		genCNodes(node.children[idx], proto.children[idx]);
		node.cNodes[node.children[idx].className] = node.children[idx];
	}
	if (proto.e) 
		for(action in proto.e)
			node.addEventListener(action, window[proto.e[action]]);	
}
function genNodes(templates){
	var nodes = new Array();
	//oTemplates = JSON.parse(templates);
	templates.forEach(function(template){
				if (!template.t)template.t = 'div';
				var node = document.createElement(template.t); 
				node.cloneAll = function(){
					var newNode = this.cloneNode(true); 
					genCNodes(newNode, this);
					return newNode;
				};
				if(template.c)node.className = template.c; 
				if(template.children)
				genNodes(template.children).forEach(function(victim){
					node.appendChild(victim);
				});
				if(template.txt) node.innerHTML = template.txt;
				if(template.e) node.e = template.e;
				if(template.p) for(p in template.p) node[p] =  template.p[p];
				nodes.push(node);
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
		genNodes(templates.nodes).forEach(
				function(node){
				gNodes[node.className] = node; 
				});
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){draw(JSON.parse(this.response))};
		oReq.open("get",gConfig.serverURL + "timelines/home?offset=0", true);
		oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
		oReq.send();
	}
}

