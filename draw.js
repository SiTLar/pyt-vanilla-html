"use strict";
function writeAllLikes(id,nodeLikes){
	var post = document.getElementById(id).rawData;
	nodeLikes.innerHTML = "";
	var nodeLike = document.createElement("li");
	nodeLike.className = "p-timeline-user-like";
	for(var like = 0; like < post.likes.length; like++){
		var nodeCLike = nodeLike.cloneNode();
		nodeCLike.innerHTML = gUsers[post.likes[like]].link;
		//nodeLikes.childNodes[idx].appendChild(nodeCLike);
		nodeLikes.appendChild(nodeCLike);
	}
	var suffix = document.createElement("span");
	suffix.innerHTML = " liked this";
	//nodeLikes.childNodes[idx].appendChild(suffix);
	nodeLikes.appendChild(suffix);
}
function genLikes(nodePost){
	var post = nodePost.rawData;
	var postNBody = nodePost.cNodes["post-body"];
	var node = document.createElement("div");
	node.className = "likes";
	postNBody.cNodes["post-info"].replaceChild(node,  postNBody.cNodes["post-info"].cNodes["likes"]);
	postNBody.cNodes["post-info"].cNodes["likes"] = node;
	if(!Array.isArray(post.likes) || !post.likes.length ) return;
	postNBody.cNodes["post-info"].cNodes["likes"].appendChild(gNodes["likes-smile"].cloneNode(true));
	var nodeLikes = document.createElement( "ul");
 	var l =  post.likes.length;
	if(typeof gMe !== "undefined"){ 
		for (var idx = 0; idx< l;idx++) {
			var like = post.likes[idx];		
			if(like == gMe.users.id){
				post.likes.splice(idx,1);
				post.likes.unshift(like);
				break;
			}
		}
	}
	var nodeLike = document.createElement("li");
	nodeLike.className = "p-timeline-user-like";
	post.likes.forEach(function(like){
		var nodeCLike = nodeLike.cloneNode();
		nodeCLike.innerHTML = gUsers[like].link;
		nodeLikes.appendChild(nodeCLike);
	});
	var suffix = document.createElement("li");
	suffix.id = post.id+"-unl" 
	if (post.omittedLikes)
		suffix.innerHTML = 'and <a onclick="unfoldLikes(\''+post.id+'\')">'+ post.omittedLikes +" other people</a>" ;
	suffix.innerHTML += " liked this";
	suffix.className = "nocomma";
	nodeLikes.appendChild(suffix);
	postNBody.cNodes["post-info"].cNodes["likes"].appendChild(nodeLikes);
	//postNBody.cNodes["post-info"].cNodes["likes"].appendChild(suffix);
	if(typeof gMe !== "undefined"){ 
		if(post.likes[0] == gMe.users.id){
			postNBody.cNodes["post-info"].myLike = nodeLikes.childNodes[0];
			if( postNBody.cNodes["post-info"].nodeLike) {
				postNBody.cNodes["post-info"].nodeLike.innerHTML = "Un-like";
				postNBody.cNodes["post-info"].nodeLike.action = false;

			}

		}
	}
}

function loadGlobals(data){
	if(data.attachments)data.attachments.forEach(function(attachment){ gAttachments[attachment.id] = attachment; });
	if(data.comments)data.comments.forEach(function(comment){ gComments[comment.id] = comment; });
	if(data.users)data.users.forEach(addUser);
	if(data.subscribers && data.subscriptions ){	
		var subscribers = new Object();
		data.subscribers.forEach(function(sub){subscribers[sub.id]=sub;addUser(sub);});
		data.subscriptions.forEach(function(sub){
			if(["Posts", "Directs"].some(function(a){ return a == sub.name })){
				gFeeds[sub.id] = subscribers[sub.user];
				gFeeds[sub.id].link = '<a class="'+(sub.id==gMe.users.id?"my-link":"not-my-link")+'" href="' + gConfig.front+ sub.username+'">'+ sub.screenName+"</a>";
			}
		});
	}
}


