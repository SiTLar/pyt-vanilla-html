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
		if (typeof context.gUsers[user.id] !== "undefined" ){
			var localUser = context.gUsers[user.id];
			Object.keys(user).forEach(function(key){
				 if (user[key] != "")
					 localUser[key] = user[key];
			});
			return localUser;
		}
		var className = "not-my-link";
		if (typeof user.screenName === "undefined")
			user.screenName = user.username;
		(function(screenName){
		user.screenName = screenName.replace(/&/g,"&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
		})(user.screenName);
		user.domain = context.domain;
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
		user.link = '<a class="'+className
		+'" href="' + gConfig.front+"as/"+ context.domain + "/"+ user.username+'">'
		+ user.title
		+"</a>";
		if((typeof user.profilePictureMediumUrl === "undefined")
		||(user.profilePictureMediumUrl == ""))
			user.profilePictureMediumUrl = gConfig.static+ "default-userpic-48.png";
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
			if(template.cl)template.cl.forEach(function(c){node.classList.add(c);});
			if(template.children)
			cView.Common.genNodes(template.children).forEach(function(victim){
				node.appendChild(victim);
			});
			if(template.txt) node.innerHTML = template.txt;
			if(template.e) node.e = template.e;
			var dummy = cView.doc.createElement("span");
			if(template.p) for( var p in template.p){
				dummy.innerHTML = template.p[p];
				try{node[p] = dummy.textContent;}
				catch(e){};
			}
			if(template.style) for( var s in template.style){
				try{node.style[s] = template.style[s];}
				catch(e){};
			}
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
			for(var idx = 0; idx <  node.children.length; idx++){
				genCNodes(node.children[idx], proto.children[idx]);
				if(typeof node.children[idx].classList !== "undefined")
					node.cNodes[node.children[idx].classList[0]] = node.children[idx];
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
		var user = context.logins[id].data.users;
		delete context.gUsers[id];
		cView.Common.addUser.call(context, user);
		var links = cView.doc.getElementsByClassName("my-link-" + context.domain+ "-" + id);
		for(var idx = 0; idx< links.length; idx++)
			links[idx].outerHTML = user.link;
		var login = context.logins[id].data;
		if(typeof login.subscribers !== "undefined")
			Object.keys(login.subscribers).forEach(function(id){
				cView.Common.addUser.call(context, login.subscribers[id]);
			});
		
		login.oFriends = new Object();
		var oSubscriptions = new Object();
		if(typeof login.subscriptions !== "undefined" ){
			login.subscriptions.forEach(function(sub){
				if(sub.name == "Posts"){
					oSubscriptions[sub.id] = sub.user;
				}
			});
		}
		
		if (typeof user.subscriptions !== "undefined"){
			user.subscriptions.forEach(function(subid){
				var userid = oSubscriptions[subid];
				login.oFriends[userid] = true;
			})
		}
		if ((typeof user.subscribers !== "undefined") 
		&& (typeof user.subscriptions !== "undefined")){
			login.subscribers.forEach(cView.Common.addUser,context);
			user.subscribers.forEach(function(sub){
				cView.Common.addUser.call(context, sub);
				context.gUsers[sub.id].subscriber = true;
			});
			user.subscriptions.forEach(function(subid){
				var userid = oSubscriptions[subid];
				if (typeof userid !== "undefined") {
					if (typeof context.gUsers[userid] !== "undefined") 
						context.gUsers[userid].friend = true;
				}
			});
		}
		cView.Common.saveLogins();
		var nodesMenu = document.getElementsByClassName("controls-anon");
		if(nodesMenu.length){
			var nodeMenu = nodesMenu[0];
			cView.Utils.setChild(
				nodeMenu.parentNode
				,"controls"
				,cView.gNodes["controls-login"].cloneAll()
			);
		}
		var nodeSR = cView.doc.getElementById("sr-info");
		window.dispatchEvent(new CustomEvent("whoamiUpdated"));
		if (!nodeSR) return;
		cView.Drawer.updateReqs();
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
		nodeAuth.innerHTML ='<div id=auth-msg style="color:red; font-weight: bold;">&nbsp;</div>'
		+'<div style="text-align:center;margin-bottom:.5em;"><h3>'+gConfig.leadDomain +'</h3></div>'
		+'<div>' + gConfig.domains[gConfig.leadDomain].msg + '</div>'
		+'<form action="javascript:" id=a-form><table><tr><td>Username</td><td><input name="username" id=a-user type="text"></td></tr><tr><td>Password</td><td><input name="password" id=a-pass type="password"></td></tr><tr><td>&nbsp;</td><td><input type="submit" value="Log in" style=" font-size: large; height: 2.5em; width: 100%; margin-top: 1em;" ></td></tr></table></form>';
		cView.doc.getElementsByTagName("body")[0].appendChild(nodeAuth);
		cView.doc.getElementById("a-form").addEventListener("submit",cView.Actions.getauth);

	}
	,"updateBlockList": function(tag, domain, value, add){
		var cView = document.cView;
		if (typeof tag === "undefined") 
			return cView.localStorage.setItem("blocks", JSON.stringify(cView.blocks));
		var context = cView.contexts[domain];
		var list = cView.blocks[tag][domain];
		var fArray = ["blockStrings"].indexOf(tag) != -1; 
			
		if(add){
			if ((typeof list === "undefined") || (list == null)) 
				fArray?(list = new Array()):(list = new Object()) ;
			fArray?(list.push(value)):(list[value] = context.gUsers[value].username);
		}else try{
			if (fArray){
				var idx = list.indexOf(value);
				if(idx != -1)list.splice(idx,1);
			}else delete list[value];
		}catch(e){};
		cView.blocks[tag][domain] = list;
		cView.localStorage.setItem("blocks", JSON.stringify(cView.blocks));
	}
	,"setFrontUrl": function(url){
		Object.keys(gConfig.domains).forEach(function(domain){
			url = url.replace(
				new RegExp("^(.*:\/\/)?("
					+gConfig.domains[domain].fronts.join("|")
					+")\/(?!(as|settings|about|"
					+gConfig.domains[domain].urlSkip.join("|")
					+")(\/|$))"
				)
				,gConfig.front+"as/"+domain+"/"
			);
		});
		return url;
	}
	,"urlsToCanonical": function(text){
		Object.keys(gConfig.domains).forEach(function(domain){
			text = text.replace(new RegExp(gConfig.front.slice(8)+"as/"+domain)
				,gConfig.domains[domain].front
			);
		});
		return text;
	}
	,"loadGlobals":function(data, context){
		var cView = context.cView;
		context.ids.forEach(function(id){
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
					var user = context.gUsers[sub.user];
					var isPrivate = (sub.mayNotBePublic == true)?true:(user.isPrivate == "1");
					context.gFeeds[sub.id] = { 
						"user":user
						,"direct": (sub.name == "Directs")
						,"isPrivate": isPrivate
					}
				}
			});
		}
	}
	,"loadLogins":function(){
		var cView = this.cView;
		var Common = cView.Common;
		Object.keys(cView.contexts).forEach(function(domain){
			var context = cView.contexts[domain];
			var token = Common.getCookie(gConfig.domains[domain].tokenPrefix +"authToken");
			if(token){
				context.token = token;
				context.pending.push(token);
			}
		});
		var txtgMe = cView.localStorage.getItem("logins");
		if (txtgMe){
			try{
				var logins = JSON.parse(txtgMe);
				logins.forEach(function(login) {
					var domain = login.domain;
					var context = cView.contexts[domain];
					if(typeof context === "undefined") return;
					var pPos = context.pending.indexOf(login.token);
					if( pPos != -1)context.pending.splice(pPos,1);
					if(login.isMain == true)context.token = login.token;
					if (typeof login.data === "undefined"){
						context.pending.push(login.token);
						return;
					}
					context.logins[login.data.users.id] = login;
					Common.addUser.call(context, login.data.users);
					Common.refreshLogin(login.data.users.id, context);
					setTimeout(function(){ context.getWhoami(login.token);},300);

				});
			}catch(e){
				console.log(e);
				cView.localStorage.removeItem("logins");
			} 
		}
		Object.keys(cView.contexts).forEach(function(domain){
			var context = cView.contexts[domain];
			if(!context.token){
				if(context.ids.length){
					context.token = context.logins[context.ids[0]].token;
				}else if (context.pending.length) 
					context.token = context.pending[0]; 
			}
			context.p = cView.Utils._Promise.all(
				context.pending.map(function(token){
					return context.getWhoami(token);
				})
			);
		});
	}
	,"saveLogins": function(){
		var cView = this.cView;
		var logins = new Array();
		Object.keys(cView.contexts).forEach(function (domain){
			var context = cView.contexts[domain];
			if(!context.token){
				cView.Common.deleteCookie(gConfig.domains[domain].tokenPrefix +"authToken",context.token );
				return;
			}
			cView.Common.setCookie(gConfig.domains[domain].tokenPrefix +"authToken",context.token );
			Object.keys(context.logins).forEach(function(id){ 
				context.logins[id].isMain = (context.logins[id].token == context.token);
				logins.push(context.logins[id]);
			});
		});
		cView.localStorage.setItem("logins", JSON.stringify(logins));
	}
	,"calcPostScore":function(post){
		var cView = this.cView;
		var context = cView.contexts[post.domain];
		if (post.domain == gConfig.leadDomain) return 100;
		else return 0;

	}
	,"markMetaMenu": function(nodePost){
		var host = nodePost.parentNode;
		if ((nodePost.hidden != true) || (host.className != "metapost"))
			return;
		var menuItems = host.getElementsByClassName("reflect-menu-item");
		for(var idx = 0; idx < menuItems.length; idx++)
			if (menuItems[idx].cNodes["victim-id"].value == nodePost.id)
				menuItems[idx].cNodes["star"].hidden = false;

	}
	,"metapost":function (posts){
		var updatedAt = posts[0].updatedAt;
		var dups = new Array();
		var hidden = true;
		posts.forEach(function(post){
			if (updatedAt < post.updatedAt)updatedAt = post.updatedAt;
			if (post.isHidden !== true) post.isHidden = false;
			if(!dups.some(function(dup){ return (dup.domain == post.domain)&&(dup.id == post.id);}))
				dups.push(post);
			hidden = hidden && post.isHidden;
		});
		return {"type": "metapost"
			,"updatedAt":updatedAt
			,"dups":dups
			,"sign":posts[0].sign
			,"isHidden":hidden
			,set "idx"(idx){
				this.index = idx;
				this.dups.forEach(function(dup){dup.idx = idx;});
			}
			,get "idx"(){
				return this.index;
			}
		};
	}
	,"chkBlocked":function(post){
		var cView = this.cView;
		var context = cView.contexts[post.domain];
		var listBlockByUsr = cView.blocks.blockPosts[context.domain];
		var listBlockByStr = cView.blocks.blockStrings[context.domain];
		if(cView.noBlocks ) return false;

		if(cView.blockLonely 
			&& !(Array.isArray(post.comments) && post.comments.length)
			&& !(Array.isArray(post.likes) && post.likes.length)
			&& (context.ids.indexOf(post.createdBy) == -1)
		) return true;

		if( ( typeof listBlockByUsr !== "undefined")
			&& ( listBlockByUsr != null)
			&& (listBlockByUsr[post.createdBy]
				|| post.postedTo.some(function (dest){
					var id = context.gFeeds[dest].user.id
					return listBlockByUsr[id] && (cView.origin != id);
				})
			)
		) return true;

		if ( ( typeof listBlockByStr!== "undefined")
			&& ( listBlockByStr != null)
			&& listBlockByStr.some(function(str){
				return post.body.toLowerCase().indexOf(str.toLowerCase()) != -1;
			})
		) return true;

		return false;
			
		
	}
};
return _Common;
});
