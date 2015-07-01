'use strict';
var gUsers = new Object();
var gUsersQ = new Object();
gUsers.byName = new Object();
var gNodes = new Object();
var gMe = new Object();
var gComments = new Object();
var gAttachments  = new Object();
var gFeeds = new Object();
var gPrivTimeline = {"done":0,'postsById':{},'oraphed':{count:0},'noKey':{},'noDecipher':{},nCmts:0,'posts':[] };
var autolinker = new Autolinker({'truncate':20,  'replaceFn':frfAutolinker } );
var matrix = new CryptoPrivate(gCryptoPrivateCfg );
document.addEventListener("DOMContentLoaded", initDoc);
function unfoldLikes(id){
	var post = document.getElementById(id).rawData;
	var span  = document.getElementById(id+'-unl');
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
	for(var like = gConfig.likesFold; like < post.likes.length; like++){
		var nodeCLike = nodeLike.cloneNode();
		nodeCLike.innerHTML = gUsers[post.likes[like]].link;
		//nodeLikes.childNodes[idx].appendChild(nodeCLike);
		nodeLikes.appendChild(nodeCLike);
	}
	var suffix = document.createElement('span');
	suffix.innerHTML = " liked this";
	//nodeLikes.childNodes[idx].appendChild(suffix);
	nodeLikes.appendChild(suffix);
}
function genLikes(post, postNBody){
	postNBody.cNodes["post-info"].cNodes["likes"].appendChild(gNodes['likes-smile'].cloneNode(true));
	var nodeLikes = document.createElement( 'ul');
 	var l =  post.likes.length;
	if(typeof gMe !== 'undefined'){ 
		for (var idx = 0; idx< l;idx++) {
			var like = post.likes[idx];		
			if(like == gMe.users.id){
				post.likes.splice(idx,1);
				post.likes.unshift(like);
				break;
			}
		}
	}
	var nodeLike = document.createElement('li');
	nodeLike.className = "p-timeline-user-like";
	for (var idx = 0; idx < (gConfig.likesFold<l?gConfig.likesFold:l) ; idx++){
		var nodeCLike = nodeLike.cloneNode();
		nodeCLike.innerHTML = gUsers[post.likes[idx]].link;
		nodeLikes.appendChild(nodeCLike);
	}
	var suffix = document.createElement("li");
	suffix.id = post.id+'-unl' 
	if (post.omittedLikes>0) l += post.omittedLikes;
	if ( l > gConfig.likesFold)
		suffix.innerHTML = 'and <a onclick="unfoldLikes(\''+post.id+'\')">'+ (l - gConfig.likesFold) +' other people</a>' ;
	suffix.innerHTML += ' liked this';
	suffix.className = 'nocomma';
	nodeLikes.appendChild(suffix);
	postNBody.cNodes["post-info"].cNodes["likes"].appendChild(nodeLikes);
	//postNBody.cNodes["post-info"].cNodes["likes"].appendChild(suffix);
	if(typeof gMe !== 'undefined'){ 
		if(post.likes[0] == gMe.users.id){
			postNBody.cNodes["post-info"].myLike = nodeLikes.childNodes[0];
			if( postNBody.cNodes["post-info"].nodeLike) {
				postNBody.cNodes["post-info"].nodeLike.innerHTML = "Un-like";
				postNBody.cNodes["post-info"].nodeLike.action = false;
			}

		}
	}
}
function addUser (user){
	if (typeof gUsers[user.id] !== 'undefined' ) return;
	user.link = "<a href=" + gConfig.front+  user.username+">"+ user.screenName+'</a>';
	if(!user.profilePictureMediumUrl)user.profilePictureMediumUrl = gConfig.static+ "img/default-userpic-48.png";
	gUsers[user.id] = user;
	gUsers.byName[user.username] = user;
}
function subscribe(e){
	var oReq = new XMLHttpRequest();
	oReq.open("post", gConfig.serverURL +"users/"+gConfig.timeline+(e.target.subscribed?'/unsubscribe':"/subscribe"), true);
	oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
	oReq.onload = function(){
		if(oReq.status < 400) {
			gMe = JSON.parse(oReq.response);
			window.localStorage.setItem("gMe",JSON.stringify(gMe));
			e.target.subscribed = !e.target.subscribed;
			e.target.innerHTML = e.target.subscribed?"Unsubscribe":"Subscribe";
		}
	}

	oReq.send();

}
function draw(content){
	var body = document.getElementsByTagName("body")[0];
	if(content.attachments)content.attachments.forEach(function(attachment){ gAttachments[attachment.id] = attachment; });
	if(content.comments)content.comments.forEach(function(comment){ gComments[comment.id] = comment; });
	content.users.forEach(addUser);
	var title =  document.createElement("div");
	title.innerHTML = "<h1>" +gConfig.timeline+ "</h1>"
	body.appendChild(title);
	if(typeof gMe === 'undefined') 
		body.appendChild(gNodes['controls-anon'].cloneAll());
	else{ 
		body.appendChild(gNodes['controls-user'].cloneAll());
		switch (gConfig.timeline.split('/')[0]){
		case 'home':
		case 'filter':
		case gMe.users.username:
			var nodeAddPost = gNodes['new-post'].cloneAll();
			body.appendChild(nodeAddPost);
			genPostTo(nodeAddPost.cNodes["new-post-to"]);
			break;
		default:
			var subscribers = new Object();
			var feeds = new Object();
			gMe.subscribers.forEach(function(sub){subscribers[sub.id]=sub;});
			gMe.subscriptions.forEach(function(sub){
				if(sub.name =='Posts')feeds[subscribers[sub.user].username] = true;
			});
			var subscribed = feeds[gConfig.timeline]?true:false
			var sub = document.createElement('a');
			sub.innerHTML = subscribed?"Unsubscribe":"Subscribe";
			sub.subscribed = subscribed;
			sub.addEventListener("click", subscribe);
			body.appendChild(sub);
		}
	}
	if(content.subscribers && content.subscriptions ){	
		var subscribers = new Object();
		content.subscribers.forEach(function(sub){subscribers[sub.id]=sub;});
		content.subscriptions.forEach(function(sub){if(sub.name =='Posts')gFeeds[sub.id] = subscribers[sub.user];});
		if(typeof gMe !== 'undefined') 
			gFeeds[gMe.users.id] = gMe.users;
	}
	if(content.timelines){
		var nodeMore = document.createElement("div");
		nodeMore.className = 'more-node';
		var htmlPrefix = '<a href="' + gConfig.front+gConfig.timeline ;
		var htmlForward;
		var htmlBackward;
		var fLastPage = (content.posts.length != gConfig.offset);
		var backward = gConfig.cSkip*1 - gConfig.offset*1;
		var forward = gConfig.cSkip*1 + gConfig.offset*1;
		if (gConfig.cSkip){
			if (backward>=0) htmlBackward = htmlPrefix + '?offset=' 
				+ backward*1+ '&limit='+gConfig.offset*1
				+ '"><span style="font-size: 120%">&larr;</span> Newer items</a>';
			nodeMore.innerHTML = htmlBackward ;
		}
		if(!fLastPage){ 
			htmlForward = htmlPrefix + '?offset=' 
			+ forward*1 + '&limit='+gConfig.offset*1
			+'">Older items <span style="font-size: 120%">&rarr;</span></a>';
			if (htmlBackward) nodeMore.innerHTML += '<span class="spacer">&mdash;</span>'
			nodeMore.innerHTML +=  htmlForward;
		}
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
				document.posts.appendChild(genPost(post));
			} 
		});
		var nodeShowHidden = gNodes['show-hidden'].cloneAll();
		nodeShowHidden.cNodes['href'].action = true;
		body.appendChild(nodeShowHidden);
		if(document.hiddenCount) nodeShowHidden.cNodes['href'].innerHTML= 'Show '+ document.hiddenCount + ' hidden entries';
		body.appendChild(nodeMore);
		var drop = Math.floor(gConfig.cSkip/3);
		var toAdd = drop + Math.floor(gConfig.offset/3);
		if((!gPrivTimeline.done)&& (gConfig.timeline == 'home')&& matrix.ready){
			gPrivTimeline.done = true;
			new Promise(function (){addPosts(drop,toAdd,0);});
		};
	}else body.appendChild(genPost(content.posts));

  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-0-1', 'auto');
  ga('send', 'pageview');	
	
}
function addPosts(drop, toAdd, offset){
	var url = matrix.cfg.srvurl + "/posts?offset="+offset+"&limit="+(toAdd*matrix.cfg.mul);
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		if(oReq.status < 400){
			var res = JSON.parse(oReq.response);
			var cRemain = toAdd + drop;
			if(typeof res.posts !=="undefined"){
				for(var idx = 0; idx < res.posts.length; idx++  ){		
					var nodePost = genPost(res.posts[idx]);
					if (nodePost){
						nodePost.rawData.updatedAt = nodePost.rawData.createdAt;
						if(!(--cRemain)) break;
					}
				}
			}
			if(cRemain&&(res.posts.length == (toAdd*matrix.cfg.mul))) addPosts(drop, cRemain,offset+idx  );
			else {
				doPrivComments(drop);
			}
		}else gPrivTimeline.done = false;
	}	
	oReq.open("get",url,true);
	oReq.send();
}
function doPrivComments(drop){
	var limit = 100;
	var url = matrix.cfg.srvurl + "/cmts?limit="+limit;
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		var arrComPr = new Array(); 
		if(oReq.status < 400){
			var res = JSON.parse(oReq.response);
			if(typeof res.posts !=="undefined"){
				res.posts.forEach(function (post){arrComPr.push(drawPrivateComment(post));});
			}
		}
		Promise.all(arrComPr).then(function(){
			gPrivTimeline.posts.forEach(function(nodePost){
				var nodeComments = nodePost.cNodes["post-body"].cNodes["comments"];
				if(nodeComments.childNodes.length < gConfig.likesFold)
					for(var idx = 0; idx < nodeComments.childNodes.length; idx++)
						nodeComments.childNodes[idx].hidden = false;
				else{
					for(var idx = 0; idx < 2; idx++)
						nodeComments.childNodes[idx].hidden = false;
					var nodeComment = gNodes['comment'].cloneAll();
					nodeComment.id = nodePost.id+'-ufc';
					nodeComment.cNodes['comment-date'].innerHTML = '';
					nodeComment.cNodes['comment-body'].innerHTML = '<a onclick="unfoldPrivComm(\''+nodePost.id+'-ufc\')" style="font-style: italic;">'+(nodeComments.childNodes.length-3)*1 +' more comments</a>';
					nodeComments.insertBefore( nodeComment, nodeComments.childNodes[2]);
					nodeComments.lastChild.hidden = false;
				}
			});
			gPrivTimeline.posts.sort(function (a,b){return a.rawData.updatedAt<b.rawData.updatedAt?1:-1;});
			gPrivTimeline.posts.splice(0,drop);
			var tmp = gPrivTimeline.posts.slice();
			var privPost = tmp[0];
			if(!privPost)return; 
			for(var idx = 0; idx< document.posts.childNodes.length; idx++){
				var pubPost = document.posts.childNodes[idx]; 
				if(privPost.rawData.updatedAt>pubPost.rawData.updatedAt){
					document.posts.insertBefore(tmp.shift(),pubPost );
					privPost = tmp[0];
					if (typeof privPost === 'undefined')break;
				}
			}
			tmp.forEach(function(post){document.posts.appendChild(post);});
		});
	}	
	oReq.open("get",url,true);
	oReq.send();
}
function unfoldPrivComm(id){
	var nodeComment = document.getElementById(id);
	for(var idx = 0; idx < nodeComment.parentNode.childNodes.length; idx++)
		nodeComment.parentNode.childNodes[idx].hidden = false;
	nodeComment.parentNode.removeChild(nodeComment);
	

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
	node.innerHTML =  relative_time(node.date);
	window.setTimeout(updateDate, 5000, node );
}
function drawPrivateComment(post) {
	return new Promise(function(resolve,reject){
		var cpost = matrix.decrypt(post.body);
		if (typeof cpost.error !== 'undefined')return;
		cpost = JSON.parse(cpost);
		if (typeof cpost.payload.author === 'undefined' ) return spam();
		var nodeComment;
		matrix.verify(JSON.stringify(cpost.payload), cpost.sign, cpost.payload.author).then(ham,spam);
		function ham(){
			var nodePriv = gPrivTimeline.postsById[cpost.payload.postid];
			if(!nodePriv)return;
			var comment = {"body":cpost.payload.data,
					"createdAt":Date.parse(post.createdAt), 
					"id":post.id,
					'user':cpost.payload.author
					};
			nodeComment = genComment(comment);
			nodeComment.hidden = true;
			nodeComment.sign = cpost.sign;
			gComments[post.id] = comment;
			if(comment.createdAt > nodePriv.rawData.updatedAt) nodePriv.rawData.updatedAt = comment.createdAt;
			nodePriv.cNodes["post-body"].cNodes["comments"].insertBefore(nodeComment,nodePriv.cNodes["post-body"].cNodes["comments"].firstChild);
			resolve();
		}
		function spam(){reject()};
	});
}
function genPost(post){
	function spam(){nodePost = document.createElement('span');};
	function ham(){
		nodePost.feed = cpost.payload.feed;
		gPrivTimeline.posts.push(nodePost);
		gPrivTimeline.postsById[post.id] = nodePost;
		nodePost.rawData.body = cpost.payload.data;
		postNBody.cNodes["post-cont"].innerHTML = autolinker.link(cpost.payload.data.replace(/&/g,'&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
		if(typeof user === 'undefined'){
			if (gUsers.byName[cpost.payload.author]){
				user = gUsers.byName[cpost.payload.author];
				post.createdBy = user.id;
				gotUser();
			} else if(gUsersQ[cpost.payload.author]) gUsersQ[cpost.payload.author].then(
				function(){
					user = gUsers.byName[cpost.payload.author];
					post.createdBy = user.id;
					gotUser();
				},spam);
			else{
				gUsersQ[cpost.payload.author] = new Promise (function(resolve,reject){
					
					var oReq = new XMLHttpRequest();
					oReq.onload = function(){
						if(this.status < 400){
							var oRes = JSON.parse(oReq.response);
							addUser(oRes.users);
							user = gUsers.byName[cpost.payload.author];
							post.createdBy = user.id;
							resolve();
						}
					};

					oReq.open("get",gConfig.serverURL + "users/"+post.username, true);
					oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
					oReq.send();
				}).then(gotUser,spam);
			}
		}else gotUser();
	}
	function gotUser(){
		if(typeof user !== 'undefined'){
			nodePost.cNodes["avatar"].innerHTML = '<img src="'+ user.profilePictureMediumUrl+'" />';
			var title = user.link;
			if(nodePost.isPrivate) title += '<span> posted privately to '+StringView.makeFromBase64(matrix.gSymKeys[cpost.payload.feed].name)+"</span>";
			else if(post.postedTo){
				if ((post.postedTo.length >1)||(gFeeds[post.postedTo[0]].id!=user.id)){
					title += "<span> posted to: </span>";
					post.postedTo.forEach(function(id){
						title += "<a href=" + gConfig.front+ gFeeds[id].username+">"+ gFeeds[id].screenName;
						if(gFeeds[id].type == 'user')
							if(gFeeds[id].screenName.slice(-1) == 's')
								title += "' feed";
							else title += "'s feed";
						title += '</a>';
					});
				}
			}
			postNBody.cNodes["title"].innerHTML = title;
		}
		if(post.attachments){
			var attsNode = postNBody.cNodes["attachments"];
			for(var att in post.attachments){
				var nodeAtt = gNodes['attachment'].cloneAll();
				nodeAtt.innerHTML = '<a target="_blank" href="'+gAttachments[post.attachments[att]].url+'" border=none ><img src='+gAttachments[post.attachments[att]].thumbnailUrl+'></a>';
				attsNode.appendChild(nodeAtt);
			}		
		}
		var anchorDate = document.createElement("a");
		if(typeof user !== 'undefined') anchorDate.href = gConfig.front+user.username+'/'+post.id;
		postNBody.cNodes["post-info"].cNodes["post-controls"].cNodes["post-date"].appendChild(anchorDate);
		anchorDate.date = post.createdAt*1;
		window.setTimeout(updateDate, 10,anchorDate);

		if(typeof gMe !== 'undefined'){ 
			var nodeControls;
				if (post.createdBy == gMe.users.id)
				nodeControls = gNodes['controls-self'].cloneAll();
			else {
				nodeControls = gNodes['controls-others'].cloneAll();
				postNBody.cNodes["post-info"].nodeLike = nodeControls.cNodes['post-control-like'];
				nodeControls.cNodes['post-control-like'].action = true;
			}
			var tmp  = document.createElement('span');
			tmp.innerHTML = '-';
			tmp.className = 'spacer';
			nodeControls.appendChild(tmp);
			var aHide = document.createElement('a');
			aHide.innerHTML = post.isHidden?'Un-hide':'Hide';
			aHide.action = !post.isHidden;
			aHide.addEventListener("click", postHide);
			nodeControls.appendChild(aHide);
			postNBody.cNodes["post-info"].cNodes["post-controls"].appendChild( nodeControls);
		}
		if (post.likes)	genLikes(post, postNBody );
		if (post.comments){
			if(post.omittedComments){
				if(post.comments[0])
					postNBody.cNodes['comments'].appendChild(genComment(gComments[post.comments[0]]));
				var nodeComment = gNodes['comment'].cloneAll();
				nodeComment.cNodes['comment-date'].innerHTML = '';
				nodeComment.cNodes['comment-body'].innerHTML = '<a id='+post.id+'-unc  onclick="unfoldComm(\''+post.id +'\')" style="font-style: italic;">'+ post.omittedComments+' more comments</a>';
				postNBody.cNodes['comments'].appendChild(nodeComment);
				if(post.comments[1])
					postNBody.cNodes['comments'].appendChild(genComment(gComments[post.comments[1]]));
			}
			else post.comments.forEach(function(commentId){ postNBody.cNodes['comments'].appendChild(genComment(gComments[commentId]))});
		}
		postNBody.cNodes['comments'].cnt = postNBody.cNodes['comments'].childNodes.length;
		if (postNBody.cNodes['comments'].cnt > 4) 
				addLastCmtButton(postNBody);
	}
	var nodePost = gNodes['post'].cloneAll();
	var postNBody = nodePost.cNodes["post-body"];
	var user = undefined;
	if(post.createdBy) user = gUsers[post.createdBy];
	nodePost.homed = false;
	nodePost.rawData = post;
	nodePost.id = post.id;
	nodePost.isPrivate = false;

	var cpost = matrix.decrypt(post.body);
	if (typeof cpost.error !== 'undefined'){
		switch(cpost.error){
		case '0':
			break;
		case '3':
			gPrivTimeline.noKey[post.id] = post;
			console.log(post.id+": unknown key");
			break;
		case '4':
			gPrivTimeline.noDecipher[post.id] = post;
			console.log("Private keys not loaded");
			break;
		}
		postNBody.cNodes["post-cont"].innerHTML =  autolinker.link(post.body.replace(/&/g,'&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
		gotUser();
	}else{	
		nodePost.isPrivate = true;
		post.createdAt = Date.parse(post.createdAt);
		nodePost.rawData.createdAt = post.createdAt;
		cpost = JSON.parse(cpost);
		if (typeof cpost.payload.author === 'undefined' ) return spam();
		matrix.verify(JSON.stringify(cpost.payload), cpost.sign, cpost.payload.author).then(ham,spam);
		nodePost.sign = cpost.sign;
	}
	return nodePost;

}
function newPost(e){
	var textField = e.target.parentNode.parentNode.cNodes["edit-txt-area"];
	textField.disabled = true;
	e.target.disabled = true;
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
			if(this.status < 400){
				var nodeAtt = document.createElement('div');
				nodeAtt.className = 'attachments';
				textField.parentNode.replaceChild(nodeAtt, 
					textField.parentNode.cNodes['attachments']);
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
		if(textField.attachments) post.attachments = textField.attachments;
		postdata.post = post;
		if(postTo.isPrivate){ 
			oReq.open("post",matrix.cfg.srvurl+"?post", true);
			oReq.setRequestHeader('x-content-type', 'post'); 
			oReq.setRequestHeader("Content-type","text/plain");
			oReq.onload = onload;
			var payload =  {
				"feed":postTo.feeds[0],
				"type":"post", 
				"author":gMe.users.username,
				"data":textField.value,
			};
			matrix.sign(JSON.stringify(payload)).then(function(sign){
				var token = matrix.mkOwnToken(sign);
				if(!token) return console.log("Failed to make access token");
				oReq.setRequestHeader('x-content-token', token); 
				post = matrix.encrypt(postTo.feeds, 
					JSON.stringify({'payload':payload,"sign":sign}));
				oReq.send(post);
			},function(){console.log("Failed to sign")});
		}else{
			oReq.open("post",gConfig.serverURL + "posts", true);
			oReq.onload = onload;
			oReq.setRequestHeader("Content-type","application/json");
			oReq.setRequestHeader("X-Authentication-Token", 
				window.localStorage.getItem("token"));
			post.body = textField.value;
			oReq.send(JSON.stringify(postdata));
		}
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
			var post = JSON.parse(oReq.response).posts;
			var postCNode = document.createElement('div');
			var cpost = matrix.decrypt(post.body);
			if (typeof cpost.error === 'undefined') {
				cpost = JSON.parse(cpost);
				post.body =cpost.payload.data;
				nodePost.sign = cpost.sign;
			}
			postCNode.innerHTML = post.body;
			postCNode.className = 'post-cont';
			nodePost.rawData = post;
			nodePost.cNodes['post-body'].replaceChild(postCNode,e.target.parentNode.parentNode );
			nodePost.cNodes['post-body'].cNodes['post-cont'] = postCNode;
		}
	};

	var post = new Object();
	post.createdAt = nodePost.rawData.createdAt;
	post.createdBy = nodePost.rawData.createdBy;
	post.updatedAt = Date.now();
	var postdata = new Object();
	postdata.post = post;
	var text = e.target.parentNode.parentNode.cNodes['edit-txt-area'].value;
	if(nodePost.isPrivate){ 
		oReq.open("put",matrix.cfg.srvurl+"?edit", true);
		oReq.setRequestHeader('x-content-type', 'post'); 
		oReq.setRequestHeader("Content-type","text/plain");
		//oReq.onload = onload;
		var payload =  {
			"feed":nodePost.feed, 
			"type":"post", 
			"author":gMe.users.username,
			"data":text,
		};
		oReq.setRequestHeader('x-access-token', matrix.mkOwnToken(nodePost.sign)); 
		matrix.sign(JSON.stringify(payload)).then(function(sign){
			var token = matrix.mkOwnToken(sign);
			if(!token) return console.log("Failed to make access token");
			oReq.setRequestHeader('x-content-token', token); 
			oReq.setRequestHeader('x-content-id',nodePost.id); 
			post = matrix.encrypt(nodePost.feed, 
				JSON.stringify({'payload':payload,"sign":sign}));
			oReq.send(post);
		},function(){console.log("Failed to sign")});
	}else{
		post.body =  text;
		oReq.open("put",gConfig.serverURL + "posts/"+nodePost.id, true);
		oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
		oReq.setRequestHeader("Content-type","application/json");
		oReq.send(JSON.stringify(postdata));
	}
}
function deletePost(e){
	var victim =e.target; do victim = victim.parentNode; while(victim.className != 'post');
	deleteNode(victim, doDeletePost);
}
function doDeletePost(but){
	var victim = but.node;
	but.parentNode.parentNode.removeChild(but.parentNode);
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		if(this.status < 400){
			victim.parentNode.removeChild(victim);
		}
	};
	if(victim.isPrivate){ 
		oReq.open("delete",matrix.cfg.srvurl+"?delete",true);
		oReq.setRequestHeader('x-content-id', victim.id); 
		oReq.setRequestHeader('x-access-token', matrix.mkOwnToken(victim.sign)); 
		oReq.setRequestHeader('x-content-type', 'post'); 
		oReq.send();
	}else{
		oReq.open("delete",gConfig.serverURL + "posts/"+victim.id, true);
		oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
		oReq.setRequestHeader("Content-type","application/json");
		oReq.send();
	}
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
					nodeLikes.appendChild(gNodes['likes-smile'].cloneNode(true));
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
	if(postNBody.isBeenCommented === true)return;
	postNBody.isBeenCommented = true;
	var nodeComment = gNodes['comment'].cloneAll();
	nodeComment.cNodes['comment-body'].appendChild(genEditNode(postNewComment,cancelNewComment));
	postNBody.cNodes['comments'].appendChild(nodeComment);
	nodeComment.getElementsByClassName('edit-txt-area')[0].focus();
}
function editComment(e){
	var victim = e.target; do victim = victim.parentNode; while(victim.className != 'comment');
	var nodeEdit = genEditNode(postEditComment,cancelEditComment);
	nodeEdit.cNodes['edit-txt-area'].value = gComments[victim.id].body;
	victim.replaceChild( nodeEdit, victim.cNodes['comment-body']);
	victim.cNodes['comment-body'] = nodeEdit;
	nodeEdit.className = 'comment-body';
	victim.getElementsByClassName('edit-txt-area')[0].focus();
}
function sendEditedPrivateComment(textField, nodeComment, nodePost){
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		if(this.status < 400){
			var res = JSON.parse(this.response);
			var cpost = JSON.parse(matrix.decrypt(res.posts.body));
			var comment = {
				"body":cpost.payload.data,
				"createdAt":Date.parse(res.posts.createdAt), 
				'user':cpost.payload.author,
				"feed":cpost.payload.id,
				'id':res.posts.id
			};
			gComments[res.posts.id] = comment;
			var nodeNewComment = genComment(comment);
			nodeNewComment.sign = cpost.sign;

			nodeComment.parentNode.replaceChild(nodeNewComment,nodeComment);
		}
	};

	oReq.open("put",matrix.cfg.srvurl+"?edit", true);
	oReq.setRequestHeader("Content-type","text/plain");
	var post = new Object();
	var payload =  {
		"id":nodePost.feed,
		"type":"comment", 
		"data":textField.value,
		"author":gMe.users.username,
		"postid":nodePost.id 
	};
	oReq.setRequestHeader('x-access-token', matrix.mkOwnToken(nodeComment.sign)); 
	oReq.setRequestHeader('x-content-id', nodeComment.id); 
	oReq.setRequestHeader('x-content-type', 'comment'); 
	matrix.sign(JSON.stringify(payload)).then(function(sign){
		var token = matrix.mkOwnToken(sign);
		if(!token) return console.log("Failed to make access token");
		oReq.setRequestHeader('x-content-token', token); 
		post = matrix.encrypt(nodePost.feed, 
			JSON.stringify({'payload':payload,"sign":sign}));
		oReq.send(post);
	},function(){console.log("Failed to sign")});


}
function postEditComment(e){
	var nodeComment = e.target; do nodeComment = nodeComment.parentNode; while(nodeComment.className != 'comment');
	var nodePost =nodeComment; do nodePost = nodePost.parentNode; while(nodePost.className != 'post');
	var textField = e.target.parentNode.parentNode.cNodes['edit-txt-area'];
	if(nodePost.isPrivate){
		sendEditedPrivateComment(textField, nodeComment, nodePost);
		return;
	}
	var comment = gComments[nodeComment.id];
	comment.body = textField.value; 
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
		e.target.parentNode.cNodes['edit-buttons'].cNodes["edit-buttons-post"].dispatchEvent(new Event('click'));
	}
	
}
function cancelNewComment(e){ 
	var postNBody = e.target; do postNBody = postNBody.parentNode; while(postNBody.className != 'post-body');
	postNBody.isBeenCommented = false;
	var nodeComment =e.target; do nodeComment = nodeComment.parentNode; while(nodeComment.className != 'comment');
	nodeComment.parentNode.removeChild(nodeComment);

}
function postNewComment(e){
	sendComment(e.target.parentNode.previousSibling);
	var nodeComments =e.target; do nodeComments = nodeComments.parentNode; while(nodeComments.className != 'comments');
	nodeComments.cnt++;
}
function deleteComment(e){
	var nodeComment = e.target; do nodeComment = nodeComment.parentNode; while(nodeComment.className != 'comment');
	deleteNode(nodeComment,doDeleteComment);
}
function deleteNode(node,doDelete){
	var nodeConfirm = document.createElement('div');
	var butDelete = document.createElement('button');
	butDelete.innerHTML = 'delete';
	butDelete.node = node;
	butDelete.onclick = function(){doDelete(butDelete);};
	var butCancel0 = document.createElement('button');
	butCancel0.innerHTML = 'cancel';
	butCancel0.onclick = function (){deleteCancel(nodeConfirm)};
	var aButtons = [butDelete,butCancel0] ;
	nodeConfirm.innerHTML = '<p>Sure delete?</p>';
	aButtons.forEach(function(but){ but.className = 'confirm-button';});
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
	var nodePost =nodeComment; do nodePost = nodePost.parentNode; while(nodePost.className != 'post');
	but.parentNode.parentNode.removeChild(but.parentNode);
	but.node.hidden = false;
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		if(this.status < 400){
			nodeComment.parentNode.removeChild(nodeComment);
			delete gComments[nodeComment.id];
		}
	};
	if(nodePost.isPrivate){ 
		oReq.open("delete",matrix.cfg.srvurl+"?delete",true);
		oReq.setRequestHeader('x-content-id', nodeComment.id); 
		oReq.setRequestHeader('x-access-token', matrix.mkOwnToken(nodeComment.sign)); 
		oReq.setRequestHeader('x-content-type', 'comment'); 
		oReq.send();
	}else{
		oReq.open("delete",gConfig.serverURL + "comments/"+nodeComment.id, true);
		oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
		oReq.setRequestHeader("Content-type","application/json");
		oReq.send();
	}
}
function sendPrivateComment( textField, nodeComment, nodePost){
	textField.disabled = true;
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		if(this.status < 400){
			textField.value = '';
			textField.disabled = false;
			textField.style.height  = '4em';
			var res = JSON.parse(this.response);
			var cpost = JSON.parse(matrix.decrypt(res.posts.body));
			var comment = {"body":cpost.payload.data,
					"createdAt":Date.parse(res.posts.createdAt), 
					'user':cpost.payload.author,
					"id":res.posts.id
					};
			nodeComment.parentNode.insertBefore(genComment(comment),nodeComment).sign = cpost.sign;
			gComments[comment.id] = comment;
			textField.parentNode.cNodes['edit-buttons'].cNodes['edit-buttons-post'].disabled = false;
			if( nodeComment.parentNode.childNodes.length > 4 ) addLastCmtButton(nodePost.cNodes['post-body']);
		}
	};

	oReq.open("post",matrix.cfg.srvurl+"?post", true);
	oReq.setRequestHeader("Content-type","text/plain");
	var post = new Object();
	var payload =  {
		"id":nodePost.feed,
		"type":"comment", 
		"data":textField.value,
		"author":gMe.users.username,
		"postid":nodePost.id 
	};
	oReq.setRequestHeader('x-content-type', 'comment'); 
	matrix.sign(JSON.stringify(payload)).then(function(sign){
		var token = matrix.mkOwnToken(sign);
		if(!token) return console.log("Failed to make access token");
		oReq.setRequestHeader('x-content-token', token); 
		post = matrix.encrypt(nodePost.feed, 
			JSON.stringify({'payload':payload,"sign":sign}));
		oReq.send(post);
	},function(){console.log("Failed to sign")});

}
function sendComment(textField){
	var nodeComment =textField; do nodeComment = nodeComment.parentNode; while(nodeComment.className != 'comment');
	var nodePost =nodeComment; do nodePost = nodePost.parentNode; while(nodePost.className != 'post');
	if(nodePost.isPrivate){
		sendPrivateComment(textField, nodeComment, nodePost);
		return;
	}
	textField.parentNode.cNodes['edit-buttons'].cNodes['edit-buttons-post'].disabled = true;
	var comment = new Object();
	comment.body = textField.value;
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
}/*
function genPComment(cpost){
	var nodeComment = gNodes['comment'].cloneAll();
	var cUser = gUsers[comment.createdBy];
<<<<<<< HEAD
	nodeComment.cNodes['comment-body'].innerHTML = autolinker.link(comment.body.replace(/&/g,'&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))+ " - " + cUser.link ;
=======
	nodeComment.cNodes['comment-body'].innerHTML = autolinker.link(comment.body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))+ " - " + cUser.link ;
>>>>>>> master
	nodeComment.id = comment.id;
	nodeComment.createdAt = comment.createdAt;
	if(typeof gMe !== 'undefined') 
		if(cUser.id == gMe.users.id) 
			nodeComment.cNodes['comment-body'].appendChild(gNodes['comment-controls'].cloneAll());
	return nodeComment; 

}
*/
function genComment(comment){
	function gotUser(){
		nodeSpan.innerHTML += " - " + cUser.link ;
		if(typeof gMe !== 'undefined') 
			if(cUser.id == gMe.users.id) 
				nodeComment.cNodes['comment-body'].appendChild(gNodes['comment-controls'].cloneAll());
	}
	function spam(){nodeComment = document.createElement('span');};
	var nodeComment = gNodes['comment'].cloneAll();
	var cUser = gUsers[comment.createdBy];
	var nodeSpan = document.createElement('span');
	nodeComment.cNodes['comment-body'].appendChild(nodeSpan);
	nodeSpan.innerHTML = autolinker.link(comment.body.replace(/&/g,'&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
	nodeComment.id = comment.id;
	nodeComment.createdAt = comment.createdAt;
	if(typeof cUser !== 'undefined'){
		nodeSpan.innerHTML += " - " + cUser.link ;
		if(typeof gMe !== 'undefined') 
			if(cUser.id == gMe.users.id) 
				nodeComment.cNodes['comment-body'].appendChild(gNodes['comment-controls'].cloneAll());
	}else if(comment.user) {
		if (gUsers.byName[comment.user]) {
			cUser = gUsers.byName[comment.user];
			gotUser();
		}
		else if(gUsersQ[comment.user]) gUsersQ[comment.user].then(gotUser,spam);
		else{
			gUsersQ[comment.user] = new Promise (function(resolve,reject){
				
				var oReq = new XMLHttpRequest();
				oReq.onload = function(){
					if(this.status < 400){
						var oRes = JSON.parse(oReq.response);
						addUser(oRes.users);
						cUser = gUsers.byName[comment.user];
						resolve();
					}
				};
				oReq.open("get",gConfig.serverURL + "users/"+comment.username, true);
				oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
				oReq.send();
			}).then(gotUser,spam);
		}
	}
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
function auth(check){
	var token = window.localStorage.getItem("token");

	gMe = window.localStorage.getItem("gMe");
	if (gMe && token){
		gMe = JSON.parse(gMe);
		if (gMe.users) {
			addUser(gMe.users);
			new Promise(function(){
				var oReq = new XMLHttpRequest();
				oReq.open("get", gConfig.serverURL +"users/whoami", true);
				oReq.setRequestHeader("X-Authentication-Token", token);
				oReq.send();
				oReq.onload = function(){
					if(oReq.status < 400) {
						gMe = JSON.parse(oReq.response);
						if (gMe.users) {
							window.localStorage.setItem("gMe",JSON.stringify(gMe));
							addUser(gMe.users);
							return true;
						}
					}			
				}
			});
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
	if (check !== true ){
		var nodeAuth = document.createElement("div");
		nodeAuth.className = "nodeAuth";
		nodeAuth.innerHTML = "<div id=auth-msg style='color:white; font-weight: bold;'>&nbsp;</div><form action='javascript:' onsubmit=getauth(this)><table><tr><td>Username</td><td><input name='username' id=a-user type='text'></td></tr><tr><td>Password</td><td><input name='password' id=a-pass type='password'></td></tr><tr><td><input type='submit' value='Log in'></td></tr></table></form>";
		document.getElementsByTagName("body")[0].appendChild(nodeAuth);
	}
	return false;

}
function getauth(oFormElement){
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		if(this.status < 400){	
			window.localStorage.setItem("token", JSON.parse(this.response).authToken);
			document.getElementsByTagName("body")[0].removeChild(document.getElementsByClassName("nodeAuth")[0]);
		//	initDoc();

			location.reload();
		}else document.getElementById('auth-msg').innerHTML = JSON.parse(this.response).err;
	};
	oReq.open("post", gConfig.serverURL +"session", true);
	oReq.setRequestHeader("X-Authentication-Token", null);
	oReq.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	oReq.send("username="+document.getElementById('a-user').value+"&password="+document.getElementById('a-pass').value);
}
function logout(){
	matrix.ready = 0;
	matrix.logout();
	window.localStorage.removeItem("gMe");
	window.localStorage.removeItem("token");
	location.reload();
}
function ctrlPriv(){
	if(typeof gMe === 'undefined') return;
	if (!matrix.ready){ 
		if( document.getElementsByClassName('priv-dlg-login')[0])return;
		document.body.appendChild(gNodes['priv-dlg-login'].cloneAll());
	}else{
		if( document.getElementsByClassName('private-control')[0])return;
		document.body.appendChild(gNodes['private-control'].cloneAll());
		loadPrivs();
	}
	/*
	var nodePCtrl = document.body.appendChild(gNodes['private-control'].cloneAll());
	if (!matrix.ready) return;
	nodePCtrl.cNodes['priv-login'].cNodes["priv-pass"].hidden = true;
	var bLogin = nodePCtrl.cNodes['priv-login'].cNodes["priv-pass-submit"];
	bLogin.innerHTML = 'logout';
	bLogin.removeEventListener('click', ctrlPrivLogin);
	bLogin.addEventListener('click', ctrlPrivLogout);
	*/
}

function ctrlPrivLogin(e){
	var inpPass = e.target.parentNode.cNodes['priv-pass'].cNodes['priv-pass-i'];
	if (inpPass.value == ''){
		alert('Must have a password');
		return;
	}
	matrix.username = gMe.users.username;
	matrix.setPassword(inpPass.value);
	matrix.getUserPriv().then(
	function(){

		var nodeDlg =e.target; do nodeDlg = nodeDlg.parentNode; while(nodeDlg.className != 'priv-dlg-login');
		nodeDlg.parentNode.removeChild(nodeDlg);
		document.body.appendChild(gNodes["private-control"].cloneAll());
		privRegenGrps();
		matrix.ready = 1;
		var drop = Math.floor(gConfig.cSkip/3);
		var toAdd = drop + Math.floor(gConfig.offset/3);
		if((!gPrivTimeline.done)&& (gConfig.timeline == 'home')&& matrix.ready){
			gPrivTimeline.done = true;
			new Promise(function (){addPosts(drop,toAdd,0);});
		};
	}
	, function(wut){
		switch(wut){
		case -1:
			e.target.parentNode.parentNode.cNodes['priv-info'].innerHTML = "Incorrect password";
			break;
		case 404:
			ctrlPrivNewUser(e.target); 
			break;
		default:
			e.target.parentNode.parentNode.cNodes['priv-info'].innerHTML = "Got error#"+wut+"<br/>Try again later";
		
		}
	});
}
function ctrlPrivNewUser(nodeSubmit){
	var node = gNodes['priv-new-user'].cloneAll();
	node.cNodes["priv-pass-submit"].addEventListener('click',function(e){
		if (node.cNodes['priv-pass-i'].value != nodeSubmit.parentNode.cNodes['priv-pass'].cNodes['priv-pass-i'].value){
			alert('Passwords must match');
			return;
		}
		document.getElementsByTagName('body')[0].removeChild(node);
		matrix.register().then( privRegenGrps, 
			function(){new Error("Failed to register on the key sever.");}
		);
		nodeSubmit.dispatchEvent(new Event('click'));
	});
	node.cNodes["priv-pass-cancel"].addEventListener('click',function(){ document.getElementsByTagName('body')[0].removeChild(node);});
	document.getElementsByTagName('body')[0].appendChild(node);

}
function ctrlPrivLogout(e){
	matrix.ready = 0;
	matrix.logout();
	gPrivTimeline.posts.forEach(function(post){post.parentNode.removeChild(post);});
	gPrivTimeline.posts = new Array();
	gPrivTimeline.done = false;
	document.body.removeChild( document.getElementsByClassName("private-control")[0]);
	privRegenGrps();
}
function loadPrivs(){
	var nodePCtrl = document.getElementsByClassName("private-control")[0];	
	nodePCtrl.login = true;
	var nodeGrps = nodePCtrl.cNodes["priv-groups"];
	if(typeof matrix.gSymKeys !== 'undefined'){
		for(var id in matrix.gSymKeys){
			var nodeGrp = gNodes['priv-grp'].cloneAll(true);
			nodeGrp.cNodes["priv-grp-name"].innerHTML = StringView.makeFromBase64(matrix.gSymKeys[id].name);
			nodeGrp.id = id;
			nodeGrps.appendChild(nodeGrp);
		}
	}

}
function ctrlPrivLeave(){
	var privGrps = document.getElementsByName("privGrp");	
	var victim;
	for (var idx = 0; idx < privGrps.length; idx++){
		if (privGrps[idx].checked){
			victim = privGrps[idx].parentNode;
			break;
		}
	}
	if (typeof victim.id === 'undefined') return;
	delete matrix.gSymKeys[victim.id];
	matrix.update();
	victim.parentNode.removeChild(victim);
	privRegenGrps();
}
function privRegenGrps(){
	var nodePCtrl = document.getElementsByClassName("private-control")[0];
	if(nodePCtrl){
		var nodeGrps = document.createElement('div');
		nodeGrps.className = "priv-groups";
		nodePCtrl.replaceChild( nodeGrps, nodePCtrl.cNodes["priv-groups"]);	
		nodePCtrl.cNodes["priv-groups"] = nodeGrps;
		loadPrivs();
	}
	gConfig.regenPostTo();

}
function ctrlPrivShowInvite(){
	var privGrps = document.getElementsByName("privGrp");	
	var id;
	for (var idx = 0; idx < privGrps.length; idx++){
		if (privGrps[idx].checked){
			if (typeof privGrps[idx].parentNode.id === 'undefined') return;
			id = privGrps[idx].parentNode.id; 	
			break;
		}
	}
	var nodeDlg = document.body.appendChild(gNodes["priv-dlg-share"].cloneAll());
	nodeDlg.feedId = id;
	nodeDlg.cNodes["priv-share-feed"].innerHTML += StringView.makeFromBase64(matrix.gSymKeys[id].name);
}
function privGrpActivateButton(e){
	var nodeDlg =e.target; do nodeDlg = nodeDlg.parentNode; while(nodeDlg.className != 'private-control');
	var buttons = nodeDlg.cNodes['priv-groups-ctrl'].getElementsByTagName('button');
	for(var idx = 0; idx < buttons.length; idx++)
		buttons[idx].disabled = false;
	
}
function privActivateButton(e){
	var state = false; 
	if (e.target.value == '' ) state = true;
	var buttons = e.target.parentNode.getElementsByTagName('button');
	for(var idx = 0; idx < buttons.length; idx++)
		buttons[idx].disabled = state;
		
}
function ctrlPrivShare(e){
	matrix.genMsg(e.target.parentNode.cNodes["priv-inv-name"].value, JSON.stringify(matrix.gSymKeys[e.target.parentNode.feedId ])).then(function(msg){
		e.target.parentNode.cNodes["priv-key-input"].value = msg;
		e.target.parentNode.cNodes["priv-info"].innerHTML = "Invite generated successfuly";
	},function(err){
		var msg;
		if(err == 404) msg = "User not found";
		else msg = "Got error#"+err;
		e.target.parentNode.cNodes["priv-info"].innerHTML = msg;
	
	});
}
function ctrlPrivJoin(e){
	matrix.readMsg(e.target.parentNode.cNodes["priv-key-input"].value).then(function(msg){
		var symKeys = new Object();
		symKeys = JSON.parse(msg);
		if(typeof symKeys.id === "undefined")return;
		if(typeof symKeys.aKeys === "undefined")return;
		matrix.addKeys(symKeys);
		privRegenGrps();
		e.target.parentNode.cNodes["priv-key-input"].value = '';
	});
}
function ctrlPrivGen(e){
	var name = e.target.parentNode.cNodes["priv-c-name"].value;
	matrix.initPrivate(name).then( privRegenGrps);

}
function me(e){
	e.target.href = gConfig.front+gMe['users']['username'];
}

function home(e){
    e.target.href = gConfig.front;
}

function my(e){
    e.target.href = gConfig.front+ 'filter/discussions';
    //window.location.href =gConfig.front+ 'filter/discussions';
}
function ctrlPrivClose(e){
	var victim = e.target; while(victim.parentNode !=  document.body)victim = victim.parentNode;
	document.body.removeChild(victim);
}
function genPostTo(victim){
	victim.feeds = new Array();
	victim.feeds.push(gMe.users.username);
	victim.parentNode.isPrivate  = false;
	victim.cNodes["new-post-feeds"].firstChild.idx = 1;
	victim.cNodes["new-post-feeds"].firstChild.oValue = gMe.users.username;
	var option = document.createElement('option');
	option.selected = true;
	var select = document.createElement('select');
	select.className = "new-post-feed-select";
	select.hidden = victim.cNodes["new-post-feed-select"].hidden;
	select.addEventListener("change",newPostSelect);
	victim.replaceChild(select, victim.cNodes["new-post-feed-select"]);
	victim.cNodes["new-post-feed-select"] = select;
	victim.cNodes["new-post-feed-select"].appendChild(option);
	option = document.createElement('option');
	option.disabled = true;
	option.innerHTML = "My feed";
	option.value = gMe.users.username;
	victim.cNodes["new-post-feed-select"].appendChild(option);
	var groups = document.createElement('optgroup');
	groups.label = 'Public groups';
	gMe.subscribers.forEach(function(sub){
		if(sub.type == "group"){
			option = document.createElement('option');
			option.value = sub.username;
			option.innerHTML = sub.screenName;
			groups.appendChild(option);
		}
	
	});
	if (groups.childNodes.length > 0 )
		victim.cNodes["new-post-feed-select"].appendChild(groups);
	groups = document.createElement('optgroup');
	groups.label = 'Private groups';
	for (var id in matrix.gSymKeys){
		option = document.createElement('option');
		option.value = id;
		option.privateFeed = true;
		option.innerHTML = StringView.makeFromBase64(matrix.gSymKeys[id].name);
		groups.appendChild(option);
	}
	if (groups.childNodes.length > 0 )
		victim.cNodes["new-post-feed-select"].appendChild(groups);
	
	gConfig.regenPostTo = function (){return genPostTo(victim);};

}
function newPostRemoveFeed(e){
	var nodeP = e.target.parentNode.parentNode;
	nodeP.cNodes['new-post-feed-select'][e.target.idx].disabled = false;
	for(var idx = 0; idx < nodeP.feeds.length; idx++){
		if(nodeP.feeds[idx] == e.target.oValue){
			nodeP.feeds.splice(idx,1);
			break;
		}
	}
	e.target.parentNode.removeChild(e.target);
	if(nodeP.feeds.length == 0)
		nodeP.parentNode.cNodes['edit-buttons'].cNodes['edit-buttons-post'].disabled = true;
}
function newPostAddFeed(e){
	e.target.parentNode.cNodes['new-post-feed-select'].hidden = false;
}

function newPostSelect(e){
	var option = e.target[e.target.selectedIndex];
	if (option.value == '')return;
	var nodeP = e.target.parentNode;
	if (option.privateFeed ){
		nodeP.isPrivate  = true;
		var ul = document.createElement('ul');
		ul.className = 'new-post-feeds';
		nodeP.replaceChild(ul, nodeP.cNodes['new-post-feeds']);
		nodeP.cNodes['new-post-feeds'] = ul;
		nodeP.feeds = new Array();
		for(var idx = 0; idx < e.target.length; idx++)
			e.target[idx].disabled = false;
	}
	option.disabled = true;
	nodeP.feeds.push(option.value);
	var li = document.createElement('li');
	li.innerHTML = option.innerHTML;
	li.className = "new-post-feed";
	li.oValue = option.value;
	li.idx = e.target.selectedIndex;
	li.addEventListener("click",newPostRemoveFeed);
	nodeP.cNodes['new-post-feeds'].appendChild(li);
	nodeP.parentNode.cNodes['edit-buttons'].cNodes['edit-buttons-post'].disabled = false;
}
function frfAutolinker( autolinker,match ){
	switch (match.getType()){
	case "twitter":
		return "<a href=" + gConfig.front+match.getTwitterHandle()+">@" +match.getTwitterHandle( ) + '</a>' ;
	case "url":
		if( match.getUrl().indexOf("m.freefeed.net") != -1 ) return true;
		else if( match.getUrl().indexOf("freefeed.net") != -1 ) {
		    match.url = match.url.replace("freefeed.net","m.freefeed.net",'gm');
                    var tag = autolinker.getTagBuilder().build( match );  
                    return tag;

                } else {
                    return true;  
                }		
	default:
		return true;
	}
}
function initDoc(){

	var locationPath = (document.location.origin + document.location.pathname).slice(gConfig.front.length);
	var locationSearch = document.location.search;
	if (locationPath == "")locationPath = 'home';
	if (locationSearch == '')locationSearch = '?offset=0';
	gConfig.cSkip = locationSearch.split("&")[0].split("=")[1]*1;
	var arrLocationPath = locationPath.split("/");
	gConfig.timeline = arrLocationPath[0];
	genNodes(templates.nodes).forEach( function(node){ gNodes[node.className] = node; });
	switch(gConfig.timeline){
	case 'home':
	case 'filter':
		if(!auth()) return;
		break;
	default:
		if(!auth(true)) gMe = undefined;
	}
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
			if(auth())
				document.getElementsByTagName("body")[0].appendChild(gNodes['controls-user'].cloneAll());
			var nodeError = document.createElement('div');
			nodeError.className = 'error-node';
			nodeError.innerHTML = "Error #"+ oReq.status + ': ' + oReq.statusText;
			try{ 
				var res = JSON.parse(this.response);
				nodeError.innerHTML += '<br>'+res.err;
			}catch(e){};
			document.getElementsByTagName("body")[0].appendChild(nodeError);
		}

	};
	if(arrLocationPath.length > 1){
		if (locationPath == "filter/discussions") {
			gConfig.timeline = locationPath;
			gConfig.xhrurl = gConfig.serverURL + "timelines/filter/discussions";
		} else{		
			gConfig.xhrurl = gConfig.serverURL +"posts/"+arrLocationPath[1];
			locationSearch = "?maxComments=all";
		}
	} else 
		gConfig.xhrurl = gConfig.serverURL + "timelines/"+locationPath;
	
	oReq.open("get",gConfig.xhrurl+locationSearch,true);
	oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
	oReq.send();
}
