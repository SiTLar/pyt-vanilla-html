"use strict";

define("Drawer", [],function(Autolinker){

function _Drawer(v){
	this.cView = v;
}
_Drawer.prototype = {
	constructor: _Drawer
	,"writeAllLikes":function(id,nodeLikes){
		var cView = this.cView;
		var post = cView.doc.getElementById(id).rawData;
		nodeLikes.innerHTML = "";
		var nodeLike = cView.doc.createElement("span");
		nodeLike.className = "p-timeline-user-like";
		for(var like = 0; like < post.likes.length; like++){
			var nodeCLike = nodeLike.cloneNode();
			nodeCLike.innerHTML = cView.gUsers[post.likes[like]].link;
			//nodeLikes.childNodes[idx].appendChild(nodeCLike);
			nodeLikes.appendChild(nodeCLike);
		}
		var suffix = cView.doc.createElement("span");
		suffix.innerHTML = " liked this";
		//nodeLikes.childNodes[idx].appendChild(suffix);
		nodeLikes.parentNode.appendChild(suffix);
	}
	,"genLikes":function(nodePost){
		var cView = this.cView;
		var post = nodePost.rawData;
		var postNBody = nodePost.cNodes["post-body"];
		var node = cView.doc.createElement("div");
		node.className = "likes";
		postNBody.cNodes["post-info"].replaceChild(node,  postNBody.cNodes["post-info"].cNodes["likes"]);
		postNBody.cNodes["post-info"].cNodes["likes"] = node;
		if(!Array.isArray(post.likes) || !post.likes.length ) return;
		postNBody.cNodes["post-info"].cNodes["likes"].appendChild(cView.gNodes["likes-smile"].cloneNode(true));
		var nodeLikes = cView.doc.createElement( "span");

		/*
		var l =  post.likes.length;
		if(typeof cView.gMe !== "undefined"){
			for (var idx = 0; idx< l;idx++) {
				var like = post.likes[idx];
				if(like == cView.gMe.users.id){
					post.likes.splice(idx,1);
					post.likes.unshift(like);
					break;
				}
			}
		}
		*/


		var nodeLike = cView.doc.createElement("span");
		nodeLike.className = "p-timeline-user-like";
		post.likes.forEach(function(like){
			var nodeCLike = nodeLike.cloneNode();
			nodeCLike.innerHTML = cView.gUsers[like].link;
			nodeLikes.appendChild(nodeCLike);
		});
		var suffix = cView.doc.createElement("span");
		suffix.id = post.id+"-unl"
		if (post.omittedLikes)
			suffix.innerHTML = 'and <a onclick="unfoldLikes(\''+post.id+'\')">'+ post.omittedLikes +" other people</a> ";
		suffix.innerHTML += "liked this";
		suffix.className = "nocomma";
		postNBody.cNodes["post-info"].cNodes["likes"].appendChild(nodeLikes);
		postNBody.cNodes["post-info"].cNodes["likes"].cNodes = new Object();
		postNBody.cNodes["post-info"].cNodes["likes"].cNodes["comma"] = nodeLikes;
		postNBody.cNodes["post-info"].cNodes["likes"].appendChild(suffix);
		//postNBody.cNodes["post-info"].cNodes["likes"].appendChild(suffix);
		nodeLikes.className = "comma";
		if(typeof cView.gMe !== "undefined"){
			if(post.likes[0] == cView.gMe.users.id){
				postNBody.cNodes["post-info"].myLike = nodeLikes.childNodes[0];
				if( postNBody.cNodes["post-info"].nodeLike) {
					postNBody.cNodes["post-info"].nodeLike.innerHTML = "Un-like";
					postNBody.cNodes["post-info"].nodeLike.action = false;

				}

			}
		}
	}
	,"loadGlobals":function(data){
		var cView = this.cView;
		if(data.attachments)data.attachments.forEach(function(attachment){ cView.gAttachments[attachment.id] = attachment; });
		if(data.comments)data.comments.forEach(function(comment){ cView.gComments[comment.id] = comment; });
		if(data.users)data.users.forEach(cView.Utils.addUser, cView.Utils);
		if(data.subscribers && data.subscriptions ){
			var subscribers = new Object();
			data.subscribers.forEach(function(sub){subscribers[sub.id]=sub;cView.Utils.addUser(sub);});
			data.subscriptions.forEach(function(sub){
				if(["Posts", "Directs"].some(function(a){ return a == sub.name })){
					var userTitle;
					var user = subscribers[sub.user];
					if (cView.mode == null) cView.mode = "screen";
					switch(cView.mode){
					case "screen":
						userTitle  = user.screenName;
						break;
					case "screen_u":
						if(user.screenName != user.username)
							userTitle  = user.screenName + " <div class=username>("+user.username+")</div>";
						else userTitle  = "<div class=username>"+user.username+"</div>";
						break;
					case "username":
						userTitle  = "<div class=username>"+user.username+"</div>";
					}
					var className = "not-my-link";
					if((typeof cView.gMe !== "undefined")&&(typeof cView.gMe.users !== "undefined"))
						className = (user.id==cView.gMe.users.id?"my-link":"not-my-link");
					cView.gFeeds[sub.id] = user;
					cView.gFeeds[sub.id].link = '<a class="'+className+'" href="' + gConfig.front+ user.username+'">'+ userTitle+"</a>";
				}
			});
		}
	}
	,"makeContainer":function(){
		var cView = this.cView;
		var body = cView.doc.createElement("div");
		body.className = "content";
		body.id = "content";
		cView.doc.getElementsByTagName("body")[0].appendChild(body);
		var title =  cView.doc.createElement("div");
		title.className = "pagetitle";
		title.innerHTML = "<h1>" +cView.timeline+ "</h1>"
		cView.doc.title = "FreeFeed: " + cView.timeline; 
		var controls = cView.gNodes["controls-user"].cloneAll();
		if((typeof cView.gMe !== "undefined") 
			&& Array.isArray(cView.gMe.users.subscriptionRequests)){
			controls.cNodes["sr-info"].cNodes["sr-info-a"].innerHTML = "You have "
			+ cView.gMe.users.subscriptionRequests.length 
			+ " subscription requests to review.";
			controls.cNodes["sr-info"].hidden = false;
			cView.subReqsCount = cView.gMe.users.subscriptionRequests.length;
		} else cView.subReqsCount = 0;
		body.appendChild(controls );
		body.appendChild(title);
		return body;
	}
	,"drawSettings":function(){
		var cView = document.cView;
		var body = cView.Drawer.makeContainer();
		var nodeSettings = cView.gNodes["global-settings"].cloneAll();
		body.appendChild(nodeSettings);
		cView.doc.getElementById("my-screen-name").value = cView.gMe.users.screenName;
		if(typeof cView.gMe.users.email !== "undefined" )cView.doc.getElementById("my-email").value = cView.gMe.users.email;
		cView.doc.getElementById("me-private").checked = JSON.parse(cView.gMe.users.isPrivate);
		var mode = cView.localStorage.getItem("display_name");
		if (mode == null) mode = "screen";
		var theme = cView.localStorage.getItem("display_theme");
		if (theme  == null) mode = "main.css";
		var nodes = nodeSettings.getElementsByTagName("input");
		for(var idx = 0; idx < nodes.length; idx++){
			var node = nodes[idx];
			if(node.type == "radio" ){
				if (( node.name == "display_name") &&(node.value == mode)
				|| ( node.name == "display_theme") &&(node.value == theme))
					node.checked = true;
			}
		};
		var nodeLinkPreview =  cView.doc.getElementById("link-preview");
		if(JSON.parse(cView.localStorage.getItem("show_link_preview")))
			nodeLinkPreview.checked = true;
		else nodeLinkPreview.checked = false;

		cView.doc.getElementById("rt-chkbox").checked = JSON.parse(cView.localStorage.getItem("rt"));
		var bump = JSON.parse(cView.localStorage.getItem("rtbump"));
		cView.doc.getElementById("rt-params").hidden = !bump;
		cView.doc.getElementById("rt-bump").checked = bump ;
		var oRTParams = cView.localStorage.getItem("rt_params");
		if (oRTParams != null)
			oRTParams = JSON.parse(oRTParams);
		["rt-bump-int", "rt-bump-cd", "rt-bump-d"].forEach(function(id){
			var node = cView.doc.getElementById(id);
			if(oRTParams)node.value = oRTParams[id];
			node.parentNode.getElementsByTagName("span")[0].innerHTML = node.value + " minutes";
		});
		
		cView.Utils.setIcon("favicon.ico");
		try{cView.doc.body.removeChild(cView.doc.getElementById("splash"));}
		catch(e){};

	}
	,"draw":function(content){
		var cView = this.cView;
		var Drawer = cView.Drawer;

		/*
		matrix = new CryptoPrivate(gCryptoPrivateCfg );
		matrix.storage = cView.sessionStorage;
		var body = cView.doc.createElement("div");
		body.className = "content";
		body.id = "content";
		cView.doc.getElementsByTagName("body")[0].appendChild(body);
		var title =  cView.doc.createElement("div");
		title.innerHTML = "<h1>" +cView.timeline+ "</h1>"
		title.className = "pagetitle";
		*/
		var body = Drawer.makeContainer();
		Drawer.loadGlobals(content);
		cView.cTxt = null;
		["blockPosts", "blockComments"].forEach(function(list){
			cView[list]= JSON.parse(cView.localStorage.getItem(list));
		})
		//var nodeRTControls = cView.gNodes["rt-controls"].cloneAll();
		if(typeof cView.gMe === "undefined"){
			var nodeGControls = cView.gNodes["controls-anon"].cloneAll();
			var controls = body.getElementsByClassName("controls-user")[0];
			body.replaceChild(nodeGControls, controls);
		}else{
			if ((typeof cView.gMe.users.subscribers !== "undefined") 
			&& (typeof cView.gMe.users.subscriptions !== "undefined")){
				cView.gMe.subscribers.forEach(cView.Utils.addUser, cView.Utils);
				var oSubscriptions = new Object();
				cView.gMe.subscriptions.forEach(function(sub){
					if(sub.name =="Posts"){
						oSubscriptions[sub.id] = sub.user;
					}
				});
				cView.gMe.users.subscribers.forEach(function(sub){
					cView.Utils.addUser(sub);
					cView.gUsers[sub.id].subscriber = true;
				});
				cView.gMe.users.subscriptions.forEach(function(subid){
					if (typeof oSubscriptions[subid] !== "undefined") {
						if (typeof cView.gUsers[oSubscriptions[subid]] !== "undefined")
							cView.gUsers[oSubscriptions[subid]].friend = true;
					}
				});
			}

			switch (cView.timeline.split("/")[0]){
			case "filter":
				if (cView.timeline.split("/")[1] == "direct"){
					var nodeAddPost = cView.gNodes["new-post"].cloneAll();
					body.appendChild(nodeAddPost);
					Drawer.genDirectTo(nodeAddPost);
					break;
				}
			case "home":
			case cView.gMe.users.username:
				var nodeAddPost = cView.gNodes["new-post"].cloneAll();
				body.appendChild(nodeAddPost);
				Drawer.genPostTo(nodeAddPost);
				break;
			default:
				cView.Utils.setChild(body, "up-controls", Drawer.genUpControls(cView.timeline));

			}
		}
		if(content.timelines){
			var nodeMore = cView.doc.createElement("div");
			nodeMore.className = "more-node";
			var htmlPrefix = '<a href="' + gConfig.front+cView.timeline ;
			var htmlForward;
			var htmlBackward;
			//var fLastPage = (content.posts.length != cView.offset);
			var backward = cView.cSkip*1 - gConfig.offset*1;
			var forward = cView.cSkip*1 + gConfig.offset*1;
			if (cView.cSkip){
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
			cView.doc.posts = cView.doc.createElement("div");
			cView.doc.posts.className = "posts";
			cView.doc.posts.id = "posts";
			body.appendChild(cView.doc.posts);
			cView.doc.hiddenPosts = new Array();
			cView.doc.hiddenCount = 0;
			var idx = 0;
			if (content.posts){
				content.posts.forEach(function(post){
					post.idx = idx++;
					if(post.isHidden){
						cView.doc.hiddenCount++;
					}else{
						post.isHidden = false;
						cView.doc.posts.appendChild(Drawer.genPost(post));
					}
					cView.doc.hiddenPosts.push({"is":post.isHidden,"data":post});
				});
			}
			var nodeShowHidden = cView.gNodes["show-hidden"].cloneAll();
			nodeShowHidden.cNodes["href"].action = true;
			body.appendChild(nodeShowHidden);
			if(cView.doc.hiddenCount) nodeShowHidden.cNodes["href"].innerHTML= "Show "+ cView.doc.hiddenCount + " hidden entries";
			body.appendChild(nodeMore);
			var drop = Math.floor(cView.cSkip/3);
			var toAdd = drop + Math.floor(gConfig.offset/3);
			/*
			if((!gPrivTimeline.done)&& (cView.timeline == "home")&& matrix.ready){
				gPrivTimeline.done = true;
				new Promise(function (){addPosts(drop,toAdd,0);});
			};
			*/
		}else{
			var singlePost = Drawer.genPost(content.posts);
			body.appendChild(singlePost);
			var nodesHide = singlePost.getElementsByClassName("hide");
			singlePost.hidden = false;
			if (nodesHide.length)nodesHide[0].hidden = true;
			cView.doc.title = "@" 
				+ cView.gUsers[singlePost.rawData.createdBy].username + ": "
				+ singlePost.rawData.body.slice(0,20).trim()
				+ (singlePost.rawData.body.length > 20?"\u2026":"" )
				+ " (FreeFeed)";
		}
	/*
		var nodeRTCtrl = body.getElementsByClassName("rt-controls")[0];
		nodeRTCtrl.cNodes["rt-chkbox"].checked = JSON.parse(cView.localStorage.getItem("rt"));
		var nodeBump = nodeRTCtrl.cNodes["rt-bump"];
		for(var idx = 0; idx<nodeBump.childNodes.length; idx++)
			if(nodeBump.childNodes[idx].value == bump){
				nodeBump.selectedIndex = idx;
				break;
			}
		*/
		if(content.timelines) cView.rtSub = {"timeline":[content.timelines.id]};
		else cView.rtSub = {"post":[content.posts.id]};


	}
	,"drawRequests":function(){
		var cView = document.cView;
		var oReq = new XMLHttpRequest();
		oReq.open("get", gConfig.serverURL +"users/whoami", true);
		oReq.setRequestHeader("X-Authentication-Token", cView.token);
		oReq.onload = function(){
			if(oReq.status < 400) {
				cView.gMe = JSON.parse(oReq.response);
				if (cView.gMe.users) {
					cView.Utils.refreshgMe();
					cView.Drawer.completeRequests();
					return true;
				}
			}
		}
		oReq.send();
	}
	,"completeRequests":function(){
		var cView = this.cView;
		var body = cView.Drawer.makeContainer();
		if (Array.isArray(cView.gMe.requests)) cView.gMe.requests.forEach( cView.Utils.addUser, cView.Utils);
		else body.getElementsByClassName("pagetitle")[0].innerHTML = "<h1>No requests</h1>";
		
		if(Array.isArray(cView.gMe.users.subscriptionRequests)){
			var nodeTPReq = cView.doc.createElement("h3");
			nodeTPReq.innerHTML = "Pending requests";
			nodeTPReq.id = "sr-header";
			body.appendChild(nodeTPReq);
			cView.gMe.users.subscriptionRequests.forEach(function(req){
				body.appendChild(genReqNode(cView.gUsers[req]));
			});
		}
		if(Array.isArray(cView.gMe.users.pendingSubscriptionRequests)){
			var nodeTReq = cView.doc.createElement("h3");
			nodeTReq.innerHTML = "Sent requests";
			body.appendChild(nodeTReq);
			cView.gMe.users.pendingSubscriptionRequests.forEach(function(req){
				var node = genReqNode(cView.gUsers[req]);
				node.cNodes["sr-ctrl"].hidden = true;
				body.appendChild(node);
			});
		}

		cView.Utils.setIcon("favicon.ico");
		try{cView.doc.body.removeChild(cView.doc.getElementById("splash"));}
		catch(e){};
		function genReqNode(user){
			var node = cView.gNodes["sub-request"].cloneAll();
			node.cNodes["sr-name"].innerHTML = "<a href="+gConfig.front+user.username+">"
				+user.screenName
				+"</a>"
				+" @" + user.username; 
			node.cNodes["sr-avatar"].src =  user.profilePictureMediumUrl ;
			node.cNodes["sr-user"].value = user.username;
			return node;
		}

	}
	,"genUpControls":function(username){
		var cView = this.cView;
		var controls = cView.gNodes["up-controls"].cloneAll();
		var sub = controls.cNodes["up-s"];
		var user = cView.gUsers.byName[username];
		if (typeof user !== "undifined") gen();
		else new Promise(function(resolve, reject){
			var oReq = new XMLHttpRequest();
			oReq.onload = function(){
				if(this.status < 400){
					var oRes = JSON.parse(oReq.response);
					cView.Utils.addUser(oRes.users);
					user = cView.gUsers.byName[comment.user];
					resolve();
				}
			};
			oReq.open("get",gConfig.serverURL + "users/"+username, true);
			oReq.setRequestHeader("X-Authentication-Token", cView.token);
			oReq.send();
		}).then(gen);
		function gen() {
			controls.user = username;
			sub.innerHTML = user.friend?"Unsubscribe":"Subscribe";
			sub.subscribed = user.friend;
			if (!user.friend && (user.isPrivate == 1 )){
				sub.removeEventListener("click",cView["Actions"]["subscribe"]);
				var oRequests = new Object();
				if (Array.isArray(cView.gMe.requests)){
					cView.gMe.requests.forEach(function(req){
						oRequests[req.id] = req;
					});
				}
				if(Array.isArray(cView.gMe.users.pendingSubscriptionRequests)
				&&cView.gMe.users.pendingSubscriptionRequests.some(function(a){
						return oRequests[a].username == username
					})){
					controls.cNodes["up-s"] = cView.doc.createElement("span");
					controls.cNodes["up-s"].innerHTML = "Subscription request sent";
					controls.replaceChild(controls.cNodes["up-s"], sub);
				}else{
					sub.innerHTML = "Request subscription";
					sub.addEventListener("click", cView["Actions"]["reqSubscription"] );
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
			aBan.banned = cView.gMe.users.banIds.some(function(a){
				return a == user.id;
			});
			if (aBan.banned){
				aBan.innerHTML = "Un-ban";
				aBan.removeEventListener("click",cView["Actions"]["genBlock"]);
				aBan.addEventListener("click", cView["Actions"]["doUnBan"]);
			}
		}
		return controls;
	}

	,"regenHides":function(){
		var cView = this.cView;
		var idx = 0;
		cView.doc.hiddenPosts.forEach(function(victim){
			victim.data.idx = idx++;
		});
	}
	,"updateDate":function(node, cView){
		node.innerHTML = cView.Utils.relative_time(node.date);
		var txtdate = new Date(node.date).toString();
		node.title = txtdate.slice(0, txtdate.indexOf("(")).trim();
		window.setTimeout(cView.Drawer.updateDate, 30000, node, cView);
	}
	 
	,"genPost":function(post){
		var cView = this.cView;
		var Drawer = cView.Drawer;
		function spam(){nodePost = cView.doc.createElement("span");};
		function ham(){
			nodePost.feed = cpost.payload.feed;
			gPrivTimeline.posts.push(nodePost);
			gPrivTimeline.postsById[post.id] = nodePost;
			nodePost.rawData.body = cpost.payload.data;
			postNBody.cNodes["post-cont"].innerHTML = cView.autolinker.link(cpost.payload.data.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
			if(typeof user === "undefined"){
				if (cView.gUsers.byName[cpost.payload.author]){
					user = cView.gUsers.byName[cpost.payload.author];
					post.createdBy = user.id;
					gotUser();
				} else if(cView.gUsersQ[cpost.payload.author]) cView.gUsersQ[cpost.payload.author].then(
					function(){
						user = cView.gUsers.byName[cpost.payload.author];
						post.createdBy = user.id;
						gotUser();
					},spam);
				else{
					cView.gUsersQ[cpost.payload.author] = new Promise (function(resolve,reject){

						var oReq = new XMLHttpRequest();
						oReq.onload = function(){
							if(this.status < 400){
								var oRes = JSON.parse(oReq.response);
								cView.Utils.addUser(oRes.users);
								user = cView.gUsers.byName[cpost.payload.author];
								post.createdBy = user.id;
								resolve();
							}
						};

						oReq.open("get",gConfig.serverURL + "users/"+post.username, true);
						oReq.setRequestHeader("X-Authentication-Token", cView.token);
						oReq.send();
					}).then(gotUser,spam);
				}
			}else gotUser();
		}
		function gotUser(){
			var urlMatch ;		
			if(( typeof cView["blockPosts"]!== "undefined")&& (cView["blockPosts"] != null)&& (cView["blockPosts"][user.id])){
				nodePost.hidden = true  ;
			}
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
				post.attachments.forEach(function(att){
					var nodeAtt = cView.doc.createElement("div");
					var oAtt = cView.gAttachments[att];
					switch(oAtt.mediaType){
					case "image":
						var nodeA = cView.doc.createElement("a");
						nodeA.target = "_blank";
						nodeA.href = oAtt.url;
						nodeA.border = "none";
						var nodeImg = cView.doc.createElement("img");
						nodeImg.src = oAtt.thumbnailUrl;
						nodeImg.addEventListener("load", cView.Actions.showUnfolder);
						nodeA.appendChild(nodeImg);
						nodeAtt.appendChild(nodeA);
						attsNode.cNodes["atts-img"].appendChild(nodeAtt);
						nodeAtt.className = "att-img";
						break;
					case "audio":
						nodeAtt.innerHTML = '<audio style="height:40" preload="none" controls><source src="'+oAtt.url+'" ></audio> <br><a href="'+oAtt.url+'" target="_blank" ><i class="fa fa-download"></i> '+oAtt.fileName+'</a>';
						nodeAtt.className = "att-audio";
						attsNode.cNodes["atts-audio"].appendChild(nodeAtt);
						break;
					default:
						nodeAtt.innerHTML = '<a href="'+oAtt.url+'" target="_blank" ><i class="fa fa-download"></i> '+oAtt.fileName+'</a>';
						attsNode.appendChild(nodeAtt);

					}
				});		
			}else 
			if(((urlMatch = post.body.match(/https?:\/\/[^\s\/$.?#].[^\s]*/i) )!= null)
			&&(cView.localStorage.getItem("show_link_preview") == "1")){
				cView.gEmbed.p.then(function(oEmbedPr){
					Drawer.embedPreview(oEmbedPr
						,urlMatch[0]
						,postNBody.cNodes["attachments"] 
					);
				});
			}
			var anchorDate = cView.doc.createElement("a");
			if(typeof user !== "undefined") anchorDate.href = gConfig.front+user.username+"/"+post.id;
			postNBody.cNodes["post-info"].cNodes["post-controls"].cNodes["post-date"].appendChild(anchorDate);
			anchorDate.date = JSON.parse(post.createdAt);
			window.setTimeout(Drawer.updateDate, 10,anchorDate, cView);

			if(typeof cView.gMe !== "undefined"){
				var nodeControls;
				if (post.createdBy == cView.gMe.users.id){
					nodeControls = cView.gNodes["controls-self"].cloneAll();
				}else {
					nodeControls = cView.gNodes["controls-others"].cloneAll();
					postNBody.cNodes["post-info"].nodeLike = nodeControls.cNodes["post-control-like"];
					nodeControls.cNodes["post-control-like"].action = true;
				}
				nodeControls.className = "controls";
				var nodeHide  = cView.gNodes["hide"].cloneAll();
				nodeControls.appendChild(nodeHide);
				var aHide = nodeHide.cNodes["href"]
				//aHide.className = "hide";
				aHide.innerHTML = post.isHidden?"Un-hide":"Hide";
				aHide.action = !post.isHidden;
				postNBody.cNodes["post-info"].cNodes["post-controls"].appendChild( nodeControls);
				postNBody.cNodes["post-info"].cNodes["post-controls"].cNodes["controls"] = nodeControls;
				//postNBody.cNodes["post-info"].cNodes["post-controls"].nodeHide = aHide;
				nodeControls.cNodes["hide"] = nodeHide;
			}
			if (post.likes)	Drawer.genLikes(nodePost );
			if (post.comments){
				if(post.omittedComments){
					if(post.comments[0])
						postNBody.cNodes["comments"].appendChild(Drawer.genComment(cView.gComments[post.comments[0]]));
					var nodeComment = cView.gNodes["comment"].cloneAll();
					nodeComment.cNodes["comment-date"].innerHTML = "";
					nodeComment.cNodes["comment-body"].innerHTML = "<a id="+post.id+'-unc  onclick="document.cView.Actions.unfoldComm(\''+post.id +'\')" style="font-style: italic;">'+ post.omittedComments+" more comments</a>";
					postNBody.cNodes["comments"].appendChild(nodeComment);
					if(post.comments[1])
						postNBody.cNodes["comments"].appendChild(Drawer.genComment(cView.gComments[post.comments[1]]));
				}
				else post.comments.forEach(function(commentId){ postNBody.cNodes["comments"].appendChild(Drawer.genComment(cView.gComments[commentId]))});
			}
			postNBody.cNodes["comments"].cnt = postNBody.cNodes["comments"].childNodes.length;
			if (postNBody.cNodes["comments"].cnt > 4)
					Drawer.addLastCmtButton(postNBody);
		}
		var nodePost = cView.gNodes["post"].cloneAll();
		var postNBody = nodePost.cNodes["post-body"];
		var user = undefined;
		if(post.createdBy) user = cView.gUsers[post.createdBy];
		nodePost.homed = false;
		nodePost.rawData = post;
		nodePost.id = post.id;
		nodePost.isPrivate = false;

		//var cpost = matrix.decrypt(post.body);
		var cpost = {};
		cpost.error = "0";

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
			postNBody.cNodes["post-cont"].innerHTML =  cView.autolinker.link(post.body.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
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
	,"genTitle":function(nodePost){
		var cView = this.cView;
		var post = nodePost.rawData;
		var user = cView.gUsers[post.createdBy];
		var title = user.link;
		//if(nodePost.isPrivate) title += "<span> posted a secret to "+StringView.makeFromBase64(matrix.gSymKeys[cpost.payload.feed].name)+"</span>";
		if(false);
		else if(post.postedTo){
			nodePost.gotLock  = true;
			post.postedTo.forEach(function(id){
				if (cView.gFeeds[id].isPrivate == "0")
					nodePost.gotLock = false;
			});
			if ((post.postedTo.length >1)||(cView.gFeeds[post.postedTo[0]].id!=user.id)){
				title += "<span> posted to: </span>";
				post.postedTo.forEach(function(id){
					title += cView.gFeeds[id].link;
				});
			}
		}
		return title;

	}
	,"embedPreview": function (oEmbedPrs, victim, target){
		var cView = this.cView;
		var oEmbedURL;
		var m;
		if((m = /^https:\/\/docs\.google\.com\/(document|spreadsheets|presentation|drawings)\/d\/([^\/]+)/.exec(victim)) !== null) {
			new Promise(function(resolve,reject){
				var oReq = new XMLHttpRequest();
				oReq.onload = function(){
					if(oReq.status < 400)
						resolve(JSON.parse(oReq.response));
					else reject(oReq.response);
				}

				oReq.open("get","https://www.googleapis.com/drive/v2/files/" + m[2] + "?key=AIzaSyA8TI6x9A8VdqKEGFSE42zSexn5HtUkaT8",true);
				oReq.send();
			}).then(function(info){
				//var nodeiFrame = cView.doc.createElement("iframe");
				//nodeiFrame.src = info.embedLink;
				var nodeA = cView.doc.createElement("a");
				var img = cView.doc.createElement("img");
				var width = cView.doc.getElementById("content").clientWidth*3/4;
				img.src = info.thumbnailLink.replace("=s220","=w"+ width+"-c-h"+ width/5 );// "=s"+cView.doc.getElementById("content").clientWidth/2+"-p");
				var node = cView.doc.createElement("div");
				node.className = "att-img";
				nodeA.appendChild(img);
				nodeA.href = victim;
				node.appendChild(nodeA);
				target.appendChild(node);
				img.onerror=function(){nodeA.hidden = true;};
			});
		return;	
		}else if (/^https?:\/\/(www\.)?pinterest.com\/pin\/.*/.exec(victim) !== null){
			var node = cView.doc.createElement("div");
			node.className = "att-img";
			node.innerHTML = '<a data-pin-do="embedPin" href="' + victim + '"></a>';
			target.appendChild(node);
			return;
		}
		var bIsOEmbed = oEmbedPrs.some(function(o){
			return o.endpoints.some(function(endp){
				if(!endp.schemes)console.log(endp.url)
				else if (endp.schemes.some(function (scheme){
					return victim.match(scheme) != null; })){
					oEmbedURL = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D'"
						+ encodeURIComponent(endp.url 
							+ "?url=" + victim 
							+ "&format=json"
							+ "&maxwidth="+cView.doc.getElementById("content").clientWidth*3/4
						)
						+ "'&format=json";
					return true;
				}else return false;
			});
		});

		if(bIsOEmbed){
			new Promise(function(resolve,reject){
				var oReq = new XMLHttpRequest();
				oReq.onload = function(){
					if(oReq.status < 400)
						resolve(JSON.parse(oReq.response));
					else reject(oReq.response);
				}

				oReq.open("get",oEmbedURL,true);
				oReq.send();
			}).then(function(qoEmbed){
				if (!qoEmbed.query.count) return;
				var oEmbed = qoEmbed.query.results.json;
				if(oEmbed.type == "photo"){
					target.appendChild(oEmbedImg(oEmbed.url,victim));
				}else if (typeof oEmbed.html !== "undefined"){
					if(oEmbed.html.indexOf("iframe") == 1){
						var node = cView.doc.createElement("div");
						node.innerHTML = oEmbed.html;
						target.appendChild(node);
					}else if(typeof oEmbed.thumbnail_url !== "undefined"){
						target.appendChild(oEmbedImg(oEmbed.thumbnail_url,victim));
					}else{
						var iframe = cView.doc.createElement("iframe");	
						iframe.sandbox = true;
						iframe.srcdoc = oEmbed.html;
						iframe.style.width = oEmbed.width;
						iframe.style.height = oEmbed.height;
						target.appendChild(iframe);
					}
				}
			},doEmbedly );
		}else doEmbedly();
		function oEmbedImg(url,victim){
			if(!url.match(/^['"]?https?/)) return cView.doc.createElement("img");
			var img = cView.doc.createElement("img");
			img.src = url;
			//img.style.width = oEmbed.width;
			//img.style.height = oEmbed.height;
			var node = cView.doc.createElement("a");
			node.appendChild(img);
			return node;	
		}
		function doEmbedly(){
			var aEmbed = cView.doc.createElement("a");
			aEmbed.href = victim;
			aEmbed.className = "embedly-card";
			target.appendChild(aEmbed);
		}
	}
	,"genEditNode":function(post,cancel){
		var cView = this.cView;
		var nodeEdit = cView.gNodes["edit"].cloneAll();
		nodeEdit.cNodes["edit-buttons"].cNodes["edit-buttons-post"].addEventListener("click",post);
		nodeEdit.cNodes["edit-buttons"].cNodes["edit-buttons-cancel"].addEventListener("click",cancel);
		cView.cTxt = nodeEdit.cNodes["edit-txt-area"];
		return nodeEdit;
	}
	,"genComment":function(comment){
		var cView = this.cView;
		var nodeComment = cView.gNodes["comment"].cloneAll();
		var cUser = cView.gUsers[comment.createdBy];
		var nodeSpan = cView.doc.createElement("span");
		nodeComment.userid = null;
		function gotUser(){
			nodeComment.userid = cUser.id;
			nodeSpan.innerHTML += " - " + cUser.link ;
			if(typeof cView.gMe !== "undefined"){
				if(cUser.id == cView.gMe.users.id)
					nodeComment.cNodes["comment-body"].appendChild(cView.gNodes["comment-controls"].cloneAll());
				else if(!cUser.friend) nodeComment.cNodes["comment-date"].cNodes["date"].style.color = "#787878";
			}
			if(( typeof cView["blockComments"]!== "undefined") && ( cView["blockComments"]!= null) && (cView["blockComments"][cUser.id]))
				nodeComment.innerHTML = "---";

		}
		function spam(){nodeComment = cView.doc.createElement("span");};
		nodeComment.cNodes["comment-body"].appendChild(nodeSpan);
		nodeSpan.innerHTML = cView.autolinker.link(comment.body.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
		nodeComment.id = comment.id;
		nodeComment.createdAt = comment.createdAt;
		if(typeof cUser !== "undefined"){
			gotUser();
		}else if(comment.user) {
			if (cView.gUsers.byName[comment.user]) {
				cUser = cView.gUsers.byName[comment.user];
				gotUser();
			}
			else if(cView.gUsersQ[comment.user]) cView.gUsersQ[comment.user].then(gotUser,spam);
			else{
				cView.gUsersQ[comment.user] = new Promise (function(resolve,reject){

					var oReq = new XMLHttpRequest();
					oReq.onload = function(){
						if(this.status < 400){
							var oRes = JSON.parse(oReq.response);
							cView.Utils.addUser(oRes.users);
							cUser = cView.gUsers.byName[comment.user];
							resolve();
						}
					};
					oReq.open("get",gConfig.serverURL + "users/"+comment.username, true);
					oReq.setRequestHeader("X-Authentication-Token", cView.token);
					oReq.send();
				}).then(gotUser,spam);
			}
		}
		return nodeComment;
	}
	,"addLastCmtButton":function(postNBody){
		var cView = this.cView;
		if (postNBody.lastCmtButton == true)return;
		var aAddComment = cView.doc.createElement("a");
		var aIcon = cView.doc.createElement("a");
		aAddComment.className = "post-control-comment";
		aIcon.className = "fa-stack fa-1x";
		aIcon.innerHTML = '<i class="fa fa-comment-o fa-stack-1x"></i>'
		+'<i class="fa fa-square fa-inverse fa-stack-1x" style="left: 3px; top: 3px; font-size: 60%"></i>'
		+'<i class="fa fa-plus fa-stack-1x" style="left: 3px; top: 3px; font-size: 60%"></i>';
		aAddComment.innerHTML  = "Add comment";
		aAddComment.addEventListener("click",cView["Actions"]["addComment"]);
		postNBody.appendChild(aIcon);
		postNBody.appendChild(aAddComment );
		postNBody.lastCmtButton = true;
	}
	,"genDirectTo":function(victim){
		var cView = this.cView;
		var nodeDirectTo = cView.gNodes["new-direct-to"].cloneAll();
		victim.replaceChild(nodeDirectTo, victim.cNodes["new-post-to"]);
		victim.cNodes["new-post-to"] = nodeDirectTo;
		nodeDirectTo.feeds = new Array();
		victim.cNodes["edit-buttons"].cNodes["edit-buttons-post"].removeEventListener("click", cView["Actions"]["newPost"]);
		victim.cNodes["edit-buttons"].cNodes["edit-buttons-post"].addEventListener("click", cView["Actions"]["postDirect"]);
		victim.cNodes["edit-buttons"].cNodes["edit-buttons-post"].disabled = true;
		if(cView.doc.location.hash && (cView.doc.location.hash != "")){
			victim.cNodes["edit-buttons"].cNodes["edit-buttons-post"].disabled = false;
			nodeDirectTo.cNodes["new-direct-input"].value = cView.doc.location.hash.slice(1);
		}
		var oDest = new Object();
		if ((typeof cView.gMe.users.subscribers !== "undefined") && (typeof cView.gMe.users.subscriptions !== "undefined")){
			for (var username in cView.gUsers.byName){
				if (!cView.gUsers.byName[username].friend || !(cView.gUsers.byName[username].subscriber || (cView.gUsers.byName[username].type == "group")))
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
		cView.regenPostTo = function (){return cView.Drawer.genDirectTo(victim);};
	}
	,"genPostTo":function(victim){
		var cView = this.cView;
		var nodePostTo = cView.gNodes["new-post-to"].cloneAll();
		victim.replaceChild(nodePostTo, victim.cNodes["new-post-to"]);
		victim.cNodes["new-post-to"] = nodePostTo;
		nodePostTo.feeds = new Array();
		nodePostTo.feeds.push(cView.gMe.users.username);
		nodePostTo.parentNode.isPrivate  = false;
		nodePostTo.cNodes["new-post-feeds"].firstChild.idx = 1;
		nodePostTo.cNodes["new-post-feeds"].firstChild.oValue = cView.gMe.users.username;
		var option = cView.doc.createElement("option");
		option.selected = true;
		var select = cView.doc.createElement("select");
		select.className = "new-post-feed-select";
		select.hidden = nodePostTo.cNodes["new-post-feed-select"].hidden;
		select.addEventListener("change",cView["Actions"]["newPostSelect"]);
		nodePostTo.replaceChild(select, nodePostTo.cNodes["new-post-feed-select"]);
		nodePostTo.cNodes["new-post-feed-select"] = select;
		nodePostTo.cNodes["new-post-feed-select"].appendChild(option);
		option = cView.doc.createElement("option");
		option.disabled = true;
		option.innerHTML = "My feed";
		option.value = cView.gMe.users.username;
		nodePostTo.cNodes["new-post-feed-select"].appendChild(option);
		var groups = cView.doc.createElement("optgroup");
		groups.label = "Public groups";
		if (typeof cView.gMe.users.subscriptions !== "undefined"){
			var oSubscriptions = new Object();
			cView.gMe.subscriptions.forEach(function(sub){if (sub.name == "Posts")oSubscriptions[sub.id] = sub; });
			cView.gMe.users.subscriptions.forEach(function(subid){
				if (typeof oSubscriptions[subid] === "undefined") return;
				var sub = cView.gUsers[oSubscriptions[subid].user];
				if((typeof sub !=="undefined") && (sub.type == "group")){
					option = cView.doc.createElement("option");
					option.value = sub.username;
					option.innerHTML = sub.screenName;
					groups.appendChild(option);
				}
			});

		};
		if (groups.childNodes.length > 0 )
			nodePostTo.cNodes["new-post-feed-select"].appendChild(groups);
		groups = cView.doc.createElement("optgroup");
		/*
		groups.label = "Private groups";
		for (var id in matrix.gSymKeys){
			option = cView.doc.createElement("option");
			option.value = id;
			option.privateFeed = true;
			option.innerHTML = StringView.makeFromBase64(matrix.gSymKeys[id].name);
			groups.appendChild(option);
		}
		*/
		if (groups.childNodes.length > 0 )
			nodePostTo.cNodes["new-post-feed-select"].appendChild(groups);

		cView.regenPostTo = function (){return cView.Drawer.genPostTo(victim);};

	}
};
return _Drawer;
});
