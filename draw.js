"use strict";
define("Drawer", ["./utils", "./Autolinker.min"],function(Utils, Autolinker){return {
	doc: Object
	,gNodes: Object
	,init:function(d, n){doc = d; gNodes = n;}
	,"writeAllLikes":function(id,nodeLikes){
		var post = doc.getElementById(id).rawData;
		nodeLikes.innerHTML = "";
		var nodeLike = doc.createElement("li");
		nodeLike.className = "p-timeline-user-like";
		for(var like = 0; like < post.likes.length; like++){
			var nodeCLike = nodeLike.cloneNode();
			nodeCLike.innerHTML = gUsers[post.likes[like]].link;
			//nodeLikes.childNodes[idx].appendChild(nodeCLike);
			nodeLikes.appendChild(nodeCLike);
		}
		var suffix = doc.createElement("span");
		suffix.innerHTML = " liked this";
		//nodeLikes.childNodes[idx].appendChild(suffix);
		nodeLikes.appendChild(suffix);
	}
	,"genLikes":function(nodePost){
		var post = nodePost.rawData;
		var postNBody = nodePost.cNodes["post-body"];
		var node = doc.createElement("div");
		node.className = "likes";
		postNBody.cNodes["post-info"].replaceChild(node,  postNBody.cNodes["post-info"].cNodes["likes"]);
		postNBody.cNodes["post-info"].cNodes["likes"] = node;
		if(!Array.isArray(post.likes) || !post.likes.length ) return;
		postNBody.cNodes["post-info"].cNodes["likes"].appendChild(gNodes["likes-smile"].cloneNode(true));
		var nodeLikes = doc.createElement( "ul");
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
		var nodeLike = doc.createElement("li");
		nodeLike.className = "p-timeline-user-like";
		post.likes.forEach(function(like){
			var nodeCLike = nodeLike.cloneNode();
			nodeCLike.innerHTML = gUsers[like].link;
			nodeLikes.appendChild(nodeCLike);
		});
		var suffix = doc.createElement("li");
		suffix.id = post.id+"-unl" 
		if (post.omittedLikes)
			suffix.innerHTML = 'and <a onclick="Actions["unfoldLikes"](\''+post.id+'\')">'+ post.omittedLikes +" other people</a>" ;
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

	,"loadGlobals":function(data){
		if(data.attachments)data.attachments.forEach(function(attachment){ gAttachments[attachment.id] = attachment; });
		if(data.comments)data.comments.forEach(function(comment){ gComments[comment.id] = comment; });
		if(data.users)data.users.forEach(Utils["addUser"]);
		if(data.subscribers && data.subscriptions ){	
			var subscribers = new Object();
			data.subscribers.forEach(function(sub){subscribers[sub.id]=sub;Utils["addUser"](sub);});
			data.subscriptions.forEach(function(sub){
				if(["Posts", "Directs"].some(function(a){ return a == sub.name })){
					gFeeds[sub.id] = subscribers[sub.user];
					var user = gFeeds[sub.id];
					var className = "not-my-link";
					if((typeof gMe !== "undefined")
						&&(typeof gMe.users !== "undefined")
						&&(user.id==gMe.users.id))
						className = "my-link";
					gFeeds[sub.id].link = '<a class="'+className+'" href="' + gConfig.front+ user.username+'">'+ user.screenName+"</a>";
				}
			});
		}
	}

	,"draw":function(content){
		var Drawer = this;
		autolinker = new Autolinker({"truncate":20,  "replaceFn":Drawer.frfAutolinker } );
		var body = doc.createElement("div");
		body.className = "content";
		body.id = "content";
		doc.getElementsByTagName("body")[0].appendChild(body);
		Drawer.loadGlobals(content);
		var title =  doc.createElement("div");
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
				gMe.subscribers.forEach(Utils["addUser"]);
				var oSubscriptions = new Object();
				gMe.subscriptions.forEach(function(sub){
					if(sub.name =="Posts"){
						oSubscriptions[sub.id] = sub.user;
					}
				});
				gMe.users.subscribers.forEach(function(sub){
					Utils["addUser"](sub);
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
					Drawer.genDirectTo(nodeAddPost);
					break;
				}
			case "home":
			case gMe.users.username:
				var nodeAddPost = gNodes["new-post"].cloneAll();
				body.appendChild(nodeAddPost);
				Drawer.genPostTo(nodeAddPost);
				break;
			default:
				body.appendChild(Drawer.genUpControls(gConfig.timeline));
				
			}
		}
		if(content.timelines){
			var nodeMore = doc.createElement("div");
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
			doc.posts = doc.createElement("div");
			doc.posts.className = "posts";
			body.appendChild(doc.posts);
			doc.hiddenPosts = new Array();
			doc.hiddenCount = 0;
			var idx = 0;
			if (content.posts){
				content.posts.forEach(function(post){
					post.idx = idx++;
					if(post.isHidden){
						doc.hiddenCount++;
					}else{ 
						post.isHidden = false;
						doc.posts.appendChild(Drawer.genPost(post));
					} 
					doc.hiddenPosts.push({"is":post.isHidden,"data":post});
				});
			}
			var nodeShowHidden = gNodes["show-hidden"].cloneAll();
			nodeShowHidden.cNodes["href"].action = true;
			body.appendChild(nodeShowHidden);
			if(doc.hiddenCount) nodeShowHidden.cNodes["href"].innerHTML= "Show "+ doc.hiddenCount + " hidden entries";
			body.appendChild(nodeMore);
			/*
			var drop = Math.floor(gConfig.cSkip/3);
			var toAdd = drop + Math.floor(gConfig.offset/3);
			if((!gPrivTimeline.done)&& (gConfig.timeline == "home")&& matrix.ready){
				gPrivTimeline.done = true;
				new Promise(function (){addPosts(drop,toAdd,0);});
			};
			*/
		}else{
			var singlePost = Drawer.genPost(content.posts);
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
		doc.body.removeChild(doc.getElementById("splash"));
	  /*
	  (function(i,s,o,g,r,a,m){i["GoogleAnalyticsObject"]=r;i[r]=i[r]||function(){
	  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	  })(window,doc,"script","//www.google-analytics.com/analytics.js","ga");

	  ga("create", "UA-0-1", "auto");
	  ga("send", "pageview");	
	*/	
	}

	,"genUpControls":function(username){
		var controls = gNodes["up-controls"].cloneAll();
		var sub = controls.cNodes["up-s"]; 
		var user = gUsers.byName[username];
		if (typeof user !== "undifined") gen();
		else new Promise(function(resolve, reject){
			var oReq = new XMLHttpRequest();
			oReq.onload = function(){
				if(this.status < 400){
					var oRes = JSON.parse(oReq.response);
					Utils["addUser"](oRes.users);
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
				sub.removeEventListener("click",Actions["subscribe"]);
				if (Array.isArray(gMe.requests) && gMe.requests.some(function(a){return a.username == username})){
					controls.cNodes["up-s"] = doc.createElement("span");
					controls.cNodes["up-s"] = "Subscription request sent";
				}else{
					sub.innerHTML = "Request subscription";
					sub.addEventListener("click", Actions["reqSubscription"]);
				}
			}
			if(user.friend && user.subscriber){
				controls.cNodes["up-d"].cNodes["up-d-a"].href = gConfig.front + "filter/direct#"+username;
				controls.cNodes["up-d"].cNodes["up-d-a"].target = "_blank";
			}else
				controls.cNodes["up-d"].hidden = true;
			
			var nodeBan = controls.cNodes["up-b"];
			if (user.type == "group"){
				nodeBan.hidden = true;
				return;
			}
			nodeBan.banned = false;
			if(Array.isArray( gMe.users.banIds)){
				nodeBan.banned = gMe.users.banIds.some(function(a){
					return a == user.id;
				});
			}
			nodeBan.cNodes["up-b-a"].innerHTML = nodeBan.banned?"Un-block":"Block";
			nodeBan.addEventListener("click", Actions["ban"]); 
		}
		return controls;
	}

	,"regenHides":function(){
		var idx = 0;
		doc.hiddenPosts.forEach(function(victim){
			victim.data.idx = idx++;
		});
	}
	,"updateDate":function(node){
		var Drawer = this;
		node.innerHTML =  Utils["relative_time"](node.date);
		var txtdate = new Date(node.date).toString();
		node.title = txtdate.slice(0, txtdate.indexOf("(")).trim();
		window.setTimeout(Drawer.updateDate, 30000, node );
	}
	 
	,"genPost":function(post){
		var Drawer = this;
		function spam(){nodePost = doc.createElement("span");};
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
								Utils["addUser"](oRes.users);
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
				postNBody.cNodes["title"].innerHTML = Drawer.genTitle(nodePost);
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
			var anchorDate = doc.createElement("a");
			if(typeof user !== "undefined") anchorDate.href = gConfig.front+user.username+"/"+post.id;
			postNBody.cNodes["post-info"].cNodes["post-controls"].cNodes["post-date"].appendChild(anchorDate);
			anchorDate.date = post.createdAt*1;
			window.setTimeout(Drawer.updateDate, 10,anchorDate);

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
			if (post.likes)	Drawer.genLikes(nodePost );
			if (post.comments){
				if(post.omittedComments){
					if(post.comments[0])
						postNBody.cNodes["comments"].appendChild(Drawer.genComment(gComments[post.comments[0]]));
					var nodeComment = gNodes["comment"].cloneAll();
					nodeComment.cNodes["comment-date"].innerHTML = "";
					nodeComment.cNodes["comment-body"].innerHTML = "<a id="+post.id+'-unc  onclick="Actions["unfoldComm"](\''+post.id +'\')" style="font-style: italic;">'+ post.omittedComments+" more comments</a>";
					postNBody.cNodes["comments"].appendChild(nodeComment);
					if(post.comments[1])
						postNBody.cNodes["comments"].appendChild(Drawer.genComment(gComments[post.comments[1]]));
				}
				else post.comments.forEach(function(commentId){ postNBody.cNodes["comments"].appendChild(Drawer.genComment(gComments[commentId]))});
			}
			postNBody.cNodes["comments"].cnt = postNBody.cNodes["comments"].childNodes.length;
			if (postNBody.cNodes["comments"].cnt > 4) 
					Drawer.addLastCmtButton(postNBody);
		}
		var nodePost = gNodes["post"].cloneAll();
		var postNBody = nodePost.cNodes["post-body"];
		var user = undefined;
		if(post.createdBy) user = gUsers[post.createdBy];
		nodePost.homed = false;
		nodePost.rawData = post;
		nodePost.id = post.id;
		nodePost.isPrivate = false;
/*
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
*/
			postNBody.cNodes["post-cont"].innerHTML =  autolinker.link(post.body.replace(/\n/g,"").replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
			gotUser();
/*
		}else{	
			nodePost.isPrivate = true;
			post.createdAt = Date.parse(post.createdAt);
			nodePost.rawData.createdAt = post.createdAt;
			cpost = JSON.parse(cpost);
			if (typeof cpost.payload.author === "undefined" ) return spam();
			matrix.verify(JSON.stringify(cpost.payload), cpost.sign, cpost.payload.author).then(ham,spam);
			nodePost.sign = cpost.sign;
		}
*/
		return nodePost;

	}
	,"genTitle":function(nodePost){
		var post = nodePost.rawData;
		var user = gUsers[post.createdBy];
		var title = user.link;
		//if(nodePost.isPrivate) title += "<span> posted a secret to "+StringView.makeFromBase64(matrix.gSymKeys[cpost.payload.feed].name)+"</span>";
		if(post.postedTo){
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


	,"genEditNode":function(post,cancel){
		var nodeEdit = gNodes["edit"].cloneAll();
		nodeEdit.cNodes["edit-buttons"].cNodes["edit-buttons-post"].addEventListener("click",post);
		nodeEdit.cNodes["edit-buttons"].cNodes["edit-buttons-cancel"].addEventListener("click",cancel);
		gConfig.cTxt = nodeEdit.cNodes["edit-txt-area"];
		return nodeEdit;
	}

	,"genComment":function(comment){
		var nodeComment = gNodes["comment"].cloneAll();
		var cUser = gUsers[comment.createdBy];
		var nodeSpan = doc.createElement("span");
		nodeComment.userid = null; 
		function gotUser(){
			nodeComment.userid = cUser.id;
			nodeSpan.innerHTML += " - " + cUser.link ;
			if(typeof gMe !== "undefined") 
				if(cUser.id == gMe.users.id) 
					nodeComment.cNodes["comment-body"].appendChild(gNodes["comment-controls"].cloneAll());
				else if(!cUser.friend) nodeComment.cNodes["comment-date"].cNodes["date"].style.color = "#787878";
		}
		function spam(){nodeComment = doc.createElement("span");};
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
							Utils["addUser"](oRes.users);
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
	,"addLastCmtButton":function(postNBody){
		if (postNBody.lastCmtButton == true)return;
		var aAddComment = doc.createElement("a");
		var aIcon = doc.createElement("a");
		aAddComment.className = "post-control-comment";
		aIcon.className = "fa-stack fa-1x";
		aIcon.innerHTML = '<i class="fa fa-comment-o fa-stack-1x"></i>'
		+'<i class="fa fa-square fa-inverse fa-stack-1x" style="left: 3px; top: 3px; font-size: 60%"></i>'
		+'<i class="fa fa-plus fa-stack-1x" style="left: 3px; top: 3px; font-size: 60%"></i>';
		aAddComment.innerHTML  = "Add comment";
		aAddComment.addEventListener("click",Actions["addComment"]);
		postNBody.appendChild(aIcon);
		postNBody.appendChild(aAddComment );
		postNBody.lastCmtButton = true;
	}



	,"genDirectTo":function(victim){
		var nodeDirectTo = gNodes["new-direct-to"].cloneAll();
		victim.replaceChild(nodeDirectTo, victim.cNodes["new-post-to"]);
		victim.cNodes["new-post-to"] = nodeDirectTo;
		nodeDirectTo.feeds = new Array();
		victim.cNodes["edit-buttons"].cNodes["edit-buttons-post"].removeEventListener("click", newPost);
		victim.cNodes["edit-buttons"].cNodes["edit-buttons-post"].addEventListener("click", Actions["postDirect"]);
		victim.cNodes["edit-buttons"].cNodes["edit-buttons-post"].disabled = true;
		if(doc.location.hash != ""){
			victim.cNodes["edit-buttons"].cNodes["edit-buttons-post"].disabled = false;
			nodeDirectTo.cNodes["new-direct-input"].value = doc.location.hash.slice(1);
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
		gConfig.regenPostTo = function (){return Drawer.genDirectTo(victim);};
	}
	,"genPostTo":function(victim){ 
		var Drawer = this;
		var nodePostTo = gNodes["new-post-to"].cloneAll(); 
		victim.replaceChild(nodePostTo, victim.cNodes["new-post-to"]);
		//console.log(victim);
		victim.cNodes["new-post-to"] = nodePostTo;
		nodePostTo.feeds = new Array();
		nodePostTo.feeds.push(gMe.users.username);
		nodePostTo.parentNode.isPrivate  = false;
		nodePostTo.cNodes["new-post-feeds"].firstChild.idx = 1;
		nodePostTo.cNodes["new-post-feeds"].firstChild.oValue = gMe.users.username;
		var option = doc.createElement("option");
		option.selected = true;
		var select = doc.createElement("select");
		select.className = "new-post-feed-select";
		select.hidden = nodePostTo.cNodes["new-post-feed-select"].hidden;
		select.addEventListener("change",Actions["newPostSelect"]);
		nodePostTo.replaceChild(select, nodePostTo.cNodes["new-post-feed-select"]);
		nodePostTo.cNodes["new-post-feed-select"] = select;
		nodePostTo.cNodes["new-post-feed-select"].appendChild(option);
		option = doc.createElement("option");
		option.disabled = true;
		option.innerHTML = "My feed";
		option.value = gMe.users.username;
		nodePostTo.cNodes["new-post-feed-select"].appendChild(option);
		var groups = doc.createElement("optgroup");
		groups.label = "Public groups";
		if (typeof gMe.users.subscriptions !== "undefined"){
			var oSubscriptions = new Object();
			gMe.subscriptions.forEach(function(sub){if (sub.name == "Posts")oSubscriptions[sub.id] = sub; });	
			gMe.users.subscriptions.forEach(function(subid){
				if (typeof oSubscriptions[subid] === "undefined") return;
				var sub = gUsers[oSubscriptions[subid].user];
				if((typeof sub !=="undefined") && (sub.type == "group")){
					option = doc.createElement("option");
					option.value = sub.username;
					option.innerHTML = sub.screenName;
					groups.appendChild(option);
				}
			});
			
		};
		if (groups.childNodes.length > 0 )
			nodePostTo.cNodes["new-post-feed-select"].appendChild(groups);
		groups = doc.createElement("optgroup");
		groups.label = "Private groups";
		/*
		for (var id in matrix.gSymKeys){
			option = doc.createElement("option");
			option.value = id;
			option.privateFeed = true;
			option.innerHTML = StringView.makeFromBase64(matrix.gSymKeys[id].name);
			groups.appendChild(option);
		}
		*/
		if (groups.childNodes.length > 0 )
			nodePostTo.cNodes["new-post-feed-select"].appendChild(groups);
		
		gConfig.regenPostTo = function (){return Drawer.genPostTo(victim);};

	}


	,"frfAutolinker":function( autolinker,match ){
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
};});