function draw(content){
	matrix = new CryptoPrivate(gCryptoPrivateCfg );
	autolinker = new Autolinker({"truncate":20,  "replaceFn":frfAutolinker } );
	var body = document.createElement("div");
	body.className = "content";
	body.id = "content";
	document.getElementsByTagName("body")[0].appendChild(body);
	loadGlobals(content);
	var title =  document.createElement("div");
	title.innerHTML = "<h1>" +gConfig.timeline+ "</h1>"
	gConfig.cTxt = null;
	var nodeRTControls = gNodes["rt-controls"].cloneAll();
	if(typeof gMe === "undefined"){ 
		var nodeGControls = gNodes["controls-anon"].cloneAll();
		nodeGControls.replaceChild( nodeRTControls, nodeGControls.cNodes["rt"]);
		body.appendChild(nodeGControls);

		body.appendChild(title);
	}else{ 
		if ((typeof gMe.users.subscribers !== "undefined") && (typeof gMe.users.subscriptions !== "undefined")){
			gMe.subscribers.forEach(addUser);
			var oSubscriptions = new Object();
			gMe.subscriptions.forEach(function(sub){
				if(sub.name =="Posts"){
					oSubscriptions[sub.id] = sub.user;
				}
			});
			gMe.users.subscribers.forEach(function(sub){
				addUser(sub);
				gUsers[sub.id].subscriber = true;
			});
			gMe.users.subscriptions.forEach(function(subid){
				if (typeof oSubscriptions[subid] !== "undefined") {
					if (typeof gUsers[oSubscriptions[subid]] !== "undefined")
						gUsers[oSubscriptions[subid]].friend = true;
				}
			});
		}
		
		var nodeGControls = gNodes["controls-user"].cloneAll();
		nodeGControls.replaceChild( nodeRTControls, nodeGControls.cNodes["rt"]);
		body.appendChild(nodeGControls);
		body.appendChild(title);
		switch (gConfig.timeline.split("/")[0]){
		case "filter":
			if (gConfig.timeline.split("/")[1] == "direct"){
				var nodeAddPost = gNodes["new-post"].cloneAll();
				body.appendChild(nodeAddPost);
				genDirectTo(nodeAddPost);
				break;
			}
		case "home":
		case gMe.users.username:
			var nodeAddPost = gNodes["new-post"].cloneAll();
			body.appendChild(nodeAddPost);
			genPostTo(nodeAddPost);
			break;
		default:
			body.appendChild(genUpControls(gConfig.timeline));
			
		}
	}
	if(content.timelines){
		var nodeMore = document.createElement("div");
		nodeMore.className = "more-node";
		var htmlPrefix = '<a href="' + gConfig.front+gConfig.timeline ;
		var htmlForward;
		var htmlBackward;
		//var fLastPage = (content.posts.length != gConfig.offset);
		var backward = gConfig.cSkip*1 - gConfig.offset*1;
		var forward = gConfig.cSkip*1 + gConfig.offset*1;
		if (gConfig.cSkip){
			if (backward>=0) htmlBackward = htmlPrefix + "?offset=" 
				+ backward*1+ "&limit="+gConfig.offset*1
				+ '"><span style="font-size: 120%">&larr;</span> Newer entries</a>';
			nodeMore.innerHTML = htmlBackward ;
		}
		/*if(!fLastPage)*/ if(content.posts){ 
			htmlForward = htmlPrefix + "?offset=" 
			+ forward*1 + "&limit="+gConfig.offset*1
			+'">Older entries<span style="font-size: 120%">&rarr;</span></a>';
			if (htmlBackward) nodeMore.innerHTML += '<span class="spacer">&mdash;</span>'
			nodeMore.innerHTML +=  htmlForward;
		}
		body.appendChild(nodeMore.cloneNode(true));
		document.posts = document.createElement("div");
		document.posts.className = "posts";
		body.appendChild(document.posts);
		document.hiddenPosts = new Array();
		document.hiddenCount = 0;
		var idx = 0;
		if (content.posts){
			content.posts.forEach(function(post){
				post.idx = idx++;
				if(post.isHidden){
					document.hiddenCount++;
				}else{ 
					post.isHidden = false;
					document.posts.appendChild(genPost(post));
				} 
				document.hiddenPosts.push({"is":post.isHidden,"data":post});
			});
		}
		var nodeShowHidden = gNodes["show-hidden"].cloneAll();
		nodeShowHidden.cNodes["href"].action = true;
		body.appendChild(nodeShowHidden);
		if(document.hiddenCount) nodeShowHidden.cNodes["href"].innerHTML= "Show "+ document.hiddenCount + " hidden entries";
		body.appendChild(nodeMore);
		var drop = Math.floor(gConfig.cSkip/3);
		var toAdd = drop + Math.floor(gConfig.offset/3);
		if((!gPrivTimeline.done)&& (gConfig.timeline == "home")&& matrix.ready){
			gPrivTimeline.done = true;
			new Promise(function (){addPosts(drop,toAdd,0);});
		};
	}else{
		var singlePost = genPost(content.posts);
		body.appendChild(singlePost);
		singlePost.getElementsByClassName("hide")[0].hidden = true;
	} 
	var nodeRTCtrl = body.getElementsByClassName("rt-controls")[0];
	nodeRTCtrl.cNodes["rt-chkbox"].checked = window.localStorage.getItem("rt");
	var bump = window.localStorage.getItem("rtbump");
	var nodeBump = nodeRTCtrl.cNodes["rt-bump"];
	for(var idx = 0; idx<nodeBump.childNodes.length; idx++)
		if(nodeBump.childNodes[idx].value == bump){
			nodeBump.selectedIndex = idx;
			break;
		}
	if(content.timelines) gConfig.rt = {"timeline":[content.timelines.id]};
	else gConfig.rt = {"post":[content.posts.id]};
	if( nodeRTCtrl.cNodes["rt-chkbox"].checked){
		gRt = new RtUpdate(gConfig.token, bump);
		gRt.subscribe(gConfig.rt);
	}
	document.body.removeChild(document.getElementById("splash"));
  (function(i,s,o,g,r,a,m){i["GoogleAnalyticsObject"]=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,"script","//www.google-analytics.com/analytics.js","ga");

  ga("create", "UA-0-1", "auto");
  ga("send", "pageview");	
	
}

function genUpControls(username){
	var controls = gNodes["up-controls"].cloneAll();
	var sub = controls.cNodes["up-s"]; 
	var user = gUsers.byName[username];
	if (typeof user !== "undifined") gen();
	else new Promise(function(resolve, reject){
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(this.status < 400){
				var oRes = JSON.parse(oReq.response);
				addUser(oRes.users);
				user = gUsers.byName[comment.user];
				resolve();
			}
		};
		oReq.open("get",gConfig.serverURL + "users/"+username, true);
		oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
		oReq.send();
	}).then(gen);
	function gen() {
		controls.user = username;
		sub.innerHTML = user.friend?"Unsubscribe":"Subscribe";
		sub.subscribed = user.friend;
		if (!user.friend && (user.isPrivate == 1 )){
			sub.removeEventListener("click",subscribe);
			if (Array.isArray(gMe.requests) && gMe.requests.some(function(a){return a.username == username})){
				controls.cNodes["up-s"] = document.createElement("span");
				controls.cNodes["up-s"] = "Subscription request sent";
			}else{
				sub.innerHTML = "Request subscription";
				sub.addEventListener("click", reqSubscription);
			}
		}
		if(user.friend && user.subscriber){
			controls.cNodes["up-d"].href = gConfig.front + "filter/direct#"+username;
			controls.cNodes["up-d"].target = "_blank";
		}else{
			controls.cNodes["up-d"].hidden = true;
			controls.cNodes["up-d"].nextSibling.hidden = true;
		}
		var aBan = controls.cNodes["up-b"];
		if (user.type == "group"){
			aBan.nextSibling.hidden = true;
			aBan.hidden = true;
			return;
		}
		aBan.banned = gMe.users.banIds.some(function(a){
			return a == user.id;
		});
		aBan.innerHTML = aBan.banned?"Un-block":"Block";
		aBan.addEventListener("click", ban); 
	}
	return controls;
}

