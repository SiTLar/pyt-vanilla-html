define("Utils", [], function(){
function _Utils(view){
	this.cView = view;
};
_Utils.prototype = {
	constructor:_Utils
	/*source: http://stackoverflow.com/a/7516652 */
	,"relative_time": function(date) {
		var cView = this.cView;
	/*	if (!date_str) {return;}
		//date_str = $.trim(date_str);
		date_str = date_str.replace(/\.\d\d\d+/,""); // remove the milliseconds
		date_str = date_str.replace(/-/,"/").replace(/-/,"/"); //substitute - with /
		date_str = date_str.replace(/T/," ").replace(/Z/," UTC"); //remove T and substitute Z with UTC
		date_str = date_str.replace(/([\+\-]\d\d)\:?(\d\d)/," $1$2"); // +08:00 -> +0800*/
		var parsed_date = new Date(date);
		var relative_to = (arguments.length > 1) ? arguments[1] : new Date(); //defines relative to what ..default is now
		var delta = parseInt((relative_to.getTime()-parsed_date)/1000);
		delta=(delta<2)?2:delta;
		var r = '';
		if (delta < 60) {
			r = delta + ' seconds ago';
		} else if(delta < 120) {
			r = 'a minute ago';
		} else if(delta < (45*60)) {
			r = (parseInt(delta / 60, 10)).toString() + ' minutes ago';
		} else if(delta < (2*60*60)) {
			r = 'an hour ago';
		} else if(delta < (24*60*60)) {
			r = '' + (parseInt(delta / 3600, 10)).toString() + ' hours ago';
		} else if(delta < (48*60*60)) {
			r = 'a day ago';
		} else if (delta < (24*60*60*30)) {
			r = (parseInt(delta / 86400, 10)).toString() + ' days ago';
		} else{
			r = (parseInt(delta / 2592000, 10)).toString() + ' months ago';
		}
		return 'about ' + r;
	}
	/**********************************************/
	,"loadScript": function(script){
		var cView = this.cView;
		return new Promise(function(resolve,reject){
			var node = cView.doc.createElement("script");
			node.type = "text/javascript";
			node.onload = resolve;
			node.onerror = reject;
		//	node.async = "async";
			node.src = gConfig.static + script;
			cView.doc.getElementsByTagName("head")[0].appendChild(node);
		});
	}
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
		//var hostname = window.location.hostname.split(".");
		//hostname.reverse();
		var cookie = name
			+"=;expires=" + new Date(0).toUTCString()
			//+"; domain="+ hostname[1] + "." + hostname[0]
			+"; path=/";
		cView.doc.cookie = cookie; 
	}
	,"setChild": function (node,name, newNode){
		if(typeof node.cNodes === "undefined")
			node.cNodes = new Object();
		if(typeof node.cNodes[name] !== "undefined") 
			node.replaceChild(newNode, node.cNodes[name]);
		else node.appendChild(newNode);
		node.cNodes[name] = newNode;
	}
	,"addUser": function(user){
		var cView = this.cView;
		if (typeof cView.gUsers[user.id] !== "undefined" ) return;
		var className = "not-cView.Actions.my-link";
		var userTitle;
		var mode = cView.localStorage.getItem("display_name");
		if (mode == null) mode = "screen";
		switch(mode){
		case "screen":
			userTitle  = user.screenName;
			break;
		case "screen_u":
			if(user.screenName != user.username)
				userTitle  = user.screenName + " <div class=username>(" + user.username + ")</div>";
			else userTitle  = "<div class=username>"+user.username+"</div>";
			break;
		case "username":
			userTitle  = "<div class=username>"+user.username+"</div>";
		}
		if((typeof cView.gMe !== "undefined")&&(typeof cView.gMe.users !== "undefined"))
			className = (user.id==cView.gMe.users.id?"my-link":"not-cView.Actions.my-link");
		user.link = '<a class="'+className+'" href="' + gConfig.front+ user.username+'">'
		+ userTitle
		+"</a>";
		if(!user.profilePictureMediumUrl)user.profilePictureMediumUrl = gConfig.static+ "default-userpic-48.png";
		user.friend = false;
		user.subscriber = false;
		cView.gUsers[user.id] = user;
		cView.gUsers.byName[user.username] = user;
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
			cView.Utils.genNodes(template.children).forEach(function(victim){
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
			for(var idx = 0; idx <  node.childNodes.length; idx++){
				genCNodes(node.childNodes[idx], proto.childNodes[idx]);
				node.cNodes[node.childNodes[idx].className] = node.childNodes[idx];
			}
			if (typeof(proto.e) !== "undefined" )
				for(var evt in proto.e){
					var action = proto.e[evt];
					var name = action[0].substr(0,1)+"_"+action[1];
					cView.Events[name] = function(e){
						return cView[action[0]][action[1]](e);
					};
					node.addEventListener(evt,cView.Events[name] );
				}
		}
	}
	,"refreshgMe": function(){
		var cView = this.cView;
		cView.localStorage.setItem("gMe",JSON.stringify(cView.gMe));
		delete cView.gUsers[cView.gMe.users.id];
		this.addUser(cView.gMe.users);
		var links = cView.doc.getElementsByClassName("my-link");
		for(var idx = 0; idx< links.length; idx++)
			links[idx].outerHTML = cView.gMe.users.link;
		var nodeSR = cView.doc.getElementById("sr-info");
		if(!nodeSR)return;
		if(Array.isArray(cView.gMe.users.subscriptionRequests)){
			nodeSR.cNodes["sr-info-a"].innerHTML = "You have "
			+ cView.gMe.users.subscriptionRequests.length 
			+ " subscription requests to review.";
			nodeSR.hidden = false;
			cView.subReqsCount = cView.gMe.users.subscriptionRequests.length;
		}else{
			cView.subReqsCount = 0;
			nodeSR.hidden = true;
		}
	}
	,"addIcon": function (ico){
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
	,"setStorage": function (){
		var cView = this.cView;
		["localStorage", "sessionStorage"].forEach(function(storage){
			cView[storage] = new Object();
			["setItem", "getItem", "removeItem"].forEach(function(action){
				cView[storage][action] = function(){
					try{
						return window[storage][action].apply(window[storage],arguments);
					} catch(e){return null};
				}
			});
		});
	}
	,"auth": function (check){
		var cView = this.cView;
		var Utils = this;
		cView.token = Utils.getCookie(gConfig.tokenPrefix + "authToken");
		var txtgMe = null;
		txtgMe = cView.localStorage.getItem("gMe");
		if (txtgMe && cView.token){
			cView.gMe = JSON.parse(txtgMe);
			if (cView.gMe.users) {
				Utils.addUser(cView.gMe.users);
				var oReq = new XMLHttpRequest();
				oReq.open("get", gConfig.serverURL +"users/whoami", true);
				oReq.setRequestHeader("X-Authentication-Token", cView.token);
				oReq.onload = function(){
					if(oReq.status < 400) {
						cView.gMe = JSON.parse(oReq.response);
						if (cView.gMe.users) {
							Utils.refreshgMe();
							return true;
						}
					}
				}
				setTimeout(function (){oReq.send()},300);
				return true;
			}
		}

		var oReq = new XMLHttpRequest();
		if(cView.token){
			oReq.open("get", gConfig.serverURL +"users/whoami", false);
			oReq.setRequestHeader("X-Authentication-Token", cView.token);
			oReq.send();
			if(oReq.status < 400) {
				cView.gMe = JSON.parse(oReq.response);
				if (cView.gMe.users) {
					cView.Utils.refreshgMe();
					return true;
				}
			}
		}
		if (check !== true ){
			cView.Utils.addIcon("favicon.ico");
			var nodeAuth = cView.doc.createElement("div");

			nodeAuth.className = "nodeAuth";
			nodeAuth.innerHTML ='<div id=cView.Utils.auth-msg style="color:white; font-weight: bold;">&nbsp;</div><form action="javascript:" id=a-form><table><tr><td>Username</td><td><input name="username" id=a-user type="text"></td></tr><tr><td>Password</td><td><input name="password" id=a-pass type="password"></td></tr><tr><td>&nbsp;</td><td><input type="submit" value="Log in" style=" font-size: large; height: 2.5em; width: 100%; margin-top: 1em;" ></td></tr></table></form>';
			cView.doc.getElementsByTagName("body")[0].appendChild(nodeAuth);
			cView.doc.getElementById("a-form").addEventListener("submit",cView.Actions.getauth);
		}
		return false;

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
};
return _Utils;
});
