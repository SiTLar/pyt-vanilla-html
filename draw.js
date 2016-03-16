"use strict";

define("./draw", [],function(){

function _Drawer(v){
	this.cView = v;
}
_Drawer.prototype = {
	constructor: _Drawer
	,"writeAllLikes":function(id,nodeLikes){
		var cView = this.cView;
		var post = cView.doc.getElementById(id).rawData;
		var context = cView.contexts[post.domain];
		nodeLikes.innerHTML = "";
		var nodeLike = cView.doc.createElement("span");
		nodeLike.className = "p-timeline-user-like";
		for(var like = 0; like < post.likes.length; like++){
			var nodeCLike = nodeLike.cloneNode();
			nodeCLike.innerHTML = context.gUsers[post.likes[like]].link;
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
		var context = cView.contexts[post.domain];
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
		if(cView.ids){
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
			nodeCLike.innerHTML = context.gUsers[like].link;
			nodeLikes.appendChild(nodeCLike);
		});
		var suffix = cView.gNodes["likes-suffix"].cloneAll();

		if (post.omittedLikes){
			suffix.cNodes["likes-omitted"].hidden = false;
			suffix.getElementsByTagName("a")[0].innerHTML = post.omittedLikes + " other people "
		}
		suffix.className = "nocomma";
		postNBody.cNodes["post-info"].cNodes["likes"].appendChild(nodeLikes);
		postNBody.cNodes["post-info"].cNodes["likes"].cNodes = new Object();
		postNBody.cNodes["post-info"].cNodes["likes"].cNodes["comma"] = nodeLikes;
		postNBody.cNodes["post-info"].cNodes["likes"].appendChild(suffix);
		//postNBody.cNodes["post-info"].cNodes["likes"].appendChild(suffix);
		nodeLikes.className = "comma";
		if(context.ids){
			if(post.likes[0] == context.gMe.users.id){
				postNBody.cNodes["post-info"].myLike = nodeLikes.childNodes[0];
				if( postNBody.cNodes["post-info"].nodeLike) {
					postNBody.cNodes["post-info"].nodeLike.innerHTML = "Un-like";
					postNBody.cNodes["post-info"].nodeLike.action = false;

				}

			}
		}
	}
	,"genUserDetails":function(username, context){
		var cView = this.cView;
		var user = context.gUsers.byName[username];
		var nodeUD = cView.gNodes["user-detailes"].cloneAll();
		var nodeInfo = nodeUD.cNodes["ud-info"];
		nodeInfo.cNodes["ud-username"].value = user.username;
		nodeInfo.getNode(["c","ud-avatar"],["c","ud-avatar-img"]).src = user.profilePictureMediumUrl;
		nodeInfo.getNode(["c","ud-text"],["c","ud-title"]).innerHTML = user.screenName;
		if(typeof user.description !== "undefined")
			nodeInfo.getNode(["c","ud-text"],["c","ud-desc"]).innerHTML = cView.autolinker.link(user.description.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
		if(typeof user.statistics !== "undefined"){
			var stats = {
				"uds-subs":user.statistics.subscriptions
				,"uds-subsc":user.statistics.subscribers > 0? user.statistics.subscribers:""
				,"uds-likes":user.statistics.likes
				,"uds-com":user.statistics.comments
			}
			Object.keys(stats).forEach(function(key){
				nodeInfo.getNode(["c","ud-stats"],["c",key],["c","val"]).innerHTML = stats[key];
			});
			if (user.type == "group") 
				["uds-subs","uds-likes","uds-com"].forEach(function(key){
				nodeInfo.getNode(["c","ud-stats"],["c",key]).style.display = "none";
			});
		}
		return nodeUD;
		
	}
	,"genProfile": function(user){
		var cView = document.cView;
		var nodeProfile = cView.gNodes["settings-profile"].cloneAll();
		nodeProfile.getElementsByClassName("sp-username")[0].innerHTML = "@" + user.username;
		nodeProfile.cNodes["chng-avatar"].cNodes["sp-avatar-img"].src = user.profilePictureMediumUrl; 
		if (typeof user.description !== "undefined")
			nodeProfile.cNodes["gs-descr"].value = user.description;
		var nodes = nodeProfile.getElementsByTagName("input");
		for(var idx = 0; idx < nodes.length; idx++){
			var node = nodes[idx];
			switch(node.name){
			case "id": 
				node.value = user.id;
				break;
			case "is-main":
				node.checked = (cView.mainId == user.id);
				break;
			case "email": 
				if(typeof user.email !== "undefined" )
					node.value =  user.email;
				break;
			case "screen-name": 
				node.value = user.screenName;
				break;
			case "is-private":
				node.checked = JSON.parse(user.isPrivate);
				break;
			}
		};
		return nodeProfile;
	}
	,"drawSettings":function(){
		var cView = document.cView;
		var body = cView.doc.getElementById("container");
		//var body = cView.Drawer.makeContainer();
		var nodeSettingsHead = cView.gNodes["settings-head"].cloneAll();
		body.appendChild(nodeSettingsHead);
		switch(cView.doc.location.pathname.split("/").pop()){
		case "accounts":
			drawAcc();
			break;
		case "display":
		default:
			drawDisp();
		}
		cView.Common.setIcon("favicon.ico");
		function drawAcc(){
			nodeSettingsHead.cNodes["sh-acc"].className = "sh-selected";
			var nodeSettings = cView.gNodes["accaunts-settings"].cloneAll();
			nodeSettings.className += " global-settings";
			body.appendChild(nodeSettings);
			cView.ids.forEach(function(id){
				nodeSettings
				.cNodes["settings-profiles"]
				.appendChild(cView.Drawer.genProfile(cView.logins[id].data.users));
			});
		}
		function drawDisp(){
			nodeSettingsHead.cNodes["sh-displ"].className = "sh-selected";
			var nodeSettings = cView.gNodes["display-settings"].cloneAll();
			nodeSettings.className += " global-settings";
			body.appendChild(nodeSettings);
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
		}

	}
	,"drawTimeline":function(posts,contexts){
		var cView = this.cView;
		var Drawer = cView.Drawer;
		var view = cView.timeline.split("/")[0];
		var filter = cView.timeline.split("/")[1];
		var body = cView.doc.getElementById("container");
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
		htmlForward = htmlPrefix + "?offset="
		+ forward*1 + "&limit="+gConfig.offset*1
		+'">Older entries<span style="font-size: 120%">&rarr;</span></a>';
		if (htmlBackward) nodeMore.innerHTML += '<span class="spacer">&mdash;</span>'
		nodeMore.innerHTML +=  htmlForward;
		body.appendChild(nodeMore.cloneNode(true));
		cView.doc.posts = cView.doc.createElement("div");
		cView.doc.posts.className = "posts";
		cView.doc.posts.id = "posts";
		body.appendChild(cView.doc.posts);
		cView.doc.hiddenPosts = new Array();
		cView.doc.hiddenCount = 0;
		var idx = 0;
		posts.forEach(function(post){
			post.idx = idx++;
			if(post.isHidden){
				cView.doc.hiddenCount++;
			}else{
				post.isHidden = false;
				cView.doc.posts.appendChild(Drawer.genPost(post));
			}
			cView.doc.hiddenPosts.push({"is":post.isHidden,"data":post});
		});
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
	
	} 
	,"drawPost": function(content,context) {
		var cView = this.cView;
		var singlePost = cView.Drawer.genPost(content);
		body.appendChild(singlePost);
		var nodesHide = singlePost.getElementsByClassName("hide");
		singlePost.hidden = false;
		if (nodesHide.length)nodesHide[0].hidden = true;
		cView.doc.title = "@" 
			+ context.gUsers[singlePost.rawData.createdBy].username + ": "
			+ singlePost.rawData.body.slice(0,20).trim()
			+ (singlePost.rawData.body.length > 20?"\u2026":"" )
			+ " ("+ context.domain  +")";
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
		if(content.timelines) context.rtSub = {"timeline":[content.timelines.id]};
		else context.rtSub = {"post":[content.posts.id]};
		*/
	
	,"drawRequests":function(){
		var cView = document.cView;
		var count = context.ids.length;
		Object.keys(cView.contexts).forEach( function (domain){
			var context = cView.contexts[domain];
			context.ids.forEach(function(id){
				context.getWhoami(id, all(completeRequests));
			
			});
		});
		function all(cb){
			if (--count)return;
			cb();
		}
		function completeRequests(){
			var body = cView.Drawer.makeContainer();
			Object.keys(cView.contexts).forEach( function (domain){
				genRequests(cView.contexts[domian], body);
			});
		}

		function genRequests(context,body){
			var cView = context.cView;
			var count = 0;
			context.ids.forEach(function(id){
				var login = context.logins[id].data;
				if(!Array.isArray(login.requests))return;
				count++;
				var nodeH = cView.doc.createElement("h2");
				nodeH.innerHTML = "@"+login.users.username+" requests";
				body.appendChild(nodeH);
				login.requests.forEach( cView.Common.addUser, context);
				if(Array.isArray(login.users.subscriptionRequests)){
					body.cNodes["req-body-pend"].hidden = false;
					login.users.subscriptionRequests.forEach(function(req){
						body.cNodes["req-body-pend"].appendChild(genReqNode(context.gUsers[req], id));
					});
				}
				if(Array.isArray(login.users.pendingSubscriptionRequests)){
					body.cNodes["req-body-sent"].hidden = false;
					login.users.pendingSubscriptionRequests.forEach(function(req){
						var node = genReqNode(context.gUsers[req], id);
						node.cNodes["sr-ctrl"].hidden = true;
						body.cNodes["req-body-sent"].appendChild(node);
					});
				}


			
			});
			if (!count)body.getElementsByClassName("pagetitle")[0].innerHTML = "<h1>No requests</h1>";
			
			function genReqNode(user, loginid){
				var node = cView.gNodes["sub-request"].cloneAll();
				node.cNodes["sr-name"].innerHTML = "<a href="+gConfig.front+user.username+">"
					+user.screenName
					+"</a>"
					+" @" + user.username; 
				node.cNodes["sr-avatar"].src =  user.profilePictureMediumUrl ;
				node.cNodes["sr-user"].value = user.username;
				node.cNodes["sr-id"].value = loginid;
				return node;
			}

		}
	}
	,"drawFriends": function(content,context){
		var cView = context.cView;
		var out = cView.gNodes["subs-cont"].cloneAll();
		content.subscriptions.forEach(function(sub){
			var node = cView.gNodes["sub-item"].cloneAll();
			var a = node.cNodes["link"];
			if(sub.name != "Posts")return;
			var user = context.gUsers[sub.user];

			a.href = gConfig.front+ user.username;
			a.cNodes["usr-avatar"].src = user.profilePictureMediumUrl;
			a.cNodes["usr-title"].innerHTML = user.title;
			if(user.type == "user")out.cNodes["sc-users"].appendChild(node);
			else out.cNodes["sc-grps"].appendChild(node);
		});
		cView.doc.getElementById("container").appendChild(out);
	}
	,"drawSubs": function(content,context){
		var cView = context.cView;
		var out0 = cView.doc.createElement("div");
		var out = cView.doc.createElement("div");
		out0.appendChild(out);
		out0.className = "subs-cont";
		content.subscribers.forEach(function(sub){
			var node = cView.gNodes["sub-item"].cloneAll();
			var user = context.gUsers[sub.id];

			var a = node.cNodes["link"];
			a.href = gConfig.front+ user.username;
			a.cNodes["usr-avatar"].src = user.profilePictureMediumUrl;
			a.cNodes["usr-title"].innerHTML = user.title;
			out.appendChild(node);
		});
		cView.doc.getElementById("container").appendChild(out0);
	}
	,"genUserPopup": function(node, user){
		var cView = this.cView;
		var context = user.context;
		var nodePopup = cView.gNodes["user-popup"].cloneAll(true);
		cView.doc.getElementsByTagName("body")[0].appendChild(nodePopup);
		nodePopup.id = "userPopup" + user.userid;
		nodePopup.cNodes["up-avatar"].innerHTML = '<img src="'+ user.profilePictureMediumUrl+'" />';
		nodePopup.cNodes["up-info"].innerHTML  ="<span>@" + user.username + "</span><br>"+ user.link;
		if((typeof context.gMe !== "undefined") && (context.ids.indexOf(user.id) == -1))
			cView.Utils.setChild(nodePopup, "up-controls", cView.Drawer.genUpControls(user));
		if (typeof node.createdAt !== "undefined"){
			var spanDate = cView.doc.createElement("span");
			spanDate.className = "up-date";
			var txtdate = new Date(node.createdAt*1).toString();
			spanDate.innerHTML = txtdate.slice(0, txtdate.indexOf("(")).trim();
			nodePopup.appendChild(spanDate);
		}
		return nodePopup;
	}
	,"genUpControls":function(user){
		var cView = this.cView;
		var context = user.context;
		var controls = cView.gNodes["up-controls"].cloneAll();
		var subs = controls.cNodes["up-sbs"];
		controls.user = user.username;
		controls.domain = context.domain;
		var isMulti = context.ids.length > 1;
		context.ids.forEach(perLogin);
		return controls;

		function perLogin(id){
			var login = context.logins[id].data;
			var friend = (typeof login.oFriends[user.id] !== "undefined");
			var envelop =  cView.gNodes["up-c-mu"].cloneAll();
			envelop.loginId = id;
			if (isMulti) envelop.cNodes["uname"].innerHTML = "@"+login.users.username+": ";
			var nodeSub = envelop.cNodes["up-s"];
			nodeSub.innerHTML = friend?"Unsubscribe":"Subscribe";
			nodeSub.subscribed = friend;
			if (!friend && (user.isPrivate == 1 )){
				nodeSub.removeEventListener("click",cView["Actions"]["evtSubscribe"]);
				var oRequests = new Object();
				if (Array.isArray(login.requests)){
					login.requests.forEach(function(req){
						oRequests[req.id] = req;
					});
				}
				if(Array.isArray(login.users.pendingSubscriptionRequests)
				&&login.users.pendingSubscriptionRequests.some(function(a){
						return oRequests[a].username == user.username;
					})){
					nodeSub = cView.Utils.setChild(envelop, "up-s", cView.doc.createElement("span")); 
					nodeSub.innerHTML = "Subscription request sent";
				}else{
					nodeSub.innerHTML = "Request subscription";
					nodeSub.addEventListener("click", cView["Actions"]["reqSubscription"] );
				}
			}
			controls.cNodes["up-sbs"].getElementsByTagName("ul")[0].appendChild(envelop);
			if(friend 
			&& ((user.type == "group") 
				|| login.users.subscribers.some(function(sub){ return sub.id == user.id;}))){
				envelop.cNodes["up-d"].href = gConfig.front + "filter/direct#"+ user.username;
				envelop.cNodes["up-d"].target = "_blank";
			}else{
				envelop.cNodes["up-d"].hidden = true;
				envelop.cNodes["up-d"].previousSibling.hidden = true;
			}
			var aBan = envelop.cNodes["up-b"];
			if (user.type == "group"){
				aBan.hidden = true;
				envelop.cNodes["up-b"].previousSibling.hidden = true;
				return;
			}
			aBan.banned  = login.users.banIds.indexOf( user.id) != -1;
			if (aBan.banned){
				aBan.innerHTML = "Un-ban";
				aBan.removeEventListener("click",cView["Actions"]["genBlock"]);
				aBan.addEventListener("click", cView["Actions"]["doUnBan"]);
			}
		}

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
		var context = cView.contexts[post.domain];
		var Drawer = cView.Drawer;
		function gotUser(){
			var urlMatch ;		
			if(( typeof cView["blockPosts"]!== "undefined")&& (cView["blockPosts"] != null)&& (cView["blockPosts"][context.domain + user.id])){
				nodePost.hidden = true  ;
			}
			nodePost.gotLock  = false;
			if(typeof user !== "undefined"){
				nodePost.cNodes["avatar"].cNodes["avatar-h"].innerHTML = '<img src="'+ user.profilePictureMediumUrl+'" />';
				nodePost.cNodes["avatar"].cNodes["avatar-h"].userid = user.id;
				postNBody.cNodes["title"].innerHTML = Drawer.genTitle(nodePost);
			}
			if(nodePost.gotLock)
				postNBody.getNode(["c","post-info"],["c","post-controls"],["c","post-lock"]).innerHTML = "<i class='fa fa-lock icon'>&nbsp;</i>";
			if(nodePost.direct)
				postNBody.getNode(["c","post-info"],["c","post-controls"],["c","post-lock"]).innerHTML += "<i class='fa fa fa-envelope icon'>&nbsp;</i>";

			if(post.attachments){
				var attsNode = postNBody.cNodes["attachments"];
				post.attachments.forEach(function(att){
					var nodeAtt = cView.doc.createElement("div");
					var oAtt = context.gAttachments[att];
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
			if(typeof user !== "undefined") anchorDate.href = [gConfig.front + "as",  context.domain, user.username , post.id].join("/");
			postNBody.cNodes["post-info"].cNodes["post-controls"].cNodes["post-date"].appendChild(anchorDate);
			anchorDate.date = JSON.parse(post.createdAt);
			window.setTimeout(Drawer.updateDate, 10,anchorDate, cView);

			if((typeof post.commentsDisabled !== "undefined")
			&& (post.commentsDisabled == "1")){
				postNBody.getNode(["c","post-info"],["c","post-controls"],["c","cmts-lock-msg"]).hidden = false;
			} else post.commentsDisabled = "0";
			if(context.ids){
				var nodeControls;
				if (context.ids.indexOf(post.createdBy) != -1){
					nodeControls = cView.gNodes["controls-self"].cloneAll();
				}else {
					nodeControls = cView.gNodes["controls-others"].cloneAll();
					postNBody.cNodes["post-info"].nodeLike = nodeControls.cNodes["post-control-like"];
					nodeControls.cNodes["post-control-like"].action = true;
					if(post.commentsDisabled == "1"){
						var nodeCmtControl = nodeControls.getElementsByClassName("post-control-comment")[0];
						nodeCmtControl.style.display = "none";
						nodeCmtControl.nextSibling.style.display = "none";
					}
				}
				nodeControls.className = "controls";
				var aHide = nodeControls.cNodes["hide"];
				//aHide.className = "hide";
				aHide.innerHTML = post.isHidden?"Un-hide":"Hide";
				aHide.action = !post.isHidden;
				postNBody.cNodes["post-info"].cNodes["post-controls"].appendChild( nodeControls);
				postNBody.cNodes["post-info"].cNodes["post-controls"].cNodes["controls"] = nodeControls;
				//postNBody.cNodes["post-info"].cNodes["post-controls"].nodeHide = aHide;
			}
			if (post.likes)	Drawer.genLikes(nodePost );
			if (post.comments){
				if(post.omittedComments){
					if(post.comments[0])
						postNBody.cNodes["comments"].appendChild(Drawer.genComment.call(context, context.gComments[post.comments[0]]));
					var nodeComment = cView.gNodes["comment"].cloneAll();
					nodeComment.cNodes["comment-date"].innerHTML = "";
					var nodeLoad = cView.gNodes["comments-load"].cloneAll();
					nodeLoad.cNodes["num"].innerHTML = post.omittedComments;
					nodeComment.cNodes["comment-body"].appendChild(nodeLoad);
					postNBody.cNodes["comments"].appendChild(nodeComment);
					if(post.comments[1])
						postNBody.cNodes["comments"].appendChild(Drawer.genComment.call(context, context.gComments[post.comments[1]]));
				}
				else post.comments.forEach(function(commentId){ 
					postNBody.cNodes["comments"]
					.appendChild(Drawer.genComment.call(context, context.gComments[commentId]))
				});
			}
			postNBody.cNodes["comments"].cnt = postNBody.cNodes["comments"].childNodes.length;
			if (postNBody.cNodes["comments"].cnt > 4)
					Drawer.addLastCmtButton(postNBody);
		}
		var nodePost = cView.gNodes["post"].cloneAll();
		var postNBody = nodePost.cNodes["post-body"];

		var user = undefined;
		if(post.createdBy) user = context.gUsers[post.createdBy];
		nodePost.homed = false;
		nodePost.rawData = post;
		nodePost.id = context.domain + "-post-" + post.id;
		nodePost.isPrivate = false;
		nodePost.commentsModerated = false;
		postNBody.cNodes["post-cont"].innerHTML =  cView.autolinker.link(post.body.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
			gotUser();
		return nodePost;

	}
	,"genTitle":function(nodePost){
		var cView = this.cView;
		var context = cView.contexts[nodePost.rawData.domain];
		var post = nodePost.rawData;
		var user = context.gUsers[post.createdBy];
		var title = user.link;
		//if(nodePost.isPrivate) title += "<span> posted a secret to "+StringView.makeFromBase64(matrix.gSymKeys[cpost.payload.feed].name)+"</span>";
		if(false);
		else if(post.postedTo){
			nodePost.gotLock  = true;
			post.postedTo.forEach(function(id){
				if (context.gFeeds[id].user.isPrivate == "0")
					nodePost.gotLock = false;
				 nodePost.direct = context.gFeeds[id].direct;
			});
			if ((post.postedTo.length >1)||(context.gFeeds[post.postedTo[0]].user.id!=user.id)){
				title += "<span> posted to: </span>";
				post.postedTo.forEach(function(id){
					title += context.gFeeds[id].user.link;
				});
			}
		}
		return title;

	}
	,"embedPreview": function (oEmbedPrs, victim, target){
		var cView = this.cView;
		var oEmbedURL;
		var m;
		if((m = /^https:\/\/(?:docs\.google\.com\/(?:document|spreadsheets|presentation|drawings)|drive\.google\.com\/file)\/d\/([^\/]+)/.exec(victim)) !== null) {
			new Promise(function(resolve,reject){
				var oReq = new XMLHttpRequest();
				oReq.onload = function(){
					if(oReq.status < 400)
						resolve(JSON.parse(oReq.response));
					else reject(oReq.response);
				}

				oReq.open("get","https://www.googleapis.com/drive/v2/files/" + m[1] + "?key=AIzaSyA8TI6x9A8VdqKEGFSE42zSexn5HtUkaT8",true);
				oReq.send();
			}).then(function(info){
				//var nodeiFrame = cView.doc.createElement("iframe");
				//nodeiFrame.src = info.embedLink;
				var nodeA = cView.doc.createElement("a");
				var img = cView.doc.createElement("img");
				var width = cView.doc.getElementById("container").clientWidth*3/4;
				img.src = info.thumbnailLink.replace("=s220","=w"+ width+"-c-h"+ width/5 );// "=s"+cView.doc.getElementById("container").clientWidth/2+"-p");
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
							+ "&maxwidth="+cView.doc.getElementById("container").clientWidth*3/4
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
		var context = this;
		var nodeComment = cView.gNodes["comment"].cloneAll();
		var cUser = context.gUsers[comment.createdBy];
		var nodeSpan = nodeComment.getNode(["c","comment-body"],["c","cmt-content"]);
		nodeComment.userid = null;
		nodeSpan.innerHTML = cView.autolinker.link(comment.body.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
		nodeComment.id = context.domain + "-cmt-" + comment.id;
		nodeComment.domain = context.domain;
		nodeComment.createdAt = comment.createdAt;
		nodeComment.userid = cUser.id;
		nodeSpan.innerHTML += " - " + cUser.link ;
		if(context.ids){
			if(context.ids.indexOf(cUser.id) != -1)
				cView.Utils.setChild(nodeComment.cNodes["comment-body"],"comment-controls",cView.gNodes["comment-controls"].cloneAll());
			else if(!cUser.friend) nodeComment.cNodes["comment-date"].cNodes["date"].style.color = "#787878";
		}
		if(( typeof cView["blockComments"]!== "undefined") 
		&& ( cView["blockComments"]!= null) 
		&& (cView["blockComments"][context.domain + cUser.id]))
			nodeComment.innerHTML = "---";
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
	,"genDirectTo":function(victim, login){
		var cView = this.cView;
		var context = cView.contexts[login.domain];
		var nodeDirectTo = cView.gNodes["new-direct-to"].cloneAll();
		nodeDirectTo.userid = login.users.id;
		if(context.ids.length > 1 ){
			nodeDirectTo.cNodes["mu-login"].innerHTML = login.users.link;
			nodeDirectTo.cNodes["mu-login"].hidden = false;
			victim.cNodes["add-sender"].hidden = false;
			if (typeof victim.cNodes["add-sender"].ids === "undefined")
				victim.cNodes["add-sender"].ids = [context.gMe.users.id];
		}
		victim.cNodes["post-to"].appendChild(nodeDirectTo);
		nodeDirectTo.className = "new-post-to";
		nodeDirectTo.feeds = new Array();
		victim.cNodes["edit-buttons"].cNodes["edit-buttons-post"].removeEventListener("click", cView["Actions"]["newPost"]);
		victim.cNodes["edit-buttons"].cNodes["edit-buttons-post"].addEventListener("click", cView["Actions"]["postDirect"]);
		victim.cNodes["edit-buttons"].cNodes["edit-buttons-post"].disabled = true;
		if(cView.doc.location.hash && (cView.doc.location.hash != "")){
			victim.cNodes["edit-buttons"].cNodes["edit-buttons-post"].disabled = false;
			nodeDirectTo.cNodes["new-direct-input"].value = cView.doc.location.hash.slice(1);
		}
		var oDest = new Object();
		if ((typeof login.users.subscribers !== "undefined") && (typeof login.users.subscriptions !== "undefined")){
			for (var username in context.gUsers.byName){
				var userid = context.gUsers.byName[username].id;
				if (!login.oFriends[userid] 
					|| !(login.users.subscribers.some(function(sub){return sub.id == userid;}) 
						|| (context.gUsers.byName[username].type == "group")
					)
				)
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
		cView.updPostTo = function (login,clean){
			if(clean == true) {
				document.getElementsByClassName("add-sender")[0].ids = new Array();
				var victims = document.getElementsByClassName("new-post-to");
				while(victims.length)victims[0].parentNode.removeChild(victims[0]);
			}
			return cView.Drawer.genDirectTo(victim, login);
		};
		var rmSenders = victim.getElementsByClassName("rm-sender");
		if(rmSenders.length > 1)
			for (idx = 0; idx < rmSenders.length; idx++)rmSenders[idx].hidden = false;
		victim.getNode(["c","edit-buttons"],["c","edit-buttons-post"]).disabled = false;
	}
	,"genPostTo":function(victim, init, login){
		var cView = this.cView;
		var context = cView.contexts[login.domain];
		var nodePostTo = cView.gNodes["new-post-to"].cloneAll();
		var idx = 1;
		if(context.ids.length > 1 ){
			nodePostTo.cNodes["mu-login"].innerHTML = login.users.link;
			nodePostTo.cNodes["mu-login"].hidden = false;
			victim.cNodes["add-sender"].hidden = false;
			if (typeof victim.cNodes["add-sender"].ids === "undefined")
				victim.cNodes["add-sender"].ids = [context.gMe.users.id];
		}
		victim.cNodes["post-to"].appendChild(nodePostTo);
		nodePostTo.feeds = new Array();
		nodePostTo.parentNode.isPrivate  = false;
		var select = cView.doc.createElement("select");
		select.className = "new-post-feed-select";
		select.hidden = nodePostTo.cNodes["new-post-feed-select"].hidden;
		select.addEventListener("change",cView["Actions"]["newPostSelect"]);
		nodePostTo.replaceChild(select, nodePostTo.cNodes["new-post-feed-select"]);
		nodePostTo.cNodes["new-post-feed-select"] = select;
		var option = cView.doc.createElement("option");
		option.selected = true;
		nodePostTo.cNodes["new-post-feed-select"].appendChild(option);
		var option = cView.doc.createElement("option");
		option.innerHTML = "My feed";
		option.value = login.users.username;
		chkInit(init, option, idx);
		nodePostTo.cNodes["new-post-feed-select"].appendChild(option);
		var groups = cView.doc.createElement("optgroup");
		groups.label = "Public groups";
		if (typeof login.users.subscriptions !== "undefined"){
			var oSubscriptions = new Object();
			login.subscriptions.forEach(function(sub){if (sub.name == "Posts")oSubscriptions[sub.id] = sub; });
			login.users.subscriptions.forEach(function(subid){
				if (typeof oSubscriptions[subid] === "undefined") return;
				var sub = context.gUsers[oSubscriptions[subid].user];
				if((typeof sub !=="undefined") && (sub.type == "group")){
					idx++;
					option = cView.doc.createElement("option");
					option.value = sub.username;
					chkInit(init, option, idx);
					option.innerHTML = sub.screenName + "("+ sub.username + ")";
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

		cView.updPostTo = function (login,clean, init){
			if(clean == true) {
				document.getElementsByClassName("add-sender")[0].ids = new Array();
				var victims = document.getElementsByClassName("new-post-to");
				while(victims.length)victims[0].parentNode.removeChild(victims[0]);
			}
			return cView.Drawer.genPostTo(victim, init,login);
		};
		var rmSenders = victim.getElementsByClassName("rm-sender");
		if(rmSenders.length > 1)
			for (idx = 0; idx < rmSenders.length; idx++)rmSenders[idx].hidden = false;
		nodePostTo.userid = login.users.id;
		function chkInit(init, option, idx){
			if (init != option.value) return;
			option.disabled = true;
			nodePostTo.cNodes["new-post-feeds"].firstChild.idx = idx;
			nodePostTo.cNodes["new-post-feeds"].firstChild.oValue = init;
			if(init != login.users.username)
				nodePostTo.cNodes["new-post-feeds"].firstChild.innerHTML = "@" + init;
			nodePostTo.feeds.push(init);
		}
		victim.getNode(["c","edit-buttons"],["c","edit-buttons-post"]).disabled = false;

	}
	,"blockPosts":function(user, action){
		var cView = this.cView;	
		var nodesPosts = cView.doc.getElementsByClassName("post");
		for(var idx = 0; idx < nodesPosts.length; idx++){
			if((nodesPosts[idx].rawData.createdBy == user.id)
			&& (nodesPosts[idx].rawData.domain == user.domain))
				nodesPosts[idx].hidden = action;
		}
	}
	,"blockComments":function(user, action){
		var cView = this.cView;	
		var context = cView.contexts[user.domain];
		var nodesCmts = cView.doc.getElementsByClassName("comment");
		for(var idx = 0; idx < nodesCmts.length; idx++){
			if((nodesCmts[idx].userid == user.id)
			&& (nodesCmts[idx].domain == user.domain)) {
				if(action) nodesCmts[idx].innerHTML = "---";
				else{
					var id = nodesCmts[idx].id.slice((context.domain+"-cmt-").length)

					nodesCmts[idx].parentNode.replaceChild(
						cView.Drawer.genComment.call(context, 
						context.gComments[nodesCmts[idx].id]), nodesCmts[idx]
					);
				}
			}
		}
	}
	,"genMultiuser":function(ok, cancle){
		/* context not implemented
		var popup = cView.gNode["multiuser-dialog"].cloneAll();
		cView.cView.ids.forEach(function(id){
			var unit = cView.gNode["multiuser-unit"].cloneAll();
			unit.getElementsByTagName("span")[0].innerHTML = "@"+
				cView.logins[id].data.users.username;
			unit.getElementsByTagName("button")[0].addEventListener("click",ok);
			unit.getElementsByTagName("a")[0].addEventListener("click",cancle);
			unit.getElementsByTagName("input")[0].value = id;
			popup.cNodes["units"].appendChild(unit);
		});
		return popup; 
		*/
	}
	,"genAddSender":function(cb){
		var cView = this.cView;
		var popup = cView.gNodes["add-sender-dialog"].cloneAll();
		Object.keys(cView.contexts).forEach(function (domain){
			var context = cView.contexts[domain];
			var title = document.createElement("p"); 
			title.innerHTML = domain;
			popup.appendChild(title);
			context.ids.forEach(function(id){
				var login = cView.logins[id].data;
				var unit = cView.gNodes["add-sender-unit"].cloneAll();
				unit.getNode(["c","up-avatar"],["c","avatar-img"]).src = login.users.profilePictureMediumUrl;
				unit.getNode(["c","asu-info"],["c","username"]).innerHTML = "@" + login.users.username;
				unit.getNode(["c","asu-info"],["c","screen-name"]).innerHTML = login.users.screenName;
				unit.addEventListener("click", function(){cb(id)});
				popup.cNodes["units"].appendChild(unit);
			});
		});
		return popup;
	}
	,"genAddComment": function(context){
		var cView = context.cView;
		var nodeComment = cView.gNodes["comment"].cloneAll();
		nodeComment.cNodes["comment-body"].appendChild(cView.Drawer.genEditNode(cView.Actions.postNewComment,cView.Actions.cancelNewComment));
		if(context.ids.length > 1 ){
			nodeComment.getElementsByClassName("select-user")[0].hidden = false;
			var nodeSelectUsr = nodeComment.getElementsByClassName("select-user-ctrl")[0];
			context.ids.forEach(function(id){
				var option = document.createElement("option");
				option.innerHTML = "@"+context.logins[id].data.users.username;
				option.value = id;
				nodeSelectUsr.appendChild(option);
			});
		}
		nodeComment.userid = context.gMe.users.id;
		return nodeComment;
	}
	,"updateReqs":function(){
		var cView = this.cView;
		Object.keys(cView.contexts).forEach(function(domain){
			var context = cView.contexts[domain];
			var ids = context.ids;
			if(ids) cView.subReqsCount = ids.reduce(function(total, id){
				var profile = context.logins[id].data.users;
				if (Array.isArray(profile.subscriptionRequests))
					return total + profile.subscriptionRequests.length;
				else return total;
			},0); else cView.subReqsCount = 0;
			if (cView.subReqsCount){
				var nodeInfo = cView.doc.getElementById("sr-info");
				nodeInfo.cNodes["sr-info-a"].innerHTML = "You have "
				+ cView.subReqsCount
				+ " subscription requests to review.";
				nodeInfo.hidden = false;
			}
		});
	}
};
return _Drawer;
});