function regenHides(){
	var idx = 0;
	document.hiddenPosts.forEach(function(victim){
		victim.data.idx = idx++;
	});
}
function updateDate(node){
	node.innerHTML =  relative_time(node.date);
	var txtdate = new Date(node.date).toString();
	node.title = txtdate.slice(0, txtdate.indexOf("(")).trim();
	window.setTimeout(updateDate, 30000, node );
}
 
function genPost(post){
	function spam(){nodePost = document.createElement("span");};
	function ham(){
		nodePost.feed = cpost.payload.feed;
		gPrivTimeline.posts.push(nodePost);
		gPrivTimeline.postsById[post.id] = nodePost;
		nodePost.rawData.body = cpost.payload.data;
		postNBody.cNodes["post-cont"].innerHTML = autolinker.link(cpost.payload.data.replace(/\n/g,"").replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
		if(typeof user === "undefined"){
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
					oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
					oReq.send();
				}).then(gotUser,spam);
			}
		}else gotUser();
	}
	function gotUser(){
		nodePost.gotLock  = false;
		if(typeof user !== "undefined"){
			nodePost.cNodes["avatar"].cNodes["avatar-h"].innerHTML = '<img src="'+ user.profilePictureMediumUrl+'" />';
			nodePost.cNodes["avatar"].cNodes["avatar-h"].userid = user.id;
			postNBody.cNodes["title"].innerHTML = genTitle(nodePost);
		}
		if(nodePost.gotLock == true)
			postNBody.cNodes["post-info"].cNodes["post-controls"].cNodes["post-lock"].innerHTML = "<i class='fa fa-lock icon'>&nbsp;</i>";
		if(post.attachments){
			var attsNode = postNBody.cNodes["attachments"];
			for(var att in post.attachments){
				var nodeAtt = gNodes["attachment"].cloneAll();
				var oAtt = gAttachments[post.attachments[att]];
				switch(oAtt.mediaType){
				case "image":
					nodeAtt.innerHTML = '<a target="_blank" href="'+oAtt.url+'" border=none ><img src="'+oAtt.thumbnailUrl+'"></a>';
					break;
				case "audio":
					nodeAtt.innerHTML = '<audio style="height:40" preload="none" controls><source src="'+oAtt.url+'" ></audio> <br><a href="'+oAtt.url+'" target="_blank" ><i class="fa fa-download"></i> '+oAtt.fileName+'</a>';
					nodeAtt.className = "att-audio";
					break;
				}
				attsNode.appendChild(nodeAtt);
			}		
		}
		var anchorDate = document.createElement("a");
		if(typeof user !== "undefined") anchorDate.href = gConfig.front+user.username+"/"+post.id;
		postNBody.cNodes["post-info"].cNodes["post-controls"].cNodes["post-date"].appendChild(anchorDate);
		anchorDate.date = post.createdAt*1;
		window.setTimeout(updateDate, 10,anchorDate);

		if(typeof gMe !== "undefined"){ 
			var nodeControls;
			if (post.createdBy == gMe.users.id){
				nodeControls = gNodes["controls-self"].cloneAll();
			}else {
				nodeControls = gNodes["controls-others"].cloneAll();
				postNBody.cNodes["post-info"].nodeLike = nodeControls.cNodes["post-control-like"];
				nodeControls.cNodes["post-control-like"].action = true;
			}
			var nodeHide  = gNodes["hide"].cloneAll();
			nodeControls.appendChild(nodeHide);
			var aHide = nodeHide.cNodes["href"]
			aHide.className = "hide";
			aHide.innerHTML = post.isHidden?"Un-hide":"Hide";
			aHide.action = !post.isHidden;
			postNBody.cNodes["post-info"].cNodes["post-controls"].appendChild( nodeControls);
			postNBody.cNodes["post-info"].cNodes["post-controls"].nodeHide = aHide;
		}
		if (post.likes)	genLikes(nodePost );
		if (post.comments){
			if(post.omittedComments){
				if(post.comments[0])
					postNBody.cNodes["comments"].appendChild(genComment(gComments[post.comments[0]]));
				var nodeComment = gNodes["comment"].cloneAll();
				nodeComment.cNodes["comment-date"].innerHTML = "";
				nodeComment.cNodes["comment-body"].innerHTML = "<a id="+post.id+'-unc  onclick="unfoldComm(\''+post.id +'\')" style="font-style: italic;">'+ post.omittedComments+" more comments</a>";
				postNBody.cNodes["comments"].appendChild(nodeComment);
				if(post.comments[1])
					postNBody.cNodes["comments"].appendChild(genComment(gComments[post.comments[1]]));
			}
			else post.comments.forEach(function(commentId){ postNBody.cNodes["comments"].appendChild(genComment(gComments[commentId]))});
		}
		postNBody.cNodes["comments"].cnt = postNBody.cNodes["comments"].childNodes.length;
		if (postNBody.cNodes["comments"].cnt > 4) 
				addLastCmtButton(postNBody);
	}
	var nodePost = gNodes["post"].cloneAll();
	var postNBody = nodePost.cNodes["post-body"];
	var user = undefined;
	if(post.createdBy) user = gUsers[post.createdBy];
	nodePost.homed = false;
	nodePost.rawData = post;
	nodePost.id = post.id;
	nodePost.isPrivate = false;

	var cpost = matrix.decrypt(post.body);
	if (typeof cpost.error !== "undefined"){
		switch(cpost.error){
		case "0":
			break;
		case "3":
			gPrivTimeline.noKey[post.id] = post;
			console.log(post.id+": unknown key");
			break;
		case "4":
			gPrivTimeline.noDecipher[post.id] = post;
			console.log("Private keys not loaded");
			break;
		}
		postNBody.cNodes["post-cont"].innerHTML =  autolinker.link(post.body.replace(/\n/g,"").replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
		gotUser();
	}else{	
		nodePost.isPrivate = true;
		post.createdAt = Date.parse(post.createdAt);
		nodePost.rawData.createdAt = post.createdAt;
		cpost = JSON.parse(cpost);
		if (typeof cpost.payload.author === "undefined" ) return spam();
		matrix.verify(JSON.stringify(cpost.payload), cpost.sign, cpost.payload.author).then(ham,spam);
		nodePost.sign = cpost.sign;
	}
	return nodePost;

}
function genTitle(nodePost){
	var post = nodePost.rawData;
	var user = gUsers[post.createdBy];
	var title = user.link;
	if(nodePost.isPrivate) title += "<span> posted a secret to "+StringView.makeFromBase64(matrix.gSymKeys[cpost.payload.feed].name)+"</span>";
	else if(post.postedTo){
		nodePost.gotLock  = true;
		post.postedTo.forEach(function(id){ 
			if (gFeeds[id].isPrivate == "0")
				nodePost.gotLock = false; 
		});
		if ((post.postedTo.length >1)||(gFeeds[post.postedTo[0]].id!=user.id)){
			title += "<span> posted to: </span>";
			post.postedTo.forEach(function(id){
				title += gFeeds[id].link;
			});
		}
	}
	return title;
}

