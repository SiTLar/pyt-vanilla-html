"use strict";
define( function(){
function _Common(view){
	this.cView = view;
};
_Common.prototype = {
	constructor:_Common
	,"setCookie": function(name, data){
		var cView = this.cView;
		//var hostname = window.location.hostname.split(".");
		//hostname.reverse();

		cView.doc.cookie = name
			+"="+data
			+";expires=" + new Date(Date.now()+3600000*24*365).toUTCString()
		//	+"; domain="+ hostname[1] + "." + hostname[0] 
			+"; path=/"
			+";secure";
	}
	,"getCookie": function(name){
		var cView = this.cView;
		var arrCookies = cView.doc.cookie.split(";");
		var res;
		arrCookies.some(function(c){
			var cookie = c.split("=");
			if(cookie[0].trim() == name ){
				res = decodeURIComponent(cookie[1]);
				return true;
			}
		});
		return res;
	}
	,"deleteCookie": function(name){
		var cView = this.cView;
		var hostname = window.location.hostname.split(".");
		hostname.reverse();
		var cookie = name
			+"=;expires=" + new Date(0).toUTCString()
			+"; domain="+ hostname[1] + "." + hostname[0]
			+"; path=/";
		cView.doc.cookie = cookie; 
		cookie = name
			+"=;expires=" + new Date(0).toUTCString()
			+"; path=/";
		cView.doc.cookie = cookie; 
	}
	,"addUser": function(user){
		var context = this;
		var cView = context.cView;
		user.context = context;
		if (typeof context.gUsers[user.id] !== "undefined" ){
			var localUser = context.gUsers[user.id];
			Object.keys(user).forEach(function(key){
				 localUser[key] = user[key];
			});
			return localUser;
		}
		var className = "not-my-link";
		if(typeof user.isPrivate !== "undefined")user.isPrivate = JSON.parse(user.isPrivate);
		if (cView.mode == null) cView.mode = "screen";
		switch(cView.mode){
		case "screen":
			user.title  = user.screenName;
			break;
		case "screen_u":
			if(user.screenName != user.username)
				user.title  = user.screenName + " <div class=username>(" + user.username + ")</div>";
			else user.title  = "<div class=username>"+user.username+"</div>";
			break;
		case "username":
			user.title  = "<div class=username>"+user.username+"</div>";
		}
		if(typeof context.logins[user.id] !== "undefined"){
			user.my = true;
			className = "my-link-"+context.domain+"-"+user.id;
		}else{
			user.my = false;
			className = "not-my-link";
		}
		user.link = '<a class="'+className+'" href="' + gConfig.front+ user.username+'">'
		+ user.title
		+"</a>";
		if(!user.profilePictureMediumUrl)user.profilePictureMediumUrl = gConfig.static+ "default-userpic-48.png";
		user.friend = false;
		user.subscriber = false;
		context.gUsers[user.id] = user;
		context.gUsers.byName[user.username] = user;
		return user;
	}
	,"genNodes": function (templates){
		var cView = this.cView;
		var nodes = new Array();
		//oTemplates = JSON.parse(templates);
		templates.forEach(function(template) {
			if (!template.t)template.t = "div";
			var node = cView.doc.createElement(template.t);
			node.cloneAll = function(){
				var newNode = this.cloneNode(true);
				genCNodes(newNode, this);
				return newNode;
			};
			if(template.c)node.className = template.c;
			if(template.children)
			cView.Common.genNodes(template.children).forEach(function(victim){
				node.appendChild(victim);
			});
			if(template.txt) node.innerHTML = template.txt;
			if(template.e) node.e = template.e;
			if(template.p) for( var p in template.p) node[p] =  template.p[p];
			nodes.push(node);
		} );
		return nodes;
		function genCNodes(node, proto){
			node.cNodes = new Object();
			node.getNode = function(){
				var args = cView.Utils.args2Arr.apply(this,arguments);
				args.unshift(node);
				return cView.Utils.getNode.apply(node, args);
			};
			for(var idx = 0; idx <  node.childNodes.length; idx++){
				genCNodes(node.childNodes[idx], proto.childNodes[idx]);
				node.cNodes[node.childNodes[idx].className] = node.childNodes[idx];
			}
			if (typeof proto.e  == "undefined"  ) return;
			Object.keys(proto.e).forEach(function(evt){
				var action = proto.e[evt];
				node.addEventListener(evt,cView[action[0]][action[1]]);
			});
		}
	}
	,"refreshLogin": function(id, context){
		var cView = context.cView;
		cView.common.saveLogins();
		if((typeof context.gUsers[id] !== "undefined") && Array.isArray(context.gUsers[id].subscriptionRequests))
			cView.subReqsCount -= context.gUsers[id].subscriptionRequests.length;
		delete context.gUsers[id];
		var user = context.logins[id].data.users;
		cView.Common.addUser.call(context, user);
		var links = cView.doc.getElementsByClassName("my-link-" + context.domain+ "-" + id);
		for(var idx = 0; idx< links.length; idx++)
			links[idx].outerHTML = user.link;
		var login = context.logins[id].data;
		login.oFriends = new Object();
		if ((typeof user.subscribers !== "undefined") 
		&& (typeof user.subscriptions !== "undefined")){
			oSubscriptions = new Object();
			login.subscribers.forEach(cView.Common.addUser,context);
			login.subscriptions.forEach(function(sub){
				if(sub.name == "Posts"){
					oSubscriptions[sub.id] = sub.user;
				}
			});
			user.subscribers.forEach(function(sub){
				cView.Common.addUser.call(context, sub);
				context.gUsers[sub.id].subscriber = true;
			});
			user.subscriptions.forEach(function(subid){
				var userid = oSubscriptions[subid];
				if (typeof userid !== "undefined") {
					if (typeof context.gUsers[userid] !== "undefined") {
						context.gUsers[userid].friend = true;
						login.oFriends[userid] = true;
					}
				}
			});
		}
		var nodeSR = cView.doc.getElementById("sr-info");
		if (!nodeSR)return;
		cView.Drawer.updateReqs();
		if(Array.isArray(user.subscriptionRequests)){
			cView.subReqsCount += user.subscriptionRequests.length;
			nodeSR.cNodes["sr-info-a"].innerHTML ="You have "
			+ cView.subReqsCount
			+ " subscription requests to review.";
			nodeSR.hidden = false;
		}
		if(!cView.subReqsCount)nodeSR.hidden = true;
	}
	,"setIcon": function (ico){
		var cView = this.cView;
		var linkFavicon = cView.doc.getElementById("favicon");
		if (linkFavicon) linkFavicon.parentNode.removeChild(linkFavicon);
		linkFavicon = cView.doc.createElement('link');
		linkFavicon.id = "favicon";
		linkFavicon.type = 'image/x-icon';
		linkFavicon.rel = 'shortcut icon';
		linkFavicon.href = gConfig.static + ico;
		cView.doc.getElementsByTagName('head')[0].appendChild(linkFavicon);
	}
	,"auth": function (check){
		var cView = document.cView;
		cView.Common.setIcon("favicon.ico");
		var nodeAuth = cView.doc.createElement("div");

		nodeAuth.className = "nodeAuth";
		nodeAuth.innerHTML ='<div id=auth-msg style="color:white; font-weight: bold;">&nbsp;</div><form action="javascript:" id=a-form><table><tr><td>Username</td><td><input name="username" id=a-user type="text"></td></tr><tr><td>Password</td><td><input name="password" id=a-pass type="password"></td></tr><tr><td>&nbsp;</td><td><input type="submit" value="Log in" style=" font-size: large; height: 2.5em; width: 100%; margin-top: 1em;" ></td></tr></table></form>';
		cView.doc.getElementsByTagName("body")[0].appendChild(nodeAuth);
		cView.doc.getElementById("a-form").addEventListener("submit",cView.Actions.getauth);

	}
	,"updateBlockList": function(list, username, add){
		var cView = document.cView;
		var id = cView.gUsers.byName[username].id;
		if(add){
			if ((typeof cView[list] === "undefined") || (cView[list] == null)) cView[list] = new Object();
			cView[list][id] = true;
		}else try{
			delete cView[list][id];
		}catch(e){};
		cView.localStorage.setItem(list, JSON.stringify(cView[list]));
	}
	,"setFrontUrl": function(url){
		return url.replace(/((beta|m)\.)?freefeed.net\/(?=.+)/,
			gConfig.front.slice(8));
	}
	,"loadGlobals":function(data, context){
		var cView = context.cView;
		if(context.ids)context.ids.forEach(function(id){
			cView.Common.addUser.call(context, context.logins[id].data.users);
		}); 

		if(data.attachments)data.attachments.forEach(function(attachment){ context.gAttachments[attachment.id] = attachment; });
		if(data.comments)data.comments.forEach(function(comment){ context.gComments[comment.id] = comment; });
		if(data.users)data.users.forEach(cView.Common.addUser, context);
		if(data.subscribers) data.subscribers.forEach(cView.Common.addUser, context);
		if(data.subscribers && data.subscriptions ){
			var subscribers = new Object();
			data.subscribers.forEach(function(sub){subscribers[sub.id]=sub;});
			data.subscriptions.forEach(function(sub){
				if(["Posts", "Directs"].indexOf(sub.name) != -1 ){
					context.gFeeds[sub.id] = { "user":context.gUsers[sub.user]
						,"direct": (sub.name == "Directs")
					}
				}
			});
		}
	}
	,"loadLogins":function(){
		var cView = this.cView;
		var Common = cView.Common;
		var frfToken = Common.getCookie(gConfig.tokenPrefix + "authToken");
		var txtgMe = cView.localStorage.getItem("logins");
		if (txtgMe){
			var logins = JSON.parse(txtgMe);
			if(Array.isArray(logins) && (typeof logins[0].domain === "string")){
				logins.forEach(function(login) {
					var context = cView.contexts[login.domain];
					if(typeof context === "unsefined") 
						context = new cView.Context(login.domain, cView);
					context.logins[login.id] = login;
					if(login.isMain == true)cView.Context.token = login.token;
					Common.addUser.call(context, login.data.user.users);
					Common.refreshLogin(login.id, context);
					login.p = new cView.Utils._Promise(
						function(resolve){resolve(login.data)}
					);
					setTimeout(function(){
						context.getWhoami(login.token)
						.then(function(res){
							login.data = res;
							Common.refreshLogin(login.id, context);
						});
					},300);

				});
				return true;
			} 
		}else if (frfToken){
			var context = new cView._Context(gConfig.frfDomain, cView);
			context.token = frfToken;
			context.p = context.getWhoami(frfToken);
			cView.contexts[gConfig.frfDomain] = context;
			return true;
		}else return false; 
	}
	,"saveLogins": function(){
		var cView = this.cView;
		cView.Common.setCookie(gConfig.tokenPrefix + "authToken", cView.contexts[gConfig.frfDomain].token);
		var logins = new Array();
		Object.keys(cView.contexts).forEach(function (domain){
			var context = cView.context[domain];
			Object.keys(context.logins).forEach(function(id){
				logins.push(context.logins[id]);			
			});
		});
		cView.localStorage.setItem("logins", JSON.stringify(logins));
	}
};
return _Common;
});
