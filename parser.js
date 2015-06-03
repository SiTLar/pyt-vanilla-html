'use strict';

var gUsers = new Object();
var gNodes = new Object();
var gMe = new Object();
var gComments = new Object();
var gAttachments  = new Object();
var gTimelines = content.timelines;
var autolinker = new Autolinker({'truncate':20,  'replaceFn':frfAutolinker } );
function unfoldLikes(id){
	var post = document.getElementById(id).rawData;
	var span  = document.getElementById(id+'-unl');
	var nodeLikes = span.parentNode;
	nodeLikes.removeChild(span);
	if (post.omittedLikes > 0){
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(oReq.status < 400){
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
		oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
		oReq.send();

	}else  writeAllLikes(id, nodeLikes);
}

function writeAllLikes(id,nodeLikes){
	var post = document.getElementById(id).rawData;
	var idx;
	for(idx = 0; idx < nodeLikes.childNodes.length; idx++)
		if (nodeLikes.childNodes[idx].nodeName == 'UL')break;
	var nodeLike = document.createElement('li');
	nodeLike.className = "p-timeline-user-like";
	for(var like = 4; like < post.likes.length; like++){
		var nodeCLike = nodeLike.cloneNode();
		nodeCLike.innerHTML = gUsers[post.likes[like]].link;
		nodeLikes.childNodes[idx].appendChild(nodeCLike);
	}
	span = document.createElement('span');
	span.innerHTML = " liked this";
	nodeLikes.childNodes[idx].appendChild(span);
}
function genLikes(post, postNBody){
	postNBody.cNodes["post-info"].cNodes["likes"].appendChild(gNodes['likes-smile'].cloneNode(true));
	var nodeLikes = document.createElement( 'ul');
 	var l =  post.likes.length;
	for (var idx = 0; idx< l;idx++) {
		var like = post.likes[idx];		
		if(like == gMe.users.id){
			post.likes.splice(idx,1);
			post.likes.unshift(like);
			break;
		}
	}
	var nodeLike = document.createElement('li');
	nodeLike.className = "p-timeline-user-like";
	for (var idx = 0; idx < (4<l?4:l) ; idx++){
		var nodeCLike = nodeLike.cloneNode();
		nodeCLike.innerHTML = gUsers[post.likes[idx]].link;
		nodeLikes.appendChild(nodeCLike);
	}
	var suffix = document.createElement("span");
	suffix.id = post.id+'-unl' 
	if (post.omittedLikes>0) l += post.omittedLikes;
	if ( l > 4)
		suffix.innerHTML = 'and <a onclick="unfoldLikes(\''+post.id+'\')">'+ (l - 4) +' other people</a>' ;
	suffix.innerHTML += ' liked this';
	postNBody.cNodes["post-info"].cNodes["likes"].appendChild(nodeLikes);
	postNBody.cNodes["post-info"].cNodes["likes"].appendChild(suffix);
	if(post.likes[0] == gMe.users.id){
		postNBody.cNodes["post-info"].myLike = nodeLikes.childNodes[0];
		if( postNBody.cNodes["post-info"].nodeLike) {
			postNBody.cNodes["post-info"].nodeLike.innerHTML = "Un-like";
			postNBody.cNodes["post-info"].nodeLike.action = false;
		}

	}
}
function addUser (user){
	if (typeof gUsers[user.id] !== 'undefined' ) return;
	gUsers[user.id] = user;
	gUsers[user.id].link = "<a href=" + gConfig.front+  user.username+">"+ user.screenName+'</a>';
	if(!user.profilePictureMediumUrl)user.profilePictureMediumUrl = gConfig.static+ "img/default-userpic-48.png";
}

function draw(content){
	var body = document.getElementsByTagName("body")[0];
	if(content.attachments)content.attachments.forEach(function(attachment){ gAttachments[attachment.id] = attachment; });
	//if(content.comments)content.comments.forEach(function(comment){ if (typeof gComments[comment.id] === 'undefined') gComments[comment.id] = comment; });
	if(content.comments)content.comments.forEach(function(comment){ gComments[comment.id] = comment; });
	content.users.forEach(addUser);
	var title =  document.createElement("div");
	title.innerHTML = "<h1>" +document.timeline+ "</h1>"
	body.appendChild(title);
	body.appendChild(gNodes['controls-user'].cloneAll());
	if (!document.timeline||(document.timeline == 'home')){
		var nodeAddPost = gNodes['new-post'].cloneAll();
		body.appendChild(nodeAddPost);
	}
	if(content.timelines){
		var nodeMore = document.createElement("div");
		nodeMore.className = 'more-node';
		var htmlOffset = '<a href="' + gConfig.front+document.timeline ;
		var backward = document.skip*1 - gConfig.offset*1;
		var forward = document.skip*1 + gConfig.offset*1;
		if (document.skip){
			if (backward>0)htmlOffset += '?offset=' + backward*1;
			htmlOffset += '"><span style="font-size: 200%">&larr;</span> Newer items</a>&nbsp;<a href="' + gConfig.front+document.timeline;
		} 
		htmlOffset += '?offset=' + forward*1 + '">Older items <span style="font-size: 200%">&rarr;</span></a>';
		nodeMore.innerHTML = htmlOffset;
		body.appendChild(nodeMore.cloneNode(true));
		document.posts = document.createElement("div");
		body.appendChild(document.posts);
		document.hiddenPosts = new Array();
		document.hiddenCount = 0;
		var idx = 0;
		content.posts.forEach(function(post){
			post.idx = idx++;
			if(post.isHidden){
				document.hiddenPosts.push(post);
				document.hiddenCount++;
			}else{ 
				document.hiddenPosts.push(false);
				var nodePost = genPost(post);
				document.posts.appendChild(genPost(post));
			} 
		});
		var nodeShowHidden = gNodes['show-hidden'].cloneAll();
		nodeShowHidden.cNodes['href'].action = true;
		body.appendChild(nodeShowHidden);
		if(document.hiddenCount) nodeShowHidden.cNodes['href'].innerHTML= 'Show '+ document.hiddenCount + ' hidden entries';
		body.appendChild(nodeMore);
	}else body.appendChild(genPost(content.posts));
}
function showHidden(e){
	if(e.target.action){
		if(!document.hiddenCount)return;	
		var nodeHiddenPosts = document.createElement('div');
		nodeHiddenPosts.id = 'hidden-posts'; 
		document.hiddenPosts.forEach(function(post){if(post)nodeHiddenPosts.appendChild(genPost(post));});
		e.target.parentNode.parentNode.insertBefore(nodeHiddenPosts , e.target.parentNode.nextSibling);
		e.target.innerHTML =  'Collapse '+ document.hiddenCount + ' hidden entries';
	}else{
		var nodeHiddenPosts = document.getElementById('hidden-posts');
		if (nodeHiddenPosts) nodeHiddenPosts.parentNode.removeChild(nodeHiddenPosts);
		if (document.hiddenCount) e.target.innerHTML = 'Show '+ document.hiddenCount + ' hidden entries';
		else e.target.innerHTML = '';
	}
	e.target.action = !e.target.action; 
}
function postHide(e){
	var victim = e.target; do victim = victim.parentNode; while(victim.className != 'post');
	var oReq = new XMLHttpRequest();
	var aShow = document.getElementsByClassName('show-hidden')[0].cNodes["href"];
	oReq.onload = function(){
		if(this.status < 400){	
			if(e.target.action){
				victim.rawData.isHidden = true;
				document.hiddenPosts[victim.rawData.idx] = victim.rawData;
				victim.parentNode.removeChild(victim);
				document.hiddenCount++;
				aShow.action = false;
				aShow.dispatchEvent(new Event('click'));
			}else{
				var count = 0;
				var idx = victim.rawData.idx;
				do if(document.hiddenPosts[idx--])count++;
				while ( idx >0 );
				if ((victim.rawData.idx - count+1) >= document.posts.childNodes.length )document.posts.appendChild(victim);
				else document.posts.insertBefore(victim, document.posts.childNodes[victim.rawData.idx - count+1]);
				e.target.innerHTML = 'Hide';
				document.hiddenPosts[victim.rawData.idx] = false;
				document.hiddenCount--;
				if(document.hiddenCount) aShow.innerHTML = 'Collapse '+ document.hiddenCount + ' hidden entries'; 
				else aShow.dispatchEvent(new Event('click'));
			}
			e.target.action = !e.target.action; 
		};
	}
	

		oReq.open("post",gConfig.serverURL + "posts/"+ e.target.parentNode.parentNode.parentNode.parentNode.parentNode.id+"/"+(e.target.action?"hide":"unhide"), true);
		oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
		oReq.send();
		

	
}
function updateDate(node){
	node.innerHTML =  relative_time(node.date) ;
	window.setTimeout(updateDate, 5000, node );
}
function genPost(post){
	var nodePost = gNodes['post'].cloneAll();
	var postNBody = nodePost.cNodes["post-body"];
	var user = gUsers[post.createdBy];
	nodePost.rawData = post;
	nodePost.id = post.id;
	postNBody.cNodes["post-cont"].innerHTML =  autolinker.link(post.body);
	if(typeof user !== 'undefined'){
		nodePost.cNodes["avatar"].innerHTML = '<img src="'+ user.profilePictureMediumUrl+'" />';
		postNBody.cNodes["title"].innerHTML =  user.link;
	}
	if(post.attachments){
		var attsNode = postNBody.cNodes["attachments"];
		for(var att in post.attachments){
			var nodeAtt = gNodes['attachment'].cloneAll();
			nodeAtt.innerHTML = '<a target="_blank" href="'+gAttachments[post.attachments[att]].url+'" border=none ><img src='+gAttachments[post.attachments[att]].thumbnailUrl+'></a>';
			attsNode.appendChild(nodeAtt);
		}		
	}
//	postNBody.cNodes["post-info"].cNodes["post-controls"].cNodes["post-date"].innerHTML = "<a href='"+ gConfig.front+ user.username+'/'+post.id+ "' >"+ (new Date(post.updatedAt*1)).toLocaleString()+"</a>";
	var anchorDate = document.createElement("a");
	if(typeof user !== 'undefined') anchorDate.href = gConfig.front+user.username+'/'+post.id;
	postNBody.cNodes["post-info"].cNodes["post-controls"].cNodes["post-date"].appendChild(anchorDate);
	anchorDate.date = post.createdAt*1;

	window.setTimeout(updateDate, 10,anchorDate);

	var nodeControls;
	if (post.createdBy == gMe.users.id)
		nodeControls = gNodes['controls-self'].cloneAll();
	else {
		nodeControls = gNodes['controls-others'].cloneAll();
		postNBody.cNodes["post-info"].nodeLike = nodeControls.cNodes['post-control-like'];
		nodeControls.cNodes['post-control-like'].action = true;
	}
	var aHide = document.createElement('a');
	aHide.innerHTML = post.isHidden?'Un-hide':'Hide';
	aHide.action = !post.isHidden;
	aHide.addEventListener("click", postHide);
	nodeControls.appendChild(aHide);
	postNBody.cNodes["post-info"].cNodes["post-controls"].appendChild( nodeControls);
	if (post.likes)	genLikes(post, postNBody );
	if (post.comments){
		if(post.omittedComments){
			postNBody.cNodes['comments'].appendChild(genComment(gComments[post.comments[0]]));
			var nodeComment = gNodes['comment'].cloneAll();
			nodeComment.cNodes['comment-date'].innerHTML = '';
			nodeComment.cNodes['comment-body'].innerHTML = '<a id='+post.id+'-unc  onclick="unfoldComm(\''+post.id +'\')" style="font-style: italic;">'+ post.omittedComments+' more comments</a>';
			postNBody.cNodes['comments'].appendChild(nodeComment);
			postNBody.cNodes['comments'].appendChild(genComment(gComments[post.comments[1]]));
		}
		else post.comments.forEach(function(commentId){ postNBody.cNodes['comments'].appendChild(genComment(gComments[commentId]))});
	}
	postNBody.cNodes['comments'].cnt = postNBody.cNodes['comments'].childNodes.length;
	if (postNBody.cNodes['comments'].cnt > 4) 
			addLastCmtButton(postNBody);
	return nodePost;

}
function newPost(e){
	var textField = e.target.parentNode.parentNode.cNodes["edit-txt-area"];
	textField.disabled = true;
	e.target.disabled = true;
	if(textField.pAtt)textField.pAtt.then(send);
	else send();
	function send(){
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(this.status < 400){
				var nodeAtt = document.createElement('div');
				nodeAtt.className = 'attachments';
				textField.parentNode.replaceChild(nodeAtt, textField.parentNode.cNodes['attachments']);
				textField.parentNode.cNodes['attachments'] = nodeAtt;
				textField.value = '';
				textField.disabled = false;
				e.target.disabled = false;
				textField.style.height  = '4em';
				var res = JSON.parse(this.response);
				if(res.attachments)res.attachments.forEach(function(attachment){ gAttachments[attachment.id] = attachment; });
				document.posts.insertBefore(genPost(res.posts), document.posts.childNodes[0]);

			}
		};

		oReq.open("post",gConfig.serverURL + "posts", true);
		oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
		oReq.setRequestHeader("Content-type","application/json");
		var post = new Object();
		post.body = textField.value;
		if(textField.attachments) post.attachments = textField.attachments;
		/*comment.postId = nodePost.id;
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
}
function sendAttachment(e){
	e.target.disabled = true;
	var textField = e.target.parentNode.parentNode.cNodes["edit-txt-area"];
	var nodeSpinner = gNodes['attachment'].cloneAll();
	nodeSpinner.innerHTML = '<img src='+gConfig.static+"img/uploading.gif"+'>';
	e.target.parentNode.parentNode.cNodes['attachments'].appendChild(nodeSpinner);
	textField.pAtt = new Promise(function(resolve,reject){
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(this.status < 400){
				e.target.value = '';
				e.target.disabled = false;
				var attachments = JSON.parse(this.response).attachments;
				var nodeAtt = gNodes['attachment'].cloneAll();
				nodeAtt.innerHTML = '<a target="_blank" href="'+attachments.url+'" border=none ><img src='+attachments.thumbnailUrl+'></a>';
				nodeSpinner.parentNode.replaceChild(nodeAtt, nodeSpinner);
				if (typeof(textField.attachments) === 'undefined' ) textField.attachments = new Array();
				textField.attachments.push(attachments.id);
				resolve();

			}else reject(this.status);
		};

		oReq.open("post",gConfig.serverURL + "attachments", true);
		oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
		var data = new FormData();
		data.append( 'name', "attachment[file]");
		data.append( "attachment[file]", e.target.files[0], e.target.value);
		oReq.send(data);
	});
}
function editPost(e) {
	var victim = e.target; do victim = victim.parentNode; while(victim.className != 'post');
	var nodeEdit = genEditNode(postEditedPost,cancelEditPost);
	nodeEdit.cNodes['edit-txt-area'].value = victim.rawData.body;
	victim.cNodes['post-body'].replaceChild( nodeEdit, victim.cNodes['post-body'].cNodes['post-cont']);
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
	var nodePost =e.target; do nodePost = nodePost.parentNode; while(nodePost.className != 'post');
	var oReq = new XMLHttpRequest();
	e.target.disabled = true;
	oReq.onload = function(){
		if(this.status < 400){
			var post = JSON.parse(this.response).posts;
			var postCNode = document.createElement('div');
			postCNode.innerHTML = post.body;
			postCNode.className = 'post-cont';
			nodePost.rawData = post;
			nodePost.cNodes['post-body'].replaceChild(postCNode,e.target.parentNode.parentNode );
			nodePost.cNodes['post-body'].cNodes['post-cont'] = postCNode;
		}
	};

	oReq.open("put",gConfig.serverURL + "posts/"+nodePost.id, true);
	oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
	oReq.setRequestHeader("Content-type","application/json");
	var post = new Object();
	post.body = e.target.parentNode.parentNode.cNodes['edit-txt-area'].value;
	post.createdAt = nodePost.rawData.createdAt;
	post.createdBy = nodePost.rawData.createdAt;
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
				var nodeLikes = e.target.parentNode.parentNode.parentNode.cNodes["likes"];
				var likesUL;
				if (!nodeLikes.childNodes.length){
					likesUL = document.createElement( 'ul');
					likesUL.className ="p-timeline-user-likes";
					var suffix = document.createElement("span");
					suffix.id = e.target.parentNode.postId+'-unl';
					suffix.innerHTML = " liked this";
					nodeLikes.appendChild(likesUL);
					nodeLikes.appendChild(suffix);

				}else {

					for(idx = 0; idx < nodeLikes.childNodes.length; idx++)
						if (nodeLikes.childNodes[idx].nodeName == 'UL')break;
					likesUL = nodeLikes.childNodes[idx];
				}
				var nodeLike = document.createElement('li');
				nodeLike.className = "p-timeline-user-like";
				nodeLike.innerHTML = gUsers[gMe.users.id].link;
				if(likesUL.childNodes.length)likesUL.insertBefore(nodeLike, likesUL.childNodes[0]);
				else likesUL.appendChild(nodeLike);
				e.target.parentNode.parentNode.parentNode.myLike = nodeLike;
			}else{
				var myLike = e.target.parentNode.parentNode.parentNode.myLike;
				likesUL = myLike.parentNode;
				likesUL.removeChild(myLike);  	
				if (!likesUL.childNodes.length) likesUL.parentNode.innerHTML = '';
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
	var nodeEdit = gNodes['edit'].cloneAll();
	nodeEdit.cNodes["edit-buttons"].cNodes["edit-buttons-post"].addEventListener('click',post);
	nodeEdit.cNodes["edit-buttons"].cNodes["edit-buttons-cancel"].addEventListener('click',cancel);
	return nodeEdit;
}
function addComment(e){
	var postNBody = e.target; do postNBody = postNBody.parentNode; while(postNBody.className != 'post-body');
	var nodeComment = gNodes['comment'].cloneAll();
	 nodeComment.cNodes['comment-body'].appendChild(genEditNode(postNewComment,cancelNewComment));
	postNBody.cNodes['comments'].appendChild(nodeComment);
}
function editComment(e){
	var victim = e.target; do victim = victim.parentNode; while(victim.className != 'comment');
	var nodeEdit = genEditNode(postEditComment,cancelEditComment);
	var nodeComment = gNodes['comment'].cloneAll();
	nodeEdit.cNodes['edit-txt-area'].value = gComments[victim.id].body;
	//nodeComment.replaceChild(nodeEdit, nodeComment.cNodes['comment-body']);
	 nodeComment.cNodes['comment-body'].appendChild(nodeEdit);
	victim.parentNode.replaceChild( nodeComment, victim);
	nodeComment.id = victim.id;

}

function postEditComment(e){
	var nodeComment = e.target; do nodeComment = nodeComment.parentNode; while(nodeComment.className != 'comment');
	var comment = gComments[nodeComment.id];
	comment.body = e.target.parentNode.parentNode.cNodes['edit-txt-area'].value;
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
	oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
	oReq.setRequestHeader("Content-type","application/json");
	var postdata = new Object();
	postdata.comment = comment;
	postdata.users = new Array(gMe);
	oReq.send(JSON.stringify(postdata));

};
function cancelEditComment(e){
	var nodeComment = e.target; do nodeComment = nodeComment.parentNode; while(nodeComment.className != 'comment');
	 nodeComment.parentNode.replaceChild(genComment( gComments[nodeComment.id]),nodeComment);
};
function processText(e) {
	if (e.target.scrollHeight > e.target.clientHeight) 
		e.target.style.height = e.target.scrollHeight + "px";
	if (e.which == '13'){
		var text = e.target.value;
		if(text.charAt(text.length-1) == '\n') e.target.value = text.slice(0, -1);
		e.target.parentNode.cNodes['post-edit-buttons'].cNodes["edit-buttons-post"].dispatchEvent(new Event('click'));
	}
	
}
function cancelNewComment(e){ 
	var nodeComment =e.target; do nodeComment = nodeComment.parentNode; while(nodeComment.className != 'comment');
	nodeComment.parentNode.removeChild(nodeComment);

}
function postNewComment(e){
		sendComment(e.target.parentNode.previousSibling);
	var nodeComments =e.target; do nodeComments = nodeComments.parentNode; while(nodeComments.className != 'comments');
		nodeComments.cnt++;
}
function deleteComment(e){
	var nodeComment =e.target; do nodeComment = nodeComment.parentNode; while(nodeComment.className != 'comment');
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		if(this.status < 400){
			nodeComment.parentNode.removeChild(nodeComment);
			delete gComments[nodeComment.id];
		}
	};
	oReq.open("delete",gConfig.serverURL + "comments/"+nodeComment.id, true);
	oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
	oReq.setRequestHeader("Content-type","application/json");
	oReq.send();
}
function sendComment(textField){
	var nodeComment =textField; do nodeComment = nodeComment.parentNode; while(nodeComment.className != 'comment');
	textField.parentNode.cNodes['edit-buttons'].cNodes['edit-buttons-post'].disabled = true;
	var comment = new Object();
	comment.body = textField.value;
	var nodePost =nodeComment; do nodePost = nodePost.parentNode; while(nodePost.className != 'post');
	comment.postId = nodePost.id;
	comment.createdAt = null;
	comment.createdBy = null;
	comment.updatedAt = null;
	comment.post = null;
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		if(this.status < 400){
			textField.value = '';
			textField.style.height = '4em';
			var comment = JSON.parse(this.response).comments;
			nodeComment.parentNode.insertBefore(genComment(comment),nodeComment);
			gComments[comment.id] = comment;
			textField.parentNode.cNodes['edit-buttons'].cNodes['edit-buttons-post'].disabled = false;
			if( nodeComment.parentNode.childNodes.length > 4 ) addLastCmtButton(nodePost.cNodes['post-body']);
		}
	};

	oReq.open("post",gConfig.serverURL + "comments", true);
	oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
	oReq.setRequestHeader("Content-type","application/json");
	var postdata = new Object();
	postdata.comment = comment;
	oReq.send(JSON.stringify(postdata));
}
function genComment(comment){
	var nodeComment = gNodes['comment'].cloneAll();
	var cUser = gUsers[comment.createdBy];
	nodeComment.cNodes['comment-body'].innerHTML = autolinker.link(comment.body)+ " - " + cUser.link ;
	nodeComment.id = comment.id;
	nodeComment.createdAt = comment.createdAt;
	if(cUser.id == gMe.users.id) nodeComment.cNodes['comment-body'].appendChild(gNodes['comment-controls'].cloneAll());
	return nodeComment; 
}
function addLastCmtButton(postNBody){
	if (postNBody.lastCmtButton == true)return;
	var aAddComment = document.createElement('a');
	aAddComment.className = 'post-control-comment';
	aAddComment.innerHTML = 'Comment';
	aAddComment.addEventListener("click",addComment);
	postNBody.appendChild( aAddComment);
	postNBody.lastCmtButton = true;
}
function unfoldComm(id){
	var post = document.getElementById(id).rawData;
	var oReq = new XMLHttpRequest();
	var spUnfold = document.getElementById(id+'-unc').parentNode.appendChild(document.createElement('i'));
	spUnfold.className = 'fa fa-spinner fa-pulse';
	oReq.onload = function(){
		if(oReq.status < 400){
			var postUpd = JSON.parse(this.response);
			postUpd.users.forEach(addUser);
			document.getElementById(id).rawData = post;
			var nodePB = document.getElementById(id).cNodes['post-body'];
			nodePB.removeChild(nodePB.cNodes['comments']);
			nodePB.cNodes['comments'] = document.createElement('div');
			nodePB.cNodes['comments'].className = 'comments';
			postUpd.comments.forEach(function(cmt){nodePB.cNodes['comments'].appendChild(genComment(cmt))});
			nodePB.appendChild(nodePB.cNodes['comments']);
			addLastCmtButton(nodePB);
			nodePB.cNodes['comments'].cnt = postUpd.comments.length;

		}else{
			spUnfold.parentNode.removeChild(spUnfold);
			console.log(oReq.toString());

		};
	};

	oReq.open("get",gConfig.serverURL + "posts/"+post.id+"?maxComments=all&maxLikes=0", true);
	oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
	oReq.send();


}
function calcCmtTime(e){
	if (typeof(e.target.parentNode.parentNode.parentNode.createdAt) !== 'undefined' )
		e.target.title =  relative_time(e.target.parentNode.parentNode.parentNode.createdAt*1);

}
function genCNodes(node, proto){
	node.cNodes = new Object(); 
	for(var idx = 0; idx <  node.childNodes.length; idx++){
		genCNodes(node.childNodes[idx], proto.childNodes[idx]);
		node.cNodes[node.childNodes[idx].className] = node.childNodes[idx];
	}
	if (typeof(proto.e) !== 'undefined' ) 
		for(var action in proto.e)
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
				if(template.p) for( var p in template.p) node[p] =  template.p[p];
				nodes.push(node);
			} );
	return nodes;

}
function auth(){
	var token = window.localStorage.getItem("token");

	gMe = window.localStorage.getItem("gMe");
	if (gMe){
		gMe = JSON.parse(gMe);
			if (gMe.users) {
				addUser(gMe.users);
				return true;
			}
		}

	var oReq = new XMLHttpRequest();
	if(token){
		oReq.open("get", gConfig.serverURL +"users/whoami", false);
		oReq.setRequestHeader("X-Authentication-Token", token);
		oReq.send();
		if(oReq.status < 400) {
			gMe = JSON.parse(oReq.response);
			if (gMe.users) {
				window.localStorage.setItem("gMe",JSON.stringify(gMe));
				addUser(gMe.users);
				return true;
			}
		}
	}
	var nodeAuth = document.createElement("div");
	nodeAuth.className = "nodeAuth";
	nodeAuth.innerHTML = "<div id=auth-msg>&nbsp;</div><form action='javascript:' onsubmit=getauth(this)><table><tr><td>Username</td><td><input name='username' id=a-user type='text'></td></tr><tr><td>Password</td><td><input name='password' id=a-pass type='password'></td></tr><tr><td><input type='submit' value='Log in'></td></tr></table></form>";
	document.getElementsByTagName("body")[0].appendChild(nodeAuth);
	return false;

}
function getauth(oFormElement){
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		if(this.status < 400){	
			window.localStorage.setItem("token", JSON.parse(this.response).authToken);
			document.getElementsByTagName("body")[0].removeChild(document.getElementsByClassName("nodeAuth")[0]);
			initDoc();
		}else document.getElementById('auth-msg').innerHTML = this.statusText;
	};
	oReq.open("post", gConfig.serverURL +"session", true);
	oReq.setRequestHeader("X-Authentication-Token", null);
	oReq.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	oReq.send("username="+document.getElementById('a-user').value+"&password="+document.getElementById('a-pass').value);
}
function logout(){
		window.localStorage.setItem("token", '');
		location.reload();


};
function parseGET() {
	var reqs = new Array();
	var req = new Array();
	get = new Object();

	var url = document.location.search;
	if(url != '') {
		reqs = (url.substr(1)).split('%26');
		for(var i=0; i < reqs.length; i++) {
			req = reqs[i].split('=');
			get[req[0]] = req[1];	
		}
	}
	return get;
}
function frfAutolinker( autolinker,match ){
	if (match.getType() == "twitter")
	 return "<a href=" + gConfig.front+match.getTwitterHandle()+">@" +match.getTwitterHandle( ) + '</a>' ;
	 else return true;
}
function initDoc(){

	if (auth()){
		var locationPath = (document.location.origin + document.location.pathname).slice(gConfig.front.length);
		var locationSearch = document.location.search;
		if (locationPath == "")locationPath = 'home';
		if (locationSearch == '')locationSearch = '?offset=0';
		document.skip = locationSearch.split("=")[1]*1;
		var arrLocationPath = locationPath.split("/");
		document.timeline = arrLocationPath[0];
		genNodes(templates.nodes).forEach( function(node){ gNodes[node.className] = node; });
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(oReq.status < 400) draw(JSON.parse(this.response));
			else{
				if (oReq.status==401)
					{
						localStorage.removeItem('token');
						localStorage.removeItem('gMe');
						location.reload();
					}
				var nodeError = document.createElement('div');
				nodeError.className = 'error-node';
				nodeError.innerHTML = oReq.statusText;
				document.getElementsByTagName("body")[0].appendChild(nodeError);
			}

		};
		if(arrLocationPath.length > 1)oReq.open("get",gConfig.serverURL +"posts/"+arrLocationPath[1]+"?maxComments=all", true);
		else oReq.open("get",gConfig.serverURL + "timelines/"+locationPath+locationSearch, true);
		oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
		oReq.send();
	}
}
