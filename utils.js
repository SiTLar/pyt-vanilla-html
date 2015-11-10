define("Utils", function(){return {

	/*source: http://stackoverflow.com/a/7516652 */
	"relative_time": function(date) {
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
		return new Promise(function(resolve,reject){
			var node = document.createElement("script");
			node.type = "text/javascript";
			node.onload = resolve;
			node.onerror = reject;
		//	node.async = "async";
			node.src = gConfig.static + script;
			document.getElementsByTagName("head")[0].appendChild(node);
		});
	}
	,"setCookie": function(name, data){
		document.cookie = encodeURIComponent(name)+"="+data+";expires=" + new Date(Date.now()+3600000*24*365).toUTCString()+";secure";
	}
	,"getCookie": function(name){
		var arrCookies = document.cookie.split(";");
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
		document.cookie = name+"=;expires=" + new Date(0).toUTCString();
	}
	,"addUser": function(user){
		if (typeof gUsers[user.id] !== "undefined" ) return;
		var className = "not-my-link";
		if((typeof gMe !== "undefined")
			&&(typeof gMe.users !== "undefined")
			&&(user.id==gMe.users.id))
			className = "my-link";
		user.link = '<a class="'+className +'" href="' + gConfig.front+ user.username+'">'+ user.screenName+"</a>";
		if(!user.profilePictureMediumUrl)user.profilePictureMediumUrl = gConfig.static+ "default-userpic-48.png";
		user.friend = false;
		user.subscriber = false;
		gUsers[user.id] = user;
		gUsers.byName[user.username] = user;
	}

};});