function newPost(e){
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
				"author":gMe.users.username,
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
function sendAttachment(e){
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
		};

		oReq.open("post",gConfig.serverURL + "attachments", true);
		oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
		var data = new FormData();
		data.append( "name", "attachment[file]");
		data.append( "attachment[file]", e.target.files[0], e.target.value);
		oReq.send(data);
	});
}
function editPost(e) {
	var victim = e.target; do victim = victim.parentNode; while(victim.className != "post");
	var nodeEdit = genEditNode(postEditedPost,cancelEditPost);
	nodeEdit.cNodes["edit-txt-area"].value = victim.rawData.body;
	victim.cNodes["post-body"].replaceChild( nodeEdit, victim.cNodes["post-body"].cNodes["post-cont"]);
}
function cancelEditPost(e){
	 var victim = e.target; do victim = victim.parentNode; while(victim.className != "post");
	 var postCNode = document.createElement("div");
	 postCNode.innerHTML = victim.rawData.body;
	 postCNode.className = "post-cont";
	 victim.cNodes["post-body"].replaceChild(postCNode,e.target.parentNode.parentNode );
	 victim.cNodes["post-body"].cNodes["post-cont"] = postCNode;

}
function postEditedPost(e){
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
	};

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
		oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
		oReq.setRequestHeader("Content-type","application/json");
		oReq.send(JSON.stringify(postdata));
	}
}
function deletePost(e){
	var victim =e.target; do victim = victim.parentNode; while(victim.className != "post");
	deleteNode(victim, doDeletePost);
}
function doDeletePost(but){
	var victim = but.node;
	but.parentNode.parentNode.removeChild(but.parentNode);
	var oReq = new XMLHttpRequest();
	oReq.onload = function(){
		if(this.status < 400){
			document.hiddenPosts.splice(victim.rawData.idx,1);
			//victim.parentNode.removeChild(victim);
			regenHides();
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
		oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
		oReq.setRequestHeader("Content-type","application/json");
		oReq.send();
	}
}
function postLike(e){
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
				genLikes(nodePost);

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

function genEditNode(post,cancel){
	var nodeEdit = gNodes["edit"].cloneAll();
	nodeEdit.cNodes["edit-buttons"].cNodes["edit-buttons-post"].addEventListener("click",post);
	nodeEdit.cNodes["edit-buttons"].cNodes["edit-buttons-cancel"].addEventListener("click",cancel);
	gConfig.cTxt = nodeEdit.cNodes["edit-txt-area"];
	return nodeEdit;
}

function genComment(comment){
	var nodeComment = gNodes["comment"].cloneAll();
	var cUser = gUsers[comment.createdBy];
	var nodeSpan = document.createElement("span");
	nodeComment.userid = null; 
	function gotUser(){
		nodeComment.userid = cUser.id;
		nodeSpan.innerHTML += " - " + cUser.link ;
		if(typeof gMe !== "undefined") 
			if(cUser.id == gMe.users.id) 
				nodeComment.cNodes["comment-body"].appendChild(gNodes["comment-controls"].cloneAll());
			else if(!cUser.friend) nodeComment.cNodes["comment-date"].cNodes["date"].style.color = "#787878";
	}
	function spam(){nodeComment = document.createElement("span");};
	nodeComment.cNodes["comment-body"].appendChild(nodeSpan);
	nodeSpan.innerHTML = autolinker.link(comment.body.replace(/\n/g,"").replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
	nodeComment.id = comment.id;
	nodeComment.createdAt = comment.createdAt;
	if(typeof cUser !== "undefined"){
		gotUser();
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
				oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
				oReq.send();
			}).then(gotUser,spam);
		}
	}
	return nodeComment; 
}
function addLastCmtButton(postNBody){
	if (postNBody.lastCmtButton == true)return;
	var aAddComment = document.createElement("a");
	var aIcon = document.createElement("a");
	aAddComment.className = "post-control-comment";
	aIcon.className = "fa-stack fa-1x";
	aIcon.innerHTML = '<i class="fa fa-comment-o fa-stack-1x"></i>'
	+'<i class="fa fa-square fa-inverse fa-stack-1x" style="left: 3px; top: 3px; font-size: 60%"></i>'
	+'<i class="fa fa-plus fa-stack-1x" style="left: 3px; top: 3px; font-size: 60%"></i>';
	aAddComment.innerHTML  = "Add comment";
	aAddComment.addEventListener("click",addComment);
	postNBody.appendChild(aIcon);
	postNBody.appendChild(aAddComment );
	postNBody.lastCmtButton = true;
}


