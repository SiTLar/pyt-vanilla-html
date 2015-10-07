/*source: http://stackoverflow.com/a/7516652 */
function relative_time(date) {
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
};
function setCookie(name, data){
	var hostname = window.location.hostname.split(".");
	hostname.reverse();

	document.cookie = name
		+"="+data
		+";expires=" + new Date(Date.now()+3600000*24*365).toUTCString()
		+"; domain="+ hostname[1] + "." + hostname[0] 
		+"; path=/"
		+";secure";
}
function getCookie(name){
	var arrCookies = document.cookie.split(";");
	var res;
	arrCookies.some(function(c){
		var cookie = c.split("=");
		if(cookie[0].trim() == name ){
			res = cookie[1];
			return true;
		}
	});
	return res;
}
function deleteCookie(name){
	var hostname = window.location.hostname.split(".");
	hostname.reverse();
	var cookie = name
		+"=;expires=" + new Date(0).toUTCString()
		+"; domain="+ hostname[1] + "." + hostname[0]
		+"; path=/";
	console.log(cookie);
	document.cookie = cookie;
}
function setChild(node,name, newNode){
	if(typeof node.cNodes === "undefined")
		node.cNodes = new Object();
	if(typeof node.cNodes[name] !== "undefined") 
		node.replaceChild(newNode, node.cNodes[name]);
	else node.appendChild(newNode);
	node.cNodes[name] = newNode;
}
