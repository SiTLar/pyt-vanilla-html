"use strict";
define("SecretActions",[],function(){return{
	,"init": function(view){this.cView = view;}
	,"addPosts": function(drop, toAdd, offset){
		var url = matrix.cfg.srvurl + "posts?offset="+offset+"&limit="+(toAdd*matrix.cfg.mul);
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
	,"doPrivComments": function(drop){
		var limit = 100;
		var url = matrix.cfg.srvurl + "cmts?limit="+limit;
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
						var nodeComment = gNodes["comment"].cloneAll();
						nodeComment.id = nodePost.id+"-ufc";
						nodeComment.cNodes["comment-date"].innerHTML = "";
						nodeComment.cNodes["comment-body"].innerHTML = '<a onclick="unfoldPrivComm(\''+nodePost.id+'-ufc\')" style="font-style: italic;">'+(nodeComments.childNodes.length-3)*1 +" more comments</a>";
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
						if (typeof privPost === "undefined")break;
					}
				}
				tmp.forEach(function(post){document.posts.appendChild(post);});
			});
		}
		oReq.open("get",url,true);
		oReq.send();
	}
	,"unfoldPrivComm": function(id){
		var nodeComment = document.getElementById(id);
		for(var idx = 0; idx < nodeComment.parentNode.childNodes.length; idx++)
			nodeComment.parentNode.childNodes[idx].hidden = false;
		nodeComment.parentNode.removeChild(nodeComment);


	}
	,
	"sendEditedPrivateComment": function(textField, nodeComment, nodePost){
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(this.status < 400){
				var res = JSON.parse(this.response);
				var cpost = JSON.parse(matrix.decrypt(res.posts.body));
				var comment = {
					"body":cpost.payload.data,
					"createdAt":Date.parse(res.posts.createdAt),
					"user":cpost.payload.author,
					"feed":cpost.payload.id,
					"id":res.posts.id
				};
				cView.gComments[res.posts.id] = comment;
				var nodeNewComment = genComment(comment);
				nodeNewComment.sign = cpost.sign;

				nodeComment.parentNode.replaceChild(nodeNewComment,nodeComment);
			}
		};

		oReq.open("put",matrix.cfg.srvurl+"edit", true);
		oReq.setRequestHeader("Content-type","application/json");
		var post = new Object();
		var payload =  {
			"id":nodePost.feed,
			"type":"comment",
			"data":textField.value,
			"author":cView.gMe.users.username,
			"postid":nodePost.id
		};
		oReq.setRequestHeader("x-access-token", matrix.mkOwnToken(nodeComment.sign));
		oReq.setRequestHeader("x-content-id", nodeComment.id);
		oReq.setRequestHeader("x-content-type", "comment");
		matrix.sign(JSON.stringify(payload)).then(function(sign){
			var token = matrix.mkOwnToken(sign);
			if(!token) return console.log("Failed to make access token");
			oReq.setRequestHeader("x-content-token", token);
			post = matrix.encrypt(nodePost.feed,
				JSON.stringify({"payload":payload,"sign":sign}));
			oReq.send(JSON.stringify({"d":post}));
		},function(){console.log("Failed to sign")});
	}
	,"drawPrivateComment": function(post) {
		return new Promise(function(resolve,reject){
			var cpost = matrix.decrypt(post.body);
			if (typeof cpost.error !== "undefined")return;
			cpost = JSON.parse(cpost);
			if (typeof cpost.payload.author === "undefined" ) return spam();
			var nodeComment;
			matrix.verify(JSON.stringify(cpost.payload), cpost.sign, cpost.payload.author).then(ham,spam);
			function ham(){
				var nodePriv = gPrivTimeline.postsById[cpost.payload.postid];
				if(!nodePriv)return;
				var comment = {"body":cpost.payload.data,
						"createdAt":Date.parse(post.createdAt),
						"id":post.id,
						"user":cpost.payload.author
						};
				nodeComment = genComment(comment);
				nodeComment.hidden = true;
				nodeComment.sign = cpost.sign;
				cView.gComments[post.id] = comment;
				if(comment.createdAt > nodePriv.rawData.updatedAt) nodePriv.rawData.updatedAt = comment.createdAt;
				nodePriv.cNodes["post-body"].cNodes["comments"].insertBefore(nodeComment,nodePriv.cNodes["post-body"].cNodes["comments"].firstChild);
				resolve();
			}
			function spam(){reject()};
		});
	}
	,"sendPrivateComment": function( textField, nodeComment, nodePost){
		textField.disabled = true;
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(this.status < 400){
				textField.value = "";
				textField.disabled = false;
				textField.style.height  = "4em";
				var res = JSON.parse(this.response);
				var cpost = JSON.parse(matrix.decrypt(res.posts.body));
				var comment = {"body":cpost.payload.data,
						"createdAt":Date.parse(res.posts.createdAt),
						"user":cpost.payload.author,
						"id":res.posts.id
						};
				cView.gComments[comment.id] = comment;
				textField.parentNode.cNodes["edit-buttons"].cNodes["edit-buttons-post"].disabled = false;
				if( nodeComment.parentNode.childNodes.length > 4 ) addLastCmtButton(nodePost.cNodes["post-body"]);
				var nodeNewComment = genComment(comment);
				nodeNewComment.sign = cpost.sign;
				nodeComment.parentNode.replaceChild(nodeNewComment,nodeComment);
			}
		};

		oReq.open("post",matrix.cfg.srvurl+"post", true);
		oReq.setRequestHeader("Content-type","application/json");
		var post = new Object();
		var payload =  {
			"id":nodePost.feed,
			"type":"comment",
			"data":textField.value,
			"author":cView.gMe.users.username,
			"postid":nodePost.id
		};
		oReq.setRequestHeader("x-content-type", "comment");
		matrix.sign(JSON.stringify(payload)).then(function(sign){
			var token = matrix.mkOwnToken(sign);
			if(!token) return console.log("Failed to make access token");
			oReq.setRequestHeader("x-content-token", token);
			post = matrix.encrypt(nodePost.feed,
				JSON.stringify({"payload":payload,"sign":sign}));
			oReq.send(JSON.stringify({"d":post}));
		},function(){console.log("Failed to sign")});

	}
	,"sendComment": function(textField){
		var nodeComment =textField; do nodeComment = nodeComment.parentNode; while(nodeComment.className != "comment");
		var nodePost =nodeComment; do nodePost = nodePost.parentNode; while(nodePost.className != "post");
		nodePost.cNodes["post-body"].isBeenCommented = false;
		if(typeof nodePost.cNodes["post-body"].bumpLater !== "undefined")setTimeout(nodePost.cNodes["post-body"].bumpLater, 1000);
		if(nodePost.isPrivate){
			sendPrivateComment(textField, nodeComment, nodePost);
			return;
		}
		textField.parentNode.cNodes["edit-buttons"].cNodes["edit-buttons-post"].disabled = true;
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
				var comment = JSON.parse(this.response).comments;
				cView.gComments[comment.id] = comment;
				if( nodeComment.parentNode.childNodes.length > 4 ) addLastCmtButton(nodePost.cNodes["post-body"]);
				if(!document.getElementById(comment.id))nodeComment.parentNode.replaceChild(genComment(comment),nodeComment);
				else nodeComment.parentNode.removeChild(nodeComment);
			}
		};

		oReq.open("post",gConfig.serverURL + "comments", true);
		oReq.setRequestHeader("X-Authentication-Token", cView.token);
		oReq.setRequestHeader("Content-type","application/json");
		var postdata = new Object();
		postdata.comment = comment;
		oReq.send(JSON.stringify(postdata));
	}
	,"ctrlPriv": function(){
		if(typeof cView.gMe === "undefined") return;
		if (!matrix.ready){
			if( document.getElementsByClassName("priv-dlg-login")[0])return;
			document.body.appendChild(gNodes["priv-dlg-login"].cloneAll());
		}else{
			if( document.getElementsByClassName("private-control")[0])return;
			document.body.appendChild(gNodes["private-control"].cloneAll());
			loadPrivs();
		}
		/*
		var nodePCtrl = document.body.appendChild(gNodes["private-control"].cloneAll());
		if (!matrix.ready) return;
		nodePCtrl.cNodes["priv-login"].cNodes["priv-pass"].hidden = true;
		var bLogin = nodePCtrl.cNodes["priv-login"].cNodes["priv-pass-submit"];
		bLogin.innerHTML = "logout";
		bLogin.removeEventListener("click", ctrlPrivLogin);
		bLogin.addEventListener("click", ctrlPrivLogout);
		*/
	}
	,"ctrlPrivLogin": function(e){
		var inpPass = e.target.parentNode.cNodes["priv-pass"].cNodes["priv-pass-i"];
		if (inpPass.value == ""){
			alert("Must have a password");
			return;
		}
		matrix.username = cView.gMe.users.username;
		matrix.setPassword(inpPass.value);
		matrix.getUserPriv().then(
		function(){

			var nodeDlg =e.target; do nodeDlg = nodeDlg.parentNode; while(nodeDlg.className != "priv-dlg-login");
			nodeDlg.parentNode.removeChild(nodeDlg);
			document.body.appendChild(gNodes["private-control"].cloneAll());
			privRegenGrps();
			matrix.ready = 1;
			var drop = Math.floor(cView.cSkip/3);
			var toAdd = drop + Math.floor(gConfig.offset/3);
			if((!gPrivTimeline.done)&& (cView.timeline == "home")&& matrix.ready){
				gPrivTimeline.done = true;
				new Promise(function (){addPosts(drop,toAdd,0);});
			};
		}
		, function(wut){
			switch(wut){
			case -1:
				e.target.parentNode.parentNode.cNodes["priv-info"].innerHTML = "Incorrect password";
				break;
			case 404:
				ctrlPrivNewUser(e.target);
				break;
			default:
				e.target.parentNode.parentNode.cNodes["priv-info"].innerHTML = "Got error#"+wut+"<br/>Try again later";

			}
		});
	}
	,"ctrlPrivNewUser": function(nodeSubmit){
		var node = gNodes["priv-new-user"].cloneAll();
		node.cNodes["priv-pass-submit"].addEventListener("click",function(e){
			if (node.cNodes["priv-pass-i"].value != nodeSubmit.parentNode.cNodes["priv-pass"].cNodes["priv-pass-i"].value){
				alert("Passwords must match");
				return;
			}
			node.cNodes["priv-pass-submit"].disabled = true;
			matrix.register().then(
				function(){
					document.getElementsByTagName("body")[0].removeChild(node);
					nodeSubmit.dispatchEvent(new Event("click"));
				},
				function(){new Error("Failed to register on the key sever.");}
			);
		});
		node.cNodes["priv-pass-cancel"].addEventListener("click",function(){ document.getElementsByTagName("body")[0].removeChild(node);});
		document.getElementsByTagName("body")[0].appendChild(node);

	}
	,"ctrlPrivLogout": function(e){
		matrix.ready = 0;
		matrix.logout();
		gPrivTimeline.posts.forEach(function(post){post.parentNode.removeChild(post);});
		gPrivTimeline.posts = new Array();
		gPrivTimeline.done = false;
		document.body.removeChild( document.getElementsByClassName("private-control")[0]);
		privRegenGrps();
	}
	,"loadPrivs": function(){
		var nodePCtrl = document.getElementsByClassName("private-control")[0];
		nodePCtrl.login = true;
		var nodeGrps = nodePCtrl.cNodes["priv-groups"];
		if(typeof matrix.gSymKeys !== "undefined"){
			for(var id in matrix.gSymKeys){
				var nodeGrp = gNodes["priv-grp"].cloneAll(true);
				nodeGrp.cNodes["priv-grp-name"].innerHTML = StringView.makeFromBase64(matrix.gSymKeys[id].name);
				nodeGrp.id = id;
				nodeGrps.appendChild(nodeGrp);
			}
		}

	}
	,"ctrlPrivLeave": function(){
		var privGrps = document.getElementsByName("privGrp");
		var victim;
		for (var idx = 0; idx < privGrps.length; idx++){
			if (privGrps[idx].checked){
				victim = privGrps[idx].parentNode;
				break;
			}
		}
		if (typeof victim.id === "undefined") return;
		delete matrix.gSymKeys[victim.id];
		matrix.update();
		victim.parentNode.removeChild(victim);
		privRegenGrps();
	}
	,"privRegenGrps": function(){
		var nodePCtrl = document.getElementsByClassName("private-control")[0];
		if(nodePCtrl){
			var nodeGrps = document.createElement("div");
			nodeGrps.className = "priv-groups";
			nodePCtrl.replaceChild( nodeGrps, nodePCtrl.cNodes["priv-groups"]);
			nodePCtrl.cNodes["priv-groups"] = nodeGrps;
			loadPrivs();
		}
		gConfig.regenPostTo();

	}
	,"ctrlPrivShowInvite": function(){
		var privGrps = document.getElementsByName("privGrp");
		var id;
		for (var idx = 0; idx < privGrps.length; idx++){
			if (privGrps[idx].checked){
				if (typeof privGrps[idx].parentNode.id === "undefined") return;
				id = privGrps[idx].parentNode.id;
				break;
			}
		}
		var nodeDlg = document.body.appendChild(gNodes["priv-dlg-share"].cloneAll());
		nodeDlg.feedId = id;
		nodeDlg.cNodes["priv-share-feed"].innerHTML += StringView.makeFromBase64(matrix.gSymKeys[id].name);
	}
	,"privGrpActivateButton": function(e){
		var nodeDlg =e.target; do nodeDlg = nodeDlg.parentNode; while(nodeDlg.className != "private-control");
		var buttons = nodeDlg.cNodes["priv-groups-ctrl"].getElementsByTagName("button");
		for(var idx = 0; idx < buttons.length; idx++)
			buttons[idx].disabled = false;

	}
	,"privActivateButton": function(e){
		var state = false;
		if (e.target.value == "" ) state = true;
		var buttons = e.target.parentNode.getElementsByTagName("button");
		for(var idx = 0; idx < buttons.length; idx++)
			buttons[idx].disabled = state;

	}
	,"ctrlPrivShare": function(e){
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
	,"ctrlPrivJoin": function(e){
		matrix.readMsg(e.target.parentNode.cNodes["priv-key-input"].value).then(function(msg){
			var symKeys = new Object();
			symKeys = JSON.parse(msg);
			if(typeof symKeys.id === "undefined")return;
			if(typeof symKeys.aKeys === "undefined")return;
			matrix.addKeys(symKeys);
			privRegenGrps();
			e.target.parentNode.cNodes["priv-key-input"].value = "";
		});
	}
	,"ctrlPrivGen": function(e){
		var name = e.target.parentNode.cNodes["priv-c-name"].value;
		matrix.initPrivate(name).then( privRegenGrps);

	}
	,"ctrlPrivClose": function(e){
		var victim = e.target; while(victim.parentNode !=  document.body)victim = victim.parentNode;
		document.body.removeChild(victim);
	}
};});