function genCNodes(node, proto){
	node.cNodes = new Object(); 
	for(var idx = 0; idx <  node.childNodes.length; idx++){
		genCNodes(node.childNodes[idx], proto.childNodes[idx]);
		node.cNodes[node.childNodes[idx].className] = node.childNodes[idx];
	}
	if (typeof(proto.e) !== "undefined" ) 
		for(var action in proto.e)
			node.addEventListener(action, window[proto.e[action]]);	
}

function genDirectTo(victim){
	var nodeDirectTo = gNodes["new-direct-to"].cloneAll();
	victim.replaceChild(nodeDirectTo, victim.cNodes["new-post-to"]);
	victim.cNodes["new-post-to"] = nodeDirectTo;
	nodeDirectTo.feeds = new Array();
	victim.cNodes["edit-buttons"].cNodes["edit-buttons-post"].removeEventListener("click", newPost);
	victim.cNodes["edit-buttons"].cNodes["edit-buttons-post"].addEventListener("click", postDirect);
	victim.cNodes["edit-buttons"].cNodes["edit-buttons-post"].disabled = true;
	if(document.location.hash != ""){
		victim.cNodes["edit-buttons"].cNodes["edit-buttons-post"].disabled = false;
		nodeDirectTo.cNodes["new-direct-input"].value = document.location.hash.slice(1);
	}
	if ((typeof gMe.users.subscribers !== "undefined") && (typeof gMe.users.subscriptions !== "undefined")){
		var oDest = new Object();
		for (var username in gUsers.byName){
			if (!gUsers.byName[username].friend || !(gUsers.byName[username].subscriber || (gUsers.byName[username].type == "group")))
				continue;
			var pos = oDest;
			for(var idx = 0; idx < username.length; idx++){
				if (typeof pos.arr === "undefined") pos.arr = new Array();
				pos.arr.push(username);
				if (typeof pos[username.charAt(idx)] === "undefined") 
					pos[username.charAt(idx)] = new Object();
				pos = pos[username.charAt(idx)];
			}
		}
	}
	nodeDirectTo.cNodes["new-direct-input"].dest = oDest;
	gConfig.regenPostTo = function (){return genDirectTo(victim);};
}
function genPostTo(victim){
	var nodePostTo = gNodes["new-post-to"].cloneAll(); 
	victim.replaceChild(nodePostTo, victim.cNodes["new-post-to"]);
	victim.cNodes["new-post-to"] = nodePostTo;
	nodePostTo.feeds = new Array();
	nodePostTo.feeds.push(gMe.users.username);
	nodePostTo.parentNode.isPrivate  = false;
	nodePostTo.cNodes["new-post-feeds"].firstChild.idx = 1;
	nodePostTo.cNodes["new-post-feeds"].firstChild.oValue = gMe.users.username;
	var option = document.createElement("option");
	option.selected = true;
	var select = document.createElement("select");
	select.className = "new-post-feed-select";
	select.hidden = nodePostTo.cNodes["new-post-feed-select"].hidden;
	select.addEventListener("change",newPostSelect);
	nodePostTo.replaceChild(select, nodePostTo.cNodes["new-post-feed-select"]);
	nodePostTo.cNodes["new-post-feed-select"] = select;
	nodePostTo.cNodes["new-post-feed-select"].appendChild(option);
	option = document.createElement("option");
	option.disabled = true;
	option.innerHTML = "My feed";
	option.value = gMe.users.username;
	nodePostTo.cNodes["new-post-feed-select"].appendChild(option);
	var groups = document.createElement("optgroup");
	groups.label = "Public groups";
	if (typeof gMe.users.subscriptions !== "undefined"){
		var oSubscriptions = new Object();
		gMe.subscriptions.forEach(function(sub){if (sub.name == "Posts")oSubscriptions[sub.id] = sub; });	
		gMe.users.subscriptions.forEach(function(subid){
			if (typeof oSubscriptions[subid] === "undefined") return;
			var sub = gUsers[oSubscriptions[subid].user];
			if((typeof sub !=="undefined") && (sub.type == "group")){
				option = document.createElement("option");
				option.value = sub.username;
				option.innerHTML = sub.screenName;
				groups.appendChild(option);
			}
		});
		
	};
	if (groups.childNodes.length > 0 )
		nodePostTo.cNodes["new-post-feed-select"].appendChild(groups);
	groups = document.createElement("optgroup");
	groups.label = "Private groups";
	for (var id in matrix.gSymKeys){
		option = document.createElement("option");
		option.value = id;
		option.privateFeed = true;
		option.innerHTML = StringView.makeFromBase64(matrix.gSymKeys[id].name);
		groups.appendChild(option);
	}
	if (groups.childNodes.length > 0 )
		nodePostTo.cNodes["new-post-feed-select"].appendChild(groups);
	
	gConfig.regenPostTo = function (){return genPostTo(victim);};

}


function frfAutolinker( autolinker,match ){
	switch (match.getType()){
	case "twitter":
		return "<a href=" + gConfig.front+match.getTwitterHandle()+">@" +match.getTwitterHandle( ) + "</a>" ;
	/*
	case "url":
		if( match.getUrl().indexOf(".freefeed.net") != -1 ) return true;
		else if( match.getUrl().indexOf("freefeed.net") != -1 ) {
		    match.url = match.url.replace("freefeed.net","m.freefeed.net","gm");
                    var tag = autolinker.getTagBuilder().build( match );  
                    return tag;

                } else {
                    return true;  
                }		

	*/
	default:
		return true;
	}
}
