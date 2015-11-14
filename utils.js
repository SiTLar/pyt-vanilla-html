define("Utils", function(){
function _Utils(d, view){
	this.doc = d;
	this.cView = view;
};
_Utils.prototype = {
	constructor:_Utils
	/*source: http://stackoverflow.com/a/7516652 */
	,"relative_time": function(date) {
		var Utils = this;
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
		var Utils = this;
		return new Promise(function(resolve,reject){
			var node = Utils.doc.createElement("script");
			node.type = "text/javascript";
			node.onload = resolve;
			node.onerror = reject;
		//	node.async = "async";
			node.src = gConfig.static + script;
			Utils.doc.getElementsByTagName("head")[0].appendChild(node);
		});
	}
	,"setCookie": function(name, data){
		var Utils = this;
		Utils.doc.cookie = encodeURIComponent(name)+"="+data+";expires=" + new Date(Date.now()+3600000*24*365).toUTCString()+";secure";
	}
	,"getCookie": function(name){
		var Utils = this;
		var arrCookies = Utils.doc.cookie.split(";");
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
		var Utils = this;
		Utils.doc.cookie = name+"=;expires=" + new Date(0).toUTCString();
	}
	,"addUser": function(user){
		var Utils = this;
		if (typeof Utils.cView.gUsers[user.id] !== "undefined" ) return;
		var className = "not-my-link";
		var userTitle;
		var mode = Utils.cView.localStorage.getItem("display_name");
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
		if((typeof Utils.cView.gMe !== "undefined")&&(typeof Utils.cView.gMe.users !== "undefined"))
			className = (user.id==Utils.cView.gMe.users.id?"my-link":"not-my-link");
		user.link = '<a class="'+className+'" href="' + gConfig.front+ user.username+'">'
		+ userTitle
		+"</a>";
		if(!user.profilePictureMediumUrl)user.profilePictureMediumUrl = gConfig.static+ "default-userpic-48.png";
		user.friend = false;
		user.subscriber = false;
		Utils.cView.gUsers[user.id] = user;
		Utils.cView.gUsers.byName[user.username] = user;
	}
	,"genNodes": function (templates){
		var Utils = this;
		var nodes = new Array();
		//oTemplates = JSON.parse(templates);
		templates.forEach(function(template) {
			if (!template.t)template.t = "div";
			var node = Utils.doc.createElement(template.t);
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
	}
	,"refreshgMe": function(){
		var Utils = this;
		Utils.cView.localStorage.setItem("gMe",JSON.stringify(Utils.cView.gMe));
		delete Utils.cView.gUsers[Utils.cView.gMe.users.id];
		this.addUser(Utils.cView.gMe.users);
		var links = Utils.doc.getElementsByClassName("my-link");
		for(var idx = 0; idx< links.length; idx++)
			links[idx].outerHTML = Utils.cView.gMe.users.link;
		var nodeSR = Utils.doc.getElementById("sr-info");
		if(!nodeSR)return;
		if(Array.isArray(Utils.cView.gMe.users.subscriptionRequests)){
			nodeSR.cNodes["sr-info-a"].innerHTML = "You have "
			+ Utils.cView.gMe.users.subscriptionRequests.length 
			+ " subscription requests to review.";
			nodeSR.hidden = false;
			Utils.cView.subReqsCount = Utils.cView.gMe.users.subscriptionRequests.length;
		}else{
			Utils.cView.subReqsCount = 0;
			nodeSR.hidden = true;
		}
	}
	,"addIcon": function (ico){
		var Utils = this;
		var linkFavicon = Utils.doc.getElementById("favicon");
		if (linkFavicon) linkFavicon.parentNode.removeChild(linkFavicon);
		linkFavicon = Utils.doc.createElement('link');
		linkFavicon.id = "favicon";
		linkFavicon.type = 'image/x-icon';
		linkFavicon.rel = 'shortcut icon';
		linkFavicon.href = gConfig.static + ico;
		Utils.doc.getElementsByTagName('head')[0].appendChild(linkFavicon);
	}
	,"setStorage": function (){
		var Utils = this;
		["localStorage", "sessionStorage"].forEach(function(storage){
			Utils.cView[storage] = new Object();
			["setItem", "getItem", "removeItem"].forEach(function(action){
				Utils.cView[storage][action] = function(){
					try{
						return window[storage][action].apply(window[storage],arguments);
					} catch(e){return null};
				}
			});
		});
	}
	,"auth": function (check){
		var Utils = this;
		Utils.cView.token = Utils.getCookie(gConfig.tokenPrefix + "authToken");
		var txtgMe = null;
		txtgMe = Utils.cView.localStorage.getItem("gMe");
		if (txtgMe && Utils.cView.token){
			Utils.cView.gMe = JSON.parse(txtgMe);
			if (Utils.cView.gMe.users) {
				Utils.addUser(Utils.cView.gMe.users);
				var oReq = new XMLHttpRequest();
				oReq.open("get", gConfig.serverURL +"users/whoami", true);
				oReq.setRequestHeader("X-Authentication-Token", Utils.cView.token);
				oReq.onload = function(){
					if(oReq.status < 400) {
						Utils.cView.gMe = JSON.parse(oReq.response);
						if (Utils.cView.gMe.users) {
							Utils.refreshUtils.cView.gMe();
							return true;
						}
					}
				}
				setTimeout(function (){oReq.send()},300);
				return true;
			}
		}

		var oReq = new XMLHttpRequest();
		if(Utils.cView.token){
			oReq.open("get", gConfig.serverURL +"users/whoami", false);
			oReq.setRequestHeader("X-Authentication-Token", Utils.cView.token);
			oReq.send();
			if(oReq.status < 400) {
				Utils.cView.gMe = JSON.parse(oReq.response);
				if (Utils.cView.gMe.users) {
					Utils.refreshUtils.cView.gMe();
					return true;
				}
			}
		}
		if (check !== true ){
			Utils.addIcon("favicon.ico");
			var nodeAuth = Utils.doc.createElement("div");

			nodeAuth.className = Utils.gNodes["nodeAuth"].cloneAll();
			nodeAuth.cNodes["msg-tab"].innerHTML = '<table><tr><td>Username</td><td><input name="username" id=a-user type="text"></td></tr><tr><td>Password</td><td><input name="password" id=a-pass type="password"></td></tr></table>';
			nodeAuth.addEvntListener();

			//'<div id=auth-msg style="color:white; font-weight: bold;">&nbsp;</div><form action="javascript:" onsubmit=Utils.getauth(this)><table><tr><td>Username</td><td><input name="username" id=a-user type="text"></td></tr><tr><td>Password</td><td><input name="password" id=a-pass type="password"></td></tr><tr><td>&nbsp;</td><td><input type="submit" value="Log in" style=" font-size: large; height: 2.5em; width: 100%; margin-top: 1em;" ></td></tr></table></form>';
			Utils.doc.getElementsByTagName("body")[0].appendChild(nodeAuth);
		}
		return false;

	}
};
return _Utils;
});
